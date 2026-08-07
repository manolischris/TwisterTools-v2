"use client";

import React, { useState, useTransition, useCallback, useEffect } from "react";
import {
    Sliders,
    Type,
    Copy,
    Check,
    RefreshCw,
    AlignLeft,
    BookOpen,
    Clock,
    Database,
    Cpu,
    HelpCircle,
    ShieldCheck,
    Sparkles,
    CheckCircle2,
    Layers,
    Terminal,
    Globe,
    Zap,
    Download
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  LEXICAL PHONEME & PHONOTACTIC DICTIONARIES
// ─────────────────────────────────────────────────────────────

type Mode = "fantasy" | "scifi" | "tech" | "brand";

interface PhonemeSet {
    onsets: string[];
    nuclei: string[];
    codas: string[];
    prefixes: string[];
    suffixes: string[];
    sampleName: string;
}

const PHONOTACTICS: Record<Mode, PhonemeSet> = {
    fantasy: {
        onsets: ["Th", "Val", "Aer", "Gal", "Mith", "Eldr", "Syl", "Zeph", "Kael", "Thor", "Drak", "Bael", "Nyx", "Aet", "Mor"],
        nuclei: ["ae", "ea", "io", "au", "ei", "oo", "ia", "ua", "y", "a", "e", "i", "o", "u"],
        codas: ["dor", "mir", "reth", "lis", "gorn", "vath", "thas", "morn", "lyn", "gard", "ron", "wynd", "las", "mancer"],
        prefixes: ["Arch", "High", "Shadow", "Sun", "Star", "Iron", "Storm", "Frost", "Blood"],
        suffixes: ["ium", "or", "ath", "is", "oth", "wyn", "ia", "dor", "gard"],
        sampleName: "Elvish & Mythic Lore"
    },
    scifi: {
        onsets: ["Xyl", "Zeta", "Kry", "Vex", "Qor", "Zor", "Nod", "Plex", "Thrax", "Cy", "Vol", "Omn", "Xen", "Dra", "Bix"],
        nuclei: ["o", "u", "i", "e", "a", "oi", "ax", "ex", "ix", "ox", "ux"],
        codas: ["tron", "vax", "tech", "morphe", "grid", "core", "sing", "flux", "plex", "trit", "zar", "xon", "noid", "dyne"],
        prefixes: ["Quantum", "Cyber", "Hyper", "Neo", "Proto", "Astra", "Exo", "Sub"],
        suffixes: ["ion", "ex", "ix", "ox", "ron", "tix", "oid", "ite"],
        sampleName: "Alien & Deep Space Tech"
    },
    tech: {
        onsets: ["Bit", "Sync", "Net", "Data", "Cloud", "Byte", "Stack", "Node", "Flow", "Link", "Flex", "Grid", "Core", "Dev", "Ops"],
        nuclei: ["a", "e", "i", "o", "u", "y", "io", "ee"],
        codas: ["ly", "io", "ify", "hub", "lab", "base", "cast", "ware", "ment", "pulse", "scape", "nest", "forge", "mesh"],
        prefixes: ["Meta", "Omni", "Hyper", "Micro", "Poly", "Uni", "Auto", "Ultra"],
        suffixes: ["ly", "io", "sy", "hq", "ai", "app", "dev", "ops"],
        sampleName: "SaaS & Cloud Software"
    },
    brand: {
        onsets: ["Vel", "Lum", "Nov", "Viv", "Aura", "Zen", "Sol", "Ver", "Kinet", "Crest", "Apex", "Vect", "Omni", "Mer", "Alt"],
        nuclei: ["a", "e", "i", "o", "u", "ia", "eo"],
        codas: ["a", "o", "is", "us", "ix", "um", "ora", "ance", "ura", "os", "ent", "ic", "ia", "ex"],
        prefixes: ["Nova", "Aura", "Vita", "Terra", "Velo", "Pure", "True", "Prime"],
        suffixes: ["a", "ia", "o", "us", "ix", "is", "ex", "um"],
        sampleName: "Modern Consumer Startup"
    }
};

// ─────────────────────────────────────────────────────────────
//  GENERATION ENGINE
// ─────────────────────────────────────────────────────────────

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function capitalizeFirst(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function generateSingleWord(mode: Mode, syllableCount: number): string {
    const p = PHONOTACTICS[mode];
    let word = "";

    for (let i = 0; i < syllableCount; i++) {
        if (i === 0) {
            word += getRandomElement(p.onsets) + getRandomElement(p.nuclei);
        } else if (i === syllableCount - 1) {
            word += getRandomElement(p.nuclei) + getRandomElement(p.codas);
        } else {
            word += getRandomElement(p.onsets).toLowerCase() + getRandomElement(p.nuclei);
        }
    }

    // Clean up duplicated adjacent letters
    word = word.replace(/(.)\1{2,}/g, "$1$1");
    return capitalizeFirst(word);
}

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function FakeWordGenerator() {
    const [mode, setMode] = useState<Mode>("brand");
    const [wordCountInput, setWordCountInput] = useState<string>("10");
    const [syllableCount, setSyllableCount] = useState<number>(2);
    const [includeDefinitions, setIncludeDefinitions] = useState<boolean>(true);
    const [formatType, setFormatType] = useState<"list" | "csv" | "json">("list");

    const [output, setOutput] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);
    const [, startTransition] = useTransition();

    // Metrics state
    const [totalWords, setTotalWords] = useState<number>(0);
    const [totalChars, setTotalChars] = useState<number>(0);
    const [byteSize, setByteSize] = useState<number>(0);

    // Mock Definition Logic for Novel Words
    const generateFakeDefinition = useCallback((word: string, category: Mode): string => {
        const partsOfSpeech = ["noun", "verb", "adjective"];
        const pos = getRandomElement(partsOfSpeech);

        const descriptors: Record<Mode, string[]> = {
            fantasy: ["An ancient artifact found in lost ruins", "A mythical creature of the high realm", "The act of channeling arcane energy", "A sacred glyph engraved in stone"],
            scifi: ["A quantum particle operating in higher dimensions", "A sub-light propulsion module", "To calibrate neural matrix pathways", "A synthetic alloy resistant to plasma"],
            tech: ["A distributed database synchronization protocol", "To optimize serverless execution flow", "An AI-driven automated pipeline metric", "A lightweight container orchestrator"],
            brand: ["A state of seamless digital productivity", "An innovative consumer lifestyle product", "To elevate everyday user experiences", "A premium aesthetic design philosophy"]
        };

        const desc = getRandomElement(descriptors[category]);
        return `(${pos}) ${desc}.`;
    }, []);

    // Core Calculation Handler
    const generateWords = useCallback(() => {
        const count = parseInt(wordCountInput, 10) || 1;
        const generatedList: { word: string; definition: string; pos?: string }[] = [];

        for (let i = 0; i < count; i++) {
            const word = generateSingleWord(mode, syllableCount);
            const definition = generateFakeDefinition(word, mode);
            generatedList.push({ word, definition });
        }

        let formattedResult = "";

        if (formatType === "json") {
            const jsonOutput = generatedList.map(item => ({
                word: item.word,
                category: mode,
                syllables: syllableCount,
                ...(includeDefinitions && { definition: item.definition })
            }));
            formattedResult = JSON.stringify(jsonOutput, null, 2);
        } else if (formatType === "csv") {
            if (includeDefinitions) {
                formattedResult = "Word,Category,Syllables,Definition\n" +
                    generatedList.map(item => `"${item.word}","${mode}",${syllableCount},"${item.definition}"`).join("\n");
            } else {
                formattedResult = "Word,Category,Syllables\n" +
                    generatedList.map(item => `"${item.word}","${mode}",${syllableCount}`).join("\n");
            }
        } else {
            // Default: List format
            formattedResult = generatedList.map((item, idx) => {
                if (includeDefinitions) {
                    return `${idx + 1}. ${item.word} - ${item.definition}`;
                }
                return `${idx + 1}. ${item.word}`;
            }).join("\n");
        }

        setOutput(formattedResult);

        // Calculate metrics
        setTotalWords(generatedList.length);
        setTotalChars(formattedResult.length);
        setByteSize(new TextEncoder().encode(formattedResult).length);
    }, [mode, wordCountInput, syllableCount, includeDefinitions, formatType, generateFakeDefinition]);

    // Update on state change using React transition
    useEffect(() => {
        startTransition(() => {
            generateWords();
        });
    }, [generateWords]);

    // Handle number input with zero sanitization
    const handleWordCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawVal = e.target.value;
        if (rawVal === "") {
            setWordCountInput("");
            return;
        }
        const cleanVal = rawVal.replace(/^0+/, "");
        const parsed = parseInt(cleanVal, 10);
        if (isNaN(parsed)) {
            setWordCountInput("");
        } else {
            const clamped = Math.min(Math.max(1, parsed), 500);
            setWordCountInput(clamped.toString());
        }
    };

    const handleCopy = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback handling
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        return `${(bytes / 1024).toFixed(2)} KB`;
    };

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">

                {/* ══════════════════ LEFT PANEL: CONTROLS ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Title Header System */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                                <Sliders className="w-5 h-5 text-indigo-200" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-snug">Nonsense Vocabulary Generator</h1>
                                <p className="text-xs text-indigo-100/80">Configure phonetics, theme, and structures</p>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Theme / Phonetic Model */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Type className="w-3.5 h-3.5 text-indigo-600" />
                                    Phonetic Theme & Style
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "brand", label: "Brand / Startup", desc: "SaaS & Consumer" },
                                        { id: "tech", label: "Tech / Cyber", desc: "Dev & Science" },
                                        { id: "fantasy", label: "Fantasy / Lore", desc: "Elvish & Mythic" },
                                        { id: "scifi", label: "Sci-Fi / Alien", desc: "Futuristic" },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setMode(item.id as Mode)}
                                            className={`p-3 rounded-xl text-left border transition-all ${mode === item.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            <p className="text-xs font-bold">{item.label}</p>
                                            <p className={`text-[10px] mt-0.5 ${mode === item.id ? "text-indigo-100" : "text-slate-500"}`}>
                                                {item.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Syllable Depth Slider / Buttons */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                    <span>Syllable Complexity</span>
                                    <span className="text-indigo-600 font-bold">{syllableCount} Syllables</span>
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setSyllableCount(num)}
                                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${syllableCount === num
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {num} {num === 1 ? "Syllable" : "Syllables"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity Input */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="word-count-input"
                                    className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between"
                                >
                                    <span>Word Count Quantity</span>
                                    <span className="text-slate-400 font-normal lowercase">(Max 500)</span>
                                </label>
                                <input
                                    id="word-count-input"
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={wordCountInput}
                                    onChange={handleWordCountChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                                    placeholder="Enter word count..."
                                />
                            </div>

                            {/* Format & Definitions */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Export Structure
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: "list", label: "Numbered List" },
                                            { id: "csv", label: "CSV Table" },
                                            { id: "json", label: "JSON Array" },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setFormatType(item.id as "list" | "csv" | "json")}
                                                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${formatType === item.id
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                                    <input
                                        type="checkbox"
                                        checked={includeDefinitions}
                                        onChange={(e) => setIncludeDefinitions(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-medium text-slate-700">
                                        Generate AI-style pseudo dictionary definitions
                                    </span>
                                </label>
                            </div>

                            {/* Regenerate Action */}
                            <div className="pt-2">
                                <button
                                    onClick={generateWords}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all min-h-[44px]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Generate Fake Vocabulary
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: PREVIEW & METRICS ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden flex flex-col min-w-0">
                        {/* Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-indigo-200" />
                                <span className="text-sm font-semibold">Generated Vocabulary Matrix</span>
                            </div>
                            <button
                                onClick={handleCopy}
                                disabled={!output}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-medium rounded-lg transition-all border border-white/10"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>

                        <div className="p-5 space-y-4 flex-1 flex flex-col">
                            {/* Preview Window */}
                            <div className="relative flex-1 min-w-0">
                                <textarea
                                    readOnly
                                    value={output}
                                    placeholder="Generated vocabulary will appear here..."
                                    className="w-full h-[320px] p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-800 focus:outline-none resize-none leading-relaxed min-w-0"
                                />
                            </div>

                            {/* Performance Metrics */}
                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                        Words
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">{totalWords}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                        Characters
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">{totalChars}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                        Size
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">{formatBytes(byteSize)}</p>
                                </div>
                            </div>

                            {/* Primary CTA */}
                            <button
                                onClick={handleCopy}
                                disabled={!output}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${copied
                                    ? "bg-green-600 text-white shadow-md shadow-green-100"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied to Clipboard!" : "Copy Generated Words"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT (EXPANDED SEO CARDS)
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-6">
                {/* Card 1: Overview and Phonotactic Engineering */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Understanding Fake Word Generation: Phonotactic Architecture</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            A <strong>Fake Word & Nonsense Vocabulary Generator</strong> is an advanced linguistic and phonetic tool designed to craft pronounceable, authentic-sounding pseudowords (neologisms) that do not exist in standard natural dictionaries. Unlike basic random string generators, phonotactic generation abides by strict structural patterns of human speech, combining onsets, nuclei, and codas to form harmonized syllables.
                        </p>
                        <p>
                            Whether you are naming a brand startup, world-building fantasy lore, generating unique sci-fi terms, or constructing test fixtures for natural language processing (NLP) models, phonotactically generated terms provide believable aesthetic resonance.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 pt-2">
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Phonotactic Constraints
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Ensures letter groupings adhere to natural language vocal rules, preventing impossible consonant clusters like &quot;rtxzk&quot;.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Multi-Syllabic Customization
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Allows precise control over word complexity, ranging from punchy monosyllabic brand names to intricate 4-syllable fantasy terms.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Contextual Definitions
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Pairs generated words with synthetic dictionary definitions, ideal for games, creative writing, and sample dummy data.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Industry Use Cases & Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Phonetic Theme Selection Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate phonetic model aligns generated terms with specific target domains and brand aesthetics:
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                                    <th className="p-3 font-semibold">Phonetic Mode</th>
                                    <th className="p-3 font-semibold">Phoneme Corpus</th>
                                    <th className="p-3 font-semibold">Primary Applications</th>
                                    <th className="p-3 font-semibold">Sample Generation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                                <tr>
                                    <td className="p-3 font-semibold text-indigo-600">Brand / Startup</td>
                                    <td className="p-3">Smooth Vowels & Soft Stop Consonants</td>
                                    <td className="p-3">SaaS Naming, Domain Selection, Product Line Branding</td>
                                    <td className="p-3">&quot;Velluma&quot;, &quot;Kinetix&quot;</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-indigo-600">Tech / Cyber</td>
                                    <td className="p-3">Plosive Sounds & Digital Affixes</td>
                                    <td className="p-3">Developer Frameworks, Cloud Infrastructure, APIs</td>
                                    <td className="p-3">&quot;Synclab&quot;, &quot;Byteforge&quot;</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-indigo-600">Fantasy / Lore</td>
                                    <td className="p-3">Soft Fricatives & Liquid Consonants</td>
                                    <td className="p-3">World Building, RPG Character Naming, Mythic Places</td>
                                    <td className="p-3">&quot;Aerthas&quot;, &quot;Valgorn&quot;</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-indigo-600">Sci-Fi / Alien</td>
                                    <td className="p-3">Hard Fricatives & Exotic Cluster Onsets</td>
                                    <td className="p-3">Sci-Fi Novels, Space Games, Futuristic Hardware</td>
                                    <td className="p-3">&quot;Xylotrit&quot;, &quot;Zetavax&quot;</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Technical Execution & Speed */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Under the Hood: Client-Side Phoneme Synthesis</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Our engine processes phonetic arrays inside client-side memory using deterministic sampling algorithms:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Terminal className="w-4 h-4" />
                                1. Syllables & Onset Extraction
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Slices curated phonemes into compatible initial sound groups (onsets), vowel roots (nuclei), and closing consonants (codas).
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Zap className="w-4 h-4" />
                                2. Zero-Latency Concurrent State
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Uses React&apos;s non-blocking <code className="text-indigo-600">useTransition</code> hook to ensure instant recalculation as slider parameters adjust.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 4: FAQ Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base mb-2">
                                Are the generated words guaranteed to be trademark-free?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While our algorithm synthesizes entirely fake pseudowords, you should always conduct a formal trademark check (such as USPTO or WIPO) before finalizing commercial brand selection.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base mb-2">
                                Can I export words directly to developer formats like JSON or CSV?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can switch export modes between Numbered List, CSV, and formatted JSON arrays for easy integration into mock databases or spreadsheets.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base mb-2">
                                Is my data processed on an external server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All phonetic generation happens 100% locally in your web browser with zero server transmission.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 5: Security Statement */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Client-Side Privacy Guarantee</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        TwisterTools operates strictly on a client-first paradigm. None of your generated vocabulary terms, custom counts, or export preferences are recorded or sent to remote endpoints.
                    </p>
                </div>
            </section>

            {/* JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Fake Word & Nonsense Vocabulary Generator",
                        url: "https://twistertools.com/tools/text-tools/fake-word-generator",
                        applicationCategory: "DeveloperApplication",
                        operatingSystem: "All",
                        description:
                            "Generate unique fake words, pseudowords, and nonsense vocabulary across Brand, Tech, Fantasy, and Sci-Fi themes with JSON, CSV, and definition export options.",
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
                                name: "Are the generated words guaranteed to be trademark-free?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "While synthesized pseudowords are original, formal trademark verification is recommended prior to commercial brand use.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Can I export words directly to developer formats like JSON or CSV?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, export structures include Numbered List, CSV, and formatted JSON arrays.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Is my data processed on an external server?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No, all phoneme calculation executes entirely within your client web browser.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}