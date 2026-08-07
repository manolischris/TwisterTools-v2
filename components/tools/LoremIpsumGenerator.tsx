"use client";

import React, { useState, useTransition, useCallback, useEffect } from "react";
import {
    FileText,
    Copy,
    Check,
    RefreshCw,
    Sliders,
    Type,
    Code2,
    List,
    Sparkles,
    HelpCircle,
    Database,
    ShieldCheck,
    Zap,
    AlignLeft,
    LayoutGrid,
    BookOpen,
    Layers,
    Cpu,
    CheckCircle2,
    Clock,
    Terminal,
    Globe,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  VOCABULARY & CORPUS DICTIONARIES
// ─────────────────────────────────────────────────────────────

const DICTIONARIES = {
    latin: {
        words: [
            "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
            "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
            "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
            "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
            "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
            "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla",
            "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
            "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
            "est", "laborum", "perspiciatis", "unde", "omnis", "iste", "natus", "error",
            "sit", "voluptatem", "accusantium", "doloremque", "laudantium", "totam", "rem",
            "aperiam", "eaque", "ipsa", "quae", "ab", "illo", "inventore", "veritatis",
            "et", "quasi", "architecto", "beatae", "vitae", "dicta", "sunt", "explicabo",
            "nemo", "enim", "ipsam", "voluptatem", "quia", "voluptas", "sit", "aspernatur",
            "aut", "odit", "aut", "fugit", "sed", "quia", "consequuntur", "magni", "dolores",
            "eos", "qui", "ratione", "voluptatem", "sequi", "nesciunt", "neque", "porro"
        ],
        startSentence: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    },
    hipster: {
        words: [
            "artisan", "artisan", "aesthetic", "batch", "biodiesel", "bitters", "blog",
            "brunch", "cardigan", "chambray", "chillwave", "church-key", "cold-pressed",
            "craft", "cronut", "denim", "disrupt", "diy", "ethical", "farm-to-table",
            "fixie", "flannel", "food-truck", "freegan", "gastropub", "gentrify", "gluten-free",
            "hella", "helvetica", "hipster", "hummus", "indie", "kale", "kombucha", "keffiyeh",
            "locavore", "marfa", "meggings", "mixtape", "mustache", "normcore", "organic",
            "pbr", "photo-booth", "pitchfork", "pour-over", "readymade", "salvia", "selfies",
            "seitan", "semiotics", "shoreditch", "small-batch", "sriracha", "sustainable",
            "swag", "tattooed", "tofu", "tote", "truffaut", "trust-fund", "typewriter",
            "umami", "vegan", "vinegar", "vinyl", "waistcoat", "williamsburg", "yolo"
        ],
        startSentence: "Hipster ipsum dolor amet artisan cold-pressed tote bag kombucha."
    },
    pirate: {
        words: [
            "ahoy", "avast", "aye", "bounty", "buccaneer", "cap'n", "cutlass", "deck",
            "doubloon", "fathom", "grog", "jolly-roger", "keelhaul", "landlubber", "loot",
            "maroon", "matey", "pillage", "pirate", "plunder", "poop-deck", "port",
            "scallywag", "scurvy", "sea-dog", "seaworthy", "shiver-me-timbers", "shipmate",
            "skull", "spar", "starboard", "treasure", "treasure-chest", "weigh-anchor",
            "walk-the-plank", "yarr", "ye", "ho-ho-ho", "crow's-nest", "barque", "corsair"
        ],
        startSentence: "Ahoy matey, avast ye jolly roger plunder the high seas."
    },
    tech: {
        words: [
            "agile", "algorithm", "api", "backend", "bandwidth", "big-data", "blockchain",
            "bootstrap", "cloud", "codebase", "container", "cybersecurity", "data-lake",
            "devops", "docker", "endpoint", "frontend", "full-stack", "graphql", "kubernetes",
            "latency", "microservices", "middleware", "ml", "neural-network", "open-source",
            "paradigm", "pipeline", "query", "refactor", "rest", "scalability", "serverless",
            "stack", "syntax", "throughput", "typescript", "ui-ux", "vector", "webassembly"
        ],
        startSentence: "Agile architecture deployment optimizes cloud infrastructure scalability."
    }
};

type Mode = "latin" | "hipster" | "pirate" | "tech";
type Unit = "paragraphs" | "sentences" | "words" | "list";

// ─────────────────────────────────────────────────────────────
//  GENERATION ENGINE LOGIC
// ─────────────────────────────────────────────────────────────

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalizeFirstLetter(string: string) {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateWordsList(dict: typeof DICTIONARIES.latin, count: number): string[] {
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * dict.words.length);
        result.push(dict.words[randomIndex]);
    }
    return result;
}

function generateSentence(dict: typeof DICTIONARIES.latin, wordCount = getRandomInt(6, 14)): string {
    const words = generateWordsList(dict, wordCount);
    let sentence = words.join(" ");
    sentence = capitalizeFirstLetter(sentence) + ".";
    return sentence;
}

function generateParagraph(dict: typeof DICTIONARIES.latin, sentenceCount = getRandomInt(4, 7)): string {
    const sentences: string[] = [];
    for (let i = 0; i < sentenceCount; i++) {
        sentences.push(generateSentence(dict));
    }
    return sentences.join(" ");
}

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function LoremIpsumGenerator() {
    const [mode, setMode] = useState<Mode>("latin");
    const [unit, setUnit] = useState<Unit>("paragraphs");
    const [countInput, setCountInput] = useState<string>("3");
    const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
    const [htmlMarkup, setHtmlMarkup] = useState<boolean>(false);
    const [output, setOutput] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);
    const [, startTransition] = useTransition();

    // Metrics state
    const [wordCount, setWordCount] = useState<number>(0);
    const [charCount, setCharCount] = useState<number>(0);
    const [byteSize, setByteSize] = useState<number>(0);

    // Core calculation handler
    const generateText = useCallback(() => {
        const count = parseInt(countInput, 10) || 1;
        const currentDict = DICTIONARIES[mode];
        let result = "";

        if (unit === "words") {
            let words = generateWordsList(currentDict, count);
            if (startWithLorem && mode === "latin" && words.length >= 2) {
                words[0] = "lorem";
                words[1] = "ipsum";
            }
            result = words.join(" ");
            if (result) {
                result = capitalizeFirstLetter(result);
            }
        } else if (unit === "sentences") {
            const sentences: string[] = [];
            for (let i = 0; i < count; i++) {
                if (i === 0 && startWithLorem && mode === "latin") {
                    sentences.push(currentDict.startSentence);
                } else {
                    sentences.push(generateSentence(currentDict));
                }
            }
            result = sentences.join(" ");
        } else if (unit === "paragraphs") {
            const paragraphs: string[] = [];
            for (let i = 0; i < count; i++) {
                let p = generateParagraph(currentDict);
                if (i === 0 && startWithLorem) {
                    p = currentDict.startSentence + " " + generateParagraph(currentDict, getRandomInt(3, 5));
                }
                if (htmlMarkup) {
                    p = `<p>${p}</p>`;
                }
                paragraphs.push(p);
            }
            result = paragraphs.join(htmlMarkup ? "\n\n" : "\n\n");
        } else if (unit === "list") {
            const items: string[] = [];
            for (let i = 0; i < count; i++) {
                const itemText = generateSentence(currentDict, getRandomInt(3, 8)).replace(/\.$/, "");
                items.push(htmlMarkup ? `  <li>${itemText}</li>` : `• ${itemText}`);
            }
            if (htmlMarkup) {
                result = `<ul>\n${items.join("\n")}\n</ul>`;
            } else {
                result = items.join("\n");
            }
        }

        setOutput(result);

        // Calculate metrics
        const cleanText = result.replace(/<[^>]*>/g, "");
        const wordsArr = cleanText.trim().split(/\s+/).filter(Boolean);
        setWordCount(cleanText.trim() ? wordsArr.length : 0);
        setCharCount(cleanText.length);
        setByteSize(new TextEncoder().encode(result).length);
    }, [mode, unit, countInput, startWithLorem, htmlMarkup]);

    // Trigger generator on state change with non-blocking transition
    useEffect(() => {
        startTransition(() => {
            generateText();
        });
    }, [generateText]);

    // Safe input handler for zero-prefix sanitization
    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawVal = e.target.value;
        if (rawVal === "") {
            setCountInput("");
            return;
        }
        const cleanVal = rawVal.replace(/^0+/, "");
        const parsed = parseInt(cleanVal, 10);
        if (isNaN(parsed)) {
            setCountInput("");
        } else {
            const clamped = Math.min(Math.max(1, parsed), 1000);
            setCountInput(clamped.toString());
        }
    };

    const handleCopy = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback if clipboard API fails
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        return `${(bytes / 1024).toFixed(2)} KB`;
    };

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: CONTROLS ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Edge-to-edge Title Header System */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center gap-3 text-white">
                            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                                <Sliders className="w-5 h-5 text-indigo-200" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-snug">Generator Configurations</h1>
                                <p className="text-xs text-indigo-100/80">Customize text schema, theme, and structure</p>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Theme/Vocabulary Selection Mode */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Type className="w-3.5 h-3.5 text-indigo-600" />
                                    Vocabulary Theme
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: "latin", label: "Classic Latin" },
                                        { id: "hipster", label: "Hipster" },
                                        { id: "pirate", label: "Pirate" },
                                        { id: "tech", label: "Tech / Dev" },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setMode(item.id as Mode)}
                                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-center ${mode === item.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generation Unit Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                                    Output Unit Type
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: "paragraphs", label: "Paragraphs" },
                                        { id: "sentences", label: "Sentences" },
                                        { id: "words", label: "Words" },
                                        { id: "list", label: "List Items" },
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setUnit(item.id as Unit)}
                                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-center ${unit === item.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity Input */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="quantity-input"
                                    className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between"
                                >
                                    <span>Quantity Count</span>
                                    <span className="text-slate-400 font-normal lowercase">(Max 1000)</span>
                                </label>
                                <input
                                    id="quantity-input"
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={countInput}
                                    onChange={handleCountChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                                    placeholder="Enter amount..."
                                />
                            </div>

                            {/* Toggle Options */}
                            <div className="pt-2 space-y-3 border-t border-slate-100">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={startWithLorem}
                                        onChange={(e) => setStartWithLorem(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-medium text-slate-700">
                                        Start with standard &quot;Lorem ipsum dolor sit amet...&quot;
                                    </span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={htmlMarkup}
                                        onChange={(e) => setHtmlMarkup(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-medium text-slate-700">
                                        Wrap with HTML elements (<code className="text-indigo-600">&lt;p&gt;</code> / <code className="text-indigo-600">&lt;ul&gt;</code>)
                                    </span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2">
                                <button
                                    onClick={generateText}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all min-h-[44px]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Regenerate Text Output
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: PREVIEW & METRICS ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden flex flex-col min-w-0">
                        {/* Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-indigo-200" />
                                <span className="text-sm font-semibold">Generated Output Preview</span>
                            </div>
                            <button
                                onClick={handleCopy}
                                disabled={!output}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-medium rounded-lg transition-all border border-white/10"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>

                        <div className="p-5 space-y-4 flex-1 flex flex-col">
                            {/* Output Display Container */}
                            <div className="relative flex-1 min-w-0">
                                <textarea
                                    readOnly
                                    value={output}
                                    placeholder="Generated placeholder text will appear here..."
                                    className="w-full h-[320px] p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-800 focus:outline-none resize-none leading-relaxed min-w-0"
                                />
                            </div>

                            {/* Dynamic Performance Metrics */}
                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                        Word Count
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">{wordCount}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                        Characters
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">{charCount}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                        Data Size
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">{formatBytes(byteSize)}</p>
                                </div>
                            </div>

                            {/* Copy CTA Button */}
                            <button
                                onClick={handleCopy}
                                disabled={!output}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${copied
                                    ? "bg-green-600 text-white shadow-md shadow-green-100"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied to Clipboard!" : "Copy Generated Text"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT (EXPANDED HIGH-VALUE SEO CARDS)
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-6">
                {/* Card 1: Comprehensive Definition & Core Concepts */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Understanding Lorem Ipsum: Definitions & Technical Role</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            <strong>Lorem Ipsum</strong> (also referred to as <em>dummy text</em>, <em>placeholder text</em>, or <em>blind text</em>) is a standardized pseudo-Latin text sequence used across print, publishing, web design, and digital product development. Its core architectural purpose is to act as a visual substitute for real copy during layout, typographic selection, and structural prototyping.
                        </p>
                        <p>
                            By utilizing pseudo-Latin phrasing that approximates the character distribution, word length variance, and structural rhythm of standard written English, software architects and UI designers can evaluate layout balance without reviewers becoming distracted by readable content.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 pt-2">
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Typographic Neutrality
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Prevents cognitive bias toward editorial wording, forcing stakeholders to evaluate font weight, line-height (leading), kerning, and visual spatial relationships.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Natural Character Frequency
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Unlike repetitive strings (&quot;text text text&quot;), standard Lorem Ipsum mirrors normal English letter frequencies (e.g., vowels vs. consonants), producing authentic visual density.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Cross-Platform Consistency
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Provides a universally understood benchmark across desktop publishing (InDesign, QuarkXPress), Figma design systems, React prototypes, and CMS staging environments.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Historical Timeline & Origin */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Historical Timeline: From Cicero to Digital Web Utilities</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Although dummy text feels like a modern invention of digital UI design, its roots extend back over two millennia to classical antiquity.
                    </p>
                    <div className="space-y-4 pt-2">
                        {[
                            {
                                era: "45 BC",
                                title: "Cicero's Philosophical Treatise",
                                description: "Marcus Tullius Cicero writes 'De Finibus Bonorum et Malorum' (The Extremes of Good and Evil), an ethical treatise on Stoicism, Epicureanism, and Hedonism. The modern text is derived from Sections 1.10.32 and 1.10.33."
                            },
                            {
                                era: "1500s",
                                title: "The Printing Press Revolution",
                                description: "An unknown Renaissance typesetter scrambles a galley of Cicero's Latin text to create a specimen book displaying type fonts. Removing key letters transformed real philosophical discourse into non-meaningful dummy copy."
                            },
                            {
                                era: "1960s",
                                title: "Letraset Dry-Transfer Sheets",
                                description: "The advertising and publishing industries widely adopt self-adhesive Letraset sheets containing pre-printed Lorem Ipsum passages, allowing graphic artists to rub dummy text directly onto physical artboards."
                            },
                            {
                                era: "1980s",
                                title: "Desktop Publishing (Aldus PageMaker)",
                                description: "Aldus Corporation integrates built-in Lorem Ipsum generators into PageMaker software (later acquired by Adobe), embedding pseudo-Latin generation directly into digital publishing workflows."
                            },
                            {
                                era: "Present",
                                title: "Client-Side Browser Native Engines",
                                description: "Modern React and Next.js platforms leverage high-speed client-side generation engines with multi-theme dictionaries, HTML markup injection, and sub-millisecond execution."
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-mono text-xs font-bold flex-shrink-0">
                                    {item.era}
                                </span>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                                    <p className="text-slate-600 text-xs md:text-sm mt-0.5 leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 3: Comparison Matrix Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Placeholder Text Vocabulary & Industry Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct generator vocabulary theme aligns the prototype tone with the target target audience and brand identity during early design reviews:
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                                    <th className="p-3 font-semibold">Theme Mode</th>
                                    <th className="p-3 font-semibold">Corpus Source</th>
                                    <th className="p-3 font-semibold">Ideal Use Cases</th>
                                    <th className="p-3 font-semibold">Visual Tone & Vibe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                                <tr>
                                    <td className="p-3 font-semibold text-indigo-600">Classic Latin</td>
                                    <td className="p-3">Cicero (45 BC)</td>
                                    <td className="p-3">Enterprise Software, Legal & Financial Tech</td>
                                    <td className="p-3">Formal, Traditional, Standard</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-indigo-600">Hipster</td>
                                    <td className="p-3">Modern Urban Jargon</td>
                                    <td className="p-3">Direct-to-Consumer, Lifestyle, Fashion, Artisanal Branding</td>
                                    <td className="p-3">Trendy, Casual, Quirky</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-indigo-600">Pirate</td>
                                    <td className="p-3">Nautical & Buccaneer Lexicon</td>
                                    <td className="p-3">Gaming Apps, Children&apos;s Media, Entertainment Sites</td>
                                    <td className="p-3">Playful, Energetic, Humorous</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-indigo-600">Tech / Dev</td>
                                    <td className="p-3">DevOps & Cloud Terminology</td>
                                    <td className="p-3">SaaS Dashboards, Developer Docs, API Interfaces</td>
                                    <td className="p-3">Technical, Modern, High-Tech</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 4: How Generator Logic Works (Code & Structural Workflow) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Technical Architecture: How Client-Side Text Generation Works</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unlike legacy web utilities that perform blocking network HTTP requests to generate dummy copy, our browser-native generator relies on a deterministic client-side execution loop:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Terminal className="w-4 h-4" />
                                1. Dictionary Mapping & Lexical Selection
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Depending on the user&apos;s active theme selection, a dictionary array is loaded into local memory. A pseudo-random index selector draws words from the curated dictionary array to construct sentences ranging from 6 to 14 words.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Code2 className="w-4 h-4" />
                                2. Structural Assembly & Markup Formatting
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Sentences are grouped into paragraphs containing 4 to 7 sentences each. If HTML export is toggled, the engine automatically wraps string nodes inside clean structural markup like <code className="text-indigo-600">&lt;p&gt;</code> or <code className="text-indigo-600">&lt;ul&gt;&lt;li&gt;</code> tags.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Zap className="w-4 h-4" />
                                3. Non-Blocking React Transitions
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Text generation is wrapped inside React&apos;s concurrent <code className="text-indigo-600">useTransition</code> hook, guaranteeing that UI rendering and control input sliders remain responsive even when generating large text blocks up to 1,000 units.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Globe className="w-4 h-4" />
                                4. Byte Encoding & Real-Time Metrics
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The generated string is sanitized and measured using the browser&apos;s native <code className="text-indigo-600">TextEncoder</code> API, calculating word count, character count, and raw byte payload footprint instantaneously.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 5: Frequently Asked Questions (Static Border-Highlighted Cards) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions & Expert Guidance</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base mb-2">
                                What does &quot;Lorem ipsum dolor sit amet&quot; translate to in English?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                It translates roughly to &quot;Pain itself is love, care, and main processing.&quot; Because the original 1500s typesetter scrambled and truncated Cicero&apos;s Latin prose, the resulting text intentionally lacks coherent grammatical syntax in modern or classical Latin.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base mb-2">
                                Is generated text from this tool royalty-free for commercial projects?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. All generated text outputs from TwisterTools are 100% public domain and royalty-free. You can freely use generated outputs in client production work, commercial mockups, mobile apps, marketing brochures, and template designs without attribution.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base mb-2">
                                Why should I use HTML markup export?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Enabling the HTML Markup toggle wraps paragraph output in standard <code>&lt;p&gt;</code> elements and lists in <code>&lt;ul&gt;&lt;li&gt;</code> elements. This saves frontend developers and content managers from manually formatting tags when pasting sample copy directly into codebases or CMS rich-text editors.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base mb-2">
                                Is my data safe while using this online generator?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Absolutely. TwisterTools operates on a zero-server computation architecture. Text generation, word counts, and HTML formatting execute entirely within your browser&apos;s local JavaScript runtime. No configuration data or generated copy is sent to external servers or remote endpoints.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 6: Client-Side Security & Engine Performance */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Client-Side Privacy Guarantee & Performance Standard</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        At TwisterTools, performance and privacy are core engineering priorities. Our text generation engine operates completely inside your client browser environment without tracking cookies or remote logging. By eliminating network latency, generation occurs near-instantaneously, delivering high-speed execution for developers, designers, and creators worldwide.
                    </p>
                </div>
            </section>

            {/* JSON-LD Structured Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Lorem Ipsum Placeholder Text Generator",
                        url: "https://twistertools.com/tools/text-tools/lorem-ipsum-generator",
                        applicationCategory: "DeveloperApplication",
                        operatingSystem: "All",
                        description:
                            "Generate custom Lorem Ipsum dummy placeholder text with paragraph, sentence, word, and list options across Latin, Hipster, Pirate, and Tech themes with HTML export capabilities.",
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
                                name: "What does 'Lorem ipsum dolor sit amet' translate to?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "It translates roughly to 'Pain itself is love, care, and main processing', originating from Cicero's 45 BC literature.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Is the generated text royalty-free for commercial use?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, all outputs are 100% public domain and free for commercial applications.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why should I use HTML markup export?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Enabling HTML export automatically formats output with structural tags like <p> and <ul>, making copy ready for codebases and CMS editors.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Is my data safe while using this online generator?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, all processing occurs 100% client-side in your web browser with zero server data collection.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}