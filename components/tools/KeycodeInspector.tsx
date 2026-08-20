"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Keyboard,
    Copy,
    Check,
    RotateCcw,
    Sliders,
    Sparkles,
    BookOpen,
    HelpCircle,
    Download,
    Eye,
    ShieldCheck,
    FileCode,
    Layers,
    Code,
    Terminal,
    Activity,
    Zap,
    Info,
    Laptop,
    CheckCircle2,
    AlertTriangle,
    History,
    Trash2
} from "lucide-react";

interface KeyHistoryItem {
    id: string;
    timestamp: string;
    key: string;
    code: string;
    keyCode: number;
    which: number;
    location: number;
    locationName: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    repeat: boolean;
    isComposing: boolean;
}

const getLocationName = (location: number): string => {
    switch (location) {
        case 0:
            return "Standard (0)";
        case 1:
            return "Left (1)";
        case 2:
            return "Right (2)";
        case 3:
            return "Numpad (3)";
        default:
            return `Unknown (${location})`;
    }
};

const COMMON_KEYS_PRESETS = [
    { label: "Enter", key: "Enter", code: "Enter", keyCode: 13, which: 13, location: 0 },
    { label: "Escape", key: "Escape", code: "Escape", keyCode: 27, which: 27, location: 0 },
    { label: "Space", key: " ", code: "Space", keyCode: 32, which: 32, location: 0 },
    { label: "Tab", key: "Tab", code: "Tab", keyCode: 9, which: 9, location: 0 },
    { label: "Backspace", key: "Backspace", code: "Backspace", keyCode: 8, which: 8, location: 0 },
    { label: "Shift (Left)", key: "Shift", code: "ShiftLeft", keyCode: 16, which: 16, location: 1 },
    { label: "Control (Left)", key: "Control", code: "ControlLeft", keyCode: 17, which: 17, location: 1 },
    { label: "Alt (Left)", key: "Alt", code: "AltLeft", keyCode: 18, which: 18, location: 1 },
    { label: "Meta / Cmd", key: "Meta", code: "MetaLeft", keyCode: 91, which: 91, location: 1 },
    { label: "ArrowUp", key: "ArrowUp", code: "ArrowUp", keyCode: 38, which: 38, location: 0 },
    { label: "ArrowDown", key: "ArrowDown", code: "ArrowDown", keyCode: 40, which: 40, location: 0 },
    { label: "ArrowLeft", key: "ArrowLeft", code: "ArrowLeft", keyCode: 37, which: 37, location: 0 },
    { label: "ArrowRight", key: "ArrowRight", code: "ArrowRight", keyCode: 39, which: 39, location: 0 }
];

export default function KeycodeInspector() {
    const [currentEvent, setCurrentEvent] = useState<KeyHistoryItem>({
        id: "init-1",
        timestamp: "Ready",
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        location: 0,
        locationName: "Standard (0)",
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        repeat: false,
        isComposing: false
    });

    const [history, setHistory] = useState<KeyHistoryItem[]>([]);
    const [activeCodeTab, setActiveCodeTab] = useState<"js" | "react" | "vue" | "json">("js");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isListening, setIsListening] = useState<boolean>(true);
    const [preventDefaultBehavior, setPreventDefaultBehavior] = useState<boolean>(false);
    const captureAreaRef = useRef<HTMLDivElement | null>(null);

    // Global Keyboard Listener
    useEffect(() => {
        if (!isListening) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't intercept if typing inside an interactive input field (other than our listener box)
            const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            const isInput = targetTag === "input" || targetTag === "textarea" || targetTag === "select";

            if (isInput && (e.target as HTMLElement).id !== "keyboard-capture-box") {
                return;
            }

            if (preventDefaultBehavior && (e.key === "Tab" || e.key === " " || e.key === "Backspace" || e.key.startsWith("Arrow") || e.key === "F1" || e.key === "F5")) {
                e.preventDefault();
            }

            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;

            const newEntry: KeyHistoryItem = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                timestamp: timeStr,
                key: e.key,
                code: e.code,
                keyCode: e.keyCode || e.which || 0,
                which: e.which || e.keyCode || 0,
                location: e.location,
                locationName: getLocationName(e.location),
                altKey: e.altKey,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey,
                repeat: e.repeat,
                isComposing: e.isComposing
            };

            setCurrentEvent(newEntry);
            setHistory((prev) => [newEntry, ...prev.slice(0, 19)]);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isListening, preventDefaultBehavior]);

    const handleCopyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(label);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handlePresetSelect = (preset: typeof COMMON_KEYS_PRESETS[0]) => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

        const newEntry: KeyHistoryItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: timeStr,
            key: preset.key,
            code: preset.code,
            keyCode: preset.keyCode,
            which: preset.which,
            location: preset.location,
            locationName: getLocationName(preset.location),
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            repeat: false,
            isComposing: false
        };

        setCurrentEvent(newEntry);
        setHistory((prev) => [newEntry, ...prev.slice(0, 19)]);
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const generateSnippet = useMemo(() => {
        const keyVal = currentEvent.key;
        const codeVal = currentEvent.code;

        switch (activeCodeTab) {
            case "js":
                return `// Modern W3C Standard Keyboard Handler
window.addEventListener('keydown', (event) => {
  if (event.key === ${JSON.stringify(keyVal)}) {
    console.log('Key captured:', event.key);
    // Code identifier: "${codeVal}"
    // event.preventDefault();
  }
});`;
            case "react":
                return `// React Keyboard Handler Hook / JSX Callback
import React, { useEffect } from 'react';

export function KeyboardListener() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ${JSON.stringify(keyVal)}) {
        console.log('React captured ${keyVal} (code: ${codeVal})');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <input 
      type="text" 
      onKeyDown={(e) => {
        if (e.key === ${JSON.stringify(keyVal)}) {
          console.log('Input key down:', e.key);
        }
      }}
      placeholder="Focus and press keys..." 
    />
  );
}`;
            case "vue":
                return `<!-- Vue 3 Composition API Template & Setup -->
<template>
  <div @keydown.${keyVal === " " ? "space" : keyVal.toLowerCase()}="handleKeyAction" tabindex="0">
    Press ${keyVal === " " ? "Space" : keyVal} to trigger action
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

const handleKeyAction = (event) => {
  if (event.code === '${codeVal}') {
    console.log('Vue key triggered: ${keyVal}');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyAction);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyAction);
});
</script>`;
            case "json":
                return JSON.stringify(
                    {
                        key: currentEvent.key,
                        code: currentEvent.code,
                        keyCode: currentEvent.keyCode,
                        which: currentEvent.which,
                        location: currentEvent.location,
                        locationName: currentEvent.locationName,
                        altKey: currentEvent.altKey,
                        ctrlKey: currentEvent.ctrlKey,
                        metaKey: currentEvent.metaKey,
                        shiftKey: currentEvent.shiftKey,
                        repeat: currentEvent.repeat,
                        isComposing: currentEvent.isComposing,
                        deprecated: {
                            keyCode: currentEvent.keyCode,
                            which: currentEvent.which,
                            charCode: 0
                        }
                    },
                    null,
                    2
                );
            default:
                return "";
        }
    }, [currentEvent, activeCodeTab]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Keycode & JavaScript Keyboard Event Inspector",
        "url": "https://twistertools.com/tools/developer-tools/javascript-keycode-finder",
        "description": "Inspect JavaScript KeyboardEvent attributes in real-time including event.key, event.code, event.which, location, modifier flags, and generate copy-paste React and JavaScript handler snippets.",
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
                "name": "Why is event.keyCode deprecated in modern JavaScript?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The W3C deprecated event.keyCode and event.which because they are inconsistent across international keyboard layouts, operating systems, and browsers. Modern standards recommend event.key for semantic character values and event.code for physical key positions."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between event.key and event.code?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "event.key returns the actual semantic character generated taking Shift, AltGr, and active keyboard language layouts into account (e.g., 'a', 'A', 'Å'). In contrast, event.code represents the physical hardware key on the keyboard independent of layout (e.g., 'KeyA', 'Digit1')."
                }
            },
            {
                "@type": "Question",
                "name": "How does KeyboardEvent.location identify key positions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "KeyboardEvent.location indicates whether the pressed key was on the standard section (0), left side (1, e.g., Left Shift), right side (2, e.g., Right Shift), or numeric keypad (3, e.g., Numpad 5)."
                }
            },
            {
                "@type": "Question",
                "name": "How can I prevent default browser keyboard behaviors like scrolling?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Call event.preventDefault() inside a keydown event listener. This prevents native browser behaviors like Space or Arrow keys scrolling the viewport, Tab moving focus, or Backspace navigating back in older browsers."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool track modifier keys like Shift, Control, Alt, and Meta?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The inspector displays boolean status flags for event.shiftKey, event.ctrlKey, event.altKey, and event.metaKey (Command on macOS or Windows key on PC), as well as repeat and isComposing flags for IME inputs."
                }
            }
        ]
    };

    return (
        <div className="w-full space-y-8">
            {/* JSON-LD Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Main 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Interactive Event Capture & Card Telemetry */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Header / Active Status */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Laptop className="w-5 h-5 text-indigo-600" />
                                Live Key Listener
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    {isListening && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    )}
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                                </span>
                                <span className="text-xs font-bold text-slate-600">
                                    {isListening ? "Listening Globally" : "Paused"}
                                </span>
                            </div>
                        </div>

                        {/* Interactive Big Press Target */}
                        <div
                            ref={captureAreaRef}
                            id="keyboard-capture-box"
                            tabIndex={0}
                            className="relative group w-full bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-inner cursor-pointer border-2 border-transparent focus:border-indigo-400 focus:outline-none transition-all"
                        >
                            <div className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-1 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                Press Any Key on Your Keyboard
                            </div>

                            {/* Big Main Key Display */}
                            <div className="my-3 flex flex-col items-center">
                                <div className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white font-mono drop-shadow-md">
                                    {currentEvent.key === " " ? "(Spacebar)" : currentEvent.key}
                                </div>
                                <div className="mt-2 text-xs font-mono text-indigo-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs border border-white/10">
                                    event.code: <span className="text-white font-bold">{currentEvent.code}</span>
                                </div>
                            </div>

                            <div className="text-[11px] text-slate-400">
                                Click anywhere or focus this box to capture keyboard events in real-time
                            </div>
                        </div>

                        {/* Core Values Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div
                                onClick={() => handleCopyText(currentEvent.key, "key")}
                                className="bg-slate-50 border border-slate-200 hover:border-indigo-300 p-3 rounded-xl cursor-pointer transition group"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                    <span>event.key</span>
                                    {copiedKey === "key" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />}
                                </div>
                                <div className="text-base sm:text-lg font-bold font-mono text-slate-900 truncate">
                                    {currentEvent.key === " " ? "Space" : currentEvent.key}
                                </div>
                                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">W3C Standard</div>
                            </div>

                            <div
                                onClick={() => handleCopyText(currentEvent.code, "code")}
                                className="bg-slate-50 border border-slate-200 hover:border-indigo-300 p-3 rounded-xl cursor-pointer transition group"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                    <span>event.code</span>
                                    {copiedKey === "code" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />}
                                </div>
                                <div className="text-base sm:text-lg font-bold font-mono text-slate-900 truncate">
                                    {currentEvent.code}
                                </div>
                                <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Physical Key</div>
                            </div>

                            <div
                                onClick={() => handleCopyText(String(currentEvent.keyCode), "keyCode")}
                                className="bg-slate-50 border border-slate-200 hover:border-indigo-300 p-3 rounded-xl cursor-pointer transition group"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                    <span>event.keyCode</span>
                                    {copiedKey === "keyCode" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />}
                                </div>
                                <div className="text-base sm:text-lg font-bold font-mono text-slate-900">
                                    {currentEvent.keyCode}
                                </div>
                                <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Deprecated</div>
                            </div>

                            <div
                                onClick={() => handleCopyText(String(currentEvent.which), "which")}
                                className="bg-slate-50 border border-slate-200 hover:border-indigo-300 p-3 rounded-xl cursor-pointer transition group"
                            >
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                    <span>event.which</span>
                                    {copiedKey === "which" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />}
                                </div>
                                <div className="text-base sm:text-lg font-bold font-mono text-slate-900">
                                    {currentEvent.which}
                                </div>
                                <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Deprecated</div>
                            </div>
                        </div>

                        {/* Modifier Flags & Attributes */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Active Modifiers & State Flags
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div
                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${currentEvent.shiftKey ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                        }`}
                                >
                                    <span>Shift</span>
                                    <span className="font-mono text-[11px]">{currentEvent.shiftKey ? "TRUE" : "FALSE"}</span>
                                </div>

                                <div
                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${currentEvent.ctrlKey ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                        }`}
                                >
                                    <span>Control</span>
                                    <span className="font-mono text-[11px]">{currentEvent.ctrlKey ? "TRUE" : "FALSE"}</span>
                                </div>

                                <div
                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${currentEvent.altKey ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                        }`}
                                >
                                    <span>Alt / Option</span>
                                    <span className="font-mono text-[11px]">{currentEvent.altKey ? "TRUE" : "FALSE"}</span>
                                </div>

                                <div
                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${currentEvent.metaKey ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"
                                        }`}
                                >
                                    <span>Meta / Cmd</span>
                                    <span className="font-mono text-[11px]">{currentEvent.metaKey ? "TRUE" : "FALSE"}</span>
                                </div>
                            </div>

                            {/* Extra Properties Row */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
                                    <span className="font-bold text-slate-800">{currentEvent.locationName}</span>
                                </div>
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Repeat</span>
                                    <span className="font-bold text-slate-800">{currentEvent.repeat ? "Yes (Held Down)" : "No"}</span>
                                </div>
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                    <span className="text-slate-500 block text-[10px] uppercase font-bold">IME Composing</span>
                                    <span className="font-bold text-slate-800">{currentEvent.isComposing ? "Composing" : "None"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Test Key Presets */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Click-to-Inspect Common Keys
                            </label>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                                {COMMON_KEYS_PRESETS.map((preset) => (
                                    <button
                                        key={preset.code}
                                        type="button"
                                        onClick={() => handlePresetSelect(preset)}
                                        className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Settings Bar */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={preventDefaultBehavior}
                                    onChange={(e) => setPreventDefaultBehavior(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600"
                                />
                                Prevent Browser Default Keys (Space/Tab/Arrows)
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsListening(!isListening)}
                            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${isListening
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                        >
                            {isListening ? "Pause Listening" : "Resume Listening"}
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Code Generators & Event History */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header & Code Tabs */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Code className="w-5 h-5 text-indigo-600" />
                                Code Generation & Payloads
                            </h2>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                {(["js", "react", "vue", "json"] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveCodeTab(tab)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${activeCodeTab === tab ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generated Code Display */}
                        <div className="relative">
                            <pre className="bg-slate-900 text-indigo-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-56">
                                <code>{generateSnippet}</code>
                            </pre>
                            <button
                                type="button"
                                onClick={() => handleCopyText(generateSnippet, "snippet")}
                                className="absolute top-2.5 right-2.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                            >
                                {copiedKey === "snippet" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedKey === "snippet" ? "Copied" : "Copy"}
                            </button>
                        </div>

                        {/* Event History Table */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <History className="w-4 h-4 text-indigo-600" />
                                    Key Press History Log ({history.length})
                                </label>
                                {history.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearHistory}
                                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3 h-3" /> Clear Log
                                    </button>
                                )}
                            </div>

                            <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                                {history.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                        No keys pressed yet. Type on your keyboard to record event stream.
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setCurrentEvent(item)}
                                            className="p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer transition"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                    {item.key === " " ? "Space" : item.key}
                                                </span>
                                                <span className="font-mono text-slate-500 text-[11px]">{item.code}</span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-[11px] text-slate-400">
                                                    keyCode: <strong className="text-slate-700">{item.keyCode}</strong>
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{item.timestamp}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleCopyText(JSON.stringify(currentEvent, null, 2), "event-json")}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedKey === "event-json" ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            {copiedKey === "event-json" ? "Copied JSON Payload" : "Copy Event JSON"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `keyboard-event-log-${Date.now()}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            disabled={history.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-sm transition border border-slate-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export History
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Deep Dive */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding JavaScript Keyboard Events: event.key vs. event.code
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In modern web development, capturing keyboard input accurately is critical for building accessibility-compliant shortcuts, interactive canvas games, and rich text editors. Prior to the modern DOM Level 3 Events specification, developers relied heavily on numeric properties such as <code>event.keyCode</code> and <code>event.which</code>. However, these legacy values produced severe bugs across international keyboards and different operating systems.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Modern Standard: event.key
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                <code>event.key</code> returns the semantic value of the character generated. It accounts for whether the <code>Shift</code> key is held down (producing <code>&quot;A&quot;</code> instead of <code>&quot;a&quot;</code>) and adapts to localized keyboard layouts (e.g., QWERTY, AZERTY, or Cyrillic).
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                if (event.key === &apos;Enter&apos; || event.key === &apos;Escape&apos;) &#123; submit(); &#125;
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Laptop className="w-4 h-4 text-indigo-600" /> Physical Hardware: event.code
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                <code>event.code</code> identifies the physical hardware key on the keyboard, completely unaffected by language layout or modifier keys. Pressing the physical &apos;W&apos; key always emits <code>&quot;KeyW&quot;</code>, making it the ideal choice for WASD game controls.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                if (event.code === &apos;KeyW&apos;) &#123; player.moveForward(); &#125;
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Property Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            KeyboardEvent Property Comparison & Deprecation Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The W3C DOM Level 3 Event standard explicitly discourages legacy numeric codes in favor of string-based identifiers. Review the feature comparison below:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Property</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Specification Status</th>
                                    <th className="p-3">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">event.key</td>
                                    <td className="p-3 font-mono">string</td>
                                    <td className="p-3 text-emerald-700 font-bold">Standard (Recommended)</td>
                                    <td className="p-3">Form inputs, keyboard shortcuts, UI navigation</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">event.code</td>
                                    <td className="p-3 font-mono">string</td>
                                    <td className="p-3 text-emerald-700 font-bold">Standard (Recommended)</td>
                                    <td className="p-3">Game movement (WASD), physical key bindings</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-600">event.location</td>
                                    <td className="p-3 font-mono">number (0-3)</td>
                                    <td className="p-3 text-emerald-700 font-bold">Standard</td>
                                    <td className="p-3">Distinguishing Left vs. Right Shift / Numpad</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-amber-700">event.keyCode</td>
                                    <td className="p-3 font-mono">number</td>
                                    <td className="p-3 text-amber-600 font-bold">Deprecated (Legacy)</td>
                                    <td className="p-3">Legacy browser maintenance (IE11 and older)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-amber-700">event.which</td>
                                    <td className="p-3 font-mono">number</td>
                                    <td className="p-3 text-amber-600 font-bold">Deprecated (Legacy)</td>
                                    <td className="p-3">Older jQuery compatibility layers</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Common Keycode Cheat Sheet Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileCode className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Common JavaScript Keycode Reference Table
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Quick reference values for the most frequently implemented keyboard keys across standard web applications:
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { name: "Enter / Return", key: "Enter", code: "Enter", codeNum: 13 },
                            { name: "Escape", key: "Escape", code: "Escape", codeNum: 27 },
                            { name: "Spacebar", key: " ", code: "Space", codeNum: 32 },
                            { name: "Tab", key: "Tab", code: "Tab", codeNum: 9 },
                            { name: "Backspace", key: "Backspace", code: "Backspace", codeNum: 8 },
                            { name: "Delete", key: "Delete", code: "Delete", codeNum: 46 },
                            { name: "Arrow Up", key: "ArrowUp", code: "ArrowUp", codeNum: 38 },
                            { name: "Arrow Down", key: "ArrowDown", code: "ArrowDown", codeNum: 40 },
                            { name: "Arrow Left", key: "ArrowLeft", code: "ArrowLeft", codeNum: 37 },
                            { name: "Arrow Right", key: "ArrowRight", code: "ArrowRight", codeNum: 39 },
                            { name: "Left Shift", key: "Shift", code: "ShiftLeft", codeNum: 16 },
                            { name: "Left Control", key: "Control", code: "ControlLeft", codeNum: 17 }
                        ].map((k) => (
                            <div key={k.code} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <div className="font-bold text-slate-900 text-xs">{k.name}</div>
                                <div className="text-[11px] font-mono text-slate-600 flex justify-between">
                                    <span>key: <strong className="text-indigo-600">&quot;{k.key}&quot;</strong></span>
                                    <span>code: <strong className="text-slate-800">{k.code}</strong></span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                    keyCode: {k.codeNum}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions */}
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
                                Why is event.keyCode deprecated in modern JavaScript?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The W3C deprecated event.keyCode and event.which because they are inconsistent across international keyboard layouts, operating systems, and browsers. Modern standards recommend event.key for semantic character values and event.code for physical key positions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between event.key and event.code?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                event.key returns the actual semantic character generated taking Shift, AltGr, and active keyboard language layouts into account (e.g., &quot;a&quot;, &quot;A&quot;, &quot;Å&quot;). In contrast, event.code represents the physical hardware key on the keyboard independent of layout (e.g., &quot;KeyA&quot;, &quot;Digit1&quot;).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does KeyboardEvent.location identify key positions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                KeyboardEvent.location indicates whether the pressed key was on the standard section (0), left side (1, e.g., Left Shift), right side (2, e.g., Right Shift), or numeric keypad (3, e.g., Numpad 5).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How can I prevent default browser keyboard behaviors like scrolling?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Call event.preventDefault() inside a keydown event listener. This prevents native browser behaviors like Space or Arrow keys scrolling the viewport, Tab moving focus, or Backspace navigating back in older browsers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool track modifier keys like Shift, Control, Alt, and Meta?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The inspector displays boolean status flags for event.shiftKey, event.ctrlKey, event.altKey, and event.metaKey (Command on macOS or Windows key on PC), as well as repeat and isComposing flags for IME inputs.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}