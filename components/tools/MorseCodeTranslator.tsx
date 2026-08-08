"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Volume2,
    VolumeX,
    Play,
    Square,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    Radio,
    Sliders,
    HelpCircle,
    Binary,
    Layers,
    FileText,
    Activity,
    Terminal,
    Download,
    Settings,
    BookOpen,
    Cpu,
    Compass,
    RadioTower,
} from "lucide-react";

// Standard International Morse Code Dictionary
const MORSE_DICTIONARY: Record<string, string> = {
    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    "0": "-----",
    ".": ".-.-.-",
    ",": "--..--",
    "?": "..--..",
    "'": ".----.",
    "!": "-.-.--",
    "/": "-..-.",
    "(": "-.--.",
    ")": "-.--.-",
    "&": ".-...",
    ":": "---...",
    ";": "-.-.-.",
    "=": "-...-",
    "+": ".-.-.",
    "-": "-....-",
    _: "..--.-",
    '"': ".-..-.",
    "$": "...-..-",
    "@": ".--.-.",
    " ": "/",
};

// Reverse Dictionary for Decryption
const REVERSE_MORSE_DICTIONARY: Record<string, string> = Object.entries(
    MORSE_DICTIONARY
).reduce((acc, [char, morse]) => {
    acc[morse] = char;
    return acc;
}, {} as Record<string, string>);

type TranslationMode = "textToMorse" | "morseToText";

export default function MorseCodeTranslator() {
    // ── Core State ──
    const [mode, setMode] = useState<TranslationMode>("textToMorse");
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");

    // ── Audio & Playback State ──
    const [isPlaying, setIsPlaying] = useState(false);
    const [wpm, setWpm] = useState(20); // Words per minute (10-40)
    const [frequency, setFrequency] = useState(600); // Audio pitch in Hz (300-1000)
    const [volume, setVolume] = useState(80); // Volume percentage (0-100)
    const [activePlaybackIndex, setActivePlaybackIndex] = useState<number | null>(null);

    // ── UI Feedback State ──
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // ── Metric Counters ──
    const [inputCharCount, setInputCharCount] = useState(0);
    const [outputCharCount, setOutputCharCount] = useState(0);
    const [dotCount, setDotCount] = useState(0);
    const [dashCount, setDashCount] = useState(0);

    // ── Web Audio API Refs ──
    const audioCtxRef = useRef<AudioContext | null>(null);
    const playbackTimeoutRef = useRef<any[]>([]);

    // ── Translation Logic ──
    const translateTextToMorse = (text: string): string => {
        return text
            .toUpperCase()
            .split("")
            .map((char) => {
                if (char === "\n") return "\n";
                return MORSE_DICTIONARY[char] || "";
            })
            .filter((item, idx, arr) => {
                // Keep spaces/slashes intact while omitting unmapped characters
                if (item === "" && arr[idx] !== " ") return false;
                return true;
            })
            .join(" ")
            .replace(/\s+\/\s+/g, " / ");
    };

    const translateMorseToText = (morse: string): string => {
        // Split into lines to preserve line breaks
        const lines = morse.split("\n");
        return lines
            .map((line) => {
                const words = line.trim().split(/\s+\/\s+|\s{3,}/);
                return words
                    .map((word) => {
                        const tokens = word.trim().split(/\s+/);
                        return tokens
                            .map((token) => REVERSE_MORSE_DICTIONARY[token] || "?")
                            .join("");
                    })
                    .join(" ");
            })
            .join("\n");
    };

    const handleTranslate = useCallback(() => {
        setError(null);
        if (!inputText) {
            setOutputText("");
            setInputCharCount(0);
            setOutputCharCount(0);
            setDotCount(0);
            setDashCount(0);
            return;
        }

        setInputCharCount(inputText.length);

        try {
            let result = "";
            if (mode === "textToMorse") {
                result = translateTextToMorse(inputText);
                const dots = (result.match(/\./g) || []).length;
                const dashes = (result.match(/-/g) || []).length;
                setDotCount(dots);
                setDashCount(dashes);
            } else {
                result = translateMorseToText(inputText);
                const dots = (inputText.match(/\./g) || []).length;
                const dashes = (inputText.match(/-/g) || []).length;
                setDotCount(dots);
                setDashCount(dashes);
            }
            setOutputText(result);
            setOutputCharCount(result.length);
        } catch {
            setError("Translation error. Please check your input sequence for invalid symbols.");
            setOutputText("");
        }
    }, [inputText, mode]);

    useEffect(() => {
        handleTranslate();
    }, [handleTranslate]);

    // Stop Audio Playback & Clear Timers
    const stopAudio = useCallback(() => {
        playbackTimeoutRef.current.forEach((t) => clearTimeout(t));
        playbackTimeoutRef.current = [];
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
            audioCtxRef.current.close().catch(() => { });
            audioCtxRef.current = null;
        }
        setIsPlaying(false);
        setActivePlaybackIndex(null);
    }, []);

    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, [stopAudio]);

    // ── Audio Synthesis Engine (PARIS Standard Timing) ──
    const playMorseAudio = () => {
        if (isPlaying) {
            stopAudio();
            return;
        }

        const morseCode = mode === "textToMorse" ? outputText : inputText;
        if (!morseCode.trim()) return;

        // Standard timing base: PARIS = 50 dot duration units
        // Dot length (ms) = 1200 / WPM
        const dotDuration = 1200 / Math.max(5, Math.min(50, wpm));
        const dashDuration = dotDuration * 3;
        const symbolGap = dotDuration;
        const letterGap = dotDuration * 3;
        const wordGap = dotDuration * 7;

        const AudioContextClass =
            typeof window !== "undefined"
                ? (window.AudioContext || (window as any).webkitAudioContext)
                : null;

        if (!AudioContextClass) {
            setError("Web Audio API is not supported in this browser.");
            return;
        }

        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        setIsPlaying(true);
        let currentTime = ctx.currentTime + 0.05; // Short start buffer

        const symbols = morseCode.split("");

        symbols.forEach((char, index) => {
            const delay = (currentTime - ctx.currentTime) * 1000;

            // Track active playback index for UI visualizer
            const activeTimer = setTimeout(() => {
                setActivePlaybackIndex(index);
            }, Math.max(0, delay));
            playbackTimeoutRef.current.push(activeTimer);

            if (char === ".") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(frequency, currentTime);

                const vol = volume / 100;
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(vol, currentTime + 0.005);
                gain.gain.setValueAtTime(vol, currentTime + dotDuration / 1000 - 0.005);
                gain.gain.linearRampToValueAtTime(0, currentTime + dotDuration / 1000);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(currentTime);
                osc.stop(currentTime + dotDuration / 1000);
                currentTime += (dotDuration + symbolGap) / 1000;
            } else if (char === "-") {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(frequency, currentTime);

                const vol = volume / 100;
                gain.gain.setValueAtTime(0, currentTime);
                gain.gain.linearRampToValueAtTime(vol, currentTime + 0.005);
                gain.gain.setValueAtTime(vol, currentTime + dashDuration / 1000 - 0.005);
                gain.gain.linearRampToValueAtTime(0, currentTime + dashDuration / 1000);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(currentTime);
                osc.stop(currentTime + dashDuration / 1000);
                currentTime += (dashDuration + symbolGap) / 1000;
            } else if (char === " ") {
                currentTime += letterGap / 1000;
            } else if (char === "/") {
                currentTime += wordGap / 1000;
            }
        });

        // Final finish timer
        const totalDurationMs = (currentTime - ctx.currentTime) * 1000;
        const endTimer = setTimeout(() => {
            setIsPlaying(false);
            setActivePlaybackIndex(null);
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => { });
                audioCtxRef.current = null;
            }
        }, Math.max(0, totalDurationMs));

        playbackTimeoutRef.current.push(endTimer);
    };

    // ── Clipboard & Helper Functions ──
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent catch */
        }
    };

    const clearWorkspace = () => {
        stopAudio();
        setInputText("");
        setOutputText("");
        setError(null);
        setInputCharCount(0);
        setOutputCharCount(0);
        setDotCount(0);
        setDashCount(0);
    };

    const loadSample = () => {
        stopAudio();
        if (mode === "textToMorse") {
            setInputText("SOS distress signal: Requesting immediate assistance at location 45N 12E.");
        } else {
            setInputText(
                "... --- ... / -.. .. ... - .-. . ... ... / ... .. --. -. .- .-.. --- ......"
            );
        }
    };

    const downloadTextFile = () => {
        if (!outputText) return;
        const element = document.createElement("a");
        const file = new Blob([outputText], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = mode === "textToMorse" ? "morse-translation.txt" : "decoded-text.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="w-full space-y-8">
            {/* ── Two-Column Dashboard Workspace (50/50 Split) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & CONFIG ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 aspect-square">
                                    <Radio className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">
                                        Morse Code Translator
                                    </h2>
                                    <p className="text-xs text-indigo-200">
                                        Real-Time Encoder & Audio Synthesizer
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Direction Switcher */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                    Translation Mode
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            stopAudio();
                                            setMode("textToMorse");
                                            setInputText("");
                                            setOutputText("");
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${mode === "textToMorse"
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Text to Morse
                                    </button>
                                    <button
                                        onClick={() => {
                                            stopAudio();
                                            setMode("morseToText");
                                            setInputText("");
                                            setOutputText("");
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${mode === "morseToText"
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        <Activity className="w-4 h-4" />
                                        Morse to Text
                                    </button>
                                </div>
                            </div>

                            {/* Audio Synthesizer Control Panel */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                        Audio Synthesizer Engine
                                    </span>
                                    <span className="text-xs font-mono text-slate-500">
                                        PARIS Timing Standard
                                    </span>
                                </div>

                                <div className="grid sm:grid-cols-3 gap-4">
                                    {/* WPM Slider */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-600">Speed</span>
                                            <span className="font-mono text-indigo-600 font-bold">
                                                {wpm} WPM
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="5"
                                            max="40"
                                            step="1"
                                            value={wpm}
                                            onChange={(e) => setWpm(Number(e.target.value))}
                                            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                                        />
                                    </div>

                                    {/* Frequency Slider */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-600">Pitch</span>
                                            <span className="font-mono text-indigo-600 font-bold">
                                                {frequency} Hz
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="300"
                                            max="1000"
                                            step="25"
                                            value={frequency}
                                            onChange={(e) => setFrequency(Number(e.target.value))}
                                            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                                        />
                                    </div>

                                    {/* Volume Slider */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-slate-600">Volume</span>
                                            <span className="font-mono text-indigo-600 font-bold">
                                                {volume}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={volume}
                                            onChange={(e) => setVolume(Number(e.target.value))}
                                            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Input Text Area */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="morse-input-area"
                                    className="text-xs font-semibold text-slate-700 block"
                                >
                                    {mode === "textToMorse"
                                        ? "Plaintext Input Payload"
                                        : "Morse Code Input (Dots '.' and Dashes '-')"
                                    }
                                </label>
                                <textarea
                                    id="morse-input-area"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={
                                        mode === "textToMorse"
                                            ? "Enter alphanumeric text to translate into Morse code..."
                                            : "Enter Morse code (use '.' for dot, '-' for dash, space between letters, '/' or 3 spaces between words)..."
                                    }
                                    className="font-mono text-sm h-[220px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-600 min-w-0"
                                />
                            </div>

                            {/* Action Buttons */}
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
                            {/* Header Bar */}
                            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 aspect-square">
                                        <Activity className="w-5 h-5 text-indigo-200" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold leading-tight">
                                            {mode === "textToMorse" ? "Morse Output" : "Decoded Text"}
                                        </h2>
                                        <p className="text-xs text-indigo-200">
                                            Synchronized Signal Stream
                                        </p>
                                    </div>
                                </div>

                                {/* Audio Playback Toggle */}
                                <button
                                    onClick={playMorseAudio}
                                    disabled={!outputText && !inputText}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all shadow-sm min-h-[38px] ${isPlaying
                                        ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                                        : "bg-indigo-500 hover:bg-indigo-400 text-white"
                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                    {isPlaying ? (
                                        <>
                                            <Square className="w-3.5 h-3.5 fill-current" />
                                            Stop Audio
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            Play Audio
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Audio Playing Visualizer Highlight */}
                                {mode === "textToMorse" && outputText && (
                                    <div className="bg-slate-900 rounded-xl p-4 min-h-[180px] max-h-[220px] overflow-y-auto font-mono text-sm leading-relaxed border border-slate-800 text-slate-300 break-words">
                                        {outputText.split("").map((char, i) => (
                                            <span
                                                key={i}
                                                className={`transition-colors duration-75 ${activePlaybackIndex === i
                                                    ? "bg-amber-400 text-slate-950 font-bold px-0.5 rounded"
                                                    : char === "."
                                                        ? "text-indigo-400"
                                                        : char === "-"
                                                            ? "text-emerald-400"
                                                            : char === "/"
                                                                ? "text-rose-400 font-bold"
                                                                : "text-slate-400"
                                                    }`}
                                            >
                                                {char}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Standard Text Area for Morse to Text */}
                                {mode === "morseToText" && (
                                    <textarea
                                        id="morse-output-area"
                                        value={outputText}
                                        readOnly
                                        onClick={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.select();
                                        }}
                                        placeholder="Decoded text output will appear here..."
                                        className="font-mono text-sm h-[220px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none cursor-pointer min-w-0"
                                    />
                                )}

                                {/* Metrics Card Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Input Chars
                                        </p>
                                        <p className="text-sm font-mono font-bold text-slate-800">
                                            {inputCharCount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Output Chars
                                        </p>
                                        <p className="text-sm font-mono font-bold text-slate-800">
                                            {outputCharCount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Dots (.)
                                        </p>
                                        <p className="text-sm font-mono font-bold text-indigo-600">
                                            {dotCount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Dashes (-)
                                        </p>
                                        <p className="text-sm font-mono font-bold text-emerald-600">
                                            {dashCount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Secondary Action Controls */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => outputText && copyToClipboard(outputText)}
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
           SEO DEEP-CONTENT BLOCK (INFO-RICH & SEARCH ENGINE OPTIMIZED)
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8">
                {/* Card 1: Technical Overview & Definitions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Technical Overview &amp; Fundamental Definitions</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            <strong>Morse Code</strong> is a digital telecommunication encoding method designed to transmit textual information as a series of on-off tones, lights, or clicks. Developed in the 1830s by Samuel Morse and Alfred Vail for the commercial electric telegraph, the code translates individual letters, numbers, and punctuation marks into unique sequences of short duration signals called <em>dots</em> (or <em>dits</em>) and long duration signals called <em>dashes</em> (or <em>dahs</em>).
                        </p>
                        <p>
                            Modern telecommunications distinguish between two primary historical standards:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-700 text-sm md:text-base">
                            <li>
                                <strong>International Morse Code (ITU Standard):</strong> The universally adopted modern standard defined by the International Telecommunication Union (ITU-R M.1677). It features a standardized alphabet, uniform numeric representation, and specialized procedural signals (prosigns) optimized for international radio transmissions.
                            </li>
                            <li>
                                <strong>American Morse Code (Railroad Telegraphy):</strong> The original 19th-century telegraphic format used extensively across North American railroad networks. It utilized variable-length dashes and internal spaces within single characters, making it unsuitable for automated radio signal synthesis.
                            </li>
                        </ul>
                        <p>
                            This application operates strictly on the <strong>International Morse Code standard</strong>, integrating a client-side Web Audio API synthesis engine to render real-time acoustic signals without server latency.
                        </p>
                    </div>
                </div>

                {/* Card 2: Precision Timing Engine & PARIS Standard */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Settings className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Timing Mathematics: The International PARIS Benchmark Standard</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Morse code is a strictly timed binary code. Transmission speeds are specified in <strong>Words Per Minute (WPM)</strong>. Because character lengths vary (e.g., "E" is a single dot, while "Q" is dash-dash-dot-dash), transmission speed is mathematically standardized using the benchmark word <strong>"PARIS"</strong>.
                        </p>
                        <p>
                            The word "PARIS" was selected because its precise composition—including all inter-element, inter-letter, and inter-word gaps—equals exactly 50 fundamental dot duration units ($T$).
                        </p>

                        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs sm:text-sm space-y-2 border border-slate-800">
                            <p className="text-indigo-300 font-bold">// Mathematical Formulas for Morse Timing Calculation</p>
                            <p>1 Dot Duration (T) = 1,200 ms / Speed (WPM)</p>
                            <p>1 Dash Duration = 3 × T</p>
                            <p>Element Gap (between dots/dashes in a letter) = 1 × T</p>
                            <p>Letter Gap (between letters in a word) = 3 × T</p>
                            <p>Word Gap (between complete words) = 7 × T</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 my-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                    1. Dot Unit ($1T$)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    At 20 WPM, a single dot duration is exactly 60 ms ($1200 / 20$). It represents the atomic time quantum for all Morse operations.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                    2. Dash Unit ($3T$)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    A dash is mathematically fixed at three dot units (180 ms at 20 WPM). Inter-element silence within a character equals $1T$.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                    3. Spacing Ratios ($3T$ / $7T$)
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Character separation requires $3T$ of silence. Word boundaries, represented in text by a slash ("/"), span $7T$ of silent time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: International Reference Tables (Alphabet, Numbers, Punctuation, Prosigns) */}
                <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6 mb-6 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Binary className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>International Morse Code Character Dictionary</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Comprehensive translation key covering alphanumeric characters, standard punctuation, and radio telegraphy procedural signals.
                    </p>

                    {/* Alphanumeric Mapping Table */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Alphanumeric Characters (A-Z, 0-9)
                        </h3>
                        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                            {Object.entries(MORSE_DICTIONARY)
                                .filter(([char]) => /[A-Z0-9]/.test(char))
                                .map(([char, morse]) => (
                                    <div
                                        key={char}
                                        className="bg-white border border-slate-200 rounded-lg p-2.5 flex justify-between items-center shadow-sm"
                                    >
                                        <span className="font-bold text-slate-900 text-sm">{char}</span>
                                        <span className="text-indigo-600 font-bold tracking-widest">{morse}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Punctuation & Symbols */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Punctuation &amp; Special Symbols
                        </h3>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                            {Object.entries(MORSE_DICTIONARY)
                                .filter(([char]) => !/[A-Z0-9\s]/.test(char))
                                .map(([char, morse]) => (
                                    <div
                                        key={char}
                                        className="bg-white border border-slate-200 rounded-lg p-2.5 flex justify-between items-center shadow-sm"
                                    >
                                        <span className="font-bold text-slate-900 text-sm">{char}</span>
                                        <span className="text-indigo-600 font-bold tracking-widest">{morse}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Procedural Signals (Prosigns) Table */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Radio Telegraphy Procedural Signals (Prosigns)
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-800 text-xs font-semibold uppercase">
                                        <th className="p-3 border-b border-slate-200">Prosign</th>
                                        <th className="p-3 border-b border-slate-200">Morse Code</th>
                                        <th className="p-3 border-b border-slate-200">Operational Meaning</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-mono text-slate-700">
                                    <tr className="border-b border-slate-100 bg-white">
                                        <td className="p-3 font-bold text-indigo-600">SOS</td>
                                        <td className="p-3 font-bold">... --- ...</td>
                                        <td className="p-3 font-sans">Distress Signal (Transmitted as continuous prosign)</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <td className="p-3 font-bold text-indigo-600">AR</td>
                                        <td className="p-3 font-bold">.-.-.</td>
                                        <td className="p-3 font-sans">End of Message / Station Out</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 bg-white">
                                        <td className="p-3 font-bold text-indigo-600">SK</td>
                                        <td className="p-3 font-bold">...-.-</td>
                                        <td className="p-3 font-sans">End of Transmission / Final Sign-off</td>
                                    </tr>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <td className="p-3 font-bold text-indigo-600">BT</td>
                                        <td className="p-3 font-bold">-...-</td>
                                        <td className="p-3 font-sans">Paragraph Separator / New Section</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Card 4: Protocol Comparison Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Comparative Analysis: Morse Code vs. Modern Digital Protocols</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs sm:text-sm">
                                    <th className="p-3 sm:p-4">Feature / Dimension</th>
                                    <th className="p-3 sm:p-4">Morse Code (CW)</th>
                                    <th className="p-3 sm:p-4">ASCII / UTF-8</th>
                                    <th className="p-3 sm:p-4">Digital Voice (VoIP)</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Encoding Scheme</td>
                                    <td className="p-3 sm:p-4 font-mono">Variable-Length Binary</td>
                                    <td className="p-3 sm:p-4 font-mono">Fixed 8-bit / Variable Byte</td>
                                    <td className="p-3 sm:p-4 font-mono">Compressed PCM/Codec</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Bandwidth Requirement</td>
                                    <td className="p-3 sm:p-4 font-mono text-emerald-600 font-bold">&lt; 100 Hz</td>
                                    <td className="p-3 sm:p-4 font-mono">1 - 10 kHz</td>
                                    <td className="p-3 sm:p-4 font-mono">&gt; 32 kHz</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Signal-to-Noise Threshold</td>
                                    <td className="p-3 sm:p-4 text-emerald-600 font-bold">Ultra-Low (-15 dB)</td>
                                    <td className="p-3 sm:p-4">Moderate (+5 dB)</td>
                                    <td className="p-3 sm:p-4">High (+12 dB)</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Human Decoding Ability</td>
                                    <td className="p-3 sm:p-4 text-emerald-600 font-bold">Direct Auditory Processing</td>
                                    <td className="p-3 sm:p-4">Requires Computer DSP</td>
                                    <td className="p-3 sm:p-4">Direct Auditory Speech</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Primary Applications</td>
                                    <td className="p-3 sm:p-4">Emergency, Amateur Radio, Beacons</td>
                                    <td className="p-3 sm:p-4">Web, Database, Software</td>
                                    <td className="p-3 sm:p-4">Cellular, Video Conferencing</td>
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
                        <span>Procedural Workflows &amp; Practical Applications</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" />
                                Workflow 1: Translating Plain Text to Morse Code
                            </h3>
                            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                                <li>Select <strong>Text to Morse</strong> mode in the primary configuration bar.</li>
                                <li>Type or paste alphanumeric text into the input field.</li>
                                <li>The real-time translator converts characters to standard dot-dash strings instantly.</li>
                                <li>Adjust <strong>WPM Speed</strong> and <strong>Pitch Frequency</strong> sliders to customize playback.</li>
                                <li>Click <strong>Play Audio</strong> to trigger the Web Audio API tone synthesizer.</li>
                            </ol>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <RadioTower className="w-4 h-4 text-indigo-600" />
                                Workflow 2: Decoding Morse Signals into Plain Text
                            </h3>
                            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                                <li>Select <strong>Morse to Text</strong> mode.</li>
                                <li>Enter Morse code using dots (<code>.</code>) and dashes (<code>-</code>).</li>
                                <li>Separate individual letters with a single space.</li>
                                <li>Separate complete words with a forward slash (<code>/</code>) or three consecutive spaces.</li>
                                <li>Click <strong>Copy Result</strong> or <strong>Export TXT</strong> to save decoded output.</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Card 6: Frequently Asked Questions (Static Non-Accordion Format) */}
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
                                q: "What is the standard spacing convention for Morse code translation?",
                                a: "In standard written Morse code, individual letter elements within a word are separated by a single space, while complete words are separated by a forward slash ('/') or three consecutive spaces. This convention ensures unambiguous parsing during decoding.",
                            },
                            {
                                q: "How does the browser-based audio synthesizer generate tone signals?",
                                a: "The application utilizes the Web Audio API to create a native OscillatorNode generating a pure sine wave at your selected frequency (e.g., 600 Hz). Envelopes are modulated using a GainNode to implement linear attack and release ramps, preventing mechanical clicks at pulse boundaries.",
                            },
                            {
                                q: "What is the PARIS standard for CW transmission speed calculation?",
                                a: "The word 'PARIS' contains exactly 50 fundamental dot duration units (including internal spacing). Transmitting the word 'PARIS' once per minute defines a speed of 1 WPM. The formula T = 1200 / WPM calculates the precise millisecond duration of a single dot unit.",
                            },
                            {
                                q: "Why is SOS written as a continuous sequence without spaces?",
                                a: "SOS (... --- ...) is transmitted as a distress prosign (procedural signal). Unlike standard text where letters are separated by three dot units of silence, SOS is sent continuously as a single nine-element character to guarantee immediate identification over noisy emergency radio channels.",
                            },
                            {
                                q: "Is Morse code still used officially today?",
                                a: "Yes. While military and commercial maritime organizations replaced Morse code with automated satellite protocols (GMDSS) in 1999, Morse code remains widely used in amateur radio (CW), aviation non-directional beacons (NDB), visual light signaling, and assistive communications.",
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
                        name: "Morse Code Translator & Audio Synthesizer",
                        applicationCategory: "UtilityApplication",
                        operatingSystem: "All",
                        description:
                            "Client-side Morse code encoder, decoder, and Web Audio API tone synthesizer. Features PARIS timing standard, custom speed/pitch controls, and live visual playback tracking.",
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
                                name: "What is the standard spacing convention for Morse code translation?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Individual letter elements are separated by a single space, while complete words are separated by a forward slash ('/') or three spaces.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "How does the browser-based audio synthesizer generate tone signals?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "The tool utilizes the Web Audio API to instantiate an OscillatorNode generating a pure sine wave at your designated pitch frequency.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "What is the PARIS standard for CW transmission speed calculation?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "The word 'PARIS' contains 50 dot-length duration units. Transmitting 'PARIS' once per minute corresponds to 1 WPM, establishing a linear mathematical baseline for timing calculations.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why is SOS written as a continuous sequence without spaces?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "SOS (... --- ...) is transmitted as a distress prosign continuously without internal pauses between letters to ensure instant recognition during emergencies.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Is Morse code still used officially today?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes. Morse code remains actively utilized in amateur radio (CW operations), aviation radio navigation beacons (VOR/NDB), and assistive accessibility communications.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}