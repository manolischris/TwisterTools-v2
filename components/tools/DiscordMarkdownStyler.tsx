"use client";

import React, { useState, useMemo, useId, useRef } from "react";
import {
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Trash2,
    Layers,
    Terminal,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Eye,
    Palette,
    FileCode,
    MessageSquare,
    Hash
} from "lucide-react";

type AnsiFgColor =
    | "none"
    | "gray"
    | "red"
    | "green"
    | "yellow"
    | "blue"
    | "magenta"
    | "cyan"
    | "white";

type AnsiBgColor =
    | "none"
    | "firefly-dark-blue"
    | "orange"
    | "marble-blue"
    | "gray-turquoise"
    | "gray"
    | "indigo"
    | "light-gray"
    | "white";

interface AnsiStyleOption {
    label: string;
    code: string;
    cssClass: string;
}

const ANSI_FG_MAP: Record<AnsiFgColor, AnsiStyleOption> = {
    none: { label: "Default", code: "0", cssClass: "text-[#dcddde]" },
    gray: { label: "Dark Gray", code: "30", cssClass: "text-[#4f545c]" },
    red: { label: "Red", code: "31", cssClass: "text-[#f04747]" },
    green: { label: "Green", code: "32", cssClass: "text-[#43b581]" },
    yellow: { label: "Gold / Yellow", code: "33", cssClass: "text-[#faa61a]" },
    blue: { label: "Discord Blue", code: "34", cssClass: "text-[#5865f2]" },
    magenta: { label: "Pink / Magenta", code: "35", cssClass: "text-[#eb459e]" },
    cyan: { label: "Cyan / Teal", code: "36", cssClass: "text-[#00b0f4]" },
    white: { label: "Pure White", code: "37", cssClass: "text-[#ffffff]" }
};

const ANSI_BG_MAP: Record<AnsiBgColor, AnsiStyleOption> = {
    none: { label: "No Background", code: "0", cssClass: "bg-transparent" },
    "firefly-dark-blue": { label: "Dark Blue", code: "40", cssClass: "bg-[#202225] px-1.5 py-0.5 rounded" },
    orange: { label: "Rust Orange", code: "41", cssClass: "bg-[#ba3f1d] px-1.5 py-0.5 rounded text-white" },
    "marble-blue": { label: "Slate Blue", code: "42", cssClass: "bg-[#3e4451] px-1.5 py-0.5 rounded" },
    "gray-turquoise": { label: "Grayish Teal", code: "43", cssClass: "bg-[#4f545c] px-1.5 py-0.5 rounded" },
    gray: { label: "Silver Gray", code: "44", cssClass: "bg-[#72767d] px-1.5 py-0.5 rounded text-slate-900" },
    indigo: { label: "Indigo Blurple", code: "45", cssClass: "bg-[#5865f2] px-1.5 py-0.5 rounded text-white" },
    "light-gray": { label: "Light Gray", code: "46", cssClass: "bg-[#b9bbbe] px-1.5 py-0.5 rounded text-slate-900" },
    white: { label: "Pure White", code: "47", cssClass: "bg-[#ffffff] px-1.5 py-0.5 rounded text-slate-900" }
};

const SAMPLE_PRESETS = {
    rules: `**Server Guidelines & Rules**
__Please read thoroughly before chatting__

1. Be respectful to all members and staff.
2. No spam, self-promotion, or unsolicited DMs.
3. Keep bot commands inside <#bot-playground>.

*Violations will result in a temporary mute or ban.*`,
    announcement: `[1;33m[ANNOUNCEMENT][0m
[0;36mMaintenance update scheduled for 22:00 UTC.[0m
[0;32mExpected downtime: under 15 minutes.[0m

Please finish all active quests prior to the restart!`,
    patchNotes: `### Version 2.4.0 Release Notes

- **Fix:** Resolved crash during voice channel reconnect.
- *Improvement:* Enhanced message cache indexing speeds.
- ~~Legacy audio driver support has been deprecated.~~

> Report any fresh anomalies in the bug tracker.`
};

export default function DiscordMarkdownStyler() {
    const [rawText, setRawText] = useState<string>(SAMPLE_PRESETS.announcement);
    const [activeTab, setActiveTab] = useState<"standard" | "ansi">("ansi");
    const [ansiBold, setAnsiBold] = useState<boolean>(true);
    const [ansiUnderline, setAnsiUnderline] = useState<boolean>(false);
    const [ansiFg, setAnsiFg] = useState<AnsiFgColor>("yellow");
    const [ansiBg, setAnsiBg] = useState<AnsiBgColor>("none");
    const [copied, setCopied] = useState<boolean>(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputId = useId();
    const ansiFgSelectId = useId();
    const ansiBgSelectId = useId();

    const insertMarkdownWrapper = (prefix: string, suffix: string = prefix) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const previousValue = textarea.value;
        const selectedText = previousValue.substring(start, end) || "text";

        const nextText =
            previousValue.substring(0, start) +
            prefix +
            selectedText +
            suffix +
            previousValue.substring(end);

        setRawText(nextText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + prefix.length,
                start + prefix.length + selectedText.length
            );
        }, 0);
    };

    const applyAnsiFormatting = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const previousValue = textarea.value;
        const selectedText = previousValue.substring(start, end) || "Colored Text";

        const codes: string[] = [];
        if (ansiBold) codes.push("1");
        if (ansiUnderline) codes.push("4");

        if (ansiFg !== "none") {
            codes.push(ANSI_FG_MAP[ansiFg].code);
        }
        if (ansiBg !== "none") {
            codes.push(ANSI_BG_MAP[ansiBg].code);
        }

        const formatCode = codes.length > 0 ? codes.join(";") : "0";
        const ansiSequence = `\u001b[${formatCode}m${selectedText}\u001b[0m`;

        const nextText =
            previousValue.substring(0, start) +
            ansiSequence +
            previousValue.substring(end);

        setRawText(nextText);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + ansiSequence.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const wrapInAnsiCodeblock = () => {
        const trimmed = rawText.trim();
        if (trimmed.startsWith("```ansi") && trimmed.endsWith("```")) return;
        setRawText(`\`\`\`ansi\n${rawText}\n\`\`\``);
    };

    const clearAll = () => {
        setRawText("");
    };

    const handleCopy = () => {
        if (!rawText) return;
        navigator.clipboard.writeText(rawText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Parse ANSI codes to simulated React spans for the dark preview
    const renderedAnsiPreview = useMemo(() => {
        const text = rawText;
        // Escape sequence regex: \u001b[...m
        const regex = /\u001b\[([0-9;]*)m/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        interface ActiveStyle {
            fgClass: string;
            bgClass: string;
            bold: boolean;
            underline: boolean;
        }

        let currentStyle: ActiveStyle = {
            fgClass: "text-[#dcddde]",
            bgClass: "bg-transparent",
            bold: false,
            underline: false
        };

        const elements: React.ReactNode[] = [];
        let key = 0;

        while ((match = regex.exec(text)) !== null) {
            const rawChunk = text.substring(lastIndex, match.index);
            if (rawChunk) {
                elements.push(
                    <span
                        key={key++}
                        className={`${currentStyle.fgClass} ${currentStyle.bgClass} ${currentStyle.bold ? "font-bold" : "font-normal"
                            } ${currentStyle.underline ? "underline" : ""}`}
                    >
                        {rawChunk}
                    </span>
                );
            }

            const codeStr = match[1];
            if (!codeStr || codeStr === "0") {
                currentStyle = {
                    fgClass: "text-[#dcddde]",
                    bgClass: "bg-transparent",
                    bold: false,
                    underline: false
                };
            } else {
                const subCodes = codeStr.split(";");
                for (const c of subCodes) {
                    if (c === "0") {
                        currentStyle = {
                            fgClass: "text-[#dcddde]",
                            bgClass: "bg-transparent",
                            bold: false,
                            underline: false
                        };
                    } else if (c === "1") {
                        currentStyle.bold = true;
                    } else if (c === "4") {
                        currentStyle.underline = true;
                    } else if (parseInt(c, 10) >= 30 && parseInt(c, 10) <= 37) {
                        const foundFg = Object.entries(ANSI_FG_MAP).find(
                            ([, v]) => v.code === c
                        );
                        if (foundFg) currentStyle.fgClass = foundFg[1].cssClass;
                    } else if (parseInt(c, 10) >= 40 && parseInt(c, 10) <= 47) {
                        const foundBg = Object.entries(ANSI_BG_MAP).find(
                            ([, v]) => v.code === c
                        );
                        if (foundBg) currentStyle.bgClass = foundBg[1].cssClass;
                    }
                }
            }
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            elements.push(
                <span
                    key={key++}
                    className={`${currentStyle.fgClass} ${currentStyle.bgClass} ${currentStyle.bold ? "font-bold" : "font-normal"
                        } ${currentStyle.underline ? "underline" : ""}`}
                >
                    {text.substring(lastIndex)}
                </span>
            );
        }

        return elements;
    }, [rawText]);

    const charCount = rawText.length;
    const isOverLimit = charCount > 2000;
    const isNitroTier = charCount > 2000 && charCount <= 4000;

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Discord Markdown & Colored Text Formatter",
        "url": "https://twistertools.com/tools/social-tools/discord-markdown-styler",
        "description": "Generate colored ANSI Discord messages, bold headers, spoilers, and codeblocks with live preview and 1-click clipboard export.",
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
                "name": "How does Discord render colored text?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Discord supports colored text exclusively inside ANSI syntax-highlighted codeblocks (```ansi). By applying ANSI escape codes (\\u001b[...m), you can style foreground text and background boxes in 8 distinct hues."
                }
            },
            {
                "@type": "Question",
                "name": "Why are ANSI colors not displaying on mobile devices?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Discord desktop and web clients render ANSI color sequences completely. Some older mobile client versions display ANSI code blocks as raw escape markers or plain monospace text. Most recent iOS and Android Discord builds support standard ANSI colors."
                }
            },
            {
                "@type": "Question",
                "name": "What is the message character limit for Discord?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard Discord accounts have a 2,000 character limit per message. Discord Nitro subscribers receive an expanded 4,000 character limit per message."
                }
            },
            {
                "@type": "Question",
                "name": "How do you create spoiler tags in Discord?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Wrap your message or text segments with double vertical bars, like ||hidden text||. Discord will mask the content until a user clicks or taps to reveal it."
                }
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Toolbar & Editor (lg:col-span-6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setActiveTab("ansi")}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === "ansi"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                            >
                                <Palette className="w-3.5 h-3.5" /> ANSI Colorizer
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("standard")}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === "standard"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                            >
                                <FileCode className="w-3.5 h-3.5" /> Standard Markdown
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setRawText(SAMPLE_PRESETS.announcement)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Preset 1
                            </button>
                            <button
                                type="button"
                                onClick={() => setRawText(SAMPLE_PRESETS.rules)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Preset 2
                            </button>
                        </div>
                    </div>

                    {/* ANSI Formatting Controls */}
                    {activeTab === "ansi" ? (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label
                                        htmlFor={ansiFgSelectId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                                    >
                                        Text Color (Foreground)
                                    </label>
                                    <select
                                        id={ansiFgSelectId}
                                        aria-label="ANSI Foreground Color"
                                        value={ansiFg}
                                        onChange={(e) => setAnsiFg(e.target.value as AnsiFgColor)}
                                        className="w-full text-xs font-semibold rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {Object.entries(ANSI_FG_MAP).map(([key, opt]) => (
                                            <option key={key} value={key}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor={ansiBgSelectId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                                    >
                                        Background Color
                                    </label>
                                    <select
                                        id={ansiBgSelectId}
                                        aria-label="ANSI Background Color"
                                        value={ansiBg}
                                        onChange={(e) => setAnsiBg(e.target.value as AnsiBgColor)}
                                        className="w-full text-xs font-semibold rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {Object.entries(ANSI_BG_MAP).map(([key, opt]) => (
                                            <option key={key} value={key}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={ansiBold}
                                            onChange={(e) => setAnsiBold(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                        />
                                        Bold (1)
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={ansiUnderline}
                                            onChange={(e) => setAnsiUnderline(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                        />
                                        Underline (4)
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={applyAnsiFormatting}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" /> Apply Color to Selection
                                    </button>
                                    <button
                                        type="button"
                                        onClick={wrapInAnsiCodeblock}
                                        className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                                        title="Wrap in ```ansi codeblock"
                                    >
                                        Wrap ```ansi
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Standard Markdown Quick Toolbar */
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => insertMarkdownWrapper("**")}
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Bold (**text**)"
                                aria-label="Insert Bold text"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdownWrapper("*")}
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Italic (*text*)"
                                aria-label="Insert Italic text"
                            >
                                <Italic className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdownWrapper("__")}
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Underline (__text__)"
                                aria-label="Insert Underline text"
                            >
                                <Underline className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdownWrapper("~~")}
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Strikethrough (~~text~~)"
                                aria-label="Insert Strikethrough text"
                            >
                                <Strikethrough className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdownWrapper("||")}
                                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Spoiler (||text||)"
                            >
                                ||Spoiler||
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdownWrapper("`")}
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Inline Code (`text`)"
                                aria-label="Insert inline code"
                            >
                                <Code className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdownWrapper("```\n", "\n```")}
                                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Multiline Code Block"
                            >
                                ```Block```
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdownWrapper("# ")}
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Header (# Text)"
                                aria-label="Insert Header"
                            >
                                <Hash className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertMarkdownWrapper("> ")}
                                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Quote Block (> Text)"
                            >
                                &gt; Quote
                            </button>
                        </div>
                    )}

                    {/* Main Input Textarea */}
                    <div className="space-y-2">
                        <label
                            htmlFor={inputId}
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                        >
                            Raw Discord Input & Escape Characters:
                        </label>
                        <textarea
                            id={inputId}
                            ref={textareaRef}
                            rows={10}
                            aria-label="Discord message markdown editor"
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Type or paste your message. Highlight text and click 'Apply Color to Selection' or Markdown tags above."
                            className="w-full p-4 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[220px]"
                        />
                    </div>

                    {/* Editor Action Triggers */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setRawText(SAMPLE_PRESETS.patchNotes)}
                            className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Load Release Notes
                        </button>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Clear Content
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output & Live Discord UI Simulation (lg:col-span-6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Discord Dark UI Simulation
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#313338] text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                                #announcements
                            </span>
                        </div>

                        {/* Discord Dark Theme Chat Window */}
                        <div className="rounded-2xl bg-[#313338] p-4 text-[#dcddde] font-sans border border-[#232428] shadow-inner space-y-3">
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center font-bold text-white shrink-0 select-none text-sm">
                                    BOT
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white">System Announcer</span>
                                        <span className="text-[10px] bg-[#5865f2] text-white px-1.5 py-0.5 rounded font-bold uppercase">
                                            APP
                                        </span>
                                        <span className="text-xs text-slate-400">Today at 12:00</span>
                                    </div>

                                    {/* Rendered Discord Body with ANSI support */}
                                    <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words bg-[#2b2d31] p-3.5 rounded-xl border border-[#1e1f22]">
                                        {renderedAnsiPreview.length > 0 ? (
                                            renderedAnsiPreview
                                        ) : (
                                            <span className="text-slate-500 italic">
                                                Your Discord formatted output will preview here...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Character Counter Limits & Validation */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                    Standard Tier
                                </span>
                                <p
                                    className={`text-base font-bold font-mono ${isOverLimit ? "text-rose-600" : "text-slate-900 dark:text-white"
                                        }`}
                                >
                                    {charCount}{" "}
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">
                                        / 2000
                                    </span>
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                    Nitro Tier
                                </span>
                                <p
                                    className={`text-base font-bold font-mono ${charCount > 4000 ? "text-rose-600" : "text-indigo-600 dark:text-indigo-400"
                                        }`}
                                >
                                    {charCount}{" "}
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">
                                        / 4000
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Threshold Warning Banner */}
                        {isOverLimit && !isNitroTier && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>
                                    Exceeds 2,000 characters. Requires Discord Nitro subscription to publish as a single message.
                                </span>
                            </div>
                        )}

                        {/* Copy To Clipboard Action */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!rawText}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copied
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5 text-white" />
                                    <span>Copied to Clipboard! Paste into Discord</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-white" />
                                    <span>Copy Formatted Discord Code</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mandatory Platform Trademark Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
                </p>
            </div>

            {/* BELOW-THE-FOLD DETAILED SEO CONTENT SECTIONS */}
            <div className="space-y-6">
                {/* Section 1: Deep ANSI Syntax Breakdown */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Mastering Discord ANSI Escape Sequences for Colored Text
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Standard Discord messages only accept basic markdown formatting such as bolding and italics. However, Discord incorporates ANSI control sequences natively inside codeblocks tagged with <code className="font-mono text-indigo-600 dark:text-indigo-400">```ansi</code>. Understanding the underlying byte mechanics allows server administrators, bot developers, and community managers to generate high-contrast announcement banners:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> The Escape Byte
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Every color sequence starts with the non-printing Escape character (<code className="font-mono text-indigo-600 dark:text-indigo-400">\u001b</code> or ASCII 27), followed immediately by an opening bracket <code className="font-mono text-indigo-600 dark:text-indigo-400">[</code>.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Compound SGR Codes
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Attributes like bolding (<code className="font-mono">1</code>), underline (<code className="font-mono">4</code>), foreground color (<code className="font-mono">30-37</code>), and background color (<code className="font-mono">40-47</code>) are separated by semicolons.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> The Mandatory Reset
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Applying <code className="font-mono text-indigo-600 dark:text-indigo-400">\u001b[0m</code> at the end of formatted blocks restores standard Discord gray, preventing colors from bleeding into subsequent lines.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 2: Complete ANSI Color Code Reference Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Discord ANSI Color Reference Matrix
                        </h2>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Color Name</th>
                                    <th className="p-3">Foreground Code</th>
                                    <th className="p-3">Background Code</th>
                                    <th className="p-3">Hex Representation</th>
                                    <th className="p-3">Optimal Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Dark Gray</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[30m</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[40m</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">#4f545c</td>
                                    <td className="p-3">Subdued timestamps & subtle notes</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-[#f04747]">Red</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[31m</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[41m</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">#f04747</td>
                                    <td className="p-3">Critical alerts, rule strikes, bans</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-[#43b581]">Green</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[32m</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[42m</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">#43b581</td>
                                    <td className="p-3">System online notices, verified roles</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-[#faa61a]">Yellow / Gold</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[33m</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[43m</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">#faa61a</td>
                                    <td className="p-3">Scheduled maintenance & warnings</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-[#5865f2]">Blurple / Blue</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[34m</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[44m</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">#5865f2</td>
                                    <td className="p-3">Primary event headlines & server links</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-[#eb459e]">Pink / Magenta</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[35m</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[45m</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">#eb459e</td>
                                    <td className="p-3">Giveaway highlights & booster alerts</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-[#00b0f4]">Cyan / Teal</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[36m</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[46m</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">#00b0f4</td>
                                    <td className="p-3">Release changelogs & API statistics</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Section 3: Discord Markdown Cheat Sheet */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Standard Discord Markdown Reference Cheat Sheet
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Beyond colored ANSI codeblocks, Discord supports standard CommonMark formatting features. Combine these markers to construct clear channel layouts:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2.5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                Inline Formatting Elements
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Bold Text:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400">**bold text**</code>
                                </li>
                                <li>
                                    • <strong>Italics:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400">*italic text*</code> or <code className="font-mono text-indigo-600 dark:text-indigo-400">_italic text_</code>
                                </li>
                                <li>
                                    • <strong>Underline:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400">__underlined text__</code>
                                </li>
                                <li>
                                    • <strong>Strikethrough:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400">~~strikethrough text~~</code>
                                </li>
                                <li>
                                    • <strong>Spoiler Tag:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400">||hidden spoiler||</code>
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2.5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                Structural & Block Level Elements
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Headers:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400"># Big Header</code>, <code className="font-mono text-indigo-600 dark:text-indigo-400">## Medium</code>, <code className="font-mono text-indigo-600 dark:text-indigo-400">### Subheader</code>
                                </li>
                                <li>
                                    • <strong>Quote Blocks:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400">&gt; Single line quote</code> or <code className="font-mono text-indigo-600 dark:text-indigo-400">&gt;&gt;&gt; Multiline quote</code>
                                </li>
                                <li>
                                    • <strong>Inline Code:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400">`code sample`</code>
                                </li>
                                <li>
                                    • <strong>Code Block:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400">```js ... ```</code>
                                </li>
                                <li>
                                    • <strong>Masked Links:</strong> <code className="font-mono text-indigo-600 dark:text-indigo-400">[TwisterTools](https://twistertools.com)</code>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 4: Static FAQ Cards */}
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
                                How does Discord render colored text?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Discord supports colored text exclusively inside ANSI syntax-highlighted codeblocks (```ansi). By applying ANSI escape codes (\u001b[...m), you can style foreground text and background boxes in 8 distinct hues.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why are ANSI colors not displaying on mobile devices?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Discord desktop and web clients render ANSI color sequences completely. Some older mobile client versions display ANSI code blocks as raw escape markers or plain monospace text. Most recent iOS and Android Discord builds support standard ANSI colors.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the message character limit for Discord?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Standard Discord accounts have a 2,000 character limit per message. Discord Nitro subscribers receive an expanded 4,000 character limit per message.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do you create spoiler tags in Discord?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Wrap your message or text segments with double vertical bars, like ||hidden text||. Discord will mask the content until a user clicks or taps to reveal it.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </>
);
}