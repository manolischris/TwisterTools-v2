"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Hash,
    Copy,
    Check,
    Trash2,
    Sparkles,
    Sliders,
    Layers,
    AlertTriangle,
    ShieldAlert,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    FileText,
    Share2,
    Terminal,
    MessageSquare,
    Zap,
    Scale,
    Scissors,
    RefreshCw
} from "lucide-react";

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
);

type PlatformKey = "twitter" | "twitter_blue" | "linkedin" | "instagram" | "facebook" | "threads" | "tiktok" | "youtube";

interface PlatformSpec {
    id: PlatformKey;
    name: string;
    label: string;
    icon: React.ElementType;
    limit: number;
    countUnit: "chars" | "twitter_weighted";
    hookLimit?: number;
    recommendedHashtags: string;
    note: string;
}

const PLATFORM_SPECS: PlatformSpec[] = [
    {
        id: "twitter",
        name: "X (Twitter Standard)",
        label: "X Free Post",
        icon: TwitterIcon,
        limit: 280,
        countUnit: "twitter_weighted",
        hookLimit: 280,
        recommendedHashtags: "1 - 2",
        note: "Weighted: Latin/ASCII = 1 weight, Emojis/CJK = 2 weights, URLs = 23 weights."
    },
    {
        id: "twitter_blue",
        name: "X (Premium / Verified)",
        label: "X Premium Long-form",
        icon: TwitterIcon,
        limit: 25000,
        countUnit: "twitter_weighted",
        hookLimit: 280,
        recommendedHashtags: "1 - 2",
        note: "Truncates at 280 characters in feed with 'Show more' button."
    },
    {
        id: "linkedin",
        name: "LinkedIn Post",
        label: "LinkedIn Feed Post",
        icon: LinkedinIcon,
        limit: 3000,
        countUnit: "chars",
        hookLimit: 210,
        recommendedHashtags: "3 - 5",
        note: "Truncates at ~210 characters (desktop) or ~140 characters (mobile)."
    },
    {
        id: "instagram",
        name: "Instagram Caption",
        label: "IG Feed Caption",
        icon: InstagramIcon,
        limit: 2200,
        countUnit: "chars",
        hookLimit: 125,
        recommendedHashtags: "3 - 5",
        note: "Max 30 hashtags allowed. Feed collapses after ~125 characters."
    },
    {
        id: "threads",
        name: "Meta Threads",
        label: "Threads Post",
        icon: MessageSquare,
        limit: 500,
        countUnit: "chars",
        hookLimit: 500,
        recommendedHashtags: "1 topic tag",
        note: "Direct 500-character ceiling per post thread node."
    },
    {
        id: "facebook",
        name: "Facebook Post",
        label: "Facebook Status",
        icon: FacebookIcon,
        limit: 63206,
        countUnit: "chars",
        hookLimit: 400,
        recommendedHashtags: "0 - 1",
        note: "Desktop cuts off around 400 characters behind 'See More'."
    },
    {
        id: "tiktok",
        name: "TikTok Description",
        label: "TikTok Caption",
        icon: Zap,
        limit: 4000,
        countUnit: "chars",
        hookLimit: 100,
        recommendedHashtags: "3 - 5",
        note: "Mobile interface overlays only 2 lines (~100 chars) before tap."
    },
    {
        id: "youtube",
        name: "YouTube Description",
        label: "YT Video Description",
        icon: YoutubeIcon,
        limit: 5000,
        countUnit: "chars",
        hookLimit: 150,
        recommendedHashtags: "3 tags",
        note: "Above-the-fold snippet is approximately 150 characters on mobile."
    }
];

const SAMPLE_POSTS = {
    xTweet: `Building in public update: We just shipped our multi-platform social character auditor.

Key architectural takeaways:
• Grapheme cluster parsing prevents emoji double-counts
• UTF-8 byte encoders track network payload limits
• Zero external tracker dependencies

Check live: https://twistertools.com/tools/social-tools/social-character-counter

What metrics matter most to you? #buildinpublic #dev`,
    linkedinPost: `Most founders fail at organic reach because they overlook "above-the-fold" truncation.

Here is the brutal truth about the LinkedIn algorithm:
If your reader doesn't click "see more" within the first 210 characters, your distribution halts.

3 operational checks we run before every post:
1. Deliver the curiosity gap before character 180.
2. Structure bulleted insights with single empty lines.
3. Reserve hashtags for the very footer.

What is your current LinkedIn hook strategy?`,
    instagramCaption: `Clean caption aesthetics build premium brand authority.

Here is how high-performing accounts stand out:
- Zero cluttered punctuation walls
- Micro-hooks placed in the first 125 characters
- Strategic hashtag clustering at the bottom

Save this post to audit your captions before hitting publish tonight.

#socialmediamarketing #creatorgrowth #contentstrategy #marketingtips`
};

export default function SocialCharacterCounter() {
    const [rawText, setRawText] = useState<string>(SAMPLE_POSTS.xTweet);
    const [activeTab, setActiveTab] = useState<PlatformKey>("twitter");
    const [copied, setCopied] = useState<boolean>(false);
    const [autoTrimSpaces, setAutoTrimSpaces] = useState<boolean>(false);

    const inputId = useId();

    // Standard character count (Unicode code points)
    const codePointLength = useMemo(() => {
        return Array.from(rawText).length;
    }, [rawText]);

    // UTF-8 Byte calculation
    const byteLength = useMemo(() => {
        if (typeof TextEncoder !== "undefined") {
            return new TextEncoder().encode(rawText).length;
        }
        return rawText ? rawText.length : 0;
    }, [rawText]);

    // Twitter weighted character calculation (simulates twitter-text spec)
    const twitterWeightedLength = useMemo(() => {
        if (!rawText) return 0;
        // Normalize URL weighting: URLs in Twitter are wrapped in t.co (fixed at 23 chars)
        const urlRegex = /https?:\/\/[^\s]+/gi;
        const urls = rawText.match(urlRegex) || [];
        const textWithoutUrls = rawText.replace(urlRegex, "");

        let count = urls.length * 23;
        // Non-URL characters: Latin/ASCII (code point <= 4351) = 1, CJK/Emoji/Complex = 2
        for (const char of Array.from(textWithoutUrls)) {
            const cp = char.codePointAt(0) || 0;
            if (
                (cp >= 0x0000 && cp <= 0x10ff) ||
                (cp >= 0x2000 && cp <= 0x200d) ||
                (cp >= 0x2010 && cp <= 0x201f) ||
                (cp >= 0x2026 && cp <= 0x2026)
            ) {
                count += 1;
            } else {
                count += 2;
            }
        }
        return count;
    }, [rawText]);

    // Word, Line, Hashtag, Mention, and Space Metrics
    const wordCount = useMemo(() => {
        const trimmed = rawText.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }, [rawText]);

    const lineCount = useMemo(() => {
        return rawText ? rawText.split(/\r?\n/).length : 0;
    }, [rawText]);

    const hashtagCount = useMemo(() => {
        const matches = rawText.match(/#[a-zA-Z0-9_\u00c0-\u024e\u1e00-\u1eff]+/g);
        return matches ? matches.length : 0;
    }, [rawText]);

    const mentionCount = useMemo(() => {
        const matches = rawText.match(/@[a-zA-Z0-9_\u00c0-\u024e\u1e00-\u1eff]+/g);
        return matches ? matches.length : 0;
    }, [rawText]);

    const whitespaceCount = useMemo(() => {
        const matches = rawText.match(/\s/g);
        return matches ? matches.length : 0;
    }, [rawText]);

    // Active platform metadata calculation
    const activeSpec = useMemo(() => {
        return PLATFORM_SPECS.find((s) => s.id === activeTab) || PLATFORM_SPECS[0];
    }, [activeTab]);

    const activeCurrentCount = useMemo(() => {
        return activeSpec.countUnit === "twitter_weighted" ? twitterWeightedLength : codePointLength;
    }, [activeSpec, twitterWeightedLength, codePointLength]);

    const remainingChars = activeSpec.limit - activeCurrentCount;
    const isExceeded = remainingChars < 0;
    const usagePercent = Math.min(100, Math.max(0, (activeCurrentCount / activeSpec.limit) * 100));

    // Above-the-fold Hook preview calculation
    const hookSnippet = useMemo(() => {
        if (!activeSpec.hookLimit) return "";
        const flat = rawText.replace(/\r?\n/g, " ");
        if (flat.length <= activeSpec.hookLimit) return flat;
        return flat.substring(0, activeSpec.hookLimit);
    }, [rawText, activeSpec]);

    const isHookTruncated = (activeSpec.hookLimit ?? 0) > 0 && rawText.length > (activeSpec.hookLimit ?? 0);

    const handleCopy = () => {
        if (!rawText) return;
        navigator.clipboard.writeText(rawText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setRawText("");
    };

    const handleTrimSpaces = () => {
        const cleaned = rawText
            .split("\n")
            .map((line) => line.trimEnd())
            .join("\n")
            .replace(/[ \t]{2,}/g, " ");
        setRawText(cleaned);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Social Media Character, Byte, and Hook Counter",
        "url": "https://twistertools.com/tools/social-tools/social-character-counter",
        "description": "Precise character, weighted count, and UTF-8 byte auditor for X (Twitter), LinkedIn, Instagram, Facebook, TikTok, Threads, and YouTube. Audit above-the-fold hooks and prevent post truncation.",
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
                "name": "How does X (Twitter) calculate weighted character limits versus normal character counts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "X does not count characters linearly. Standard ASCII characters and English letters count as 1 character. Most emoji, non-Western scripts (such as Chinese, Japanese, and Korean glyphs), and accented characters consume 2 characters. Furthermore, any HTTP/HTTPS URL is automatically shortened by X and occupies a fixed 23 characters, regardless of its original link length."
                }
            },
            {
                "@type": "Question",
                "name": "Why do UTF-8 bytes differ from visible character counts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Character count measures visible Unicode code points or glyphs, while UTF-8 bytes measure the physical storage allocation required in network payloads and database tables. Standard Latin characters require 1 byte each, while symbols, emojis, and international alphabets consume between 2 and 4 bytes per character."
                }
            },
            {
                "@type": "Question",
                "name": "What is the 'above-the-fold' feed cutoff limit for LinkedIn posts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "On desktop screens, LinkedIn truncates feed updates after approximately 210 characters, inserting a '...see more' expansion prompt. On mobile mobile apps, this truncation can occur as early as 140 to 160 characters. Placing your core hook within the first 140 to 200 characters is vital for click-through engagement."
                }
            },
            {
                "@type": "Question",
                "name": "What are the caption length limits for Instagram and TikTok?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Instagram allows up to 2,200 characters per caption with a strict ceiling of 30 hashtags, truncating in the main feed after 125 characters. TikTok permits up to 4,000 characters in video descriptions, but overlays only the initial 2 lines (roughly 100 characters) on the mobile video viewport before requiring viewer expansion."
                }
            },
            {
                "@type": "Question",
                "name": "Is my drafted copy stored on TwisterTools servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All text parsing, grapheme splitting, Twitter weighting, and byte encoding operations run 100% locally in your web browser via native client-side JavaScript. No text is ever saved, logged, or transmitted across external networks."
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

            {/* 12-Column Responsive Workspace Grid (6 / 6 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Input & Controls (lg:col-span-6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Draft Workspace
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setRawText(SAMPLE_POSTS.xTweet)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                X Post
                            </button>
                            <button
                                type="button"
                                onClick={() => setRawText(SAMPLE_POSTS.linkedinPost)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                LinkedIn
                            </button>
                            <button
                                type="button"
                                onClick={() => setRawText(SAMPLE_POSTS.instagramCaption)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Instagram
                            </button>
                        </div>
                    </div>

                    {/* Textarea Input */}
                    <div className="space-y-2">
                        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Type or paste your post copy:
                        </label>
                        <textarea
                            id={inputId}
                            rows={12}
                            aria-label="Social media post copy input"
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Draft your social post here... Real-time character counts, Twitter weightings, and above-the-fold truncations calculate dynamically."
                            className="w-full p-3.5 sm:p-4 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[240px]"
                        />

                        {/* Quick Utility Action Bar */}
                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={handleTrimSpaces}
                                className="py-2 px-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5 truncate"
                            >
                                <Scissors className="w-3.5 h-3.5 shrink-0" /> Clean Spaces
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="py-2 px-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5 truncate"
                            >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" /> Clear
                            </button>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 truncate ${copied
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                                    }`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                                <span>{copied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Universal Text Diagnostics Grid */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Universal Text Metrics:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                    Characters
                                </span>
                                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {codePointLength}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                    UTF-8 Bytes
                                </span>
                                <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {byteLength}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                    Words
                                </span>
                                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {wordCount}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                    Lines
                                </span>
                                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {lineCount}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                    Hashtags
                                </span>
                                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {hashtagCount}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                    Mentions
                                </span>
                                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {mentionCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Platform Audits & Live Truncation View (lg:col-span-6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    {/* Platform Selector Tabs */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Target Platform Limit
                            </h2>
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {activeSpec.name}
                            </span>
                        </div>

                        {/* Interactive Platform Switcher */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {PLATFORM_SPECS.map((platform) => {
                                const IconComponent = platform.icon;
                                const isCurrent = platform.id === activeTab;
                                const countForThis = platform.countUnit === "twitter_weighted" ? twitterWeightedLength : codePointLength;
                                const over = countForThis > platform.limit;

                                return (
                                    <button
                                        key={platform.id}
                                        type="button"
                                        onClick={() => setActiveTab(platform.id)}
                                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer relative ${isCurrent
                                            ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between w-full mb-1">
                                            <IconComponent className={`w-4 h-4 ${isCurrent ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`} />
                                            {over && (
                                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold block truncate leading-tight">
                                                {platform.label}
                                            </span>
                                            <span className={`text-[10px] font-mono block mt-0.5 ${over ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-600 dark:text-slate-300"}`}>
                                                {countForThis} / {platform.limit}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Active Platform Gauge Card */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                        {activeSpec.countUnit === "twitter_weighted" ? "Twitter Weighted Characters" : "Standard Characters"}
                                    </span>
                                    <div className="flex items-baseline gap-1.5 mt-0.5">
                                        <span className={`text-2xl font-black font-mono ${isExceeded ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                                            {activeCurrentCount}
                                        </span>
                                        <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                                            / {activeSpec.limit} limit
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                        Remaining
                                    </span>
                                    <p className={`text-lg font-black font-mono mt-0.5 ${isExceeded ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                        {remainingChars >= 0 ? `+${remainingChars}` : remainingChars}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Fill Bar */}
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${isExceeded
                                        ? "bg-rose-500"
                                        : usagePercent > 90
                                            ? "bg-amber-500"
                                            : "bg-indigo-600"
                                        }`}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                {activeSpec.note}
                            </p>
                        </div>

                        {/* Above-the-fold Hook Truncation Card */}
                        {activeSpec.hookLimit && (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 bg-white dark:bg-slate-950 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        Feed Truncation Preview (~{activeSpec.hookLimit} chars)
                                    </span>
                                    <span className={`font-mono font-semibold px-2 py-0.5 rounded-full text-[10px] ${isHookTruncated
                                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                        : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                                        }`}>
                                        {isHookTruncated ? "Truncated behind '...more'" : "100% Above-the-fold"}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 break-words select-text">
                                    {hookSnippet || "Type copy on the left to inspect feed cutoff point."}
                                    {isHookTruncated && (
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1 cursor-default select-none">
                                            ...more
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
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

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Architecture & The Twitter Weighting Algorithm */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Mechanics of Character Weighting: Why Generic Counters Fail
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Many content managers draft tweets in basic word processors only to receive an unexpected &ldquo;Character limit exceeded&rdquo; error inside X. Standard string length functions calculate either UTF-16 code units or plain character indexes, ignoring the complex parsing pipeline deployed by modern social graph APIs:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <TwitterIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Twitter Weighted Rule
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Standard ASCII Latin characters count as 1 character. Most non-Latin scripts (CJK, Arabic, Cyrillic), emojis, and complex mathematical symbols carry a weight of 2 characters against the 280-character maximum.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> The Fixed 23-Char URL Rule
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Irrespective of actual string length (whether 12 characters or 180 characters), any valid HTTP/HTTPS web address is wrapped inside the <code className="font-mono text-indigo-600 dark:text-indigo-400">t.co</code> wrapper and consumes exactly 23 characters on X.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> UTF-8 Byte Footprint
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Direct messaging APIs, webhook endpoints, and database backends impose strict payload constraints on UTF-8 bytes rather than characters. A 4-byte emoji can exhaust database column buffers four times faster than plain ASCII text.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Internal Weighting Evaluation Algorithm
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            TwisterTools parses strings dynamically, stripping URLs to attribute fixed wrapper lengths while applying individual Unicode point classification:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`// Step 1: Extract all URLs and assign 23 weight points each
const urlMatches = rawText.match(/https?:\\/\\/[^\\s]+/gi) || [];
let totalTwitterWeight = urlMatches.length * 23;

// Step 2: Traverse remaining string by Unicode Code Points (Grapheme safety)
for (const char of Array.from(textWithoutUrls)) {
  const codePoint = char.codePointAt(0) || 0;
  // Standard ASCII and basic Latin blocks consume 1 weight
  if (codePoint >= 0x0000 && codePoint <= 0x10ff) {
    totalTwitterWeight += 1;
  } else {
    // Emojis, CJK glyphs, and advanced unicode symbols consume 2 weights
    totalTwitterWeight += 2;
  }
}`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Network Limits Comparison Matrix */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Complete Social Media Post Limits Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Refer to this operational specification table when repurposing long-form content into platform-specific social distributions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Platform</th>
                                    <th className="p-3">Absolute Character Limit</th>
                                    <th className="p-3">Feed Hook Cutoff</th>
                                    <th className="p-3">Optimal Hashtags</th>
                                    <th className="p-3">Counting Standard</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">X (Twitter Standard)</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">280</td>
                                    <td className="p-3">280 (No Truncation)</td>
                                    <td className="p-3">1 - 2 Tags</td>
                                    <td className="p-3">Twitter Weighted (URLs = 23)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">X (Twitter Premium)</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">25,000</td>
                                    <td className="p-3 text-amber-600 font-bold">~280 Characters</td>
                                    <td className="p-3">1 - 2 Tags</td>
                                    <td className="p-3">Twitter Weighted</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">LinkedIn Feed Post</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">3,000</td>
                                    <td className="p-3 text-amber-600 font-bold">~140 - 210 Characters</td>
                                    <td className="p-3">3 - 5 Tags</td>
                                    <td className="p-3">Standard Code Points</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Instagram Caption</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">2,200</td>
                                    <td className="p-3 text-amber-600 font-bold">~125 Characters</td>
                                    <td className="p-3">3 - 5 Tags (Max 30)</td>
                                    <td className="p-3">Standard Code Points</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Meta Threads</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">500</td>
                                    <td className="p-3">500 (No Truncation)</td>
                                    <td className="p-3">1 Tag per Thread</td>
                                    <td className="p-3">Standard Code Points</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">TikTok Description</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">4,000</td>
                                    <td className="p-3 text-amber-600 font-bold">~100 Characters (2 Lines)</td>
                                    <td className="p-3">3 - 5 Tags</td>
                                    <td className="p-3">Standard Code Points</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">YouTube Description</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">5,000</td>
                                    <td className="p-3 text-amber-600 font-bold">~150 Characters</td>
                                    <td className="p-3">3 Primary Tags</td>
                                    <td className="p-3">Standard Code Points</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Above-The-Fold Copywriting Principles */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Maximizing Click-Throughs: The 140-Character Hook Strategy
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Algorithm reach across LinkedIn, Instagram, and TikTok is heavily influenced by viewer interaction within the first 3 seconds. The moment a user clicks &ldquo;...see more&rdquo;, the platform registers positive dwell time and engagement interest:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> High-Engagement Hook Architecture
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Open with Incongruity:</strong> State a counter-intuitive industry fact in the initial 80 characters before mobile viewport slicing occurs.
                                </li>
                                <li>
                                    • <strong>Avoid Burying Value:</strong> Never start posts with generic greetings (&ldquo;Hope everyone is having a great Tuesday...&rdquo;). Begin directly with the operational takeaway.
                                </li>
                                <li>
                                    • <strong>Keep Line 1 Under 60 Chars:</strong> Creating an immediate visual line break after sentence 1 pulls the reader&apos;s eye downward into the snippet preview.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Costly Truncation Errors
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>URL Placement in Hooks:</strong> Inserting raw web links in line 1 consumes valuable hook characters and signals external link exit intent to feed algorithms.
                                </li>
                                <li>
                                    • <strong>Frontloading Hashtags:</strong> Placing tags like <code className="font-mono">#marketing</code> at the start wastes the visual preview area. Hashtags belong exclusively in post footers.
                                </li>
                                <li>
                                    • <strong>Ignoring Screen Size Divergence:</strong> What looks complete on a 27-inch desktop monitor will collapse behind a &ldquo;more&rdquo; fold on an iPhone or Android screen.
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
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does X (Twitter) calculate weighted character limits versus normal character counts?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                X does not count characters linearly. Standard ASCII characters and English letters count as 1 character. Most emoji, non-Western scripts (such as Chinese, Japanese, and Korean glyphs), and accented characters consume 2 characters. Furthermore, any HTTP/HTTPS URL is automatically shortened by X and occupies a fixed 23 characters, regardless of its original link length.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why do UTF-8 bytes differ from visible character counts?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Character count measures visible Unicode code points or glyphs, while UTF-8 bytes measure the physical storage allocation required in network payloads and database tables. Standard Latin characters require 1 byte each, while symbols, emojis, and international alphabets consume between 2 and 4 bytes per character.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the &ldquo;above-the-fold&rdquo; feed cutoff limit for LinkedIn posts?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                On desktop screens, LinkedIn truncates feed updates after approximately 210 characters, inserting a &ldquo;...see more&rdquo; expansion prompt. On mobile apps, this truncation can occur as early as 140 to 160 characters. Placing your core hook within the first 140 to 200 characters is vital for click-through engagement.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What are the caption length limits for Instagram and TikTok?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Instagram allows up to 2,200 characters per caption with a strict ceiling of 30 hashtags, truncating in the main feed after 125 characters. TikTok permits up to 4,000 characters in video descriptions, but overlays only the initial 2 lines (roughly 100 characters) on the mobile video viewport before requiring viewer expansion.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Is my drafted copy stored on TwisterTools servers?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. All text parsing, grapheme splitting, Twitter weighting, and byte encoding operations run 100% locally in your web browser via native client-side JavaScript. No text is ever saved, logged, or transmitted across external networks.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}