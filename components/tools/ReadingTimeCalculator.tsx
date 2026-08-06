"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Clock,
    Mic,
    BookOpen,
    Copy,
    Check,
    Download,
    RefreshCw,
    Sparkles,
    BarChart3,
    FileText,
    HelpCircle,
    Sliders,
    Volume2,
    Zap,
    AlertCircle,
    Info,
    CheckCircle2,
    Layers,
    Lightbulb
} from "lucide-react";

type SpeechPace = "slow" | "conversational" | "presentation" | "fast";

interface ReadingPaceConfig {
    label: string;
    wpm: number;
    description: string;
}

const READING_SPEEDS = {
    slow: { label: "Slow / Careful", wpm: 130, description: "Technical docs, dense academic material, legal copy" },
    average: { label: "Average Silent", wpm: 230, description: "Standard non-fiction, blog posts, news articles" },
    fast: { label: "Fast / Skimming", wpm: 310, description: "Casual fiction, light reading, quick reviews" }
};

const SPEAKING_PACINGS: Record<SpeechPace, ReadingPaceConfig> = {
    slow: { label: "Slow & Deliberate", wpm: 110, description: "Keynotes, technical lectures, solemn presentations" },
    conversational: { label: "Conversational", wpm: 140, description: "Podcasts, casual talks, YouTube voiceovers" },
    presentation: { label: "Standard Business", wpm: 160, description: "Corporate pitches, webinars, slide decks" },
    fast: { label: "Fast / Broadcast", wpm: 180, description: "Radio ads, rapid announcements, fast narrations" }
};

interface TextPreset {
    id: string;
    label: string;
    tag: string;
    text: string;
}

const SAMPLE_PRESETS: TextPreset[] = [
    {
        id: "keynote",
        label: "Product Launch Pitch",
        tag: "160 Words",
        text: "Today, we are thrilled to introduce a groundbreaking leap forward in productivity software. Over the past two years, our engineering team has reimagined every layer of the digital workflow, focusing on speed, elegance, and unyielding privacy. We believe technology should get out of your way and empower your creativity. With our newest suite of native browser tools, performance meets precision. Everything runs entirely client-side, giving you total sovereign control over your sensitive data. No cloud uploads, no latency, and zero tracking. Join thousands of creators and professionals who are elevating their work today."
    },
    {
        id: "technical",
        label: "Technical Architecture",
        tag: "245 Words",
        text: "Modern micro-frontend architectures demand strict encapsulation and low-overhead communication mechanisms. When decoupling single-page applications into domain-driven micro-apps, teams frequently face challenges regarding shared state management, global asset duplication, and CSS collision. Implementing event-driven custom elements alongside lightweight event buses allows independent feature teams to deploy isolated modules without tight coupling. Furthermore, utilizing web workers for heavy data serialization ensures that the main UI rendering thread remains responsive at sixty frames per second. By auditing bundle sizes using dynamic imports and modern tree-shaking algorithms, enterprise organizations can cut initial page load latency by over forty percent. Continuous monitoring of Core Web Vitals—specifically Largest Contentful Paint and Cumulative Layout Shift—provides actionable telemetry to optimize user retention and conversions across heterogeneous client environments."
    },
    {
        id: "short-script",
        label: "30-Sec Video Script",
        tag: "75 Words",
        text: "Are you tired of waiting for slow web applications? Meet TwisterTools: the world's fastest suite of browser-native web utilities. Designed for developers, writers, and marketers, our platform processes your files directly on your device. That means zero load times and maximum data privacy. Best of all, it is 100% free with no sign-ups required. Supercharge your daily workflow today. Visit twistertools.com and experience lightning-fast productivity right in your browser!"
    }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function ReadingTimeCalculator() {
    // Input State
    const [text, setText] = useState<string>(SAMPLE_PRESETS[0].text);
    const [customReadingWpm, setCustomReadingWpm] = useState<number>(230);
    const [customSpeakingWpm, setCustomSpeakingWpm] = useState<number>(140);
    const [activePace, setActivePace] = useState<SpeechPace>("conversational");

    // UI States
    const [copied, setCopied] = useState<boolean>(false);
    const [activePresetId, setActivePresetId] = useState<string | null>("keynote");
    const [activeTab, setActiveTab] = useState<"overview" | "breakdown">("overview");

    const exportRef = useRef<HTMLDivElement>(null);

    // Derived Text Analytics Calculations
    const metrics = useMemo(() => {
        const trimmed = text.trim();
        if (!trimmed) {
            return {
                wordCount: 0,
                charCount: 0,
                charNoSpaces: 0,
                sentenceCount: 0,
                paragraphCount: 0,
                avgWordLength: 0,
                readingTimeSeconds: 0,
                speakingTimeSeconds: 0,
                customReadingTimeSec: 0,
                customSpeakingTimeSec: 0,
            };
        }

        // Word Extraction matching whitespace boundary
        const words = trimmed.match(/\S+/g) || [];
        const wordCount = words.length;

        const charCount = text.length;
        const charNoSpaces = text.replace(/\s/g, "").length;

        // Sentence detection (splits on . ! ?)
        const sentences = trimmed.split(/[.!?]+/).filter(Boolean);
        const sentenceCount = sentences.length || 1;

        // Paragraph detection
        const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
        const paragraphCount = paragraphs.length || 1;

        // Average word length
        const totalCharsInWords = words.reduce((acc, w) => acc + w.length, 0);
        const avgWordLength = wordCount > 0 ? (totalCharsInWords / wordCount).toFixed(1) : "0";

        // Time Calculations (in seconds)
        const readingTimeSeconds = Math.ceil((wordCount / 230) * 60);
        const speakingTimeSeconds = Math.ceil((wordCount / SPEAKING_PACINGS[activePace].wpm) * 60);

        const customReadingTimeSec = customReadingWpm > 0 ? Math.ceil((wordCount / customReadingWpm) * 60) : 0;
        const customSpeakingTimeSec = customSpeakingWpm > 0 ? Math.ceil((wordCount / customSpeakingWpm) * 60) : 0;

        return {
            wordCount,
            charCount,
            charNoSpaces,
            sentenceCount,
            paragraphCount,
            avgWordLength: Number(avgWordLength),
            readingTimeSeconds,
            speakingTimeSeconds,
            customReadingTimeSec,
            customSpeakingTimeSec
        };
    }, [text, activePace, customReadingWpm, customSpeakingWpm]);

    // Format seconds into digital display (e.g., 2m 15s or 0m 45s)
    const formatDuration = (totalSeconds: number): string => {
        if (totalSeconds <= 0) return "0s";
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (mins === 0) return `${secs}s`;
        if (secs === 0) return `${mins}m`;
        return `${mins}m ${secs}s`;
    };

    const handlePresetApply = (preset: TextPreset) => {
        setText(preset.text);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setText("");
        setCustomReadingWpm(230);
        setCustomSpeakingWpm(140);
        setActivePace("conversational");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Reading & Speaking Pace Summary (TwisterTools):
----------------------------------------
Word Count: ${metrics.wordCount.toLocaleString()} words
Character Count: ${metrics.charCount.toLocaleString()} chars
Sentence Count: ${metrics.sentenceCount.toLocaleString()}
Paragraph Count: ${metrics.paragraphCount.toLocaleString()}
----------------------------------------
Silent Reading Time (230 WPM): ${formatDuration(metrics.readingTimeSeconds)}
Speaking Time (${SPEAKING_PACINGS[activePace].label}): ${formatDuration(metrics.speakingTimeSeconds)}
Custom Reading Time (${customReadingWpm} WPM): ${formatDuration(metrics.customReadingTimeSec)}
Custom Speaking Time (${customSpeakingWpm} WPM): ${formatDuration(metrics.customSpeakingTimeSec)}
----------------------------------------
Calculated at twistertools.com/tools/text-tools/reading-time-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Metric", "Value", "Notes / Speed"];
        const rows = [
            ["Word Count", `${metrics.wordCount}`, "Total words"],
            ["Character Count (with spaces)", `${metrics.charCount}`, "Total length"],
            ["Character Count (no spaces)", `${metrics.charNoSpaces}`, "Raw characters"],
            ["Sentences", `${metrics.sentenceCount}`, "Punctuation split"],
            ["Paragraphs", `${metrics.paragraphCount}`, "Line block split"],
            ["Avg Word Length", `${metrics.avgWordLength}`, "Characters per word"],
            ["Silent Reading Time", formatDuration(metrics.readingTimeSeconds), "Standard (230 WPM)"],
            ["Speaking Duration", formatDuration(metrics.speakingTimeSeconds), `${SPEAKING_PACINGS[activePace].label} (${SPEAKING_PACINGS[activePace].wpm} WPM)`],
            ["Custom Reading Duration", formatDuration(metrics.customReadingTimeSec), `User Speed (${customReadingWpm} WPM)`],
            ["Custom Speaking Duration", formatDuration(metrics.customSpeakingTimeSec), `User Speed (${customSpeakingWpm} WPM)`]
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `reading_speaking_time_estimate.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured JSON-LD Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Reading Time & Speaking Pace Estimator",
        "url": "https://twistertools.com/tools/text-tools/reading-time-calculator",
        "description": "Calculate estimated reading time and speech presentation duration based on word counts, custom WPM rates, and speaking pace parameters.",
        "applicationCategory": "UtilitiesApplication",
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
                "name": "What is the average reading speed for adults?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The average silent reading speed for adults reading non-fiction in English is approximately 200 to 250 words per minute (WPM). Standard technical or academic material drops reading speeds closer to 130–150 WPM."
                }
            },
            {
                "@type": "Question",
                "name": "How fast does an average person speak during a speech or presentation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Average conversational speaking rates range between 130 and 150 words per minute. Formal corporate presentations and keynote speeches are typically delivered at 140 to 160 WPM for maximum clarity, while radio broadcasts often reach 180 WPM."
                }
            },
            {
                "@type": "Question",
                "name": "How is reading time calculated for web articles?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Web platforms like Medium calculate reading time by dividing the total word count by 265 WPM and adding additional seconds for inline images and code blocks."
                }
            },
            {
                "@type": "Question",
                "name": "Does text complexity or word length affect reading time?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Dense vocabulary, longer average word lengths, and complex sentence structures increase cognitive processing time, which lowers real-world reading speeds compared to simple prose."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Text Input & Pacing Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Script & Text Content
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Clear Text
                            </button>
                        </div>

                        {/* Textarea Input Container */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Paste Copy or Speech Draft
                                </label>
                                <span className="text-xs font-medium text-slate-500">
                                    {metrics.wordCount.toLocaleString()} words | {metrics.charCount.toLocaleString()} chars
                                </span>
                            </div>
                            <textarea
                                value={text}
                                onChange={(e) => {
                                    setText(e.target.value);
                                    setActivePresetId(null);
                                }}
                                placeholder="Paste or type your article, script, presentation text, or speech copy here..."
                                className="w-full h-64 sm:h-72 p-4 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 font-normal focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50/50 resize-y leading-relaxed"
                            />
                        </div>

                        {/* Presets Selector */}
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Sample Text Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Loaded
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {SAMPLE_PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => handlePresetApply(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                }`}>
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Speaking Pace Controls */}
                        <div className="mt-5 space-y-3 pt-4 border-t border-slate-100">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Mic className="w-4 h-4 text-indigo-600" /> Select Presentation / Speech Style
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(Object.keys(SPEAKING_PACINGS) as SpeechPace[]).map((key) => {
                                    const item = SPEAKING_PACINGS[key];
                                    const isSelected = activePace === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setActivePace(key)}
                                            className={`p-2.5 text-left rounded-xl border transition flex flex-col justify-between ${isSelected
                                                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600"
                                                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                                                }`}
                                        >
                                            <span className="text-xs font-bold">{item.label}</span>
                                            <span className="text-[11px] font-semibold text-indigo-600 mt-1">{item.wpm} WPM</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Left Action Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3 mt-4">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Timing Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> CSV Export
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Estimated Speeds, Results & Custom WPM Sliders */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Estimated Delivery Metrics
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Hero Summary
                                </button>
                                <button
                                    onClick={() => setActiveTab("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Text Stats
                                </button>
                            </div>
                        </div>

                        {/* Main Dual Result Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Silent Reading Time Box */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-600" /> Silent Reading
                                    </span>
                                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                                        230 WPM Std
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                        {formatDuration(metrics.readingTimeSeconds)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                        Estimated speed for blogs & non-fiction
                                    </p>
                                </div>
                            </div>

                            {/* Speaking / Speech Pace Box */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-slate-50 border border-emerald-100 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                        <Mic className="w-4 h-4 text-emerald-600" /> Speech / Presentation
                                    </span>
                                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                        {SPEAKING_PACINGS[activePace].wpm} WPM
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <div className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                                        {formatDuration(metrics.speakingTimeSeconds)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                        Pace: {SPEAKING_PACINGS[activePace].label}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "overview" ? (
                            <div className="space-y-4 pt-1">
                                {/* Custom WPM Adjuster Controls */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sliders className="w-4 h-4 text-indigo-600" /> Custom Velocity Calibration
                                        </h3>
                                        <span className="text-[11px] text-slate-500">Adjust WPM manually</span>
                                    </div>

                                    {/* Custom Reading Slider */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-semibold text-slate-700">Custom Reading Pace</span>
                                            <span className="font-bold text-indigo-600">{customReadingWpm} WPM ({formatDuration(metrics.customReadingTimeSec)})</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="80"
                                                max="500"
                                                step="5"
                                                value={customReadingWpm}
                                                onChange={(e) => setCustomReadingWpm(Number(e.target.value))}
                                                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                            />
                                            <input
                                                type="number"
                                                min="50"
                                                max="800"
                                                value={customReadingWpm === 0 ? "" : customReadingWpm}
                                                onChange={(e) => handleNumberInput(e, (val) => setCustomReadingWpm(Math.max(1, val)))}
                                                className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center"
                                            />
                                        </div>
                                    </div>

                                    {/* Custom Speaking Slider */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-semibold text-slate-700">Custom Speaking Pace</span>
                                            <span className="font-bold text-emerald-600">{customSpeakingWpm} WPM ({formatDuration(metrics.customSpeakingTimeSec)})</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="60"
                                                max="300"
                                                step="5"
                                                value={customSpeakingWpm}
                                                onChange={(e) => setCustomSpeakingWpm(Number(e.target.value))}
                                                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                            />
                                            <input
                                                type="number"
                                                min="40"
                                                max="400"
                                                value={customSpeakingWpm === 0 ? "" : customSpeakingWpm}
                                                onChange={(e) => handleNumberInput(e, (val) => setCustomSpeakingWpm(Math.max(1, val)))}
                                                className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Speed Benchmark Breakdown Cards */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Slow / Technical</span>
                                        <span className="text-sm font-bold text-slate-800 mt-0.5 block">130 WPM</span>
                                        <span className="text-xs text-indigo-600 font-semibold">{formatDuration(Math.ceil((metrics.wordCount / 130) * 60))}</span>
                                    </div>
                                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Silent</span>
                                        <span className="text-sm font-bold text-slate-800 mt-0.5 block">230 WPM</span>
                                        <span className="text-xs text-indigo-600 font-semibold">{formatDuration(metrics.readingTimeSeconds)}</span>
                                    </div>
                                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skimming / Fast</span>
                                        <span className="text-sm font-bold text-slate-800 mt-0.5 block">310 WPM</span>
                                        <span className="text-xs text-indigo-600 font-semibold">{formatDuration(Math.ceil((metrics.wordCount / 310) * 60))}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Text Stats Detailed Grid */
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                                    <span className="text-xs text-slate-500 font-medium">Total Words</span>
                                    <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.wordCount.toLocaleString()}</p>
                                </div>
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                                    <span className="text-xs text-slate-500 font-medium">Characters (With Spaces)</span>
                                    <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.charCount.toLocaleString()}</p>
                                </div>
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                                    <span className="text-xs text-slate-500 font-medium">Characters (No Spaces)</span>
                                    <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.charNoSpaces.toLocaleString()}</p>
                                </div>
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                                    <span className="text-xs text-slate-500 font-medium">Sentences</span>
                                    <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.sentenceCount.toLocaleString()}</p>
                                </div>
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                                    <span className="text-xs text-slate-500 font-medium">Paragraph Blocks</span>
                                    <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.paragraphCount.toLocaleString()}</p>
                                </div>
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                                    <span className="text-xs text-slate-500 font-medium">Avg Word Length</span>
                                    <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.avgWordLength} <span className="text-xs text-slate-500 font-normal">chars</span></p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Status Indicator */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time text engine active
                        </span>
                        <span>Client-side Processing</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Core Mechanics & Speed Standards */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Reading Time & Speaking Pace Dynamics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Accurately estimating silent reading time and speech presentation duration is essential for modern content creators, public speakers, copywriters, and video producers. Whether you are structuring a 30-second broadcast ad, preparing a 10-minute keynote speech, or displaying estimated read times on a blog, understanding <strong>Words Per Minute (WPM)</strong> dynamics guarantees your content fits its intended temporal window.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-600" /> Silent Reading Rates
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Research shows the average English-speaking adult reads non-fiction silently at approximately 200 to 250 WPM. Technical documentation and academic publications drop average rates down to 130–150 WPM due to increased cognitive processing demand.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Mic className="w-4 h-4 text-indigo-600" /> Speech & Vocal Delivery Rates
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Spoken delivery requires pauses, breath control, and emphasis. Keynote presentations average 140–160 WPM, while podcasts and conversational video voiceovers sit at 130–150 WPM. Radio and commercial broadcasts can stretch to 180 WPM.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Industry Benchmark Reference Tables */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            WPM Benchmarks Across Media Formats
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refer to the table below to target the ideal word count for specific time constraints across digital channels:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Content Format</th>
                                    <th className="p-3">Target Duration</th>
                                    <th className="p-3">Average WPM</th>
                                    <th className="p-3">Target Word Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">YouTube Short / TikTok Script</td>
                                    <td className="p-3">30 Seconds</td>
                                    <td className="p-3">150 WPM</td>
                                    <td className="p-3 font-bold text-slate-900">75 Words</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Commercial Radio / TV Spot</td>
                                    <td className="p-3">60 Seconds</td>
                                    <td className="p-3">160 WPM</td>
                                    <td className="p-3 font-bold text-slate-900">150–160 Words</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Elevator Pitch</td>
                                    <td className="p-3">2 Minutes</td>
                                    <td className="p-3">140 WPM</td>
                                    <td className="p-3 font-bold text-slate-900">280 Words</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Keynote Presentation</td>
                                    <td className="p-3">10 Minutes</td>
                                    <td className="p-3">140 WPM</td>
                                    <td className="p-3 font-bold text-slate-900">1,400 Words</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Blog Article (Quick Read)</td>
                                    <td className="p-3">3 Minutes</td>
                                    <td className="p-3">230 WPM (Silent)</td>
                                    <td className="p-3 font-bold text-slate-900">700 Words</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Deep-Dive Technical Guide</td>
                                    <td className="p-3">10 Minutes</td>
                                    <td className="p-3">200 WPM (Silent)</td>
                                    <td className="p-3 font-bold text-slate-900">2,000 Words</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Key Optimization Strategies for Presenters & Writers */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Best Practices for Speeches and Article Timing
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Account for Pauses</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Always subtract 10% from your maximum word count limit to leave natural pauses for audience laughter, slide transitions, and breath control.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Display Read Time on Blogs</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Adding estimated reading time to blog post headers increases reader engagement and lowers bounce rates by setting clear expectations.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Use Teleprompter Margins</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When using a teleprompter, target 130 to 140 WPM. Reading from a moving screen naturally slows vocal cadence compared to memorized delivery.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                What is the average reading speed for adults?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The average silent reading speed for adults reading non-fiction in English is approximately 200 to 250 words per minute (WPM). Technical or dense academic text drops average reading speeds to 130–150 WPM.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How fast does an average person speak during a presentation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Conversational speaking rates range between 130 and 150 words per minute. Formal corporate speeches are typically delivered at 140 to 160 WPM, while radio broadcasts often reach 180 WPM.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do platforms like Medium calculate reading time?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Web platforms like Medium calculate reading time by dividing the total word count by 265 WPM and adding additional seconds for inline images and code blocks.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does text complexity affect reading time?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Complex vocabulary, longer average word lengths, and dense sentence structures increase cognitive processing time, which lowers real-world reading speeds compared to simple prose.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}