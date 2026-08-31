"use client";

import React, { useState, useMemo } from "react";
import {
    BookOpen,
    Copy,
    CheckCircle2,
    Trash2,
    Sparkles,
    BarChart3,
    FileText,
    Check,
    HelpCircle,
    Info,
    Layers,
    Compass,
    GraduationCap,
    Gauge,
    AlertCircle,
    Eye,
    TrendingUp,
    Clock,
    Hash,
    AlignLeft
} from "lucide-react";

interface ReadabilityScores {
    fleschReadingEase: number;
    fleschKincaidGrade: number;
    gunningFog: number;
    colemanLiau: number;
    smogIndex: number;
    automatedReadabilityIndex: number;
}

interface TextStatistics {
    characterCount: number;
    characterCountNoSpaces: number;
    wordCount: number;
    sentenceCount: number;
    syllableCount: number;
    complexWordCount: number;
    polysyllableCount: number;
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    avgLettersPerWord: number;
    readingTimeMinutes: number;
    speakingTimeMinutes: number;
}

const SAMPLE_TEXT = `Clear writing is the foundation of effective communication. When sentences are concise and words are chosen with intention, readers can absorb complex ideas effortlessly. Modern readability formulas like Flesch-Kincaid and Gunning Fog measure structural elements such as sentence length and syllable density. By analyzing these quantitative metrics, authors, educators, and technical communicators can tailor their prose to match the cognitive expectations of their target audience.`;

export default function ReadabilityScoreCalculator() {
    const [text, setText] = useState<string>(SAMPLE_TEXT);
    const [copied, setCopied] = useState<boolean>(false);

    // Syllable Counter Engine with linguistic heuristics
    const countSyllablesInWord = (rawWord: string): number => {
        let word = rawWord.toLowerCase().trim().replace(/[^a-z]/g, "");
        if (!word) return 0;
        if (word.length <= 3) return 1;

        // Strip common non-pronounced suffixes
        word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, "");
        word = word.replace(/^y/, "");

        // Match contiguous vowel groups
        const vowelGroups = word.match(/[aeiouy]{1,2}/g);
        const count = vowelGroups ? vowelGroups.length : 1;
        return Math.max(1, count);
    };

    // Calculate all metrics reactively
    const { stats, scores } = useMemo(() => {
        const rawText = text.trim();

        if (!rawText) {
            const emptyStats: TextStatistics = {
                characterCount: 0,
                characterCountNoSpaces: 0,
                wordCount: 0,
                sentenceCount: 0,
                syllableCount: 0,
                complexWordCount: 0,
                polysyllableCount: 0,
                avgWordsPerSentence: 0,
                avgSyllablesPerWord: 0,
                avgLettersPerWord: 0,
                readingTimeMinutes: 0,
                speakingTimeMinutes: 0
            };
            const emptyScores: ReadabilityScores = {
                fleschReadingEase: 0,
                fleschKincaidGrade: 0,
                gunningFog: 0,
                colemanLiau: 0,
                smogIndex: 0,
                automatedReadabilityIndex: 0
            };
            return { stats: emptyStats, scores: emptyScores };
        }

        const characterCount = rawText.length;
        const characterCountNoSpaces = rawText.replace(/\s/g, "").length;

        // Word extraction
        const words = rawText
            .split(/[\s\r\n]+/)
            .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))
            .filter((w) => w.length > 0);

        const wordCount = words.length;

        // Sentence extraction (matches period, exclamation, or question marks followed by space or end)
        const sentences = rawText
            .split(/[.!?]+(?:\s+|$)/)
            .filter((s) => s.trim().length > 0);
        const sentenceCount = Math.max(1, sentences.length);

        // Syllable and complex word breakdown
        let totalSyllables = 0;
        let complexWordCount = 0; // >= 3 syllables
        let polysyllableCount = 0; // >= 3 syllables for SMOG

        words.forEach((w) => {
            const syl = countSyllablesInWord(w);
            totalSyllables += syl;
            if (syl >= 3) {
                complexWordCount++;
                polysyllableCount++;
            }
        });

        const avgWordsPerSentence = wordCount > 0 ? wordCount / sentenceCount : 0;
        const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;
        const avgLettersPerWord = wordCount > 0 ? characterCountNoSpaces / wordCount : 0;

        // Time estimates
        const readingTimeMinutes = wordCount > 0 ? Math.ceil(wordCount / 225) : 0;
        const speakingTimeMinutes = wordCount > 0 ? Math.ceil(wordCount / 135) : 0;

        // Formula 1: Flesch Reading Ease
        // Formula: 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
        let fleschReadingEase = 0;
        if (wordCount > 0 && sentenceCount > 0) {
            fleschReadingEase =
                206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
            fleschReadingEase = Math.min(100, Math.max(0, Number(fleschReadingEase.toFixed(1))));
        }

        // Formula 2: Flesch-Kincaid Grade Level
        // Formula: 0.39 * (total words / total sentences) + 11.8 * (total syllables / total words) - 15.59
        let fleschKincaidGrade = 0;
        if (wordCount > 0 && sentenceCount > 0) {
            fleschKincaidGrade =
                0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
            fleschKincaidGrade = Math.max(0, Number(fleschKincaidGrade.toFixed(1)));
        }

        // Formula 3: Gunning Fog Index
        // Formula: 0.4 * [ (words/sentences) + 100 * (complex words / words) ]
        let gunningFog = 0;
        if (wordCount > 0 && sentenceCount > 0) {
            const percentComplex = (complexWordCount / wordCount) * 100;
            gunningFog = 0.4 * (avgWordsPerSentence + percentComplex);
            gunningFog = Math.max(0, Number(gunningFog.toFixed(1)));
        }

        // Formula 4: Coleman-Liau Index
        // Formula: 0.0588 * L - 0.296 * S - 15.8
        // L = avg letters per 100 words, S = avg sentences per 100 words
        let colemanLiau = 0;
        if (wordCount > 0) {
            const L = (characterCountNoSpaces / wordCount) * 100;
            const S = (sentenceCount / wordCount) * 100;
            colemanLiau = 0.0588 * L - 0.296 * S - 15.8;
            colemanLiau = Math.max(0, Number(colemanLiau.toFixed(1)));
        }

        // Formula 5: SMOG Index
        // Formula: 1.0430 * sqrt(30 * (polysyllables / sentences)) + 3.1291
        let smogIndex = 0;
        if (sentenceCount > 0) {
            const smogPolys = (polysyllableCount / sentenceCount) * 30;
            smogIndex = 1.043 * Math.sqrt(smogPolys) + 3.1291;
            smogIndex = Math.max(0, Number(smogIndex.toFixed(1)));
        }

        // Formula 6: Automated Readability Index (ARI)
        // Formula: 4.71 * (characters/words) + 0.5 * (words/sentences) - 21.43
        let automatedReadabilityIndex = 0;
        if (wordCount > 0 && sentenceCount > 0) {
            automatedReadabilityIndex =
                4.71 * (characterCountNoSpaces / wordCount) +
                0.5 * avgWordsPerSentence -
                21.43;
            automatedReadabilityIndex = Math.max(
                0,
                Number(automatedReadabilityIndex.toFixed(1))
            );
        }

        return {
            stats: {
                characterCount,
                characterCountNoSpaces,
                wordCount,
                sentenceCount,
                syllableCount: totalSyllables,
                complexWordCount,
                polysyllableCount,
                avgWordsPerSentence: Number(avgWordsPerSentence.toFixed(1)),
                avgSyllablesPerWord: Number(avgSyllablesPerWord.toFixed(2)),
                avgLettersPerWord: Number(avgLettersPerWord.toFixed(1)),
                readingTimeMinutes,
                speakingTimeMinutes
            },
            scores: {
                fleschReadingEase,
                fleschKincaidGrade,
                gunningFog,
                colemanLiau,
                smogIndex,
                automatedReadabilityIndex
            }
        };
    }, [text]);

    // Categorization helper for Flesch Reading Ease
    const easeInterpretation = useMemo(() => {
        const score = scores.fleschReadingEase;
        if (score >= 90) return { label: "Very Easy", audience: "5th Grade (Age 10-11)", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
        if (score >= 80) return { label: "Easy", audience: "6th Grade (Age 11-12)", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
        if (score >= 70) return { label: "Fairly Easy", audience: "7th Grade (Age 12-13)", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" };
        if (score >= 60) return { label: "Standard / Plain English", audience: "8th-9th Grade (Age 13-15)", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" };
        if (score >= 50) return { label: "Fairly Difficult", audience: "10th-12th Grade (High School)", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
        if (score >= 30) return { label: "Difficult", audience: "College / University Undergraduate", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
        return { label: "Very Confusing / Academic", audience: "Postgraduate / Professional Specialists", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
    }, [scores.fleschReadingEase]);

    const handleCopyReport = () => {
        const report = `Readability & Text Analytics Report
----------------------------------------
Flesch Reading Ease: ${scores.fleschReadingEase} / 100 (${easeInterpretation.label})
Flesch-Kincaid Grade Level: Grade ${scores.fleschKincaidGrade}
Gunning Fog Index: ${scores.gunningFog}
Coleman-Liau Index: Grade ${scores.colemanLiau}
SMOG Index: Grade ${scores.smogIndex}
Automated Readability Index (ARI): Grade ${scores.automatedReadabilityIndex}

Structural Statistics:
- Word Count: ${stats.wordCount}
- Sentence Count: ${stats.sentenceCount}
- Syllable Count: ${stats.syllableCount}
- Complex Words (3+ syllables): ${stats.complexWordCount} (${stats.wordCount > 0 ? ((stats.complexWordCount / stats.wordCount) * 100).toFixed(1) : 0}%)
- Avg Words Per Sentence: ${stats.avgWordsPerSentence}
- Avg Syllables Per Word: ${stats.avgSyllablesPerWord}
- Reading Time: ~${stats.readingTimeMinutes} min(s)
- Speaking Time: ~${stats.speakingTimeMinutes} min(s)
----------------------------------------
Generated with TwisterTools Readability Score Calculator`;

        navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // JSON-LD Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Readability Index Calculator (Flesch-Kincaid & Gunning Fog)",
        "url": "https://twistertools.com/tools/text-tools/readability-score-calculator",
        "description": "Calculate Flesch Reading Ease, Flesch-Kincaid Grade Level, Gunning Fog Index, Coleman-Liau, SMOG, and ARI scores instantly with client-side text analytics.",
        "applicationCategory": "EducationalApplication",
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
                "name": "What is the difference between Flesch Reading Ease and Flesch-Kincaid Grade Level?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Flesch Reading Ease generates a score from 0 to 100, where higher scores (60-100) signify plain, easily digestible English and lower scores (0-30) indicate dense academic prose. In contrast, Flesch-Kincaid Grade Level converts this calculation directly into the United States academic school grade required to understand the passage (e.g., Grade 8 corresponds to an 8th-grade student aged 13-14)."
                }
            },
            {
                "@type": "Question",
                "name": "What is a good Flesch Reading Ease score for web content and digital marketing?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For web articles, blog posts, sales pages, and general consumer communication, a Flesch Reading Ease score between 60 and 70 (equivalent to an 8th or 9th-grade reading level) is standard practice. Content written at this level allows readers to scan and comprehend key information quickly without cognitive friction."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Gunning Fog Index evaluate prose complexity?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Gunning Fog Index estimates the years of formal education a person needs to comprehend a text on first reading. It assigns significant weight to complex words (words with three or more syllables, excluding common suffixes or proper nouns) combined with average sentence length. A score of 7-8 indicates ideal popular reading, while scores above 12 represent advanced academic material."
                }
            },
            {
                "@type": "Question",
                "name": "Why do different readability formulas yield slightly different grade scores?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Different formulas rely on distinct linguistic variables. Flesch-Kincaid and Gunning Fog evaluate syllable counts and sentence lengths, Coleman-Liau calculates letter frequency per 100 words, SMOG measures polysyllabic density across specific sentence samples, and ARI measures raw character counts. Variations occur because each algorithm models grammatical complexity through different mathematical proxies."
                }
            },
            {
                "@type": "Question",
                "name": "Is my text data processed securely or stored on external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "All text parsing, syllable counting, and statistical calculations are computed entirely within your local browser runtime. Zero raw text or analytics telemetry is transmitted to or stored on external servers."
                }
            },
            {
                "@type": "Question",
                "name": "How can I improve and simplify a low readability score?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To improve low scores: break compound sentences into two concise sentences, replace multi-syllable jargon with simpler synonyms (e.g., use 'help' instead of 'facilitate'), eliminate passive voice, and utilize bulleted lists to break up dense paragraphs."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Text Input & Editor Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Source Text Editor
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setText(SAMPLE_TEXT)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                                >
                                    Load Sample
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setText("")}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Clear</span>
                                </button>
                            </div>
                        </div>

                        {/* Textarea Input */}
                        <div className="relative">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Type or paste your text here to compute reading ease, grade level, and structural syllable metrics..."
                                className="w-full h-80 sm:h-96 p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition"
                            />
                        </div>
                    </div>

                    {/* Quick Document Velocity Stats */}
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Words</span>
                            <span className="text-base font-black text-slate-800 font-mono">{stats.wordCount}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Sentences</span>
                            <span className="text-base font-black text-slate-800 font-mono">{stats.sentenceCount}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Reading Time</span>
                            <span className="text-base font-black text-indigo-600 font-mono">~{stats.readingTimeMinutes}m</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Speaking Time</span>
                            <span className="text-base font-black text-indigo-600 font-mono">~{stats.speakingTimeMinutes}m</span>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Scorecard & Readability Indices */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Primary Headline Indicator: Flesch Reading Ease */}
                        <div className={`p-4 rounded-2xl border ${easeInterpretation.border} ${easeInterpretation.bg} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    Primary Score: Flesch Reading Ease
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200/80 ${easeInterpretation.color}`}>
                                    {easeInterpretation.label}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
                                    {scores.fleschReadingEase}
                                </span>
                                <span className="text-sm font-bold text-slate-500">/ 100</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                <strong>Target Audience:</strong> {easeInterpretation.audience}. Higher scores indicate clear, accessible prose that allows readers to scan and comprehend key information quickly.
                            </p>
                        </div>

                        {/* 5-Formula Grade Matrix */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                <GraduationCap className="w-4 h-4 text-indigo-600" />
                                Academic Grade Level Indices
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 block">Flesch-Kincaid</span>
                                        <span className="text-[11px] text-slate-500">Syllable & sentence density</span>
                                    </div>
                                    <span className="text-lg font-black text-indigo-600 font-mono">
                                        Grade {scores.fleschKincaidGrade}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 block">Gunning Fog Index</span>
                                        <span className="text-[11px] text-slate-500">Complex word proportion</span>
                                    </div>
                                    <span className="text-lg font-black text-indigo-600 font-mono">
                                        {scores.gunningFog}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 block">Coleman-Liau Index</span>
                                        <span className="text-[11px] text-slate-500">Letter counts per 100 words</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-800 font-mono">
                                        Grade {scores.colemanLiau}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 block">SMOG Index</span>
                                        <span className="text-[11px] text-slate-500">Polysyllabic rigor formula</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-800 font-mono">
                                        Grade {scores.smogIndex}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between sm:col-span-2">
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 block">Automated Readability (ARI)</span>
                                        <span className="text-[11px] text-slate-500">Character-to-sentence ratio</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-800 font-mono">
                                        Grade {scores.automatedReadabilityIndex}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Granular Linguistic Breakdown */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                Structural Linguistic Metrics
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-0.5">
                                    <span className="text-slate-500 font-medium block">Total Syllables</span>
                                    <span className="font-bold text-slate-900 font-mono">{stats.syllableCount}</span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-0.5">
                                    <span className="text-slate-500 font-medium block">Complex Words (3+ syl)</span>
                                    <span className="font-bold text-slate-900 font-mono">{stats.complexWordCount}</span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-0.5">
                                    <span className="text-slate-500 font-medium block">Avg Words/Sentence</span>
                                    <span className="font-bold text-slate-900 font-mono">{stats.avgWordsPerSentence}</span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-0.5">
                                    <span className="text-slate-500 font-medium block">Avg Syllables/Word</span>
                                    <span className="font-bold text-slate-900 font-mono">{stats.avgSyllablesPerWord}</span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-0.5">
                                    <span className="text-slate-500 font-medium block">Characters (No spaces)</span>
                                    <span className="font-bold text-slate-900 font-mono">{stats.characterCountNoSpaces}</span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 space-y-0.5">
                                    <span className="text-slate-500 font-medium block">Avg Letters/Word</span>
                                    <span className="font-bold text-slate-900 font-mono">{stats.avgLettersPerWord}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleCopyReport}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Full Report Copied to Clipboard!" : "Copy Full Readability Report"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Readability Fundamentals & Formula Mathematics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Readability Formulas: Mathematical Foundations & Linguistic Science
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Readability formulas evaluate the cognitive processing effort required for a human reader to comprehend a written passage. Developed by linguists, cognitive psychologists, and educational researchers throughout the 20th century, these mathematical algorithms assess structural features—primarily word length, syllable density, and sentence structure—to quantify clarity.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        By applying objective mathematical metrics to raw text, editors, technical authors, and SEO specialists can systematically detect readability bottlenecks, eliminate unneeded complexity, and calibrate tone for their intended audience.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Formula I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Flesch Reading Ease</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Evaluates syllable density per word and sentence length to generate a 0 to 100 scale. Standard online writing targets 60-70.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Formula II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Gunning Fog Index</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Focuses on the proportion of complex polysyllabic words (3+ syllables) to identify formal education years needed.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Formula III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Coleman-Liau & ARI</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Utilizes discrete character counts rather than estimated syllables, offering consistent machine-calculated grade levels.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comprehensive Score Interpretation Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Readability Score Conversion & Grade Level Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this cross-reference matrix to interpret how Flesch Reading Ease scores correlate with equivalent academic grade levels, target reading ages, and recommended publishing formats:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Flesch Ease</th>
                                    <th className="p-3">Grade Level (FKGL)</th>
                                    <th className="p-3">Reading Difficulty</th>
                                    <th className="p-3">Target Age Group</th>
                                    <th className="p-3">Recommended Publishing Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-emerald-600 font-bold">90 – 100</td>
                                    <td className="p-3 font-mono">5th Grade</td>
                                    <td className="p-3">Very Easy</td>
                                    <td className="p-3 text-slate-600">10 – 11 years</td>
                                    <td className="p-3 text-xs text-slate-600">Children&apos;s literature, broad consumer alerts, simple user instructions</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-emerald-600 font-bold">80 – 89</td>
                                    <td className="p-3 font-mono">6th Grade</td>
                                    <td className="p-3">Easy</td>
                                    <td className="p-3 text-slate-600">11 – 12 years</td>
                                    <td className="p-3 text-xs text-slate-600">Conversational blog posts, popular fiction, customer onboarding guides</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-teal-600 font-bold">70 – 79</td>
                                    <td className="p-3 font-mono">7th Grade</td>
                                    <td className="p-3">Fairly Easy</td>
                                    <td className="p-3 text-slate-600">12 – 13 years</td>
                                    <td className="p-3 text-xs text-slate-600">General news publications, marketing email newsletters, e-commerce listings</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-indigo-600 font-bold">60 – 69</td>
                                    <td className="p-3 font-mono">8th – 9th Grade</td>
                                    <td className="p-3 font-bold text-slate-900">Standard (Plain English)</td>
                                    <td className="p-3 text-slate-600">13 – 15 years</td>
                                    <td className="p-3 text-xs text-slate-600">Search engine optimized articles, corporate reports, Wikipedia overview pages</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-amber-600 font-bold">50 – 59</td>
                                    <td className="p-3 font-mono">10th – 12th Grade</td>
                                    <td className="p-3">Fairly Difficult</td>
                                    <td className="p-3 text-slate-600">15 – 18 years</td>
                                    <td className="p-3 text-xs text-slate-600">Professional essays, trade magazines, software developer documentation</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-orange-600 font-bold">30 – 49</td>
                                    <td className="p-3 font-mono">College Undergraduate</td>
                                    <td className="p-3">Difficult</td>
                                    <td className="p-3 text-slate-600">18 – 22 years</td>
                                    <td className="p-3 text-xs text-slate-600">Academic journals, legal terms of service, technical engineering specifications</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono text-rose-600 font-bold">0 – 29</td>
                                    <td className="p-3 font-mono">College Graduate</td>
                                    <td className="p-3">Very Confusing</td>
                                    <td className="p-3 text-slate-600">22+ years</td>
                                    <td className="p-3 text-xs text-slate-600">Scientific dissertations, statutory law, specialized medical research</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Exact Mathematical Formulas Explained */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mathematical Formulas: How Scores are Computed
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Each index measures text through a specialized statistical lens. Below are the exact equations utilized by this tool:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <AlignLeft className="w-4 h-4 text-indigo-600" /> Flesch Reading Ease Formula
                            </h3>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                                206.835 - 1.015 × (Words / Sentences) - 84.6 × (Syllables / Words)
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Penalizes long sentences and multi-syllable vocabulary. Results range between 0 (hardest) and 100 (easiest).
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <GraduationCap className="w-4 h-4 text-indigo-600" /> Flesch-Kincaid Grade Level
                            </h3>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                                0.39 × (Words / Sentences) + 11.8 × (Syllables / Words) - 15.59
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Translates Reading Ease into an equivalent US educational grade level. A result of 8.2 represents eighth-grade level.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Eye className="w-4 h-4 text-indigo-600" /> Gunning Fog Index
                            </h3>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                                0.4 × [ (Words / Sentences) + 100 × (Complex Words / Words) ]
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                &quot;Complex words&quot; are defined as words containing three or more syllables, making this an ideal index for detecting corporate buzzwords.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Hash className="w-4 h-4 text-indigo-600" /> Coleman-Liau Index
                            </h3>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                                0.0588 × L - 0.296 × S - 15.8
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Where <em>L</em> is average letters per 100 words and <em>S</em> is average sentences per 100 words. Completely bypasses syllable counting.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Actionable Optimization Strategies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Five Strategic Methods to Improve Your Text Readability
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To simplify complex writing without diminishing its intellectual authority or nuance, apply these five tactical editing rules:
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Segment Compound Sentences</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Sentences exceeding 25 words overload working memory. Identify coordinating conjunctions (&quot;and&quot;, &quot;but&quot;, &quot;however&quot;) and split elongated compound sentences into two distinct, punchy thoughts.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Substitute Polysyllabic Jargon</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Replace 4-syllable terms with straightforward 1 or 2-syllable synonyms. For example, replace &quot;utilize&quot; with &quot;use&quot;, &quot;facilitate&quot; with &quot;help&quot;, and &quot;subsequently&quot; with &quot;then&quot;.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Convert Passive Voice to Active Voice</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Passive constructions (&quot;The report was generated by the committee&quot;) require unnecessary grammatical padding. Switch to direct active phrasing (&quot;The committee generated the report&quot;).
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Leverage Scannable Typography</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Dense text walls intimidate readers. Convert lists of items embedded within prose into structured bulleted lists, bold key concepts, and keep paragraphs limited to 2-4 sentences.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                5
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Eliminate Filler Words and Redundancies</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Prune weak modifiers like &quot;very&quot;, &quot;really&quot;, &quot;in order to&quot;, and &quot;due to the fact that&quot;. Cutting dead weight immediately increases your Flesch Reading Ease score.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                What is the difference between Flesch Reading Ease and Flesch-Kincaid Grade Level?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Flesch Reading Ease generates a score from 0 to 100, where higher scores (60-100) signify plain, easily digestible English and lower scores (0-30) indicate dense academic prose. In contrast, Flesch-Kincaid Grade Level converts this calculation directly into the United States academic school grade required to understand the passage (e.g., Grade 8 corresponds to an 8th-grade student aged 13-14).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a good Flesch Reading Ease score for web content and digital marketing?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For web articles, blog posts, sales pages, and general consumer communication, a Flesch Reading Ease score between 60 and 70 (equivalent to an 8th or 9th-grade reading level) is standard practice. Content written at this level allows readers to scan and comprehend key information quickly without cognitive friction.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the Gunning Fog Index evaluate prose complexity?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Gunning Fog Index estimates the years of formal education a person needs to comprehend a text on first reading. It assigns significant weight to complex words (words with three or more syllables, excluding common suffixes or proper nouns) combined with average sentence length. A score of 7-8 indicates ideal popular reading, while scores above 12 represent advanced academic material.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do different readability formulas yield slightly different grade scores?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Different formulas rely on distinct linguistic variables. Flesch-Kincaid and Gunning Fog evaluate syllable counts and sentence lengths, Coleman-Liau calculates letter frequency per 100 words, SMOG measures polysyllabic density across specific sentence samples, and ARI measures raw character counts. Variations occur because each algorithm models grammatical complexity through different mathematical proxies.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my text data processed securely or stored on external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                All text parsing, syllable counting, and statistical calculations are computed entirely within your local browser runtime. Zero raw text or analytics telemetry is transmitted to or stored on external servers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How can I improve and simplify a low readability score?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To improve low scores: break compound sentences into two concise sentences, replace multi-syllable jargon with simpler synonyms (e.g., use &apos;help&apos; instead of &apos;facilitate&apos;), eliminate passive voice, and utilize bulleted lists to break up dense paragraphs.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}