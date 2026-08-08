"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Radio,
    Volume2,
    VolumeX,
    Play,
    Square,
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
    Download,
    Settings,
    BookOpen,
    Cpu,
    RadioTower,
    Award,
    Hash,
    Share2,
    Terminal,
    Globe,
    CheckCircle2,
    ShieldCheck,
    AlertCircle,
} from "lucide-react";

// Standard NATO Phonetic Alphabet Dictionary according to ICAO / ITU / NATO / IMO standards
const NATO_DICTIONARY: Record<string, { code: string; phonic: string; stress: string }> = {
    A: { code: "Alfa", phonic: "AL-fah", stress: "AL" },
    B: { code: "Bravo", phonic: "BRAH-voh", stress: "BRAH" },
    C: { code: "Charlie", phonic: "CHAR-lee", stress: "CHAR" },
    D: { code: "Delta", phonic: "DELL-tah", stress: "DELL" },
    E: { code: "Echo", phonic: "ECK-oh", stress: "ECK" },
    F: { code: "Foxtrot", phonic: "FOKS-trot", stress: "FOKS" },
    G: { code: "Golf", phonic: "GOLF", stress: "GOLF" },
    H: { code: "Hotel", phonic: "HOH-tell", stress: "TELL" },
    I: { code: "India", phonic: "IN-dee-ah", stress: "IN" },
    J: { code: "Juliett", phonic: "JEW-lee-ett", stress: "ETT" },
    K: { code: "Kilo", phonic: "KEY-loh", stress: "KEY" },
    L: { code: "Lima", phonic: "LEE-mah", stress: "LEE" },
    M: { code: "Mike", phonic: "MIKE", stress: "MIKE" },
    N: { code: "November", phonic: "NO-vem-ber", stress: "VEM" },
    O: { code: "Oscar", phonic: "OSS-cah", stress: "OSS" },
    P: { code: "Papa", phonic: "PAH-pah", stress: "PAH" },
    Q: { code: "Quebec", phonic: "KEH-beck", stress: "BECK" },
    R: { code: "Romeo", phonic: "ROW-me-oh", stress: "ROW" },
    S: { code: "Sierra", phonic: "SEE-air-rah", stress: "SEE" },
    T: { code: "Tango", phonic: "TANG-go", stress: "TANG" },
    U: { code: "Uniform", phonic: "YOU-nee-form", stress: "YOU" },
    V: { code: "Victor", phonic: "VIK-tah", stress: "VIK" },
    W: { code: "Whiskey", phonic: "WISS-key", stress: "WISS" },
    X: { code: "X-ray", phonic: "ECKS-ray", stress: "ECKS" },
    Y: { code: "Yankee", phonic: "YANG-key", stress: "YANG" },
    Z: { code: "Zulu", phonic: "ZOO-loo", stress: "ZOO" },
    "0": { code: "Zero", phonic: "ZEE-roh", stress: "ROH" },
    "1": { code: "One", phonic: "WUN", stress: "WUN" },
    "2": { code: "Two", phonic: "TOO", stress: "TOO" },
    "3": { code: "Three", phonic: "TREE", stress: "TREE" },
    "4": { code: "Four", phonic: "FOW-er", stress: "FOW" },
    "5": { code: "Five", phonic: "FIFE", stress: "FIFE" },
    "6": { code: "Six", phonic: "SIX", stress: "SIX" },
    "7": { code: "Seven", phonic: "SEV-vin", stress: "SEV" },
    "8": { code: "Eight", phonic: "AIT", stress: "AIT" },
    "9": { code: "Nine", phonic: "NINER", stress: "NI" },
};

// Reverse map for decoding phonetic codewords back to plain text
const REVERSE_NATO_DICTIONARY: Record<string, string> = Object.entries(
    NATO_DICTIONARY
).reduce((acc, [char, data]) => {
    acc[data.code.toUpperCase()] = char;
    return acc;
}, {} as Record<string, string>);

type Mode = "encode" | "decode";
type SeparatorType = "space" | "hyphen" | "newline" | "slash";

interface ParsedWord {
    raw: string;
    letters: Array<{
        char: string;
        code: string;
        phonic: string;
        isKnown: boolean;
    }>;
}

export default function NatoPhoneticConverter() {
    // ── Core State ──
    const [mode, setMode] = useState<Mode>("encode");
    const [inputText, setInputText] = useState("");
    const [separator, setSeparator] = useState<SeparatorType>("space");
    const [includePhonetics, setIncludePhonetics] = useState(false);

    // ── Output State ──
    const [outputText, setOutputText] = useState("");
    const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
    const [copied, setCopied] = useState(false);

    // ── Speech Synthesis State ──
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechRate, setSpeechRate] = useState(1);
    const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

    // ── Metrics ──
    const [letterCount, setLetterCount] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [digitCount, setDigitCount] = useState(0);

    // ── Conversion & Parsing Logic ──
    const processTranslation = useCallback(() => {
        if (!inputText.trim()) {
            setOutputText("");
            setParsedWords([]);
            setLetterCount(0);
            setWordCount(0);
            setDigitCount(0);
            return;
        }

        if (mode === "encode") {
            const words = inputText.split(/\s+/).filter(Boolean);
            let lettersTotal = 0;
            let digitsTotal = 0;

            const delimiter =
                separator === "hyphen"
                    ? " - "
                    : separator === "newline"
                        ? "\n"
                        : separator === "slash"
                            ? " / "
                            : " ";

            const structured: ParsedWord[] = [];
            const outputLines: string[] = [];

            words.forEach((word) => {
                const parsedLetters: ParsedWord["letters"] = [];
                const wordCodeWords: string[] = [];

                for (const char of word) {
                    const upper = char.toUpperCase();
                    if (/[0-9]/.test(upper)) digitsTotal++;
                    if (/[A-Z]/.test(upper)) lettersTotal++;

                    if (NATO_DICTIONARY[upper]) {
                        const entry = NATO_DICTIONARY[upper];
                        parsedLetters.push({
                            char,
                            code: entry.code,
                            phonic: entry.phonic,
                            isKnown: true,
                        });
                        wordCodeWords.push(
                            includePhonetics ? `${entry.code} (${entry.phonic})` : entry.code
                        );
                    } else {
                        parsedLetters.push({
                            char,
                            code: char,
                            phonic: char,
                            isKnown: false,
                        });
                        wordCodeWords.push(char);
                    }
                }

                structured.push({ raw: word, letters: parsedLetters });
                outputLines.push(wordCodeWords.join(delimiter));
            });

            setParsedWords(structured);
            setOutputText(outputLines.join("\n\n"));
            setWordCount(words.length);
            setLetterCount(lettersTotal);
            setDigitCount(digitsTotal);
        } else {
            // Decode Mode: Convert NATO codewords back to plain text
            const tokens = inputText.trim().split(/\s+/);
            let decoded = "";
            let currentWord = "";

            tokens.forEach((token) => {
                const cleanToken = token.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                if (cleanToken === "SLASH" || token === "/") {
                    decoded += " ";
                } else if (REVERSE_NATO_DICTIONARY[cleanToken]) {
                    currentWord += REVERSE_NATO_DICTIONARY[cleanToken];
                } else {
                    currentWord += token;
                }
            });

            decoded += currentWord;
            setOutputText(decoded);
            setWordCount(decoded.split(/\s+/).filter(Boolean).length);
            setLetterCount((decoded.match(/[a-zA-Z]/g) || []).length);
            setDigitCount((decoded.match(/[0-9]/g) || []).length);
        }
    }, [inputText, mode, separator, includePhonetics]);

    useEffect(() => {
        processTranslation();
    }, [processTranslation]);

    // ── Native Web Speech Audio Engine ──
    const stopSpeech = useCallback(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setActiveWordIndex(null);
    }, []);

    useEffect(() => {
        return () => {
            stopSpeech();
        };
    }, [stopSpeech]);

    const speakOutput = () => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            alert("Text-to-speech is not supported in this browser.");
            return;
        }

        if (isSpeaking) {
            stopSpeech();
            return;
        }

        if (!outputText) return;

        // Filter out phonic guides or brackets for clean spoken audio
        const textToRead = outputText.replace(/\([^)]*\)/g, "");
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = speechRate;
        utterance.lang = "en-US";

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            setActiveWordIndex(null);
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            setActiveWordIndex(null);
        };

        window.speechSynthesis.speak(utterance);
    };

    // ── Helper Actions ──
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
        stopSpeech();
        setInputText("");
        setOutputText("");
        setParsedWords([]);
    };

    const loadSample = () => {
        stopSpeech();
        if (mode === "encode") {
            setInputText("Flight 704 requesting clearance for runway 28 left.");
        } else {
            setInputText(
                "Foxtrot Lima India Golf Hotel Tango Seven Zero Four"
            );
        }
    };

    const downloadTextFile = () => {
        if (!outputText) return;
        const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = mode === "encode" ? "nato-phonetic-spelling.txt" : "nato-decoded-text.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full space-y-8">
            {/* ── Two-Column Workspace Grid (50/50 Split) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & CONFIG ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Edge-to-Edge Title Bar Header System */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 aspect-square">
                                    <Radio className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">
                                        NATO Phonetic Encoder
                                    </h2>
                                    <p className="text-xs text-indigo-200">
                                        ICAO &amp; ITU Radiotelephony Standard
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Mode Toggle */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                    Operation Direction
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            stopSpeech();
                                            setMode("encode");
                                            setInputText("");
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${mode === "encode"
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Text to Phonetic
                                    </button>
                                    <button
                                        onClick={() => {
                                            stopSpeech();
                                            setMode("decode");
                                            setInputText("");
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${mode === "decode"
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        <Activity className="w-4 h-4" />
                                        Phonetic to Text
                                    </button>
                                </div>
                            </div>

                            {/* Formatting & Controls Bar */}
                            {mode === "encode" && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                            Formatting Options
                                        </span>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {/* Delimiter Selection */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600 block">
                                                Codeword Separator
                                            </label>
                                            <select
                                                value={separator}
                                                onChange={(e) => setSeparator(e.target.value as SeparatorType)}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                            >
                                                <option value="space">Space (Alfa Bravo)</option>
                                                <option value="hyphen">Hyphen (Alfa - Bravo)</option>
                                                <option value="slash">Forward Slash (Alfa / Bravo)</option>
                                                <option value="newline">New Line (Per Word)</option>
                                            </select>
                                        </div>

                                        {/* Pronunciation Guide Toggle */}
                                        <div className="space-y-1.5 flex flex-col justify-end">
                                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={includePhonetics}
                                                    onChange={(e) => setIncludePhonetics(e.target.checked)}
                                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                />
                                                <span>Include Phonic Guides</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Input Text Area */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="nato-input-text"
                                    className="text-xs font-semibold text-slate-700 block"
                                >
                                    {mode === "encode"
                                        ? "Plaintext Input"
                                        : "NATO Phonetic Codewords (Space Separated)"}
                                </label>
                                <textarea
                                    id="nato-input-text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={
                                        mode === "encode"
                                            ? "Enter callsigns, names, serial numbers, or text to convert..."
                                            : "Enter NATO codewords (e.g. Victor India Charlie Tango Oscar Romeo)..."
                                    }
                                    className="font-mono text-sm h-[200px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-600 min-w-0"
                                />
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={loadSample}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 min-h-[44px]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Load Sample
                                </button>
                                <button
                                    onClick={clearWorkspace}
                                    disabled={!inputText}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear Workspace
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: OUTPUT & VISUALIZER ══════════════════ */}
                <div className="space-y-5">
                    <div className="sticky top-4 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                            {/* Edge-to-Edge Title Bar Header System */}
                            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 aspect-square">
                                        <RadioTower className="w-5 h-5 text-indigo-200" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold leading-tight">
                                            {mode === "encode" ? "Spelling Output" : "Decoded Plaintext"}
                                        </h2>
                                        <p className="text-xs text-indigo-200">
                                            Standard Phonetic Rendering
                                        </p>
                                    </div>
                                </div>

                                {/* Speech Synthesis Controls */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={speakOutput}
                                        disabled={!outputText}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all shadow-sm min-h-[38px] ${isSpeaking
                                            ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                                            : "bg-indigo-500 hover:bg-indigo-400 text-white"
                                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    >
                                        {isSpeaking ? (
                                            <>
                                                <Square className="w-3.5 h-3.5 fill-current" />
                                                Stop Voice
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-3.5 h-3.5 fill-current" />
                                                Read Aloud
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Visual Codeword Breakdown Cards (Encode Mode) */}
                                {mode === "encode" && parsedWords.length > 0 ? (
                                    <div className="bg-slate-900 rounded-xl p-4 min-h-[200px] max-h-[260px] overflow-y-auto space-y-4 border border-slate-800">
                                        {parsedWords.map((wordItem, wordIdx) => (
                                            <div key={wordIdx} className="space-y-2">
                                                <div className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1">
                                                    <Hash className="w-3 h-3 text-indigo-500" />
                                                    Word: {wordItem.raw}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {wordItem.letters.map((item, letterIdx) => (
                                                        <div
                                                            key={letterIdx}
                                                            className="bg-slate-800 border border-slate-700/80 rounded-lg p-2 min-w-[70px] text-center"
                                                        >
                                                            <div className="text-xs font-mono font-extrabold text-amber-400">
                                                                {item.char.toUpperCase()}
                                                            </div>
                                                            <div className="text-xs font-bold text-white mt-0.5">
                                                                {item.code}
                                                            </div>
                                                            {item.isKnown && (
                                                                <div className="text-[10px] text-slate-400 font-mono italic">
                                                                    {item.phonic}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Plaintext Output Container */
                                    <textarea
                                        id="nato-output-text"
                                        value={outputText}
                                        readOnly
                                        onClick={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.select();
                                        }}
                                        placeholder="Phonetic translation will appear here..."
                                        className="font-mono text-sm h-[200px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none cursor-pointer min-w-0"
                                    />
                                )}

                                {/* Metrics Bar */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Words
                                        </p>
                                        <p className="text-sm font-mono font-bold text-slate-800">
                                            {wordCount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Letters
                                        </p>
                                        <p className="text-sm font-mono font-bold text-indigo-600">
                                            {letterCount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Digits
                                        </p>
                                        <p className="text-sm font-mono font-bold text-emerald-600">
                                            {digitCount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Primary Export Actions */}
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
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy Result
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
         BELOW-THE-FOLD SEO CONTENT (DEEP PROSE & ACCESSIBLE CARDS)
    ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8">
                {/* Card 1: Technical Overview & Definitions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Technical Overview: What is the NATO Phonetic Alphabet?</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            The <strong>NATO Phonetic Alphabet</strong>—officially designated as the <strong>International Radiotelephony Spelling Alphabet</strong>—is a standardized system of acrophonic codewords used globally to spell out letters, words, and numbers during voice communications. Governed by international treaties under the <strong>ICAO (International Civil Aviation Organization)</strong>, <strong>ITU (International Telecommunication Union)</strong>, <strong>NATO (North Atlantic Treaty Organization)</strong>, and <strong>IMO (International Maritime Organization)</strong>, this radiotelephony alphabet serves as the cornerstone of clear voice transmission across high-noise environments.
                        </p>
                        <p>
                            When communicating over radio frequencies, phone calls, or noisy emergency channels, standalone letter sounds like <em>B</em>, <em>C</em>, <em>D</em>, <em>E</em>, <em>G</em>, <em>P</em>, <em>T</em>, and <em>V</em> sound virtually indistinguishable due to identical vowel endings. The NATO Phonetic Alphabet solves this acoustic ambiguity by assigning distinct, multi-syllabic codewords (e.g., <strong>Bravo</strong>, <strong>Charlie</strong>, <strong>Delta</strong>, <strong>Echo</strong>) designed to be easily recognized regardless of background static, radio signal degradation, or native language accents.
                        </p>
                    </div>
                </div>

                {/* Card 2: Interactive NATO Reference Dictionary Grid */}
                <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6 mb-6 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Binary className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Complete NATO &amp; ICAO Radiotelephony Reference Table</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Below is the authoritative 36-character reference key containing all 26 alphabetic codewords and 10 numeric pronunciations recognized by ICAO, ITU, and NATO standards.
                    </p>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
                        {Object.entries(NATO_DICTIONARY).map(([char, data]) => (
                            <div
                                key={char}
                                className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm">
                                        {char}
                                    </span>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">{data.code}</div>
                                        <div className="text-[10px] text-slate-500 italic">
                                            Pronunciation: <span className="text-indigo-600 font-semibold">{data.phonic}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 3: Specific Phonetic Pronunciation Rules & Modifications */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Special Spelling &amp; International Pronunciation Rules</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            To ensure seamless international comprehension across native speakers of English, French, Spanish, German, and other global languages, several official codewords and digits intentionally depart from standard English spelling and pronunciation rules:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 my-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Alfa (Not "Alpha")
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Spelled with an <strong>"f"</strong> rather than <strong>"ph"</strong> so non-English speakers (particularly in Europe and Latin America) do not mispronounce it as an "p" or silent consonant.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Juliett (Not "Juliet")
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Spelled with a double <strong>"tt"</strong> at the end so French speakers pronounce the final consonant rather than treating it as a silent trailing vowel.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Niner (Digit 9)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Pronounced as <strong>"NINER"</strong> to avoid catastrophic confusion with the German word <em>"nein"</em> (meaning "no"), which sounds identical to the English word "nine".
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Tree (Digit 3) &amp; Fife (Digit 5)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Pronounced as <strong>"TREE"</strong> because many non-English speakers struggle with the "th" sound. Digit 5 is spoken as <strong>"FIFE"</strong> to prevent confusion with "fire" or "five".
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 4: Historical Evolution & Comparative Standards Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Historical Evolution of Radiotelephony Alphabets</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Before international harmonization in 1956, military and aviation organizations used competing regional phonetic systems. Below is a historical comparison showing how key letters evolved across major 20th-century radiotelephony standards:
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs sm:text-sm">
                                    <th className="p-3 sm:p-4">Letter</th>
                                    <th className="p-3 sm:p-4">Modern NATO / ICAO (1956–Present)</th>
                                    <th className="p-3 sm:p-4">US Joint Army/Navy "Able Baker" (1941–1956)</th>
                                    <th className="p-3 sm:p-4">RAF Standard (1924–1942)</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs sm:text-sm text-slate-700 divide-y divide-slate-100 font-mono">
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-bold text-slate-900">A</td>
                                    <td className="p-3 sm:p-4 text-indigo-600 font-bold">Alfa</td>
                                    <td className="p-3 sm:p-4">Able</td>
                                    <td className="p-3 sm:p-4">Ace</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-bold text-slate-900">B</td>
                                    <td className="p-3 sm:p-4 text-indigo-600 font-bold">Bravo</td>
                                    <td className="p-3 sm:p-4">Baker</td>
                                    <td className="p-3 sm:p-4">Beer</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-bold text-slate-900">C</td>
                                    <td className="p-3 sm:p-4 text-indigo-600 font-bold">Charlie</td>
                                    <td className="p-3 sm:p-4">Charlie</td>
                                    <td className="p-3 sm:p-4">Charlie</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-bold text-slate-900">D</td>
                                    <td className="p-3 sm:p-4 text-indigo-600 font-bold">Delta</td>
                                    <td className="p-3 sm:p-4">Dog</td>
                                    <td className="p-3 sm:p-4">Don</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-bold text-slate-900">F</td>
                                    <td className="p-3 sm:p-4 text-indigo-600 font-bold">Foxtrot</td>
                                    <td className="p-3 sm:p-4">Fox</td>
                                    <td className="p-3 sm:p-4">Freddie</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-bold text-slate-900">N</td>
                                    <td className="p-3 sm:p-4 text-indigo-600 font-bold">November</td>
                                    <td className="p-3 sm:p-4">Nan</td>
                                    <td className="p-3 sm:p-4">Nuts</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 5: Operational Applications & Industry Use Cases */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Domain Applications &amp; Real-World Use Cases</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs sm:text-sm">
                                    <th className="p-3 sm:p-4">Industry Sector</th>
                                    <th className="p-3 sm:p-4">Primary Operational Purpose</th>
                                    <th className="p-3 sm:p-4">Real-World Call Sign Example</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Aviation &amp; Air Traffic Control</td>
                                    <td className="p-3 sm:p-4">Transmitting aircraft registration tail numbers, waypoint coordinates, and runway designations.</td>
                                    <td className="p-3 sm:p-4 font-mono text-indigo-600">N-704-XR (November 7 0 4 X-Ray)</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Maritime Operations</td>
                                    <td className="p-3 sm:p-4">VHF radio channel call signs, vessel identification, and harbor navigation.</td>
                                    <td className="p-3 sm:p-4 font-mono text-indigo-600">Vessel Call Sign: WDL28 (Whiskey Delta Lima 2 8)</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Emergency Services &amp; Police Dispatch</td>
                                    <td className="p-3 sm:p-4">Dispatching vehicle license plates, suspect identification names, and street locations over encrypted radio.</td>
                                    <td className="p-3 sm:p-4 font-mono text-indigo-600">Plate ID: 9B2-KMT (Niner Bravo Two Kilo Mike Tango)</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Telecommunications &amp; IT Helpdesk</td>
                                    <td className="p-3 sm:p-4">Dictating complex technical passwords, software license keys, and Wi-Fi security keys over support calls.</td>
                                    <td className="p-3 sm:p-4 font-mono text-indigo-600">License Key: G7H-9P2 (Golf Seven Hotel Niner Papa Two)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 6: Practical Step-by-Step Converter Workflows */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Procedural Workflows &amp; Tool Features</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" />
                                Workflow 1: Encoding Plaintext to NATO Phonetic Codewords
                            </h3>
                            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                                <li>Select <strong>Text to Phonetic</strong> mode in the primary operation switcher.</li>
                                <li>Type or paste callsigns, flight IDs, names, or serial codes into the input box.</li>
                                <li>Customize your output using the <strong>Codeword Separator</strong> dropdown (Space, Hyphen, Slash, or New Line).</li>
                                <li>Enable <strong>Include Phonic Guides</strong> to view exact syllable stress emphasis (e.g., <code>AL-fah</code>, <code>BRAH-voh</code>).</li>
                                <li>Click <strong>Read Aloud</strong> to hear speech synthesis or <strong>Export TXT</strong> to download the result.</li>
                            </ol>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <RadioTower className="w-4 h-4 text-indigo-600" />
                                Workflow 2: Decoding NATO Codewords back to Plaintext
                            </h3>
                            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                                <li>Select <strong>Phonetic to Text</strong> mode.</li>
                                <li>Type or paste space-separated NATO codewords (e.g., <code>Alfa Bravo Charlie</code>).</li>
                                <li>Use forward slashes (<code>/</code>) or the word <code>SLASH</code> to represent word spaces in complex sentences.</li>
                                <li>The real-time parser automatically extracts original letters and numbers into clean text.</li>
                                <li>Click <strong>Copy Result</strong> to instantly save the decoded string to your clipboard.</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Card 7: Static FAQ Section (Non-Collapsible, AdSense Ready) */}
                <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions (FAQ)</span>
                    </h2>
                    <div className="space-y-5">
                        {[
                            {
                                q: "Why are non-standard spellings like 'Alfa' and 'Juliett' used?",
                                a: "International standards specify 'Alfa' (instead of Alpha) so non-English speakers across Europe and Latin America do not mispronounce the 'ph' as an 'f' sound. 'Juliett' is spelled with a double 't' so French speakers pronounce the trailing consonant rather than treating it as a silent 'e'.",
                            },
                            {
                                q: "Why is the number 9 pronounced as 'Niner'?",
                                a: "In German, the word 'nein' (meaning 'no') sounds identical to the English number 'nine'. To avoid dangerous confusion over radio channels in aviation and military operations, 'Nine' was officially altered to the two-syllable word 'Niner'.",
                            },
                            {
                                q: "Why is the number 3 pronounced as 'Tree'?",
                                a: "The 'th' consonant cluster in English does not exist in many world languages (such as Dutch, French, or Italian). Modifying 'Three' to 'Tree' allows international pilots and radio operators to pronounce the number clearly without phonetic distortion.",
                            },
                            {
                                q: "Can I use this converter offline?",
                                a: "Yes. This tool runs 100% natively in your web browser using modern Web Audio and Web Speech APIs. No data or text input is sent to external servers.",
                            },
                            {
                                q: "What is the difference between NATO and Able Baker alphabets?",
                                a: "The 'Able Baker' alphabet was used by US and UK forces during World War II. It was replaced in 1956 by the NATO/ICAO alphabet because words like 'Able' and 'Baker' were difficult for non-native English speakers to distinguish under radio noise.",
                            },
                            {
                                q: "Is the NATO Phonetic Alphabet the same as the International Phonetic Alphabet (IPA)?",
                                a: "No. The International Phonetic Alphabet (IPA) is a linguistic notation system used to transcribe exact human speech sounds across all spoken languages. The NATO Phonetic Alphabet is a radiotelephony spelling alphabet designed specifically to clarify letter names over radio voice channels.",
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
                        name: "NATO Phonetic Alphabet Converter",
                        applicationCategory: "UtilityApplication",
                        operatingSystem: "All",
                        description:
                            "Convert text to standard NATO, ICAO, and ITU phonetic alphabet codewords with instant audio voice playback and full pronunciation guides.",
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
                                name: "Why are non-standard spellings like 'Alfa' and 'Juliett' used?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Spelling modifications ensure international speakers pronounce words clearly without regional phonetic confusion.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why is the number 9 pronounced as 'Niner'?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "To avoid confusion with the German word 'nein' over radio channels.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why is the number 3 pronounced as 'Tree'?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "To accommodate international speakers whose native languages lack the English 'th' sound.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Can I use this converter offline?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, the converter processes all text entirely within your browser.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "What is the difference between NATO and Able Baker alphabets?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "The NATO alphabet replaced the WWII Able Baker alphabet in 1956 for superior international acoustic clarity.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Is the NATO Phonetic Alphabet the same as the International Phonetic Alphabet (IPA)?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No, IPA is a phonetic transcription system for linguistics, whereas the NATO alphabet is an acrophonic radiotelephony spelling alphabet.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}