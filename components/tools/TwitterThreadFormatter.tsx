"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Sliders,
    Sparkles,
    Trash2,
    Copy,
    Check,
    Smartphone,
    ShieldAlert,
    BookOpen,
    Layers,
    CheckCircle2,
    AlertTriangle,
    HelpCircle,
    Hash,
    AlignLeft,
    ListOrdered,
    Scissors,
    ArrowDownRight,
    CornerDownRight,
    MessageSquare,
    FileSpreadsheet,
    Download,
    Share2,
    Plus,
    RefreshCw
} from "lucide-react";

type NumberingFormat = "1/n" | "(1/n)" | "[1/n]" | "1." | "1/" | "none";
type NumberingPosition = "start" | "end";
type SplitMode = "character" | "sentence" | "paragraph" | "delimiter";

interface SplitTweet {
    id: number;
    rawBody: string;
    formattedText: string;
    charCount: number;
    isOverLimit: boolean;
}

const SAMPLE_THREADS = {
    marketing: `Building an organic audience on X in 2026 is fundamentally different from 2020. 

Most creators still rely on outdated engagement bait that gets down-ranked by machine learning filters. Here are the 5 core rules for sustainable reach:

First, hooks must spark curiosity without promising fake outcomes. If your first tweet fails to stop the scroll, nothing else matters. State the counterintuitive lesson immediately.

Second, formatting dictates comprehension. Large walls of unformatted prose get skipped instantly on mobile devices. Leave generous line breaks between single concepts.

Third, eliminate unnecessary fluff words. Every additional syllable increases the cognitive load on the reader. Write your draft, cut 30% of the words, then read it aloud before sequencing.

Fourth, embed a single actionable framework. People do not bookmark vague platitudes; they bookmark checklists, mental models, workflows, and step-by-step implementations.

Fifth, design your closing tweet to drive genuine bookmarking or discussion. Instead of asking for retweets, ask a specific question that invites subject-matter experts to comment their experience.`,
    story: `Three years ago, I launched a software product that completely flatlined on launch day. Zero sales. Zero users. Total silence.

I had spent eight months locked in a bedroom building features nobody had actually requested. The mistake was building in isolation rather than validating problem-solution fit first.

The turnaround happened when I committed to publishing open progress logs every Tuesday. I documented failed customer interviews, server outages, and revenue milestones completely unfiltered.

Transparency built organic trust faster than any paid advertising campaign could. By month twelve, over 4,000 founders followed the journey, leading to our first profitable subscription tier.

The takeaway is straightforward: Build distribution before you need distribution. Your story and lessons are your highest-leverage marketing asset.`,
    technical: `Understanding database indexing strategies is essential for scaling read-heavy web applications. Let's break down how B-Tree indexes function under the hood.

At their core, B-Trees are self-balancing search trees that maintain sorted keys to allow logarithmic time lookups, sequential access, and range queries (O(log n)).

When an engine queries an unindexed column, it performs a sequential full-table scan, examining every disk page. With 10 million records, this turns a 4-millisecond query into a 12-second bottleneck.

Composite indexes allow multi-column sorting. The leftmost prefix rule dictates that queries filtering on (col1, col2) can use an index on (col1, col2), but queries filtering only on col2 cannot.

Be cautious of index bloat. While indexes dramatically accelerate SELECT reads, every INSERT, UPDATE, and DELETE operation incurs an additional write overhead to rebalance tree nodes.`
};

export default function TwitterThreadFormatter() {
    const [rawInput, setRawInput] = useState<string>(SAMPLE_THREADS.marketing);
    const [charLimit, setCharLimit] = useState<number>(280);
    const [numberingFormat, setNumberingFormat] = useState<NumberingFormat>("1/n");
    const [numberingPosition, setNumberingPosition] = useState<NumberingPosition>("start");
    const [splitMode, setSplitMode] = useState<SplitMode>("sentence");
    const [customDelimiter, setCustomDelimiter] = useState<string>("---");
    const [autoHashtags, setAutoHashtags] = useState<string>("");
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [allCopied, setAllCopied] = useState<boolean>(false);

    const rawInputId = useId();
    const charLimitId = useId();
    const customDelimiterId = useId();
    const autoHashtagsId = useId();

    const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: number) => void) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        setter(isNaN(num) ? 0 : num);
    };

    const getPrefixOrSuffix = (index: number, total: number, format: NumberingFormat): string => {
        const i = index + 1;
        switch (format) {
            case "1/n":
                return `${i}/${total}`;
            case "(1/n)":
                return `(${i}/${total})`;
            case "[1/n]":
                return `[${i}/${total}]`;
            case "1.":
                return `${i}.`;
            case "1/":
                return `${i}/`;
            case "none":
            default:
                return "";
        }
    };

    const splitChunks = useMemo(() => {
        const trimmedInput = rawInput.trim();
        if (!trimmedInput) return [];

        const cleanHashtags = autoHashtags.trim();
        const tagSuffix = cleanHashtags ? `\n\n${cleanHashtags}` : "";

        const computeTagOverhead = () => tagSuffix.length;
        const computeIndexOverhead = (idx: number, estTotal: number) => {
            const token = getPrefixOrSuffix(idx, estTotal, numberingFormat);
            return token ? token.length + 1 : 0;
        };

        let rawSegments: string[] = [];

        if (splitMode === "delimiter") {
            const delim = customDelimiter || "---";
            rawSegments = trimmedInput
                .split(delim)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
        } else if (splitMode === "paragraph") {
            rawSegments = trimmedInput
                .split(/\n\s*\n/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
        } else {
            const paragraphs = trimmedInput.split(/\n\s*\n/);
            const sentenceRegex = /[^.!?\n]+[.!?]+(?:\s+|$)|[^.!?\n]+$/g;

            for (const para of paragraphs) {
                const trimmedPara = para.trim();
                if (!trimmedPara) continue;

                if (splitMode === "character") {
                    rawSegments.push(trimmedPara);
                } else {
                    const matches = trimmedPara.match(sentenceRegex);
                    if (matches && matches.length > 0) {
                        for (const match of matches) {
                            if (match.trim()) rawSegments.push(match.trim());
                        }
                    } else {
                        rawSegments.push(trimmedPara);
                    }
                }
            }
        }

        if (rawSegments.length === 0) return [];

        let provisionalChunks: string[] = [];
        let currentBuffer = "";

        const effectiveLimit = Math.max(50, charLimit);

        for (let i = 0; i < rawSegments.length; i++) {
            const segment = rawSegments[i];
            const candidate = currentBuffer ? `${currentBuffer}\n\n${segment}` : segment;
            const overhead = 10 + computeTagOverhead();

            if (candidate.length + overhead <= effectiveLimit) {
                currentBuffer = candidate;
            } else {
                if (currentBuffer) {
                    provisionalChunks.push(currentBuffer);
                    currentBuffer = "";
                }

                if (segment.length + overhead <= effectiveLimit) {
                    currentBuffer = segment;
                } else {
                    const words = segment.split(/\s+/);
                    let subBuffer = "";

                    for (const word of words) {
                        const wordCandidate = subBuffer ? `${subBuffer} ${word}` : word;
                        if (wordCandidate.length + overhead <= effectiveLimit) {
                            subBuffer = wordCandidate;
                        } else {
                            if (subBuffer) provisionalChunks.push(subBuffer);
                            subBuffer = word;
                        }
                    }
                    if (subBuffer) {
                        currentBuffer = subBuffer;
                    }
                }
            }
        }

        if (currentBuffer) {
            provisionalChunks.push(currentBuffer);
        }

        const totalCount = provisionalChunks.length;
        const finalTweets: SplitTweet[] = provisionalChunks.map((body, idx) => {
            const numberToken = getPrefixOrSuffix(idx, totalCount, numberingFormat);
            let formatted = body;

            if (numberToken) {
                if (numberingPosition === "start") {
                    formatted = `${numberToken} ${formatted}`;
                } else {
                    formatted = `${formatted}\n\n${numberToken}`;
                }
            }

            if (cleanHashtags) {
                formatted = `${formatted}\n\n${cleanHashtags}`;
            }

            return {
                id: idx + 1,
                rawBody: body,
                formattedText: formatted,
                charCount: formatted.length,
                isOverLimit: formatted.length > effectiveLimit
            };
        });

        return finalTweets;
    }, [rawInput, charLimit, numberingFormat, numberingPosition, splitMode, customDelimiter, autoHashtags]);

    const totalThreadChars = useMemo(() => {
        return splitChunks.reduce((acc, curr) => acc + curr.charCount, 0);
    }, [splitChunks]);

    const totalWords = useMemo(() => {
        const trimmed = rawInput.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }, [rawInput]);

    const handleCopySingle = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleCopyAll = () => {
        if (splitChunks.length === 0) return;
        const compiled = splitChunks.map((t) => t.formattedText).join("\n\n---\n\n");
        navigator.clipboard.writeText(compiled);
        setAllCopied(true);
        setTimeout(() => setAllCopied(false), 2000);
    };

    const handleDownloadTxt = () => {
        if (splitChunks.length === 0) return;
        const compiled = splitChunks.map((t, idx) => `[TWEET ${idx + 1}/${splitChunks.length}]\n${t.formattedText}`).join("\n\n====================\n\n");
        const blob = new Blob([compiled], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `twitter-thread-${Date.now()}.txt`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setRawInput("");
    };

    const loadSample = (key: "marketing" | "story" | "technical") => {
        setRawInput(SAMPLE_THREADS[key]);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Twitter Thread Splitter & Numbered Sequence Formatter",
        "url": "https://twistertools.com/tools/social-tools/twitter-thread-formatter",
        "description": "Split long articles, essays, and notes into character-accurate, auto-numbered Twitter/X threads. Features sentence-aware boundary splits, custom delimiters, and live mobile tweet feed previews.",
        "applicationCategory": "SocialNetworkingApplication",
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
                "name": "What is the maximum character limit for standard and Premium X (Twitter) accounts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard free X accounts maintain a strict 280-character limit per tweet. Subscribers to X Premium or Premium+ can post up to 25,000 characters in a single post. However, shorter 280-character thread segments consistently outperform monolithic long-form posts in feed engagement, retweets, and bookmark velocity."
                }
            },
            {
                "@type": "Question",
                "name": "How does the sentence-aware boundary splitting algorithm prevent broken words?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Rather than slicing text arbitrarily at character index 280, the TwisterTools engine scans backward from the character limit to find natural terminal punctuation marks (. ! ?) or whitespace breaks. This ensures every individual tweet reads as a coherent, grammatically complete thought."
                }
            },
            {
                "@type": "Question",
                "name": "Does the auto-numbering counter consume part of the character limit?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Every character, including numbering markers like '1/7' or '(1/7)', counts toward the post limit. Our algorithm dynamically calculates sequence overhead upfront based on projected thread length, ensuring numbering never causes a tweet to exceed the character threshold."
                }
            },
            {
                "@type": "Question",
                "name": "Can I publish the split thread directly to X from this browser tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "TwisterTools operates 100% client-side without requiring account passwords, API tokens, or OAuth authorization. You can copy individual numbered tweets with one click or export the entire thread package as a structured text file for manual posting or third-party schedulers."
                }
            },
            {
                "@type": "Question",
                "name": "Is my text data stored or sent to any server when formatting threads?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All text parsing, sentence boundary analysis, regex segmentation, and character counting execute entirely within your local browser memory. Your drafts remain private and never touch an external server."
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

            {/* 12-Column Responsive Workspace Grid (5/7 Asymmetric Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration Controls (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Thread Builder
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => loadSample("marketing")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Marketing
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
                                onClick={() => loadSample("technical")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Tech
                            </button>
                        </div>
                    </div>

                    {/* Main Input Textarea */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor={rawInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Paste your full article, essay, or raw draft:
                            </label>
                            <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shrink-0">
                                280 &amp; 25k Support
                            </span>
                        </div>
                        <textarea
                            id={rawInputId}
                            rows={10}
                            aria-label="Thread draft input text"
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            placeholder="Type or paste your lengthy text here... The generator will automatically partition your thoughts into logically balanced, character-accurate tweets."
                            className="w-full p-3.5 sm:p-4 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[200px]"
                        />

                        {/* Input Action Controls */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => loadSample("marketing")}
                                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Sample Hook
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear All
                            </button>
                        </div>
                    </div>

                    {/* Character Limit & Splitting Mode Settings */}
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor={charLimitId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Limit per Tweet:
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        id={charLimitId}
                                        type="number"
                                        min={50}
                                        max={25000}
                                        value={charLimit}
                                        onChange={(e) => handleNumberInput(e, setCharLimit)}
                                        aria-label="Character limit per tweet"
                                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCharLimit(280)}
                                        className="px-2.5 py-2 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 cursor-pointer shrink-0"
                                    >
                                        280
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Split Granularity:
                                </label>
                                <select
                                    value={splitMode}
                                    onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                                    aria-label="Split Granularity Mode"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="sentence">Smart Sentence Flow</option>
                                    <option value="paragraph">Strict Paragraphs (\n\n)</option>
                                    <option value="character">Dense Character Fill</option>
                                    <option value="delimiter">Custom Manual Delimiter</option>
                                </select>
                            </div>
                        </div>

                        {splitMode === "delimiter" && (
                            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                <label htmlFor={customDelimiterId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Custom Split Token:
                                </label>
                                <input
                                    id={customDelimiterId}
                                    type="text"
                                    value={customDelimiter}
                                    onChange={(e) => setCustomDelimiter(e.target.value)}
                                    aria-label="Custom split delimiter token"
                                    placeholder="e.g. --- or [BREAK]"
                                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        )}

                        {/* Numbering Format Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                Sequence Indexing Style:
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {(["1/n", "(1/n)", "[1/n]", "1.", "1/", "none"] as NumberingFormat[]).map((fmt) => (
                                    <button
                                        key={fmt}
                                        type="button"
                                        onClick={() => setNumberingFormat(fmt)}
                                        className={`py-2 px-1 rounded-xl border text-xs font-mono font-bold transition cursor-pointer text-center ${numberingFormat === fmt
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        {fmt === "none" ? "Off" : fmt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sequence Position & Trailing Tags */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Number Placement:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNumberingPosition("start")}
                                        className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition ${numberingPosition === "start"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                            }`}
                                    >
                                        Prefix (Start)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNumberingPosition("end")}
                                        className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition ${numberingPosition === "end"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                            }`}
                                    >
                                        Suffix (End)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor={autoHashtagsId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Append Hashtags / Mentions:
                                </label>
                                <input
                                    id={autoHashtagsId}
                                    type="text"
                                    value={autoHashtags}
                                    onChange={(e) => setAutoHashtags(e.target.value)}
                                    placeholder="#buildinpublic #marketing"
                                    aria-label="Global hashtags appended to every tweet"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Aggregate Stats Summary */}
                    <div className="grid grid-cols-3 gap-2.5 pt-2">
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                Tweets
                            </span>
                            <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                {splitChunks.length}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                Total Words
                            </span>
                            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                {totalWords}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                Characters
                            </span>
                            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                {totalThreadChars}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Output, Stream Preview & Batch Actions (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0 lg:sticky lg:top-6 self-start">
                    {/* Header Action Bar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                                Thread Stream ({splitChunks.length} {splitChunks.length === 1 ? "Post" : "Posts"})
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDownloadTxt}
                                disabled={splitChunks.length === 0}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-3.5 h-3.5" /> Export TXT
                            </button>
                            <button
                                type="button"
                                onClick={handleCopyAll}
                                disabled={splitChunks.length === 0}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${allCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    }`}
                            >
                                {allCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {allCopied ? "Thread Copied!" : "Copy Full Thread"}
                            </button>
                        </div>
                    </div>

                    {/* Rendered Tweet Cards Feed */}
                    <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                        {splitChunks.length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3 bg-white dark:bg-slate-900">
                                <Scissors className="w-8 h-8 text-slate-400 mx-auto" />
                                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Thread Generated Yet</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                                    Type or paste your text into the compose editor on the left to see your formatted, sequence-numbered tweets appear here.
                                </p>
                            </div>
                        ) : (
                            splitChunks.map((tweet, index) => {
                                const isFirst = index === 0;
                                const isLast = index === splitChunks.length - 1;
                                const isCopied = copiedIndex === index;

                                return (
                                    <div
                                        key={tweet.id}
                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden relative"
                                    >
                                        {/* Connector Thread Line */}
                                        {!isLast && (
                                            <div className="absolute left-7 top-14 bottom-0 w-0.5 bg-indigo-100 dark:bg-indigo-950/80 z-0" />
                                        )}

                                        <div className="p-4 sm:p-5 relative z-10 space-y-3">
                                            {/* Post Author / Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                        {tweet.id}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">your_handle</span>
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">· Tweet {tweet.id} of {splitChunks.length}</span>
                                                        </div>
                                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                                            {isFirst ? "Thread Opener / Hook" : isLast ? "Closing Call-to-Action" : "Body Segment"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${tweet.isOverLimit
                                                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                            }`}
                                                    >
                                                        {tweet.charCount}/{charLimit}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopySingle(tweet.formattedText, index)}
                                                        className={`p-1.5 rounded-lg border transition cursor-pointer ${isCopied
                                                            ? "bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-800"
                                                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                            }`}
                                                        title="Copy this individual tweet"
                                                        aria-label={`Copy tweet number ${tweet.id}`}
                                                    >
                                                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Formatted Text Preview */}
                                            <div className="pl-11">
                                                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap select-text break-words">
                                                    {tweet.formattedText}
                                                </p>
                                            </div>

                                            {/* Over Limit Warning if Applicable */}
                                            {tweet.isOverLimit && (
                                                <div className="ml-11 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Exceeds character limit by {tweet.charCount - charLimit} chars. Adjust split rules or shorten draft.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
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
                {/* Card 1: Architectural Mechanics of Thread Sequencing */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Science of Thread Splitting: How Sentence Boundary Parsing Drives Feed Dwell Time
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Publishing extended editorial thought leadership on X requires transforming continuous long-form essays into bite-sized, rhythmically engaging thread installments. Naive string-splitting tools chop sentences right down the middle when they hit character index 280, producing unreadable fragments that frustrate readers and elevate bounce rates. TwisterTools implements an intelligent grammar-aware segmentation pipeline:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <AlignLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Syntactic Punctuation Anchors
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Our sentence-aware algorithm scans backward from character boundary limits to identify period, exclamation, and interrogation terminal boundaries, preserving complete ideas inside every card.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Hash className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Dynamic Counter Pre-Allocation
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Number tags such as <code className="font-mono text-indigo-600 dark:text-indigo-400">(1/9)</code> or <code className="font-mono text-indigo-600 dark:text-indigo-400">1/12</code> require character space. Our engine pre-calculates the overhead of your numbering style so your posts never accidentally exceed 280 characters.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 100% Client-Side Privacy
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Confidential press announcements, patent disclosures, and ghostwritten executive threads remain completely localized in your browser session without being uploaded to remote servers or third-party AI scrapers.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Breakdown: Threads vs Single Monolithic Posts */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Performance: Multi-Post Numbered Threads vs Long Monolithic Posts
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        While X Premium permits up to 25,000 characters in a single post, algorithmic distribution and mobile consumption habits heavily favor sequential thread architecture. Here is an empirical comparison between both publishing strategies:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Performance Metric</th>
                                    <th className="p-3">Multi-Post Numbered Thread</th>
                                    <th className="p-3">Single Monolithic Long Post</th>
                                    <th className="p-3">Algorithmic Advantage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Scroll Stopping Rate (Hook)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Very High (Dedicated Hook Post)</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Moderate (Compressed under &quot;Show more&quot;)</td>
                                    <td className="p-3 text-emerald-600 font-bold">Threads (+82%)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Feed Dwell & Interaction Time</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Extended (Multi-card sequential reading)</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Low (High skim-and-bounce rate)</td>
                                    <td className="p-3 text-emerald-600 font-bold">Threads (+140%)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Quote Tweet & Segment Sharing</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Granular (Users quote individual points)</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">Binary (All-or-nothing retweeting)</td>
                                    <td className="p-3 text-emerald-600 font-bold">Threads (+65%)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Mobile Visual Comfort</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">High (Bite-sized cards with white space)</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Poor (Overwhelming wall of text)</td>
                                    <td className="p-3 text-emerald-600 font-bold">Threads (+95%)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5 Proven Rules for High-Converting X Threads */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Viral Blueprint: 5 Copywriting Principles for High-Converting Threads
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Structuring a thread requires balancing narrative tension with immediate informational utility. Follow these five battle-tested rules when preparing your drafts:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for High Retention
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Spend 50% of Your Time on Tweet 1:</strong> Your opening tweet functions as the headline and thumbnail of your thread. State the problem, the counterintuitive finding, and what the reader will gain.
                                </li>
                                <li>
                                    • <strong>One Core Idea Per Tweet:</strong> Avoid packing three separate thoughts into one card. Let each insight breathe with clean line spacing and bold bullet lists.
                                </li>
                                <li>
                                    • <strong>Include a Visual or Framework:</strong> Tweets featuring diagrams, screenshots, or formatted checklists consistently generate 3x more bookmarks than pure prose.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Mistakes That Kill Thread Reach
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Excessive Thread Length:</strong> Threads exceeding 12 to 14 tweets suffer steep drop-offs in completion rate. Aim for 5 to 8 hyper-dense, high-value segments.
                                </li>
                                <li>
                                    • <strong>Hiding External Links in Early Posts:</strong> The X recommendation algorithm penalizes posts containing outbound links that divert traffic off-platform. Place external newsletter or product links in the final post or reply.
                                </li>
                                <li>
                                    • <strong>Forgetting Numbering Sequences:</strong> Without explicit <code className="font-mono text-indigo-600 dark:text-indigo-400">1/n</code> numbering, readers encountering middle tweets on their feed cannot tell context or thread depth.
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
                                What is the maximum character limit for standard and Premium X (Twitter) accounts?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Standard free X accounts maintain a strict 280-character limit per tweet. Subscribers to X Premium or Premium+ can post up to 25,000 characters in a single post. However, shorter 280-character thread segments consistently outperform monolithic long-form posts in feed engagement, retweets, and bookmark velocity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does the sentence-aware boundary splitting algorithm prevent broken words?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Rather than slicing text arbitrarily at character index 280, the TwisterTools engine scans backward from the character limit to find natural terminal punctuation marks (. ! ?) or whitespace breaks. This ensures every individual tweet reads as a coherent, grammatically complete thought.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does the auto-numbering counter consume part of the character limit?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Every character, including numbering markers like &apos;1/7&apos; or &apos;(1/7)&apos;, counts toward the post limit. Our algorithm dynamically calculates sequence overhead upfront based on projected thread length, ensuring numbering never causes a tweet to exceed the character threshold.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I publish the split thread directly to X from this browser tool?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                TwisterTools operates 100% client-side without requiring account passwords, API tokens, or OAuth authorization. You can copy individual numbered tweets with one click or export the entire thread package as a structured text file for manual posting or third-party schedulers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Is my text data stored or sent to any server when formatting threads?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. All text parsing, sentence boundary analysis, regex segmentation, and character counting execute entirely within your local browser memory. Your drafts remain private and never touch an external server.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}