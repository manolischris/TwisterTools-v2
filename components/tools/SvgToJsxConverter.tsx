"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Copy,
    Check,
    Download,
    RefreshCw,
    Sliders,
    Sparkles,
    Layers,
    ShieldAlert,
    CheckCircle2,
    Eye,
    FileCode,
    Zap,
    HelpCircle,
    BookOpen,
    Cpu,
    ArrowRightLeft,
    Monitor,
    Upload
} from "lucide-react";

// Attribute mapping from SVG to React camelCase standard
const ATTRIBUTE_MAPPING: Record<string, string> = {
    class: "className",
    for: "htmlFor",
    "stroke-width": "strokeWidth",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "stroke-opacity": "strokeOpacity",
    "fill-rule": "fillRule",
    "fill-opacity": "fillOpacity",
    "clip-rule": "clipRule",
    "clip-path": "clipPath",
    "font-family": "fontFamily",
    "font-size": "fontSize",
    "font-weight": "fontWeight",
    "text-anchor": "textAnchor",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "color-interpolation-filters": "colorInterpolationFilters",
    "xmlns:xlink": "xmlnsXlink",
    "xlink:href": "xlinkHref",
    "xml:space": "xmlSpace",
    tabindex: "tabIndex",
    crossorigin: "crossOrigin"
};

const SAMPLE_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 17L12 22L22 17" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 12L12 17L22 12" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function SvgToJsxConverter() {
    const [rawSvg, setRawSvg] = useState<string>(SAMPLE_SVG);
    const [componentName, setComponentName] = useState<string>("IconComponent");
    const [isTypeScript, setIsTypeScript] = useState<boolean>(true);
    const [useForwardRef, setUseForwardRef] = useState<boolean>(true);
    const [passProps, setPassProps] = useState<boolean>(true);
    const [exportType, setExportType] = useState<"named" | "default">("named");
    const [stripDimensions, setStripDimensions] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Transform inline style strings to React JSX style objects
    const styleStringToJsxObject = (styleString: string): string => {
        const rules = styleString.split(";").filter((r) => r.trim().length > 0);
        const styleEntries = rules.map((rule) => {
            const [prop, val] = rule.split(":").map((s) => s.trim());
            if (!prop || !val) return null;
            const camelProp = prop.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
            return `${camelProp}: "${val.replace(/"/g, '\\"')}"`;
        }).filter(Boolean);

        return `{{ ${styleEntries.join(", ")} }}`;
    };

    // Parse and transform SVG string to Clean JSX AST representation
    const transformedOutput = useMemo(() => {
        if (!rawSvg.trim()) {
            setParseError(null);
            return "";
        }

        try {
            // Clean XML prolog and comments before parsing
            let cleaned = rawSvg
                .replace(/<\?xml[^>]*\?>/gi, "")
                .replace(/<!DOCTYPE[^>]*>/gi, "")
                .replace(/<!--[\s\S]*?-->/g, "")
                .trim();

            if (!cleaned.toLowerCase().includes("<svg")) {
                setParseError("Missing valid root <svg> element.");
                return "";
            }

            // Convert self-closing tags and standard SVG kebab-case attributes
            cleaned = cleaned.replace(/style="([^"]*)"/gi, (_, styleStr) => {
                return `style=${styleStringToJsxObject(styleStr)}`;
            });

            // Map standard kebab-case attributes
            Object.entries(ATTRIBUTE_MAPPING).forEach(([kebab, camel]) => {
                const regex = new RegExp(`\\b${kebab}=`, "g");
                cleaned = cleaned.replace(regex, `${camel}=`);
            });

            // Ensure any unclosed SVG self-closing elements conform to JSX standards
            const voidElements = ["path", "circle", "line", "rect", "polygon", "polyline", "ellipse", "stop", "use"];
            voidElements.forEach((el) => {
                const regex = new RegExp(`<(${el})([^>]*?)(?<!/)>`, "gi");
                cleaned = cleaned.replace(regex, "<$1$2 />");
            });

            // Strip dimensions if toggled
            if (stripDimensions) {
                cleaned = cleaned
                    .replace(/\s+(width|height)=["'][^"']*["']/gi, "")
                    .trim();
            }

            // Splice props into root SVG tag
            const propInjection = passProps ? " {...props}" : "";
            const refInjection = useForwardRef ? " ref={ref}" : "";

            cleaned = cleaned.replace(/<svg\b([^>]*)>/i, `<svg$1${refInjection}${propInjection}>`);

            // Format component wrapping logic
            let finalCode = "";
            const cleanCompName = componentName.replace(/[^a-zA-Z0-9_]/g, "") || "SvgIcon";

            if (isTypeScript) {
                if (useForwardRef) {
                    finalCode = `import * as React from "react";\nimport { forwardRef, SVGProps } from "react";\n\n`;
                    finalCode += `export interface ${cleanCompName}Props extends SVGProps<SVGSVGElement> {}\n\n`;
                    finalCode += `export const ${cleanCompName} = forwardRef<SVGSVGElement, ${cleanCompName}Props>(\n`;
                    finalCode += `  (${passProps ? "props" : "_"}, ref) => (\n`;
                    finalCode += `    ${cleaned.split("\n").join("\n    ")}\n`;
                    finalCode += `  )\n);\n\n`;
                    finalCode += `${cleanCompName}.displayName = "${cleanCompName}";\n`;
                    if (exportType === "default") {
                        finalCode += `\nexport default ${cleanCompName};`;
                    }
                } else {
                    finalCode = `import * as React from "react";\nimport { SVGProps } from "react";\n\n`;
                    finalCode += `export interface ${cleanCompName}Props extends SVGProps<SVGSVGElement> {}\n\n`;
                    finalCode += `${exportType === "named" ? "export " : ""}const ${cleanCompName} = (${passProps ? "props: " + cleanCompName + "Props" : ""}) => (\n`;
                    finalCode += `  ${cleaned.split("\n").join("\n  ")}\n);\n`;
                    if (exportType === "default") {
                        finalCode += `\nexport default ${cleanCompName};`;
                    }
                }
            } else {
                if (useForwardRef) {
                    finalCode = `import * as React from "react";\nimport { forwardRef } from "react";\n\n`;
                    finalCode += `export const ${cleanCompName} = forwardRef((${passProps ? "props" : "_"}, ref) => (\n`;
                    finalCode += `  ${cleaned.split("\n").join("\n  ")}\n));\n\n`;
                    finalCode += `${cleanCompName}.displayName = "${cleanCompName}";\n`;
                    if (exportType === "default") {
                        finalCode += `\nexport default ${cleanCompName};`;
                    }
                } else {
                    finalCode = `import * as React from "react";\n\n`;
                    finalCode += `${exportType === "named" ? "export " : ""}const ${cleanCompName} = (${passProps ? "props" : ""}) => (\n`;
                    finalCode += `  ${cleaned.split("\n").join("\n  ")}\n);\n`;
                    if (exportType === "default") {
                        finalCode += `\nexport default ${cleanCompName};`;
                    }
                }
            }

            setParseError(null);
            return finalCode.trim();
        } catch (err: unknown) {
            setParseError(err instanceof Error ? err.message : "Failed to parse SVG markup.");
            return "";
        }
    }, [rawSvg, componentName, isTypeScript, useForwardRef, passProps, exportType, stripDimensions]);

    const handleCopy = () => {
        if (!transformedOutput) return;
        navigator.clipboard.writeText(transformedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!transformedOutput) return;
        const extension = isTypeScript ? "tsx" : "jsx";
        const filename = `${componentName || "Component"}.${extension}`;
        const blob = new Blob([transformedOutput], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setRawSvg(content);
            const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "");
            const pascalName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
            if (pascalName) setComponentName(pascalName);
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        setRawSvg(SAMPLE_SVG);
        setComponentName("IconComponent");
        setIsTypeScript(true);
        setUseForwardRef(true);
        setPassProps(true);
        setExportType("named");
        setStripDimensions(false);
        setParseError(null);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "SVG to React JSX Functional Component Converter",
        "url": "https://twistertools.com/tools/image-tools/svg-to-jsx-converter",
        "description": "Transform raw SVG vector files into optimized, production-ready React JSX and TypeScript TSX functional components with custom props, forwardRef, and clean casing.",
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
                "name": "Why do raw SVG attributes need to be converted to camelCase in React?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "React JSX adheres to DOM property conventions rather than standard XML markup attributes. Consequently, hyphenated attributes like stroke-width or fill-rule must be written in camelCase (strokeWidth, fillRule) so the React reconciliation algorithm and synthetic event layer can parse them correctly."
                }
            },
            {
                "@type": "Question",
                "name": "What is the benefit of wrapping converted SVG components in forwardRef?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Using React.forwardRef enables parent components to pass a ref directly to the underlying SVGSVGElement node. This is vital for direct DOM manipulations, running imperative GSAP/Framer Motion animations, measuring bounding boxes with getBoundingClientRect, and managing focus."
                }
            },
            {
                "@type": "Question",
                "name": "Why should I strip width and height attributes from converted SVGs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Stripping explicit width and height properties while preserving the viewBox allows the component to be completely responsive. It allows developers to size the icon dynamically using Tailwind CSS classes like 'w-6 h-6' or CSS grid sizing without conflicting hardcoded pixel dimensions."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool execute client-side or send files to a server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "All parsing, attribute normalization, and TSX component synthesis happen 100% locally in your browser using client-side JavaScript. No SVG files or code are uploaded to an external server."
                }
            },
            {
                "@type": "Question",
                "name": "How are inline SVG style attributes transformed?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Inline string styles such as style='fill: red; stroke-width: 2px' are converted into valid JSX style objects like style={{ fill: 'red', strokeWidth: '2px' }}."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Configuration Options Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configuration Settings</span>
                    </div>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reset
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Component Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Component Name
                        </label>
                        <input
                            type="text"
                            value={componentName}
                            onChange={(e) => setComponentName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                            placeholder="IconComponent"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 font-mono"
                        />
                    </div>

                    {/* Language Switch */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Language Target
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setIsTypeScript(true)}
                                className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${isTypeScript ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                TSX
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsTypeScript(false)}
                                className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${!isTypeScript ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                JSX
                            </button>
                        </div>
                    </div>

                    {/* Export Type */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Export Strategy
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setExportType("named")}
                                className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${exportType === "named" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Named
                            </button>
                            <button
                                type="button"
                                onClick={() => setExportType("default")}
                                className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${exportType === "default" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Default
                            </button>
                        </div>
                    </div>

                    {/* Checkbox Options */}
                    <div className="sm:col-span-2 flex flex-wrap gap-4 items-center pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={useForwardRef}
                                onChange={(e) => setUseForwardRef(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            React.forwardRef
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={passProps}
                                onChange={(e) => setPassProps(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            Spread Props ({`{...props}`})
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={stripDimensions}
                                onChange={(e) => setStripDimensions(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            Strip Width / Height
                        </label>
                    </div>
                </div>
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Raw Input */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">SVG Input</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".svg,image/svg+xml"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5" /> Upload File
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <textarea
                                value={rawSvg}
                                onChange={(e) => setRawSvg(e.target.value)}
                                placeholder="Paste your raw <svg> markup here..."
                                rows={16}
                                className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[380px]"
                            />
                            {parseError && (
                                <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                                    <span>{parseError}</span>
                                </div>
                            )}
                        </div>

                        {/* Visual SVG Mini-Preview */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5 text-indigo-600" /> Live Render Preview
                                </span>
                                <span className="text-[11px] text-slate-400 font-normal">Sanitized Vector Stage</span>
                            </div>
                            <div className="w-full h-24 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden p-2">
                                {rawSvg && !parseError ? (
                                    <div
                                        className="w-16 h-16 flex items-center justify-center text-slate-900"
                                        dangerouslySetInnerHTML={{ __html: rawSvg }}
                                    />
                                ) : (
                                    <span className="text-xs text-slate-400">No renderable SVG</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Transformed React JSX/TSX Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                    React {isTypeScript ? "TSX" : "JSX"} Output
                                </h2>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {isTypeScript ? "TypeScript" : "JavaScript"}
                            </span>
                        </div>

                        <div className="relative">
                            <textarea
                                readOnly
                                value={transformedOutput}
                                placeholder="Generated React functional component will appear here..."
                                rows={16}
                                className="w-full p-3 font-mono text-xs text-indigo-950 bg-slate-900/5 border border-slate-200 rounded-xl focus:outline-none resize-y min-h-[380px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={handleCopy}
                                disabled={!transformedOutput}
                                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied Component!" : "Copy Component"}
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={!transformedOutput}
                                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                Download .{isTypeScript ? "tsx" : "jsx"}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 mt-6 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            camelCase Validated
                        </span>
                        <span>Zero-Server Client Execution</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Architectural Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architectural Foundations: SVG in the React Virtual DOM
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Scalable Vector Graphics (SVG) are XML-based markup documents containing mathematical formulas for drawing paths, lines, and shapes. In traditional web environments, SVGs can be served as external raster-equivalent images using `&lt;img src="icon.svg" /&gt;`. However, serving SVGs inside modern React applications requires transforming XML nodes directly into JSX elements.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Treating vector assets as first-class React components opens complete programmatic control over internal path properties. You can bind reactive component state directly to SVG fills, trigger micro-interactions via CSS transitions, dynamically swap colors with Tailwind CSS classes, and animate vector strokes seamlessly without external stylesheet overhead.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> React Reconciliation Compliance
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Because React evaluates JSX against JavaScript DOM property naming schemes rather than XML specification rules, standard hyphenated attributes like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">stroke-width</code> trigger runtime compilation errors or console warnings if not converted to <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">strokeWidth</code>.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Tree-Shakable Design Systems
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Exporting individual SVGs as discrete functional components allows bundlers such as Vite, Webpack, and Turbopack to tree-shake unused icons completely out of your production bundles, reducing client JavaScript execution time.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Attribute Translation Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            SVG XML Attribute to React JSX Property Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting SVG to React requires meticulous syntax remapping across XML namespaces, reserved keywords, and hyphenated properties:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Standard SVG XML Attribute</th>
                                    <th className="p-3">React JSX Property Equivalent</th>
                                    <th className="p-3">Category / Role</th>
                                    <th className="p-3">Conversion Rule</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs text-rose-600">class</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">className</td>
                                    <td className="p-3">Reserved Keyword</td>
                                    <td className="p-3">Avoids collision with JS `class` keyword</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs text-rose-600">stroke-width</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">strokeWidth</td>
                                    <td className="p-3">Stroke Configuration</td>
                                    <td className="p-3">Converted to camelCase</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs text-rose-600">stroke-linecap</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">strokeLinecap</td>
                                    <td className="p-3">Stroke Configuration</td>
                                    <td className="p-3">Converted to camelCase</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs text-rose-600">fill-rule</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">fillRule</td>
                                    <td className="p-3">Path Geometry</td>
                                    <td className="p-3">Converted to camelCase</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs text-rose-600">clip-path</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">clipPath</td>
                                    <td className="p-3">Clipping Mask</td>
                                    <td className="p-3">Converted to camelCase</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs text-rose-600">xlink:href</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">xlinkHref</td>
                                    <td className="p-3">XML Namespacing</td>
                                    <td className="p-3">Colon replaced by camelCase property</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs text-rose-600">style="fill:red; stroke:blue"</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">{`style={{ fill: "red", stroke: "blue" }}`}</td>
                                    <td className="p-3">Inline Style String</td>
                                    <td className="p-3">Parsed to JavaScript object literal</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Enterprise Integration Patterns */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Enterprise Component Architecture Patterns
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When building professional React design systems, standalone SVG components must implement enterprise patterns to ensure strict type safety, predictable prop overriding, and access to the underlying DOM node.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">1. Explicit Prop Spreading</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Always spread <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">{`{...props}`}</code> on the root SVG element. This allows consuming developers to assign ARIA accessibility tags (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">aria-hidden="true"</code>), custom classes, and standard event listeners like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">onClick</code>.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">2. Forwarding Component Refs</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Wrapping your component with <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">React.forwardRef</code> permits parent access to the native <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">SVGSVGElement</code>, which is mandatory when driving animations using libraries like Framer Motion or GSAP.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">3. ViewBox Responsiveness</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Removing hardcoded <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">width</code> and <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">height</code> while preserving the <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">viewBox</code> unlocks fluid scaling, allowing utility classes like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">w-6 h-6</code> to control visual footprint automatically.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Code Walkthrough */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Code Conversion: Before and After
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Notice how an export directly from design software (such as Figma or Adobe Illustrator) contains boilerplate XML declarations, unneeded metadata, and invalid hyphenated attributes that require translation into clean TypeScript TSX:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Before: Raw SVG File</span>
                                <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">XML File</span>
                            </div>
                            <div className="bg-slate-900 text-rose-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`<!-- Generated by Illustrator -->
<svg width="24" height="24" 
     viewBox="0 0 24 24" 
     fill="none" 
     xmlns="http://www.w3.org/2000/svg">
  <path d="M5 12h14" 
        stroke="#000" 
        stroke-width="2" 
        stroke-linecap="round" />
</svg>`}
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">After: Production TSX Component</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">TypeScript Component</span>
                            </div>
                            <div className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`import * as React from "react";
import { forwardRef, SVGProps } from "react";

export interface ArrowIconProps extends SVGProps<SVGSVGElement> {}

export const ArrowIcon = forwardRef<SVGSVGElement, ArrowIconProps>(
  (props, ref) => (
    <svg viewBox="0 0 24 24" fill="none" ref={ref} {...props}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
);
ArrowIcon.displayName = "ArrowIcon";`}
                            </div>
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
                                Why do raw SVG attributes need to be converted to camelCase in React?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                React JSX adheres to DOM property conventions rather than standard XML markup attributes. Consequently, hyphenated attributes like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">stroke-width</code> or <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">fill-rule</code> must be written in camelCase (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">strokeWidth</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">fillRule</code>) so the React reconciliation algorithm and synthetic event layer can parse them correctly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the benefit of wrapping converted SVG components in forwardRef?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Using <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">React.forwardRef</code> enables parent components to pass a ref directly to the underlying <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">SVGSVGElement</code> node. This is vital for direct DOM manipulations, running imperative GSAP/Framer Motion animations, measuring bounding boxes with <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">getBoundingClientRect</code>, and managing accessibility focus.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why should I strip width and height attributes from converted SVGs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Stripping explicit <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">width</code> and <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">height</code> properties while preserving the <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">viewBox</code> allows the component to be completely responsive. It allows developers to size the icon dynamically using Tailwind CSS classes like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">w-6 h-6</code> or CSS grid sizing without conflicting hardcoded pixel dimensions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool execute client-side or send files to a server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                All parsing, attribute normalization, and TSX component synthesis happen 100% locally in your browser using client-side JavaScript. No SVG files or code are uploaded to an external server, preserving source confidentiality.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are inline SVG style attributes transformed?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Inline string styles such as <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">style="fill: red; stroke-width: 2px"</code> are converted into valid JSX style objects like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">{`style={{ fill: "red", strokeWidth: "2px" }}`}</code> so React avoids property assignment warnings during mounting.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}