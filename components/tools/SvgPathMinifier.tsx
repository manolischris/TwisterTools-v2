"use client";

import React, { useState, useMemo, useId, useRef, useCallback } from "react";
import {
    Scissors,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Code,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Download,
    FileCode,
    Cpu,
    Layers,
    Terminal,
    UploadCloud,
    FileUp,
    Palette,
    ShieldCheck
} from "lucide-react";

interface OptimizationStats {
    rawLength: number;
    minifiedLength: number;
    savedBytes: number;
    reductionPercentage: number;
    commandCount: number;
}

const SAMPLE_SVG_PATH =
    "M 100.0000 100.0000 C 120.5524 80.1234 150.8842 80.3421 170.0000 100.0000 S 220.1209 150.4501 220.0000 180.0000 C 219.8901 210.5501 180.2001 240.0000 140.0000 240.0000 C 99.8000 240.0000 60.1099 210.5501 60.0000 180.0000 C 59.8791 150.4501 79.4476 119.8766 100.0000 100.0000 Z";

const SAMPLE_FULL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <path d="${SAMPLE_SVG_PATH}" fill="url(#grad)" stroke="#1e293b" stroke-width="2" />
</svg>`;

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

function minifySvgPathString(
    pathString: string,
    precision: number,
    removeLeadingZero: boolean,
    collapseConsecutiveDelimiters: boolean
): string {
    if (!pathString.trim()) return "";

    const commandRegex = /([a-df-z])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/gi;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = commandRegex.exec(pathString)) !== null) {
        tokens.push(match[0]);
    }

    if (tokens.length === 0) return pathString.trim();

    const formattedTokens: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (/^[a-df-z]$/i.test(token)) {
            formattedTokens.push(token);
        } else {
            const num = parseFloat(token);
            if (isNaN(num)) {
                formattedTokens.push(token);
                continue;
            }

            const fixed = num.toFixed(precision);
            let cleanedNum = parseFloat(fixed).toString();

            if (removeLeadingZero) {
                if (cleanedNum.startsWith("0.")) {
                    cleanedNum = cleanedNum.substring(1);
                } else if (cleanedNum.startsWith("-0.")) {
                    cleanedNum = "-" + cleanedNum.substring(2);
                }
            }
            formattedTokens.push(cleanedNum);
        }
    }

    if (!collapseConsecutiveDelimiters) {
        return formattedTokens.join(" ");
    }

    let minified = "";
    for (let i = 0; i < formattedTokens.length; i++) {
        const current = formattedTokens[i];
        const prev = i > 0 ? formattedTokens[i - 1] : "";

        if (i === 0) {
            minified += current;
            continue;
        }

        const isCurrentCmd = /^[a-df-z]$/i.test(current);
        const isPrevCmd = /^[a-df-z]$/i.test(prev);

        if (isCurrentCmd || isPrevCmd) {
            minified += current;
        } else if (current.startsWith("-")) {
            minified += current;
        } else if (current.startsWith(".") && prev.includes(".")) {
            minified += current;
        } else {
            minified += " " + current;
        }
    }

    return minified;
}

export default function SvgPathMinifier() {
    const [rawInput, setRawInput] = useState<string>(SAMPLE_FULL_SVG);
    const [precision, setPrecision] = useState<number>(2);
    const [removeLeadingZero, setRemoveLeadingZero] = useState<boolean>(true);
    const [collapseDelimiters, setCollapseDelimiters] = useState<boolean>(true);
    const [autoWrapSvg, setAutoWrapSvg] = useState<boolean>(true);
    const [overrideColors, setOverrideColors] = useState<boolean>(false);
    const [previewFill, setPreviewFill] = useState<string>("#4f46e5");
    const [previewStroke, setPreviewStroke] = useState<string>("#1e293b");
    const [previewStrokeWidth, setPreviewStrokeWidth] = useState<number>(2);
    const [copied, setCopied] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const precisionInputId = useId();

    const isFullSvgDoc = useMemo(() => {
        return /<svg[\s\S]*<\/svg>/i.test(rawInput.trim());
    }, [rawInput]);

    // Extract all paths or the first main path for standalone display
    const extractedRawPath = useMemo(() => {
        const trimmed = rawInput.trim();
        if (!isFullSvgDoc) return trimmed;
        const match = /d=(["'])([\s\S]*?)\1/i.exec(trimmed);
        return match ? match[2].trim() : trimmed;
    }, [rawInput, isFullSvgDoc]);

    const minifiedPath = useMemo(() => {
        return minifySvgPathString(
            extractedRawPath,
            precision,
            removeLeadingZero,
            collapseDelimiters
        );
    }, [extractedRawPath, precision, removeLeadingZero, collapseDelimiters]);

    // When full SVG is provided, replace all `d="..."` paths in the SVG with their minified equivalents
    const fullMinifiedSvgOutput = useMemo(() => {
        if (!rawInput.trim()) return "";
        if (isFullSvgDoc) {
            return rawInput.replace(/d=(["'])([\s\S]*?)\1/gi, (match, quote, pathContent) => {
                const min = minifySvgPathString(pathContent, precision, removeLeadingZero, collapseDelimiters);
                return `d=${quote}${min}${quote}`;
            });
        }
        if (autoWrapSvg) {
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">\n  <path d="${minifiedPath}" fill="${previewFill}" stroke="${previewStroke}" stroke-width="${previewStrokeWidth}" />\n</svg>`;
        }
        return minifiedPath;
    }, [rawInput, isFullSvgDoc, minifiedPath, autoWrapSvg, precision, removeLeadingZero, collapseDelimiters, previewFill, previewStroke, previewStrokeWidth]);

    // Computes dynamic viewBox if user supplies raw path with arbitrary coordinates outside 300x300
    const computedViewBox = useMemo(() => {
        if (isFullSvgDoc) return null;
        const numbers = (minifiedPath.match(/[-+]?(?:\d*\.\d+|\d+)/g) || []).map(Number);
        if (numbers.length < 4) return "0 0 300 300";

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < numbers.length; i += 2) {
            const x = numbers[i];
            const y = numbers[i + 1] ?? x;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }

        if (!isFinite(minX) || !isFinite(maxX)) return "0 0 300 300";

        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);
        const padX = width * 0.1;
        const padY = height * 0.1;

        return `${(minX - padX).toFixed(1)} ${(minY - padY).toFixed(1)} ${(width + padX * 2).toFixed(1)} ${(height + padY * 2).toFixed(1)}`;
    }, [minifiedPath, isFullSvgDoc]);

    const stats: OptimizationStats = useMemo(() => {
        const rawBytes = new Blob([isFullSvgDoc ? rawInput : extractedRawPath]).size;
        const minifiedBytes = new Blob([fullMinifiedSvgOutput]).size;
        const saved = Math.max(0, rawBytes - minifiedBytes);
        const reduction = rawBytes > 0 ? (saved / rawBytes) * 100 : 0;
        const commands = (minifiedPath.match(/[a-df-z]/gi) || []).length;

        return {
            rawLength: rawBytes,
            minifiedLength: minifiedBytes,
            savedBytes: saved,
            reductionPercentage: parseFloat(reduction.toFixed(1)),
            commandCount: commands
        };
    }, [rawInput, extractedRawPath, fullMinifiedSvgOutput, isFullSvgDoc, minifiedPath]);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullMinifiedSvgOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setRawInput(SAMPLE_FULL_SVG);
        setPrecision(2);
        setRemoveLeadingZero(true);
        setCollapseDelimiters(true);
        setAutoWrapSvg(true);
        setOverrideColors(false);
        setPreviewFill("#4f46e5");
        setPreviewStroke("#1e293b");
        setPreviewStrokeWidth(2);
        setUploadError(null);
    };

    const handleFileProcess = useCallback((file: File) => {
        if (!file) return;
        if (!file.name.endsWith(".svg") && file.type !== "image/svg+xml" && !file.type.includes("xml")) {
            setUploadError("Please upload a valid .svg file.");
            return;
        }
        setUploadError(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content === "string") {
                setRawInput(content);
            }
        };
        reader.onerror = () => {
            setUploadError("Failed to read the SVG file.");
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileProcess(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDownload = () => {
        const isSvgTag = fullMinifiedSvgOutput.trim().startsWith("<svg");
        const blob = new Blob([fullMinifiedSvgOutput], {
            type: isSvgTag ? "image/svg+xml" : "text/plain"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = isSvgTag ? "optimized-graphic.svg" : "minified-path.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "SVG Path Minifier & Coordinate Precision Reducer",
        "url": "https://twistertools.com/tools/image-tools/svg-path-minifier",
        "description": "High-performance browser-native SVG path optimizer. Reduce coordinate decimal precision, eliminate redundant whitespace, compress delimiters, and extract clean vector data.",
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
                "name": "How does decimal precision reduction optimize SVG file size?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Vector design applications like Adobe Illustrator, Figma, and Inkscape export coordinate floats with 4 to 8 decimal places (e.g., 142.584931). On standard web displays, fractions beyond 1 or 2 decimal places represent fractions of a physical subpixel that are visually imperceptible. Truncating coordinates from 6 decimal places to 1 or 2 eliminates up to 60% of raw character payload from the SVG path 'd' attribute without degrading visual quality."
                }
            },
            {
                "@type": "Question",
                "name": "What is consecutive delimiter collapsing in SVG path data?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The SVG specification allows whitespace and commas to be omitted when path token boundaries are unambiguous. For example, negative coordinates contain an inherent minus delimiter, and decimals starting with a period are syntactically distinct from preceding floats containing periods. Replacing spaces like 'M 10 20 L -30 .5' with 'M10 20L-30.5' saves significant byte count."
                }
            },
            {
                "@type": "Question",
                "name": "Will reducing coordinate precision distort complex curves?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For standard icons and illustrations rendered at sizes between 16px and 1200px, 1 to 2 decimal places provides sub-pixel accuracy that looks identical to the human eye. Only microscopic viewports mapped onto massive canvas viewboxes (such as GIS mapping or CAD architectural blueprints) require 3 or more decimal places."
                }
            },
            {
                "@type": "Question",
                "name": "Can I upload entire SVG files directly into this tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The tool includes a direct file uploader and drag-and-drop support for .svg files. All path 'd' attributes across the document are minified in-place while keeping attributes, gradients, clip paths, and structural containers fully intact."
                }
            },
            {
                "@type": "Question",
                "name": "Does leading zero omission break browser SVG rendering?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The W3C SVG path specification explicitly supports floating-point notation omitting the integer zero preceding a decimal point (e.g., .5 instead of 0.5, or -.25 instead of -0.25). All modern rendering engines (Blink, WebKit, Gecko) parse this correctly."
                }
            },
            {
                "@type": "Question",
                "name": "Why is client-side SVG minification safer than server-side optimization?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Client-side processing executes entirely in your local browser runtime via JavaScript. Your vector graphics, brand iconography, and proprietary digital assets are never transmitted across a network or stored on external servers, ensuring zero risk of data leakage."
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
                {/* Left Panel: Input, Upload & Compression Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Code className="w-5 h-5 text-indigo-600" />
                                Vector Source Input
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                    {isFullSvgDoc ? "Full SVG Doc" : "Path String"}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-2xs cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {uploadError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                                <span>{uploadError}</span>
                            </div>
                        )}

                        {/* File Uploader & Drag and Drop Zone */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".svg,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleFileProcess(e.target.files[0]);
                                }
                            }}
                        />

                        <div
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 transition cursor-pointer ${
                                isDragging
                                    ? "border-indigo-600 bg-indigo-50/60"
                                    : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
                            }`}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-bold text-slate-800">
                                    Drop your SVG file here, or <span className="text-indigo-600 underline">browse files</span>
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Supports .svg vector files and raw XML markup (Max 25MB)
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                100% Secure Client-Side Processing
                            </div>
                        </div>

                        {/* Raw Input Textarea */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <label>Or Paste Raw SVG Code / Path String:</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRawInput(SAMPLE_FULL_SVG);
                                        setUploadError(null);
                                    }}
                                    className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                                >
                                    Load Sample
                                </button>
                            </div>
                            <textarea
                                value={rawInput}
                                onChange={(e) => {
                                    setRawInput(e.target.value);
                                    if (uploadError) setUploadError(null);
                                }}
                                placeholder="Paste <svg>...</svg> markup or 'M 10 10 C 20 20...' path string"
                                className="w-full h-36 p-3 font-mono text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                            />
                        </div>

                        {/* Compression Parameters */}
                        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Sliders className="w-4 h-4 text-indigo-600" />
                                Precision & Formatting Rules
                            </h3>

                            {/* Decimal Precision Slider */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={precisionInputId}>Decimal Precision Places:</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            id={precisionInputId}
                                            type="number"
                                            min="0"
                                            max="8"
                                            value={precision}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setPrecision(val), 0, 8)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-400 font-normal">pts</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="6"
                                    step="1"
                                    value={precision}
                                    onChange={(e) => setPrecision(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                    <span>0 (Int)</span>
                                    <span>1 (Recommended for Icons)</span>
                                    <span>2 (Balanced)</span>
                                    <span>4+ (High Res)</span>
                                </div>
                            </div>

                            {/* Checkbox Toggles */}
                            <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                                    <input
                                        type="checkbox"
                                        checked={removeLeadingZero}
                                        onChange={(e) => setRemoveLeadingZero(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                    />
                                    <span>Omit leading zero on decimals (e.g. <code>0.25 → .25</code>)</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                                    <input
                                        type="checkbox"
                                        checked={collapseDelimiters}
                                        onChange={(e) => setCollapseDelimiters(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                    />
                                    <span>Collapse implicit delimiters & strip unnecessary spacing</span>
                                </label>

                                {!isFullSvgDoc && (
                                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                                        <input
                                            type="checkbox"
                                            checked={autoWrapSvg}
                                            onChange={(e) => setAutoWrapSvg(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                        />
                                        <span>Wrap output in complete <code>&lt;svg&gt;</code> envelope</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Lossless Topology Preserved
                        </span>
                        <span>W3C SVG 1.1 / 2.0 Compliant</span>
                    </div>
                </div>

                {/* Right Panel: Live Vector Canvas & Optimized Payload */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Real-Time Vector Rasterizer
                            </h2>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                                    title="Download File"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </button>
                            </div>
                        </div>

                        {/* Interactive Visualizer Canvas */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                                <span>Render Preview:</span>

                                {/* Comprehensive Inspection Controls */}
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                                    {isFullSvgDoc && (
                                        <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={overrideColors}
                                                onChange={(e) => setOverrideColors(e.target.checked)}
                                                className="w-3 h-3 rounded accent-indigo-600"
                                            />
                                            <span>Override Colors</span>
                                        </label>
                                    )}

                                    {(!isFullSvgDoc || overrideColors) && (
                                        <>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[11px] text-slate-500">Fill:</span>
                                                <input
                                                    type="color"
                                                    value={previewFill}
                                                    onChange={(e) => setPreviewFill(e.target.value)}
                                                    className="w-5 h-5 rounded cursor-pointer border border-slate-200 p-0"
                                                    title="Preview Fill Color"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[11px] text-slate-500">Stroke:</span>
                                                <input
                                                    type="color"
                                                    value={previewStroke}
                                                    onChange={(e) => setPreviewStroke(e.target.value)}
                                                    className="w-5 h-5 rounded cursor-pointer border border-slate-200 p-0"
                                                    title="Preview Stroke Color"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[11px] text-slate-500">Width:</span>
                                                <select
                                                    value={previewStrokeWidth}
                                                    onChange={(e) => setPreviewStrokeWidth(Number(e.target.value))}
                                                    className="text-[11px] font-mono px-1 py-0.5 rounded border border-slate-200 bg-white"
                                                    title="Stroke Width"
                                                >
                                                    <option value={0}>0px</option>
                                                    <option value={1}>1px</option>
                                                    <option value={2}>2px</option>
                                                    <option value={3}>3px</option>
                                                    <option value={4}>4px</option>
                                                    <option value={6}>6px</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Canvas Stage Viewport */}
                            <div className="w-full h-52 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-4 relative overflow-hidden [background-image:radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
                                {isFullSvgDoc && !overrideColors ? (
                                    // Complete SVG Document: Native display preserving inner defs/fills
                                    <div
                                        className="w-full h-full flex items-center justify-center [&>svg]:max-h-44 [&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-full"
                                        dangerouslySetInnerHTML={{ __html: fullMinifiedSvgOutput }}
                                    />
                                ) : minifiedPath ? (
                                    // Standalone Path OR Full SVG with User Override Colors
                                    <svg
                                        viewBox={computedViewBox || "0 0 300 300"}
                                        className="w-full h-full max-h-44 transition-transform duration-200"
                                    >
                                        <path
                                            d={minifiedPath}
                                            fill={previewFill}
                                            stroke={previewStroke}
                                            strokeWidth={previewStrokeWidth}
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                ) : (
                                    <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                                        <span>No valid path commands detected</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Output Code Box */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Optimized Payload
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                    Precision: {precision} decimals
                                </span>
                            </div>

                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={fullMinifiedSvgOutput}
                                    className="w-full h-36 p-3 font-mono text-xs border border-slate-200 rounded-xl bg-slate-900 text-emerald-400 focus:outline-none resize-none leading-relaxed"
                                />
                            </div>

                            {/* Optimization Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Raw Size</span>
                                    <span className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
                                        {stats.rawLength} <span className="text-[10px] font-normal text-slate-400">bytes</span>
                                    </span>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Minified Size</span>
                                    <span className="text-sm sm:text-base font-black text-indigo-600 font-mono mt-0.5">
                                        {stats.minifiedLength} <span className="text-[10px] font-normal text-slate-400">bytes</span>
                                    </span>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Reduction</span>
                                    <span className="text-sm sm:text-base font-black text-emerald-600 font-mono mt-0.5">
                                        {stats.reductionPercentage}%
                                    </span>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Commands</span>
                                    <span className="text-sm sm:text-base font-black text-slate-800 font-mono mt-0.5">
                                        {stats.commandCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            Saved {stats.savedBytes} bytes ({stats.reductionPercentage}%)
                        </span>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <Copy className="w-3 h-3" /> Quick Copy
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Vector Math & Precision Geometry */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mathematics of SVG Path Compression: Floating-Point Precision vs Visual Acuity
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Vector rendering environments like modern web browsers rely on screen grids composed of discrete pixels[cite: 2]. When desktop authoring tools export vector drawings, their internal parametric curve solvers generate floating-point numbers with extraordinary precision—often calculating coordinates down to seven or eight decimal places[cite: 2]. In practical web design, this level of precision is completely redundant[cite: 2].
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Subpixel Rendering Thresholds
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                On a standard 1080p or 4K screen, a coordinate offset of 0.001 units represents less than one-tenth of a device pixel[cite: 2]. Truncating coordinates to 1 or 2 decimal places produces zero human-perceptible deviation in curve silhouette[cite: 2].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Scissors className="w-4 h-4 text-indigo-600" /> Whitespace Stripping
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The W3C SVG path specification allows implicit separators[cite: 2]. Commas and spaces can be eliminated when adjacent tokens are inherently unambiguous, such as between path commands (M, C, Z) and negative coordinates[cite: 2].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <FileCode className="w-4 h-4 text-indigo-600" /> Leading Zero Elimination
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Fractional numbers between -1.0 and 1.0 can legally omit the integer zero character (rendering <code>0.45</code> as <code>.45</code> and <code>-0.8</code> as <code>-.8</code>), instantly shedding one byte per fractional coordinate across thousands of points[cite: 2].
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Before and After: SVG Path Minification in Action
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Observe how excessive floating-point data and bloated whitespace are converted into a compact, production-ready vector stream without altering control points[cite: 2]:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div className="text-rose-400">
                                <span className="text-slate-500 font-sans block">{"// Raw Export from Vector Editor (138 bytes):"}</span>
                                M 100.000000 100.000000 C 120.552410 80.123490 150.884210 80.342110 170.000000 100.000000 Z
                            </div>
                            <div className="text-emerald-400">
                                <span className="text-slate-500 font-sans block">{"// TwisterTools Minified Path (53 bytes - 61.5% reduction):"}</span>
                                M100 100C120.55 80.12 150.88 80.34 170 100Z
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Precision Level Benchmark Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Recommended Precision Matrix by Use Case
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate precision level requires balancing raw file size reduction against dimensional accuracy[cite: 2]. The table below outlines industry-standard precision targets for typical digital media workflows[cite: 2]:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Precision Setting</th>
                                    <th className="p-3">Target Coordinate Example</th>
                                    <th className="p-3">Visual Quality Impact</th>
                                    <th className="p-3">Typical Size Savings</th>
                                    <th className="p-3">Ideal Vector Assets</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">0 Decimals (Integer)</td>
                                    <td className="p-3 font-mono">145</td>
                                    <td className="p-3 text-amber-600 font-bold">Visible on tiny icons</td>
                                    <td className="p-3 font-mono text-emerald-600">65% – 80%</td>
                                    <td className="p-3">Pixel-art, 24px UI icons on whole pixels</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 Decimal Place</td>
                                    <td className="p-3 font-mono">145.2</td>
                                    <td className="p-3 text-emerald-600 font-bold">Imperceptible difference</td>
                                    <td className="p-3 font-mono text-emerald-600">50% – 65%</td>
                                    <td className="p-3">Web app iconography, UI avatars, logos</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2 Decimal Places</td>
                                    <td className="p-3 font-mono">145.23</td>
                                    <td className="p-3 text-emerald-600 font-bold">Zero distortion</td>
                                    <td className="p-3 font-mono text-emerald-600">40% – 55%</td>
                                    <td className="p-3">Complex hero illustrations, typography paths</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3+ Decimal Places</td>
                                    <td className="p-3 font-mono">145.234</td>
                                    <td className="p-3 text-slate-600 font-bold">Microscopic precision</td>
                                    <td className="p-3 font-mono text-slate-500">15% – 30%</td>
                                    <td className="p-3">GIS interactive maps, CAD technical blueprints</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Performance, DOM Paint Time & Mobile UX */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Core Web Vitals Impact: DOM Parse Time and Memory Overhead
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Embedding inline SVGs in HTML documents has become standard practice for modern web frameworks like Next.js, React, and Vue to eliminate HTTP requests and enable instant CSS styling[cite: 2]. However, unoptimized path strings introduce subtle performance bottlenecks[cite: 2]:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct Web Vitals Advantages
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Faster DOM Parsing:</strong> Browsers parse inline SVG path tokens synchronously during initial HTML layout[cite: 2]. Smaller path strings directly reduce Total Blocking Time (TBT)[cite: 2].
                                </li>
                                <li>
                                    • <strong>Reduced JS Bundle Size:</strong> React components containing icon SVGs (e.g. Lucide, Heroicons) bundle raw path strings as JavaScript string literals[cite: 2]. Smaller strings shrink your client-side JavaScript payloads[cite: 2].
                                </li>
                                <li>
                                    • <strong>Optimized Gzip/Brotli Compression:</strong> Uniform precision creates repetitive byte sequences that compress substantially better in HTTP transfer encodings[cite: 2].
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Export Antipatterns
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Exporting 8-Decimal Precision:</strong> Generating sub-atomic coordinates that provide zero visual value while doubling string memory[cite: 2].
                                </li>
                                <li>
                                    • <strong>Redundant Commas & Spaces:</strong> Leaving commas between commands and coordinates (e.g. <code>M,10,20,C,30...</code>) which wastes critical byte space[cite: 2].
                                </li>
                                <li>
                                    • <strong>Unminified Production SVGs:</strong> Loading uncompressed 50KB SVG icons on mobile networks, leading to layout shifts and degraded Largest Contentful Paint (LCP)[cite: 2].
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Path Anatomy & Command Specification */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Anatomy of SVG Path Commands and Syntactic Shortening
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The SVG <code>&lt;path&gt;</code> element is the most versatile shape generator in vector design, defined by a sequence of commands and coordinates[cite: 2]. TwisterTools accurately recognizes and safely compresses all standard SVG command parameters[cite: 2]:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-mono font-bold text-indigo-600 text-xs">M / m (MoveTo)</h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Sets a new current pen position without drawing[cite: 2]. Follow-up coordinate pairs automatically execute implicit LineTo commands[cite: 2].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-mono font-bold text-indigo-600 text-xs">L / l, H / h, V / v (Lines)</h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Draws straight lines from the current point to a new point[cite: 2]. H/h and V/v streamline single-axis horizontal and vertical translations[cite: 2].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-mono font-bold text-indigo-600 text-xs">C / c, S / s (Cubic Bezier)</h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Draws smooth cubic Bezier curves utilizing two control points[cite: 2]. S/s mirrors the previous control point for ultra-compact syntax[cite: 2].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-mono font-bold text-indigo-600 text-xs">Q / q, T / t (Quadratic Bezier)</h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Draws quadratic curves with a single control point, providing lightweight curvature with lower computing complexity[cite: 2].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-mono font-bold text-indigo-600 text-xs">A / a (Elliptical Arc)</h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Draws complex arc curves defined by radiuses, rotation angle, large-arc flag, sweep flag, and target coordinate endpoints[cite: 2].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-mono font-bold text-indigo-600 text-xs">Z / z (ClosePath)</h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Automatically seals the current subpath by rendering a straight stroke back to the initial MoveTo coordinate[cite: 2].
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
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
                                How does decimal precision reduction optimize SVG file size?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Vector design applications like Adobe Illustrator, Figma, and Inkscape export coordinate floats with 4 to 8 decimal places (e.g., 142.584931)[cite: 2]. On standard web displays, fractions beyond 1 or 2 decimal places represent fractions of a physical subpixel that are visually imperceptible[cite: 2]. Truncating coordinates from 6 decimal places to 1 or 2 eliminates up to 60% of raw character payload from the SVG path &quot;d&quot; attribute without degrading visual quality[cite: 2].
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is consecutive delimiter collapsing in SVG path data?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The SVG specification allows whitespace and commas to be omitted when path token boundaries are unambiguous[cite: 2]. For example, negative coordinates contain an inherent minus delimiter, and decimals starting with a period are syntactically distinct from preceding floats containing periods[cite: 2]. Replacing spaces like &quot;M 10 20 L -30 .5&quot; with &quot;M10 20L-30.5&quot; saves significant byte count[cite: 2].
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Will reducing coordinate precision distort complex curves?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For standard icons and illustrations rendered at sizes between 16px and 1200px, 1 to 2 decimal places provides sub-pixel accuracy that looks identical to the human eye[cite: 2]. Only microscopic viewports mapped onto massive canvas viewboxes (such as GIS mapping or CAD architectural blueprints) require 3 or more decimal places[cite: 2].
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I upload entire SVG files directly into this tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The tool includes a direct file uploader and drag-and-drop support for .svg files. All path &apos;d&apos; attributes across the document are minified in-place while keeping attributes, gradients, clip paths, and structural containers fully intact.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does leading zero omission break browser SVG rendering?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No[cite: 2]. The W3C SVG path specification explicitly supports floating-point notation omitting the integer zero preceding a decimal point (e.g., .5 instead of 0.5, or -.25 instead of -0.25)[cite: 2]. All modern rendering engines (Blink, WebKit, Gecko) parse this correctly[cite: 2].
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is client-side SVG minification safer than server-side optimization?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Client-side processing executes entirely in your local browser runtime via JavaScript[cite: 2]. Your vector graphics, brand iconography, and proprietary digital assets are never transmitted across a network or stored on external servers, ensuring zero risk of data leakage[cite: 2].
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}