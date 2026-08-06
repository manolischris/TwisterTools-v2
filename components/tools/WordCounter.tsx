"use client";

import React, { useState, useMemo } from "react";
import {
    AlignLeft,
    Copy,
    Check,
    Download,
    Trash2,
    BarChart3,
    Sparkles,
    FileText,
    HelpCircle,
    BookOpen,
    Calculator,
    Zap,
    Layers,
    Clock,
    Mic,
    Hash,
    Type,
    CheckCircle2,
    ShieldCheck,
    Search,
    Share2,
    Cpu,
    FileCheck,
    Globe,
    Gauge,
    Sliders
} from "lucide-react";

interface KeywordFrequency {
    word: string;
    count: number;
    percentage: number;
}

export default function WordCounter() {
    const [text, setText] = useState<string>(
        "TwisterTools provides fast, privacy-focused browser utilities built for developers, writers, and digital marketers. Paste your text here to instantly calculate word counts, character limits, sentence structures, and estimated reading times in real time."
    );

    const [copied, setCopied] = useState<boolean>(false);

    // Reading & Speaking Speed Constants (WPM)
    const READING_WPM = 225;
    const SPEAKING_WPM = 130;

    // Advanced Text Analytics Calculations
    const stats = useMemo(() => {
        const rawText = text;
        const trimmed = rawText.trim();

        // Basic Counts
        const characters = rawText.length;
        const charactersNoSpaces = rawText.replace(/\s+/g, "").length;

        // Words
        const wordsArray = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
        const words = wordsArray.length;

        // Sentences (split on punctuation followed by space or EOF)
        const sentencesArray = trimmed ? trimmed.split(/[.!?]+(?=\s|$)/).filter(s => s.trim().length > 0) : [];
        const sentences = sentencesArray.length;

        // Paragraphs
        const paragraphsArray = trimmed ? trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0) : [];
        const paragraphs = paragraphsArray.length;

        // Lines
        const lines = rawText ? rawText.split(/\r?\n/).length : 0;

        // Averages
        const avgWordLength = words > 0 ? (charactersNoSpaces / words).toFixed(1) : "0.0";
        const avgSentenceLength = sentences > 0 ? (words / sentences).toFixed(1) : "0.0";

        // Syllable Count Approximation (Simple Regex Vowels pipeline)
        const countSyllables = (word: string) => {
            const w = word.toLowerCase().replace(/[^a-z]/g, "");
            if (!w) return 0;
            if (w.length <= 3) return 1;
            const matches = w.replace(/(?:endsWith|es|ed|e)$/, "").match(/[aeiouy]{1,2}/g);
            return matches ? matches.length : 1;
        };

        const totalSyllables = wordsArray.reduce((acc, word) => acc + countSyllables(word), 0);

        // Flesch Reading Ease Formula: 206.835 - (1.015 x ASL) - (84.6 x ASW)
        let fleschScore = 100;
        if (words > 0 && sentences > 0) {
            const asl = words / sentences;
            const asw = totalSyllables / words;
            fleschScore = Math.max(0, Math.min(100, Math.round(206.835 - (1.015 * asl) - (84.6 * asw))));
        }

        const getReadabilityGrade = (score: number) => {
            if (score >= 90) return { label: "Very Easy (5th Grade)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
            if (score >= 80) return { label: "Easy (6th Grade)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
            if (score >= 70) return { label: "Fairly Easy (7th Grade)", color: "text-teal-600 bg-teal-50 border-teal-200" };
            if (score >= 60) return { label: "Standard (8th - 9th Grade)", color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
            if (score >= 50) return { label: "Fairly Difficult (High School)", color: "text-amber-600 bg-amber-50 border-amber-200" };
            if (score >= 30) return { label: "Difficult (College)", color: "text-orange-600 bg-orange-50 border-orange-200" };
            return { label: "Very Confusing (Academic/Graduate)", color: "text-rose-600 bg-rose-50 border-rose-200" };
        };

        const readability = getReadabilityGrade(fleschScore);

        // Estimated Time
        const readingTimeSeconds = Math.ceil((words / READING_WPM) * 60);
        const speakingTimeSeconds = Math.ceil((words / SPEAKING_WPM) * 60);

        const formatTime = (totalSeconds: number) => {
            if (totalSeconds < 60) return `${totalSeconds} sec`;
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
        };

        // Keyword Density / Top Frequency (Exclude common stop words)
        const stopWords = new Set([
            "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
            "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "can't", "cannot",
            "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has",
            "have", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into",
            "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on",
            "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so",
            "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they",
            "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
            "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
        ]);

        const wordCounts: Record<string, number> = {};
        wordsArray.forEach((w) => {
            const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (clean.length > 2 && !stopWords.has(clean)) {
                wordCounts[clean] = (wordCounts[clean] || 0) + 1;
            }
        });

        const sortedKeywords: KeywordFrequency[] = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({
                word,
                count,
                percentage: Number(((count / words) * 100).toFixed(1)),
            }));

        return {
            characters,
            charactersNoSpaces,
            words,
            sentences,
            paragraphs,
            lines,
            avgWordLength,
            avgSentenceLength,
            fleschScore,
            readability,
            readingTimeFormatted: formatTime(readingTimeSeconds),
            speakingTimeFormatted: formatTime(speakingTimeSeconds),
            topKeywords: sortedKeywords,
        };
    }, [text]);

    // Social Media / Platform Constraints Checklist
    const platformLimits = [
        { name: "Twitter / X Post", limit: 280, current: stats.characters },
        { name: "SMS Message", limit: 160, current: stats.characters },
        { name: "Meta Description SEO", limit: 160, current: stats.characters },
        { name: "Google SERP Title", limit: 60, current: stats.characters },
        { name: "LinkedIn Post", limit: 3000, current: stats.characters },
        { name: "Instagram Bio", limit: 150, current: stats.characters },
    ];

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setText("");
    };

    const handleExportTxt = () => {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `word_count_analysis.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Enhanced JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "String Length & Word Count Analyzer",
        "url": "https://twistertools.com/tools/text-tools/word-counter",
        "description": "Enterprise-grade, client-side word count, character limit, reading ease, and keyword density analysis engine.",
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
                "name": "How is the reading time estimated in this tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Reading time is calculated using an industry-standard average reading speed of 225 words per minute (WPM) for adult silent reading. Speaking time is calculated based on 130 WPM for clear vocal delivery."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool store or transmit my text to any cloud servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All text string analysis, tokenization, character counts, readability scoring, and keyword density calculations take place entirely within your web browser using JavaScript V8/Gecko engines. Your input data never leaves your device."
                }
            },
            {
                "@type": "Question",
                "name": "How does character counting handle spaces and line breaks?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The primary character count includes all characters, including spaces, tabs, and line breaks. The tool also provides a dedicated 'Characters (No Spaces)' metric to isolate printable letters, numbers, and symbols."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Flesch Reading Ease Score and how is it calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Flesch Reading Ease Score measures text readability on a scale from 0 to 100 based on sentence length and syllable counts per word. Scores between 60 and 70 indicate plain, easily understood English."
                }
            },
            {
                "@type": "Question",
                "name": "What is considered a stop word in the keyword density filter?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Stop words are high-frequency grammatical words such as 'the', 'is', 'and', and 'in'. The analyzer automatically filters out these common words so you can focus on meaningful topical keywords."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Panel: Text Input & Real-Time Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Interactive Text Editor
                            </h2>
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear Text
                            </button>
                        </div>

                        <div>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Type or paste your text here to analyze words, characters, readability, and platform limits..."
                                rows={14}
                                className="w-full p-4 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y bg-slate-50 min-h-[340px] leading-relaxed font-sans"
                            />
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy Text"}
                        </button>
                        <button
                            onClick={handleExportTxt}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Save .txt
                        </button>
                    </div>
                </div>

                {/* Right Panel: Comprehensive Real-Time Metrics & Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                Real-Time Text Analytics
                            </h2>
                        </div>

                        {/* Primary Big Metric Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">Words</span>
                                <span className="text-2xl font-extrabold text-indigo-900">{stats.words}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Characters</span>
                                <span className="text-2xl font-extrabold text-slate-900">{stats.characters}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Sentences</span>
                                <span className="text-2xl font-extrabold text-slate-900">{stats.sentences}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Paragraphs</span>
                                <span className="text-2xl font-extrabold text-slate-900">{stats.paragraphs}</span>
                            </div>
                        </div>

                        {/* Readability Score Banner */}
                        <div className={`p-3.5 border rounded-xl flex items-center justify-between ${stats.readability.color}`}>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">Readability (Flesch Ease)</span>
                                <span className="text-sm font-bold block">{stats.readability.label}</span>
                            </div>
                            <div className="text-2xl font-black">
                                {stats.fleschScore}<span className="text-xs font-normal opacity-70">/100</span>
                            </div>
                        </div>

                        {/* Secondary Detailed Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-1">
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Type className="w-3.5 h-3.5 text-indigo-600" /> No-Space Chars
                                </span>
                                <span className="text-base font-bold text-slate-800 block">{stats.charactersNoSpaces}</span>
                            </div>
                            <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-1">
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> Reading Time
                                </span>
                                <span className="text-base font-bold text-slate-800 block">{stats.readingTimeFormatted}</span>
                            </div>
                            <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-1">
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Mic className="w-3.5 h-3.5 text-indigo-600" /> Speaking Time
                                </span>
                                <span className="text-base font-bold text-slate-800 block">{stats.speakingTimeFormatted}</span>
                            </div>
                            <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-1">
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Hash className="w-3.5 h-3.5 text-indigo-600" /> Avg Word Length
                                </span>
                                <span className="text-base font-bold text-slate-800 block">{stats.avgWordLength} letters</span>
                            </div>
                            <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-1">
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <AlignLeft className="w-3.5 h-3.5 text-indigo-600" /> Avg Sentence
                                </span>
                                <span className="text-base font-bold text-slate-800 block">{stats.avgSentenceLength} words</span>
                            </div>
                            <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-1">
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Total Lines
                                </span>
                                <span className="text-base font-bold text-slate-800 block">{stats.lines}</span>
                            </div>
                        </div>

                        {/* Top Keywords / Keyword Density Card */}
                        <div className="space-y-2 pt-1">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Top Keywords & Density
                            </h3>
                            {stats.topKeywords.length > 0 ? (
                                <div className="space-y-2">
                                    {stats.topKeywords.map((item) => (
                                        <div key={item.word} className="space-y-1">
                                            <div className="flex justify-between text-xs font-semibold text-slate-700">
                                                <span className="capitalize">{item.word}</span>
                                                <span className="text-slate-500">{item.count}x ({item.percentage}%)</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full"
                                                    style={{ width: `${Math.min(item.percentage * 5, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">Type more text to generate keyword density insights.</p>
                            )}
                        </div>

                        {/* Social & Content Platform Limit Progress Trackers */}
                        <div className="space-y-2 pt-1">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Platform Character Constraints
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {platformLimits.map((platform) => {
                                    const isOver = platform.current > platform.limit;
                                    return (
                                        <div key={platform.name} className="p-2.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                                            <div className="flex justify-between font-semibold">
                                                <span className="text-slate-700">{platform.name}</span>
                                                <span className={isOver ? "text-rose-600 font-bold" : "text-slate-500"}>
                                                    {platform.current} / {platform.limit}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${isOver ? "bg-rose-500" : "bg-emerald-500"}`}
                                                    style={{ width: `${Math.min((platform.current / platform.limit) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Core Mechanics & Architectural Tokenization */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Text Tokenization, Character Encoding & Reading Metrics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Text analysis relies on parsing raw character sequences into structured token metrics. Whether preparing content for published books, web metadata, academic essays, or social media networks, tracking precise word counts and character densities ensures optimal readability and platform compliance.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        TwisterTools utilizes client-side Regular Expression parsing to break input text down into characters, words, sentences, and structural paragraphs without sending sensitive copy across external networks.
                    </p>

                    {/* Algorithmic Deep-Dive Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-600" /> Flesch Reading Ease Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Our real-time engine applies the Flesch Reading Ease index formula:
                            </p>
                            <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-xs text-indigo-900 font-semibold">
                                206.835 - (1.015 × ASL) - (84.6 × ASW)
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Where <strong>ASL</strong> is Average Sentence Length (words/sentences) and <strong>ASW</strong> is Average Syllables per Word (syllables/words). Higher scores indicate copy that is easier to read.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600" /> Keyword Density & Stop-Word Filtering
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Keyword density calculates the frequency percentage of specific terms relative to total word volume. To prevent false positives from grammatical conjunctions, our engine filters out 100+ standard English stop words (e.g., <em>the, and, in, with</em>).
                            </p>
                        </div>
                    </div>

                    {/* Algorithmic Code Container */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Client-Side Metric Evaluation Logic
                        </h3>
                        <p className="text-xs text-slate-300">
                            The core JavaScript tokenization pipeline executed in real-time inside your browser:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>Words Tokenizer:</strong> <code className="text-amber-300">text.trim().split(/\s+/).filter(Boolean)</code></div>
                            <div><strong>Sentence Separator:</strong> <code className="text-amber-300">text.split(/[.!?]+(?=\s|$)/)</code></div>
                            <div><strong>Paragraph Separator:</strong> <code className="text-amber-300">text.split(/\n\s*\n/)</code></div>
                            <div><strong>Estimated Reading Time:</strong> <code className="text-amber-300">Math.ceil((words / 225) * 60)</code></div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Industry Specifications Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Publishing & Social Media Character Limit Guide
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Exceeding platform limits can result in critical information being truncated or post submission failures. Reference the standard thresholds below to optimize copy across search engines and major channels:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Platform / Channel</th>
                                    <th className="p-3">Target Limit</th>
                                    <th className="p-3">Recommended Metric</th>
                                    <th className="p-3">Best Practice Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Google Search Meta Title</td>
                                    <td className="p-3 font-mono text-xs">50–60 Chars</td>
                                    <td className="p-3 text-xs">Pixel width / Characters</td>
                                    <td className="p-3 text-xs">Prevents snippet truncation in SERP results</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-900">Google Meta Description</td>
                                    <td className="p-3 font-mono text-xs text-indigo-700">150–160 Chars</td>
                                    <td className="p-3 text-xs font-medium text-indigo-900">Characters with spaces</td>
                                    <td className="p-3 text-xs font-medium text-indigo-900">Maximizes click-through rates from search results</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Twitter / X Single Post</td>
                                    <td className="p-3 font-mono text-xs">280 Characters</td>
                                    <td className="p-3 text-xs">Total character count</td>
                                    <td className="p-3 text-xs">Hard limit for standard free accounts</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">LinkedIn Post</td>
                                    <td className="p-3 font-mono text-xs">3,000 Characters</td>
                                    <td className="p-3 text-xs">First 210 chars critical</td>
                                    <td className="p-3 text-xs">Drives engagement prior to 'See More' cut-off</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">SMS Text Message</td>
                                    <td className="p-3 font-mono text-xs">160 Characters</td>
                                    <td className="p-3 text-xs">GSM-7 character set</td>
                                    <td className="p-3 text-xs">Prevents splitting into multiple paid carrier segments</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Instagram Bio</td>
                                    <td className="p-3 font-mono text-xs">150 Characters</td>
                                    <td className="p-3 text-xs">Total character count</td>
                                    <td className="p-3 text-xs">Hard limit for account profile header descriptions</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Practical Use Cases & Professional Workflows */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Applications Across Content Creation, SEO & Development
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Different digital professions rely on precise word and character counts for distinct quality control metrics:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Search className="w-4 h-4 text-indigo-600" /> SEO Content Writers
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Monitor keyword density percentages to prevent over-optimization penalties while ensuring articles meet depth targets (e.g., 1,500–2,500 words for pillar guides).
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Mic className="w-4 h-4 text-indigo-600" /> Public Speakers & Podcasters
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Convert speech drafts into accurate presentation timing using our 130 WPM speaking calculator to hit strict slot limits during webinars and live events.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <FileCheck className="w-4 h-4 text-indigo-600" /> Students & Academics
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Ensure research essays, abstracts, and personal statements strictly adhere to strict submission word limits mandated by university application portals.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Workflow Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Optimize Your Text in 4 Simple Steps
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                1
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Paste or Type Your Text</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    Copy copy from your word processor, IDE, or draft and paste it into the left editor workspace.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                2
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Review Real-Time Metrics</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    Instantly inspect total words, character counts (with and without spaces), sentences, and paragraph splits.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                3
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Check Readability & Limits</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    Evaluate the Flesch Reading Ease index and review social media progress bars to avoid character truncation.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                4
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Copy or Export Results</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    Copy the polished text directly back to your clipboard or download it as a plain text file.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is the reading time estimated in this tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Reading time is calculated using an industry-standard average reading speed of 225 words per minute (WPM) for adult silent reading. Speaking time is calculated based on 130 WPM for clear vocal delivery.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool store or transmit my text to any cloud servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All text string analysis, tokenization, character counts, readability scoring, and keyword density calculations take place entirely within your web browser using JavaScript V8/Gecko engines. Your input data never leaves your device.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does character counting handle spaces and line breaks?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The primary character count includes all characters, including spaces, tabs, and line breaks. The tool also provides a dedicated "Characters (No Spaces)" metric to isolate printable letters, numbers, and symbols.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Flesch Reading Ease Score and how is it calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Flesch Reading Ease Score measures text readability on a scale from 0 to 100 based on sentence length and syllable counts per word. Scores between 60 and 70 indicate plain, easily understood English.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is considered a stop word in the keyword density filter?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Stop words are high-frequency grammatical words such as "the", "is", "and", and "in". The analyzer automatically filters out these common words so you can focus on meaningful topical keywords.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}