"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    Sparkles,
    RotateCw,
    Copy,
    Check,
    Download,
    RefreshCw,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Layers,
    BarChart3,
    Dice5,
    Sliders,
    FileSpreadsheet,
    ListOrdered,
    Settings2,
    Lightbulb,
    CheckCircle2,
    Globe2,
    Binary
} from "lucide-react";

// Alphabet Presets
type AlphabetPreset = "latin-en" | "greek" | "cyrillic" | "hebrew" | "arabic" | "custom";
type CasingMode = "uppercase" | "lowercase" | "mixed";
type SelectionMode = "with-replacement" | "without-replacement";

interface LetterItem {
    char: string;
    index: number;
    category: "vowel" | "consonant" | "symbol";
}

interface AlphabetConfig {
    id: AlphabetPreset;
    name: string;
    script: string;
    letters: string[];
    vowels: string[];
}

const ALPHABET_DEFINITIONS: Record<Exclude<AlphabetPreset, "custom">, AlphabetConfig> = {
    "latin-en": {
        id: "latin-en",
        name: "Latin / English (A–Z)",
        script: "Latin",
        letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
        vowels: ["A", "E", "I", "O", "U"],
    },
    greek: {
        id: "greek",
        name: "Greek (Α–Ω)",
        script: "Hellenic",
        letters: "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ".split(""),
        vowels: ["Α", "Ε", "Η", "Ι", "Ο", "Υ", "Ω"],
    },
    cyrillic: {
        id: "cyrillic",
        name: "Cyrillic / Russian (А–Я)",
        script: "Cyrillic",
        letters: "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split(""),
        vowels: ["А", "Е", "Ё", "И", "О", "У", "Ы", "Э", "Ю", "Я"],
    },
    hebrew: {
        id: "hebrew",
        name: "Hebrew (א–ת)",
        script: "Hebrew",
        letters: "אבגדהוזחטיכלמנסעפצקרשת".split(""),
        vowels: [], // Consonantal alphabet (Abjad)
    },
    arabic: {
        id: "arabic",
        name: "Arabic (أ–ي)",
        script: "Arabic",
        letters: "ابتثجحخدذرزسشصضطظعغفقكلمنهوي".split(""),
        vowels: ["ا", "و", "ي"],
    },
};

interface HistoryRecord {
    id: string;
    timestamp: string;
    letters: string[];
    count: number;
    preset: string;
    mode: SelectionMode;
}

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    maxLimit: number = 10000
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) {
        setter(0);
    } else {
        setter(Math.min(maxLimit, Math.max(0, num)));
    }
};

// Cryptographically secure integer within [0, range - 1] avoiding modulo bias
function getSecureRandomInt(range: number): number {
    if (range <= 1) return 0;
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);
    const buffer = new Uint32Array(1);

    while (true) {
        crypto.getRandomValues(buffer);
        if (buffer[0] < limit) {
            return buffer[0] % range;
        }
    }
}

export default function RandomLetterPicker() {
    // Alphabet & Filtering State
    const [selectedPreset, setSelectedPreset] = useState<AlphabetPreset>("latin-en");
    const [customSetInput, setCustomSetInput] = useState<string>("A, B, C, D, E, F, G");
    const [excludeVowels, setExcludeVowels] = useState<boolean>(false);
    const [excludeConsonants, setExcludeConsonants] = useState<boolean>(false);
    const [excludedCharsInput, setExcludedCharsInput] = useState<string>("");
    const [casingMode, setCasingMode] = useState<CasingMode>("uppercase");
    const [selectionMode, setSelectionMode] = useState<SelectionMode>("with-replacement");
    const [pickCount, setPickCount] = useState<number>(1);

    // Results & Animation State
    const [pickedResults, setPickedResults] = useState<LetterItem[]>([]);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [animatingLetters, setAnimatingLetters] = useState<string[]>(["A"]);
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"results" | "stats" | "pool">("results");
    const [separator, setSeparator] = useState<string>(", ");

    const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Compute Eligible Character Pool
    const activePool = useMemo(() => {
        let baseList: string[] = [];
        let vowelsSet = new Set<string>();

        if (selectedPreset === "custom") {
            const rawTokens = customSetInput
                .split(/[\s,;|]+/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            baseList = Array.from(new Set(rawTokens));
            vowelsSet = new Set(["A", "E", "I", "O", "U", "a", "e", "i", "o", "u"]);
        } else {
            const presetData = ALPHABET_DEFINITIONS[selectedPreset];
            baseList = [...presetData.letters];
            vowelsSet = new Set(presetData.vowels.map((v) => v.toUpperCase()));
        }

        // Parse user-specified excluded characters
        const excludedUserChars = new Set(
            excludedCharsInput
                .split(/[\s,;|]+/)
                .map((s) => s.trim().toUpperCase())
                .filter((s) => s.length > 0)
        );

        let filtered = baseList.filter((char) => {
            const upper = char.toUpperCase();
            if (excludedUserChars.has(upper)) return false;

            const isVowel = vowelsSet.has(upper);
            if (excludeVowels && isVowel) return false;
            if (excludeConsonants && !isVowel) return false;

            return true;
        });

        // Apply Casing Mode
        filtered = filtered.map((char) => {
            if (casingMode === "uppercase") return char.toUpperCase();
            if (casingMode === "lowercase") return char.toLowerCase();
            return char; // Mixed/As-is
        });

        return Array.from(new Set(filtered));
    }, [
        selectedPreset,
        customSetInput,
        excludeVowels,
        excludeConsonants,
        excludedCharsInput,
        casingMode,
    ]);

    // Active Pool Categorization Metrics
    const poolMetrics = useMemo(() => {
        const vowels = ["A", "E", "I", "O", "U", "Α", "Ε", "Η", "Ι", "Ο", "Υ", "Ω", "А", "Е", "Ё", "И", "О", "У", "Ы", "Э", "Ю", "Я", "ا", "و", "ي"];
        const vowelsSet = new Set(vowels.map((v) => v.toUpperCase()));

        let vowelCount = 0;
        let consonantCount = 0;

        activePool.forEach((c) => {
            if (vowelsSet.has(c.toUpperCase())) {
                vowelCount++;
            } else {
                consonantCount++;
            }
        });

        return {
            total: activePool.length,
            vowelCount,
            consonantCount,
            vowelRatio: activePool.length > 0 ? (vowelCount / activePool.length) * 100 : 0,
            consonantRatio: activePool.length > 0 ? (consonantCount / activePool.length) * 100 : 0,
        };
    }, [activePool]);

    // Cleanup animation interval on unmount
    useEffect(() => {
        return () => {
            if (animationTimerRef.current) clearInterval(animationTimerRef.current);
        };
    }, []);

    // Core Secure Picker Engine
    const handlePickLetters = () => {
        if (activePool.length === 0 || pickCount <= 0 || isAnimating) return;

        const effectiveCount =
            selectionMode === "without-replacement"
                ? Math.min(pickCount, activePool.length)
                : Math.min(pickCount, 1000);

        setIsAnimating(true);

        // Flash slot-machine shuffle animation
        let ticks = 0;
        const totalTicks = 12;
        if (animationTimerRef.current) clearInterval(animationTimerRef.current);

        animationTimerRef.current = setInterval(() => {
            ticks++;
            const randomPreview = Array.from({ length: Math.min(effectiveCount, 6) }, () => {
                const idx = Math.floor(Math.random() * activePool.length);
                return activePool[idx];
            });
            setAnimatingLetters(randomPreview);

            if (ticks >= totalTicks) {
                if (animationTimerRef.current) clearInterval(animationTimerRef.current);

                // Perform True Cryptographic Extraction
                const chosenTokens: string[] = [];
                const vowels = ["A", "E", "I", "O", "U", "Α", "Ε", "Η", "Ι", "Ο", "Υ", "Ω", "А", "Е", "Ё", "И", "О", "У", "Ы", "Э", "Ю", "Я", "ا", "و", "ي"];
                const vowelsSet = new Set(vowels.map((v) => v.toUpperCase()));

                if (selectionMode === "without-replacement") {
                    // Fisher-Yates Modern Cryptographic Partial Shuffle
                    const deck = [...activePool];
                    for (let i = 0; i < effectiveCount; i++) {
                        const swapIdx = i + getSecureRandomInt(deck.length - i);
                        const temp = deck[i];
                        deck[i] = deck[swapIdx];
                        deck[swapIdx] = temp;
                        chosenTokens.push(deck[i]);
                    }
                } else {
                    // Selection with Replacement
                    for (let i = 0; i < effectiveCount; i++) {
                        const randIdx = getSecureRandomInt(activePool.length);
                        let token = activePool[randIdx];
                        if (casingMode === "mixed") {
                            const isUpper = getSecureRandomInt(2) === 1;
                            token = isUpper ? token.toUpperCase() : token.toLowerCase();
                        }
                        chosenTokens.push(token);
                    }
                }

                const finalItems: LetterItem[] = chosenTokens.map((char, idx) => ({
                    char,
                    index: idx + 1,
                    category: vowelsSet.has(char.toUpperCase()) ? "vowel" : "consonant",
                }));

                setPickedResults(finalItems);
                setIsAnimating(false);

                // Add to History
                const record: HistoryRecord = {
                    id: `draw-${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString(),
                    letters: chosenTokens,
                    count: chosenTokens.length,
                    preset: selectedPreset === "custom" ? "Custom Pool" : ALPHABET_DEFINITIONS[selectedPreset].name,
                    mode: selectionMode,
                };
                setHistory((prev) => [record, ...prev].slice(0, 50));
            }
        }, 45);
    };

    const handleReset = () => {
        setSelectedPreset("latin-en");
        setCustomSetInput("A, B, C, D, E, F, G");
        setExcludeVowels(false);
        setExcludeConsonants(false);
        setExcludedCharsInput("");
        setCasingMode("uppercase");
        setSelectionMode("with-replacement");
        setPickCount(1);
        setPickedResults([]);
        setHistory([]);
    };

    const handleCopyResults = () => {
        if (pickedResults.length === 0) return;
        const textToCopy = pickedResults.map((item) => item.char).join(separator);
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCSV = () => {
        if (pickedResults.length === 0) return;
        const headers = ["Index", "Character", "Category", "Script Preset", "Mode"];
        const rows = pickedResults.map((item) => [
            item.index,
            `"${item.char}"`,
            item.category,
            selectedPreset,
            selectionMode,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `random_letters_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Frequency Distribution Calculation for Current Draw
    const resultStats = useMemo(() => {
        if (pickedResults.length === 0) return null;
        const freqMap: Record<string, number> = {};
        let vowelCount = 0;
        let consonantCount = 0;

        pickedResults.forEach((item) => {
            freqMap[item.char] = (freqMap[item.char] || 0) + 1;
            if (item.category === "vowel") vowelCount++;
            else consonantCount++;
        });

        const sortedFreq = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
        const uniqueCount = Object.keys(freqMap).length;

        return {
            total: pickedResults.length,
            uniqueCount,
            vowelCount,
            consonantCount,
            vowelPct: (vowelCount / pickedResults.length) * 100,
            consonantPct: (consonantCount / pickedResults.length) * 100,
            sortedFreq,
        };
    }, [pickedResults]);

    // Structured JSON-LD Data for SEO
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Letter & Alphabet Picker (A-Z)",
        "url": "https://twistertools.com/tools/random-tools/random-letter-picker",
        "description": "Cryptographically secure random letter and alphabet generator supporting English, Greek, Cyrillic, Hebrew, and custom alphabets. Includes replacement options, vowel/consonant filtering, and batch exports.",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
        },
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How does the Random Letter Picker ensure true mathematical fairness?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses the browser-native Web Cryptography API (window.crypto.getRandomValues) combined with rejection-sampling modulo bias prevention. Unlike Math.random(), which is pseudo-random and repeats patterns, cryptographic entropy produces statistically unbiased, uniform letter selections.",
                },
            },
            {
                "@type": "Question",
                "name": "What is the difference between selection With Replacement and Without Replacement?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "With Replacement permits individual letters to be picked repeatedly across multiple draws, modeling independent Bernoulli/multinomial trials. Without Replacement guarantees unique letters per draw by removing selected items from the pool using a cryptographic Fisher-Yates shuffle algorithm.",
                },
            },
            {
                "@type": "Question",
                "name": "Can I pick random letters from non-English alphabets or custom character sets?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can select native presets for Greek (Α-Ω), Cyrillic (А-Я), Hebrew (א-ת), and Arabic (أ-ي), or input your own custom delimiter-separated character strings, phonemes, numbers, or symbols.",
                },
            },
            {
                "@type": "Question",
                "name": "How are vowels and consonants filtered during letter generation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When vowel or consonant exclusion is toggled, the active sampling pool is dynamically sanitized before cryptographic index generation. The selection engine calculates probabilities strictly across the reduced subset size.",
                },
            },
            {
                "@type": "Question",
                "name": "What is the maximum number of random letters I can generate at once?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In With Replacement mode, you can generate up to 1,000 letters simultaneously in milliseconds. In Without Replacement mode, the maximum pick count is strictly bounded by the total size of your filtered character pool.",
                },
            },
        ],
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Trigger Engine */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Pool Configuration
                            </h2>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    Pool Size: {activePool.length}
                                </span>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                                    title="Reset all settings to default"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Reset</span>
                                </button>
                            </div>
                        </div>

                        {/* Alphabet Preset Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Globe2 className="w-4 h-4 text-indigo-600" />
                                Alphabet Script Preset
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(
                                    [
                                        { id: "latin-en", label: "English (A–Z)" },
                                        { id: "greek", label: "Greek (Α–Ω)" },
                                        { id: "cyrillic", label: "Cyrillic (А–Я)" },
                                        { id: "hebrew", label: "Hebrew (א–ת)" },
                                        { id: "arabic", label: "Arabic (أ–ي)" },
                                        { id: "custom", label: "Custom Pool" },
                                    ] as { id: AlphabetPreset; label: string }[]
                                ).map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => setSelectedPreset(preset.id)}
                                        className={`py-2 px-3 text-xs font-bold rounded-xl transition border text-left truncate cursor-pointer ${
                                            selectedPreset === preset.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Pool Text Input (If Custom is active) */}
                        {selectedPreset === "custom" && (
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Custom Character Set (Comma or Space Separated)
                                </label>
                                <textarea
                                    value={customSetInput}
                                    onChange={(e) => setCustomSetInput(e.target.value)}
                                    rows={3}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white resize-none"
                                    placeholder="e.g. A, B, C, X, Y, Z, 1, 2, 3"
                                />
                            </div>
                        )}

                        {/* Filters & Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Vowel / Consonant Filter
                                </span>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={excludeVowels}
                                            onChange={(e) => {
                                                setExcludeVowels(e.target.checked);
                                                if (e.target.checked) setExcludeConsonants(false);
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span>Exclude Vowels</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={excludeConsonants}
                                            onChange={(e) => {
                                                setExcludeConsonants(e.target.checked);
                                                if (e.target.checked) setExcludeVowels(false);
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span>Exclude Consonants</span>
                                    </label>
                                </div>
                            </div>

                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Letter Casing
                                </span>
                                <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                                    {(["uppercase", "lowercase", "mixed"] as CasingMode[]).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setCasingMode(mode)}
                                            className={`py-1.5 text-[11px] font-bold rounded capitalize transition cursor-pointer ${
                                                casingMode === mode
                                                    ? "bg-white text-indigo-600 shadow-xs"
                                                    : "text-slate-600 hover:text-slate-900"
                                            }`}
                                        >
                                            {mode === "mixed" ? "Mix" : mode.slice(0, 5)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Excluded Specific Characters Input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Specific Letters to Exclude
                            </label>
                            <input
                                type="text"
                                value={excludedCharsInput}
                                onChange={(e) => setExcludedCharsInput(e.target.value)}
                                placeholder="e.g. Q, X, Z (separated by comma or space)"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                            />
                        </div>

                        {/* Draw Mode & Quantity Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Selection Mode
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setSelectionMode("with-replacement")}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer text-center truncate ${
                                            selectionMode === "with-replacement"
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Replacement
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectionMode("without-replacement")}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer text-center truncate ${
                                            selectionMode === "without-replacement"
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        Unique (No Rep.)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Letters Count
                                    </label>
                                    {selectionMode === "without-replacement" && (
                                        <span className="text-[11px] text-amber-600 font-semibold">
                                            Max: {activePool.length}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectionMode === "without-replacement" ? activePool.length : 1000}
                                        value={pickCount === 0 ? "" : pickCount}
                                        onChange={(e) =>
                                            handleNumberInput(
                                                e,
                                                setPickCount,
                                                selectionMode === "without-replacement" ? activePool.length : 1000
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        placeholder="Count"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Presets for Pick Count */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400 mr-1">Quick:</span>
                            {[1, 3, 5, 10, 26].map((num) => {
                                const isDisabled =
                                    selectionMode === "without-replacement" && num > activePool.length;
                                return (
                                    <button
                                        key={num}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => setPickCount(num)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold border transition cursor-pointer ${
                                            pickCount === num
                                                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                        }`}
                                    >
                                        {num} {num === 1 ? "Letter" : "Letters"}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 border-t border-slate-100 space-y-3">
                        <button
                            onClick={handlePickLetters}
                            disabled={isAnimating || activePool.length === 0 || pickCount <= 0}
                            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <RotateCw className={`w-5 h-5 ${isAnimating ? "animate-spin" : ""}`} />
                            {isAnimating ? "Selecting Random Letters..." : `Generate ${pickCount} Random ${pickCount === 1 ? "Letter" : "Letters"}`}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output Stage, Analysis & Export */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Dice5 className="w-5 h-5 text-indigo-600" />
                                Output Workspace
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                {(
                                    [
                                        { id: "results", label: "Results" },
                                        { id: "stats", label: "Analytics" },
                                        { id: "pool", label: "Pool Grid" },
                                    ] as { id: "results" | "stats" | "pool"; label: string }[]
                                ).map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                                            activeTab === tab.id
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Large Result Viewer */}
                        {activeTab === "results" && (
                            <div className="space-y-4">
                                {isAnimating ? (
                                    <div className="min-h-[220px] p-6 bg-slate-50 rounded-2xl border border-dashed border-indigo-200 flex flex-col items-center justify-center space-y-3">
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {animatingLetters.map((char, idx) => (
                                                <span
                                                    key={idx}
                                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center animate-bounce shadow-md"
                                                >
                                                    {char}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider animate-pulse">
                                            Executing Web Crypto Sampling...
                                        </p>
                                    </div>
                                ) : pickedResults.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="min-h-[220px] max-h-[320px] overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                            <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                                                {pickedResults.map((item) => (
                                                    <div
                                                        key={`${item.index}-${item.char}`}
                                                        className="group relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-sm transition"
                                                    >
                                                        <span className="text-xl sm:text-2xl font-black text-slate-900">
                                                            {item.char}
                                                        </span>
                                                        <span
                                                            className={`text-[9px] font-bold uppercase tracking-tight ${
                                                                item.category === "vowel"
                                                                    ? "text-indigo-600"
                                                                    : "text-slate-400"
                                                            }`}
                                                        >
                                                            #{item.index}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Output Delimiter Selector */}
                                        <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                            <span className="font-bold text-slate-600">Separator Format:</span>
                                            <div className="flex gap-1">
                                                {[
                                                    { label: "Comma", val: ", " },
                                                    { label: "Space", val: " " },
                                                    { label: "None", val: "" },
                                                    { label: "Newline", val: "\n" },
                                                ].map((sep) => (
                                                    <button
                                                        key={sep.label}
                                                        type="button"
                                                        onClick={() => setSeparator(sep.val)}
                                                        className={`px-2 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                                            separator === sep.val
                                                                ? "bg-indigo-600 text-white"
                                                                : "bg-white text-slate-600 border border-slate-200"
                                                        }`}
                                                    >
                                                        {sep.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="min-h-[220px] p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800">No Letters Picked Yet</h3>
                                        <p className="text-xs text-slate-500 max-w-xs">
                                            Click the button on the left to draw random characters from your active pool using cryptographic entropy.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Statistical Analytics Tab */}
                        {activeTab === "stats" && (
                            <div className="space-y-4">
                                {resultStats ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Drawn</span>
                                                <span className="text-lg font-black text-slate-900">{resultStats.total}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Unique Letters</span>
                                                <span className="text-lg font-black text-indigo-600">{resultStats.uniqueCount}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Vowels</span>
                                                <span className="text-lg font-black text-slate-900">
                                                    {resultStats.vowelCount} ({resultStats.vowelPct.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Consonants</span>
                                                <span className="text-lg font-black text-slate-900">
                                                    {resultStats.consonantCount} ({resultStats.consonantPct.toFixed(0)}%)
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                                Draw Frequency Breakdown
                                            </span>
                                            <div className="max-h-[140px] overflow-y-auto flex flex-wrap gap-2">
                                                {resultStats.sortedFreq.map(([char, count]) => (
                                                    <span
                                                        key={char}
                                                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5"
                                                    >
                                                        <span className="text-indigo-600 font-extrabold">{char}</span>
                                                        <span className="text-slate-400 text-[10px]">×{count}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                                        Generate a letter sequence to view statistical distribution metrics.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Active Pool Overview Tab */}
                        {activeTab === "pool" && (
                            <div className="space-y-3">
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex justify-between items-center">
                                    <span>Pool: <strong>{activePool.length} characters</strong></span>
                                    <span>Vowels: <strong>{poolMetrics.vowelCount}</strong> | Consonants: <strong>{poolMetrics.consonantCount}</strong></span>
                                </div>
                                <div className="max-h-[220px] overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1.5">
                                    {activePool.map((char, idx) => (
                                        <span
                                            key={`${char}-${idx}`}
                                            className="w-7 h-7 bg-white rounded-md border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-center shadow-2xs"
                                        >
                                            {char}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Utility Actions */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={handleCopyResults}
                            disabled={pickedResults.length === 0}
                            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy Letters"}
                        </button>
                        <button
                            onClick={handleDownloadCSV}
                            disabled={pickedResults.length === 0}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Below-The-Fold Structured SEO Content Cards */}
            <div className="space-y-6">
                {/* Card 1: Mathematical Foundations & Uniform Probability */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations: Discrete Uniform Probability in Alphabet Selection
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Random letter extraction is governed by the mathematics of <strong>discrete uniform distributions</strong> over finite sets. When drawing from a standard Latin alphabet containing $N = 26$ elements, the theoretical probability $P(X = x)$ of selecting any individual letter in a fair, unbiased system is strictly equal:
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        {"$$P(X = x) = \\frac{1}{N} = \\frac{1}{26} \\approx 0.0384615 \\text{ (3.846%)}$$"}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Binary className="w-4 h-4 text-indigo-600" /> Sampling With Replacement
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                In sampling with replacement, the alphabet pool size remains invariant ($N$) after each draw. The total number of unique strings of length $k$ that can be formed equals $N^k$. The probability of picking an exact ordered sequence is:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                P(S) = (1 / N)^k = (1 / 26)^k
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Layers className="w-4 h-4 text-indigo-600" /> Sampling Without Replacement
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                When duplicate letters are barred, every draw diminishes the pool size by one. The total number of distinct $k$-letter permutations drawn from $N$ items corresponds to the partial permutation formula:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                P(N, k) = N! / (N - k)!
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Cryptographic Hardware Entropy vs PRNG */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Cryptographic Web Crypto API vs Standard Pseudo-Randomness
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Standard browser random utilities rely on software pseudo-random number generators (PRNGs) like <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono">Math.random()</code>, which typically implement the Xoroshiro128+ algorithm. While fast, PRNGs are deterministic, periodic, and susceptible to algorithmic bias when mapped to discrete alphabet arrays via basic modulo arithmetic.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Feature</th>
                                    <th className="p-3">Standard Math.random()</th>
                                    <th className="p-3">TwisterTools Web Crypto API</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Entropy Source</td>
                                    <td className="p-3 text-amber-700 font-mono">Internal Clock Seed (PRNG)</td>
                                    <td className="p-3 text-emerald-700 font-bold font-mono">Hardware OS System Entropy (CSPRNG)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Modulo Bias Protection</td>
                                    <td className="p-3 text-slate-600">None (Skewed upper boundaries)</td>
                                    <td className="p-3 text-indigo-600 font-bold">Full Rejection-Sampling Elimination</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Cryptographic Security</td>
                                    <td className="p-3 text-red-600">No (Predictable sequences)</td>
                                    <td className="p-3 text-emerald-600 font-bold">Yes (FIPS 140-2 / RFC 4086 Compliant)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Shuffling Algorithm</td>
                                    <td className="p-3 text-slate-600">Naive Array Sort (O(n log n) biased)</td>
                                    <td className="p-3 text-indigo-600 font-bold">Modern Fisher-Yates CSPRNG (O(n) unbiased)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: International Alphabet Presets Reference */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Globe2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Supported International Alphabets & Character Matrices
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Our engine natively supports the most prevalent phonetic and orthographic writing systems across the world:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Latin Script (English)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                26 letters (5 vowels, 21 consonants). Forms the orthographic foundation of English, Spanish, French, German, and hundreds of global languages.
                            </p>
                            <span className="text-[11px] font-mono text-indigo-600 block bg-white p-1.5 rounded border border-slate-200">
                                A, B, C, D ... X, Y, Z
                            </span>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Greek Alphabet</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                24 letters (7 vowels, 17 consonants). Essential for mathematical notations, scientific physics formulas, statistics, and academic research.
                            </p>
                            <span className="text-[11px] font-mono text-indigo-600 block bg-white p-1.5 rounded border border-slate-200">
                                Α, Β, Γ, Δ ... Ψ, Ω
                            </span>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Cyrillic Script</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                33 letters (10 vowels, 21 consonants, 2 signs). Standard writing system across Eastern Europe and Slavic languages.
                            </p>
                            <span className="text-[11px] font-mono text-indigo-600 block bg-white p-1.5 rounded border border-slate-200">
                                А, Б, В, Г ... Ю, Я
                            </span>
                        </div>
                    </div>
                </section>

                {/* Card 4: Practical Real-World Use Cases */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Real-World Applications & Use Cases
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Classroom Games & Word Puzzles
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Ideal for word board games like Scrabble, Scattergories, Boggle, and classroom spelling bees. Generate unbiased starting letters instantly without physical dice.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Linguistic & Orthographic Sampling
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Phonetic researchers and computational linguists use randomized character extractions to benchmark natural language processing (NLP) tokenizers and test text-generation models.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Cryptographic Salting & Password Testing
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Developers can generate random non-sequential letter sequences to test input validation, regex sanitization patterns, and mock user verification tokens.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Creative Writing Prompts & Brainstorming
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Overcome creative block by selecting random letters for alliterative prose challenges, naming fictional characters, or establishing constrained poetry structures.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
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
                                How does the Random Letter Picker ensure true mathematical fairness?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool uses the browser-native Web Cryptography API (<code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">crypto.getRandomValues</code>) combined with rejection-sampling modulo bias prevention. Unlike standard <code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">Math.random()</code>, which is pseudo-random and repeats patterns, cryptographic entropy produces statistically unbiased, uniform letter selections.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between selection With Replacement and Without Replacement?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                With Replacement permits individual letters to be picked repeatedly across multiple draws, modeling independent Bernoulli/multinomial trials. Without Replacement guarantees unique letters per draw by removing selected items from the pool using a cryptographic Fisher-Yates shuffle algorithm.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I pick random letters from non-English alphabets or custom character sets?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can select native presets for Greek (Α–Ω), Cyrillic (А–Я), Hebrew (א–ת), and Arabic (أ–ي), or input your own custom delimiter-separated character strings, phonemes, numbers, or symbols.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are vowels and consonants filtered during letter generation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When vowel or consonant exclusion is toggled, the active sampling pool is dynamically sanitized before cryptographic index generation. The selection engine calculates probabilities strictly across the reduced subset size.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the maximum number of random letters I can generate at once?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In With Replacement mode, you can generate up to 1,000 letters simultaneously in milliseconds. In Without Replacement mode, the maximum pick count is strictly bounded by the total size of your filtered character pool.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}