"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    ListOrdered,
    Copy,
    Check,
    Trash2,
    Download,
    FileText,
    Settings2,
    Hash,
    AlignLeft,
    WrapText,
    Sparkles,
    Code2,
    Layers,
    BookOpen,
    HelpCircle,
    Info,
    ArrowRightLeft,
    CheckCircle2,
    Split,
    SlidersHorizontal,
    Wand2,
    FileCode,
    RefreshCw
} from "lucide-react";

type NumberingFormat = "decimal" | "padded" | "roman" | "alpha" | "hex" | "binary";
type DelimiterType = "dot" | "colon" | "parenthesis" | "bracket" | "pipe" | "hyphen" | "space" | "custom";

interface PresetConfig {
    name: string;
    description: string;
    startNumber: number;
    increment: number;
    padWidth: number;
    format: NumberingFormat;
    delimiter: DelimiterType;
    customDelimiter: string;
    includeEmpty: boolean;
    trimLines: boolean;
    prefix: string;
    suffix: string;
}

const PRESETS: Record<string, PresetConfig> = {
    standardCode: {
        name: "Standard Code Listing",
        description: "Zero-padded 3-digit numbering with pipe separator",
        startNumber: 1,
        increment: 1,
        padWidth: 3,
        format: "padded",
        delimiter: "pipe",
        customDelimiter: "| ",
        includeEmpty: true,
        trimLines: false,
        prefix: "",
        suffix: ""
    },
    markdownList: {
        name: "Markdown / Documentation",
        description: "Standard 1. decimal numbering for markdown documents",
        startNumber: 1,
        increment: 1,
        padWidth: 1,
        format: "decimal",
        delimiter: "dot",
        customDelimiter: ". ",
        includeEmpty: false,
        trimLines: true,
        prefix: "",
        suffix: ""
    },
    legalOutline: {
        name: "Legal / Academic Outline",
        description: "Roman numerals with right parenthesis delimiter",
        startNumber: 1,
        increment: 1,
        padWidth: 1,
        format: "roman",
        delimiter: "parenthesis",
        customDelimiter: ") ",
        includeEmpty: false,
        trimLines: true,
        prefix: "Section ",
        suffix: ""
    },
    hexMemory: {
        name: "Hex / Memory Dump",
        description: "Hexadecimal memory-style offsets with colon notation",
        startNumber: 0,
        increment: 16,
        padWidth: 4,
        format: "hex",
        delimiter: "colon",
        customDelimiter: ": ",
        includeEmpty: true,
        trimLines: false,
        prefix: "0x",
        suffix: ""
    }
};

const SAMPLE_TEXT = `function calculateFibonacci(n) {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    let next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}

// Log 10th Fibonacci number
console.log("Fib(10):", calculateFibonacci(10));`;

const toRoman = (num: number): string => {
    if (num <= 0 || num > 3999) return num.toString();
    const lookup: Record<string, number> = {
        M: 1000, CM: 900, D: 500, CD: 400,
        C: 100, XC: 90, L: 50, XL: 40,
        X: 10, IX: 9, V: 5, IV: 4, I: 1
    };
    let roman = "";
    let n = num;
    for (const i in lookup) {
        while (n >= lookup[i]) {
            roman += i;
            n -= lookup[i];
        }
    }
    return roman;
};

const toAlpha = (num: number): string => {
    if (num <= 0) return num.toString();
    let result = "";
    let n = num;
    while (n > 0) {
        const rem = (n - 1) % 26;
        result = String.fromCharCode(65 + rem) + result;
        n = Math.floor((n - 1) / 26);
    }
    return result;
};

export default function LineNumberAdder() {
    // Primary Input/Output State
    const [inputText, setInputText] = useState<string>(SAMPLE_TEXT);
    const [copied, setCopied] = useState<boolean>(false);

    // Numbering Rules State
    const [startNumber, setStartNumber] = useState<number>(1);
    const [increment, setIncrement] = useState<number>(1);
    const [padWidth, setPadWidth] = useState<number>(2);
    const [format, setFormat] = useState<NumberingFormat>("padded");
    const [delimiter, setDelimiter] = useState<DelimiterType>("pipe");
    const [customDelimiter, setCustomDelimiter] = useState<string>(" | ");

    // Filtering & Text Transformation Flags
    const [includeEmpty, setIncludeEmpty] = useState<boolean>(true);
    const [trimLines, setTrimLines] = useState<boolean>(false);
    const [stripExistingNumbers, setStripExistingNumbers] = useState<boolean>(false);
    const [prefixText, setPrefixText] = useState<string>("");
    const [suffixText, setSuffixText] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Safe number handler avoiding stuck "0" prefix
    const handleNumberChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: number) => void,
        min = 0,
        max = 100000
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(min);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        if (isNaN(num)) {
            setter(min);
        } else {
            setter(Math.min(max, Math.max(min, num)));
        }
    };

    // Delimiter character mapping
    const resolvedDelimiter = useMemo(() => {
        switch (delimiter) {
            case "dot": return ". ";
            case "colon": return ": ";
            case "parenthesis": return ") ";
            case "bracket": return "] ";
            case "pipe": return " | ";
            case "hyphen": return " - ";
            case "space": return "   ";
            case "custom": return customDelimiter;
            default: return " | ";
        }
    }, [delimiter, customDelimiter]);

    // Format single numeric index
    const formatIndex = (indexVal: number, totalLinesCount: number): string => {
        switch (format) {
            case "decimal":
                return indexVal.toString();
            case "padded": {
                const targetWidth = Math.max(padWidth, totalLinesCount.toString().length);
                return indexVal.toString().padStart(targetWidth, "0");
            }
            case "roman":
                return toRoman(indexVal);
            case "alpha":
                return toAlpha(indexVal);
            case "hex":
                return indexVal.toString(16).toUpperCase().padStart(padWidth || 4, "0");
            case "binary":
                return indexVal.toString(2).padStart(padWidth || 8, "0");
            default:
                return indexVal.toString();
        }
    };

    // Process & compute numbered output text
    const processedOutput = useMemo(() => {
        if (!inputText) return "";

        const rawLines = inputText.split("\n");
        let currentNum = startNumber;

        return rawLines.map((line) => {
            let workingLine = line;

            // Optional: Strip existing line numbers (e.g. "1. ", "001 | ", "12: ")
            if (stripExistingNumbers) {
                workingLine = workingLine.replace(/^\s*(\d+|[A-Z]+|[ivxlcdm]+)[\.\:\)\|\-\]\s]+/i, "");
            }

            if (trimLines) {
                workingLine = workingLine.trim();
            }

            const isEmpty = workingLine.trim().length === 0;

            if (isEmpty && !includeEmpty) {
                return ""; // Preserve empty space without prepending numbering
            }

            const formattedNum = formatIndex(currentNum, rawLines.length);
            const lineOutput = `${prefixText}${formattedNum}${suffixText}${resolvedDelimiter}${workingLine}`;
            currentNum += increment;
            return lineOutput;
        }).join("\n");
    }, [
        inputText,
        startNumber,
        increment,
        padWidth,
        format,
        resolvedDelimiter,
        includeEmpty,
        trimLines,
        stripExistingNumbers,
        prefixText,
        suffixText
    ]);

    // Statistics computation
    const stats = useMemo(() => {
        const rawLines = inputText ? inputText.split("\n") : [];
        const totalLines = rawLines.length;
        const emptyLines = rawLines.filter((l) => l.trim().length === 0).length;
        const totalChars = inputText.length;
        const totalWords = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
        return { totalLines, emptyLines, totalChars, totalWords };
    }, [inputText]);

    // Actions
    const handleCopy = async () => {
        if (!processedOutput) return;
        try {
            await navigator.clipboard.writeText(processedOutput);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard write error handling
        }
    };

    const handleDownload = () => {
        if (!processedOutput) return;
        const blob = new Blob([processedOutput], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "numbered-source-code.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target?.result;
            if (typeof content === "string") {
                setInputText(content);
            }
        };
        reader.readAsText(file);
    };

    const applyPreset = (presetKey: string) => {
        const p = PRESETS[presetKey];
        if (!p) return;
        setStartNumber(p.startNumber);
        setIncrement(p.increment);
        setPadWidth(p.padWidth);
        setFormat(p.format);
        setDelimiter(p.delimiter);
        setCustomDelimiter(p.customDelimiter);
        setIncludeEmpty(p.includeEmpty);
        setTrimLines(p.trimLines);
        setPrefixText(p.prefix);
        setSuffixText(p.suffix);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Line Number Adder & Source Code Formatter",
        "url": "https://twistertools.com/tools/text-tools/line-number-adder",
        "description": "Add customizable line numbers, custom delimiters, zero-padding, hex/roman notation, and formatting prefixes to source code and text documents in real time.",
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
                "name": "How does the Line Number Adder format source code and text listings?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool parses input text line-by-line in your local browser, applying customizable mathematical sequences (decimal, zero-padded, roman, alphabetical, hexadecimal, or binary), custom delimiters (pipes, dots, colons, brackets), and prefix/suffix tags without transmitting any data over the network."
                }
            },
            {
                "@type": "Question",
                "name": "Can I remove existing line numbers before adding new ones?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Enabling the 'Strip Existing Line Numbers' option automatically strips preceding decimal numbers, roman numerals, and common delimiter prefixes from every line before applying your fresh formatting configuration."
                }
            },
            {
                "@type": "Question",
                "name": "What is the benefit of zero-padded line numbers for technical documentation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Zero-padding (e.g., 001, 002, ..., 100) ensures uniform character width and horizontal alignment across all code lines in monospaced fonts, preventing visual jitter and misaligned indentation in printed reports, PDFs, and Markdown documentation."
                }
            },
            {
                "@type": "Question",
                "name": "Is my proprietary code or sensitive document data secure when using this tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "100% secure. All text parsing, line manipulation, and file downloads are executed entirely client-side inside your browser via JavaScript. Zero text bytes are sent to external servers or cloud storage."
                }
            },
            {
                "@type": "Question",
                "name": "How does the tool handle blank and whitespace-only lines?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can toggle the 'Number Empty Lines' switch. When enabled, empty lines receive sequential numbers like standard code editors. When disabled, empty lines remain clean spacing gaps while maintaining the sequential count for the next non-empty line."
                }
            },
            {
                "@type": "Question",
                "name": "Can I format hex offsets or legal-style section outlines?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Built-in presets allow one-click setup for Legal/Academic Roman outlines (Section I, Section II), Hex Memory dumps (0x0000, 0x0010), Markdown ordered lists, and custom engineering formats with flexible step increments."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Presets Quick-Select Strip */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                        Quick Workflow Presets
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">One-click style application</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {Object.entries(PRESETS).map(([key, p]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => applyPreset(key)}
                            className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/60 hover:bg-indigo-50/40 text-left transition cursor-pointer group"
                        >
                            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 block mb-0.5">
                                {p.name}
                            </span>
                            <span className="text-[11px] text-slate-500 line-clamp-1 block">
                                {p.description}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Granular Configuration Controls Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                            Numbering & Delimiter Rules
                        </h2>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Client-Side Engine</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Numbering Format */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Numbering Sequence</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as NumberingFormat)}
                            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="padded">Zero-Padded (001, 002, 003)</option>
                            <option value="decimal">Standard Decimal (1, 2, 3)</option>
                            <option value="roman">Roman Numerals (I, II, III)</option>
                            <option value="alpha">Alphabetical (A, B, C... AA)</option>
                            <option value="hex">Hexadecimal (0x01, 0x02)</option>
                            <option value="binary">Binary (00000001)</option>
                        </select>
                    </div>

                    {/* Delimiter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Delimiter Separator</label>
                        <select
                            value={delimiter}
                            onChange={(e) => setDelimiter(e.target.value as DelimiterType)}
                            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="pipe">Pipe (" | ")</option>
                            <option value="dot">Dot Period (". ")</option>
                            <option value="colon">Colon (": ")</option>
                            <option value="parenthesis">Parenthesis (") ")</option>
                            <option value="bracket">Right Bracket ("] ")</option>
                            <option value="hyphen">Hyphen Dash (" - ")</option>
                            <option value="space">Spaces ("   ")</option>
                            <option value="custom">Custom String</option>
                        </select>
                    </div>

                    {/* Start Number & Increment */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Start Index</label>
                            <input
                                type="number"
                                min={0}
                                max={100000}
                                value={startNumber}
                                onChange={(e) => handleNumberChange(e, setStartNumber, 0, 100000)}
                                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Step / Incr</label>
                            <input
                                type="number"
                                min={1}
                                max={1000}
                                value={increment}
                                onChange={(e) => handleNumberChange(e, setIncrement, 1, 1000)}
                                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Zero-Pad Width */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-700">Padding Width</label>
                            <span className="text-[11px] font-mono text-indigo-600 font-bold">{padWidth} Digits</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={8}
                            step={1}
                            value={padWidth}
                            onChange={(e) => setPadWidth(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                        />
                    </div>
                </div>

                {/* Additional Formatting Modifiers & Toggles */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    {delimiter === "custom" && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">Custom Separator</label>
                            <input
                                type="text"
                                value={customDelimiter}
                                onChange={(e) => setCustomDelimiter(e.target.value)}
                                placeholder="e.g.  >>> "
                                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Prefix (Optional)</label>
                        <input
                            type="text"
                            value={prefixText}
                            onChange={(e) => setPrefixText(e.target.value)}
                            placeholder="e.g. Line #"
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Suffix (Optional)</label>
                        <input
                            type="text"
                            value={suffixText}
                            onChange={(e) => setSuffixText(e.target.value)}
                            placeholder="e.g. :"
                            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                    </div>

                    {/* Checkbox Toggles */}
                    <div className="space-y-2 col-span-1 sm:col-span-2 lg:col-span-1 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={includeEmpty}
                                onChange={(e) => setIncludeEmpty(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span>Number Empty Lines</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={trimLines}
                                onChange={(e) => setTrimLines(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span>Trim Whitespace Indents</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={stripExistingNumbers}
                                onChange={(e) => setStripExistingNumbers(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span>Strip Existing Line Numbers</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Raw Input Text Area */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    Raw Source Text / Code
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".txt,.js,.ts,.tsx,.jsx,.html,.css,.json,.py,.java,.c,.cpp,.md,.sql"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                                    title="Upload text or code file"
                                >
                                    <FileCode className="w-3.5 h-3.5" />
                                    <span>Upload File</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputText("")}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                    title="Clear input"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your source code, list items, or documentation here..."
                            rows={18}
                            className="w-full p-3.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-y text-slate-800 leading-relaxed min-h-[380px]"
                            spellCheck={false}
                        />
                    </div>

                    {/* Input Metrics Footer */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 font-mono">
                        <div className="flex items-center gap-3">
                            <span>Lines: <strong className="text-slate-800">{stats.totalLines}</strong></span>
                            <span>Empty: <strong className="text-slate-800">{stats.emptyLines}</strong></span>
                            <span>Words: <strong className="text-slate-800">{stats.totalWords}</strong></span>
                        </div>
                        <span>Chars: <strong className="text-slate-800">{stats.totalChars}</strong></span>
                    </div>
                </div>

                {/* Right Workspace Panel: Formatted Output Text Area */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    Numbered Output Result
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    disabled={!processedOutput}
                                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? "Copied!" : "Copy Result"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    disabled={!processedOutput}
                                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download .txt</span>
                                </button>
                            </div>
                        </div>

                        <textarea
                            readOnly
                            value={processedOutput}
                            placeholder="Numbered code output will render automatically here..."
                            rows={18}
                            className="w-full p-3.5 text-xs sm:text-sm font-mono bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl outline-none resize-y leading-relaxed min-h-[380px] selection:bg-indigo-500 selection:text-white"
                            spellCheck={false}
                        />
                    </div>

                    {/* Output Footer Summary */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Rendered using <strong className="text-indigo-600 uppercase font-mono">{format}</strong> style & delimiter
                        </span>
                        <span className="font-semibold text-emerald-600">Zero-Latency Client Render</span>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Tool Overview & Capabilities */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is the Line Number Adder? Architecture, Use Cases, and Code Formatting
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The Line Number Adder & Source Code Formatter is an enterprise-grade developer utility designed to inject precise, custom numerical sequencing into plain text, source code files, logs, and markdown documentation. When preparing code snippets for academic publications, legal patent filings, technical books, or team peer reviews, maintaining unambiguous line references is essential.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unlike basic text editors that offer fixed line-number margins that cannot be copied or exported, this browser-native tool embeds line numbers directly into the textual data stream. With granular controls for zero-padding, step increments, hexadecimal offsets, roman numerals, and custom structural delimiters, you can tailor your listings to fit any style guide or publication standard in milliseconds.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Feature I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Monospace Zero-Padding</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Formats line sequences with dynamic leading zeros (e.g., 001, 002) ensuring perfect horizontal alignment in printed code and monospaced terminal fonts.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Feature II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Multi-Format Sequences</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Seamlessly switch between decimal integers, uppercase Roman numerals, alphabetical letters, hexadecimal memory offsets, and binary indexes.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Feature III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Automated Number Stripper</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Cleanly removes existing line numbering, timestamps, and list symbols from copied code before applying fresh formatting rules.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Numbering Formats & Notation Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Supported Numbering Schemes & Technical Delimiter Formats
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Different technical domains demand specific numbering conventions. The table below outlines the primary formats supported by the engine along with their intended applications:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Sequence Format</th>
                                    <th className="p-3">Example Syntax</th>
                                    <th className="p-3">Default Delimiter</th>
                                    <th className="p-3">Padding Logic</th>
                                    <th className="p-3">Ideal Engineering Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Zero-Padded Decimal</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">001 | 002 | 003</td>
                                    <td className="p-3 font-mono text-slate-600">Pipe (" | ")</td>
                                    <td className="p-3 text-xs">Dynamic or Fixed (1-8)</td>
                                    <td className="p-3 text-xs text-slate-600">Source code prints, PDF architecture diagrams, GitHub issue references</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Standard Decimal</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">1. , 2. , 3.</td>
                                    <td className="p-3 font-mono text-slate-600">Dot (". ")</td>
                                    <td className="p-3 text-xs">Unpadded</td>
                                    <td className="p-3 text-xs text-slate-600">Markdown lists, task roadmaps, sequential instructional manuals</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Roman Numerals</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">I) , II) , III)</td>
                                    <td className="p-3 font-mono text-slate-600">Parenthesis (") ")</td>
                                    <td className="p-3 text-xs">Standard Roman (I-MMM)</td>
                                    <td className="p-3 text-xs text-slate-600">Legal contracts, patent documentation, academic paper section outlines</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Hexadecimal Offsets</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">0x0000: , 0x0010:</td>
                                    <td className="p-3 font-mono text-slate-600">Colon (": ")</td>
                                    <td className="p-3 text-xs">Byte/Word Padded</td>
                                    <td className="p-3 text-xs text-slate-600">Binary disassembly, memory dump audits, low-level firmware debugging</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Alphabetical Index</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">A - , B - , C -</td>
                                    <td className="p-3 font-mono text-slate-600">Hyphen (" - ")</td>
                                    <td className="p-3 text-xs">Base-26 Alphabetical</td>
                                    <td className="p-3 text-xs text-slate-600">Survey questionnaires, multiple-choice quiz generators, spreadsheet lists</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Step-by-Step Practical Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ListOrdered className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Guide: How to Format and Prepend Line Numbers
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow this four-step workflow to prepare formatted source listings and text documents:
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Paste or Upload Raw Content</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Paste your code snippet or document directly into the left workspace panel, or click <strong>Upload File</strong> to import files in TXT, JS, TS, HTML, CSS, PY, MD, or JSON format.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Select Preset or Configure Delimiters</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Choose one of the <strong>Quick Workflow Presets</strong> (e.g., Standard Code, Markdown, Legal Outline, or Hex Dump), or customize start index, increments, zero-pad width, and separator characters.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Adjust Whitespace and Stripping Flags</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Enable <strong>Strip Existing Line Numbers</strong> if your input already has stale prefixes, and toggle <strong>Number Empty Lines</strong> depending on whether empty rows should receive sequential markers.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Copy or Export Clean Numbered Code</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Click <strong>Copy Result</strong> to copy the output directly to your system clipboard, or click <strong>Download .txt</strong> to save the formatted document for local archiving.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Professional Use Cases & Benefits */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Applications Across Technical Disciplines
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Academic Papers & Theses</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Computer science journals and IEEE conference papers require line-numbered listings for peer reviewers to reference specific algorithms during feedback cycles.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Legal & Patent Filings</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Software patent applications require strict line-numbered source exhibits and Roman-numbered outline clauses for precise intellectual property claims.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Technical Publishing</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Authors formatting programming books, tutorial PDF guides, and e-learning coursework need zero-padded listings that do not wrap or lose indentation across layouts.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                How does the Line Number Adder format source code and text listings?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool parses input text line-by-line in your local browser, applying customizable mathematical sequences (decimal, zero-padded, roman, alphabetical, hexadecimal, or binary), custom delimiters (pipes, dots, colons, brackets), and prefix/suffix tags without transmitting any data over the network.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I remove existing line numbers before adding new ones?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Enabling the "Strip Existing Line Numbers" option automatically strips preceding decimal numbers, roman numerals, and common delimiter prefixes from every line before applying your fresh formatting configuration.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the benefit of zero-padded line numbers for technical documentation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Zero-padding (e.g., 001, 002, ..., 100) ensures uniform character width and horizontal alignment across all code lines in monospaced fonts, preventing visual jitter and misaligned indentation in printed reports, PDFs, and Markdown documentation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my proprietary code or sensitive document data secure when using this tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                100% secure. All text parsing, line manipulation, and file downloads are executed entirely client-side inside your browser via JavaScript. Zero text bytes are sent to external servers or cloud storage.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the tool handle blank and whitespace-only lines?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can toggle the "Number Empty Lines" switch. When enabled, empty lines receive sequential numbers like standard code editors. When disabled, empty lines remain clean spacing gaps while maintaining the sequential count for the next non-empty line.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I format hex offsets or legal-style section outlines?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Built-in presets allow one-click setup for Legal/Academic Roman outlines (Section I, Section II), Hex Memory dumps (0x0000, 0x0010), Markdown ordered lists, and custom engineering formats with flexible step increments.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}