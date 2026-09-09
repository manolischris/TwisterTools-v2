"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Link as LinkIcon,
    Copy,
    Check,
    Plus,
    Trash2,
    ExternalLink,
    Sliders,
    ShieldAlert,
    BookOpen,
    HelpCircle,
    Layers,
    ListOrdered,
    Code,
    CheckCircle2,
    CornerDownRight
} from "lucide-react";

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

interface ChapterItem {
    id: string;
    hours: number;
    minutes: number;
    seconds: number;
    title: string;
}

type UrlFormat = "youtu.be" | "watch_v" | "embed";

const SAMPLE_CHAPTERS: ChapterItem[] = [
    { id: "sample-1", hours: 0, minutes: 0, seconds: 0, title: "Introduction & Overview" },
    { id: "sample-2", hours: 0, minutes: 1, seconds: 45, title: "System Architecture Deep Dive" },
    { id: "sample-3", hours: 0, minutes: 5, seconds: 30, title: "Live Configuration & Setup" },
    { id: "sample-4", hours: 0, minutes: 12, seconds: 15, title: "Production Deployment Walkthrough" },
    { id: "sample-5", hours: 0, minutes: 18, seconds: 50, title: "Q&A and Key Takeaways" }
];

export default function YouTubeTimestampChapterGenerator() {
    const [videoInput, setVideoInput] = useState<string>("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    const [hours, setHours] = useState<number>(0);
    const [minutes, setMinutes] = useState<number>(1);
    const [seconds, setSeconds] = useState<number>(45);
    const [autoPlay, setAutoPlay] = useState<boolean>(false);
    const [urlFormat, setUrlFormat] = useState<UrlFormat>("youtu.be");
    const [chapters, setChapters] = useState<ChapterItem[]>(SAMPLE_CHAPTERS);

    // Chapter inputs state for single-entry builder
    const [newChapHours, setNewChapHours] = useState<number>(0);
    const [newChapMins, setNewChapMins] = useState<number>(0);
    const [newChapSecs, setNewChapSecs] = useState<number>(0);
    const [newChapTitle, setNewChapTitle] = useState<string>("");

    // Feedback states
    const [copiedDeepLink, setCopiedDeepLink] = useState<boolean>(false);
    const [copiedChapters, setCopiedChapters] = useState<boolean>(false);
    const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);

    const videoInputId = useId();
    const hoursInputId = useId();
    const minutesInputId = useId();
    const secondsInputId = useId();
    const chapterTitleId = useId();

    // Leading-zero sanitizer for number inputs
    const handleNumberInput = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: number) => void,
        max?: number
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        let num = parseInt(cleaned, 10);
        if (isNaN(num)) num = 0;
        if (max !== undefined && num > max) num = max;
        setter(num);
    };

    // Extract raw 11-char YouTube ID
    const videoId = useMemo(() => {
        if (!videoInput) return "dQw4w9WgXcQ";
        const trimmed = videoInput.trim();
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = trimmed.match(regExp);
        if (match && match[1]) return match[1];
        if (trimmed.length === 11 && !trimmed.includes("/") && !trimmed.includes(".")) {
            return trimmed;
        }
        return "dQw4w9WgXcQ";
    }, [videoInput]);

    // Computed total seconds for deep-link
    const totalSingleSeconds = useMemo(() => {
        return (hours * 3600) + (minutes * 60) + seconds;
    }, [hours, minutes, seconds]);

    // Format human-readable time string (MM:SS or HH:MM:SS)
    const formatTimestamp = (h: number, m: number, s: number): string => {
        const paddedM = m.toString().padStart(2, "0");
        const paddedS = s.toString().padStart(2, "0");
        if (h > 0) {
            return `${h}:${paddedM}:${paddedS}`;
        }
        return `${m}:${paddedS}`;
    };

    // Deep-link generation
    const generatedDeepLink = useMemo(() => {
        const t = totalSingleSeconds;
        const autoPlayParam = autoPlay ? "&autoplay=1" : "";
        if (urlFormat === "youtu.be") {
            return `https://youtu.be/${videoId}?t=${t}${autoPlay ? "&autoplay=1" : ""}`;
        }
        if (urlFormat === "watch_v") {
            return `https://www.youtube.com/watch?v=${videoId}&t=${t}s${autoPlayParam}`;
        }
        return `https://www.youtube.com/embed/${videoId}?start=${t}${autoPlay ? "&autoplay=1" : ""}`;
    }, [videoId, totalSingleSeconds, urlFormat, autoPlay]);

    // Embed iFrame string
    const embedCode = useMemo(() => {
        const startSec = totalSingleSeconds;
        return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}?start=${startSec}${autoPlay ? "&autoplay=1" : ""}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }, [videoId, totalSingleSeconds, autoPlay]);

    // Formatted YouTube description chapter block
    const formattedChaptersDescription = useMemo(() => {
        if (!chapters.length) return "";
        return chapters
            .map((ch) => `${formatTimestamp(ch.hours, ch.minutes, ch.seconds)} ${ch.title}`)
            .join("\n");
    }, [chapters]);

    // Copy Handlers
    const handleCopyDeepLink = () => {
        navigator.clipboard.writeText(generatedDeepLink);
        setCopiedDeepLink(true);
        setTimeout(() => setCopiedDeepLink(false), 2000);
    };

    const handleCopyChapters = () => {
        navigator.clipboard.writeText(formattedChaptersDescription);
        setCopiedChapters(true);
        setTimeout(() => setCopiedChapters(false), 2000);
    };

    const handleCopyEmbed = () => {
        navigator.clipboard.writeText(embedCode);
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
    };

    // Chapter Management
    const handleAddChapter = () => {
        if (!newChapTitle.trim()) return;
        const newItem: ChapterItem = {
            id: `chap-${Date.now()}`,
            hours: newChapHours,
            minutes: newChapMins,
            seconds: newChapSecs,
            title: newChapTitle.trim()
        };
        const updated = [...chapters, newItem].sort((a, b) => {
            const timeA = (a.hours * 3600) + (a.minutes * 60) + a.seconds;
            const timeB = (b.hours * 3600) + (b.minutes * 60) + b.seconds;
            return timeA - timeB;
        });
        setChapters(updated);
        setNewChapTitle("");
    };

    const handleRemoveChapter = (id: string) => {
        setChapters(chapters.filter((item) => item.id !== id));
    };

    const handleResetChapters = () => {
        setChapters(SAMPLE_CHAPTERS);
    };

    const handleClearChapters = () => {
        setChapters([]);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "YouTube Timestamp Chapter Link & Deep-Link Generator",
        "url": "https://twistertools.com/tools/social-tools/youtube-timestamp-link-generator",
        "description": "Generate exact timestamped YouTube URLs, interactive video chapters for descriptions, and start-time embed iframe snippets with zero ads or tracking.",
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
                "name": "What is the difference between ?t= and &t= in YouTube timestamp links?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The prefix depends on URL structure. In short URLs (youtu.be/ID), ?t= represents the initial query parameter. In standard watch URLs (youtube.com/watch?v=ID), ?v= is the first parameter, meaning the timestamp must append with an ampersand (&t=105s or &t=105). TwisterTools auto-formats the exact query operator to avoid broken links."
                }
            },
            {
                "@type": "Question",
                "name": "Why do YouTube video chapters fail to appear on the timeline bar?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "YouTube chapter markers require three mandatory criteria: the first chapter must begin at exactly 00:00 (or 0:00), there must be at least three sequential chapters in ascending order, and every chapter must be at least 10 seconds in duration."
                }
            },
            {
                "@type": "Question",
                "name": "Can I embed a YouTube video that starts at a specific minute?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. YouTube iframe embed codes use the start query parameter evaluated in total seconds (e.g., embed/VIDEO_ID?start=125). TwisterTools calculates the mathematical total of hours, minutes, and seconds and creates production-ready HTML embed snippets."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool work on mobile YouTube apps on iOS and Android?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Timestamped youtu.be and youtube.com deep-links automatically open the native iOS or Android YouTube mobile applications directly at the designated cue point, providing an optimal mobile user experience."
                }
            },
            {
                "@type": "Question",
                "name": "Can timestamps be formatted with hours, minutes, and seconds?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. While URL parameters accept raw integer seconds (e.g., &t=3720), description chapter markers support both MM:SS (for clips under 60 minutes) and HH:MM:SS format (for long-form videos, livestreams, and podcasts)."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 12-Column Responsive Workspace Grid (5/7 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Time Controls (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Timestamp Settings
                        </h2>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            Live Sync
                        </span>
                    </div>

                    {/* Target URL Input */}
                    <div className="space-y-1.5">
                        <label htmlFor={videoInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            YouTube Video URL or ID:
                        </label>
                        <div className="relative">
                            <input
                                id={videoInputId}
                                type="text"
                                aria-label="YouTube Video URL or Video ID"
                                value={videoInput}
                                onChange={(e) => setVideoInput(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition truncate"
                            />
                            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            Parsed Video ID: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{videoId}</code>
                        </p>
                    </div>

                    {/* Single Cue Point Timing */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Target Cue Point:
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label htmlFor={hoursInputId} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                    Hours
                                </label>
                                <input
                                    id={hoursInputId}
                                    type="number"
                                    min={0}
                                    aria-label="Timestamp hours"
                                    value={hours === 0 ? "" : hours}
                                    onChange={(e) => handleNumberInput(e, setHours)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-center text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor={minutesInputId} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                    Minutes
                                </label>
                                <input
                                    id={minutesInputId}
                                    type="number"
                                    min={0}
                                    max={59}
                                    aria-label="Timestamp minutes"
                                    value={minutes === 0 ? "" : minutes}
                                    onChange={(e) => handleNumberInput(e, setMinutes, 59)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-center text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor={secondsInputId} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                    Seconds
                                </label>
                                <input
                                    id={secondsInputId}
                                    type="number"
                                    min={0}
                                    max={59}
                                    aria-label="Timestamp seconds"
                                    value={seconds === 0 ? "" : seconds}
                                    onChange={(e) => handleNumberInput(e, setSeconds, 59)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-center text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl mt-2 font-mono">
                            <span>Formatted Cue: <strong>{formatTimestamp(hours, minutes, seconds)}</strong></span>
                            <span>Total: <strong>{totalSingleSeconds}s</strong></span>
                        </div>
                    </div>

                    {/* URL Formatting Selection */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Link Architecture:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setUrlFormat("youtu.be")}
                                className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${urlFormat === "youtu.be"
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                Short (youtu.be)
                            </button>
                            <button
                                type="button"
                                onClick={() => setUrlFormat("watch_v")}
                                className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${urlFormat === "watch_v"
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                Standard (watch)
                            </button>
                            <button
                                type="button"
                                onClick={() => setUrlFormat("embed")}
                                className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${urlFormat === "embed"
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                Embed (iframe)
                            </button>
                        </div>
                    </div>

                    {/* Auto-Play Toggle */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={autoPlay}
                                onChange={(e) => setAutoPlay(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                            />
                            <span>Append Autoplay Trigger (&amp;autoplay=1)</span>
                        </label>
                    </div>

                    {/* Chapter Builder Section */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                Add Video Chapter Marker:
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleResetChapters}
                                    className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                                >
                                    Reset Sample
                                </button>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <button
                                    type="button"
                                    onClick={handleClearChapters}
                                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline transition cursor-pointer"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="number"
                                min={0}
                                aria-label="Chapter Hours"
                                placeholder="HH"
                                value={newChapHours === 0 ? "" : newChapHours}
                                onChange={(e) => handleNumberInput(e, setNewChapHours)}
                                className="w-full px-2.5 py-1.5 text-center text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                                type="number"
                                min={0}
                                max={59}
                                aria-label="Chapter Minutes"
                                placeholder="MM"
                                value={newChapMins === 0 ? "" : newChapMins}
                                onChange={(e) => handleNumberInput(e, setNewChapMins, 59)}
                                className="w-full px-2.5 py-1.5 text-center text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                                type="number"
                                min={0}
                                max={59}
                                aria-label="Chapter Seconds"
                                placeholder="SS"
                                value={newChapSecs === 0 ? "" : newChapSecs}
                                onChange={(e) => handleNumberInput(e, setNewChapSecs, 59)}
                                className="w-full px-2.5 py-1.5 text-center text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <input
                                id={chapterTitleId}
                                type="text"
                                aria-label="Chapter Title or Segment Description"
                                placeholder="Chapter Title (e.g., Keynote Highlights)"
                                value={newChapTitle}
                                onChange={(e) => setNewChapTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleAddChapter(); }}
                                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddChapter}
                                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Interactive Output & Live Preview (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0 lg:sticky lg:top-6 self-start">
                    {/* Primary Deep-Link Output Box */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Generated Timestamp Link
                            </h2>
                            <a
                                href={generatedDeepLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                Test Link <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                            <code className="text-xs font-mono text-slate-900 dark:text-slate-100 truncate block">
                                {generatedDeepLink}
                            </code>
                            <button
                                type="button"
                                onClick={handleCopyDeepLink}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer ${copiedDeepLink
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                            >
                                {copiedDeepLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedDeepLink ? "Copied!" : "Copy Link"}
                            </button>
                        </div>
                    </div>

                    {/* Description Chapter Markers Output */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <ListOrdered className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    YouTube Description Chapters
                                </h2>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                    Paste directly into your video description for automated video timeline slicing
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyChapters}
                                disabled={!chapters.length}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer ${copiedChapters
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                                    }`}
                            >
                                {copiedChapters ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedChapters ? "Copied!" : "Copy Chapters"}
                            </button>
                        </div>

                        {/* List of Active Chapter Items */}
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {chapters.length === 0 ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-4">
                                    No chapters added yet. Use the left panel to insert video markers.
                                </p>
                            ) : (
                                chapters.map((ch) => (
                                    <div
                                        key={ch.id}
                                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md shrink-0">
                                                {formatTimestamp(ch.hours, ch.minutes, ch.seconds)}
                                            </span>
                                            <span className="text-slate-800 dark:text-slate-200 truncate font-medium">
                                                {ch.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHours(ch.hours);
                                                    setMinutes(ch.minutes);
                                                    setSeconds(ch.seconds);
                                                }}
                                                title="Sync to single cue point"
                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                            >
                                                <CornerDownRight className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveChapter(ch.id)}
                                                title="Remove chapter"
                                                className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Raw Description Textarea Output */}
                        <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Description Copy Block:
                            </label>
                            <textarea
                                readOnly
                                rows={4}
                                aria-label="Formatted description chapters block"
                                value={formattedChaptersDescription}
                                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none select-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Responsive Iframe Embed Preview & Code */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                HTML Embed Snippet
                            </h2>
                            <button
                                type="button"
                                onClick={handleCopyEmbed}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer ${copiedEmbed
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                            >
                                {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedEmbed ? "Copied!" : "Copy Embed HTML"}
                            </button>
                        </div>

                        {/* Visual Iframe Player */}
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-inner">
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${videoId}?start=${totalSingleSeconds}${autoPlay ? "&autoplay=1" : ""}`}
                                title="YouTube Video Preview Player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </div>

                        {/* Embed Code Readout */}
                        <pre className="p-3 font-mono text-[11px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 overflow-x-auto select-all">
                            {embedCode}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Mandatory Platform Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: How YouTube Timestamp Parameters Operate */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Complete Engineering Guide to YouTube Timestamp Query Parameters
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        YouTube supports granular deep-linking into specific video frames using URL parameters. However, differences between short domains (<code className="font-mono text-indigo-600 dark:text-indigo-400">youtu.be</code>), standard watch addresses (<code className="font-mono text-indigo-600 dark:text-indigo-400">youtube.com/watch</code>), and responsive HTML iframe embeds cause frequent broken link errors when formatted manually.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <LinkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Short URL (?t=)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                On short domains like <code className="font-mono text-indigo-600 dark:text-indigo-400">youtu.be/ID?t=125</code>, the question mark begins the query string. The parameter accepts raw integer seconds or shorthand time strings.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <YoutubeIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Watch URL (&t=Xs)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Because standard web addresses already contain a primary query parameter (<code className="font-mono text-indigo-600 dark:text-indigo-400">?v=ID</code>), timestamps must join with an ampersand (<code className="font-mono text-indigo-600 dark:text-indigo-400">&t=2m5s</code> or <code className="font-mono text-indigo-600 dark:text-indigo-400">&t=125s</code>).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Iframe Embed (?start=)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                YouTube HTML5 player embeds do not parse the <code className="font-mono text-indigo-600 dark:text-indigo-400">t</code> parameter. Embeds strictly mandate the <code className="font-mono text-indigo-600 dark:text-indigo-400">start</code> attribute defined purely in total integer seconds.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Architecture Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Schema: YouTube Link Types & Syntax Specifications
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Examine the exact parameter specifications required for each distribution channel:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">URL Type</th>
                                    <th className="p-3">Exact Syntax Example</th>
                                    <th className="p-3">Time Unit</th>
                                    <th className="p-3">Mobile App Deep-Link</th>
                                    <th className="p-3">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Short Deep-Link</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">youtu.be/ID?t=105</td>
                                    <td className="p-3">Seconds</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">100% Native</td>
                                    <td className="p-3">Social feeds, SMS, WhatsApp</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Desktop Watch URL</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">youtube.com/watch?v=ID&t=105s</td>
                                    <td className="p-3">Seconds or shorthand</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Supported</td>
                                    <td className="p-3">Email newsletters, citations</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">HTML5 Responsive Embed</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">youtube.com/embed/ID?start=105</td>
                                    <td className="p-3">Integer seconds strictly</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Inline Browser</td>
                                    <td className="p-3">Blogs, LMS courses, Docs</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Description Chapter Marker</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">01:45 Key Takeaway</td>
                                    <td className="p-3">MM:SS or HH:MM:SS</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Interactive Scrubbing</td>
                                    <td className="p-3">YouTube Video Descriptions</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 3 Rules for Automatic Chapter Detection */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            YouTube Algorithm Rules: Ensuring Chapters Appear on Your Video Timeline
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        YouTube automatically slices your scrub bar into distinct chapters and displays interactive segment titles inside Google Search results if your description conforms to three strict algorithmic requirements:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black text-xs flex items-center justify-center">1</span>
                                The 00:00 Starting Anchor
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The very first timestamp entry in your description must begin at <code className="font-mono text-indigo-600 dark:text-indigo-400">00:00</code> (or <code className="font-mono text-indigo-600 dark:text-indigo-400">0:00</code>). Omitting the zero anchor entirely disables chapter generation for the video.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black text-xs flex items-center justify-center">2</span>
                                Minimum 3 Chapters
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Your video description must contain at least three distinct timestamps listed in chronological order. Single or double timestamps will only generate plain text links rather than scrubber bar segments.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-black text-xs flex items-center justify-center">3</span>
                                10-Second Minimum Length
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Every chapter segment must span at least 10 seconds of runtime. Placing markers too close together triggers YouTube&apos;s anti-spam filters, collapsing the scrubber bar back into a continuous timeline.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between ?t= and &amp;t= in YouTube timestamp links?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The prefix depends on URL structure. In short URLs (youtu.be/ID), ?t= represents the initial query parameter. In standard watch URLs (youtube.com/watch?v=ID), ?v= is the first parameter, meaning the timestamp must append with an ampersand (&amp;t=105s or &amp;t=105). TwisterTools auto-formats the exact query operator to avoid broken links.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why do YouTube video chapters fail to appear on the timeline bar?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                YouTube chapter markers require three mandatory criteria: the first chapter must begin at exactly 00:00 (or 0:00), there must be at least three sequential chapters in ascending order, and every chapter must be at least 10 seconds in duration.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I embed a YouTube video that starts at a specific minute?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. YouTube iframe embed codes use the start query parameter evaluated in total seconds (e.g., embed/VIDEO_ID?start=125). TwisterTools calculates the mathematical total of hours, minutes, and seconds and creates production-ready HTML embed snippets.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this tool work on mobile YouTube apps on iOS and Android?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Timestamped youtu.be and youtube.com deep-links automatically open the native iOS or Android YouTube mobile applications directly at the designated cue point, providing an optimal mobile user experience.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can timestamps be formatted with hours, minutes, and seconds?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. While URL parameters accept raw integer seconds (e.g., &amp;t=3720), description chapter markers support both MM:SS (for clips under 60 minutes) and HH:MM:SS format (for long-form videos, livestreams, and podcasts).
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}