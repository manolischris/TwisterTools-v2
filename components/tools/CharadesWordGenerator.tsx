"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Sparkles,
    Copy,
    Check,
    Play,
    Pause,
    RotateCcw,
    SlidersHorizontal,
    Lightbulb,
    HelpCircle,
    BookOpen,
    Eye,
    EyeOff,
    Trophy,
    Gamepad2,
    Users,
    Volume2,
    VolumeX,
    Flame,
    Zap,
    Tag,
    ListFilter,
    ShieldCheck,
    Timer,
    Shuffle
} from "lucide-react";

import {
    CHARADES_WORD_DATABASE,
    WordItem,
    DifficultyLevel,
    CategoryType
} from "@/data/charades-words";

export default function CharadesWordGenerator() {
    // Selection Filters
    const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("all");

    // Word Deck & Presentation
    const [currentCard, setCurrentCard] = useState<WordItem>(CHARADES_WORD_DATABASE[0]);
    const [history, setHistory] = useState<WordItem[]>([]);
    const [isWordHidden, setIsWordHidden] = useState<boolean>(false);
    const [showHint, setShowHint] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    // Timer & Countdown State
    const [timerDuration, setTimerDuration] = useState<number>(60);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

    // Team Scoreboard State
    const [teamAScore, setTeamAScore] = useState<number>(0);
    const [teamBScore, setTeamBScore] = useState<number>(0);
    const [activeTeam, setActiveTeam] = useState<"A" | "B">("A");

    // Custom Word Injection
    const [customWordInput, setCustomWordInput] = useState<string>("");
    const [customCategoryInput, setCustomCategoryInput] = useState<Exclude<CategoryType, "all">>("actions");
    const [customDifficultyInput, setCustomDifficultyInput] = useState<Exclude<DifficultyLevel, "all">>("medium");
    const [customDeck, setCustomDeck] = useState<WordItem[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Audio beep synthesis using Web Audio API
    const playBeep = (freq = 600, duration = 0.15) => {
        if (!soundEnabled || typeof window === "undefined") return;
        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = "sine";
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch {
            // AudioContext not permitted or muted
        }
    };

    // Filter combined word database
    const pool = useMemo(() => {
        const fullList = [...CHARADES_WORD_DATABASE, ...customDeck];
        return fullList.filter((item) => {
            const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
            const matchesDiff = selectedDifficulty === "all" || item.difficulty === selectedDifficulty;
            return matchesCat && matchesDiff;
        });
    }, [selectedCategory, selectedDifficulty, customDeck]);

    // Draw Next Random Word using Web Crypto
    const pickNextWord = () => {
        if (pool.length === 0) return;
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        let nextIndex = array[0] % pool.length;

        if (pool.length > 1 && pool[nextIndex].id === currentCard?.id) {
            nextIndex = (nextIndex + 1) % pool.length;
        }

        const picked = pool[nextIndex];
        setCurrentCard(picked);
        setShowHint(false);
        setHistory((prev) => [picked, ...prev.filter((p) => p.id !== picked.id)].slice(0, 30));
    };

    // Timer Interval Management
    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        playBeep(880, 0.4);
                        setIsTimerRunning(false);
                        return 0;
                    }
                    if (prev <= 4) {
                        playBeep(440, 0.1);
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning, timeLeft, soundEnabled]);

    const handleStartTimer = () => {
        if (timeLeft === 0) {
            setTimeLeft(timerDuration);
        }
        setIsTimerRunning(true);
    };

    const handlePauseTimer = () => {
        setIsTimerRunning(false);
    };

    const handleResetTimer = () => {
        setIsTimerRunning(false);
        setTimeLeft(timerDuration);
    };

    const handleDurationChange = (seconds: number) => {
        setIsTimerRunning(false);
        setTimerDuration(seconds);
        setTimeLeft(seconds);
    };

    const handleCopyWord = () => {
        if (!currentCard) return;
        const text = `Word: ${currentCard.word}\nCategory: ${currentCard.category}\nDifficulty: ${currentCard.difficulty}\nHint: ${currentCard.hint}\nGenerated via twistertools.com/tools/random-tools/charades-word-generator`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddCustomWord = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = customWordInput.trim();
        if (!trimmed) return;

        const newEntry: WordItem = {
            id: Date.now(),
            word: trimmed,
            category: customCategoryInput,
            difficulty: customDifficultyInput,
            hint: "Custom added idea",
            actionTip: "Act it out creatively with team gestures!"
        };

        setCustomDeck((prev) => [newEntry, ...prev]);
        setCurrentCard(newEntry);
        setCustomWordInput("");
    };

    const awardPoint = (team: "A" | "B") => {
        if (team === "A") {
            setTeamAScore((prev) => prev + 1);
        } else {
            setTeamBScore((prev) => prev + 1);
        }
        playBeep(700, 0.15);
        pickNextWord();
        handleResetTimer();
    };

    const resetScoreboard = () => {
        setTeamAScore(0);
        setTeamBScore(0);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Charades & Game Night Word Generator",
        "url": "https://twistertools.com/tools/random-tools/charades-word-generator",
        "description": "Generate dynamic random ideas for Charades, drawing games, and party game night. Features tiered difficulties, countdown buzzer timers, team scoring, hints, and custom prompt decks.",
        "applicationCategory": "GameApplication",
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
                "name": "What are the standard rules of Charades?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In standard Charades, a player acts out a secret word or phrase without speaking, making vocal noises, or pointing at objects in the room. Their teammates must guess the exact phrase within the time limit (typically 60 seconds)."
                }
            },
            {
                "@type": "Question",
                "name": "How does this tool work for drawing and party guessing games?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Every prompt includes a clean keyword, category tag, and difficulty rating. For drawing and sketching games, the clue-giver illustrates the prompt without letters or numbers. For oral description or taboo-style games, the clue-giver describes the term orally without saying the target word."
                }
            },
            {
                "@type": "Question",
                "name": "What standard hand gestures are used in Charades?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Common gestures include holding up fingers for the number of words, tapping an arm for syllables, tugging an earlobe for 'sounds like', rolling hands for 'movie', and opening flat palms for 'book'."
                }
            },
            {
                "@type": "Question",
                "name": "Can I add custom words for bridal showers, holidays, or office parties?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The custom word input panel allows you to insert inside jokes, company jargon, or holiday themes directly into your live browser deck without leaving the screen."
                }
            },
            {
                "@type": "Question",
                "name": "How is randomness guaranteed across cards?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The engine uses the browser's hardware-backed Web Crypto API (crypto.getRandomValues) rather than standard Math.random(), ensuring unbiased uniform random card generation without duplicate loops."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Live Card Stage & Primary Gameplay */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Title Bar inside card */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Gamepad2 className="w-5 h-5 text-indigo-600" />
                                Prompt Display Card
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setIsWordHidden(!isWordHidden)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                    title="Hide word from audience or guessers"
                                >
                                    {isWordHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    <span>{isWordHidden ? "Reveal" : "Hide"}</span>
                                </button>
                                <button
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition cursor-pointer"
                                    title={soundEnabled ? "Mute Timer Buzzer" : "Unmute Timer Buzzer"}
                                >
                                    {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                                </button>
                            </div>
                        </div>

                        {/* Interactive Main Prompt Card */}
                        <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-center text-white shadow-xl min-h-[280px] flex flex-col justify-between">
                            {/* Card Badges */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                    <Tag className="w-3 h-3" />
                                    {currentCard ? currentCard.category : "Category"}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${currentCard?.difficulty === "easy"
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                                    : currentCard?.difficulty === "medium"
                                        ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                                        : "bg-rose-500/20 text-rose-300 border-rose-400/30"
                                    }`}>
                                    <Flame className="w-3 h-3" />
                                    {currentCard ? currentCard.difficulty : "Difficulty"}
                                </span>
                            </div>

                            {/* Main Target Word / Mystery Mask */}
                            <div className="py-6 my-auto">
                                {isWordHidden ? (
                                    <div className="space-y-2">
                                        <p className="text-3xl sm:text-4xl font-extrabold tracking-widest text-indigo-300/40 uppercase blur-xs select-none">
                                            SECRET PHRASE
                                        </p>
                                        <p className="text-xs text-indigo-200/60 font-medium">Click &apos;Reveal&apos; above when actor is ready</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
                                            {currentCard ? currentCard.word : "Click Next Idea"}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-indigo-200/80 font-medium italic">
                                            {currentCard ? currentCard.actionTip : "Select categories to begin"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Collapsible Clue / Hint Box */}
                            <div className="pt-2 border-t border-slate-800 flex flex-col items-center gap-2">
                                {showHint ? (
                                    <div className="bg-indigo-900/60 border border-indigo-700/50 rounded-xl px-4 py-2 text-xs text-indigo-200 max-w-md w-full">
                                        <strong className="text-white">Clue:</strong> {currentCard?.hint}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowHint(true)}
                                        className="text-xs text-indigo-300 hover:text-white font-semibold flex items-center gap-1 transition cursor-pointer"
                                    >
                                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                                        Show Hint / Clue
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Primary Deck Action Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                onClick={pickNextWord}
                                className="sm:col-span-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Shuffle className="w-5 h-5" />
                                Next Random Word
                            </button>
                            <button
                                onClick={handleCopyWord}
                                className="py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                                {copied ? "Copied" : "Copy Idea"}
                            </button>
                        </div>

                        {/* Integrated Turn Timer */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Timer className="w-4 h-4 text-indigo-600" />
                                    Round Timer
                                </span>
                                <div className="flex items-center gap-1">
                                    {[30, 60, 90, 120].map((sec) => (
                                        <button
                                            key={sec}
                                            onClick={() => handleDurationChange(sec)}
                                            className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${timerDuration === sec
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {sec}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Timer Progress Bar & Digits */}
                            <div className="space-y-2">
                                <div className="flex items-baseline justify-between">
                                    <span className={`text-3xl font-black font-mono ${timeLeft <= 10 ? "text-rose-600 animate-pulse" : "text-slate-900"
                                        }`}>
                                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {isTimerRunning ? "Clock Ticking..." : timeLeft === 0 ? "Time's Up!" : "Paused"}
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? "bg-rose-500" : timeLeft <= 25 ? "bg-amber-500" : "bg-indigo-600"
                                            }`}
                                        style={{ width: `${(timeLeft / timerDuration) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Timer Button Actions */}
                            <div className="flex items-center gap-2 pt-1">
                                {!isTimerRunning ? (
                                    <button
                                        onClick={handleStartTimer}
                                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                                    >
                                        <Play className="w-4 h-4 fill-white" /> Start Timer
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePauseTimer}
                                        className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                                    >
                                        <Pause className="w-4 h-4 fill-white" /> Pause
                                    </button>
                                )}
                                <button
                                    onClick={handleResetTimer}
                                    className="py-2 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                    <RotateCcw className="w-4 h-4" /> Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Web Crypto Randomness
                        </span>
                        <span>Deck Size: {pool.length} Words</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Filters, Scoring & Custom Decks */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Title Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                                Game Setup & Team Tracker
                            </h2>
                            <button
                                onClick={resetScoreboard}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-rose-600 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Scores
                            </button>
                        </div>

                        {/* Interactive Team Scoreboard */}
                        <div className="grid grid-cols-2 gap-3 min-w-0">
                            {/* Team A Card */}
                            <div className={`p-4 rounded-xl border-2 transition ${activeTeam === "A" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 bg-slate-50"
                                }`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Team A</span>
                                    <button
                                        onClick={() => setActiveTeam("A")}
                                        className="text-[10px] font-bold text-indigo-600 uppercase hover:underline cursor-pointer"
                                    >
                                        Turn
                                    </button>
                                </div>
                                <div className="text-3xl font-black text-slate-900">{teamAScore}</div>
                                <button
                                    onClick={() => awardPoint("A")}
                                    className="mt-3 w-full py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                    <Trophy className="w-3.5 h-3.5" /> +1 Point
                                </button>
                            </div>

                            {/* Team B Card */}
                            <div className={`p-4 rounded-xl border-2 transition ${activeTeam === "B" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 bg-slate-50"
                                }`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Team B</span>
                                    <button
                                        onClick={() => setActiveTeam("B")}
                                        className="text-[10px] font-bold text-indigo-600 uppercase hover:underline cursor-pointer"
                                    >
                                        Turn
                                    </button>
                                </div>
                                <div className="text-3xl font-black text-slate-900">{teamBScore}</div>
                                <button
                                    onClick={() => awardPoint("B")}
                                    className="mt-3 w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                    <Trophy className="w-3.5 h-3.5" /> +1 Point
                                </button>
                            </div>
                        </div>

                        {/* Category Filter Chips */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ListFilter className="w-4 h-4 text-indigo-600" />
                                Category Filter
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {(["all", "movies", "actions", "animals", "objects", "phrases", "characters"] as CategoryType[]).map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer border ${selectedCategory === cat
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty Filter Chips */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600" />
                                Challenge Level
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {(["all", "easy", "medium", "hard"] as DifficultyLevel[]).map((diff) => (
                                    <button
                                        key={diff}
                                        onClick={() => setSelectedDifficulty(diff)}
                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition cursor-pointer border ${selectedDifficulty === diff
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Word Quick Addition */}
                        <form onSubmit={handleAddCustomWord} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Add Custom Prompt
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customWordInput}
                                    onChange={(e) => setCustomWordInput(e.target.value)}
                                    placeholder="e.g. Grandma cooking Thanksgiving dinner"
                                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!customWordInput.trim()}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition cursor-pointer whitespace-nowrap"
                                >
                                    Add Card
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={customCategoryInput}
                                    onChange={(e) => setCustomCategoryInput(e.target.value as Exclude<CategoryType, "all">)}
                                    className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 outline-none text-slate-700"
                                >
                                    <option value="movies">Movies</option>
                                    <option value="actions">Actions</option>
                                    <option value="animals">Animals</option>
                                    <option value="objects">Objects</option>
                                    <option value="phrases">Phrases</option>
                                    <option value="characters">Characters</option>
                                </select>
                                <select
                                    value={customDifficultyInput}
                                    onChange={(e) => setCustomDifficultyInput(e.target.value as Exclude<DifficultyLevel, "all">)}
                                    className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 outline-none text-slate-700"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                                <span className="text-[11px] text-slate-400 ml-auto">
                                    {customDeck.length} custom cards
                                </span>
                            </div>
                        </form>
                    </div>

                    {/* Recently Generated History Mini-Log */}
                    <div className="pt-4 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Recent Prompt History
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                            {history.length === 0 ? (
                                <span className="text-xs text-slate-400">No prompt history yet.</span>
                            ) : (
                                history.slice(0, 10).map((h) => (
                                    <span
                                        key={h.id}
                                        onClick={() => setCurrentCard(h)}
                                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium cursor-pointer transition"
                                    >
                                        {h.word}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Official Game Night Rules & Variations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Complete Official Game Night Rules & Multi-Game Adaptations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Charades, quick-draw sketching games, and verbal guessing games remain the gold standard of parlor games because they rely purely on rapid creativity, non-verbal intuition, and teamwork. Our prompt generator supplies immediate ideas with zero preparation, balanced across carefully curated themes.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600" /> Classic Charades Rules
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                No speaking, mouthing words, or humming allowed. Clue-givers must rely solely on body gestures and facial expressions. The team earns one point if they guess the exact title before the countdown timer expires.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4 text-indigo-600" /> Drawing & Sketching Rules
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Players illustrate the prompt on paper or a whiteboard. No letters, numbers, symbols (#, $), or verbal clues may be sketched or uttered. Gesturing with drawing markers is strictly prohibited.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Catchphrase / Taboo Rules
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Verbal descriptions are permitted, but clue-givers cannot say the word itself, any root variants, or rhyming phrases. The goal is rapid-fire guessing before the buzzer sounds.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Universal Charades Gestures Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Universal Hand Signals & Non-Verbal Communication Cheat Sheet
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Competitive Charades matches move twice as fast when both actors and guessers share the universal non-verbal sign conventions. Use this quick reference matrix during play:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Concept / Signal</th>
                                    <th className="p-3">Physical Hand Gesture</th>
                                    <th className="p-3">Standard Meaning</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Word Count</td>
                                    <td className="p-3 font-mono">Hold fingers vertically in the air</td>
                                    <td className="p-3">Indicates total number of words in phrase</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Active Word Choice</td>
                                    <td className="p-3 font-mono">Tap fingers on inner forearm</td>
                                    <td className="p-3">Indicates which word number is being acted first</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Syllable Count</td>
                                    <td className="p-3 font-mono">Lay fingers across forearm horizontally</td>
                                    <td className="p-3">Number of syllables in current word</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Book / Literature</td>
                                    <td className="p-3 font-mono">Palms opened flat together like pages</td>
                                    <td className="p-3">Category is a book, novel, or written work</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Movie / Film</td>
                                    <td className="p-3 font-mono">Crank one hand beside eye like an old camera</td>
                                    <td className="p-3">Category is a feature film or cinema release</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">TV Show</td>
                                    <td className="p-3 font-mono">Draw an invisible square box in the air</td>
                                    <td className="p-3">Category is a television series or streaming show</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Song / Musical</td>
                                    <td className="p-3 font-mono">Hand on heart with wide operatic singing gesture</td>
                                    <td className="p-3">Category is music track, album, or Broadway show</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Sounds Like / Rhyme</td>
                                    <td className="p-3 font-mono">Gently tug on earlobe with thumb and index</td>
                                    <td className="p-3">Acting a word that rhymes with the target target</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Strategic Acting Techniques & Pro Tips */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Pro Tips for Faster Guessing & Winning Matches
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Top game-night competitors focus on high-efficiency signaling rather than elaborate theater. Adopt these proven strategies to shave seconds off every card:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-base">1. Always Establish Structural Context First</h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Never begin acting out the primary action without first signaling the category and total word count. If teammates do not know whether you are acting out an animal or a movie title, even perfect mimes will result in misdirected guesses.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-base">2. Break Difficult Words into Phonetic Rhymes</h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Abstract concepts like &quot;Inflation&quot; or &quot;Democracy&quot; are notoriously hard to pantomime directly. Tug your earlobe for &quot;Sounds Like&quot; and act out simple concrete words like &quot;Station&quot; or &quot;Sea&quot; to build the syllables piece by piece.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-base">3. Use Hot and Cold Feedback</h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Active actors should continually guide their team with nodding, pointing vigorously when a teammate gets close (&quot;warm&quot;), or holding flat palms up to push them away from incorrect assumptions (&quot;cold&quot;).
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-base">4. Target the Easiest Word in a Phrase</h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                For multi-word phrases, do not feel obligated to act in sequential order. If the third word is an obvious noun like &quot;Spider&quot; in &quot;Along Came a Spider,&quot; nail that keyword first and let your team infer the remaining grammatical connectors.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
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
                                What are the standard rules of Charades?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In standard Charades, a player acts out a secret word or phrase without speaking, making vocal noises, or pointing at objects in the room. Their teammates must guess the exact phrase within the time limit (typically 60 seconds).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does this tool work for drawing and party guessing games?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Every prompt includes a clean keyword, category tag, and difficulty rating. For drawing and sketching games, the clue-giver illustrates the prompt without letters or numbers. For oral description or taboo-style games, the clue-giver describes the term orally without saying the target word.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What standard hand gestures are used in Charades?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Common gestures include holding up fingers for the number of words, tapping an arm for syllables, tugging an earlobe for &quot;sounds like&quot;, rolling hands for &quot;movie&quot;, and opening flat palms for &quot;book&quot;.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I add custom words for bridal showers, holidays, or office parties?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The custom word input panel allows you to insert inside jokes, company jargon, or holiday themes directly into your live browser deck without leaving the screen.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is randomness guaranteed across cards?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The engine uses the browser&apos;s hardware-backed Web Crypto API (crypto.getRandomValues) rather than standard Math.random(), ensuring unbiased uniform random card generation without duplicate loops.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}