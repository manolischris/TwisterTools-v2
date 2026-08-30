"use client";

import React, { useState, useMemo } from "react";
import {
    Type,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    BookOpen,
    HelpCircle,
    Info,
    CheckCircle2,
    SlidersHorizontal,
    FileText,
    ArrowRightLeft,
    CheckSquare,
    Layers,
    ListFilter,
    FileCheck2,
    Settings2,
    Zap,
    Scale,
    Library,
    GraduationCap,
    Newspaper
} from "lucide-react";

export type CapitalizationStandard =
    | "apa"
    | "chicago"
    | "mla"
    | "ap"
    | "nyt"
    | "sentence"
    | "upper"
    | "lower"
    | "titleSimple";

interface StyleStandardConfig {
    id: CapitalizationStandard;
    name: string;
    badge: string;
    description: string;
    icon: React.ElementType;
}

const STYLE_PRESETS: StyleStandardConfig[] = [
    {
        id: "apa",
        name: "APA 7th Edition",
        badge: "Academic",
        description: "American Psychological Association style for scientific & research papers",
        icon: GraduationCap
    },
    {
        id: "chicago",
        name: "Chicago Manual of Style (CMOS)",
        badge: "Publishing",
        description: "Standard for books, periodicals, and comprehensive publishing houses",
        icon: BookOpen
    },
    {
        id: "mla",
        name: "MLA 9th Edition",
        badge: "Humanities",
        description: "Modern Language Association guidelines for essays and cultural studies",
        icon: Library
    },
    {
        id: "ap",
        name: "AP Stylebook",
        badge: "Journalism",
        description: "Associated Press standard for news reporting and digital publications",
        icon: Newspaper
    },
    {
        id: "nyt",
        name: "The New York Times",
        badge: "Editorial",
        description: "Refined journalistic casing including lowercase prepositions <= 3 letters",
        icon: FileCheck2
    },
    {
        id: "sentence",
        name: "Sentence case",
        badge: "UI / Digital",
        description: "Capitalize only the first letter of sentences, acronyms, and proper nouns",
        icon: Type
    },
    {
        id: "upper",
        name: "UPPERCASE",
        badge: "Format",
        description: "Convert all characters to standardized capital letters",
        icon: Layers
    },
    {
        id: "lower",
        name: "lowercase",
        badge: "Format",
        description: "Convert all characters to standard non-capitalized letters",
        icon: ArrowRightLeft
    }
];

// Reference lists for capitalization logic
const ARTICLES = new Set(["a", "an", "the"]);

const COORD_CONJUNCTIONS = new Set(["and", "but", "for", "nor", "or", "so", "yet"]);

// APA lowercase prepositions: all prepositions with 3 or fewer letters
const SHORT_PREPOSITIONS = new Set([
    "as", "at", "by", "for", "in", "of", "off", "on", "per", "to", "up", "via"
]);

// Chicago lowercase prepositions regardless of length
const CHICAGO_LOWERCASE_PREPOSITIONS = new Set([
    "a", "about", "above", "across", "after", "against", "along", "amid", "among",
    "around", "as", "at", "before", "behind", "below", "beneath", "beside",
    "between", "beyond", "by", "concerning", "considering", "despite", "down",
    "during", "except", "for", "from", "in", "inside", "into", "like", "near",
    "of", "off", "on", "onto", "out", "outside", "over", "past", "regarding",
    "round", "since", "through", "throughout", "till", "to", "toward", "towards",
    "under", "underneath", "unlike", "until", "up", "upon", "via", "with", "within", "without"
]);

// Words in AP that stay lowercase if < 4 letters
const AP_LOWERCASE_WORDS = new Set([
    "a", "an", "the", "and", "but", "for", "or", "nor", "in", "on", "at", "to", "by", "of", "off", "up", "so", "yet"
]);

// Known acronyms and tech terms that preserve custom casing
const DEFAULT_PRESERVED_TERMS = [
    "API", "APIs", "REST", "GraphQL", "UI", "UX", "HTML", "CSS", "JSON", "XML", "SQL", "NoSQL",
    "SaaS", "PaaS", "IaaS", "AWS", "GCP", "SDK", "SDKs", "SEO", "URL", "URLs", "HTTP", "HTTPS",
    "IPv4", "IPv6", "DNS", "LLM", "LLMs", "AI", "ML", "GPT", "NLP", "NASA", "USA", "UK", "EU",
    "iOS", "macOS", "iPadOS", "watchOS", "iPhone", "iPad", "eBook", "eBooks", "eBay", "TwisterTools"
];

export default function TitleCaseConverter() {
    const [inputText, setInputText] = useState<string>(
        "the quick brown fox jumps over the lazy dog: a comprehensive guide to modern ui/ux and rest api architecture in the us"
    );
    const [standard, setStandard] = useState<CapitalizationStandard>("apa");
    const [capitalizeHyphenated, setCapitalizeHyphenated] = useState<boolean>(true);
    const [preserveAcronyms, setPreserveAcronyms] = useState<boolean>(true);
    const [capitalizeAfterColon, setCapitalizeAfterColon] = useState<boolean>(true);
    const [customExceptionsText, setCustomExceptionsText] = useState<string>("");
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    // Parse user custom preserved acronyms
    const customPreservedMap = useMemo(() => {
        const map = new Map<string, string>();
        if (preserveAcronyms) {
            DEFAULT_PRESERVED_TERMS.forEach((term) => {
                map.set(term.toLowerCase(), term);
            });
        }
        if (customExceptionsText.trim()) {
            const customList = customExceptionsText
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean);
            customList.forEach((term) => {
                map.set(term.toLowerCase(), term);
            });
        }
        return map;
    }, [preserveAcronyms, customExceptionsText]);

    // Core Title Casing Engine
    const convertedText = useMemo(() => {
        if (!inputText) return "";

        if (standard === "upper") {
            return inputText.toUpperCase();
        }

        if (standard === "lower") {
            return inputText.toLowerCase();
        }

        if (standard === "sentence") {
            // Sentence casing per sentence boundary
            return inputText.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, char) => {
                return prefix + char.toUpperCase();
            });
        }

        // Process line by line to support multi-line title batches
        const lines = inputText.split("\n");

        const transformedLines = lines.map((line) => {
            if (!line.trim()) return line;

            // Tokenize while keeping punctuation and spacing intact
            const tokens = line.split(/(\s+|[-–—:;/()[\],."'])/g);
            let wordIndexInSentence = 0;
            let precedingWasColonOrDash = true; // Capitalize very first word

            const processedTokens = tokens.map((token) => {
                // If it's whitespace or punctuation, adjust flags and return
                if (!token || /^\s+$/.test(token)) {
                    return token;
                }

                // Check punctuation boundaries for sub-clauses
                if (token === ":" || token === "." || token === "?" || token === "!") {
                    if (capitalizeAfterColon) {
                        precedingWasColonOrDash = true;
                    }
                    return token;
                }

                if (token === "-" || token === "–" || token === "—") {
                    return token;
                }

                // Clean word for lexical comparison
                const match = token.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9'’]+)([^a-zA-Z0-9]*)$/);
                if (!match) {
                    return token;
                }

                const [, prefix, rawWord, suffix] = match;
                const lowerWord = rawWord.toLowerCase();

                // 1. Check if token matches exact preserved terms (e.g., API, iOS, SaaS)
                if (customPreservedMap.has(lowerWord)) {
                    const preserved = customPreservedMap.get(lowerWord)!;
                    wordIndexInSentence++;
                    precedingWasColonOrDash = false;
                    return prefix + preserved + suffix;
                }

                // 2. Check if hyphenated word subparts need capitalization
                if (rawWord.includes("-") && capitalizeHyphenated) {
                    const subParts = rawWord.split("-");
                    const capParts = subParts.map((part, pIdx) => {
                        const subLower = part.toLowerCase();
                        if (customPreservedMap.has(subLower)) return customPreservedMap.get(subLower)!;
                        if (pIdx === 0 || capitalizeHyphenated) {
                            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                        }
                        return part.toLowerCase();
                    });
                    wordIndexInSentence++;
                    precedingWasColonOrDash = false;
                    return prefix + capParts.join("-") + suffix;
                }

                // 3. Determine if word should be lowercase based on standard
                let shouldBeLowercase = false;
                const isFirstWord = wordIndexInSentence === 0 || precedingWasColonOrDash;

                if (!isFirstWord) {
                    switch (standard) {
                        case "apa":
                            // APA 7th: Lowercase words <= 3 letters that are conjunctions, prepositions, or articles
                            if (
                                ARTICLES.has(lowerWord) ||
                                (SHORT_PREPOSITIONS.has(lowerWord) && lowerWord.length <= 3) ||
                                (COORD_CONJUNCTIONS.has(lowerWord) && lowerWord.length <= 3)
                            ) {
                                shouldBeLowercase = true;
                            }
                            break;

                        case "chicago":
                            // CMOS: Lowercase articles, coordinating conjunctions, "to" as infinitive, and all prepositions
                            if (
                                ARTICLES.has(lowerWord) ||
                                COORD_CONJUNCTIONS.has(lowerWord) ||
                                CHICAGO_LOWERCASE_PREPOSITIONS.has(lowerWord) ||
                                lowerWord === "to"
                            ) {
                                shouldBeLowercase = true;
                            }
                            break;

                        case "mla":
                            // MLA: Lowercase articles, coordinating conjunctions, and prepositions of any length (unless first/last)
                            if (
                                ARTICLES.has(lowerWord) ||
                                COORD_CONJUNCTIONS.has(lowerWord) ||
                                CHICAGO_LOWERCASE_PREPOSITIONS.has(lowerWord)
                            ) {
                                shouldBeLowercase = true;
                            }
                            break;

                        case "ap":
                            // AP Stylebook: Lowercase articles, conjunctions, and prepositions of 3 or fewer letters
                            if (AP_LOWERCASE_WORDS.has(lowerWord) || (lowerWord.length <= 3 && SHORT_PREPOSITIONS.has(lowerWord))) {
                                shouldBeLowercase = true;
                            }
                            break;

                        case "nyt":
                            // NYT Style: Lowercase articles, conjunctions, and short prepositions
                            if (
                                ARTICLES.has(lowerWord) ||
                                COORD_CONJUNCTIONS.has(lowerWord) ||
                                (SHORT_PREPOSITIONS.has(lowerWord) && lowerWord.length <= 3)
                            ) {
                                shouldBeLowercase = true;
                            }
                            break;

                        case "titleSimple":
                            if (ARTICLES.has(lowerWord) || COORD_CONJUNCTIONS.has(lowerWord) || SHORT_PREPOSITIONS.has(lowerWord)) {
                                shouldBeLowercase = true;
                            }
                            break;
                    }
                }

                wordIndexInSentence++;
                precedingWasColonOrDash = false;

                if (shouldBeLowercase) {
                    return prefix + lowerWord + suffix;
                } else {
                    return prefix + rawWord.charAt(0).toUpperCase() + rawWord.slice(1).toLowerCase() + suffix;
                }
            });

            // Ensure the very last word of title is capitalized in formal styles (APA, Chicago, MLA, AP)
            if (["apa", "chicago", "mla", "ap", "nyt"].includes(standard)) {
                for (let i = processedTokens.length - 1; i >= 0; i--) {
                    const tok = processedTokens[i];
                    if (/[a-zA-Z0-9]/.test(tok)) {
                        const match = tok.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9'’]+)([^a-zA-Z0-9]*)$/);
                        if (match) {
                            const [, pre, core, suf] = match;
                            const lowerCore = core.toLowerCase();
                            if (customPreservedMap.has(lowerCore)) {
                                processedTokens[i] = pre + customPreservedMap.get(lowerCore)! + suf;
                            } else {
                                processedTokens[i] = pre + core.charAt(0).toUpperCase() + core.slice(1).toLowerCase() + suf;
                            }
                        }
                        break;
                    }
                }
            }

            return processedTokens.join("");
        });

        return transformedLines.join("\n");
    }, [
        inputText,
        standard,
        capitalizeHyphenated,
        capitalizeAfterColon,
        customPreservedMap
    ]);

    // Statistics Calculations
    const textStats = useMemo(() => {
        const raw = inputText.trim();
        if (!raw) return { words: 0, characters: 0, lines: 0 };
        return {
            words: raw.split(/\s+/).filter(Boolean).length,
            characters: raw.length,
            lines: inputText.split("\n").length
        };
    }, [inputText]);

    // Copy to clipboard handler
    const handleCopy = () => {
        if (!convertedText) return;
        navigator.clipboard.writeText(convertedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Reset handler
    const handleReset = () => {
        setInputText("");
    };

    // Load sample text
    const handleLoadSample = () => {
        setInputText(
            "the ultimate handbook to building rest apis with next.js, graphql, and microservices: from beginner to cloud architect"
        );
    };

    // JSON-LD Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Title Case Converter for Capitalization Standards",
        "url": "https://twistertools.com/tools/text-tools/title-case-converter",
        "description": "Professional browser-based title capitalization tool supporting APA 7th, Chicago Manual of Style (CMOS), MLA 9th, AP Stylebook, NYT, and custom acronym preservation.",
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
                "name": "What is the primary difference between APA and Chicago style title capitalization?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The key distinction lies in preposition length rules. APA 7th edition capitalizes all words with four or more letters (including prepositions like 'With', 'From', 'Over', and 'Into') and only keeps prepositions with three or fewer letters lowercase. In contrast, Chicago Manual of Style (CMOS) keeps all prepositions lowercase regardless of character length (e.g., 'throughout', 'between', 'against', 'without'), unless they are the first or last word of the title."
                }
            },
            {
                "@type": "Question",
                "name": "How does MLA 9th Edition handle hyphenated compound words in headings?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "MLA 9th Edition requires capitalizing both elements of a hyphenated compound word if both elements are nouns, pronouns, verbs, adjectives, or adverbs (e.g., 'Record-Breaking', 'Self-Esteem'). If the second element is a minor part of speech (like a short preposition), it remains lowercase (e.g., 'Run-in', 'How-to')."
                }
            },
            {
                "@type": "Question",
                "name": "Are prepositions after colons and subtitles automatically capitalized?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. In virtually all academic and professional style guides (APA, Chicago, MLA, AP), the first word following a colon, em-dash, or question mark in a title is treated as the beginning of a subtitle and is strictly capitalized, regardless of whether it is an article, preposition, or minor conjunction."
                }
            },
            {
                "@type": "Question",
                "name": "How does this tool protect technical acronyms like API, SaaS, and GraphQL?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our engine features built-in Acronym & Brand Case Preservation. It cross-references common developer and enterprise terminology (such as API, REST, HTML, AWS, iOS, and SaaS) so that standardized mixed-case or all-caps naming conventions are never incorrectly lowered or distorted during title conversion."
                }
            },
            {
                "@type": "Question",
                "name": "Does AP Stylebook capitalize four-letter prepositions in news headlines?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. AP Stylebook rules state that all words with four or more letters must be capitalized in headlines. Prepositions such as 'With', 'From', 'Down', and 'Over' are always capitalized under AP style, while three-letter words like 'for', 'and', and 'the' remain lowercase."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schema Injections */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Style Selector Toolbar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-indigo-600" />
                        Select Capitalization Standard
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowOptions(!showOptions)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                        <Settings2 className="w-3.5 h-3.5" />
                        {showOptions ? "Hide Formatting Rules" : "Advanced Casing Rules"}
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {STYLE_PRESETS.map((preset) => {
                        const IconComponent = preset.icon;
                        const isSelected = standard === preset.id;
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => setStandard(preset.id)}
                                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer min-w-0 ${isSelected
                                        ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-950"
                                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 text-slate-700"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <IconComponent
                                        className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-500"
                                            }`}
                                    />
                                    <span
                                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${isSelected
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white text-slate-500 border-slate-200"
                                            }`}
                                    >
                                        {preset.badge}
                                    </span>
                                </div>
                                <span className="text-xs font-bold truncate block">{preset.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Advanced Options Bar */}
                {showOptions && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 pt-4 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium text-slate-700">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={capitalizeHyphenated}
                                    onChange={(e) => setCapitalizeHyphenated(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                <span>Capitalize Hyphenated Subparts</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={capitalizeAfterColon}
                                    onChange={(e) => setCapitalizeAfterColon(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                <span>Capitalize Subtitles (After Colons)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preserveAcronyms}
                                    onChange={(e) => setPreserveAcronyms(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                <span>Preserve Tech Terms & Acronyms</span>
                            </label>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                <span>Custom Preserved Acronyms / Proper Nouns (Comma separated)</span>
                                <span className="text-slate-400 font-normal">e.g., iPhone, DevOps, Web3, SaaS</span>
                            </div>
                            <input
                                type="text"
                                value={customExceptionsText}
                                onChange={(e) => setCustomExceptionsText(e.target.value)}
                                placeholder="iPhone, DevOps, Web3, AWS, PostgreSQL"
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input Source Text */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Raw Source Text
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleLoadSample}
                                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                >
                                    <Sparkles className="w-3 h-3 text-indigo-500" />
                                    Sample
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                    title="Clear text"
                                >
                                    <RotateCcw className="w-3 h-3 text-slate-500" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type or paste your titles, headlines, or paper references here (one per line)..."
                                rows={10}
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-sans text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-y min-h-[260px] leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Character & Word Metrics Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                            <span>
                                <strong>{textStats.words}</strong> words
                            </span>
                            <span>&bull;</span>
                            <span>
                                <strong>{textStats.characters}</strong> characters
                            </span>
                            <span>&bull;</span>
                            <span>
                                <strong>{textStats.lines}</strong> lines
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                Zero Server Transmission
                            </span>
                            <span className="text-indigo-600 font-semibold">Live Processing</span>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Converted Capitalization Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    {STYLE_PRESETS.find((p) => p.id === standard)?.name} Output
                                </h2>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                {standard.toUpperCase()}
                            </span>
                        </div>

                        <div className="relative">
                            <textarea
                                readOnly
                                value={convertedText}
                                placeholder="Capitalized results will render here instantaneously..."
                                rows={10}
                                className="w-full p-3.5 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl font-sans text-sm outline-none transition resize-y min-h-[260px] leading-relaxed select-all"
                            />
                        </div>
                    </div>

                    {/* Copy and Export Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 hidden sm:block flex-1 leading-snug">
                            {STYLE_PRESETS.find((p) => p.id === standard)?.description}
                        </div>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer ml-auto ${copied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? "Copied to Clipboard!" : "Copy Converted Text"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Comprehensive Style Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Capitalization Standards Comparison: APA vs Chicago vs MLA vs AP
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Different editorial and academic standards maintain nuanced, highly specific rules for title capitalization. While all major style guides mandate capitalizing the first and last words of a title along with major parts of speech (nouns, verbs, adjectives, and adverbs), their treatment of prepositions, coordinating conjunctions, and hyphenated compounds varies substantially.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Style Standard</th>
                                    <th className="p-3">Preposition Rule</th>
                                    <th className="p-3">Conjunctions</th>
                                    <th className="p-3">Subtitles (After :)</th>
                                    <th className="p-3">Primary Domain</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">APA 7th Edition</td>
                                    <td className="p-3 text-xs">Lowercase &le; 3 letters (in, on, by, for); Capitalize &ge; 4 letters (With, From, Over)</td>
                                    <td className="p-3 text-xs">Lowercase &le; 3 letters (and, but, or, nor)</td>
                                    <td className="p-3 text-emerald-600 font-bold text-xs">Always Capitalize</td>
                                    <td className="p-3 text-xs text-slate-600">Psychology, Social Sciences, Health, Hard Sciences</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Chicago (CMOS 17)</td>
                                    <td className="p-3 text-xs">Lowercase all prepositions regardless of length (throughout, between, against)</td>
                                    <td className="p-3 text-xs">Lowercase (and, but, for, or, nor)</td>
                                    <td className="p-3 text-emerald-600 font-bold text-xs">Always Capitalize</td>
                                    <td className="p-3 text-xs text-slate-600">Book Publishing, Historical Research, Humanities</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">MLA 9th Edition</td>
                                    <td className="p-3 text-xs">Lowercase all prepositions unless they are the first/last word</td>
                                    <td className="p-3 text-xs">Lowercase coordinating conjunctions</td>
                                    <td className="p-3 text-emerald-600 font-bold text-xs">Always Capitalize</td>
                                    <td className="p-3 text-xs text-slate-600">Literature, Language, Arts, Cultural Studies</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">AP Stylebook</td>
                                    <td className="p-3 text-xs">Capitalize &ge; 4 letters (With, From); Lowercase &le; 3 letters (in, on, at)</td>
                                    <td className="p-3 text-xs">Lowercase &le; 3 letters</td>
                                    <td className="p-3 text-emerald-600 font-bold text-xs">Always Capitalize</td>
                                    <td className="p-3 text-xs text-slate-600">Journalism, Press Releases, Digital Media News</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">New York Times</td>
                                    <td className="p-3 text-xs">Lowercase &le; 3 letters; Lowercase short conjunctions</td>
                                    <td className="p-3 text-xs">Lowercase short conjunctions</td>
                                    <td className="p-3 text-emerald-600 font-bold text-xs">Always Capitalize</td>
                                    <td className="p-3 text-xs text-slate-600">Editorial Columns, Journalism, Literary Criticism</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Grammatical Breakdown of Minor vs Major Parts of Speech */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Grammatical Anatomy: Major vs Minor Words in Headings
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To maintain typographical hierarchy, title casing algorithms classify parts of speech into two categories: words that convey core semantic meaning (Major Words) and connective grammatical particles (Minor Words).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-emerald-600" /> Always Capitalized (Major Words)
                                </h3>
                                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                    Mandatory
                                </span>
                            </div>
                            <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-disc list-inside">
                                <li><strong>Nouns:</strong> Engineer, Python, Architecture, Browser, System</li>
                                <li><strong>Verbs:</strong> Is, Are, Run, Convert, Build, Optimize (including &apos;Is&apos; &amp; &apos;Be&apos;)</li>
                                <li><strong>Adjectives:</strong> Fast, Deep, Computational, Secure, Scalable</li>
                                <li><strong>Adverbs:</strong> Quickly, Seamlessly, Not, Never, Efficiently</li>
                                <li><strong>Pronouns:</strong> He, She, It, They, Ours, Yourself, That</li>
                                <li><strong>First and Last Words:</strong> The first and final word of every title</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <ListFilter className="w-4 h-4 text-amber-600" /> Conditionally Lowercased (Minor Words)
                                </h3>
                                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                    Contextual
                                </span>
                            </div>
                            <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-disc list-inside">
                                <li><strong>Articles:</strong> a, an, the (unless first or last word)</li>
                                <li><strong>Coordinating Conjunctions:</strong> and, but, for, nor, or, so, yet</li>
                                <li><strong>Short Prepositions (APA/AP):</strong> in, on, at, by, for, of, up, to</li>
                                <li><strong>All Prepositions (Chicago/MLA):</strong> across, between, against, through</li>
                                <li><strong>Infinitive &apos;to&apos;:</strong> Used before verbs (e.g., &quot;How to Build&quot;)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 3: Hyphenation & Subtitle Capitalization Logic */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Complex Rules: Hyphenated Compounds, Acronyms, and Subtitles
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Automated capitalization often fails when confronting complex compound structures and modern technical jargon. Our converter utilizes specialized heuristic checks for the most challenging editorial edge cases:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-1">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Rule I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Subtitle Re-Capitalization</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When a colon (:), em-dash (—), or period divides a title, the following word begins a new grammatical clause and is strictly capitalized, even if it is an article like <em>&quot;The&quot;</em> or <em>&quot;A&quot;</em>.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Rule II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Hyphenated Compound Elements</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Under APA and Chicago standards, both parts of a hyphenated compound are capitalized if both words carry equal lexical weight (e.g., <em>&quot;Peer-to-Peer&quot;</em>, <em>&quot;Cost-Effective&quot;</em>, <em>&quot;High-Performance&quot;</em>).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Rule III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Case-Preserved Brand Names</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Distinctive trademarked names and acronyms like <em>&quot;iPhone&quot;</em>, <em>&quot;GraphQL&quot;</em>, <em>&quot;macOS&quot;</em>, <em>&quot;SaaS&quot;</em>, and <em>&quot;API&quot;</em> retain their exact intended capitalization.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                What is the primary difference between APA and Chicago style title capitalization?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The key distinction lies in preposition length rules. APA 7th edition capitalizes all words with four or more letters (including prepositions like &quot;With&quot;, &quot;From&quot;, &quot;Over&quot;, and &quot;Into&quot;) and only keeps prepositions with three or fewer letters lowercase. In contrast, Chicago Manual of Style (CMOS) keeps all prepositions lowercase regardless of character length (e.g., &quot;throughout&quot;, &quot;between&quot;, &quot;against&quot;, &quot;without&quot;), unless they are the first or last word of the title.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does MLA 9th Edition handle hyphenated compound words in headings?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                MLA 9th Edition requires capitalizing both elements of a hyphenated compound word if both elements are nouns, pronouns, verbs, adjectives, or adverbs (e.g., &quot;Record-Breaking&quot;, &quot;Self-Esteem&quot;). If the second element is a minor part of speech (like a short preposition), it remains lowercase (e.g., &quot;Run-in&quot;, &quot;How-to&quot;).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are prepositions after colons and subtitles automatically capitalized?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. In virtually all academic and professional style guides (APA, Chicago, MLA, AP), the first word following a colon, em-dash, or question mark in a title is treated as the beginning of a subtitle and is strictly capitalized, regardless of whether it is an article, preposition, or minor conjunction.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does this tool protect technical acronyms like API, SaaS, and GraphQL?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Our engine features built-in Acronym &amp; Brand Case Preservation. It cross-references common developer and enterprise terminology (such as API, REST, HTML, AWS, iOS, and SaaS) so that standardized mixed-case or all-caps naming conventions are never incorrectly lowered or distorted during title conversion.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does AP Stylebook capitalize four-letter prepositions in news headlines?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. AP Stylebook rules state that all words with four or more letters must be capitalized in headlines. Prepositions such as &quot;With&quot;, &quot;From&quot;, &quot;Down&quot;, and &quot;Over&quot; are always capitalized under AP style, while three-letter words like &quot;for&quot;, &quot;and&quot;, and &quot;the&quot; remain lowercase.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}