"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Zap,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    Sliders,
    HelpCircle,
    Binary,
    Layers,
    FileText,
    Activity,
    Terminal,
    Download,
    BookOpen,
    Cpu,
    ShieldAlert,
    Flame,
    LayoutGrid,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// UNICODE COMBINING MARKERS (ZALGO ARRAYS)
// ─────────────────────────────────────────────────────────────

// Combining Marks Above (U+0300 to U+0314, U+033D..U+0344, U+0346, U+034A..U+034C, etc.)
const ZALGO_UP: string[] = [
    "\u0300", "\u0301", "\u0302", "\u0303", "\u0304", "\u0305", "\u0306", "\u0307",
    "\u0308", "\u0309", "\u030A", "\u030B", "\u030C", "\u030D", "\u030E", "\u030F",
    "\u0310", "\u0311", "\u0312", "\u0313", "\u0314", "\u031B", "\u033D", "\u033E",
    "\u033F", "\u0340", "\u0341", "\u0342", "\u0343", "\u0344", "\u0346", "\u034A",
    "\u034B", "\u034C", "\u0350", "\u0351", "\u0352", "\u0357", "\u035B", "\u0363",
    "\u0364", "\u0365", "\u0366", "\u0367", "\u0368", "\u0369", "\u036A", "\u036B",
    "\u036C", "\u036D", "\u036E", "\u036F"
];

// Combining Marks Middle / Overlay (U+0315, U+0334..U+0338, U+0345, U+035C..U+0362)
const ZALGO_MID: string[] = [
    "\u0315", "\u031B", "\u0320", "\u0334", "\u0335", "\u0336", "\u0337", "\u0338",
    "\u0345", "\u035C", "\u035D", "\u035E", "\u035F", "\u0360", "\u0361", "\u0362"
];

// Combining Marks Down (U+0316 to U+031F, U+0321 to U+0333, U+0339 to U+033C, U+0347..U+0349)
const ZALGO_DOWN: string[] = [
    "\u0316", "\u0317", "\u0318", "\u0319", "\u031C", "\u031D", "\u031E", "\u031F",
    "\u0321", "\u0322", "\u0323", "\u0324", "\u0325", "\u0326", "\u0327", "\u0328",
    "\u0329", "\u032A", "\u032B", "\u032C", "\u032D", "\u032E", "\u032F", "\u0330",
    "\u0331", "\u0332", "\u0333", "\u0339", "\u033A", "\u033B", "\u033C", "\u0347",
    "\u0348", "\u0349", "\u034D", "\u034E", "\u0353", "\u0354", "\u0355", "\u0356",
    "\u0358", "\u0359", "\u035A"
];

export default function ZalgoTextGenerator() {
    // ── Core State ──
    const [inputText, setInputText] = useState("HE COMES TO DESTROY THE ORDER");
    const [outputText, setOutputText] = useState("");

    // ── Corruption Configuration Controls ──
    const [glitchIntensity, setGlitchIntensity] = useState<number>(30); // 1-100
    const [includeUp, setIncludeUp] = useState<boolean>(true);
    const [includeMid, setIncludeMid] = useState<boolean>(true);
    const [includeDown, setIncludeDown] = useState<boolean>(true);
    const [maxDiacriticsPerChar, setMaxDiacriticsPerChar] = useState<number>(15);

    // ── UI Feedback State ──
    const [copied, setCopied] = useState(false);
    const [preset, setPreset] = useState<string>("custom");

    // Helper: Pseudo-random array selection
    const getRandomChar = (arr: string[]): string => {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    // ── Glitch Engine Logic ──
    const generateZalgo = useCallback(() => {
        if (!inputText) {
            setOutputText("");
            return;
        }

        let result = "";
        // Scaling multiplier based on intensity (0.1x to 2.5x of maxDiacriticsPerChar)
        const intensityMultiplier = (glitchIntensity / 100) * 1.8 + 0.1;

        for (let i = 0; i < inputText.length; i++) {
            const char = inputText[i];

            // Skip combining logic for whitespace/newlines
            if (/\s/.test(char)) {
                result += char;
                continue;
            }

            result += char;

            // Calculate total diacritics count for this character
            const count = Math.floor(
                (Math.random() * maxDiacriticsPerChar + 1) * intensityMultiplier
            );

            for (let j = 0; j < count; j++) {
                const pool: string[] = [];
                if (includeUp) pool.push(...ZALGO_UP);
                if (includeMid) pool.push(...ZALGO_MID);
                if (includeDown) pool.push(...ZALGO_DOWN);

                if (pool.length > 0) {
                    result += getRandomChar(pool);
                }
            }
        }

        setOutputText(result);
    }, [inputText, glitchIntensity, includeUp, includeMid, includeDown, maxDiacriticsPerChar]);

    useEffect(() => {
        generateZalgo();
    }, [generateZalgo]);

    // Preset Handlers
    const applyPreset = (presetType: string) => {
        setPreset(presetType);
        if (presetType === "mild") {
            setGlitchIntensity(12);
            setMaxDiacriticsPerChar(6);
            setIncludeUp(true);
            setIncludeMid(false);
            setIncludeDown(true);
        } else if (presetType === "heavy") {
            setGlitchIntensity(55);
            setMaxDiacriticsPerChar(22);
            setIncludeUp(true);
            setIncludeMid(true);
            setIncludeDown(true);
        } else if (presetType === "maximum") {
            setGlitchIntensity(95);
            setMaxDiacriticsPerChar(40);
            setIncludeUp(true);
            setIncludeMid(true);
            setIncludeDown(true);
        } else if (presetType === "creepypasta") {
            setGlitchIntensity(40);
            setMaxDiacriticsPerChar(18);
            setIncludeUp(true);
            setIncludeMid(true);
            setIncludeDown(false);
        }
    };

    // ── Strip Zalgo (Sanitization Engine) ──
    const stripZalgo = (text: string): string => {
        // Unicode range for Combining Diacritical Marks: U+0300 to U+036F
        return text.replace(/[\u0300-\u036f]/g, "");
    };

    const handleStripZalgoInput = () => {
        const cleaned = stripZalgo(inputText);
        setInputText(cleaned);
    };

    // ── Clipboard & Utilities ──
    const copyToClipboard = async () => {
        if (!outputText) return;
        try {
            await navigator.clipboard.writeText(outputText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent catch */
        }
    };

    const clearWorkspace = () => {
        setInputText("");
        setOutputText("");
    };

    const downloadTextFile = () => {
        if (!outputText) return;
        const element = document.createElement("a");
        const file = new Blob([outputText], { type: "text/plain;charset=utf-8" });
        element.href = URL.createObjectURL(file);
        element.download = "zalgo-glitch-text.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Calculate Unicode Character & Combining Marker Metrics
    const charCount = Array.from(inputText).length;
    const totalCombiningMarks = (outputText.match(/[\u0300-\u036f]/g) || []).length;
    const totalPayloadLength = outputText.length;

    return (
        <div className="w-full space-y-8">
            {/* ── Two-Column Workspace Grid (50/50 Split) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: CONTROLS & INPUT ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 aspect-square">
                                    <Zap className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">
                                        Zalgo Corruption Engine
                                    </h2>
                                    <p className="text-xs text-indigo-200">
                                        Browser-Native Combining Mark Generator
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Preset Selector Badges */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                    Corruption Presets
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: "mild", label: "Mild Glitch", icon: Activity },
                                        { id: "heavy", label: "Heavy Chaos", icon: Flame },
                                        { id: "maximum", label: "Void Overload", icon: ShieldAlert },
                                        { id: "creepypasta", label: "Ascending", icon: Terminal },
                                    ].map((p) => {
                                        const IconComp = p.icon;
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => applyPreset(p.id)}
                                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border min-h-[40px] ${preset === p.id
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <IconComp className="w-3.5 h-3.5" />
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sliders & Configuration Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                        Diacritic Parameters
                                    </span>
                                    <button
                                        onClick={generateZalgo}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Reshuffle
                                    </button>
                                </div>

                                {/* Glitch Intensity Slider */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-slate-600">
                                            Glitch Intensity
                                        </span>
                                        <span className="font-mono text-indigo-600 font-bold">
                                            {glitchIntensity}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        step="1"
                                        value={glitchIntensity}
                                        onChange={(e) => {
                                            setGlitchIntensity(Number(e.target.value));
                                            setPreset("custom");
                                        }}
                                        className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                                    />
                                </div>

                                {/* Max Diacritics Per Character */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-slate-600">
                                            Max Diacritics / Char
                                        </span>
                                        <span className="font-mono text-indigo-600 font-bold">
                                            {maxDiacriticsPerChar} marks
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        step="1"
                                        value={maxDiacriticsPerChar}
                                        onChange={(e) => {
                                            setMaxDiacriticsPerChar(Number(e.target.value));
                                            setPreset("custom");
                                        }}
                                        className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                                    />
                                </div>

                                {/* Direction Checkboxes */}
                                <div className="space-y-2 pt-1">
                                    <span className="text-xs font-semibold text-slate-600 block">
                                        Diacritic Directional Toggles
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeUp}
                                                onChange={(e) => {
                                                    setIncludeUp(e.target.checked);
                                                    setPreset("custom");
                                                }}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            />
                                            Above (Up)
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeMid}
                                                onChange={(e) => {
                                                    setIncludeMid(e.target.checked);
                                                    setPreset("custom");
                                                }}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            />
                                            Middle (Overlay)
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeDown}
                                                onChange={(e) => {
                                                    setIncludeDown(e.target.checked);
                                                    setPreset("custom");
                                                }}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            />
                                            Below (Down)
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Input Text Area */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label
                                        htmlFor="zalgo-input-area"
                                        className="text-xs font-semibold text-slate-700 block"
                                    >
                                        Source Text Input
                                    </label>
                                    <button
                                        onClick={handleStripZalgoInput}
                                        className="text-xs text-indigo-600 hover:underline font-semibold"
                                        title="Remove all combining diacritic marks from input text"
                                    >
                                        Strip Zalgo Marks
                                    </button>
                                </div>
                                <textarea
                                    id="zalgo-input-area"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Enter text to corrupt with Zalgo combining marks..."
                                    className="font-mono text-sm h-[200px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-600 min-w-0"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={generateZalgo}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 min-h-[44px]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Regenerate
                                </button>
                                <button
                                    onClick={clearWorkspace}
                                    disabled={!inputText}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear Input
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: PREVIEW & EXPORT ══════════════════ */}
                <div className="space-y-5">
                    <div className="sticky top-4 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                            {/* Header Bar */}
                            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 aspect-square">
                                        <Activity className="w-5 h-5 text-indigo-200" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold leading-tight">
                                            Glitch Preview &amp; Output
                                        </h2>
                                        <p className="text-xs text-indigo-200">
                                            Real-Time Rendering Output
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Visualizer Output Container */}
                                <div className="bg-slate-900 rounded-xl p-6 min-h-[220px] max-h-[280px] overflow-y-auto font-mono text-base leading-relaxed text-indigo-300 break-words border border-slate-800 selection:bg-indigo-500 selection:text-white">
                                    {outputText ? (
                                        outputText
                                    ) : (
                                        <span className="text-slate-600 italic text-sm">
                                            Corrupted glitch text will appear here...
                                        </span>
                                    )}
                                </div>

                                {/* Metrics Card Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Plain Chars
                                        </p>
                                        <p className="text-sm font-mono font-bold text-slate-800">
                                            {charCount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Combining Marks
                                        </p>
                                        <p className="text-sm font-mono font-bold text-indigo-600">
                                            {totalCombiningMarks.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Byte Weight
                                        </p>
                                        <p className="text-sm font-mono font-bold text-emerald-600">
                                            {totalPayloadLength.toLocaleString()} B
                                        </p>
                                    </div>
                                </div>

                                {/* Secondary Action Controls */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={copyToClipboard}
                                        disabled={!outputText}
                                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${outputText
                                            ? copied
                                                ? "bg-green-500 text-white shadow-md shadow-green-200"
                                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            }`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copied to Clipboard!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy Glitch Text
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={downloadTextFile}
                                        disabled={!outputText}
                                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all bg-slate-800 hover:bg-slate-900 text-white min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export TXT
                                    </button>
                                </div>
                            </div>
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
                        <span>Technical Mechanics of Zalgo and Glitch Text Generation</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            <strong>Zalgo Text</strong> (frequently referred to as <em>glitch text</em>, <em>cursed text</em>, or <em>void text</em>) is an optical typography phenomenon created by stacking multiple Unicode <strong>Combining Diacritical Marks</strong> on top of standard alphanumeric characters. Rather than relying on custom fonts or image files, Zalgo text consists entirely of valid Unicode characters that native browser rendering engines stack vertically and horizontally.
                        </p>
                        <p>
                            The term originated in 2004 from internet meme culture, referencing an eldritch entity symbolizing total chaos and structural corruption. From a software engineering perspective, the effect takes advantage of the Unicode Standard's support for non-spacing combining characters—originally designed for multi-accented international scripts like Greek, Hebrew, Arabic, and Devanagari.
                        </p>
                        <p>
                            Modern web rendering engines (like Blink, Gecko, and WebKit) interpret combining marks by overlaying them onto the preceding base character. When dozens of combining marks are appended to a single letter, the rendered output spills over surrounding DOM containers, creating a distorted, visual "glitch" effect.
                        </p>
                    </div>
                </div>

                {/* Card 2: Deep-Dive Unicode Combining Marks Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Binary className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Unicode Combining Diacritical Marks Block (U+0300 – U+036F)</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            The primary engine driving Zalgo generation is the <strong>Combining Diacritical Marks Unicode Block</strong> (ranging from codepoints <code>U+0300</code> through <code>U+036F</code>). Unlike standard base characters, combining marks have zero intrinsic width. They modify the preceding character according to three primary spatial dimensions:
                        </p>

                        <div className="grid md:grid-cols-3 gap-4 my-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                    1. Above / Up (Supra-Diacritics)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Codepoints like <code>U+0300</code> (Grave Accent) and <code>U+030D</code> (Vertical Line Above) stack upward above the baseline, expanding vertical line height.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                    2. Middle / Overlay (Intra-Diacritics)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Codepoints like <code>U+0334</code> (Combining Tilde Overlay) and <code>U+0336</code> (Combining Long Stroke) cut directly through the middle of character glyphs.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                    3. Below / Down (Infra-Diacritics)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Codepoints like <code>U+0316</code> (Grave Below) and <code>U+0323</code> (Dot Below) trail downward below the baseline into adjacent UI components.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs sm:text-sm space-y-2 border border-slate-800">
                            <p className="text-indigo-300 font-bold">// Programmatic Breakdown of a Zalgo Byte Sequence</p>
                            <p>Base Character: &apos;A&apos; (U+0041) -&gt; 1 Byte (UTF-8)</p>
                            <p>+ Mark Above: U+030D -&gt; 2 Bytes (UTF-8)</p>
                            <p>+ Mark Below: U+0323 -&gt; 2 Bytes (UTF-8)</p>
                            <p>Combined Result String Length: 3 Code Units | Byte Size: 5 Bytes</p>
                        </div>
                    </div>
                </div>

                {/* Card 3: Platform Compatibility & Sanitization Security */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Platform Compatibility, Database Performance, &amp; Sanitization</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Because Zalgo text relies entirely on standard Unicode specifications, it is natively compatible with most modern social media platforms, messaging apps, and operating systems including Discord, TikTok, Twitter/X, Instagram, WhatsApp, Windows, macOS, iOS, and Android.
                        </p>
                        <p>
                            However, extreme Zalgo text introduces technical considerations for software developers and database administrators:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 text-sm md:text-base">
                            <li>
                                <strong>Database Payload Amplification:</strong> A simple 10-character string can swell from 10 bytes to over 1,000 bytes when heavily corrupted with diacritical marks. Unbounded Zalgo text can cause buffer overflows or exhaust database column character limits (e.g., <code>VARCHAR(255)</code>).
                            </li>
                            <li>
                                <strong>UI Clipping and Overflow:</strong> Extreme vertical stacking forces text to bleed out of container bounds, causing visual overlap with surrounding UI elements or triggering accidental scrollbars.
                            </li>
                            <li>
                                <strong>Sanitization Regex:</strong> Web applications can easily strip Zalgo diacritical marks without losing the core plain text using the regular expression <code>/[\u0300-\u036f]/g</code>.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Card 4: Detailed Preset & Intensity Comparison Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <LayoutGrid className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Glitch Intensity &amp; Structural Presets Comparison</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs sm:text-sm">
                                    <th className="p-3 sm:p-4">Preset Tier</th>
                                    <th className="p-3 sm:p-4">Diacritics / Char</th>
                                    <th className="p-3 sm:p-4">Active Directions</th>
                                    <th className="p-3 sm:p-4">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Mild Glitch</td>
                                    <td className="p-3 sm:p-4 font-mono">1 – 6 Marks</td>
                                    <td className="p-3 sm:p-4">Above &amp; Below</td>
                                    <td className="p-3 sm:p-4">Subtle aesthetic text for social bios and usernames</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Heavy Chaos</td>
                                    <td className="p-3 sm:p-4 font-mono">10 – 22 Marks</td>
                                    <td className="p-3 sm:p-4">Above, Middle, Below</td>
                                    <td className="p-3 sm:p-4">Gaming clan tags, Discord status, horror stories</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Void Overload</td>
                                    <td className="p-3 sm:p-4 font-mono">25 – 40+ Marks</td>
                                    <td className="p-3 sm:p-4">Above, Middle, Below</td>
                                    <td className="p-3 sm:p-4">Maximum visual distortion and meme generation</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Ascending (Creepypasta)</td>
                                    <td className="p-3 sm:p-4 font-mono">12 – 18 Marks</td>
                                    <td className="p-3 sm:p-4">Above &amp; Middle Only</td>
                                    <td className="p-3 sm:p-4">Text styled to glitch strictly upward across headers</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 5: Step-by-Step User Workflows */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>User Instructions &amp; Step-by-Step Workflows</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" />
                                Generating Custom Glitch Text
                            </h3>
                            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                                <li>Type or paste plain text into the <strong>Source Text Input</strong> box.</li>
                                <li>Select a quick preset badge or manually adjust the <strong>Glitch Intensity</strong> slider.</li>
                                <li>Toggle direction checkboxes to direct glitch expansion (Above, Middle, Below).</li>
                                <li>Click <strong>Regenerate / Reshuffle</strong> to randomize diacritic positioning.</li>
                                <li>Click <strong>Copy Glitch Text</strong> to save to your clipboard.</li>
                            </ol>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Sanitizing Zalgo Marks Back to Plain Text
                            </h3>
                            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                                <li>Paste any corrupted Zalgo string into the input area.</li>
                                <li>Click the <strong>Strip Zalgo Marks</strong> button located above the input box.</li>
                                <li>The engine instantly strips all combining diacritics via Unicode regex.</li>
                                <li>Copy the restored, clean plain text output for standard use.</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Card 6: Static Border-Highlighted FAQ Section */}
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
                                q: "What is Zalgo text and how does it work?",
                                a: "Zalgo text is generated by taking standard letters and attaching dozens of Unicode Combining Diacritical Marks (U+0300 to U+036F). Modern web browsers render these marks stacked vertically or horizontally on top of the base character.",
                            },
                            {
                                q: "Will Zalgo text work on Discord, Instagram, and TikTok?",
                                a: "Yes. Because Zalgo text is valid Unicode rather than an image or custom font file, it can be copied and pasted directly into Discord messages, TikTok captions, Twitter posts, Instagram bios, and gaming usernames.",
                            },
                            {
                                q: "Why does Zalgo text break or bleed out of website layouts?",
                                a: "Standard website CSS usually limits horizontal element bounds but allows vertical text overflow unless CSS properties like overflow: hidden or line-height clipping are specifically enforced. Excessive vertical combining marks cause text to overlap surrounding HTML elements.",
                            },
                            {
                                q: "How can I remove Zalgo glitch effects and restore original text?",
                                a: "You can remove Zalgo glitch effects instantly using our built-in 'Strip Zalgo Marks' button, or programmatically using JavaScript with the regex replace pattern: text.replace(/[\\u0300-\\u036f]/g, '').",
                            },
                            {
                                q: "Does Zalgo text impact site performance or security?",
                                a: "Zalgo text does not execute malicious scripts or pose security risks. However, extremely long Zalgo strings contain thousands of combining characters, which can increase payload byte size and cause temporary rendering slowness in unoptimized text areas.",
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
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">
                                    {a}
                                </p>
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
                        name: "Zalgo Glitch Text Generator",
                        applicationCategory: "UtilityApplication",
                        operatingSystem: "All",
                        description:
                            "Client-side Zalgo glitch text generator and Unicode combining mark sanitizer. Create cursed text, adjust corruption parameters, and strip diacritics in real-time.",
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
                                name: "What is Zalgo text and how does it work?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Zalgo text is generated by appending Unicode Combining Diacritical Marks (U+0300 to U+036F) to standard characters, causing browsers to render stacked diacritics.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Will Zalgo text work on Discord, Instagram, and TikTok?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, Zalgo text is plain Unicode text and works across most social media platforms and messaging apps.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why does Zalgo text break or bleed out of website layouts?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Excessive combining marks extend vertically beyond normal CSS line-height bounding boxes, causing marks to render over adjacent HTML elements.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "How can I remove Zalgo glitch effects and restore original text?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "You can strip all combining diacritical marks using the regular expression /[\\u0300-\\u036f]/g.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Does Zalgo text impact site performance or security?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Zalgo text is non-executable and safe, though very large payloads can increase byte size and slow rendering in basic text containers.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}