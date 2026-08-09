"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Clock,
    Calendar,
    Sparkles,
    Copy,
    Check,
    RotateCcw,
    Play,
    Pause,
    HelpCircle,
    Info,
    BookOpen,
    Calculator,
    CheckCircle2,
    Share2,
    Code,
    Eye,
    Settings,
    Layers,
    Palette,
    Volume2,
    VolumeX,
    Bell,
    Hourglass,
    Timer,
    Zap,
    Globe
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────

interface TimeLeft {
    totalSeconds: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
}

interface QuickPreset {
    label: string;
    getOffset: () => Date;
}

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

const formatTwoDigits = (num: number): string => {
    return String(num).padStart(2, "0");
};

const getDefaultTargetDate = (): string => {
    const target = new Date();
    target.setDate(target.getDate() + 7);
    target.setHours(12, 0, 0, 0);

    const year = target.getFullYear();
    const month = formatTwoDigits(target.getMonth() + 1);
    const day = formatTwoDigits(target.getDate());
    const hours = formatTwoDigits(target.getHours());
    const minutes = formatTwoDigits(target.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function CountdownTimerGenerator() {
    // Input Form State
    const [eventName, setEventName] = useState<string>("Product Launch");
    const [targetDateTime, setTargetDateTime] = useState<string>(getDefaultTargetDate());
    const [theme, setTheme] = useState<"indigo" | "dark" | "emerald" | "amber" | "rose">("indigo");
    const [displayStyle, setDisplayStyle] = useState<"cards" | "minimal" | "compact">("cards");
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
    const [completionMessage, setCompletionMessage] = useState<string>("🎉 The Event Has Arrived!");

    // Interactivity / Execution State
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [copiedLink, setCopiedLink] = useState<boolean>(false);
    const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);
    const [copiedIframe, setCopiedIframe] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"preview" | "embed" | "share">("preview");

    const [mounted, setMounted] = useState<boolean>(false);
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setMounted(true);
        setNow(new Date());
    }, []);

    useEffect(() => {
        if (!mounted || isPaused) return;
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused, mounted]);

    // Calculate Time Remaining
    const timeLeft: TimeLeft = useMemo(() => {
        if (!now) {
            return { totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false };
        }
        const target = new Date(targetDateTime).getTime();
        const current = now.getTime();
        const diff = target - current;

        if (isNaN(target) || diff <= 0) {
            return { totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
        }

        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return { totalSeconds, days, hours, minutes, seconds, isExpired: false };
    }, [targetDateTime, now]);

    // Handle Quick Presets
    const applyPreset = (minutesOffset: number, daysOffset: number = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        d.setMinutes(d.getMinutes() + minutesOffset);

        const year = d.getFullYear();
        const month = formatTwoDigits(d.getMonth() + 1);
        const day = formatTwoDigits(d.getDate());
        const hours = formatTwoDigits(d.getHours());
        const minutes = formatTwoDigits(d.getMinutes());

        setTargetDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
        setIsPaused(false);
    };

    // Reset Function
    const handleReset = () => {
        setEventName("Product Launch");
        setTargetDateTime(getDefaultTargetDate());
        setTheme("indigo");
        setDisplayStyle("cards");
        setShowLabels(true);
        setCompletionMessage("🎉 The Event Has Arrived!");
        setIsPaused(false);
    };

    // Generate Embed Snippets
    const shareableUrl = useMemo(() => {
        const params = new URLSearchParams({
            title: eventName,
            target: targetDateTime,
            theme: theme,
            style: displayStyle,
        });
        return `https://twistertools.com/tools/date-tools/countdown-timer-generator?${params.toString()}`;
    }, [eventName, targetDateTime, theme, displayStyle]);

    const iframeEmbedCode = useMemo(() => {
        return `<iframe src="${shareableUrl}" width="100%" height="350" frameborder="0" scrolling="no" style="border-radius:12px; border:1px solid #e2e8f0;"></iframe>`;
    }, [shareableUrl]);

    const htmlWidgetCode = useMemo(() => {
        return `<div id="twister-countdown" data-title="${eventName}" data-target="${targetDateTime}" data-theme="${theme}"></div>\n<script src="https://twistertools.com/widgets/countdown.js" async></script>`;
    }, [eventName, targetDateTime, theme]);

    const handleCopy = (text: string, type: "link" | "embed" | "iframe") => {
        navigator.clipboard.writeText(text).then(() => {
            if (type === "link") {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            } else if (type === "embed") {
                setCopiedEmbed(true);
                setTimeout(() => setCopiedEmbed(false), 2000);
            } else {
                setCopiedIframe(true);
                setTimeout(() => setCopiedIframe(false), 2000);
            }
        });
    };

    // Theme Styling Classes
    const getThemeClasses = () => {
        switch (theme) {
            case "dark":
                return {
                    bg: "bg-slate-900 text-white border-slate-800",
                    cardBg: "bg-slate-800 border-slate-700 text-white",
                    accentText: "text-slate-300",
                    badge: "bg-slate-800 text-slate-200 border-slate-700",
                };
            case "emerald":
                return {
                    bg: "bg-gradient-to-br from-emerald-900 to-teal-950 text-white border-emerald-800",
                    cardBg: "bg-emerald-800/60 border-emerald-700/60 text-white backdrop-blur-md",
                    accentText: "text-emerald-200",
                    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                };
            case "amber":
                return {
                    bg: "bg-gradient-to-br from-amber-900 to-amber-950 text-white border-amber-800",
                    cardBg: "bg-amber-800/60 border-amber-700/60 text-white backdrop-blur-md",
                    accentText: "text-amber-200",
                    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                };
            case "rose":
                return {
                    bg: "bg-gradient-to-br from-rose-900 to-pink-950 text-white border-rose-800",
                    cardBg: "bg-rose-800/60 border-rose-700/60 text-white backdrop-blur-md",
                    accentText: "text-rose-200",
                    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
                };
            default: // indigo
                return {
                    bg: "bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-800",
                    cardBg: "bg-indigo-800/50 border-indigo-700/50 text-white backdrop-blur-md",
                    accentText: "text-indigo-200",
                    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                };
        }
    };

    const currentTheme = getThemeClasses();

    return (
        <div className="w-full space-y-8">
            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* LEFT PANEL: Controls & Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-indigo-600" />
                                Timer Configuration
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                Quick Preset Benchmarks
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { label: "+15 Mins", action: () => applyPreset(15, 0) },
                                    { label: "+1 Hour", action: () => applyPreset(60, 0) },
                                    { label: "+24 Hours", action: () => applyPreset(0, 1) },
                                    { label: "+7 Days", action: () => applyPreset(0, 7) },
                                ].map((preset, idx) => (
                                    <button
                                        key={idx}
                                        onClick={preset.action}
                                        className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all min-h-[38px] cursor-pointer"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Event Title */}
                        <div className="space-y-1.5 min-w-0">
                            <label htmlFor="event-name" className="text-xs font-bold text-slate-700 block">
                                Event Name / Headline
                            </label>
                            <input
                                id="event-name"
                                type="text"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                placeholder="e.g., Black Friday Sale, New Year 2027"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all min-w-0"
                            />
                        </div>

                        {/* Target Date & Time */}
                        <div className="space-y-1.5 min-w-0">
                            <label htmlFor="target-datetime" className="text-xs font-bold text-slate-700 block">
                                Target Date &amp; Time
                            </label>
                            <input
                                id="target-datetime"
                                type="datetime-local"
                                value={targetDateTime}
                                onChange={(e) => setTargetDateTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all min-w-0"
                            />
                        </div>

                        {/* Completion Message */}
                        <div className="space-y-1.5 min-w-0">
                            <label htmlFor="completion-msg" className="text-xs font-bold text-slate-700 block">
                                Expiration / Completion Text
                            </label>
                            <input
                                id="completion-msg"
                                type="text"
                                value={completionMessage}
                                onChange={(e) => setCompletionMessage(e.target.value)}
                                placeholder="Text displayed when countdown reaches zero"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all min-w-0"
                            />
                        </div>

                        {/* Visual Styling Customization */}
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Theme Selector */}
                                <div className="space-y-1.5">
                                    <label htmlFor="theme-select" className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                                        <Palette className="w-3.5 h-3.5 text-indigo-600" /> Color Theme
                                    </label>
                                    <select
                                        id="theme-select"
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value as any)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                    >
                                        <option value="indigo">Indigo Slate (Default)</option>
                                        <option value="dark">Midnight Dark</option>
                                        <option value="emerald">Emerald Forest</option>
                                        <option value="amber">Amber Sunrise</option>
                                        <option value="rose">Rose Velvet</option>
                                    </select>
                                </div>

                                {/* Display Layout Style */}
                                <div className="space-y-1.5">
                                    <label htmlFor="style-select" className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-indigo-600" /> Display Layout
                                    </label>
                                    <select
                                        id="style-select"
                                        value={displayStyle}
                                        onChange={(e) => setDisplayStyle(e.target.value as any)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                    >
                                        <option value="cards">Separated Time Cards</option>
                                        <option value="minimal">Minimalist Digital Clock</option>
                                        <option value="compact">Inline Compact</option>
                                    </select>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={showLabels}
                                        onChange={(e) => setShowLabels(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                    Display Time Unit Labels
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsPaused(!isPaused)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${isPaused
                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            }`}
                                    >
                                        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                        {isPaused ? "Resume Preview" : "Pause Preview"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <Zap className="w-4 h-4 text-amber-500" /> Real-time Dynamic Rendering
                        </span>
                        <span>Client-side Execution</span>
                    </div>
                </div>

                {/* RIGHT PANEL: Dynamic Preview & Code Export */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Navigation Tabs */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                {[
                                    { id: "preview", label: "Live Preview", icon: Eye },
                                    { id: "embed", label: "Embed Code", icon: Code },
                                    { id: "share", label: "Direct Share", icon: Share2 },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === tab.id
                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TAB 1: LIVE PREVIEW */}
                        {activeTab === "preview" && (
                            <div className="space-y-4">
                                <div className={`p-6 sm:p-8 rounded-2xl border shadow-md transition-all ${currentTheme.bg}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${currentTheme.badge}`}>
                                            {timeLeft.isExpired ? "Event Ended" : "Countdown Active"}
                                        </span>
                                        <span className="text-xs opacity-75 flex items-center gap-1 font-mono">
                                            <Clock className="w-3.5 h-3.5" /> {mounted ? new Date(targetDateTime).toLocaleString() : ""}
                                        </span>
                                    </div>

                                    <h3 className="text-xl sm:text-2xl font-black text-center mb-6 tracking-tight">
                                        {eventName || "Event Countdown"}
                                    </h3>

                                    {timeLeft.isExpired ? (
                                        <div className="text-center py-8 space-y-2">
                                            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                                                {completionMessage}
                                            </div>
                                            <p className="text-xs opacity-80">The countdown has officially reached its target time.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* STYLE 1: CARDS */}
                                            {displayStyle === "cards" && (
                                                <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
                                                    {[
                                                        { value: timeLeft.days, label: "Days" },
                                                        { value: timeLeft.hours, label: "Hours" },
                                                        { value: timeLeft.minutes, label: "Minutes" },
                                                        { value: timeLeft.seconds, label: "Seconds" },
                                                    ].map((item, idx) => (
                                                        <div key={idx} className={`p-3 sm:p-4 rounded-xl border ${currentTheme.cardBg}`}>
                                                            <span className="block text-2xl sm:text-4xl font-black font-mono tracking-tight">
                                                                {formatTwoDigits(item.value)}
                                                            </span>
                                                            {showLabels && (
                                                                <span className={`block text-[10px] sm:text-xs font-bold uppercase mt-1 tracking-wider ${currentTheme.accentText}`}>
                                                                    {item.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* STYLE 2: MINIMAL DIGITAL CLOCK */}
                                            {displayStyle === "minimal" && (
                                                <div className="text-center py-4">
                                                    <div className="text-2xl sm:text-5xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black font-mono tracking-wider bg-black/20 rounded-2xl py-6 px-2 sm:px-4 border border-white/10 shadow-inner overflow-hidden truncate">
                                                        {formatTwoDigits(timeLeft.days)}:{formatTwoDigits(timeLeft.hours)}:{formatTwoDigits(timeLeft.minutes)}:{formatTwoDigits(timeLeft.seconds)}
                                                    </div>
                                                    {showLabels && (
                                                        <div className={`grid grid-cols-4 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-3 ${currentTheme.accentText}`}>
                                                            <span>Days</span>
                                                            <span>Hours</span>
                                                            <span>Mins</span>
                                                            <span>Secs</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* STYLE 3: COMPACT INLINE */}
                                            {displayStyle === "compact" && (
                                                <div className="text-center py-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                                                    <span className="text-xl sm:text-2xl font-bold font-mono">
                                                        {timeLeft.days}d {formatTwoDigits(timeLeft.hours)}h {formatTwoDigits(timeLeft.minutes)}m {formatTwoDigits(timeLeft.seconds)}s
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: EMBED CODE */}
                        {activeTab === "embed" && (
                            <div className="space-y-4 min-w-0">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700">Responsive iFrame Embed Code</label>
                                        <button
                                            onClick={() => handleCopy(iframeEmbedCode, "iframe")}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                            {copiedIframe ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedIframe ? "Copied Code" : "Copy iFrame"}
                                        </button>
                                    </div>
                                    <pre className="p-3 bg-slate-900 text-indigo-300 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-slate-800">
                                        {iframeEmbedCode}
                                    </pre>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700">Lightweight JS Widget Snippet</label>
                                        <button
                                            onClick={() => handleCopy(htmlWidgetCode, "embed")}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                            {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedEmbed ? "Copied Snippet" : "Copy Widget"}
                                        </button>
                                    </div>
                                    <pre className="p-3 bg-slate-900 text-indigo-300 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-slate-800">
                                        {htmlWidgetCode}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: DIRECT SHARE */}
                        {activeTab === "share" && (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <label className="text-xs font-bold text-slate-700 block">Direct URL to Shareable Timer</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={shareableUrl}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-700 outline-none"
                                        />
                                        <button
                                            onClick={() => handleCopy(shareableUrl, "link")}
                                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                        >
                                            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copiedLink ? "Copied!" : "Copy Link"}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        Anyone opening this URL will see your customized timer with all title and target parameters pre-configured.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span>High-Precision Sub-second Sync</span>
                        <span>Mobile-Responsive Embeds</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD SEO CONTENT */}
            <section className="space-y-6">
                {/* Card 1: Overview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Enterprise-Grade Event Countdown Generator</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            An <strong>Event Countdown Timer</strong> is an essential visual utility for digital marketers, website owners, event planners, and content creators. By generating a ticking real-time visual indicator, you build psychological urgency, boost landing page conversion rates, and keep audiences informed about critical deadlines.
                        </p>
                        <p>
                            Our browser-native generator lets you design fully customizable, mobile-responsive countdown widgets without requiring complex server setups or paid third-party dependencies. Configured timers can be shared via direct link or embedded seamlessly into any HTML website, Notion workspace, WordPress site, or Shopify storefront.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4 my-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Conversion-Focused Urgency
                                </h3>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Leverage the principle of loss aversion. Real-time countdowns clearly indicate limited-time promotional offers, sales deadlines, and product launch drops.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Zero-Latency Client Computation
                                </h3>
                                <p className="text-xs text-slate-600 leading-normal">
                                    All mathematical calculations execute locally within your visitor's web browser, eliminating server roundtrips and ensuring smooth 60fps timer updates.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Core Features & Use Cases */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Primary Applications &amp; Best Practices</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Countdowns serve distinct strategic roles across different digital channels. Integrating a timer effectively requires picking the right format for your audience:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-slate-700">
                            <li><strong>E-Commerce Sales &amp; Flash Promotions:</strong> Display real-time remaining time for Black Friday deals, seasonal discounts, or flash product drops to reduce cart abandonment.</li>
                            <li><strong>Product Launches &amp; Keynotes:</strong> Embed a countdown on splash pages to capture email leads and build excitement leading up to major reveals.</li>
                            <li><strong>Webinars &amp; Live Streams:</strong> Keep attendees informed on live broadcast start times across varying global time zones.</li>
                            <li><strong>Personal Milestones:</strong> Track days remaining until personal holidays, weddings, retirements, or exam dates.</li>
                        </ul>
                    </div>
                </div>

                {/* Card 3: Comparison Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Hourglass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Display Format Comparison Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs sm:text-sm">
                                    <th className="p-3 sm:p-4">Display Style</th>
                                    <th className="p-3 sm:p-4">Best Use Case</th>
                                    <th className="p-3 sm:p-4">Visual Layout</th>
                                    <th className="p-3 sm:p-4">Mobile Adaptability</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Separated Time Cards</td>
                                    <td className="p-3 sm:p-4">Landing page hero sections &amp; sales pages</td>
                                    <td className="p-3 sm:p-4 font-mono text-xs">4 distinct grid boxes</td>
                                    <td className="p-3 sm:p-4 text-emerald-600 font-bold">High (Auto-wrap)</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Minimal Digital Clock</td>
                                    <td className="p-3 sm:p-4">Keynotes, live broadcast overlays &amp; headers</td>
                                    <td className="p-3 sm:p-4 font-mono text-xs">Monospaced digital readouts</td>
                                    <td className="p-3 sm:p-4 text-emerald-600 font-bold">Excellent</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Inline Compact</td>
                                    <td className="p-3 sm:p-4">Top notice banners &amp; sticky site headers</td>
                                    <td className="p-3 sm:p-4 font-mono text-xs">Single line text banner</td>
                                    <td className="p-3 sm:p-4 text-emerald-600 font-bold">Maximum</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 4: FAQ Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions (FAQ)</span>
                    </h2>
                    <div className="space-y-5">
                        {[
                            {
                                q: "How do time zones work in this countdown generator?",
                                a: "The countdown calculates remaining time using absolute ISO timestamp offsets. When embedded, the target date resolves accurately relative to each site visitor's local system time.",
                            },
                            {
                                q: "Can I embed this timer inside WordPress, Shopify, or Notion?",
                                a: "Yes. Simply copy the generated iFrame code or shareable link and paste it directly into HTML blocks, custom code embeds, or Notion iframe widgets.",
                            },
                            {
                                q: "What happens when the timer reaches zero?",
                                a: "Once the countdown hits zero, the time units clear and your custom completion message is displayed automatically.",
                            },
                            {
                                q: "Is this tool free to use for commercial projects?",
                                a: "Yes, TwisterTools provides 100% free web tools with no hidden usage caps, watermarks, or subscription requirements.",
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

            {/* Structured JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Event Countdown Timer Generator",
                        applicationCategory: "UtilityApplication",
                        operatingSystem: "All",
                        description:
                            "Create free custom countdown timers for product launches, events, sales, and holidays with embeddable code.",
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
                                name: "How do time zones work in this countdown generator?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "The countdown calculates remaining time using absolute ISO timestamp offsets relative to each visitor local time.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Can I embed this timer inside WordPress, Shopify, or Notion?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, you can copy the generated iFrame code or shareable link and paste it into any web platform.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}