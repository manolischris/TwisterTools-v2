"use client";

import React, { useState, useMemo, useId, useRef } from "react";
import {
    Type,
    Copy,
    Check,
    Trash2,
    Sparkles,
    Sliders,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Share2,
    Layers,
    Terminal,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    ListOrdered,
    List,
    Heading1,
    Heading2,
    Quote,
    RefreshCw,
    ExternalLink,
    Info,
    MessageSquare,
    ThumbsUp,
    Repeat2,
    Send,
    Grid3X3
} from "lucide-react";

type UnicodeStyleKey =
    | "boldSans"
    | "boldSerif"
    | "italicSans"
    | "italicSerif"
    | "boldItalicSans"
    | "boldItalicSerif"
    | "monospace"
    | "scriptBold"
    | "doubleStruck"
    | "underline"
    | "strikethrough";

// Character mapping conversion engines
const UNICODE_MAPS: Record<UnicodeStyleKey, { label: string; preview: string; description: string; transform: (c: string) => string }> = {
    boldSans: {
        label: "Bold Sans",
        preview: "𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱",
        description: "Modern geometric bold for punchy hooks",
        transform: (c: string) => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d5d4 + (code - 65));
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d5ee + (code - 97));
            if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + (code - 48));
            return c;
        }
    },
    boldSerif: {
        label: "Bold Serif",
        preview: "𝐇𝐞𝐥𝐥𝐨 𝐖𝐨𝐫𝐥𝐝",
        description: "Executive editorial style for formal thought leadership",
        transform: (c: string) => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d400 + (code - 65));
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d41a + (code - 97));
            if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ce + (code - 48));
            return c;
        }
    },
    italicSans: {
        label: "Italic Sans",
        preview: "𝘏𝘦𝘭𝘭𝘰 𝘞𝘰𝘳𝘭𝘥",
        description: "Smooth slanted style for secondary remarks",
        transform: (c: string) => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d608 + (code - 65));
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d622 + (code - 97));
            return c;
        }
    },
    italicSerif: {
        label: "Italic Serif",
        preview: "𝐻𝑒𝑙𝑙𝑜 𝑊𝑜𝑟𝑙𝑑",
        description: "Classic typography for pull quotes and bookish flair",
        transform: (c: string) => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d434 + (code - 65));
            if (code >= 97 && code <= 122) {
                if (c === "h") return "\u210e"; // Planck constant symbol mapping
                return String.fromCodePoint(0x1d44e + (code - 97));
            }
            return c;
        }
    },
    boldItalicSans: {
        label: "Bold Italic Sans",
        preview: "𝙃𝙚𝙡𝙡𝙤 𝙒𝙤𝙧𝙡𝙙",
        description: "High-emphasis slanted bold for viral urgency",
        transform: (c: string) => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d63c + (code - 65));
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d656 + (code - 97));
            return c;
        }
    },
    boldItalicSerif: {
        label: "Bold Italic Serif",
        preview: "𝑯𝒆𝒍𝒍𝒐 𝑾𝒐𝒓𝒍𝒅",
        description: "Dramatic literary emphasis for keynote quotes",
        transform: (c: string) => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d468 + (code - 65));
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d482 + (code - 97));
            return c;
        }
    },
    monospace: {
        label: "Monospace Code",
        preview: "𝙷𝚎𝚕𝚕𝚘 𝚆𝚘𝚛𝚕𝚍",
        description: "Clean terminal mono font for engineering updates",
        transform: (c: string) => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d670 + (code - 65));
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d68a + (code - 97));
            if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7f6 + (code - 48));
            return c;
        }
    },
    scriptBold: {
        label: "Cursive Script",
        preview: "𝓗𝓮𝓵𝓵𝓸 𝓦𝓸𝓻𝓵𝓭",
        description: "Aesthetic calligraphy for milestones and ceremonies",
        transform: (c: string) => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d4d0 + (code - 65));
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d4ea + (code - 97));
            return c;
        }
    },
    doubleStruck: {
        label: "Double-Struck / Blackboard",
        preview: "ℍ𝕖𝕝𝕝𝕠 𝕎𝕠𝕣𝕝𝕕",
        description: "Mathematical blackboard style for distinct headers",
        transform: (c: string) => {
            const code = c.charCodeAt(0);
            const exceptions: Record<string, string> = {
                C: "\u2102",
                H: "\u210D",
                N: "\u2115",
                P: "\u2119",
                Q: "\u211A",
                R: "\u211D",
                Z: "\u2124"
            };
            if (exceptions[c]) return exceptions[c];
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d538 + (code - 65));
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d552 + (code - 97));
            if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7d8 + (code - 48));
            return c;
        }
    },
    underline: {
        label: "Underline",
        preview: "H̲e̲l̲l̲o̲ ̲W̲o̲r̲l̲d̲",
        description: "Appended combining diacritics for underlined text",
        transform: (c: string) => (c === " " || c === "\n" ? c : c + "\u0332")
    },
    strikethrough: {
        label: "Strikethrough",
        preview: "H̶e̶l̶l̶o̶ ̶W̶o̶r̶l̶d̶",
        description: "Appended stroke characters for edits and comparisons",
        transform: (c: string) => (c === " " || c === "\n" ? c : c + "\u0336")
    }
};

const CIRCLED_NUMBERS: string[] = ["⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

const SAMPLE_POSTS = {
    executive: `The biggest career mistake I made in my 20s:

Prioritizing raw output over strategic positioning.

Here is what 12 years of executive leadership taught me:
1. Hard work without visibility is just unpaid labor.
2. The best performers are master communicators first.
3. Your network is your distribution channel.

If you are currently scaling your career, focus on leverage rather than pure endurance.

What is one rule you live by in your industry? Let me know below.

#leadership #careerstrategy #executivegrowth #networking`,
    framework: `How to 10x your client close rate without cold pitching:

Most agencies pitch features when clients buy outcomes.
Here is the 3-step advisory framework we implemented:

✦ Diagnose before prescribing
✦ Map client pain to concrete ROI
✦ Anchor on enterprise risk reduction

Stop sending 20-page slide decks that nobody reads.
Start offering real-time diagnostic clarity.

Save this framework for your next pipeline review.

#b2bmarketing #consulting #salesenablement #businessdevelopment`,
    story: `Yesterday our engineering team hit an unexpected roadblock at 4:30 PM.

A critical deployment broke staging 45 minutes before our board demo.
Instead of finger-pointing, our lead architect did two things:

1. Rolled back the migration snapshot in 180 seconds.
2. Built a fail-safe synthetic circuit breaker.

Great leadership is not about preventing errors entirely.
It is about building antifragile systems that absorb shocks instantly.

Kudos to the entire infrastructure squad for staying calm under pressure.

#softwareengineering #techleadership #systemarchitecture #culture`
};

export default function LinkedInPostFormatter() {
    const [rawText, setRawText] = useState<string>(SAMPLE_POSTS.executive);
    const [autoLineBreaks, setAutoLineBreaks] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);
    const [showFontMatrix, setShowFontMatrix] = useState<boolean>(false);

    const inputId = useId();
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Apply unicode style to selected text inside the textarea
    const applyStyleToSelection = (styleKey: UnicodeStyleKey) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // If no text is selected, style the first non-empty line (usually the hook)
        if (start === end) {
            const lines = rawText.split("\n");
            const firstContentIndex = lines.findIndex((l) => l.trim().length > 0);
            if (firstContentIndex !== -1) {
                const targetLine = lines[firstContentIndex];
                const transformed = Array.from(targetLine).map(UNICODE_MAPS[styleKey].transform).join("");
                lines[firstContentIndex] = transformed;
                setRawText(lines.join("\n"));
            }
            return;
        }

        const selectedText = rawText.substring(start, end);
        const { transform } = UNICODE_MAPS[styleKey];
        if (!transform) return;

        const transformedText = Array.from(selectedText).map(transform).join("");
        const newText = rawText.substring(0, start) + transformedText + rawText.substring(end);
        setRawText(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start, start + transformedText.length);
        }, 0);
    };

    // Quick text prefix modifiers
    const applyPrefixToCurrentLine = (prefix: string | ((idx: number) => string)) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const lines = rawText.split("\n");
        let currentPos = 0;
        let modified = false;

        const newLines = lines.map((line, idx) => {
            const lineStart = currentPos;
            const lineEnd = currentPos + line.length;
            currentPos += line.length + 1;

            if (end >= lineStart && start <= lineEnd) {
                modified = true;
                const p = typeof prefix === "function" ? prefix(idx + 1) : prefix;
                const trimmed = line.replace(/^([•➔✔❖]\s*|\d+\.\s*|>\s*|#+\s*)/, "");
                return `${p} ${trimmed}`;
            }
            return line;
        });

        if (modified) {
            setRawText(newLines.join("\n"));
        }
    };

    const processedText = useMemo(() => {
        if (!rawText) return "";
        let lines = rawText.split(/\r?\n/);
        if (autoLineBreaks) {
            lines = lines.map((line) => line.trimEnd());
        }
        return lines.join("\n");
    }, [rawText, autoLineBreaks]);

    const charCount = processedText.length;
    const wordCount = useMemo(() => {
        const trimmed = processedText.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }, [processedText]);

    const hashtagCount = useMemo(() => {
        const matches = processedText.match(/#[a-zA-Z0-9_\u00c0-\u024e\u1e00-\u1eff]+/g);
        return matches ? matches.length : 0;
    }, [processedText]);

    const seeMoreExcerpt = useMemo(() => {
        const clean = processedText.trim();
        if (!clean) return "Your hook will display here...";
        return clean.length > 210 ? clean.substring(0, 210) + "..." : clean;
    }, [processedText]);

    const isCutoffExceeded = processedText.trim().length > 210;

    const handleCopy = () => {
        if (!processedText) return;
        navigator.clipboard.writeText(processedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setRawText("");
        if (textareaRef.current) textareaRef.current.focus();
    };

    const loadSample = (key: "executive" | "framework" | "story") => {
        setRawText(SAMPLE_POSTS[key]);
    };

    const insertBulletSymbol = (symbol: string) => {
        applyPrefixToCurrentLine(symbol);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "LinkedIn Post Formatter & Bold Unicode Text Stylizer",
        "url": "https://twistertools.com/tools/social-tools/linkedin-post-formatter",
        "description": "Professional LinkedIn text stylizer and post preview optimizer. Apply bold Unicode glyphs, custom bullet points, and verify exact 'see more' fold limits before publishing.",
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
                "name": "How does bold text work on LinkedIn without native formatting tools?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "LinkedIn's post editor does not offer native rich text Markdown controls like bold or italic for standard feed posts. This tool converts standard Latin alphanumeric characters into Mathematical Alphanumeric Symbols from the Universal Unicode Standard (UTF-8). Because LinkedIn supports UTF-8, these mathematical glyphs render natively as bold, italic, or monospace text without external extensions."
                }
            },
            {
                "@type": "Question",
                "name": "Where does the 'see more' cut-off happen on LinkedIn posts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "On desktop feed views, LinkedIn typically cuts off posts between 140 to 210 characters (or around 3 lines of text) before requiring the reader to click '...see more'. On mobile screens, line height and paragraph breaks can truncate the post even sooner. Positioning your primary hook in the first 140 characters guarantees maximum retention."
                }
            },
            {
                "@type": "Question",
                "name": "What is the maximum character limit for LinkedIn posts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "LinkedIn permits up to 3,000 characters per personal profile post and company page update. LinkedIn Articles have a separate limit of roughly 100,000 characters."
                }
            },
            {
                "@type": "Question",
                "name": "Do bold Unicode characters hurt screen readers or accessibility (a11y)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, excessive use can hinder accessibility. Assistive technologies and screen readers read mathematical Unicode characters literally (e.g., 'Mathematical Bold Capital A'). To balance high-converting visual hierarchy with accessibility, use bold stylizers selectively on key headlines, bullet indicators, and callouts rather than entire paragraphs."
                }
            },
            {
                "@type": "Question",
                "name": "Will using Unicode bolding penalize my LinkedIn post reach or algorithm score?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No algorithmic penalty is applied to posts containing standard UTF-8 characters. In fact, well-structured visual hooks that earn clicks on 'see more' directly trigger positive dwell-time signals, which the LinkedIn recommendation algorithm rewards with broader network distribution."
                }
            },
            {
                "@type": "Question",
                "name": "How many hashtags should I include on a LinkedIn post?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Current LinkedIn best practices recommend 3 to 5 targeted hashtags. Overloading posts with 10+ tags clutters mobile presentation and provides no additional algorithmic discovery advantage."
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
                {/* Left Panel: Post Styler, Live Editor & Integrated Font Matrix (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Stylizer Editor
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => loadSample("executive")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Executive
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("framework")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Framework
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("story")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Story
                            </button>
                        </div>
                    </div>

                    {/* Quick Selection Toolbar for High-Converting Typography */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                1. Highlight text & click to style (or styles the hook line):
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowFontMatrix((prev) => !prev)}
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <Grid3X3 className="w-3.5 h-3.5" />
                                {showFontMatrix ? "Hide Matrix" : "View Full Font Matrix"}
                            </button>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 items-center">
                            <button
                                type="button"
                                onClick={() => applyStyleToSelection("boldSans")}
                                title="Bold Sans-Serif (Standard modern bold)"
                                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 shadow-2xs transition cursor-pointer flex items-center gap-1"
                            >
                                <Bold className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>𝗕𝗼𝗹𝗱 𝗦𝗮𝗻𝘀</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => applyStyleToSelection("boldSerif")}
                                title="Bold Serif (Editorial headline style)"
                                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 shadow-2xs transition cursor-pointer"
                            >
                                𝐁𝐨𝐥𝐝 𝐒𝐞𝐫𝐢𝐟
                            </button>

                            <button
                                type="button"
                                onClick={() => applyStyleToSelection("italicSans")}
                                title="Italic Sans"
                                className="px-2.5 py-1.5 text-xs italic rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 shadow-2xs transition cursor-pointer flex items-center gap-1"
                            >
                                <Italic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>𝘐𝘵𝘢𝘭𝘪𝘤</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => applyStyleToSelection("monospace")}
                                title="Monospace / Code Font"
                                className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 shadow-2xs transition cursor-pointer"
                            >
                                𝚖𝚘𝚗𝚘
                            </button>

                            <button
                                type="button"
                                onClick={() => applyStyleToSelection("scriptBold")}
                                title="Script Calligraphy Bold"
                                className="px-2.5 py-1.5 text-xs font-serif rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 shadow-2xs transition cursor-pointer"
                            >
                                𝓒𝓾𝓻𝓼𝓲𝓿𝓮
                            </button>

                            <button
                                type="button"
                                onClick={() => applyStyleToSelection("underline")}
                                title="Underline Unicode Combines"
                                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 shadow-2xs transition cursor-pointer flex items-center gap-1"
                            >
                                <Underline className="w-3.5 h-3.5" />
                                <span>U̲n̲d̲e̲r̲</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => applyStyleToSelection("strikethrough")}
                                title="Strikethrough Combines"
                                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-800 dark:text-slate-200 shadow-2xs transition cursor-pointer flex items-center gap-1"
                            >
                                <Strikethrough className="w-3.5 h-3.5" />
                                <span>S̶t̶r̶i̶k̶e̶</span>
                            </button>
                        </div>
                    </div>

                    {/* Integrated Font Matrix Workspace (Directly Clickable) */}
                    {showFontMatrix && (
                        <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    Unicode Font Matrix & Converter:
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Click any style to apply
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                {(Object.entries(UNICODE_MAPS) as [UnicodeStyleKey, typeof UNICODE_MAPS[UnicodeStyleKey]][]).map(
                                    ([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => applyStyleToSelection(key)}
                                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                    {config.label}
                                                </span>
                                                <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {config.preview}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                {config.description}
                                            </p>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Structure & List Injectors */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                            2. Line & List Formatting Tools:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => insertBulletSymbol("•")}
                                className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span> Bullet List
                            </button>

                            <button
                                type="button"
                                onClick={() => insertBulletSymbol("➔")}
                                className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">➔</span> Arrow Point
                            </button>

                            <button
                                type="button"
                                onClick={() => insertBulletSymbol("✔")}
                                className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✔</span> Checklist
                            </button>

                            <button
                                type="button"
                                onClick={() => applyPrefixToCurrentLine((idx) => CIRCLED_NUMBERS[idx] || `${idx}.`)}
                                className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">①</span> Circled Nums
                            </button>
                        </div>
                    </div>

                    {/* Main Composition Textarea */}
                    <div className="space-y-2">
                        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Compose your LinkedIn post text:
                        </label>
                        <textarea
                            ref={textareaRef}
                            id={inputId}
                            rows={12}
                            aria-label="LinkedIn post composition input"
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Draft your LinkedIn post here... Highlight any word to apply Bold or Italic Unicode transformations."
                            className="w-full p-3.5 sm:p-4 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[220px]"
                        />

                        {/* Text Controls & Cleanups */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={autoLineBreaks}
                                    onChange={(e) => setAutoLineBreaks(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Auto-trim trailing line whitespaces</span>
                            </label>

                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                            >
                                <Trash2 className="w-3 h-3" /> Clear Text
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: LinkedIn Live Preview & Character Counters (Column Span 6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                    Feed Desktop Mockup
                                </h2>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                1:1 Live Simulation
                            </span>
                        </div>

                        {/* LinkedIn Authentic Feed Container */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 overflow-hidden shadow-2xs">
                            {/* Author Row */}
                            <div className="p-4 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800/80">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 p-0.5 shrink-0">
                                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">YOU</span>
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                            Your Professional Profile
                                        </p>
                                        <span className="text-[10px] text-slate-500">• 1st</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                        Founder & Product Architect • Helping founders scale
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        Just now • <span className="font-mono text-[9px]">🌐</span>
                                    </p>
                                </div>
                                <span className="text-slate-400 font-bold text-xs">•••</span>
                            </div>

                            {/* Feed Body Content */}
                            <div className="p-4 space-y-3">
                                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap select-text break-words">
                                    {processedText || "Type your post in the left panel to watch your live preview render here in real-time."}
                                </div>
                            </div>

                            {/* Hook Retention Warning & Fold Bar */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                                <div className="flex items-center justify-between font-medium">
                                    <span className="truncate max-w-[260px]">
                                        <strong>The &quot;...see more&quot; Hook Window:</strong>
                                    </span>
                                    <span
                                        className={`font-mono font-bold ml-2 shrink-0 ${isCutoffExceeded
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-emerald-600 dark:text-emerald-400"
                                            }`}
                                    >
                                        {isCutoffExceeded ? "Truncated Fold (210+ chars)" : "100% Fully Visible"}
                                    </span>
                                </div>
                                <div className="p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 italic font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate">
                                    &ldquo;{seeMoreExcerpt}&rdquo;
                                </div>
                            </div>

                            {/* Mockup Social Action Buttons */}
                            <div className="px-3 py-2 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-around text-slate-500 dark:text-slate-400 text-xs font-semibold">
                                <div className="flex items-center gap-1.5 hover:text-indigo-600 transition py-1 cursor-default">
                                    <ThumbsUp className="w-3.5 h-3.5" /> Like
                                </div>
                                <div className="flex items-center gap-1.5 hover:text-indigo-600 transition py-1 cursor-default">
                                    <MessageSquare className="w-3.5 h-3.5" /> Comment
                                </div>
                                <div className="flex items-center gap-1.5 hover:text-indigo-600 transition py-1 cursor-default">
                                    <Repeat2 className="w-3.5 h-3.5" /> Repost
                                </div>
                                <div className="flex items-center gap-1.5 hover:text-indigo-600 transition py-1 cursor-default">
                                    <Send className="w-3.5 h-3.5" /> Send
                                </div>
                            </div>
                        </div>

                        {/* Real-time Metrics Counters */}
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Characters
                                </span>
                                <p
                                    className={`text-base font-bold font-mono ${charCount > 3000
                                        ? "text-rose-600 dark:text-rose-400"
                                        : "text-slate-900 dark:text-white"
                                        }`}
                                >
                                    {charCount}{" "}
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">
                                        / 3000
                                    </span>
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
                                    Hashtags
                                </span>
                                <p
                                    className={`text-base font-bold font-mono ${hashtagCount > 5
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-indigo-600 dark:text-indigo-400"
                                        }`}
                                >
                                    {hashtagCount}{" "}
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">
                                        / 5 rec.
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Copy To Clipboard Primary CTA */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!processedText}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copied
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5 text-white" />
                                    <span>Copied to Clipboard! Ready for LinkedIn</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-white" />
                                    <span>Copy Formatted Post</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mandatory Independent Platform & Trademark Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Foundation of Unicode Mathematical Formatting */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Science of LinkedIn Typography: How Mathematical Unicode Glyphs Enable Bold Formatting
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Unlike modern CMS platforms or rich text document editors, LinkedIn&apos;s standard post composer explicitly restricts custom font styles, Markdown syntax (<code className="font-mono text-indigo-600 dark:text-indigo-400">**bold**</code>), and HTML styling. To create bold headers and eye-catching hooks, marketers and creators rely on the Universal Character Set (Unicode Standard).
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Plane 1 UTF-8 Code Points
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Standard English letters inhabit the Basic Latin plane (ASCII 0x0041 to 0x007A). Bold text stylizers convert those letters into the Supplementary Multilingual Plane (starting at <code className="font-mono text-indigo-600 dark:text-indigo-400">U+1D400</code> for Mathematical Bold and <code className="font-mono text-indigo-600 dark:text-indigo-400">U+1D5D4</code> for Sans-Serif Bold).
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Native Mobile & Web Rendering
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Because both iOS, Android, and all Chromium/WebKit desktop browsers natively support UTF-8 Mathematical Alphanumerics, your formatted text retains its visual styling inside mobile notifications, desktop feeds, and user profile summaries.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Combining Diacritics
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Underlines and strikethroughs are generated via Combining Low Lines (<code className="font-mono text-indigo-600 dark:text-indigo-400">U+0332</code>) and Combining Long Strokes (<code className="font-mono text-indigo-600 dark:text-indigo-400">U+0336</code>), appending modifier glyphs directly after each letter.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Analysis of Formatting Styles */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Analysis: Unicode Typographic Options for LinkedIn Content
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the correct Unicode style impacts readability, dwell time, and audience perception. Here is how each font style performs across business audiences:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Typographic Style</th>
                                    <th className="p-3">Sample Output</th>
                                    <th className="p-3">Recommended Use Case</th>
                                    <th className="p-3">Accessibility Impact</th>
                                    <th className="p-3">Verdict</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Bold Sans-Serif</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">𝗛𝗼𝗼𝗸 𝗟𝗶𝗻𝗲</td>
                                    <td className="p-3">First 140 chars, primary headings</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Minimal when limited to titles</td>
                                    <td className="p-3 text-emerald-600 font-bold">Top Recommended</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Bold Serif</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">𝐇𝐨𝐨𝐤 𝐋𝐢𝐧𝐞</td>
                                    <td className="p-3">Thought leadership, long-form frameworks</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Minimal for short phrases</td>
                                    <td className="p-3 text-indigo-600 font-bold">Executive Aesthetic</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Monospace</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">𝚌𝚘𝚍𝚎_𝚜𝚗𝚒𝚙𝚙𝚎𝚝</td>
                                    <td className="p-3">Tech updates, metrics, KPI callouts</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Moderate phonetic spacing</td>
                                    <td className="p-3 text-indigo-600">Great for Dev & SaaS</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Script Calligraphy</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">𝓢𝓹𝓮𝓬𝓲𝓪𝓵 𝓐𝓷𝓷𝓸𝓾𝓷𝓬𝓮</td>
                                    <td className="p-3">Creative, branding, awards</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Difficult for assistive readers</td>
                                    <td className="p-3 text-amber-600">Use Sparingly</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Underline & Strike</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">U̲n̲d̲e̲r̲ / S̶t̶r̶i̶k̶e̶</td>
                                    <td className="p-3">Before vs. After contrasts, CTAs</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Renders variable line height</td>
                                    <td className="p-3 text-slate-600">Contextual Value</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5 Data-Backed Rules to Maximize LinkedIn Post Reach */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Strategic Playbook: 5 Optimization Rules for Viral LinkedIn Posts
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Formatting is the visual bridge between your headline and your core message. Implement these five publishing frameworks to increase organic feed visibility:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for Organic Reach
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
                                <li>
                                    • <strong>Protect the 140-Character Fold:</strong> The first 2 to 3 lines determine whether someone scrolls past or clicks &ldquo;see more&rdquo;. Never bury the value proposition after line 3.
                                </li>
                                <li>
                                    • <strong>Apply the 1-2-1 Line Cadence:</strong> Break long blocks into single-sentence hook, 2-sentence elaboration, and single-sentence takeaway. Clean line gaps reduce cognitive fatigue on mobile.
                                </li>
                                <li>
                                    • <strong>Deploy Styled Bullet Indentations:</strong> Replace standard flat dashes with bold circular bullets (<code className="font-mono text-indigo-600">•</code>) or arrow glyphs (<code className="font-mono text-indigo-600">➔</code>) to guide scanning eyes downward.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Algorithmic Pitfalls to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
                                <li>
                                    • <strong>External Links in the Main Body:</strong> LinkedIn throttles impressions on posts that redirect users off-platform. Place external URLs in the comments or your featured profile section instead.
                                </li>
                                <li>
                                    • <strong>Overstyling Entire Body Paragraphs:</strong> Formatting entire paragraphs in Unicode bold can make text look spammy and disrupts screen readers for visually impaired professionals.
                                </li>
                                <li>
                                    • <strong>Hashtag Spamming:</strong> Stick strictly to 3 to 5 targeted niche hashtags. Adding 15+ hashtags flags your submission as engagement bait without expanding discovery.
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
                                How does bold text work on LinkedIn without native formatting tools?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                LinkedIn&apos;s post editor does not offer native rich text Markdown controls like bold or italic for standard feed posts. This tool converts standard Latin alphanumeric characters into Mathematical Alphanumeric Symbols from the Universal Unicode Standard (UTF-8). Because LinkedIn supports UTF-8, these mathematical glyphs render natively as bold, italic, or monospace text without external extensions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Where does the &quot;see more&quot; cut-off happen on LinkedIn posts?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                On desktop feed views, LinkedIn typically cuts off posts between 140 to 210 characters (or around 3 lines of text) before requiring the reader to click &ldquo;...see more&rdquo;. On mobile screens, line height and paragraph breaks can truncate the post even sooner. Positioning your primary hook in the first 140 characters guarantees maximum retention.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the maximum character limit for LinkedIn posts?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                LinkedIn permits up to 3,000 characters per personal profile post and company page update. LinkedIn Articles have a separate limit of roughly 100,000 characters.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Do bold Unicode characters hurt screen readers or accessibility (a11y)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes, excessive use can hinder accessibility. Assistive technologies and screen readers read mathematical Unicode characters literally (e.g., &ldquo;Mathematical Bold Capital A&rdquo;). To balance high-converting visual hierarchy with accessibility, use bold stylizers selectively on key headlines, bullet indicators, and callouts rather than entire paragraphs.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Will using Unicode bolding penalize my LinkedIn post reach or algorithm score?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No algorithmic penalty is applied to posts containing standard UTF-8 characters. In fact, well-structured visual hooks that earn clicks on &ldquo;see more&rdquo; directly trigger positive dwell-time signals, which the LinkedIn recommendation algorithm rewards with broader network distribution.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How many hashtags should I include on a LinkedIn post?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Current LinkedIn best practices recommend 3 to 5 targeted hashtags. Overloading posts with 10+ tags clutters mobile presentation and provides no additional algorithmic discovery advantage.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}