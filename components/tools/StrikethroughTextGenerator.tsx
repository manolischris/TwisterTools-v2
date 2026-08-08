"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    Strikethrough,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    Sliders,
    HelpCircle,
    Type,
    Layers,
    FileText,
    Download,
    BookOpen,
    Cpu,
    LayoutGrid,
    Sparkles,
    Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// UNICODE MAPPING DICTIONARIES & TRANSFORMERS
// ─────────────────────────────────────────────────────────────

// Single Combining Mark Transformers
const combineWithMark = (text: string, mark: string): string => {
    return text
        .split("")
        .map((char) => (/\s/.test(char) ? char : char + mark))
        .join("");
};

// Double Combining Mark Transformers
const combineWithTwoMarks = (text: string, mark1: string, mark2: string): string => {
    return text
        .split("")
        .map((char) => (/\s/.test(char) ? char : char + mark1 + mark2))
        .join("");
};

// Character Mapping Map Generator
const mapCharacters = (text: string, mapObj: Record<string, string>): string => {
    return text
        .split("")
        .map((char) => mapObj[char] || char)
        .join("");
};

// Mathematical Alphanumeric Font Maps
const FULLWIDTH_MAP: Record<string, string> = {
    a: "ａ", b: "ｂ", c: "ｃ", d: "ｄ", e: "ｅ", f: "ｆ", g: "ｇ", h: "ｈ", i: "ｉ", j: "ｊ",
    k: "ｋ", l: "ｌ", m: "ｍ", n: "ｎ", o: "ｏ", p: "ｐ", q: "ｑ", r: "ｒ", s: "ｓ", t: "ｔ",
    u: "ｕ", v: "ｖ", w: "ｗ", x: "ｘ", y: "ｙ", z: "ｚ",
    A: "Ａ", B: "Ｂ", C: "Ｃ", D: "Ｄ", E: "Ｅ", F: "Ｆ", G: "Ｇ", H: "Ｈ", I: "Ｉ", J: "Ｊ",
    K: "Ｋ", L: "Ｌ", M: "Ｍ", N: "Ｎ", O: "Ｏ", P: "Ｐ", Q: "Ｑ", R: "Ｒ", S: "Ｓ", T: "Ｔ",
    U: "Ｕ", V: "Ｖ", W: "Ｗ", X: "Ｘ", Y: "Ｙ", Z: "Ｚ",
    0: "０", 1: "１", 2: "２", 3: "３", 4: "４", 5: "５", 6: "６", 7: "７", 8: "８", 9: "９"
};

const BOLD_MAP: Record<string, string> = {
    a: "mathbf{a}", b: "mathbf{b}", c: "mathbf{c}", d: "mathbf{d}", e: "mathbf{e}",
    // Pre-mapped UTF-8 mathematical bold symbols
    A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉",
    K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓",
    U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙",
    a_b: "𝐚", b_b: "𝐛", c_b: "𝐜", d_b: "𝐝", e_b: "𝐞", f_b: "𝐟", g_b: "𝐠", h_b: "𝐡",
    i_b: "𝐢", j_b: "𝐣", k_b: "𝐤", l_b: "𝐥", m_b: "𝐦", n_b: "𝐧", o_b: "𝐨", p_b: "𝐩",
    q_b: "𝐪", r_b: "𝐫", s_b: "𝐬", t_b: "𝐭", u_b: "𝐮", v_b: "𝐯", w_b: "𝐰", x_b: "𝐱",
    y_b: "𝐲", z_b: "𝐳",
    0: "𝟎", 1: "𝟏", 2: "𝟐", 3: "𝟑", 4: "𝟒", 5: "𝟓", 6: "𝟔", 7: "𝟕", 8: "𝟖", 9: "𝟗"
};

// Normalize clean maps for exact character replacement
const BOLD_S: Record<string, string> = {
    a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣",
    k: "𝐤", l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭",
    u: "𝐮", v: "𝐯", w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳",
    A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉",
    K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓",
    U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙",
    0: "𝟎", 1: "𝟏", 2: "𝟐", 3: "𝟑", 4: "𝟒", 5: "𝟓", 6: "𝟔", 7: "𝟕", 8: "𝟖", 9: "𝟗"
};

export default function StrikethroughTextGenerator() {
    // ── Core State ──
    const [inputText, setInputText] = useState("Strike through your text with professional Unicode styling!");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // ── Style Definitions ──
    const styles = [
        {
            id: "strikethrough",
            name: "Single Strikethrough",
            description: "Standard horizontal line through text (U+0336)",
            transform: (text: string) => combineWithMark(text, "\u0336"),
        },
        {
            id: "double-strikethrough",
            name: "Double Strikethrough",
            description: "Intense double horizontal strikethrough (U+0333 + U+0336)",
            transform: (text: string) => combineWithTwoMarks(text, "\u0336", "\u0333"),
        },
        {
            id: "underline",
            name: "Single Underline",
            description: "Clean underline below baseline (U+0332)",
            transform: (text: string) => combineWithMark(text, "\u0332"),
        },
        {
            id: "double-underline",
            name: "Double Underline",
            description: "Emphasis double line below text (U+0333)",
            transform: (text: string) => combineWithMark(text, "\u0333"),
        },
        {
            id: "dotted-underline",
            name: "Dotted Underline",
            description: "Subtle dotted baseline accent (U+0323)",
            transform: (text: string) => combineWithMark(text, "\u0323"),
        },
        {
            id: "overline",
            name: "Overline Bar",
            description: "Continuous line drawn above characters (U+0305)",
            transform: (text: string) => combineWithMark(text, "\u0305"),
        },
        {
            id: "slash-through",
            name: "Slash Through",
            description: "Diagonal overlay line through each character (U+0337)",
            transform: (text: string) => combineWithMark(text, "\u0337"),
        },
        {
            id: "tilde-strike",
            name: "Tilde Strike Overlay",
            description: "Wavy tilde accent running across text (U+0334)",
            transform: (text: string) => combineWithMark(text, "\u0334"),
        },
        {
            id: "underline-strikethrough",
            name: "Underline + Strikethrough",
            description: "Combined top strike and bottom underline",
            transform: (text: string) => combineWithTwoMarks(text, "\u0336", "\u0332"),
        },
        {
            id: "bold-strikethrough",
            name: "Bold Strikethrough",
            description: "Mathematical bold letters with strikethrough overlay",
            transform: (text: string) => combineWithMark(mapCharacters(text, BOLD_S), "\u0336"),
        },
        {
            id: "fullwidth-strike",
            name: "Fullwidth Strikethrough",
            description: "Aesthetic vaporwave spaced strikethrough text",
            transform: (text: string) => combineWithMark(mapCharacters(text, FULLWIDTH_MAP), "\u0336"),
        },
    ];

    // ── Clipboard Utility ──
    const copyToClipboard = async (text: string, id: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            /* silent catch */
        }
    };

    const clearInput = () => {
        setInputText("");
    };

    const stripFormatting = () => {
        // Strips all Unicode combining marks from input
        setInputText(inputText.replace(/[\u0300-\u036f]/g, ""));
    };

    // Metrics Calculations
    const charCount = Array.from(inputText).length;
    const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

    return (
        <div className="w-full space-y-8">
            {/* ── Two-Column Workspace Grid (50/50 Split) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & CONTROLS ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 aspect-square">
                                    <Strikethrough className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">Text Input &amp; Editor</h2>
                                    <p className="text-xs text-indigo-200">Real-Time Unicode Styler</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Input Text Area */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="strikethrough-input" className="text-xs font-semibold text-slate-700 block">
                                        Source Text
                                    </label>
                                    <button
                                        onClick={stripFormatting}
                                        className="text-xs text-indigo-600 hover:underline font-semibold"
                                        title="Remove all combining diacritic marks"
                                    >
                                        Strip Existing Marks
                                    </button>
                                </div>
                                <textarea
                                    id="strikethrough-input"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type or paste text here to apply strikethrough and underline styles..."
                                    className="font-sans text-sm h-[220px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-600 min-w-0"
                                />
                            </div>

                            {/* Character Metrics Bar */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                        Character Count
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">{charCount.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                        Word Count
                                    </p>
                                    <p className="text-sm font-mono font-bold text-indigo-600">{wordCount.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Action Control Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setInputText("Sample text with ~strikethrough~ and _underline_ styles!")}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all bg-slate-100 hover:bg-slate-200 text-slate-700 min-h-[44px]"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Load Sample
                                </button>
                                <button
                                    onClick={clearInput}
                                    disabled={!inputText}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear Input
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: LIVE STYLING PREVIEWS ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 aspect-square">
                                    <Sparkles className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">Generated Font Styles</h2>
                                    <p className="text-xs text-indigo-200">Click Any Style to Copy Instantly</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-4 max-h-[610px] overflow-y-auto">
                            {styles.map((style) => {
                                const styledResult = mounted ? style.transform(inputText || "Sample Text") : (inputText || "Sample Text");
                                const isCopied = copiedId === style.id;

                                return (
                                    <div
                                        key={style.id}
                                        className="group bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition-all space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                {style.name}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(styledResult, style.id)}
                                                disabled={!inputText}
                                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all min-h-[32px] ${isCopied
                                                        ? "bg-green-600 text-white shadow-sm"
                                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-40"
                                                    }`}
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5" /> Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5" /> Copy
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Preview Box */}
                                        <div className="bg-white border border-slate-200 rounded-lg p-3 font-sans text-base text-slate-900 break-words min-h-[48px] flex items-center selection:bg-indigo-500 selection:text-white">
                                            {styledResult}
                                        </div>
                                        <p className="text-[11px] text-slate-500">{style.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
         SEO DEEP-CONTENT BLOCK (INFO-RICH & SEARCH ENGINE OPTIMIZED)
    ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8">
                {/* Card 1: Technical Overview & Definitions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>How Strikethrough &amp; Underline Unicode Generators Function</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            The <strong>Strikethrough &amp; Underline Font Styler</strong> converts standard plain text into customized visual typography that can be pasted anywhere on the web. Unlike traditional rich-text editors (such as Microsoft Word or Google Docs) that rely on HTML tags like <code>&lt;s&gt;</code> or CSS properties like <code>text-decoration: line-through</code>, this utility utilizes <strong>Unicode Combining Characters</strong>.
                        </p>
                        <p>
                            In the global Unicode standard, combining diacritical marks are special codepoints designed to overlay directly onto the preceding alphanumeric character. When a combining strikethrough character (<code>U+0336</code>) or combining underline character (<code>U+0332</code>) is appended after a standard letter, digital screens render a seamless horizontal line directly through or beneath the glyph.
                        </p>
                        <p>
                            Because the resulting output consists purely of standard Unicode codepoints rather than styled web code, you can seamlessly copy and paste styled text into social media profiles, chat applications, gaming handles, and email subjects where formatting toolbars are unavailable.
                        </p>
                    </div>
                </div>

                {/* Card 2: Deep-Dive Unicode Architecture Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Unicode Combining Mark Technical Reference</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Below is the structural breakdown of the primary Unicode combining characters used in our generator engine:
                        </p>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 my-4">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs sm:text-sm">
                                        <th className="p-3 sm:p-4">Style Variant</th>
                                        <th className="p-3 sm:p-4">Unicode Codepoint</th>
                                        <th className="p-3 sm:p-4">Character Name</th>
                                        <th className="p-3 sm:p-4">Visual Mechanism</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
                                    <tr className="bg-white">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Single Strikethrough</td>
                                        <td className="p-3 sm:p-4 font-mono text-indigo-600">U+0336</td>
                                        <td className="p-3 sm:p-4">Combining Long Stroke Overlay</td>
                                        <td className="p-3 sm:p-4">Draws a continuous horizontal line across x-height</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Single Underline</td>
                                        <td className="p-3 sm:p-4 font-mono text-indigo-600">U+0332</td>
                                        <td className="p-3 sm:p-4">Combining Low Line</td>
                                        <td className="p-3 sm:p-4">Draws a unbroken underline beneath character baseline</td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Double Underline</td>
                                        <td className="p-3 sm:p-4 font-mono text-indigo-600">U+0333</td>
                                        <td className="p-3 sm:p-4">Combining Double Low Line</td>
                                        <td className="p-3 sm:p-4">Applies a double baseline bar below characters</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Overline Bar</td>
                                        <td className="p-3 sm:p-4 font-mono text-indigo-600">U+0305</td>
                                        <td className="p-3 sm:p-4">Combining Overline</td>
                                        <td className="p-3 sm:p-4">Positions a horizontal bar above character cap-height</td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Slash Through</td>
                                        <td className="p-3 sm:p-4 font-mono text-indigo-600">U+0337</td>
                                        <td className="p-3 sm:p-4">Combining Short Solidus Overlay</td>
                                        <td className="p-3 sm:p-4">Applies a forward diagonal strike across each letter</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Card 3: Platform Compatibility & Best Practices */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Cross-Platform Support &amp; Social Media Compatibility</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Unicode strikethrough text is widely supported across modern web environments, mobile operating systems, and social platforms:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 text-sm md:text-base">
                            <li>
                                <strong>Social Networks:</strong> Stand out in Instagram captions, TikTok bio descriptions, Twitter/X tweets, Facebook posts, and LinkedIn updates.
                            </li>
                            <li>
                                <strong>Messaging Apps:</strong> Embed directly in WhatsApp, Telegram, Signal, Discord, and Slack messages.
                            </li>
                            <li>
                                <strong>Gaming Platforms:</strong> Customize usernames, guild titles, and chat rooms in Roblox, Minecraft, Steam, and Twitch.
                            </li>
                            <li>
                                <strong>Digital Documents &amp; Emails:</strong> Style subject lines and plain-text emails to indicate completed tasks or price reductions.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Card 4: Step-by-Step User Instructions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>How to Use the Strikethrough &amp; Underline Generator</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Type className="w-4 h-4 text-indigo-600" />
                                1. Enter Your Text
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Type or paste your desired phrase into the <strong>Source Text</strong> input panel on the left. The tool automatically updates all font style variations in real time.
                            </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Copy className="w-4 h-4 text-indigo-600" />
                                2. Select &amp; Copy Style
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Browse through the generated font preview panel on the right. Click the <strong>Copy</strong> button next to your preferred style to copy it directly to your device clipboard.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 5: Static Border-Highlighted FAQ Section */}
                <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions (FAQ)</span>
                    </h2>
                    <div className="space-y-5">
                        {[
                            {
                                q: "Why does strikethrough text work in places where formatting isn't supported?",
                                a: "Because this generator uses standard Unicode combining mark characters rather than HTML or rich-text formatting code. Web platforms interpret these marks as native plain text.",
                            },
                            {
                                q: "Is there a limit to how much text I can convert?",
                                a: "No. Our browser-native conversion engine processes strings instantly regardless of length, right inside your web browser without sending data to external servers.",
                            },
                            {
                                q: "Will strikethrough text appear correctly on mobile devices?",
                                a: "Yes. All modern iOS, Android, macOS, and Windows operating systems natively support Unicode combining diacritical marks across all browsers and apps.",
                            },
                            {
                                q: "How do I remove strikethrough formatting from copied text?",
                                a: "You can paste the text back into our input field and click the 'Strip Existing Marks' button to instantly convert it back to clean plain text.",
                            },
                        ].map(({ q, a }) => (
                            <div
                                key={q}
                                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
                            >
                                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                    {q}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Structured Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Strikethrough & Underline Font Styler",
                        applicationCategory: "UtilityApplication",
                        operatingSystem: "All",
                        description:
                            "Generate strikethrough, underline, double underline, and slashed Unicode text styles for social media bios, chat apps, and web content.",
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "USD",
                        },
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: [
                            {
                                "@type": "Question",
                                name: "Why does strikethrough text work in places where formatting isn't supported?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Because this generator uses standard Unicode combining mark characters rather than HTML or rich-text formatting code.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Will strikethrough text appear correctly on mobile devices?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes. All modern iOS, Android, macOS, and Windows operating systems natively support Unicode combining diacritical marks.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}