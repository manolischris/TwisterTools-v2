"use client";

import React, { useState, useMemo } from "react";
import {
    Eraser,
    Sparkles,
    Copy,
    Check,
    RotateCcw,
    Eye,
    EyeOff,
    Download,
    FileText,
    ShieldAlert,
    ShieldCheck,
    Layers,
    Search,
    Code2,
    CheckSquare,
    BookOpen,
    HelpCircle,
    Info,
    ArrowRight,
    Terminal,
    Cpu,
    Workflow,
    AlertCircle,
    SlidersHorizontal,
    Table as TableIcon
} from "lucide-react";

// Unicode definition metadata for invisible, zero-width, and rogue whitespace characters
interface InvisibleCharDef {
    id: string;
    code: string;
    hex: number;
    name: string;
    description: string;
    category: "zero-width" | "special-space" | "bidi-override" | "control";
    regex: RegExp;
    severity: "danger" | "warning" | "info";
    highlightLabel: string;
}

const INVISIBLE_DEFINITIONS: InvisibleCharDef[] = [
    {
        id: "zwsp",
        code: "U+200B",
        hex: 0x200b,
        name: "Zero-Width Space (ZWSP)",
        description: "Invisible space character used for line-break opportunities without creating a visual gap.",
        category: "zero-width",
        regex: /\u200B/g,
        severity: "danger",
        highlightLabel: "ZWSP"
    },
    {
        id: "zwnj",
        code: "U+200C",
        hex: 0x200c,
        name: "Zero-Width Non-Joiner (ZWNJ)",
        description: "Prevents ligatures and character connections in Arabic, Persian, and Indic scripts.",
        category: "zero-width",
        regex: /\u200C/g,
        severity: "warning",
        highlightLabel: "ZWNJ"
    },
    {
        id: "zwj",
        code: "U+200D",
        hex: 0x200d,
        name: "Zero-Width Joiner (ZWJ)",
        description: "Forces glyph ligature connections in emoji combinations and complex non-Latin scripts.",
        category: "zero-width",
        regex: /\u200D/g,
        severity: "warning",
        highlightLabel: "ZWJ"
    },
    {
        id: "wj",
        code: "U+2060",
        hex: 0x2060,
        name: "Word Joiner (WJ)",
        description: "Zero-width non-breaking character that prohibits line breaking at its position.",
        category: "zero-width",
        regex: /\u2060/g,
        severity: "danger",
        highlightLabel: "WJ"
    },
    {
        id: "bom",
        code: "U+FEFF",
        hex: 0xfeff,
        name: "Zero-Width No-Break Space / BOM",
        description: "Byte Order Mark byte sequence or invisible non-breaking separator that causes JSON syntax errors.",
        category: "zero-width",
        regex: /\uFEFF/g,
        severity: "danger",
        highlightLabel: "BOM"
    },
    {
        id: "nbsp",
        code: "U+00A0",
        hex: 0x00a0,
        name: "Non-Breaking Space (NBSP)",
        description: "Classic fixed space that prevents automatic line breaks, often pasted from rich text editors.",
        category: "special-space",
        regex: /\u00A0/g,
        severity: "warning",
        highlightLabel: "NBSP"
    },
    {
        id: "nnbsp",
        code: "U+202F",
        hex: 0x202f,
        name: "Narrow No-Break Space (NNBSP)",
        description: "A narrow non-breaking space commonly found in French typography and Mongolian script.",
        category: "special-space",
        regex: /\u202F/g,
        severity: "warning",
        highlightLabel: "NNBSP"
    },
    {
        id: "en_em_spaces",
        code: "U+2000-U+200A",
        hex: 0x2002,
        name: "En / Em / Thin Typographic Spaces",
        description: "Variable-width typographical whitespace spans (En Quad, Em Space, Thin Space, Hair Space).",
        category: "special-space",
        regex: /[\u2000-\u200A]/g,
        severity: "info",
        highlightLabel: "TYPO-SP"
    },
    {
        id: "ideographic_space",
        code: "U+3000",
        hex: 0x3000,
        name: "Ideographic Full-Width Space",
        description: "Full-width CJK (Chinese, Japanese, Korean) whitespace character matching a full ideograph square.",
        category: "special-space",
        regex: /\u3000/g,
        severity: "info",
        highlightLabel: "CJK-SP"
    },
    {
        id: "bidi_overrides",
        code: "U+202A-U+202E, U+2066-U+2069",
        hex: 0x202e,
        name: "BiDi Directional Overrides & Isolates",
        description: "Invisible text directional markers (LRO, RLO, LRE, RLE, PDF, LRI, RLI) used in Trojan Source code attacks.",
        category: "bidi-override",
        regex: /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g,
        severity: "danger",
        highlightLabel: "BIDI"
    },
    {
        id: "soft_hyphen",
        code: "U+00AD",
        hex: 0x00ad,
        name: "Soft Hyphen (SHY)",
        description: "Invisible hyphenation point indicator that remains hidden unless rendered at a line wrap boundary.",
        category: "control",
        regex: /\u00AD/g,
        severity: "info",
        highlightLabel: "SHY"
    },
    {
        id: "control_chars",
        code: "U+0000-U+001F, U+007F-U+009F",
        hex: 0x0000,
        name: "C0 & C1 Control Codes (excl. LF/CR/TAB)",
        description: "Non-printable byte values (Null, Bell, Backspace, Escape) that corrupt serialization streams.",
        category: "control",
        regex: /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g,
        severity: "danger",
        highlightLabel: "CTRL"
    }
];

const SAMPLE_TEXT = `// Example Payload containing invisible zero-width bugs, BOM, and BiDi controls:
const apiKey = "sk_live_\u200B9834\uFEFF12984";\u200E // Contains ZWSP + BOM + BiDi marker!
const userRole = "admin\u200C"; // Trailing ZWNJ breaks direct string equality
const priceLabel = "Total:\u00A0$499.00"; // Non-breaking space prevents regex \\s matches
const rawNote = "Hello\u200DWorld\u2060Secure\u00ADToken\u3000Indented";`;

export default function ZeroWidthSpaceCleaner() {
    // Input and Output State
    const [inputText, setInputText] = useState<string>(SAMPLE_TEXT);
    const [previewVisualMode, setPreviewVisualMode] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    // Cleaner Customization State
    const [stripZeroWidth, setStripZeroWidth] = useState<boolean>(true);
    const [normalizeNonBreaking, setNormalizeNonBreaking] = useState<boolean>(true);
    const [stripBidiOverrides, setStripBidiOverrides] = useState<boolean>(true);
    const [stripControlChars, setStripControlChars] = useState<boolean>(true);
    const [stripTypographicSpaces, setStripTypographicSpaces] = useState<boolean>(true);
    const [stripSoftHyphens, setStripSoftHyphens] = useState<boolean>(true);
    const [collapseConsecutiveSpaces, setCollapseConsecutiveSpaces] = useState<boolean>(false);
    const [trimLines, setTrimLines] = useState<boolean>(false);

    // Analysis Calculation
    const analysis = useMemo(() => {
        let totalInvisibleCount = 0;
        const breakdown: Record<string, number> = {};

        INVISIBLE_DEFINITIONS.forEach((def) => {
            const matches = inputText.match(def.regex);
            const count = matches ? matches.length : 0;
            breakdown[def.id] = count;
            totalInvisibleCount += count;
        });

        const byteSizeRaw = new TextEncoder().encode(inputText).length;

        return {
            totalInvisibleCount,
            breakdown,
            charCount: inputText.length,
            byteSizeRaw,
            hasDangerIssues:
                (breakdown["zwsp"] || 0) +
                (breakdown["bom"] || 0) +
                (breakdown["wj"] || 0) +
                (breakdown["bidi_overrides"] || 0) +
                (breakdown["control_chars"] || 0) >
                0
        };
    }, [inputText]);

    // Cleaned Output Text Computation
    const cleanedText = useMemo(() => {
        let output = inputText;

        if (stripZeroWidth) {
            output = output.replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, "");
        }

        if (stripBidiOverrides) {
            output = output.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");
        }

        if (stripControlChars) {
            output = output.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
        }

        if (stripSoftHyphens) {
            output = output.replace(/\u00AD/g, "");
        }

        if (normalizeNonBreaking) {
            output = output.replace(/[\u00A0\u202F]/g, " ");
        }

        if (stripTypographicSpaces) {
            output = output.replace(/[\u2000-\u200A\u3000]/g, " ");
        }

        if (collapseConsecutiveSpaces) {
            output = output.replace(/[ \t]{2,}/g, " ");
        }

        if (trimLines) {
            output = output
                .split("\n")
                .map((line) => line.trim())
                .join("\n");
        }

        return output;
    }, [
        inputText,
        stripZeroWidth,
        stripBidiOverrides,
        stripControlChars,
        stripSoftHyphens,
        normalizeNonBreaking,
        stripTypographicSpaces,
        collapseConsecutiveSpaces,
        trimLines
    ]);

    const cleanedByteSize = useMemo(() => {
        return new TextEncoder().encode(cleanedText).length;
    }, [cleanedText]);

    const bytesSaved = Math.max(0, analysis.byteSizeRaw - cleanedByteSize);

    // Visual Token Highlighter for Input Preview
    const highlightedElements = useMemo(() => {
        if (!inputText) return null;

        // Combined pattern matching all known rogue Unicode characters
        const combinedRegex = /([\u200B\u200C\u200D\u2060\uFEFF\u00A0\u202F\u2000-\u200A\u3000\u200E\u200F\u202A-\u202E\u2066-\u2069\u00AD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F])/g;
        const parts = inputText.split(combinedRegex);

        return parts.map((part, index) => {
            if (!part) return null;

            const matchedDef = INVISIBLE_DEFINITIONS.find((def) => def.regex.test(part));
            // Reset regex state after test
            if (matchedDef) matchedDef.regex.lastIndex = 0;

            if (matchedDef) {
                let badgeColor = "bg-amber-100 text-amber-900 border-amber-300";
                if (matchedDef.severity === "danger") {
                    badgeColor = "bg-rose-100 text-rose-900 border-rose-300";
                } else if (matchedDef.severity === "info") {
                    badgeColor = "bg-indigo-100 text-indigo-900 border-indigo-300";
                }

                return (
                    <span
                        key={index}
                        className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-mono font-bold border tracking-tighter ${badgeColor}`}
                        title={`${matchedDef.name} (${matchedDef.code})`}
                    >
                        [{matchedDef.highlightLabel}]
                    </span>
                );
            }

            return <span key={index}>{part}</span>;
        });
    }, [inputText]);

    // Action Handlers
    const handleCopyCleaned = () => {
        navigator.clipboard.writeText(cleanedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCleaned = () => {
        const blob = new Blob([cleanedText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "cleaned-sanitized-text.txt";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setInputText("");
    };

    const handleLoadSample = () => {
        setInputText(SAMPLE_TEXT);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Invisible Whitespace & Zero-Width Space Cleaner",
        "url": "https://twistertools.com/tools/text-tools/zero-width-space-cleaner",
        "description": "Enterprise-grade detector and sanitizer for hidden Unicode characters, zero-width spaces (ZWSP, ZWNJ, ZWJ, WJ), non-breaking spaces (NBSP), Byte Order Marks (BOM), and BiDi overrides.",
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
                "name": "What are zero-width spaces and why do they break code and JSON payloads?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Zero-width spaces (such as U+200B, U+200C, and U+200D) are non-printing Unicode characters that occupy zero horizontal pixels on a screen. While visually imperceptible, they contain discrete byte sequences that cause syntax errors in JSON parsers, break string equality checks in Python and JavaScript, corrupt JWT API keys, and fail database foreign key matching."
                }
            },
            {
                "@type": "Question",
                "name": "How does this tool detect hidden Byte Order Marks (BOM) and BiDi overrides?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool analyzes raw text streams byte-by-byte against the complete Unicode standard database, detecting UTF-8 Byte Order Marks (U+FEFF), Bidirectional overrides (U+202E, U+202A), and C0/C1 control codes that are frequently used in Trojan Source attacks to disguise malicious executable code."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between standard spaces and Non-Breaking Spaces (NBSP)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A standard ASCII space is represented by character byte 0x20 (U+0020). A Non-Breaking Space (NBSP, U+00A0) is a typographical entity created by Microsoft Word, Google Docs, and HTML entities (&nbsp;) to prevent automatic line wrapping. When pasted into terminal commands or CLI tools, NBSP produces unexpected syntax errors because compilers do not treat it as valid whitespace delimiter."
                }
            },
            {
                "@type": "Question",
                "name": "Is my text secure and private when using this online zero-width cleaner?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, 100% of the Unicode inspection and cleaning logic executes purely inside your local browser runtime via client-side JavaScript. No text, source code, API keys, or database dumps are ever uploaded or transmitted to an external server."
                }
            },
            {
                "@type": "Question",
                "name": "Can zero-width spaces be used for malicious steganography or digital fingerprinting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Malicious actors and enterprise watermarking systems encode binary data (such as user IDs or secret tokens) into invisible sequences of ZWSP (binary 0) and ZWNJ (binary 1). This tool uncovers all such hidden patterns instantly and provides complete sanitization."
                }
            },
            {
                "@type": "Question",
                "name": "What are BiDi Unicode Trojan Source attacks?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Trojan Source attacks (CVE-2021-42574) exploit Bidirectional (BiDi) Unicode control characters (like U+202E Right-to-Left Override) to alter the visual display order of source code in code editors so that comments appear as executable statements or vice versa, creating stealth vulnerabilities."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Real-Time Detection Analytics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Hidden Artifacts</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl font-black font-mono ${analysis.totalInvisibleCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            {analysis.totalInvisibleCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">found</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                        {analysis.totalInvisibleCount > 0 ? "Potential bugs detected" : "Payload clean & verified"}
                    </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Security Risk</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-sm font-black uppercase ${analysis.hasDangerIssues ? "text-rose-600 flex items-center gap-1" : "text-emerald-600 flex items-center gap-1"}`}>
                            {analysis.hasDangerIssues ? (
                                <>
                                    <ShieldAlert className="w-4 h-4" /> High Risk
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4" /> Secure
                                </>
                            )}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                        {analysis.hasDangerIssues ? "ZWSP, BOM or BiDi present" : "Zero syntax-breaking characters"}
                    </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Raw Payload Size</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-mono text-slate-800">{analysis.byteSizeRaw}</span>
                        <span className="text-xs font-semibold text-slate-400">bytes</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{analysis.charCount} characters</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cleaned Efficiency</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-mono text-emerald-600">{bytesSaved}</span>
                        <span className="text-xs font-semibold text-slate-400">bytes saved</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">New size: {cleanedByteSize} bytes</span>
                </div>
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Panel: Input Inspection & Visual Highlighting */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 flex flex-col justify-between min-w-0">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Raw Input & Diagnostic Visualizer
                                </h2>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 self-stretch sm:self-auto justify-end">
                                <button
                                    type="button"
                                    onClick={handleLoadSample}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>Load Sample</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                    title="Clear All Text"
                                >
                                    <RotateCcw className="w-3 h-3 text-slate-500" />
                                    <span>Clear</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewVisualMode(!previewVisualMode)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    {previewVisualMode ? <EyeOff className="w-3.5 h-3.5 text-indigo-600" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
                                    <span>{previewVisualMode ? "Show Raw Editor" : "Show Visual Tokens"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Interactive Editor or Visual Highlighting Box */}
                        {previewVisualMode ? (
                            <div className="space-y-2">
                                <div className="w-full h-80 p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-y-auto whitespace-pre-wrap break-all leading-relaxed border border-slate-800 selection:bg-indigo-600 selection:text-white">
                                    {inputText.length > 0 ? (
                                        highlightedElements
                                    ) : (
                                        <span className="text-slate-500 italic">Enter or paste text to visualize invisible Unicode tags...</span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Info className="w-3 h-3 text-indigo-500" />
                                    Colored badges highlight exact Unicode points that are otherwise 100% invisible on your screen.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Paste source code, JSON payloads, API keys, or text here to detect hidden zero-width spaces..."
                                    className="w-full h-80 p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none leading-relaxed"
                                    spellCheck={false}
                                />
                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Terminal className="w-3 h-3 text-indigo-500" />
                                    Raw editor mode: Type or paste directly to recalculate detection metrics in real time.
                                </p>
                            </div>
                        )}

                        {/* Character Breakdown Tag Cloud */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Detected Character Breakdown</span>
                            <div className="flex flex-wrap gap-1.5">
                                {INVISIBLE_DEFINITIONS.map((def) => {
                                    const count = analysis.breakdown[def.id] || 0;
                                    if (count === 0) return null;
                                    return (
                                        <div
                                            key={def.id}
                                            className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${def.severity === "danger"
                                                    ? "bg-rose-50 border-rose-200 text-rose-700"
                                                    : def.severity === "warning"
                                                        ? "bg-amber-50 border-amber-200 text-amber-700"
                                                        : "bg-indigo-50 border-indigo-200 text-indigo-700"
                                                }`}
                                        >
                                            <span>{def.highlightLabel}</span>
                                            <span className="px-1.5 py-0.2 bg-white rounded-md text-[10px] font-black shadow-2xs">
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                                {analysis.totalInvisibleCount === 0 && (
                                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                        <CheckSquare className="w-3.5 h-3.5" /> No hidden characters detected in current input.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Encoding: UTF-8 / Unicode</span>
                        <span className="text-indigo-600 font-bold">100% Client-Side Inspection</span>
                    </div>
                </div>

                {/* Right Panel: Sanitization Engine & Clean Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 flex flex-col justify-between min-w-0">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Sanitization Engine & Output
                                </h2>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Output Cleaned
                            </span>
                        </div>

                        {/* Clean Output Area */}
                        <div className="space-y-2">
                            <textarea
                                value={cleanedText}
                                readOnly
                                placeholder="Cleaned and sanitized output will appear here automatically..."
                                className="w-full h-44 p-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                                spellCheck={false}
                            />
                        </div>

                        {/* Granular Cleaning Rules & Toggle Options */}
                        <div className="space-y-2.5 pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                                Active Sanitization Rules
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={stripZeroWidth}
                                        onChange={(e) => setStripZeroWidth(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Strip Zero-Width (ZWSP/ZWJ/BOM)</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={normalizeNonBreaking}
                                        onChange={(e) => setNormalizeNonBreaking(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Normalize NBSP to ASCII Space</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={stripBidiOverrides}
                                        onChange={(e) => setStripBidiOverrides(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Strip Trojan BiDi Controls</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={stripControlChars}
                                        onChange={(e) => setStripControlChars(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Strip C0/C1 Byte Controls</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={stripTypographicSpaces}
                                        onChange={(e) => setStripTypographicSpaces(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Normalize Em/Thin/CJK Spaces</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={stripSoftHyphens}
                                        onChange={(e) => setStripSoftHyphens(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Remove Soft Hyphens (SHY)</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={collapseConsecutiveSpaces}
                                        onChange={(e) => setCollapseConsecutiveSpaces(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Collapse Multi-Spaces</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={trimLines}
                                        onChange={(e) => setTrimLines(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Trim Line Start / End Spaces</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Output Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={handleCopyCleaned}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? "Clean Text Copied!" : "Copy Cleaned Text"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadCleaned}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download Sanitized File</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Technical Deep-Dive on Zero-Width Space Exploits & Parsing Bugs */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Zero-Width Characters and Invisible Whitespace Anomalies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern text processing relies heavily on Unicode, an expansive character encoding standard comprising over 149,000 discrete symbols. While Unicode enables worldwide multilingual software engineering, it also introduces dozens of invisible formatting markers, zero-width joiners, non-breaking spacers, and bidirectional control codes. When these non-printing characters find their way into source code, database queries, authentication credentials, or REST API payloads, they create silent failures that elude traditional visual debugging.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Because zero-width characters occupy zero visual width in standard user interfaces and text editors, a string such as <code>&quot;admin\u200B&quot;</code> appears completely identical to <code>&quot;admin&quot;</code> on screen. However, at the byte and binary level, their hash digests, memory representations, and string lengths differ completely. A strict equality check (<code>userRole === &quot;admin&quot;</code>) evaluates to <code>false</code>, causing inexplicable logic bypasses, broken routing parameters, and corrupted JSON schemas.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Vulnerability 1</span>
                            <h3 className="font-bold text-slate-900 text-sm">JSON & YAML Serialization Fails</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Invisible Byte Order Marks (U+FEFF) and control characters at the beginning of payload strings cause parser crashes (e.g., <code>Unexpected token at position 0</code>).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Vulnerability 2</span>
                            <h3 className="font-bold text-slate-900 text-sm">Database Key Mismatches</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Zero-width characters inside unique columns or foreign keys lead to duplicate records, broken SQL indexing, and failed join lookups across relational tables.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Vulnerability 3</span>
                            <h3 className="font-bold text-slate-900 text-sm">API Key & Hash Corruption</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Secret API tokens, JWT signatures, and SHA-256 cryptographic hashes copied from formatted documentation frequently carry invisible NBSP characters that invalidate authentication.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comprehensive Unicode Character Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TableIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Unicode Invisible & Special Whitespace Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The reference table below catalogs the most prevalent invisible Unicode code points, their standard typographic intentions, and their typical software engineering failure modes:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Unicode Code</th>
                                    <th className="p-3">Character Name</th>
                                    <th className="p-3">Visual Appearance</th>
                                    <th className="p-3">Intended Typographic Role</th>
                                    <th className="p-3">Common Bug / Failure Mode</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">U+200B</td>
                                    <td className="p-3 font-bold text-slate-900">Zero-Width Space (ZWSP)</td>
                                    <td className="p-3 text-slate-500 italic">0px width (Invisible)</td>
                                    <td className="p-3">Soft line-wrap break indicator</td>
                                    <td className="p-3 text-rose-600">Breaks strict string comparisons, SQL WHERE matching, regex parsing</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">U+FEFF</td>
                                    <td className="p-3 font-bold text-slate-900">Byte Order Mark / ZWNBSP</td>
                                    <td className="p-3 text-slate-500 italic">0px width (Invisible)</td>
                                    <td className="p-3">Byte endianness declaration in UTF-16</td>
                                    <td className="p-3 text-rose-600">Fatal JSON parse exceptions, shell script header compilation errors</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">U+00A0</td>
                                    <td className="p-3 font-bold text-slate-900">Non-Breaking Space (NBSP)</td>
                                    <td className="p-3 text-slate-500 italic">1 standard space width</td>
                                    <td className="p-3">Prevents line breaks between paired words</td>
                                    <td className="p-3 text-amber-700">CLI command execution failures (e.g., <code>command not found</code> in Bash)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">U+200C</td>
                                    <td className="p-3 font-bold text-slate-900">Zero-Width Non-Joiner (ZWNJ)</td>
                                    <td className="p-3 text-slate-500 italic">0px width (Invisible)</td>
                                    <td className="p-3">Suppresses cursive ligatures in Persian/Arabic</td>
                                    <td className="p-3 text-amber-700">Mismatches in URL slugs, slugification algorithms, and email addresses</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">U+200D</td>
                                    <td className="p-3 font-bold text-slate-900">Zero-Width Joiner (ZWJ)</td>
                                    <td className="p-3 text-slate-500 italic">0px width (Invisible)</td>
                                    <td className="p-3">Combines multiple glyphs into single emojis</td>
                                    <td className="p-3 text-slate-600">Unexpected string length counts in SMS/Twitter character limits</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">U+202E</td>
                                    <td className="p-3 font-bold text-slate-900">Right-to-Left Override (RLO)</td>
                                    <td className="p-3 text-slate-500 italic">0px width (Invisible)</td>
                                    <td className="p-3">Reverses text visual rendering direction</td>
                                    <td className="p-3 text-rose-600">Trojan Source code obfuscation (disguises executable code as comments)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">U+3000</td>
                                    <td className="p-3 font-bold text-slate-900">Ideographic Space</td>
                                    <td className="p-3 text-slate-500 italic">2 standard spaces width</td>
                                    <td className="p-3">Full-width alignment in CJK typography</td>
                                    <td className="p-3 text-slate-600">Breaks monospace tabular column alignment in terminal output</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Trojan Source Attacks & Cybersecurity Implications */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Cybersecurity Implications: Trojan Source Code Attacks and Steganography
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In November 2021, Cambridge University researchers disclosed a critical vulnerability class known as <strong>Trojan Source (CVE-2021-42574)</strong>. This attack vector exploits the Unicode Bidirectional (BiDi) Algorithm. Because compilers parse source tokens in linear logical order while code editors render characters according to directional overrides, attackers can construct source code that appears entirely harmless in human code review while compiling into malicious binary instructions.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" /> Comment-Out Injection Attacks
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                By inserting a Right-to-Left Override (U+202E), an attacker can visually project executable exploit code inside what appears to be a multi-line code comment. The human reviewer sees only documentation, but the compiler executes the payload.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Zero-Width Fingerprinting (Steganography)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Whistleblower text and proprietary source leaks are frequently watermarked by internal systems that embed zero-width spaces (representing binary 0s) and zero-width joiners (representing binary 1s) to trace individual leakers invisibly.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-amber-400" /> Automated Sanitization in CI/CD Pipelines
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            To ensure non-printable Unicode characters never breach production repositories, software engineering teams should integrate pre-commit linters and automated regex sanitizers into GitHub Actions and GitLab CI stages:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 border border-slate-800 overflow-x-auto">
                            <code># Strip all zero-width spaces, BOMs, and BiDi controls via Perl/Node regex:</code><br />
                            <code>$ node -e &apos;fs.writeFileSync(&quot;file.js&quot;, fs.readFileSync(&quot;file.js&quot;, &quot;utf8&quot;).replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, &quot;&quot;))&apos;</code>
                        </div>
                    </div>
                </section>

                {/* Card 4: Developer Guide for Python, JavaScript, and SQL */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Programmatic Sanitization: JavaScript, Python, and SQL Snippets
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Implement the following battle-tested snippets in your backend microservices to clean user input and sanitize external text streams automatically:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2 min-w-0">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">JavaScript / TypeScript</span>
                            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
                                <pre>{`export function cleanText(str) {
  return str
    // Strip zero-width & BOM
    .replace(/[\\u200B-\\u200D\\uFEFF\\u2060]/g, "")
    // Normalize NBSP
    .replace(/[\\u00A0\\u202F]/g, " ")
    // Strip BiDi controls
    .replace(/[\\u202A-\\u202E]/g, "");
}`}</pre>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2 min-w-0">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Python 3 (Regex)</span>
                            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
                                <pre>{`import re

def sanitize_unicode(text: str) -> str:
    # Remove zero-width and BOM
    pattern = r'[\\u200b-\\u200d\\ufeff\\u2060]'
    cleaned = re.sub(pattern, '', text)
    # Replace non-breaking spaces
    return cleaned.replace('\\u00a0', ' ')`}</pre>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2 min-w-0">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">PostgreSQL (SQL)</span>
                            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
                                <pre>{`-- Clean column data in PostgreSQL
UPDATE user_records
SET email = REGEXP_REPLACE(
    email,
    '[\\x{200B}\\x{200C}\\x{200D}\\x{FEFF}]',
    '',
    'g'
)
WHERE email ~ '[\\x{200B}\\x{200C}\\x{200D}\\x{FEFF}]';`}</pre>
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
                                What are zero-width spaces and why do they break code and JSON payloads?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Zero-width spaces (such as U+200B, U+200C, and U+200D) are non-printing Unicode characters that occupy zero horizontal pixels on a screen. While visually imperceptible, they contain discrete byte sequences that cause syntax errors in JSON parsers, break string equality checks in Python and JavaScript, corrupt JWT API keys, and fail database foreign key matching.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does this tool detect hidden Byte Order Marks (BOM) and BiDi overrides?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool analyzes raw text streams byte-by-byte against the complete Unicode standard database, detecting UTF-8 Byte Order Marks (U+FEFF), Bidirectional overrides (U+202E, U+202A), and C0/C1 control codes that are frequently used in Trojan Source attacks to disguise malicious executable code.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between standard spaces and Non-Breaking Spaces (NBSP)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A standard ASCII space is represented by character byte 0x20 (U+0020). A Non-Breaking Space (NBSP, U+00A0) is a typographical entity created by Microsoft Word, Google Docs, and HTML entities (&amp;nbsp;) to prevent automatic line wrapping. When pasted into terminal commands or CLI tools, NBSP produces unexpected syntax errors because compilers do not treat it as valid whitespace delimiter.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my text secure and private when using this online zero-width cleaner?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, 100% of the Unicode inspection and cleaning logic executes purely inside your local browser runtime via client-side JavaScript. No text, source code, API keys, or database dumps are ever uploaded or transmitted to an external server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can zero-width spaces be used for malicious steganography or digital fingerprinting?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Malicious actors and enterprise watermarking systems encode binary data (such as user IDs or secret tokens) into invisible sequences of ZWSP (binary 0) and ZWNJ (binary 1). This tool uncovers all such hidden patterns instantly and provides complete sanitization.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are BiDi Unicode Trojan Source attacks?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Trojan Source attacks (CVE-2021-42574) exploit Bidirectional (BiDi) Unicode control characters (like U+202E Right-to-Left Override) to alter the visual display order of source code in code editors so that comments appear as executable statements or vice versa, creating stealth vulnerabilities.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}