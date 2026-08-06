"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Replace,
    Copy,
    Check,
    Download,
    Trash2,
    RefreshCw,
    FileType,
    Settings,
    FileText,
    CheckCircle2,
    Sparkles,
    ShieldCheck,
    Code2,
    HelpCircle,
    BookOpen,
    Lightbulb,
    Info,
    ArrowRightLeft,
    SlidersHorizontal,
    Search,
    ListFilter,
    Terminal,
    Zap,
    Cpu,
    FileCode,
    Layers,
    CheckSquare
} from "lucide-react";

interface Preset {
    id: string;
    label: string;
    find: string;
    replace: string;
    useRegex: boolean;
    caseSensitive: boolean;
    globalMatch: boolean;
    multiline: boolean;
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "strip-extra-spaces",
        label: "Clean Extra Whitespace",
        find: "[ \\t]+",
        replace: " ",
        useRegex: true,
        caseSensitive: false,
        globalMatch: true,
        multiline: true,
        tag: "Regex"
    },
    {
        id: "remove-blank-lines",
        label: "Remove Blank Lines",
        find: "^\\s*$\\n?",
        replace: "",
        useRegex: true,
        caseSensitive: false,
        globalMatch: true,
        multiline: true,
        tag: "Regex"
    },
    {
        id: "snake-to-camel",
        label: "Snake Case to Camel Case",
        find: "_([a-z])",
        replace: "$1",
        useRegex: true,
        caseSensitive: false,
        globalMatch: true,
        multiline: true,
        tag: "Code"
    },
    {
        id: "strip-html-tags",
        label: "Strip HTML Tags",
        find: "<[^>]*>",
        replace: "",
        useRegex: true,
        caseSensitive: false,
        globalMatch: true,
        multiline: true,
        tag: "HTML"
    },
    {
        id: "replace-smart-quotes",
        label: "Normalize Smart Quotes",
        find: "[\u201C\u201D]",
        replace: '"',
        useRegex: true,
        caseSensitive: false,
        globalMatch: true,
        multiline: true,
        tag: "Typography"
    }
];

export default function TextReplacer() {
    // Input States
    const [inputText, setInputText] = useState<string>(
        "The quick brown fox jumps over the lazy dog.\n\n" +
        "Contact us at support@example.com or sales@example.com.\n" +
        "Sample JSON field: user_first_name, user_last_name, user_email_address.\n\n" +
        "Special quotes: “Hello World!” and extra   spaces   here."
    );
    const [findText, setFindText] = useState<string>("user_");
    const [replaceText, setReplaceText] = useState<string>("account_");

    // Options States
    const [useRegex, setUseRegex] = useState<boolean>(false);
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
    const [globalMatch, setGlobalMatch] = useState<boolean>(true);
    const [multiline, setMultiline] = useState<boolean>(true);

    // UI Feedback States
    const [copied, setCopied] = useState<boolean>(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Core Text Replacement Math & Logic
    const { outputText, replacementCount, matchDetails, regexError } = useMemo(() => {
        if (!inputText) {
            return { outputText: "", replacementCount: 0, matchDetails: [], regexError: null };
        }

        if (!findText) {
            return { outputText: inputText, replacementCount: 0, matchDetails: [], regexError: null };
        }

        if (useRegex) {
            try {
                let flags = "";
                if (globalMatch) flags += "g";
                if (!caseSensitive) flags += "i";
                if (multiline) flags += "m";

                const regex = new RegExp(findText, flags);
                const matches = inputText.match(regex);
                const count = matches ? matches.length : 0;
                const result = inputText.replace(regex, replaceText);

                return {
                    outputText: result,
                    replacementCount: count,
                    matchDetails: matches ? matches.slice(0, 100) : [],
                    regexError: null
                };
            } catch (err: any) {
                return {
                    outputText: inputText,
                    replacementCount: 0,
                    matchDetails: [],
                    regexError: err.message || "Invalid Regular Expression syntax."
                };
            }
        } else {
            // Literal String Search
            let count = 0;
            let result = "";

            if (!globalMatch) {
                const target = caseSensitive ? inputText : inputText.toLowerCase();
                const query = caseSensitive ? findText : findText.toLowerCase();
                const index = target.indexOf(query);

                if (index !== -1) {
                    count = 1;
                    result =
                        inputText.substring(0, index) +
                        replaceText +
                        inputText.substring(index + findText.length);
                } else {
                    result = inputText;
                }
            } else {
                // Global literal replacement preserving case structure
                const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const flags = caseSensitive ? "g" : "gi";
                const regex = new RegExp(escapeRegExp(findText), flags);

                const matches = inputText.match(regex);
                count = matches ? matches.length : 0;
                result = inputText.replace(regex, replaceText);
            }

            return { outputText: result, replacementCount: count, matchDetails: [], regexError: null };
        }
    }, [inputText, findText, replaceText, useRegex, caseSensitive, globalMatch, multiline]);

    // Handle Input Clean & Reset
    const handleReset = () => {
        setInputText("");
        setFindText("");
        setReplaceText("");
        setUseRegex(false);
        setCaseSensitive(false);
        setGlobalMatch(true);
        setMultiline(true);
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setFindText(preset.find);
        setReplaceText(preset.replace);
        setUseRegex(preset.useRegex);
        setCaseSensitive(preset.caseSensitive);
        setGlobalMatch(preset.globalMatch);
        setMultiline(preset.multiline);
        setActivePresetId(preset.id);
    };

    const handleCopy = () => {
        if (!outputText) return;
        navigator.clipboard.writeText(outputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!outputText) return;
        const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "replaced_text_output.txt";
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
            if (content) {
                setInputText(content);
            }
        };
        reader.readAsText(file);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Text Replace & Pattern Substitution Tool",
        "url": "https://twistertools.com/tools/text-tools/text-replacer",
        "description": "Perform high-performance batch text replacement, string substitution, and complex Regular Expression (Regex) matching directly in your browser.",
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
                "name": "How does literal text replacement differ from Regular Expression (Regex) substitution?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Literal text replacement searches for exact word or string character matches. Regular Expression (Regex) substitution enables pattern-based search, allowing users to locate wildcards, match email formats, isolate code variables, or clean up spacing dynamically."
                }
            },
            {
                "@type": "Question",
                "name": "Is my text data safe when using TwisterTools Text Replacer?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, 100%. All text transformations occur client-side in your local browser using modern JavaScript engines. No text content, raw input, or replacement results are ever transmitted to any remote server."
                }
            },
            {
                "@type": "Question",
                "name": "Can I perform case-sensitive and multiline search and replace?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our interactive workspace allows you to toggle Case Sensitive, Global Match (replace all vs. replace first), and Multiline flags seamlessly for both standard and regex searches."
                }
            },
            {
                "@type": "Question",
                "name": "How do capture groups work in Regex replacement?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In Regex mode, you can use capture groups denoted by parentheses (e.g., (\\w+)) in the Find pattern and reference them in the Replace input using $1, $2, etc., to reorder or reformat string components."
                }
            },
            {
                "@type": "Question",
                "name": "Can I process large files without crashing my browser?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Because processing runs directly in your device's V8 or JavaScript core engine, it handles tens of thousands of lines almost instantaneously without network lag or backend timeouts."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Controls & Raw Text Area */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Source Input & Search Configuration
                            </h2>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".txt,.csv,.json,.md,.html,.js,.ts,.css"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                >
                                    Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                                    title="Clear All Inputs"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Find & Replace Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Find String / Pattern
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={findText}
                                        onChange={(e) => {
                                            setFindText(e.target.value);
                                            setActivePresetId(null);
                                        }}
                                        placeholder="Text or Regex pattern..."
                                        className="w-full pl-3 pr-8 py-2 text-xs font-mono rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                    />
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Replace With
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={replaceText}
                                        onChange={(e) => {
                                            setReplaceText(e.target.value);
                                            setActivePresetId(null);
                                        }}
                                        placeholder="Replacement string..."
                                        className="w-full pl-3 pr-8 py-2 text-xs font-mono rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                    />
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                        </div>

                        {/* Toggles & Options Grid */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" /> Search Flags & Options
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                                    <input
                                        type="checkbox"
                                        checked={useRegex}
                                        onChange={(e) => setUseRegex(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>Regex Mode</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                                    <input
                                        type="checkbox"
                                        checked={caseSensitive}
                                        onChange={(e) => setCaseSensitive(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>Match Case</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                                    <input
                                        type="checkbox"
                                        checked={globalMatch}
                                        onChange={(e) => setGlobalMatch(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>Replace All</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                                    <input
                                        type="checkbox"
                                        checked={multiline}
                                        onChange={(e) => setMultiline(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>Multiline</span>
                                </label>
                            </div>
                        </div>

                        {/* Regex Error Alert */}
                        {regexError && (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-mono">
                                <strong>Regex Error:</strong> {regexError}
                            </div>
                        )}

                        {/* Presets Horizontal Scroll */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Substitutions
                            </span>
                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span className={`text-[10px] px-1 rounded ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Main Textarea Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Input Raw Text
                            </label>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                rows={8}
                                placeholder="Paste or type your input string here..."
                                className="w-full h-48 p-3 text-xs font-mono rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 resize-y"
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                        <span>Characters: {inputText.length.toLocaleString()}</span>
                        <span>Lines: {inputText ? inputText.split("\n").length.toLocaleString() : 0}</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Processed Output & Real-time Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                Processed Output
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {replacementCount} {replacementCount === 1 ? "Match Replaced" : "Matches Replaced"}
                            </span>
                        </div>

                        {/* Output Textarea Preview */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Transformed Text Output
                            </label>
                            <textarea
                                value={outputText}
                                readOnly
                                rows={14}
                                placeholder="Transformed result will appear here live..."
                                className="w-full h-80 p-3 text-xs font-mono rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 resize-y"
                            />
                        </div>

                        {/* Real-time Match Analysis Summary */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <ListFilter className="w-3.5 h-3.5 text-indigo-600" /> Pattern Match Summary
                            </div>
                            <p className="text-xs text-slate-700">
                                {replacementCount > 0
                                    ? `Successfully located and replaced ${replacementCount} occurrence(s) using ${useRegex ? "Regular Expression" : "Literal String"} mode.`
                                    : findText
                                        ? "No matching occurrences found in the input source text."
                                        : "Enter a 'Find' pattern or select a quick substitution preset to begin."}
                            </p>
                        </div>
                    </div>

                    {/* Output Actions Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!outputText}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Output" : "Copy Output"}
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={!outputText}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Download .txt
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT & TECHNICAL GUIDES */}
            <div className="space-y-6">

                {/* Card 1: Core Features & Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Enterprise Batch Text Replacement & Regex Substitution Engine
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <strong>Text Replace & Pattern Substitution Tool</strong> is a browser-native text processing utility engineered for software developers, data analysts, technical writers, and digital marketers. Whether you need to swap individual terms, replace code variable namespaces, normalize punctuation, or execute complex pattern matching across tens of thousands of lines, this engine processes data instantly without external server latency.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-indigo-600" /> Full Regular Expression (RegExp) Support
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Seamlessly execute standard ECMAScript regular expressions. Supports capture groups ($1, $2), character classes, anchors (^, $), wildcards, and non-capturing groups for advanced text transformation workflows.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> 100% Client-Side Privacy & Security
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Security is embedded into our architecture. All search, match, and replace computations are executed entirely inside your web browser’s JavaScript V8 engine. Confidential documents, source code, or private customer records are never transmitted over network wires or saved to remote databases.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Breakdown & Substitution Modes */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Text Replacement Mechanics & Search Flags
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Precision text substitution requires configuring search flags appropriately based on your target dataset:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Search Flag / Option</th>
                                    <th className="p-3">RegExp Parameter</th>
                                    <th className="p-3">Technical Function & Behavior</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Match Case</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">Standard / (no 'i')</td>
                                    <td className="p-3">Enforces strict letter-case matching. Distinguishes between "Apple" and "apple".</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Replace All (Global)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">g</td>
                                    <td className="p-3">Replaces every matching instance in the text. When toggled off, only the first occurrence is modified.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Multiline Mode</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">m</td>
                                    <td className="p-3">Treats line breaks as boundary start (^) and end ($) anchors rather than treating the whole input as one string.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Regex Mode</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">new RegExp()</td>
                                    <td className="p-3">Switches search logic from plain string matching to dynamic, pattern-based character evaluations.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Essential Regex Cheat Sheet Table */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Essential Regular Expression Substitution Patterns
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use these ready-to-use regular expressions in **Regex Mode** to solve common data cleaning tasks:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Target Objective</th>
                                    <th className="p-3">Find Regex Pattern</th>
                                    <th className="p-3">Replace String</th>
                                    <th className="p-3">Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono text-xs">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-sans font-medium text-slate-900">Clean Multiple Spaces</td>
                                    <td className="p-3 text-indigo-600">[ \t]+</td>
                                    <td className="p-3 text-slate-600">(single space)</td>
                                    <td className="p-3 font-sans text-slate-500">Normalize spacing in prose</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-sans font-medium text-slate-900">Remove Blank Lines</td>
                                    <td className="p-3 text-indigo-600">^\s*$\n?</td>
                                    <td className="p-3 text-slate-600">(leave empty)</td>
                                    <td className="p-3 font-sans text-slate-500">Compact raw text or logs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-sans font-medium text-slate-900">Mask Email Addresses</td>
                                    <td className="p-3 text-indigo-600">[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{"{2,}"}</td>
                                    <td className="p-3 text-slate-600">[REDACTED]</td>
                                    <td className="p-3 font-sans text-slate-500">PII and data sanitization</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-sans font-medium text-slate-900">Strip HTML Markup</td>
                                    <td className="p-3 text-indigo-600">&lt;[^&gt;]*&gt;</td>
                                    <td className="p-3 text-slate-600">(leave empty)</td>
                                    <td className="p-3 font-sans text-slate-500">Extract plain text from web documents</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-sans font-medium text-slate-900">Reorder Words (Capture Groups)</td>
                                    <td className="p-3 text-indigo-600">(\w+),\s*(\w+)</td>
                                    <td className="p-3 text-slate-600">$2 $1</td>
                                    <td className="p-3 font-sans text-slate-500">Convert "LastName, FirstName" to "FirstName LastName"</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Usage Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Perform Batch Text Replacements Step-by-Step
                        </h2>
                    </div>

                    <ol className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed list-decimal pl-5">
                        <li className="pl-1">
                            <strong>Paste or Upload Input Text:</strong> Insert your raw text, CSV data, HTML, or code snippet into the left panel input area, or click <em>Upload File</em> to load a local plain-text file.
                        </li>
                        <li className="pl-1">
                            <strong>Define Search Parameters:</strong> Enter the target string or regular expression in the <em>Find String / Pattern</em> field and specify your desired replacement text in the <em>Replace With</em> box.
                        </li>
                        <li className="pl-1">
                            <strong>Configure Search Flags:</strong> Enable <em>Regex Mode</em> if using wildcards/patterns, toggle <em>Match Case</em> for case sensitivity, or select <em>Replace All</em> to update every occurrence across the document.
                        </li>
                        <li className="pl-1">
                            <strong>Review Output & Export:</strong> View transformed output instantly in the right panel. Inspect the total match count counter, then click <em>Copy Output</em> or <em>Download .txt</em> to save your processed document.
                        </li>
                    </ol>
                </section>

                {/* Card 5: FAQ Section */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
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
                                How does literal text replacement differ from Regular Expression (Regex) substitution?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Literal text replacement searches for exact word or string character matches. Regular Expression (Regex) substitution enables pattern-based search, allowing users to locate wildcards, match email formats, isolate code variables, or clean up spacing dynamically.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my text data safe when using TwisterTools Text Replacer?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, 100%. All text transformations occur client-side in your local browser using modern JavaScript engines. No text content, raw input, or replacement results are ever transmitted to any remote server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I perform case-sensitive and multiline search and replace?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, our interactive workspace allows you to toggle Case Sensitive, Global Match (replace all vs. replace first), and Multiline flags seamlessly for both standard and regex searches.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do capture groups work in Regex replacement?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In Regex mode, you can use capture groups denoted by parentheses (e.g., (\w+)) in the Find pattern and reference them in the Replace input using $1, $2, etc., to reorder or reformat string components.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I process large files without crashing my browser?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Because processing runs directly in your device's V8 or JavaScript core engine, it handles tens of thousands of lines almost instantaneously without network lag or backend timeouts.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}