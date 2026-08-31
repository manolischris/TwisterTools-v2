"use client";

import React, { useState, useMemo } from "react";
import {
    Subscript,
    Superscript as SuperscriptIcon,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    BookOpen,
    HelpCircle,
    SlidersHorizontal,
    Code2,
    FlaskConical,
    Binary,
    Terminal,
    Atom,
    CheckCircle2,
    ListFilter,
    Keyboard,
    Baseline,
    ArrowRightLeft,
    FileCode2,
    ShieldCheck
} from "lucide-react";

type ConversionMode = "both" | "superscript-only" | "subscript-only" | "custom-formula";

// Complete Unicode Character Maps
const SUPERSCRIPT_MAP: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
    "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "e": "ᵉ",
    "f": "ᶠ", "g": "ᵍ", "h": "ʰ", "i": "ⁱ", "j": "ʲ",
    "k": "ᵏ", "l": "ˡ", "m": "ᵐ", "n": "ⁿ", "o": "ᵒ",
    "p": "ᵖ", "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ",
    "v": "ᵛ", "w": "ʷ", "x": "ˣ", "y": "ʸ", "z": "ᶻ",
    "A": "ᴬ", "B": "ᴮ", "D": "ᴰ", "E": "ᴱ", "G": "ᴳ",
    "H": "ᴴ", "I": "ᴵ", "J": "ᴶ", "K": "ᴷ", "L": "ᴸ",
    "M": "ᴹ", "N": "ᴺ", "O": "ᴼ", "P": "ᴾ", "R": "ᴿ",
    "T": "ᵀ", "U": "ᵁ", "V": "ⱽ", "W": "ᵂ"
};

const SUBSCRIPT_MAP: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
    "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ",
    "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "o": "ₒ",
    "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ",
    "v": "ᵥ", "x": "ₓ",
    "β": "ᵦ", "γ": "ᵧ", "ρ": "ᵨ", "φ": "ᵩ", "χ": "ᵪ"
};

interface PresetExample {
    label: string;
    category: "Math & Physics" | "Chemistry" | "Typography" | "Markdown & HTML";
    raw: string;
    description: string;
}

const PRESET_EXAMPLES: PresetExample[] = [
    {
        label: "Einstein Energy Equivalence",
        category: "Math & Physics",
        raw: "E = mc^2",
        description: "Special relativity mass-energy equivalence with exponent"
    },
    {
        label: "Quadratic Equation",
        category: "Math & Physics",
        raw: "ax^2 + bx + c = 0",
        description: "Standard algebraic second-degree polynomial formula"
    },
    {
        label: "Pythagorean Theorem",
        category: "Math & Physics",
        raw: "a^2 + b^2 = c^2",
        description: "Right-angled triangle Euclidean metric relation"
    },
    {
        label: "Water & Photosynthesis",
        category: "Chemistry",
        raw: "6CO_2 + 6H_2O -> C_6H_12O_6 + 6O_2",
        description: "Balanced chemical equation for carbohydrate synthesis"
    },
    {
        label: "Sulfuric Acid Dissociation",
        category: "Chemistry",
        raw: "H_2SO_4 -> 2H^+ + SO_4^2-",
        description: "Aqueous acid ionization with simultaneous sub and superscripts"
    },
    {
        label: "Caffeine Molecular Formula",
        category: "Chemistry",
        raw: "C_8H_10N_4O_2",
        description: "Purine alkaloid bioactive molecular representation"
    },
    {
        label: "Ordinal Date Numbering",
        category: "Typography",
        raw: "1^st Place on the 21^st Century",
        description: "English typographic elevated ordinal suffixes"
    },
    {
        label: "Registered Trademarks",
        category: "Typography",
        raw: "TwisterTools^TM and Brand^R",
        description: "Elevated legal symbols and branding marks"
    }
];

export default function SubscriptSuperscriptGenerator() {
    const [inputText, setInputText] = useState<string>("E = mc^2 and H_2O");
    const [conversionMode, setConversionMode] = useState<ConversionMode>("both");
    const [preserveUnsupported, setPreserveUnsupported] = useState<boolean>(true);
    const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

    // Transform text directly to full Superscript
    const fullSuperscript = useMemo(() => {
        return inputText
            .split("")
            .map((char) => SUPERSCRIPT_MAP[char] || (preserveUnsupported ? char : ""))
            .join("");
    }, [inputText, preserveUnsupported]);

    // Transform text directly to full Subscript
    const fullSubscript = useMemo(() => {
        return inputText
            .split("")
            .map((char) => SUBSCRIPT_MAP[char] || (preserveUnsupported ? char : ""))
            .join("");
    }, [inputText, preserveUnsupported]);

    // Parser for caret (^) and underscore (_) formula syntax
    const formulaFormatted = useMemo(() => {
        let result = "";
        let i = 0;
        const len = inputText.length;

        while (i < len) {
            const char = inputText[i];

            if (char === "^" && i + 1 < len) {
                i++;
                if (inputText[i] === "{" || inputText[i] === "(") {
                    const closer = inputText[i] === "{" ? "}" : ")";
                    i++;
                    while (i < len && inputText[i] !== closer) {
                        result += SUPERSCRIPT_MAP[inputText[i]] || inputText[i];
                        i++;
                    }
                    if (i < len && inputText[i] === closer) {
                        i++;
                    }
                } else {
                    // Match consecutive alphanumerics or single operator
                    while (i < len && /[a-zA-Z0-9+\-=()]/.test(inputText[i])) {
                        result += SUPERSCRIPT_MAP[inputText[i]] || inputText[i];
                        i++;
                        if (i < len && !/[0-9+\-=]/.test(inputText[i])) {
                            // Stop after one letter unless grouped
                            break;
                        }
                    }
                }
            } else if (char === "_" && i + 1 < len) {
                i++;
                if (inputText[i] === "{" || inputText[i] === "(") {
                    const closer = inputText[i] === "{" ? "}" : ")";
                    i++;
                    while (i < len && inputText[i] !== closer) {
                        result += SUBSCRIPT_MAP[inputText[i]] || inputText[i];
                        i++;
                    }
                    if (i < len && inputText[i] === closer) {
                        i++;
                    }
                } else {
                    while (i < len && /[a-zA-Z0-9+\-=()]/.test(inputText[i])) {
                        result += SUBSCRIPT_MAP[inputText[i]] || inputText[i];
                        i++;
                        if (i < len && !/[0-9+\-=]/.test(inputText[i])) {
                            break;
                        }
                    }
                }
            } else {
                result += char;
                i++;
            }
        }
        return result;
    }, [inputText]);

    // HTML / Rich Text Export equivalent
    const htmlEquivalent = useMemo(() => {
        let out = "";
        let i = 0;
        const len = inputText.length;
        while (i < len) {
            const char = inputText[i];
            if (char === "^" && i + 1 < len) {
                i++;
                let content = "";
                if (inputText[i] === "{" || inputText[i] === "(") {
                    const closer = inputText[i] === "{" ? "}" : ")";
                    i++;
                    while (i < len && inputText[i] !== closer) {
                        content += inputText[i];
                        i++;
                    }
                    if (i < len && inputText[i] === closer) i++;
                } else {
                    content = inputText[i];
                    i++;
                }
                out += `<sup>${content}</sup>`;
            } else if (char === "_" && i + 1 < len) {
                i++;
                let content = "";
                if (inputText[i] === "{" || inputText[i] === "(") {
                    const closer = inputText[i] === "{" ? "}" : ")";
                    i++;
                    while (i < len && inputText[i] !== closer) {
                        content += inputText[i];
                        i++;
                    }
                    if (i < len && inputText[i] === closer) i++;
                } else {
                    content = inputText[i];
                    i++;
                }
                out += `<sub>${content}</sub>`;
            } else {
                out += char;
                i++;
            }
        }
        return out;
    }, [inputText]);

    // Copy to clipboard helper
    const handleCopy = (text: string, identifier: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedTarget(identifier);
        setTimeout(() => setCopiedTarget(null), 2000);
    };

    // Character Analysis Metrics
    const metrics = useMemo(() => {
        const inputChars = inputText.length;
        const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
        const superscriptsDetected = (inputText.match(/\^/g) || []).length;
        const subscriptsDetected = (inputText.match(/_/g) || []).length;
        return { inputChars, words, superscriptsDetected, subscriptsDetected };
    }, [inputText]);

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Subscript and Superscript Unicode Text Generator",
        "url": "https://twistertools.com/tools/text-tools/subscript-superscript-generator",
        "description": "Convert regular text, math formulas, and chemical equations into native Unicode subscript and superscript symbols for social media, Discord, LaTeX, and technical docs.",
        "applicationCategory": "UtilityApplication",
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
                "name": "What is the difference between Unicode sub/superscripts and HTML tags like <sub> and <sup>?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Unicode sub and superscripts are standalone typographic glyphs encoded into the universal Unicode standard. They render natively everywhere plain text is accepted, including Twitter/X, Instagram bios, Discord usernames, and text files. HTML <sub> and <sup> tags rely on browser layout styling and only render inside web browsers or rich text editors."
                }
            },
            {
                "@type": "Question",
                "name": "Why are some letters missing from the Unicode subscript alphabet?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Unicode Consortium adds characters based on historical phonetic, linguistic, and mathematical requirements. While almost all digits (0-9) and lowercase letters exist in superscript, several subscript Latin letters (such as c, d, f, g, w, y, z) were never formally assigned dedicated subscript codepoints in the Unicode standard."
                }
            },
            {
                "@type": "Question",
                "name": "How does the formula syntax (^ and _) work in this tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses intuitive LaTeX-like syntax. Use a caret (^) to convert the following character or group into superscript (e.g., x^2 or x^{10}), and an underscore (_) to convert into subscript (e.g., H_2O or C_{6}H_{12}O_{6}). Regular text remains unmodified."
                }
            },
            {
                "@type": "Question",
                "name": "Can I paste these Unicode math symbols into Discord, Twitter, and TikTok?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Unicode characters are universally recognized plain-text characters. Once generated, you can copy and paste them directly into social media captions, Discord chats, YouTube video titles, WhatsApp messages, and Notion workspaces."
                }
            },
            {
                "@type": "Question",
                "name": "How do screen readers and accessibility tools handle Unicode subscript text?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modern screen readers recognize most Unicode superscript and subscript numbers and speak them as 'superscript two' or 'subscript zero'. However, full words written entirely in pseudo-Unicode letters can sometimes impair text-to-speech comprehension, so they are best used for mathematical, chemical, and notation formulas."
                }
            },
            {
                "@type": "Question",
                "name": "Can I convert chemical reaction formulas with charges and isotopes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can format complex chemical reactions combining both subscripts and superscripts such as H₂SO₄ → 2H⁺ + SO₄²⁻ effortlessly using either direct typing or the formula parser mode."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input & Parsing Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">

                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-black tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                                <Keyboard className="w-4 h-4 text-indigo-600" />
                                Text & Formula Input
                            </span>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                    <span>{metrics.inputChars} chars</span>
                                    <span>&bull;</span>
                                    <span>{metrics.words} words</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setInputText("")}
                                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-200"
                                    title="Clear input text"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Clear</span>
                                </button>
                            </div>
                        </div>

                        {/* Input Text Area */}
                        <div className="space-y-2">
                            <div className="relative">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type regular text, or use LaTeX-style notation: x^2 + y^2 = z^2 or H_2O..."
                                    rows={5}
                                    className="w-full p-4 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed transition shadow-inner bg-slate-50/50"
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span>Tip: Use <code className="text-indigo-600 font-bold bg-slate-100 px-1 py-0.5 rounded">^</code> for superscript (e.g. <code className="text-slate-700">x^2</code>) and <code className="text-indigo-600 font-bold bg-slate-100 px-1 py-0.5 rounded">_</code> for subscript (e.g. <code className="text-slate-700">H_2O</code>).</span>
                            </p>
                        </div>

                        {/* Parsing Configuration Options */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                                Conversion Settings
                            </span>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <label className="flex items-center gap-2 text-slate-700 cursor-pointer font-medium">
                                    <input
                                        type="checkbox"
                                        checked={preserveUnsupported}
                                        onChange={(e) => setPreserveUnsupported(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Preserve unmapped characters (recommended)</span>
                                </label>
                            </div>
                        </div>

                        {/* Quick Presets Carousel */}
                        <div className="space-y-2 pt-1">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <ListFilter className="w-3.5 h-3.5 text-indigo-500" />
                                Quick Formula Presets
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {PRESET_EXAMPLES.map((ex) => (
                                    <button
                                        key={ex.label}
                                        type="button"
                                        onClick={() => setInputText(ex.raw)}
                                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/60 hover:border-indigo-300 text-left transition cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                                                {ex.label}
                                            </span>
                                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                                {ex.category}
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-mono text-slate-500 truncate">{ex.raw}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            100% Client-Side Unicode Synthesis
                        </span>
                        <span className="text-indigo-600 font-bold">Standard UTF-8 / UTF-16</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Channels & Quick Copy Formats */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">

                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-black tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Real-Time Unicode Output
                            </span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Ready to Copy
                            </span>
                        </div>

                        {/* Card Option 1: Formula Parser Output (Caret & Underscore Aware) */}
                        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <FlaskConical className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-900">
                                        Formula Parsed (Smart ^ &amp; _)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(formulaFormatted, "formula")}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                >
                                    {copiedTarget === "formula" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedTarget === "formula" ? "Copied!" : "Copy Output"}</span>
                                </button>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-sm sm:text-base text-slate-900 break-all min-h-[44px] flex items-center">
                                {formulaFormatted || <span className="text-slate-400 italic">No output yet...</span>}
                            </div>
                        </div>

                        {/* Card Option 2: Full Superscript Conversion */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <SuperscriptIcon className="w-4 h-4 text-slate-700" />
                                    <span className="text-xs font-bold text-slate-800">
                                        Full Superscript Output (All Chars)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(fullSuperscript, "superscript")}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                                >
                                    {copiedTarget === "superscript" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedTarget === "superscript" ? "Copied" : "Copy"}</span>
                                </button>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-sm text-slate-800 break-all min-h-[38px] flex items-center">
                                {fullSuperscript || <span className="text-slate-400 italic">No output...</span>}
                            </div>
                        </div>

                        {/* Card Option 3: Full Subscript Conversion */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Subscript className="w-4 h-4 text-slate-700" />
                                    <span className="text-xs font-bold text-slate-800">
                                        Full Subscript Output (All Chars)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(fullSubscript, "subscript")}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                                >
                                    {copiedTarget === "subscript" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedTarget === "subscript" ? "Copied" : "Copy"}</span>
                                </button>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-sm text-slate-800 break-all min-h-[38px] flex items-center">
                                {fullSubscript || <span className="text-slate-400 italic">No output...</span>}
                            </div>
                        </div>

                        {/* Card Option 4: HTML <sub> & <sup> Markup Generator */}
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <FileCode2 className="w-4 h-4 text-slate-700" />
                                    <span className="text-xs font-bold text-slate-800">
                                        HTML Tags &lt;sub&gt; &amp; &lt;sup&gt; Code
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(htmlEquivalent, "html")}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                                >
                                    {copiedTarget === "html" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedTarget === "html" ? "Copied" : "Copy HTML"}</span>
                                </button>
                            </div>
                            <div className="p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs break-all min-h-[38px] flex items-center">
                                {htmlEquivalent || <span className="text-slate-500 italic">No HTML markup generated...</span>}
                            </div>
                        </div>

                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => handleCopy(formulaFormatted, "formula")}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedTarget === "formula" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedTarget === "formula" ? "Primary Output Copied to Clipboard!" : "Copy Formatted Unicode Text"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Unicode Subscript & Superscript Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What Are Unicode Subscripts and Superscripts? Encoding, Architecture, and Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In digital typography and computational linguistics, <strong>superscripts</strong> and <strong>subscripts</strong> are characters positioned slightly above or below the standard baseline, typically scaled to a reduced optical font weight. While conventional word processors and web browsers achieve this visual effect via cascading style sheets (CSS) or document layout engines (such as HTML <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">&lt;sup&gt;</code> and <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">&lt;sub&gt;</code> tags), <strong>Unicode sub and superscripts</strong> exist as distinct, self-contained characters in the Universal Coded Character Set (UCS).
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Because these glyphs are hardcoded with dedicated codepoints across the Basic Multilingual Plane (BMP) and the Superscripts and Subscripts block (U+2070–U+209F), they preserve their exact spatial orientation across any plain-text environment. Whether you are publishing updates to social media platforms, organizing Markdown README repositories on GitHub, titling YouTube videos, or texting over SMS, Unicode characters never lose their intended formatting.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Advantage I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Universal Portability</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Renders natively across Discord, X (Twitter), LinkedIn, Notion, Slack, and terminal command prompts without requiring external styling engines.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Advantage II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Zero Styling Dependencies</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Functions in raw string fields, JSON payloads, CSV databases, and code comments where CSS tags and rich text formatting are stripped.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Advantage III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Mathematical Precision</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Accurately reflects chemical stoichiometry, exponential powers, polynomial degrees, and isotopic mass notations in plain scientific documentation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Complete Unicode Character Mapping Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Binary className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Complete Unicode Subscript & Superscript Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below details all officially standardized Latin, numerical, and operator codepoints within the Unicode consortium specification, including their respective hex values:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Character Category</th>
                                    <th className="p-3">Standard Input</th>
                                    <th className="p-3">Superscript Glyph</th>
                                    <th className="p-3">Superscript Hex</th>
                                    <th className="p-3">Subscript Glyph</th>
                                    <th className="p-3">Subscript Hex</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Digits 0 through 3</td>
                                    <td className="p-3 font-mono">0, 1, 2, 3</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">⁰, ¹, ², ³</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">U+2070, U+00B9, U+00B2, U+00B3</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">₀, ₁, ₂, ₃</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">U+2080, U+2081, U+2082, U+2083</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Digits 4 through 9</td>
                                    <td className="p-3 font-mono">4, 5, 6, 7, 8, 9</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">⁴, ⁵, ⁶, ⁷, ⁸, ⁹</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">U+2074 - U+2079</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">₄, ₅, ₆, ₇, ₈, ₉</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">U+2084 - U+2089</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Mathematical Operators</td>
                                    <td className="p-3 font-mono">+, -, =, (, )</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">⁺, ⁻, ⁼, ⁽, ⁾</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">U+207A - U+207E</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">₊, ₋, ₌, ₍, ₎</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">U+208A - U+208E</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Lowercase Latin Letters</td>
                                    <td className="p-3 font-mono">a, e, h, i, j, k, l, m, n, o, p, r, s, t, u, v, x</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">ᵃ, ᵉ, ʰ, ⁱ, ʲ, ᵏ, ˡ, ᵐ, ⁿ, ᵒ, ᵖ, ʳ, ˢ, ᵗ, ᵘ, ᵛ, ˣ</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">U+1D43 - U+1D61</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">ₐ, ₑ, ₕ, ᵢ, ⱼ, ₖ, ₗ, ₘ, ₙ, ₒ, ₚ, ᵣ, ₛ, ₜ, ᵤ, ᵥ, ₓ</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">U+2090 - U+209C</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Greek Subscripts</td>
                                    <td className="p-3 font-mono">β, γ, ρ, φ, χ</td>
                                    <td className="p-3 font-mono text-slate-400">N/A</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">-</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">ᵦ, ᵧ, ᵨ, ᵩ, ᵪ</td>
                                    <td className="p-3 text-xs font-mono text-slate-500">U+1D66 - U+1D6A</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Scientific, Mathematical & Engineering Applications */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Atom className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Scientific and Engineering Notation: Real-World Use Cases
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Accurate technical communication requires distinct typographic conventions to differentiate physical properties, chemical elements, and algebraic orders of magnitude:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <FlaskConical className="w-4 h-4 text-indigo-600" /> Chemistry Stoichiometry
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Chemical formulas demand subscripts to denote the exact number of atoms in a molecular unit (e.g., Glucose: C₆H₁₂O₆, Nitric Acid: HNO₃) and superscripts to represent ionic valencies and electron oxidation charges (e.g., Fe³⁺, SO₄²⁻).
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Code2 className="w-4 h-4 text-indigo-600" /> Mathematics & Exponents
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Superscripts indicate algebraic powers, exponents, and polynomial degrees (e.g., y = x³ + 4x² - 7), while subscripts designate sequence indices, vectors, coordinate dimensions, and matrix coordinates (e.g., x₁, x₂, aᵢⱼ).
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Terminal className="w-4 h-4 text-indigo-600" /> Source Code Comments
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Software engineers writing algorithmic physics engines, game math shaders, or financial calculating libraries frequently embed Unicode exponents directly inside inline code docstrings to ensure absolute readability without LaTeX compilers.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                What is the difference between Unicode sub/superscripts and HTML tags like &lt;sub&gt; and &lt;sup&gt;?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Unicode sub and superscripts are standalone typographic glyphs encoded into the universal Unicode standard. They render natively everywhere plain text is accepted, including Twitter/X, Instagram bios, Discord usernames, and text files. HTML &lt;sub&gt; and &lt;sup&gt; tags rely on browser layout styling and only render inside web browsers or rich text editors.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why are some letters missing from the Unicode subscript alphabet?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Unicode Consortium adds characters based on historical phonetic, linguistic, and mathematical requirements. While almost all digits (0-9) and lowercase letters exist in superscript, several subscript Latin letters (such as c, d, f, g, w, y, z) were never formally assigned dedicated subscript codepoints in the Unicode standard.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the formula syntax (^ and _) work in this tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool uses intuitive LaTeX-like syntax. Use a caret (^) to convert the following character or group into superscript (e.g., x^2 or x^{10}), and an underscore (_) to convert into subscript (e.g., H_2O or C_{6}H_{12}O_{6}). Regular text remains unmodified.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I paste these Unicode math symbols into Discord, Twitter, and TikTok?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Unicode characters are universally recognized plain-text characters. Once generated, you can copy and paste them directly into social media captions, Discord chats, YouTube video titles, WhatsApp messages, and Notion workspaces.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do screen readers and accessibility tools handle Unicode subscript text?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Modern screen readers recognize most Unicode superscript and subscript numbers and speak them as &apos;superscript two&apos; or &apos;subscript zero&apos;. However, full words written entirely in pseudo-Unicode letters can sometimes impair text-to-speech comprehension, so they are best used for mathematical, chemical, and notation formulas.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I convert chemical reaction formulas with charges and isotopes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can format complex chemical reactions combining both subscripts and superscripts such as H₂SO₄ → 2H⁺ + SO₄²⁻ effortlessly using either direct typing or the formula parser mode.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}