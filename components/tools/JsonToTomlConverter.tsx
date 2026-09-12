"use client";

import React, { useState, useId, useMemo, useRef } from "react";
import {
    ArrowLeftRight,
    Copy,
    Check,
    Trash2,
    Upload,
    Download,
    FileCode,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Code2,
    BookOpen,
    Layers,
    HelpCircle,
    Sliders,
    Settings2,
    ShieldCheck
} from "lucide-react";
import * as TOML from "@iarna/toml";

type ConversionDirection = "json-to-toml" | "toml-to-json";

const SAMPLE_JSON = `{
  "package": {
    "name": "twister-tools-core",
    "version": "2.4.0",
    "description": "High-performance developer utility platform",
    "authors": ["Lead Architect <architect@twistertools.com>"],
    "license": "MIT",
    "repository": "https://github.com/twistertools/engine"
  },
  "server": {
    "host": "127.0.0.1",
    "port": 8080,
    "ssl_enabled": true,
    "max_connections": 5000,
    "timeout_ms": 30000
  },
  "database": {
    "enabled": true,
    "pool_size": 25,
    "replica_hosts": ["db-replica-1.internal", "db-replica-2.internal"]
  }
}`;

const SAMPLE_TOML = `[package]
name = "twister-tools-core"
version = "2.4.0"
description = "High-performance developer utility platform"
authors = ["Lead Architect <architect@twistertools.com>"]
license = "MIT"
repository = "https://github.com/twistertools/engine"

[server]
host = "127.0.0.1"
port = 8080
ssl_enabled = true
max_connections = 5000
timeout_ms = 30000

[database]
enabled = true
pool_size = 25
replica_hosts = ["db-replica-1.internal", "db-replica-2.internal"]
`;

export default function JsonToTomlConverter() {
    const [direction, setDirection] = useState<ConversionDirection>("json-to-toml");
    const [inputContent, setInputContent] = useState<string>(SAMPLE_JSON);
    const [indentSize, setIndentSize] = useState<number>(2);
    const [copied, setCopied] = useState<boolean>(false);
    const [dragActive, setDragActive] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputAreaId = useId();
    const outputAreaId = useId();
    const indentSelectId = useId();

    const { outputContent, error, parseSuccess } = useMemo(() => {
        if (!inputContent.trim()) {
            return { outputContent: "", error: null, parseSuccess: false };
        }

        try {
            if (direction === "json-to-toml") {
                const parsedObject = JSON.parse(inputContent);
                if (typeof parsedObject !== "object" || parsedObject === null || Array.isArray(parsedObject)) {
                    throw new Error("TOML root level must be a key-value dictionary / JSON object, not a bare primitive or top-level array.");
                }
                const tomlString = TOML.stringify(parsedObject as Record<string, any>);
                return { outputContent: tomlString, error: null, parseSuccess: true };
            } else {
                const parsedObject = TOML.parse(inputContent);
                const jsonString = JSON.stringify(parsedObject, null, indentSize);
                return { outputContent: jsonString, error: null, parseSuccess: true };
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Syntax parsing error";
            return { outputContent: "", error: message, parseSuccess: false };
        }
    }, [inputContent, direction, indentSize]);

    const handleDirectionSwitch = () => {
        if (outputContent && parseSuccess) {
            setInputContent(outputContent);
        } else {
            setInputContent(direction === "json-to-toml" ? SAMPLE_TOML : SAMPLE_JSON);
        }
        setDirection((prev) => (prev === "json-to-toml" ? "toml-to-json" : "json-to-toml"));
    };

    const handleCopy = () => {
        if (!outputContent) return;
        navigator.clipboard.writeText(outputContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!outputContent) return;
        const extension = direction === "json-to-toml" ? "toml" : "json";
        const mimeType = direction === "json-to-toml" ? "application/toml" : "application/json";
        const blob = new Blob([outputContent], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `converted-configuration.${extension}`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === "string") {
                setInputContent(text);
                if (file.name.endsWith(".toml") && direction === "json-to-toml") {
                    setDirection("toml-to-json");
                } else if (file.name.endsWith(".json") && direction === "toml-to-json") {
                    setDirection("json-to-toml");
                }
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === "string") {
                setInputContent(text);
                if (file.name.endsWith(".toml") && direction === "json-to-toml") {
                    setDirection("toml-to-json");
                } else if (file.name.endsWith(".json") && direction === "toml-to-json") {
                    setDirection("json-to-toml");
                }
            }
        };
        reader.readAsText(file);
    };

    const handleLoadSample = () => {
        setInputContent(direction === "json-to-toml" ? SAMPLE_JSON : SAMPLE_TOML);
    };

    const handleClear = () => {
        setInputContent("");
    };

    const inputLines = useMemo(() => (inputContent ? inputContent.split("\n").length : 0), [inputContent]);
    const inputBytes = useMemo(() => new Blob([inputContent]).size, [inputContent]);
    const outputLines = useMemo(() => (outputContent ? outputContent.split("\n").length : 0), [outputContent]);
    const outputBytes = useMemo(() => new Blob([outputContent]).size, [outputContent]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "JSON to TOML & TOML to JSON Dual Converter",
        "url": "https://twistertools.com/tools/developer-tools/json-to-toml-converter",
        "description": "Convert JSON configurations to TOML and TOML data streams to indented JSON in real-time. Client-side, privacy-first conversion with syntax validation.",
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
                "name": "What are the primary structural differences between JSON and TOML?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "JSON is an unadorned hierarchical data serialization standard heavily focused on nested braces and brackets, ideal for API payloads and machine transmission. TOML (Tom's Obvious Minimal Language) is designed specifically for human-authored configuration files (such as Rust Cargo.toml or Python pyproject.toml), emphasizing flat section tables, inline comments, relaxed syntax, and native date-time types without excessive punctuation."
                }
            },
            {
                "@type": "Question",
                "name": "Can any arbitrary JSON payload be converted into valid TOML?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "TOML specifications mandate that the root of a TOML document must be a key-value hash table (dictionary). If your JSON root is a top-level Array ([...]) or a bare primitive string/number, it cannot be rendered directly into standard TOML without nesting it under an enclosing parent key."
                }
            },
            {
                "@type": "Question",
                "name": "Is my configuration file sent to an external server during conversion?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All parsing, lexical tokenization, and code formatting execute 100% locally inside your web browser using client-side JavaScript libraries. No tokens, secrets, API keys, or infrastructure files ever leave your machine."
                }
            },
            {
                "@type": "Question",
                "name": "How does this tool handle nested dictionaries and arrays of tables in TOML?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When converting JSON objects to TOML, nested objects are organized into clean [table] declarations, and arrays containing child objects are converted to [[array_of_tables]] syntax compliant with the official TOML v1.0.0 specification."
                }
            },
            {
                "@type": "Question",
                "name": "Why does TOML preserve comments while JSON does not?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The strict JSON RFC 8259 specification intentionally omits comments to eliminate syntactic parsing ambiguity in automated systems. TOML supports full inline and block-style hash comments (#) because it is engineered specifically for human maintainability in build tools and system configurations."
                }
            },
            {
                "@type": "Question",
                "name": "Can I convert large configuration files like pyproject.toml or Cargo.toml?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The browser-native parser seamlessly handles complex dependencies, target-specific build scripts, and deeply nested configuration files without file size throttling."
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

            {/* Direction & Global Mode Controller */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Conversion Mode
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                    {direction === "json-to-toml" ? "JSON to TOML" : "TOML to JSON"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        {direction === "toml-to-json" && (
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                                <label htmlFor={indentSelectId} className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    JSON Indent:
                                </label>
                                <select
                                    id={indentSelectId}
                                    aria-label="JSON Indentation Spacing"
                                    value={indentSize}
                                    onChange={(e) => setIndentSize(Number(e.target.value))}
                                    className="text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                    <option value={2}>2 Spaces</option>
                                    <option value={4}>4 Spaces</option>
                                    <option value={0}>Minified (Compact)</option>
                                </select>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleDirectionSwitch}
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm cursor-pointer"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                            <span>Swap Conversion Flow</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 12-Column Responsive Workspace Grid (6/6 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Input Code Editor (lg:col-span-6) */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`lg:col-span-6 bg-white dark:bg-slate-900 border ${dragActive ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200 dark:border-slate-800"
                        } rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 min-w-0 transition-colors`}
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                {direction === "json-to-toml" ? "Source JSON Payload" : "Source TOML Payload"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept={direction === "json-to-toml" ? ".json,.txt" : ".toml,.txt"}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer"
                            >
                                <Upload className="w-3.5 h-3.5" /> Upload File
                            </button>
                            <button
                                type="button"
                                onClick={handleLoadSample}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Sample
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={inputAreaId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Paste, type, or drag &amp; drop configuration content:
                        </label>
                        <div className="relative">
                            <textarea
                                id={inputAreaId}
                                aria-label="Input code to convert"
                                rows={16}
                                value={inputContent}
                                onChange={(e) => setInputContent(e.target.value)}
                                placeholder={direction === "json-to-toml" ? "{\n  \"example\": \"value\"\n}" : "example = \"value\"\n"}
                                className="w-full p-4 font-mono text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[360px]"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Left Panel Metadata Metrics */}
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1 font-mono">
                        <span>Lines: <strong className="text-slate-900 dark:text-white">{inputLines}</strong></span>
                        <span>Size: <strong className="text-slate-900 dark:text-white">{inputBytes} B</strong></span>
                        <span>Format: <strong className="text-indigo-600 dark:text-indigo-400 uppercase">{direction === "json-to-toml" ? "JSON" : "TOML"}</strong></span>
                    </div>

                    {/* Parser Error Alert */}
                    {error && (
                        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-rose-900 dark:text-rose-300">Syntax Error</p>
                                <p className="text-xs font-mono text-rose-700 dark:text-rose-400 break-words">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Output Code Editor (lg:col-span-6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                {direction === "json-to-toml" ? "Converted TOML Document" : "Converted JSON Document"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={!outputContent}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" /> Save File
                            </button>
                            <button
                                type="button"
                                onClick={handleCopy}
                                disabled={!outputContent}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${copied
                                        ? "bg-emerald-600 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    }`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={outputAreaId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Real-time formatted output:
                        </label>
                        <div className="relative">
                            <textarea
                                id={outputAreaId}
                                aria-label="Output converted code"
                                rows={16}
                                readOnly
                                value={outputContent}
                                placeholder="Converted syntax will automatically populate here..."
                                className="w-full p-4 font-mono text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[360px]"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Right Panel Metadata Metrics */}
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1 font-mono">
                        <span>Lines: <strong className="text-slate-900 dark:text-white">{outputLines}</strong></span>
                        <span>Size: <strong className="text-slate-900 dark:text-white">{outputBytes} B</strong></span>
                        <span className="flex items-center gap-1">
                            Status:{" "}
                            {parseSuccess ? (
                                <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                                </strong>
                            ) : (
                                <strong className="text-slate-500 dark:text-slate-400">Awaiting Valid Input</strong>
                            )}
                        </span>
                    </div>

                    {/* Primary Output CTA */}
                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={!outputContent}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copied
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 text-white" />
                                <span>Copied to Clipboard!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 text-white" />
                                <span>Copy Converted Code</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Client-Side Execution & Privacy Guarantee Callout */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Zero-Telemetry Privacy Guarantee:</strong> All JSON and TOML transformations run 100% locally inside your web browser via client-side WebAssembly and JavaScript tokenizers. Proprietary system secrets, AWS tokens, database credentials, and production configurations are never sent over the network to any third-party server.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Deep Dive */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Understanding Data Serialization: TOML vs JSON in Modern Systems Architecture
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Data serialization formats serve as the backbone of modern distributed systems, cloud computing, and developer toolchains. While JSON (JavaScript Object Notation) achieved global ubiquity as the transmission language of RESTful APIs, modern software engineering ecosystems increasingly favor TOML (Tom&apos;s Obvious Minimal Language) for human-managed configuration files.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Human Readability
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                TOML strips away the syntactical noise of nested braces, brackets, and trailing comma restrictions. Its table syntax (<code className="font-mono text-indigo-600 dark:text-indigo-400">[section]</code>) makes deeply nested configurations flat and effortless to read.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Native Rich Types
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Unlike JSON, which treats dates and timestamps as plain strings, TOML supports native ISO-8601 datetimes, localized times, floating-point numbers, and inline key-value tuples without custom serialization wrappers.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> First-Class Comments
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Strict JSON standards forbid comments entirely. TOML natively supports standard hash (<code className="font-mono text-indigo-600 dark:text-indigo-400">#</code>) documentation comments, allowing teams to document configuration parameters directly inline.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Feature Matrix Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Feature Analysis: JSON, TOML, and YAML
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the correct format depends on whether your priority is machine throughput, human authoring, or declarative infrastructure automation:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Feature Specification</th>
                                    <th className="p-3">JSON (RFC 8259)</th>
                                    <th className="p-3">TOML (v1.0.0)</th>
                                    <th className="p-3">YAML (v1.2)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Primary Intended Use</td>
                                    <td className="p-3">Machine API Data Wire Transmission</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Human Configuration Files</td>
                                    <td className="p-3">Complex CI/CD &amp; Orchestration</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Inline Comment Support</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-semibold">No (Forbidden)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Yes (# hash style)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Yes (# hash style)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Whitespace &amp; Indent Sensitivity</td>
                                    <td className="p-3">Insensitive</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Insensitive (Explicit tables)</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400 font-bold">Strictly Significant</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Native Datetime Parsing</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">No (Stored as strings)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Yes (ISO-8601 Native)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Yes (Timestamp tags)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Parsing Complexity &amp; Security</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Very Simple / Low Risk</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Deterministic / High Safety</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">High Complexity / Execution Risks</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Real-World Industry Ecosystems */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Code2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Where TOML is Dominating Modern Development Workflows
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Industry projects across systems programming, server orchestration, and data science have made TOML their standard configuration specification:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Core Ecosystem Adoption
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                <li>
                                    • <strong>Rust (Cargo.toml):</strong> The entire package, dependency, and workspace compilation pipeline for the Rust language is orchestrated exclusively through TOML.
                                </li>
                                <li>
                                    • <strong>Python (pyproject.toml / PEP 518):</strong> Modern Python build tools (Poetry, Flit, Hatch, Ruff, and uv) unified disparate configuration files into a centralized TOML manifest.
                                </li>
                                <li>
                                    • <strong>Go (Gopkg.lock / Hugo):</strong> Static site engines like Hugo and earlier dependency managers rely heavily on TOML for front-matter and global build profiles.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Infrastructure &amp; Cloud Runtimes
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                <li>
                                    • <strong>Cloudflare Workers (wrangler.toml):</strong> Cloudflare serverless edge deployments configure bindings, routes, and environment variables with TOML files.
                                </li>
                                <li>
                                    • <strong>Containerd (config.toml):</strong> The high-performance core container runtime driving production Kubernetes clusters utilizes TOML as its primary configuration baseline.
                                </li>
                                <li>
                                    • <strong>Fly.io (fly.toml):</strong> Global application deployment configurations, port assignments, and health check parameters are declared in TOML.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Static FAQ Section */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What are the primary structural differences between JSON and TOML?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                JSON is an unadorned hierarchical data serialization standard heavily focused on nested braces and brackets, ideal for API payloads and machine transmission. TOML (Tom&apos;s Obvious Minimal Language) is designed specifically for human-authored configuration files (such as Rust Cargo.toml or Python pyproject.toml), emphasizing flat section tables, inline comments, relaxed syntax, and native date-time types without excessive punctuation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can any arbitrary JSON payload be converted into valid TOML?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                TOML specifications mandate that the root of a TOML document must be a key-value hash table (dictionary). If your JSON root is a top-level Array (<code className="font-mono text-indigo-600 dark:text-indigo-400">[...]</code>) or a bare primitive string/number, it cannot be rendered directly into standard TOML without nesting it under an enclosing parent key.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Is my configuration file sent to an external server during conversion?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. All parsing, lexical tokenization, and code formatting execute 100% locally inside your web browser using client-side JavaScript libraries. No tokens, secrets, API keys, or infrastructure files ever leave your machine.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does this tool handle nested dictionaries and arrays of tables in TOML?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                When converting JSON objects to TOML, nested objects are organized into clean <code className="font-mono text-indigo-600 dark:text-indigo-400">[table]</code> declarations, and arrays containing child objects are converted to <code className="font-mono text-indigo-600 dark:text-indigo-400">[[array_of_tables]]</code> syntax compliant with the official TOML v1.0.0 specification.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why does TOML preserve comments while JSON does not?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The strict JSON RFC 8259 specification intentionally omits comments to eliminate syntactic parsing ambiguity in automated systems. TOML supports full inline and block-style hash comments (<code className="font-mono text-indigo-600 dark:text-indigo-400">#</code>) because it is engineered specifically for human maintainability in build tools and system configurations.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I convert large configuration files like pyproject.toml or Cargo.toml?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. The browser-native parser seamlessly handles complex dependencies, target-specific build scripts, and deeply nested configuration files without file size throttling.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}