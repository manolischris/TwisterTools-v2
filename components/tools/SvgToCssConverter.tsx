"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Code2,
    Copy,
    Check,
    Download,
    Upload,
    Trash2,
    Sparkles,
    Palette,
    Layers,
    FileCode,
    Sliders,
    HelpCircle,
    BookOpen,
    Info,
    RefreshCw,
    Maximize2,
    Eye
} from "lucide-react";

type EncodeMode = "uri" | "base64" | "mini";
type OutputFormat = "css-declaration" | "css-rule" | "tailwind" | "inline-svg";
type BackgroundPattern = "transparent-checker" | "light" | "dark" | "navy";

const PRESET_SVGS: { label: string; svg: string }[] = [
    {
        label: "Geometric Chevron",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <path d="M0 20 L20 40 L40 20 L30 10 L20 20 L10 10 Z" fill="#6366f1" fill-opacity="0.25"/>
  <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#4f46e5" stroke-width="2"/>
</svg>`,
    },
    {
        label: "Subtle Grid Dot",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="2.5" fill="#4338ca"/>
</svg>`,
    },
    {
        label: "Wave Crest",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="24" viewBox="0 0 60 24">
  <path d="M0 12 Q 15 0, 30 12 T 60 12" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round"/>
</svg>`,
    },
    {
        label: "Diagonal Stripes",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
  <line x1="0" y1="20" x2="20" y2="0" stroke="#4f46e5" stroke-width="4" stroke-linecap="square"/>
</svg>`,
    },
];

export default function SvgToCssConverter() {
    const [rawSvg, setRawSvg] = useState<string>(PRESET_SVGS[0].svg);
    const [encodeMode, setEncodeMode] = useState<EncodeMode>("uri");
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("css-declaration");
    const [bgPattern, setBgPattern] = useState<BackgroundPattern>("transparent-checker");
    const [bgRepeat, setBgRepeat] = useState<"repeat" | "no-repeat" | "repeat-x" | "repeat-y">("repeat");
    const [bgSize, setBgSize] = useState<"auto" | "contain" | "cover" | "custom">("auto");
    const [customBgSize, setCustomBgSize] = useState<string>("40px 40px");
    const [bgPosition, setBgPosition] = useState<string>("center");
    const [overrideColor, setOverrideColor] = useState<string>("#4f46e5");
    const [applyColorOverride, setApplyColorOverride] = useState<boolean>(false);
    const [classNameTarget, setClassNameTarget] = useState<string>(".custom-svg-bg");

    const [copied, setCopied] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sanitization, Optimization, and Color override
    const processedSvg = useMemo(() => {
        let text = rawSvg.trim();
        if (!text) return "";

        // Auto inject xmlns if missing for valid data-uri background rendering
        if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/i.test(text)) {
            text = text.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Color override replacement (if requested)
        if (applyColorOverride && overrideColor) {
            text = text.replace(/fill="(?!none)[^"]+"/gi, `fill="${overrideColor}"`);
            text = text.replace(/stroke="(?!none)[^"]+"/gi, `stroke="${overrideColor}"`);
        }

        // Collapse unneeded spaces & normalize newlines
        text = text
            .replace(/>\s+</g, "><")
            .replace(/\r?\n|\r/g, " ")
            .replace(/\s{2,}/g, " ")
            .trim();

        return text;
    }, [rawSvg, applyColorOverride, overrideColor]);

    // Format Data URI based on Selected Encoding Mode
    const dataUri = useMemo(() => {
        if (!processedSvg) return "";

        if (encodeMode === "base64") {
            try {
                const encoded = typeof window !== "undefined"
                    ? window.btoa(unescape(encodeURIComponent(processedSvg)))
                    : Buffer.from(processedSvg).toString("base64");
                return `data:image/svg+xml;base64,${encoded}`;
            } catch {
                return "data:image/svg+xml;utf8," + encodeURIComponent(processedSvg);
            }
        }

        if (encodeMode === "mini") {
            // High-efficiency URI encoding: replace double quotes with single quotes and selectively encode unsafe URI characters
            const singleQuoted = processedSvg.replace(/"/g, "'");
            const minimalEncoded = singleQuoted
                .replace(/%/g, "%25")
                .replace(/#/g, "%23")
                .replace(/</g, "%3C")
                .replace(/>/g, "%3E")
                .replace(/\s+/g, " ")
                .replace(/&/g, "%26");
            return `data:image/svg+xml,${minimalEncoded}`;
        }

        // Standard encodeURIComponent RFC 3986 format
        return `data:image/svg+xml,${encodeURIComponent(processedSvg)
            .replace(/'/g, "%27")
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29")}`;
    }, [processedSvg, encodeMode]);

    // Dynamic output code construction
    const generatedCode = useMemo(() => {
        if (!dataUri) return "";

        const sizeVal = bgSize === "custom" ? customBgSize : bgSize;

        switch (outputFormat) {
            case "css-declaration":
                return `background-image: url("${dataUri}");
background-repeat: ${bgRepeat};
background-position: ${bgPosition};
${bgSize !== "auto" ? `background-size: ${sizeVal};` : ""}`.trim();

            case "css-rule":
                return `${classNameTarget || ".custom-svg-bg"} {
  background-image: url("${dataUri}");
  background-repeat: ${bgRepeat};
  background-position: ${bgPosition};
  ${bgSize !== "auto" ? `background-size: ${sizeVal};\n` : ""}}`.trim();

            case "tailwind": {
                // Inline style syntax for dynamic SVG background URIs
                const sanitizedUri = dataUri.replace(/\s/g, "_");
                const repeatClass = bgRepeat === "no-repeat" ? "bg-no-repeat" : bgRepeat === "repeat-x" ? "bg-repeat-x" : bgRepeat === "repeat-y" ? "bg-repeat-y" : "bg-repeat";
                return `style={{ backgroundImage: "url('${sanitizedUri}')" }} className="${repeatClass} bg-${bgPosition}"`;
            }

            case "inline-svg":
                return processedSvg;

            default:
                return `background-image: url("${dataUri}");`;
        }
    }, [dataUri, outputFormat, bgRepeat, bgPosition, bgSize, customBgSize, classNameTarget, processedSvg]);

    // Dynamic metrics
    const stats = useMemo(() => {
        const rawBytes = new Blob([rawSvg]).size;
        const uriBytes = new Blob([dataUri]).size;
        const diff = uriBytes - rawBytes;
        const pctIncrease = rawBytes > 0 ? ((diff / rawBytes) * 100).toFixed(1) : "0";
        return { rawBytes, uriBytes, diff, pctIncrease };
    }, [rawSvg, dataUri]);

    const handleCopy = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                setRawSvg(content);
            }
        };
        reader.readAsText(file);
    };

    const handleDownloadCSS = () => {
        if (!generatedCode) return;
        const blob = new Blob([generatedCode], { type: "text/css;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "svg-background.css";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const checkerPatternStyle = {
        backgroundImage: "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
        backgroundSize: "16px 16px",
        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    };

    // SEO Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "SVG to Pure CSS Background Code Formatter",
        "url": "https://twistertools.com/tools/image-tools/svg-to-css-converter",
        "description": "Convert and optimize raw SVG markup into production-ready CSS background-image Data URIs, Tailwind arbitrary utilities, and clean Base64 or UTF-8 rules in real-time.",
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
                "name": "Why use SVG in CSS background-image rather than an external .svg file?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Inlining SVGs into CSS as Data URIs eliminates independent HTTP requests, avoiding layout shifts (CLS) and ensuring decorative elements render immediately when the stylesheet finishes parsing."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Base64 and UTF-8 URI encoding for SVGs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Base64 expands file size by approximately 33% and cannot be Gzipped as effectively as plain text. UTF-8 URI encoding retains plain text formatting with escaped special characters, compressing better under Gzip or Brotli."
                }
            },
            {
                "@type": "Question",
                "name": "Why is the xmlns attribute required in CSS Data URIs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Web browsers require the xmlns='http://www.w3.org/2000/svg' XML namespace inside CSS Data URIs to properly evaluate the inline string as vector markup. Without it, the background image fails to render."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool support Tailwind CSS arbitrary values?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Select the Tailwind output option to generate ready-to-paste arbitrary utility classes with escaped spaces and syntax ready for modern utility-first layouts."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Data Scripts */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Quick Presets Selection Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Presets:
                </span>
                {PRESET_SVGS.map((preset) => (
                    <button
                        key={preset.label}
                        type="button"
                        onClick={() => setRawSvg(preset.svg)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition text-slate-700 cursor-pointer"
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Main 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: SVG Input & Encoding Configurations */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                            <div className="flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-bold text-slate-900">
                                    Raw SVG Source Input
                                </h2>
                                <span className="text-xs font-medium text-slate-400 ml-1">
                                    ({stats.rawBytes.toLocaleString()} bytes)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition flex items-center gap-1.5 border border-indigo-200 cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload SVG
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".svg"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => setRawSvg("")}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Raw SVG Textarea */}
                        <div className="relative">
                            <textarea
                                value={rawSvg}
                                onChange={(e) => setRawSvg(e.target.value)}
                                placeholder="Paste your raw <svg>...</svg> markup here..."
                                rows={10}
                                className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-y min-h-[220px]"
                            />
                        </div>

                        {/* Configuration Controls Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {/* Encoding Mode Selector */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Encoding Standard
                                </label>
                                <select
                                    value={encodeMode}
                                    onChange={(e) => setEncodeMode(e.target.value as EncodeMode)}
                                    className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="uri">Minimal URI (Percent-Escaped)</option>
                                    <option value="mini">Mini-SVG Single-Quote Data URI</option>
                                    <option value="base64">Base64 Encoded Binary</option>
                                </select>
                            </div>

                            {/* Code Output Syntaxes */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Output Syntax
                                </label>
                                <select
                                    value={outputFormat}
                                    onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                                    className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="css-declaration">CSS Declarations Block</option>
                                    <option value="css-rule">Complete CSS Selector Rule</option>
                                    <option value="tailwind">Tailwind Arbitrary Class</option>
                                    <option value="inline-svg">Sanitized Clean SVG</option>
                                </select>
                            </div>
                        </div>

                        {/* Optional Color Tinting & Selector Config */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={applyColorOverride}
                                        onChange={(e) => setApplyColorOverride(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                                    Override Fill & Stroke Tint
                                </label>
                                {applyColorOverride && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={overrideColor}
                                            onChange={(e) => setOverrideColor(e.target.value)}
                                            className="w-6 h-6 rounded border border-slate-300 cursor-pointer bg-transparent"
                                        />
                                        <span className="font-mono text-xs text-slate-600 uppercase font-semibold">
                                            {overrideColor}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {outputFormat === "css-rule" && (
                                <div className="space-y-1 pt-2 border-t border-slate-200">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                        Target Class Selector
                                    </label>
                                    <input
                                        type="text"
                                        value={classNameTarget}
                                        onChange={(e) => setClassNameTarget(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                                        placeholder=".custom-svg-bg"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compression Statistics Banner */}
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Source Size</div>
                            <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">{stats.rawBytes} B</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-[10px] uppercase font-bold text-slate-500">CSS Output Size</div>
                            <div className="text-xs font-bold text-indigo-600 font-mono mt-0.5">{stats.uriBytes} B</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Payload Delta</div>
                            <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">+{stats.pctIncrease}%</div>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Preview & Generated Code */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Interactive Canvas Preview
                            </h2>
                            <div className="flex items-center gap-1.5">
                                {(["transparent-checker", "light", "dark", "navy"] as BackgroundPattern[]).map((pat) => (
                                    <button
                                        key={pat}
                                        type="button"
                                        title={`Switch to ${pat} stage backdrop`}
                                        onClick={() => setBgPattern(pat)}
                                        className={`w-6 h-6 rounded-md border text-[10px] font-bold uppercase transition flex items-center justify-center cursor-pointer ${bgPattern === pat ? "border-indigo-600 ring-2 ring-indigo-200" : "border-slate-200"
                                            } ${pat === "transparent-checker"
                                                ? "bg-white"
                                                : pat === "light"
                                                    ? "bg-slate-100"
                                                    : pat === "dark"
                                                        ? "bg-slate-900"
                                                        : "bg-indigo-950"
                                            }`}
                                    >
                                        {pat[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Dynamic Background Canvas */}
                        <div
                            className={`w-full h-44 rounded-xl border border-slate-200 transition-all overflow-hidden flex items-center justify-center relative shadow-inner ${bgPattern === "light"
                                ? "bg-slate-100"
                                : bgPattern === "dark"
                                    ? "bg-slate-900"
                                    : bgPattern === "navy"
                                        ? "bg-slate-950"
                                        : ""
                                }`}
                            style={
                                bgPattern === "transparent-checker"
                                    ? checkerPatternStyle
                                    : undefined
                            }
                        >
                            <div
                                className="w-full h-full"
                                style={{
                                    backgroundImage: dataUri ? `url("${dataUri}")` : "none",
                                    backgroundRepeat: bgRepeat,
                                    backgroundPosition: bgPosition,
                                    backgroundSize: bgSize === "custom" ? customBgSize : bgSize,
                                }}
                            />
                            {!dataUri && (
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-400">
                                    No valid SVG code supplied
                                </div>
                            )}
                        </div>

                        {/* Canvas Layout Controls */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Repeat
                                </label>
                                <select
                                    value={bgRepeat}
                                    onChange={(e) => setBgRepeat(e.target.value as any)}
                                    className="w-full p-1.5 border border-slate-200 rounded-lg font-medium text-slate-800 bg-white"
                                >
                                    <option value="repeat">Repeat</option>
                                    <option value="no-repeat">No-Repeat</option>
                                    <option value="repeat-x">Repeat-X</option>
                                    <option value="repeat-y">Repeat-Y</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Position
                                </label>
                                <select
                                    value={bgPosition}
                                    onChange={(e) => setBgPosition(e.target.value)}
                                    className="w-full p-1.5 border border-slate-200 rounded-lg font-medium text-slate-800 bg-white"
                                >
                                    <option value="center">Center</option>
                                    <option value="top left">Top Left</option>
                                    <option value="top right">Top Right</option>
                                    <option value="bottom left">Bottom Left</option>
                                    <option value="bottom right">Bottom Right</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Size
                                </label>
                                <select
                                    value={bgSize}
                                    onChange={(e) => setBgSize(e.target.value as any)}
                                    className="w-full p-1.5 border border-slate-200 rounded-lg font-medium text-slate-800 bg-white"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="contain">Contain</option>
                                    <option value="cover">Cover</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                        </div>

                        {bgSize === "custom" && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Custom Dimensions (e.g. 32px 32px or 50%)
                                </label>
                                <input
                                    type="text"
                                    value={customBgSize}
                                    onChange={(e) => setCustomBgSize(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                                />
                            </div>
                        )}

                        {/* Generated Code Output Display */}
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Generated CSS Code
                                </label>
                                <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                                    {outputFormat}
                                </span>
                            </div>
                            <div className="relative">
                                <pre className="w-full p-3 font-mono text-xs text-indigo-900 bg-indigo-50/50 border border-indigo-100 rounded-xl overflow-x-auto max-h-[160px] whitespace-pre-wrap break-all select-all">
                                    {generatedCode || "/* Output code will appear here automatically */"}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Output Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!generatedCode}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy CSS Code"}
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadCSS}
                            disabled={!generatedCode}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            Download .css
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Vector Architecture & Inline CSS Data URIs */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Vector Architecture: Embedding Scalable SVGs Directly into CSS
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Scalable Vector Graphics (SVG) define two-dimensional graphics using XML-based vector path descriptions. While developers traditionally link SVG files through standard HTML <code>&lt;img&gt;</code> tags or external stylesheet references via <code>url(/assets/icon.svg)</code>, modern web performance best practices favor inline CSS Data URIs for critical above-the-fold interface decorations, repeating tile patterns, and subtle layout textures.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Embedding vector markup directly into a stylesheet eliminates additional HTTP network roundtrips. When a browser downloads your stylesheet, every embedded background pattern is immediately available in memory. This eliminates Cumulative Layout Shift (CLS) and flash-of-unstyled-content (FOUC) artifacts caused by delayed asset fetching over mobile networks.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Zero Request Overhead
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Inlining vectors as CSS Data URIs consolidates requests, allowing critical UI motifs to paint instantly during the first document render pass.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sliders className="w-4 h-4 text-indigo-600" /> Infinite Pixel Density
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Vector mathematical coordinate spaces render crisply on Retina, 4K, and high-DPI smartphone displays without generating raster compression artifacts.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Tiling Precision
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Control background grid repetitions, geometric chevron meshes, and dotted alignments with exact <code>background-size</code> coordinates.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Breakdown: Base64 vs Percent-Escaped UTF-8 */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileCode className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Encoding Mechanics: Base64 vs URL Percent-Encoding vs Mini-SVG
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Choosing the right encoding format directly impacts total bundle weight and Gzip/Brotli compression ratios. Many legacy development workflows default to Base64 encoding for data assets, but Base64 is mathematically suboptimal for vector text documents.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Encoding Scheme</th>
                                    <th className="p-3">Raw Byte Overhead</th>
                                    <th className="p-3">Gzip / Brotli Efficiency</th>
                                    <th className="p-3">Human Readability</th>
                                    <th className="p-3">Recommended Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Base64 Binary</td>
                                    <td className="p-3 text-rose-600 font-bold">+33% Inflation</td>
                                    <td className="p-3 text-amber-600">Moderate</td>
                                    <td className="p-3 text-slate-400">Completely Opaque</td>
                                    <td className="p-3">Embedded raster images inside SVG</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Standard RFC 3986 URI</td>
                                    <td className="p-3 text-indigo-600 font-bold">+15% to +25%</td>
                                    <td className="p-3 text-emerald-600 font-bold">Excellent</td>
                                    <td className="p-3 text-slate-600">Partially Readable</td>
                                    <td className="p-3">Universal browser compatibility</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                    <td className="p-3 font-bold text-indigo-950">Mini-SVG (Single-Quoted)</td>
                                    <td className="p-3 text-emerald-600 font-bold">+5% to +10%</td>
                                    <td className="p-3 text-emerald-700 font-extrabold">Maximum (Ideal)</td>
                                    <td className="p-3 text-emerald-900 font-semibold">High</td>
                                    <td className="p-3 font-semibold">Production modern web applications</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Info className="w-4 h-4" /> Why Base64 Hurts CSS Delivery
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Base64 maps binary chunks to a 64-character ASCII alphabet, which inevitably adds one byte of overhead for every three bytes of data (a constant 33.3% raw byte expansion). Furthermore, because Base64 randomizes character distribution into non-repeating alphanumeric strings, DEFLATE algorithms (Gzip and Brotli) achieve significantly worse compression dictionaries compared to UTF-8 encoded text that contains recurring XML tags like <code>&lt;path&gt;</code>, <code>fill</code>, and <code>stroke</code>.
                        </p>
                    </div>
                </section>

                {/* Card 3: Syntax Integrations: Tailwind CSS, CSS Modules & Vanilla CSS */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Framework Integrations: Tailwind CSS, CSS Modules & Plain CSS
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern engineering teams employ varying styling paradigms. Here is how to seamlessly deploy your generated SVG background code across modern development environments:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Tailwind CSS Arbitrary Utilities
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Tailwind allows arbitrary background properties directly inside HTML class declarations without touching <code>tailwind.config.js</code>. Spaces must be replaced with underscores:
                            </p>
                            <div className="bg-slate-950 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`style={{ backgroundImage: "url('data:image/svg+xml,...')" }} className="bg-repeat bg-center"`}
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" /> CSS Modules & Styled Components
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                In CSS Modules or vanilla stylesheets, wrap the Data URI within a scoped class selector to preserve maintainability and eliminate global cascade conflicts:
                            </p>
                            <div className="bg-slate-950 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                .heroPattern {"{\n  background-image: url('data:image/svg+xml,...');\n  background-size: 24px 24px;\n}"}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Best Practices for SVG Optimization Before CSS Inlining */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Checklist: Optimizing Raw Vector Markup Prior to Inlining
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To maintain minimal bundle footprints, always audit your vector assets before converting them into pure CSS background declarations:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">1. Ensure the XMLNS Namespace is Present</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Web browsers render inline HTML <code>&lt;svg&gt;</code> without namespaces, but CSS Data URIs strictly require <code>xmlns="http://www.w3.org/2000/svg"</code>. If absent, the graphic will fail to paint. Our tool automatically injects this attribute if missing.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">2. Strip Design Software Metadata</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Vector tools like Adobe Illustrator, Sketch, and Figma inject useless metadata tags such as <code>&lt;desc&gt;</code>, <code>&lt;defs&gt;</code>, <code>id="Layer_1"</code>, and editor comments. Removing these elements trims 20% to 50% of the payload.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">3. Prefer viewBox Over Hardcoded Dimensions</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Relying on an explicit <code>viewBox="0 0 24 24"</code> allows the browser to scale the asset cleanly via CSS <code>background-size: contain</code> or custom pixel values without clipping path boundaries.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">4. Convert Double Quotes to Single Quotes</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Since CSS declarations enclose the URI with double quotes <code>url("...")</code>, using single quotes <code>'</code> inside your SVG attributes eliminates the need to encode every quote as <code>%22</code>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static FAQ Section */}
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
                                Why use SVG in CSS background-image rather than an external .svg file?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Inlining SVGs into CSS as Data URIs eliminates independent HTTP requests, avoiding layout shifts (CLS) and ensuring decorative elements render immediately when the stylesheet finishes parsing.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Base64 and UTF-8 URI encoding for SVGs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Base64 expands file size by approximately 33% and cannot be Gzipped as effectively as plain text. UTF-8 URI encoding retains plain text formatting with escaped special characters, compressing better under Gzip or Brotli.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is the xmlns attribute required in CSS Data URIs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Web browsers require the xmlns='http://www.w3.org/2000/svg' XML namespace inside CSS Data URIs to properly evaluate the inline string as vector markup. Without it, the background image fails to render.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool support Tailwind CSS arbitrary values?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Select the Tailwind output option to generate ready-to-paste arbitrary utility classes with escaped spaces and syntax ready for modern utility-first layouts.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}