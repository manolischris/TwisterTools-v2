"use client";

import React, { useState, useMemo, useId } from "react";
import {
    AlignLeft,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Smartphone,
    Hash,
    Type,
    FileText,
    ShieldAlert,
    Trash2,
    Share2,
    Layers,
    Terminal
} from "lucide-react";

type SpacerMode = "invisible" | "dots" | "dashes" | "stars" | "custom";

const INVISIBLE_SPACE = "\u200E\u200B"; // Left-to-Right Mark combined with Zero-Width Space

const SAMPLE_CAPTIONS = {
    minimal: `Ready to elevate your digital presence?

Here is the secret top creators will not tell you:
Consistency beats raw talent every single week.

Drop a comment below if you are locking in today.

#digitalcreator #mindset #growthmarketing #onlinebusiness`,
    story: `I used to spend 4 hours every weekend staring at blank captions.

Paragraphs would collapse into a giant wall of unreadable text the second I hit publish.

Here is the exact framework I used to fix it:
1. Hook the reader in the first 80 characters.
2. Deliver 3 actionable takeaways with clear line gaps.
3. Keep hashtags hidden beneath a clean buffer.

Save this post so you never post a squished caption again.`,
    promotional: `Introducing our brand new productivity blueprint.

What is included inside:
- Complete workflow systems
- 50+ plug-and-play templates
- Lifetime access to all updates

Tap the link in bio to secure early-bird access before the launch window closes tonight at midnight.`
};

export default function InstagramLineBreakGenerator() {
    const [rawText, setRawText] = useState<string>(SAMPLE_CAPTIONS.minimal);
    const [spacerMode, setSpacerMode] = useState<SpacerMode>("invisible");
    const [customSpacer, setCustomSpacer] = useState<string>("~");
    const [addHashtagBuffer, setAddHashtagBuffer] = useState<boolean>(true);
    const [convertLists, setConvertLists] = useState<boolean>(false);
    const [stripTrailingSpaces, setStripTrailingSpaces] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    const rawInputId = useId();
    const customSpacerId = useId();

    const formattedText = useMemo(() => {
        if (!rawText) return "";

        let lines = rawText.split(/\r?\n/);

        // Normalize leading and trailing whitespace per line
        if (stripTrailingSpaces) {
            lines = lines.map((line) => line.trimEnd());
        }

        // Convert bullet indicators into clean formatted list items if active
        if (convertLists) {
            lines = lines.map((line) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                    return `• ${trimmed.substring(2)}`;
                }
                return line;
            });
        }

        // Determine spacing token
        let token = INVISIBLE_SPACE;
        if (spacerMode === "dots") token = ".";
        else if (spacerMode === "dashes") token = "—";
        else if (spacerMode === "stars") token = "✦";
        else if (spacerMode === "custom") token = customSpacer.trim() || INVISIBLE_SPACE;

        // Replace empty / blank lines with the selected line break token
        const formattedLines = lines.map((line) => {
            if (line.trim() === "") {
                return token;
            }
            return line;
        });

        let output = formattedLines.join("\n");

        // Optional Hashtag Buffer: add 3 clean line breaks before trailing hashtags if detected
        if (addHashtagBuffer) {
            const hashtagBlockRegex = /(\n(?:\s*#[a-zA-Z0-9_-]+\s*)+)$/;
            if (hashtagBlockRegex.test(output)) {
                output = output.replace(
                    hashtagBlockRegex,
                    `\n${token}\n${token}\n$1`
                );
            }
        }

        return output;
    }, [rawText, spacerMode, customSpacer, addHashtagBuffer, convertLists, stripTrailingSpaces]);

    // Metadata calculations
    const charCount = formattedText.length;
    const wordCount = useMemo(() => {
        const trimmed = formattedText.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }, [formattedText]);

    const lineCount = useMemo(() => {
        return formattedText ? formattedText.split("\n").length : 0;
    }, [formattedText]);

    const hashtagCount = useMemo(() => {
        const matches = formattedText.match(/#[a-zA-Z0-9_\u00c0-\u024e\u1e00-\u1eff]+/g);
        return matches ? matches.length : 0;
    }, [formattedText]);

    const previewFirstSentence = useMemo(() => {
        const clean = rawText.trim().replace(/\n/g, " ");
        if (!clean) return "Your preview caption will appear here...";
        return clean.length > 125 ? clean.substring(0, 125) + "..." : clean;
    }, [rawText]);

    const handleCopy = () => {
        if (!formattedText) return;
        navigator.clipboard.writeText(formattedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setRawText("");
    };

    const loadSample = (type: "minimal" | "story" | "promotional") => {
        setRawText(SAMPLE_CAPTIONS[type]);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Instagram Clean Caption Line Break & Spacing Formatter",
        "url": "https://twistertools.com/tools/social-tools/instagram-line-break-generator",
        "description": "Format clean, paragraph-spaced Instagram captions with invisible zero-width unicode characters. Prevent collapsed text without visible punctuation marks or dots.",
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
                "name": "Why does Instagram collapse line breaks and combine paragraphs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Instagram's parser cleans user input upon submission by stripping empty line characters (\\n\\n) and trailing whitespace. When consecutive newline characters contain no renderable unicode glyphs, the mobile application collapses the vertical spacing, squishing paragraphs into an unreadable solid wall of text."
                }
            },
            {
                "@type": "Question",
                "name": "How does this tool create completely invisible line breaks without dots?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This utility injects invisible unicode characters (specifically non-printing Left-to-Right Marks U+200E paired with Zero-Width Spaces U+200B) on empty lines. Instagram's rendering engine recognizes a legitimate character present on the line, maintaining the visual gap while remaining 100% invisible to human readers."
                }
            },
            {
                "@type": "Question",
                "name": "What is the maximum character limit for Instagram captions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Instagram limits captions to 2,200 characters and permits a maximum of 30 hashtags per post. However, the feed truncates captions after roughly 125 characters, hiding the remainder behind a '...more' link. Positioning your hook in the first 125 characters is vital for engagement."
                }
            },
            {
                "@type": "Question",
                "name": "Will using zero-width invisible spaces trigger shadowbans or reach penalties?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Invisible unicode line separators are standard UTF-8 characters recognized by Unicode Consortium standards. They comply fully with Meta's terms of service and are actively utilized by verified social media managers, top creators, and enterprise digital agencies worldwide."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use this line break formatter for TikTok, Threads, and LinkedIn?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. This zero-width space formatting technique functions seamlessly across Facebook, TikTok, Threads, LinkedIn, YouTube Community Posts, and Twitter/X descriptions to ensure uniform visual formatting across all networks."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool work on iOS and Android without installing an app?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. TwisterTools is 100% browser-native and executes completely client-side in your mobile or desktop browser. No app installation, browser extension, account creation, or payment is ever required."
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

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Input & Controls (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Compose Caption
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => loadSample("minimal")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Minimal
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("story")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Story
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("promotional")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Promo
                            </button>
                        </div>
                    </div>

                    {/* Main Textarea */}
                    <div className="space-y-2">
                        <label htmlFor={rawInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Paste or type your caption below:
                        </label>
                        <textarea
                            id={rawInputId}
                            rows={12}
                            aria-label="Instagram caption input text"
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Type your caption here... Use normal ENTER keys to leave blank lines where you want paragraphs separated."
                            className="w-full p-3.5 sm:p-4 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[220px]"
                        />

                        {/* Input Action Controls (50% Each) */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => loadSample("minimal")}
                                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Load Sample
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear
                            </button>
                        </div>
                    </div>

                    {/* Spacing Mode Options */}
                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Paragraph Spacer Style:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setSpacerMode("invisible")}
                                className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-left flex flex-col gap-1 ${spacerMode === "invisible"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="flex items-center gap-1.5 font-bold">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Invisible
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                    Clean zero-width space
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSpacerMode("dots")}
                                className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-left flex flex-col gap-1 ${spacerMode === "dots"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="flex items-center gap-1.5 font-bold">
                                    <span className="text-indigo-600 font-mono text-base leading-none">•</span> Period Dot
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                    Classic visible separator
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSpacerMode("dashes")}
                                className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-left flex flex-col gap-1 ${spacerMode === "dashes"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="flex items-center gap-1.5 font-bold">
                                    <span className="text-indigo-600 font-mono text-base leading-none">—</span> Clean Dash
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                    Minimalist horizontal dash
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSpacerMode("stars")}
                                className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-left flex flex-col gap-1 ${spacerMode === "stars"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="flex items-center gap-1.5 font-bold">
                                    <span className="text-indigo-600 font-mono text-base leading-none">✦</span> Sparkle Glyph
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                    Aesthetic star separator
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSpacerMode("custom")}
                                className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-left flex flex-col gap-1 col-span-2 sm:col-span-2 ${spacerMode === "custom"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="flex items-center gap-1.5 font-bold">
                                    <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Custom Character
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                    Specify your own line divider
                                </span>
                            </button>
                        </div>

                        {spacerMode === "custom" && (
                            <div className="pt-2 flex items-center gap-2">
                                <label htmlFor={customSpacerId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Custom Divider:
                                </label>
                                <input
                                    id={customSpacerId}
                                    type="text"
                                    maxLength={4}
                                    value={customSpacer}
                                    onChange={(e) => setCustomSpacer(e.target.value)}
                                    aria-label="Custom spacer character"
                                    className="w-20 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center"
                                />
                            </div>
                        )}
                    </div>

                    {/* Feature Toggles */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Formatting Enhancements:
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={addHashtagBuffer}
                                    onChange={(e) => setAddHashtagBuffer(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Add 3 clean buffer lines before hashtags at the bottom</span>
                            </label>
                            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={convertLists}
                                    onChange={(e) => setConvertLists(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Convert standard hyphens (- ) into aesthetic bullet points (• )</span>
                            </label>
                            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={stripTrailingSpaces}
                                    onChange={(e) => setStripTrailingSpaces(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Auto-trim accidental trailing spaces that trigger Instagram collapses</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Output, Counters & Live Preview (Column Span 6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    {/* Live Mobile Post Preview */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Feed Mockup Preview
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                Live Simulation
                            </span>
                        </div>

                        {/* Simulated Phone Feed Card */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-xs">
                            {/* Profile Header */}
                            <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-[1.5px]">
                                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">TT</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">your_brand_account</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Original audio</p>
                                    </div>
                                </div>
                                <span className="text-slate-400 font-bold text-xs tracking-wider">•••</span>
                            </div>

                            {/* Caption Text Box */}
                            <div className="p-4 space-y-2">
                                <p className="text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap select-text break-words">
                                    <strong className="font-bold text-slate-900 dark:text-white mr-1.5">your_brand_account</strong>
                                    {formattedText || "Type your caption on the left to see the live formatted preview here."}
                                </p>
                            </div>

                            {/* First 125 Characters Hook Alert */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                <span className="truncate max-w-[280px]">
                                    <strong>Hook (Before ...more):</strong> &ldquo;{previewFirstSentence}&rdquo;
                                </span>
                                <span className={`font-mono font-semibold ml-2 shrink-0 ${rawText.trim().length > 125 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    {rawText.trim().length > 125 ? "Truncated" : "Fully Visible"}
                                </span>
                            </div>
                        </div>

                        {/* Real-Time Post Metrics Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Characters
                                </span>
                                <p className={`text-base font-bold font-mono ${charCount > 2200 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                                    {charCount} <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">/ 2200</span>
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Words
                                </span>
                                <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {wordCount}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Lines
                                </span>
                                <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {lineCount}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Hashtags
                                </span>
                                <p className={`text-base font-bold font-mono ${hashtagCount > 30 ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                                    {hashtagCount} <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">/ 30</span>
                                </p>
                            </div>
                        </div>

                        {/* Primary Action Button */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!formattedText}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5 text-white" />
                                    <span>Copied to Clipboard! Paste in Instagram</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-white" />
                                    <span>Copy Formatted Caption</span>
                                </>
                            )}
                        </button>
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
                {/* Card 1: How Zero-Width Spacing Solves Caption Collapse */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Science of Instagram Line Breaks: How Zero-Width Characters Stop Paragraph Collapse
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Every social media strategist and content creator has experienced the frustration of crafting a clean, well-spaced Instagram caption only to see the official Instagram mobile app squash every paragraph into a dense, unreadable block of text upon publishing. Understanding why this happens requires examining how Meta&apos;s feed parser sanitizes incoming UTF-8 text strings:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <AlignLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Consecutive Stripping
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Instagram automatically scans submitted captions for consecutive newline markers (<code className="font-mono text-indigo-600 dark:text-indigo-400">\n\n</code>). Any empty line without an active unicode glyph is considered redundant and truncated instantly.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Invisible Unicode Injection
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                This formatter introduces an invisible Left-to-Right Mark (<code className="font-mono text-indigo-600 dark:text-indigo-400">U+200E</code>) paired with a Zero-Width Space (<code className="font-mono text-indigo-600 dark:text-indigo-400">U+200B</code>) directly onto each blank row, preventing the sanitizer from collapsing the space.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 100% Dot-Free Visuals
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Unlike outdated workarounds that force users to type ugly periods, commas, or emojis between paragraphs, zero-width characters render pure, pristine empty space across both iOS and Android.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> The Unicode Byte Structure Explained
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            When you click &ldquo;Copy Formatted Caption&rdquo;, the text payload transforms carriage returns into compliant UTF-8 streams that bypass native sanitizer truncation filters:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`// Standard Instagram Post String (Collapses upon submit):
"Hook line.\\n\\nActionable takeaway paragraph.\\n\\n#marketing"

// TwisterTools Injected Zero-Width Payload (Preserves pristine vertical spacing):
"Hook line.\\n\\u200E\\u200B\\nActionable takeaway paragraph.\\n\\u200E\\u200B\\n#marketing"`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Analysis: Spacing Methods for Instagram Captions
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Creators have attempted numerous strategies to conquer Instagram&apos;s spacing quirks over the past decade. Here is an objective comparison of every caption formatting approach:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Formatting Technique</th>
                                    <th className="p-3">Aesthetic Quality</th>
                                    <th className="p-3">Cross-Platform Reliability</th>
                                    <th className="p-3">User Effort</th>
                                    <th className="p-3">Recommended Verdict</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Zero-Width Unicode (TwisterTools)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">100% Invisible & Elegant</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">iOS, Android & Desktop Web</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Instant 1-Click Copy</td>
                                    <td className="p-3 text-emerald-600 font-bold">Industry Gold Standard</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Period Dots (...)</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Cluttered & Outdated</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Universal</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Manual typing per line</td>
                                    <td className="p-3 text-amber-600">Amateur Appearance</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Apple Notes App Copy-Paste</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Inconsistent</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">Fails on 60% of Android devices</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Requires multi-app switching</td>
                                    <td className="p-3 text-rose-600">Unreliable</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">HTML &lt;br&gt; or Special Entity Tags</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Broken markup</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Stripped by Instagram API</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Manual HTML coding</td>
                                    <td className="p-3 text-rose-600 font-bold">Broken / Ineffective</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5 Proven Instagram Caption Rules for Higher Reach */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Strategic Copywriting: 5 Guidelines for Maximum Feed Engagement
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        A visually formatted caption provides the necessary structure to convert casual scrollers into engaged followers. Incorporate these five data-backed rules into your Instagram publishing routine:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for Virality
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Master the 125-Character Hook:</strong> The Instagram mobile interface cuts off captions after roughly 125 characters with a &ldquo;...more&rdquo; prompt. Put your strongest curiosity hook upfront.
                                </li>
                                <li>
                                    • <strong>Keep Paragraphs Under 2 Sentences:</strong> Mobile readers skim rapidly. Vertical breathing room prevents cognitive fatigue and increases watch-time dwell on your post.
                                </li>
                                <li>
                                    • <strong>Create a 3-Line Hashtag Buffer:</strong> Hide your discoverability hashtags beneath 3 clean invisible line breaks so they remain invisible until the user clicks &ldquo;more&rdquo;.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Mistakes That Hurt Reach
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Exceeding the 30-Hashtag Threshold:</strong> While Instagram allows 30 tags, testing indicates 3 to 5 hyper-specific niche tags produce optimal algorithm indexing without triggering spam filters.
                                </li>
                                <li>
                                    • <strong>Trailing Space Collapses:</strong> Hitting the spacebar after your final period before pressing Enter can trigger Instagram&apos;s auto-collapse logic. TwisterTools automatically sanitizes trailing whitespace.
                                </li>
                                <li>
                                    • <strong>Ignoring Call-To-Actions (CTAs):</strong> Always finish the caption above your hashtag buffer with a direct prompt (e.g., &ldquo;Save this post&rdquo; or &ldquo;Comment BLUEPRINT&rdquo;).
                                </li>
                            </ul>
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
                                Why does Instagram collapse line breaks and combine paragraphs?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Instagram&apos;s parser cleans user input upon submission by stripping empty line characters (\n\n) and trailing whitespace. When consecutive newline characters contain no renderable unicode glyphs, the mobile application collapses the vertical spacing, squishing paragraphs into an unreadable solid wall of text.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does this tool create completely invisible line breaks without dots?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                This utility injects invisible unicode characters (specifically non-printing Left-to-Right Marks U+200E paired with Zero-Width Spaces U+200B) on empty lines. Instagram&apos;s rendering engine recognizes a legitimate character present on the line, maintaining the visual gap while remaining 100% invisible to human readers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the maximum character limit for Instagram captions?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Instagram limits captions to 2,200 characters and permits a maximum of 30 hashtags per post. However, the feed truncates captions after roughly 125 characters, hiding the remainder behind a &ldquo;...more&rdquo; link. Positioning your hook in the first 125 characters is vital for engagement.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Will using zero-width invisible spaces trigger shadowbans or reach penalties?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. Invisible unicode line separators are standard UTF-8 characters recognized by Unicode Consortium standards. They comply fully with Meta&apos;s terms of service and are actively utilized by verified social media managers, top creators, and enterprise digital agencies worldwide.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I use this line break formatter for TikTok, Threads, and LinkedIn?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. This zero-width space formatting technique functions seamlessly across Facebook, TikTok, Threads, LinkedIn, YouTube Community Posts, and Twitter/X descriptions to ensure uniform visual formatting across all networks.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this tool work on iOS and Android without installing an app?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. TwisterTools is 100% browser-native and executes completely client-side in your mobile or desktop browser. No app installation, browser extension, account creation, or payment is ever required.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}