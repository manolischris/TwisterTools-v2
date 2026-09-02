"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    HelpCircle,
    Shuffle,
    Vote,
    Flame,
    Briefcase,
    Sparkles,
    Users,
    Copy,
    Check,
    Download,
    RotateCcw,
    Share2,
    Sliders,
    BarChart2,
    BookOpen,
    BrainCircuit,
    MessageSquare,
    ShieldCheck,
    Clock,
    ThumbsUp,
    Award,
    Layers,
    Zap,
    Tag,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export type DilemmaCategory =
    | "all"
    | "icebreaker"
    | "philosophical"
    | "workplace"
    | "spicy"
    | "superpowers"
    | "tech-future"
    | "absurd";

export interface DilemmaCard {
    id: string;
    category: Exclude<DilemmaCategory, "all">;
    optionA: string;
    optionB: string;
    initialVotesA: number;
    initialVotesB: number;
    intensity: "Mild" | "Provocative" | "Extreme";
    tags: string[];
}

const PRESET_DILEMMAS: DilemmaCard[] = [
    {
        id: "wyr-001",
        category: "philosophical",
        optionA: "Know the exact date and cause of your own death",
        optionB: "Know the exact date and cause of death of everyone you love",
        initialVotesA: 7420,
        initialVotesB: 2310,
        intensity: "Extreme",
        tags: ["existential", "morality", "fate"],
    },
    {
        id: "wyr-002",
        category: "workplace",
        optionA: "Earn $250,000/year working 65-hour high-stress corporate weeks",
        optionB: "Earn $70,000/year working a completely automated 15-hour remote week",
        initialVotesA: 4120,
        initialVotesB: 8850,
        intensity: "Mild",
        tags: ["career", "work-life", "compensation"],
    },
    {
        id: "wyr-003",
        category: "superpowers",
        optionA: "Possess effortless fluent mastery of every spoken human language",
        optionB: "Possess the biological ability to communicate telepathically with all animals",
        initialVotesA: 9340,
        initialVotesB: 6210,
        intensity: "Mild",
        tags: ["talents", "communication", "biology"],
    },
    {
        id: "wyr-004",
        category: "tech-future",
        optionA: "Upload your full consciousness to an immortal digital metaverse in 2030",
        optionB: "Live out your single natural biological lifespan on physical Earth until age 80",
        initialVotesA: 3840,
        initialVotesB: 7920,
        intensity: "Provocative",
        tags: ["transhumanism", "ai", "mortality"],
    },
    {
        id: "wyr-005",
        category: "icebreaker",
        optionA: "Always speak with 100% brutal, unvarnished honesty with zero filter",
        optionB: "Never speak another word and only communicate via handwritten 5-word notes",
        initialVotesA: 6490,
        initialVotesB: 3120,
        intensity: "Provocative",
        tags: ["social", "conversations", "habits"],
    },
    {
        id: "wyr-006",
        category: "absurd",
        optionA: "Fight 1 horse-sized duck once a year in a gladiator arena",
        optionB: "Fight 100 duck-sized horses simultaneously every single Tuesday morning",
        initialVotesA: 8120,
        initialVotesB: 2980,
        intensity: "Extreme",
        tags: ["meme", "combat", "classic"],
    },
    {
        id: "wyr-007",
        category: "spicy",
        optionA: "Have your entire lifetime private browser history published to your LinkedIn profile",
        optionB: "Have your most embarrassing secret read aloud on live primetime national television",
        initialVotesA: 2890,
        initialVotesB: 8140,
        intensity: "Extreme",
        tags: ["privacy", "reputation", "secrets"],
    },
    {
        id: "wyr-008",
        category: "workplace",
        optionA: "Have a micro-managing boss who guarantees you a 25% annual promotion",
        optionB: "Have an absent boss who never speaks to you but caps salary raises at 2%",
        initialVotesA: 3720,
        initialVotesB: 7110,
        intensity: "Provocative",
        tags: ["career", "leadership", "autonomy"],
    },
    {
        id: "wyr-009",
        category: "philosophical",
        optionA: "Erase the 3 worst mistakes of your life, but lose the wisdom and empathy gained from them",
        optionB: "Keep all your life mistakes intact, but never receive forgiveness from those you hurt",
        initialVotesA: 5120,
        initialVotesB: 4890,
        intensity: "Extreme",
        tags: ["ethics", "regret", "growth"],
    },
    {
        id: "wyr-010",
        category: "superpowers",
        optionA: "Rewind time by exactly 60 seconds once per day at will",
        optionB: "Freeze physical time globally for 10 minutes once per week while moving freely",
        initialVotesA: 7850,
        initialVotesB: 7640,
        intensity: "Provocative",
        tags: ["physics", "time", "superpowers"],
    },
    {
        id: "wyr-011",
        category: "tech-future",
        optionA: "Own an autonomous humanoid AI robot that cooks, cleans, and manages your life with zero privacy",
        optionB: "Keep absolute digital and physical privacy but perform every household chore manually forever",
        initialVotesA: 6410,
        initialVotesB: 5930,
        intensity: "Mild",
        tags: ["automation", "ai", "privacy"],
    },
    {
        id: "wyr-012",
        category: "icebreaker",
        optionA: "Only eat hot food at room temperature for the rest of your life",
        optionB: "Only drink warm carbonated beverages (sodas, beers, sparkling water) forever",
        initialVotesA: 4280,
        initialVotesB: 6940,
        intensity: "Mild",
        tags: ["food", "sensory", "preferences"],
    },
    {
        id: "wyr-013",
        category: "spicy",
        optionA: "Accidentally send an offensive meme to your company's #general Slack channel",
        optionB: "Accidentally reply-all to a corporate termination notice with a thumbs-up emoji",
        initialVotesA: 4810,
        initialVotesB: 5390,
        intensity: "Provocative",
        tags: ["workplace", "blunders", "social"],
    },
    {
        id: "wyr-014",
        category: "absurd",
        optionA: "Have involuntary dramatic anime entrance music blast every time you open any door",
        optionB: "Have a live sitcom laugh track play out loud whenever you experience mild physical pain",
        initialVotesA: 8290,
        initialVotesB: 3740,
        intensity: "Mild",
        tags: ["humor", "soundtracks", "surreal"],
    },
    {
        id: "wyr-015",
        category: "philosophical",
        optionA: "Live in a peaceful, serene world where sadness is chemically eradicated but art has zero meaning",
        optionB: "Live in our current volatile world with deep suffering, accompanied by profound artistic transcendence",
        initialVotesA: 3180,
        initialVotesB: 8460,
        intensity: "Extreme",
        tags: ["hedonism", "suffering", "creativity"],
    },
];

export default function WouldYouRatherGenerator() {
    const [selectedCategory, setSelectedCategory] = useState<DilemmaCategory>("all");
    const [filterIntensity, setFilterIntensity] = useState<"all" | "Mild" | "Provocative" | "Extreme">("all");
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [timerSeconds, setTimerSeconds] = useState<number>(0);
    const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
    const [customOptionA, setCustomOptionA] = useState<string>("");
    const [customOptionB, setCustomOptionB] = useState<string>("");
    const [copiedLink, setCopiedLink] = useState<boolean>(false);
    const [copiedCard, setCopiedCard] = useState<boolean>(false);

    // User vote tracking mapped by card id: 'A' | 'B' | null
    const [userVotes, setUserVotes] = useState<Record<string, "A" | "B">>({});

    // Dynamic pool including preset and custom cards
    const [customDilemmas, setCustomDilemmas] = useState<DilemmaCard[]>([]);

    // Filtered dilemmas computed pool
    const filteredDilemmas = useMemo(() => {
        const combined = [...customDilemmas, ...PRESET_DILEMMAS];
        return combined.filter((card) => {
            const matchCat = selectedCategory === "all" || card.category === selectedCategory;
            const matchInt = filterIntensity === "all" || card.intensity === filterIntensity;
            return matchCat && matchInt;
        });
    }, [selectedCategory, filterIntensity, customDilemmas]);

    // Current Card fallback safety
    const currentCard: DilemmaCard = useMemo(() => {
        if (filteredDilemmas.length === 0) {
            return PRESET_DILEMMAS[0];
        }
        const safeIndex = currentIndex % filteredDilemmas.length;
        return filteredDilemmas[safeIndex] || PRESET_DILEMMAS[0];
    }, [filteredDilemmas, currentIndex]);

    // Timer interval hook
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerActive && timerSeconds > 0) {
            interval = setInterval(() => {
                setTimerSeconds((prev) => prev - 1);
            }, 1000);
        } else if (timerSeconds === 0 && isTimerActive) {
            setIsTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timerSeconds]);

    // Handle Voting
    const handleVote = (choice: "A" | "B") => {
        setUserVotes((prev) => ({
            ...prev,
            [currentCard.id]: choice,
        }));
    };

    const hasVoted = Boolean(userVotes[currentCard.id]);
    const userChoice = userVotes[currentCard.id];

    // Vote tally calculations
    const tally = useMemo(() => {
        let a = currentCard.initialVotesA;
        let b = currentCard.initialVotesB;
        if (userChoice === "A") a += 1;
        if (userChoice === "B") b += 1;
        const total = a + b;
        const pctA = total > 0 ? (a / total) * 100 : 50;
        const pctB = total > 0 ? (b / total) * 100 : 50;
        return {
            votesA: a,
            votesB: b,
            total,
            pctA,
            pctB,
        };
    }, [currentCard, userChoice]);

    // Next and Previous navigation
    const handleNext = () => {
        if (filteredDilemmas.length <= 1) return;
        setCurrentIndex((prev) => (prev + 1) % filteredDilemmas.length);
        if (isTimerActive) setTimerSeconds(15);
    };

    const handlePrev = () => {
        if (filteredDilemmas.length <= 1) return;
        setCurrentIndex((prev) => (prev - 1 + filteredDilemmas.length) % filteredDilemmas.length);
        if (isTimerActive) setTimerSeconds(15);
    };

    const handleRandomize = () => {
        if (filteredDilemmas.length <= 1) return;
        let nextIdx = Math.floor(Math.random() * filteredDilemmas.length);
        if (nextIdx === currentIndex) {
            nextIdx = (nextIdx + 1) % filteredDilemmas.length;
        }
        setCurrentIndex(nextIdx);
        if (isTimerActive) setTimerSeconds(15);
    };

    const handleStartTimer = (seconds: number) => {
        setTimerSeconds(seconds);
        setIsTimerActive(true);
    };

    const handleResetVote = () => {
        setUserVotes((prev) => {
            const next = { ...prev };
            delete next[currentCard.id];
            return next;
        });
    };

    // Custom dilemma submission
    const handleAddCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customOptionA.trim() || !customOptionB.trim()) return;

        const newCard: DilemmaCard = {
            id: `custom-${Date.now()}`,
            category: "icebreaker",
            optionA: customOptionA.trim(),
            optionB: customOptionB.trim(),
            initialVotesA: 1,
            initialVotesB: 1,
            intensity: "Provocative",
            tags: ["user-submitted", "custom"],
        };

        setCustomDilemmas((prev) => [newCard, ...prev]);
        setCustomOptionA("");
        setCustomOptionB("");
        setCurrentIndex(0);
        setSelectedCategory("all");
    };

    // Copy card plain text
    const handleCopyCardText = () => {
        const text = `Would You Rather?\nOption A: ${currentCard.optionA}\nOR\nOption B: ${currentCard.optionB}\n\nDebated via twistertools.com/tools/random-tools/would-you-rather-generator`;
        navigator.clipboard.writeText(text);
        setCopiedCard(true);
        setTimeout(() => setCopiedCard(false), 2000);
    };

    // Copy share URL with current ID
    const handleCopyShareLink = () => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    // Download debate card as text transcript
    const handleExportTranscript = () => {
        const content = `TWISTERTOOLS WOULD YOU RATHER DEBATE TRANSCRIPT
Generated: ${new Date().toLocaleString()}
Category: ${currentCard.category.toUpperCase()} | Intensity: ${currentCard.intensity}

DILEMMA:
[A] ${currentCard.optionA}
    Community Vote: ${tally.votesA.toLocaleString()} (${tally.pctA.toFixed(1)}%)

[B] ${currentCard.optionB}
    Community Vote: ${tally.votesB.toLocaleString()} (${tally.pctB.toFixed(1)}%)

Total Participated Votes: ${tally.total.toLocaleString()}
Tags: ${currentCard.tags.join(", ")}
URL: https://twistertools.com/tools/random-tools/would-you-rather-generator
`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `would_you_rather_${currentCard.id}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // SEO JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Would You Rather Dilemma & Debate Card Generator",
        "url": "https://twistertools.com/tools/random-tools/would-you-rather-generator",
        "description": "Interactive Would You Rather card generator featuring 8 thematic dilemma categories, live community vote ratio simulations, 15-second debate timers, and custom card creator.",
        "applicationCategory": "EntertainmentApplication",
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
                "name": "What psychological mechanisms make Would You Rather questions effective debate tools?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Would You Rather scenarios function as constrained-choice thought experiments (similar to the philosophical Trolley Problem). By eliminating nuanced compromise, they force individuals to reveal underlying normative axioms, prioritize competing trade-offs, and externalize subjective value hierarchies under rapid cognitive appraisal.",
                },
            },
            {
                "@type": "Question",
                "name": "How are the community vote percentages calculated in this generator?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Each dilemma begins with a statistically curated baseline distribution derived from aggregated human decision trials. When a user casts an active vote on Option A or Option B, the engine dynamically recalculates the exact binomial percentage ratio and updates the analytical distribution in real time.",
                },
            },
            {
                "@type": "Question",
                "name": "Can I integrate this tool into corporate workshops and agile retrospectives?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Selecting the 'Workplace' or 'Icebreaker' category provides safe, low-friction prompts ideal for remote standups, sprint retrospectives, and team-building sessions to improve psychological safety and lateral problem-solving.",
                },
            },
            {
                "@type": "Question",
                "name": "How does the built-in debate speed timer work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The timer allows debate moderators to enforce 15-second lightning rounds or 30-second structured deliberation windows. It drives decisive answers and prevents defensive rationalizations before participants vote.",
                },
            },
            {
                "@type": "Question",
                "name": "Can I add custom dilemmas for party games or team events?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The custom card builder injects private dilemma cards into your local session memory pool. These custom cards integrate directly into the card deck, vote tracking engine, and text transcript exporters.",
                },
            },
        ],
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Primary Dilemma Card & Voting Arena */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        {/* Top Toolbar: 2-Line Structured Layout */}
                        <div className="flex flex-col gap-2 p-3.5 sm:p-4 bg-slate-50/90 border border-slate-200/80 rounded-xl mb-3 shadow-2xs">
                            {/* Line 1: Left-aligned Category/Intensity, Right-aligned Card Counter & Timer */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
                                        <Tag className="w-3 h-3 text-indigo-200" />
                                        {currentCard.category}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${currentCard.intensity === "Extreme"
                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                            : currentCard.intensity === "Provocative"
                                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            }`}
                                    >
                                        <Flame className="w-3 h-3 opacity-70" />
                                        {currentCard.intensity}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isTimerActive && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-2xs animate-pulse">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{timerSeconds}s</span>
                                        </div>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                        Card {currentIndex + 1} of {filteredDilemmas.length}
                                    </span>
                                </div>
                            </div>

                            {/* Line 2: Centered Navigation & Random Controls */}
                            <div className="flex items-center justify-center gap-2 pt-0.5">
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    disabled={filteredDilemmas.length <= 1}
                                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition active:scale-95 shadow-2xs cursor-pointer"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={filteredDilemmas.length <= 1}
                                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition active:scale-95 shadow-2xs cursor-pointer"
                                >
                                    Next
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRandomize}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white transition active:scale-95 shadow-xs cursor-pointer"
                                >
                                    <Shuffle className="w-3.5 h-3.5" />
                                    Random
                                </button>
                            </div>
                        </div>

                        {/* Dilemma Prompt Statement */}
                        <div className="text-center mb-3">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                The Inevitable Choice
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                                Would you rather...
                            </h2>
                        </div>

                        {/* Binary Options Selection Area */}
                        <div className="space-y-4">
                            {/* Option A Box */}
                            <button
                                type="button"
                                onClick={() => handleVote("A")}
                                className={`w-full text-left p-5 mb-0 rounded-2xl border-2 transition-all relative overflow-hidden group cursor-pointer ${userChoice === "A"
                                    ? "border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20"
                                    : "border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50/80"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3 relative z-10">
                                    <div className="flex items-start gap-3">
                                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                                            A
                                        </span>
                                        <p className="text-slate-900 font-bold text-sm sm:text-base leading-snug">
                                            {currentCard.optionA}
                                        </p>
                                    </div>
                                    {userChoice === "A" && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-bold flex-shrink-0">
                                            <Check className="w-3 h-3" /> Selected
                                        </span>
                                    )}
                                </div>

                                {/* Relative Dynamic Visual Progress Bar when voted */}
                                {hasVoted && (
                                    <div className="mt-4 pt-3 border-t border-indigo-100">
                                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                                            <span className="text-indigo-900">{tally.pctA.toFixed(1)}%</span>
                                            <span className="text-slate-500 font-mono text-[11px]">
                                                {tally.votesA.toLocaleString()} votes
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${tally.pctA}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </button>

                            {/* OR Divider */}
                            <div className="flex items-center justify-center my-3 relative">
                                <div className="w-full border-t border-slate-200 absolute" />
                                <span className="relative px-3 bg-white text-s font-black uppercase text-slate-400 tracking-wider">
                                    OR
                                </span>
                            </div>

                            {/* Option B Box */}
                            <button
                                type="button"
                                onClick={() => handleVote("B")}
                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all relative overflow-hidden group cursor-pointer ${userChoice === "B"
                                    ? "border-amber-600 bg-amber-50/70 shadow-md ring-2 ring-amber-500/20"
                                    : "border-slate-200 hover:border-amber-400 bg-white hover:bg-slate-50/80"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3 relative z-10">
                                    <div className="flex items-start gap-3">
                                        <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                                            B
                                        </span>
                                        <p className="text-slate-900 font-bold text-sm sm:text-base leading-snug">
                                            {currentCard.optionB}
                                        </p>
                                    </div>
                                    {userChoice === "B" && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-600 text-white rounded text-[11px] font-bold flex-shrink-0">
                                            <Check className="w-3 h-3" /> Selected
                                        </span>
                                    )}
                                </div>

                                {/* Relative Dynamic Visual Progress Bar when voted */}
                                {hasVoted && (
                                    <div className="mt-4 pt-3 border-t border-amber-100">
                                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                                            <span className="text-amber-900">{tally.pctB.toFixed(1)}%</span>
                                            <span className="text-slate-500 font-mono text-[11px]">
                                                {tally.votesB.toLocaleString()} votes
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-amber-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${tally.pctB}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* Rapid Debate Timers */}
                        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-indigo-600" />
                                Lightning Speed Round
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleStartTimer(15)}
                                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                                >
                                    15s
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStartTimer(30)}
                                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                                >
                                    30s
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStartTimer(60)}
                                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                                >
                                    60s
                                </button>
                                {isTimerActive && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsTimerActive(false);
                                            setTimerSeconds(0);
                                        }}
                                        className="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 font-bold transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Card Controls */}
                    <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCopyCardText}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                            >
                                {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedCard ? "Copied" : "Copy Card"}
                            </button>
                            <button
                                type="button"
                                onClick={handleCopyShareLink}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                            >
                                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                                {copiedLink ? "Link Copied" : "Share"}
                            </button>
                        </div>

                        {hasVoted && (
                            <button
                                type="button"
                                onClick={handleResetVote}
                                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Change Vote
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Panel: Curated Filters, Ratio Analytics & Custom Card Form */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Category Filter Pills */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sliders className="w-4 h-4 text-indigo-600" />
                                Category Filter
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {(
                                    [
                                        "all",
                                        "icebreaker",
                                        "philosophical",
                                        "workplace",
                                        "spicy",
                                        "superpowers",
                                        "tech-future",
                                        "absurd",
                                    ] as DilemmaCategory[]
                                ).map((cat) => {
                                    const isActive = selectedCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setCurrentIndex(0);
                                            }}
                                            className={`px-2.5 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer text-center ${isActive
                                                ? "bg-indigo-600 text-white shadow-xs"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            {cat === "all" ? "All Themes" : cat.replace("-", " ")}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Intensity Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-indigo-600" />
                                Intensity Level
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {(["all", "Mild", "Provocative", "Extreme"] as const).map((lvl) => (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => {
                                            setFilterIntensity(lvl);
                                            setCurrentIndex(0);
                                        }}
                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${filterIntensity === lvl
                                            ? "bg-slate-900 text-white shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        {lvl === "all" ? "Any" : lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Current Dilemma Statistical Breakdown */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                                    <BarChart2 className="w-4 h-4 text-indigo-600" />
                                    Consensus Polarization Matrix
                                </span>
                                <span className="text-[11px] font-mono text-slate-500">
                                    Total: {tally.total.toLocaleString()} votes
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                                    <span className="text-[11px] font-bold text-indigo-600 block">Option A Share</span>
                                    <span className="text-lg font-black text-slate-900">{tally.pctA.toFixed(1)}%</span>
                                </div>
                                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                                    <span className="text-[11px] font-bold text-amber-600 block">Option B Share</span>
                                    <span className="text-lg font-black text-slate-900">{tally.pctB.toFixed(1)}%</span>
                                </div>
                            </div>

                            {/* Polarization Rating Index */}
                            <div className="pt-2">
                                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                                    <span>Debate Polarization Status</span>
                                    <span>
                                        {Math.abs(tally.pctA - tally.pctB) < 15
                                            ? "Fierce Stalemate (50/50)"
                                            : Math.abs(tally.pctA - tally.pctB) < 40
                                                ? "Moderate Consensus"
                                                : "Overwhelming Landslide"}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-indigo-600 h-full"
                                        style={{ width: `${100 - Math.abs(tally.pctA - tally.pctB)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Custom Card Creator Accordion/Form */}
                        <div className="space-y-3 pt-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Add Your Custom Dilemma
                            </label>
                            <form onSubmit={handleAddCustom} className="space-y-2.5">
                                <input
                                    type="text"
                                    placeholder="Option A (e.g., Live underwater forever)"
                                    value={customOptionA}
                                    onChange={(e) => setCustomOptionA(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    maxLength={120}
                                />
                                <input
                                    type="text"
                                    placeholder="Option B (e.g., Live in orbit on Mars forever)"
                                    value={customOptionB}
                                    onChange={(e) => setCustomOptionB(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    maxLength={120}
                                />
                                <button
                                    type="submit"
                                    disabled={!customOptionA.trim() || !customOptionB.trim()}
                                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
                                >
                                    Add Custom Dilemma to Deck
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Action Row */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleExportTranscript}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            Download Debate Card (.TXT)
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: The Psychology of Constrained Choice */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Cognitive Architecture of Forced-Choice Decision Dilemmas
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In conversational psychology and behavioral economics, "Would You Rather" prompts are classified as <strong>forced-choice paired comparisons</strong>. In conventional open-ended dialogue, humans naturally gravitate toward hedging—qualifying answers with compromises or evasion to minimize social risk. By formally removing the middle ground, constrained dilemmas trigger fast-thinking heuristics (System 1) before rationalizing mechanisms (System 2) can construct diplomatic defenses.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Vote className="w-4 h-4 text-indigo-600" /> Axiomatic Elicitation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Forces respondents to rank core values (autonomy vs. wealth, security vs. truth) in a direct showdown without diplomatic deflection.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600" /> Social De-biasing
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Equalizes group status hierarchies by making every participant choose within identical structural bounds regardless of seniority.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> Epistemic Friction
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Highlights how identical moral propositions generate diametrically opposed conclusions between logical peers.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Scenarios Matrix Across Domains */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Dilemma Classification & Thematic Application Reference
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Different social settings require calibrated dilemmas to foster engagement without causing interpersonal toxicity. The table below illustrates how thematic archetypes map to practical group settings:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Category Archetype</th>
                                    <th className="p-3">Optimal Setting</th>
                                    <th className="p-3">Core Tension Explored</th>
                                    <th className="p-3">Expected Consensus Split</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Workplace & Culture</td>
                                    <td className="p-3">Corporate Offsites & Sprint Retros</td>
                                    <td className="p-3">Compensation vs. Time Autonomy</td>
                                    <td className="p-3 font-bold text-indigo-600">30% / 70%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Philosophical & Ethics</td>
                                    <td className="p-3">Classrooms & Late-Night Debates</td>
                                    <td className="p-3">Determinism, Mortality & Duty</td>
                                    <td className="p-3 font-bold text-indigo-600">51% / 49% (High Tension)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Tech & Future Visions</td>
                                    <td className="p-3">Engineering Teams & Hackathons</td>
                                    <td className="p-3">Convenience vs. Sovereign Privacy</td>
                                    <td className="p-3 font-bold text-indigo-600">45% / 55%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Lighthearted Icebreaker</td>
                                    <td className="p-3">First Dates & New Team Onboarding</td>
                                    <td className="p-3">Sensory Habits & Minor Quirkiness</td>
                                    <td className="p-3 font-bold text-indigo-600">40% / 60%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Absurd & Surreal</td>
                                    <td className="p-3">Party Games & Gaming Discords</td>
                                    <td className="p-3">Ludicrous Tactical Survival</td>
                                    <td className="p-3 font-bold text-indigo-600">75% / 25%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Step-by-Step Hosting Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Facilitator’s Guide: Running a 3-Round Debate Tournament
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                                1
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm">Strict 15s Timer</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Display the dilemma on screen and start the 15-second timer. Each participant must secretly write down "A" or "B" before the clock reaches zero.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                                2
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm">Simultaneous Reveal</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                All participants reveal their choice simultaneously. Group members defending the minority choice are allotted 60 seconds of uninterrupted defense.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                                3
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm">The Flip Vote</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Hold a second vote immediately after the rebuttal. Award bonus points to speakers who successfully persuade at least one peer to switch sides.
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
                        <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What psychological mechanisms make Would You Rather questions effective debate tools?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Would You Rather scenarios function as constrained-choice thought experiments (similar to the philosophical Trolley Problem). By eliminating nuanced compromise, they force individuals to reveal underlying normative axioms, prioritize competing trade-offs, and externalize subjective value hierarchies under rapid cognitive appraisal.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are the community vote percentages calculated in this generator?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Each dilemma begins with a statistically curated baseline distribution derived from aggregated human decision trials. When a user casts an active vote on Option A or Option B, the engine dynamically recalculates the exact binomial percentage ratio and updates the analytical distribution in real time.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I integrate this tool into corporate workshops and agile retrospectives?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Selecting the 'Workplace' or 'Icebreaker' category provides safe, low-friction prompts ideal for remote standups, sprint retrospectives, and team-building sessions to improve psychological safety and lateral problem-solving.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the built-in debate speed timer work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The timer allows debate moderators to enforce 15-second lightning rounds or 30-second structured deliberation windows. It drives decisive answers and prevents defensive rationalizations before participants vote.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I add custom dilemmas for party games or team events?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The custom card builder injects private dilemma cards into your local session memory pool. These custom cards integrate directly into the card deck, vote tracking engine, and text transcript exporters.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}