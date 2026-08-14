"use client";

import React, { useState, useMemo } from "react";
import {
    Club,
    Heart,
    Spade,
    Diamond,
    Shuffle,
    RotateCw,
    Copy,
    Check,
    Download,
    Dices,
    BarChart3,
    BookOpen,
    HelpCircle,
    Layers,
    Calculator,
    ShieldCheck,
    Sparkles,
    Award,
    Percent,
    Lightbulb,
    BrainCircuit,
    Eye,
    Settings2,
    RefreshCw,
    Target,
    Zap
} from "lucide-react";

// --- TYPES & INTERFACES ---
export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
    value: number; // Numerical evaluation ranking (2-14)
}

export type HandRankCategory =
    | "Royal Flush"
    | "Straight Flush"
    | "Four of a Kind"
    | "Full House"
    | "Flush"
    | "Straight"
    | "Three of a Kind"
    | "Two Pair"
    | "One Pair"
    | "High Card";

export interface HandEvaluation {
    rankCategory: HandRankCategory;
    score: number;
    description: string;
}

export interface CardDrawerHistoryEntry {
    id: string;
    timestamp: string;
    cards: Card[];
    handEval: HandEvaluation | null;
}

// --- CONSTANTS ---
const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const SUIT_SYMBOLS: Record<Suit, string> = {
    spades: "♠",
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
};

const SUIT_COLORS: Record<Suit, string> = {
    spades: "text-slate-900",
    hearts: "text-rose-600",
    diamonds: "text-rose-600",
    clubs: "text-slate-900",
};

// --- HELPER FUNCTIONS ---
const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

const createFreshDeck = (deckCount: number, includeJokers: boolean): Card[] => {
    const deck: Card[] = [];
    for (let d = 0; d < deckCount; d++) {
        for (const suit of SUITS) {
            for (let r = 0; r < RANKS.length; r++) {
                const rank = RANKS[r];
                deck.push({
                    id: `deck-${d}-${suit}-${rank}-${Math.random().toString(36).substring(2, 7)}`,
                    suit,
                    rank,
                    value: r + 2,
                });
            }
        }
    }
    return deck;
};

// Fisher-Yates Crypto Shuffle Algorithm
const fisherYatesCryptoShuffle = (cards: Card[]): Card[] => {
    const shuffled = [...cards];
    const n = shuffled.length;
    for (let i = n - 1; i > 0; i--) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const j = array[0] % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Poker Hand Evaluator (5-Card standard evaluation)
const evaluatePokerHand = (cards: Card[]): HandEvaluation | null => {
    if (cards.length !== 5) return null;

    const sorted = [...cards].sort((a, b) => b.value - a.value);
    const isFlush = sorted.every((c) => c.suit === sorted[0].suit);

    // Check straight
    let isStraight = false;
    let isAceLowStraight = false;

    const values = sorted.map((c) => c.value);
    const uniqueValues = Array.from(new Set(values));

    if (uniqueValues.length === 5) {
        if (values[0] - values[4] === 4) {
            isStraight = true;
        } else if (
            values[0] === 14 &&
            values[1] === 5 &&
            values[2] === 4 &&
            values[3] === 3 &&
            values[4] === 2
        ) {
            isStraight = true;
            isAceLowStraight = true;
        }
    }

    // Count value occurrences
    const counts: Record<number, number> = {};
    values.forEach((v) => {
        counts[v] = (counts[v] || 0) + 1;
    });

    const countValues = Object.values(counts).sort((a, b) => b - a);

    if (isFlush && isStraight) {
        if (values[0] === 14 && !isAceLowStraight) {
            return { rankCategory: "Royal Flush", score: 10, description: "Royal Flush (Ace-High Straight Flush)" };
        }
        return { rankCategory: "Straight Flush", score: 9, description: `Straight Flush (${sorted[0].rank}-High)` };
    }

    if (countValues[0] === 4) {
        return { rankCategory: "Four of a Kind", score: 8, description: "Four of a Kind" };
    }

    if (countValues[0] === 3 && countValues[1] === 2) {
        return { rankCategory: "Full House", score: 7, description: "Full House (Three of a kind + Pair)" };
    }

    if (isFlush) {
        return { rankCategory: "Flush", score: 6, description: `Flush (${sorted[0].rank}-High)` };
    }

    if (isStraight) {
        return { rankCategory: "Straight", score: 5, description: `Straight (${isAceLowStraight ? "5" : sorted[0].rank}-High)` };
    }

    if (countValues[0] === 3) {
        return { rankCategory: "Three of a Kind", score: 4, description: "Three of a Kind" };
    }

    if (countValues[0] === 2 && countValues[1] === 2) {
        return { rankCategory: "Two Pair", score: 3, description: "Two Pair" };
    }

    if (countValues[0] === 2) {
        return { rankCategory: "One Pair", score: 2, description: "One Pair" };
    }

    return { rankCategory: "High Card", score: 1, description: `High Card (${sorted[0].rank})` };
};

export default function RandomCardDrawer() {
    // Config & Deck Settings State
    const [deckCount, setDeckCount] = useState<number>(1);
    const [drawSize, setDrawSize] = useState<number>(5);
    const [autoReshuffle, setAutoReshuffle] = useState<boolean>(true);

    // Deck & Hand Operational State
    const [deck, setDeck] = useState<Card[]>(() =>
        fisherYatesCryptoShuffle(createFreshDeck(1, false))
    );
    const [drawnHand, setDrawnHand] = useState<Card[]>([]);
    const [history, setHistory] = useState<CardDrawerHistoryEntry[]>([]);
    const [isShuffling, setIsShuffling] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    // Computed Values
    const cardsRemaining = deck.length;
    const totalDeckCards = deckCount * 52;
    const handEvaluation = useMemo(() => evaluatePokerHand(drawnHand), [drawnHand]);

    // Statistical Summaries across drawn history
    const historyStats = useMemo(() => {
        if (history.length === 0) return null;
        const suitCounts: Record<Suit, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
        let totalDrawn = 0;

        history.forEach((entry) => {
            entry.cards.forEach((card) => {
                suitCounts[card.suit]++;
                totalDrawn++;
            });
        });

        return {
            totalDrawn,
            suitCounts,
            spadesPct: totalDrawn ? ((suitCounts.spades / totalDrawn) * 100).toFixed(1) : "0",
            heartsPct: totalDrawn ? ((suitCounts.hearts / totalDrawn) * 100).toFixed(1) : "0",
            diamondsPct: totalDrawn ? ((suitCounts.diamonds / totalDrawn) * 100).toFixed(1) : "0",
            clubsPct: totalDrawn ? ((suitCounts.clubs / totalDrawn) * 100).toFixed(1) : "0",
        };
    }, [history]);

    // Action: Full Deck Reshuffle
    const handleReshuffleDeck = () => {
        setIsShuffling(true);
        setTimeout(() => {
            const freshDeck = createFreshDeck(Math.max(1, Math.min(8, deckCount)), false);
            const shuffled = fisherYatesCryptoShuffle(freshDeck);
            setDeck(shuffled);
            setDrawnHand([]);
            setIsShuffling(false);
        }, 400);
    };

    // Action: Draw Cards from Deck
    const handleDrawCards = () => {
        if (isShuffling) return;

        let currentDeck = [...deck];
        const requested = Math.max(1, Math.min(52, drawSize));

        // Handle deck exhaustion if Auto-Reshuffle is enabled
        if (currentDeck.length < requested) {
            if (autoReshuffle) {
                const freshDeck = createFreshDeck(Math.max(1, Math.min(8, deckCount)), false);
                currentDeck = fisherYatesCryptoShuffle(freshDeck);
            } else if (currentDeck.length === 0) {
                return;
            }
        }

        const cardsToDrawCount = Math.min(requested, currentDeck.length);
        const drawn = currentDeck.slice(0, cardsToDrawCount);
        const remaining = currentDeck.slice(cardsToDrawCount);

        setDrawnHand(drawn);
        setDeck(remaining);

        const evalResult = evaluatePokerHand(drawn);
        const newEntry: CardDrawerHistoryEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            cards: drawn,
            handEval: evalResult,
        };

        setHistory((prev) => [newEntry, ...prev].slice(0, 50));
    };

    // Action: Copy Hand Text Summary
    const handleCopyHand = () => {
        if (drawnHand.length === 0) return;
        const handText = drawnHand
            .map((c) => `${c.rank}${SUIT_SYMBOLS[c.suit]}`)
            .join(", ");
        const evalText = handEvaluation ? ` | Hand: ${handEvaluation.description}` : "";
        const fullSummary = `Drawn Card Hand: [${handText}]${evalText} (Generated via TwisterTools.com)`;

        navigator.clipboard.writeText(fullSummary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Action: Export Session CSV
    const handleExportCSV = () => {
        if (history.length === 0) return;
        const headers = ["Draw Index", "Timestamp", "Cards Drawn", "Hand Evaluation"];
        const rows = history.map((item, idx) => [
            history.length - idx,
            item.timestamp,
            item.cards.map((c) => `${c.rank}${SUIT_SYMBOLS[c.suit]}`).join(" "),
            item.handEval ? item.handEval.description : "N/A",
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "card_draw_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication & FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Playing Card Shuffler & Hand Generator",
        "url": "https://twistertools.com/tools/random-tools/random-card-drawer",
        "description": "Simulate fair, cryptographically secure 52-card deck shuffles and draw hands with real-time poker evaluation and statistical analytics.",
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
                "name": "How does the Fisher-Yates shuffle algorithm work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Fisher-Yates (Durstenfeld) shuffle produces an unbiased random permutation of a finite set by iterating backward through an array and swapping each element with a randomly chosen unpicked element at or before it."
                }
            },
            {
                "@type": "Question",
                "name": "Is this card drawer cryptographically fair?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Instead of standard pseudorandom generators like Math.random(), our tool uses Web Crypto API (crypto.getRandomValues) hardware entropy to eliminate predictive bias."
                }
            },
            {
                "@type": "Question",
                "name": "What are the exact odds of getting a Royal Flush in 5-card poker?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Out of 2,598,960 possible 5-card hands drawn from a standard 52-card deck, exactly 4 are Royal Flushes. The probability is 4 / 2,598,960 = 0.000154% (or 1 in 649,740 hands)."
                }
            },
            {
                "@type": "Question",
                "name": "Can I simulate multi-deck shoe card dealing for Blackjack?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can configure up to 8 standard 52-card decks (416 cards total) in the settings panel to simulate authentic multi-deck casino card dealing environments."
                }
            },
            {
                "@type": "Question",
                "name": "Why are physical riffle shuffles often imperfect compared to digital algorithms?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Physical riffle shuffles follow the Gilbert-Shannon-Reeds model. Studies show it takes at least 7 full physical riffle shuffles to randomize a standard 52-card deck thoroughly, whereas our digital Fisher-Yates shuffle achieves complete unbiased statistical randomness instantaneously in a single execution."
                }
            },
            {
                "@type": "Question",
                "name": "What is card counting and does drawing without replacement change odds?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Drawing without replacement creates conditional dependencies (Hypergeometric Distribution). As high cards leave the deck, the probability density of drawing remaining low cards increases, forming the mathematical foundation of blackjack card counting."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* WORKSPACE GRID (50/50 SPLIT) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* LEFT PANEL: Interactive Controls & Card Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 flex flex-col justify-between min-w-0">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Dices className="w-5 h-5 text-indigo-600" />
                                    Deck & Deal Settings
                                </h2>
                                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                                    {cardsRemaining} / {totalDeckCards} Cards
                                </span>
                            </div>
                            <button
                                onClick={handleReshuffleDeck}
                                disabled={isShuffling}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCw className={`w-3.5 h-3.5 ${isShuffling ? "animate-spin text-indigo-600" : ""}`} />
                                Reshuffle Shoe
                            </button>
                        </div>

                        {/* Inputs & Settings Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Cards to Draw
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="52"
                                        value={drawSize === 0 ? "" : drawSize}
                                        onChange={(e) => handleNumberInput(e, setDrawSize)}
                                        className="w-full pl-3 pr-12 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        Cards
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Number of Decks
                                </label>
                                <select
                                    value={deckCount}
                                    onChange={(e) => {
                                        const count = parseInt(e.target.value, 10);
                                        setDeckCount(count);
                                        const freshDeck = createFreshDeck(count, false);
                                        setDeck(fisherYatesCryptoShuffle(freshDeck));
                                        setDrawnHand([]);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white cursor-pointer"
                                >
                                    <option value={1}>1 Deck (52 cards)</option>
                                    <option value={2}>2 Decks (104 cards)</option>
                                    <option value={4}>4 Decks (208 cards)</option>
                                    <option value={6}>6 Decks (312 cards)</option>
                                    <option value={8}>8 Decks (416 cards)</option>
                                </select>
                            </div>
                        </div>

                        {/* Quick Presets & Auto-Reshuffle Toggle */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-400 uppercase mr-1">Presets:</span>
                                {[1, 5, 7, 13].map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setDrawSize(preset)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${drawSize === preset
                                            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        {preset} {preset === 1 ? "Card" : "Cards"}
                                    </button>
                                ))}
                            </div>

                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoReshuffle}
                                    onChange={(e) => setAutoReshuffle(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                Auto-Reshuffle on Empty
                            </label>
                        </div>

                        {/* Primary Action Button */}
                        <button
                            onClick={handleDrawCards}
                            disabled={isShuffling || (deck.length === 0 && !autoReshuffle)}
                            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Shuffle className="w-5 h-5" />
                            Draw {drawSize} {drawSize === 1 ? "Card" : "Cards"}
                        </button>

                        {/* Interactive Virtual Felt Playing Card Display */}
                        <div className="p-4 sm:p-6 bg-emerald-900 rounded-2xl border-4 border-emerald-950 shadow-inner min-h-[200px] flex flex-col justify-center items-center relative overflow-hidden">
                            <div className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-widest text-emerald-300/40 select-none">
                                Virtual Casino Felt
                            </div>

                            {drawnHand.length === 0 ? (
                                <div className="text-center space-y-2 py-6">
                                    <Dices className="w-10 h-10 text-emerald-400/50 mx-auto" />
                                    <p className="text-sm font-semibold text-emerald-200/80">
                                        Click "Draw Cards" to deal from the active deck.
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full space-y-4">
                                    {/* Cards Flex Grid */}
                                    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                                        {drawnHand.map((card, idx) => (
                                            <div
                                                key={`${card.id}-${idx}`}
                                                className="w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-xl shadow-lg border border-slate-200 p-2 flex flex-col justify-between transform transition hover:-translate-y-1 select-none flex-shrink-0"
                                            >
                                                {/* Top Left Rank + Suit */}
                                                <div className={`text-xs sm:text-sm font-bold leading-none ${SUIT_COLORS[card.suit]}`}>
                                                    <div>{card.rank}</div>
                                                    <div className="text-xs sm:text-sm">{SUIT_SYMBOLS[card.suit]}</div>
                                                </div>

                                                {/* Center Large Suit Symbol */}
                                                <div className={`text-2xl sm:text-3xl text-center leading-none ${SUIT_COLORS[card.suit]}`}>
                                                    {SUIT_SYMBOLS[card.suit]}
                                                </div>

                                                {/* Bottom Right Rank + Suit (Inverted) */}
                                                <div className={`text-xs sm:text-sm font-bold leading-none text-right rotate-180 ${SUIT_COLORS[card.suit]}`}>
                                                    <div>{card.rank}</div>
                                                    <div className="text-xs sm:text-sm">{SUIT_SYMBOLS[card.suit]}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Poker Hand Evaluation Badge */}
                                    {handEvaluation && (
                                        <div className="text-center pt-2">
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold tracking-wide shadow-md">
                                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                                {handEvaluation.description}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyHand}
                            disabled={drawnHand.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Hand Text"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={history.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: Session Analytics & History Log */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 flex flex-col justify-between min-w-0">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Shoe Stats & History Log
                            </h2>
                            <span className="text-xs font-semibold text-slate-500">
                                {history.length} Deals Logged
                            </span>
                        </div>

                        {/* Deck Status Overview Box */}
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
                                <span>Remaining Cards in Shoe</span>
                                <span className="text-indigo-600 font-extrabold">{cardsRemaining} / {totalDeckCards}</span>
                            </div>

                            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full transition-all duration-300"
                                    style={{ width: `${(cardsRemaining / totalDeckCards) * 100}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-medium text-slate-700">
                                <div>Decks Active: <strong className="text-slate-900">{deckCount}</strong></div>
                                <div>Cards Drawn So Far: <strong className="text-slate-900">{historyStats ? historyStats.totalDrawn : 0}</strong></div>
                            </div>
                        </div>

                        {/* Suit Distribution Breakdown */}
                        {historyStats && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Session Suit Frequency
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                        <span className="text-slate-900 text-sm font-bold block">♠ {historyStats.spadesPct}%</span>
                                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Spades ({historyStats.suitCounts.spades})</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                        <span className="text-rose-600 text-sm font-bold block">♥ {historyStats.heartsPct}%</span>
                                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Hearts ({historyStats.suitCounts.hearts})</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                        <span className="text-rose-600 text-sm font-bold block">♦ {historyStats.diamondsPct}%</span>
                                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Diamonds ({historyStats.suitCounts.diamonds})</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                        <span className="text-slate-900 text-sm font-bold block">♣ {historyStats.clubsPct}%</span>
                                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Clubs ({historyStats.suitCounts.clubs})</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scrollable Hand Deal Log */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Recent Hand Draws
                            </h3>
                            <div className="max-h-[240px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                {history.length === 0 ? (
                                    <p className="p-4 text-center text-xs text-slate-400">No hands dealt yet in this session.</p>
                                ) : (
                                    history.map((entry, idx) => (
                                        <div key={entry.id} className="p-3 hover:bg-slate-50 text-xs flex items-center justify-between gap-2">
                                            <div className="space-y-1 min-w-0">
                                                <div className="font-mono font-bold text-slate-900 truncate">
                                                    {entry.cards.map((c) => `${c.rank}${SUIT_SYMBOLS[c.suit]}`).join(" ")}
                                                </div>
                                                {entry.handEval && (
                                                    <div className="text-[11px] font-semibold text-indigo-600">
                                                        {entry.handEval.description}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right text-[10px] text-slate-400 whitespace-nowrap">
                                                {entry.timestamp}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Web Crypto API Entropy
                        </span>
                        <span>Fisher-Yates Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Combinatorics & Poker Mathematics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Combinatorial Mathematics of Standard 52-Card Decks
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A standard French playing card deck contains 52 distinct cards divided equally into four suits (Spades ♠, Hearts ♥, Diamonds ♦, and Clubs ♣) with 13 rank hierarchy values (2 through Ace). The number of total possible permutations in a single 52-card deck is given by 52 factorial ($52!$):
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto text-xs sm:text-sm">
                        52! = 80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        This astronomical number (approximately $8.06 \times 10^{67}$) ensures that every time a 52-card deck is thoroughly shuffled, the resulting order is virtually guaranteed to have never existed before in human history.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> 5-Card Combinations Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The total number of unique 5-card poker hands possible from a 52-card deck is computed using the binomial combination coefficient:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                C(52, 5) = 52! / (5! × (52 - 5)!) = 2,598,960 Hands
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Fisher-Yates Algorithm Unbias
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Our card drawer implements the modern Durstenfeld variant of the Fisher-Yates shuffle algorithm coupled with browser cryptographic hardware randomness:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                crypto.getRandomValues(new Uint32Array(1)) % (i + 1)
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Hypergeometric Probability & Dealing Without Replacement */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Hypergeometric Distribution & Dealing Without Replacement
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unlike coin flips or die rolls where outcomes are independent (sampling with replacement), dealing cards from a deck is a sampling process <strong>without replacement</strong>. This means each drawn card alters the probability distribution for all subsequent draws. Mathematically, the probability of drawing $k$ success cards in a hand of size $n$ drawn from a deck of size $N$ containing $K$ total target cards is modeled by the <strong>Hypergeometric Distribution</strong>:
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto text-xs sm:text-sm">
                        P(X = k) = [ C(K, k) × C(N - K, n - k) ] / C(N, n)
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 uppercase">Population Size (N)</span>
                            <p className="text-sm font-semibold text-slate-900">Total Cards in Shoe</p>
                            <p className="text-xs text-slate-600">52 for a single deck, or up to 416 cards in multi-deck casino setups.</p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 uppercase">Success States (K)</span>
                            <p className="text-sm font-semibold text-slate-900">Target Card Count</p>
                            <p className="text-xs text-slate-600">e.g., 4 Aces, 16 Ten-value cards in Blackjack, or 13 cards of a specific suit.</p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 uppercase">Draw Sample (n)</span>
                            <p className="text-sm font-semibold text-slate-900">Hand Size Dealt</p>
                            <p className="text-xs text-slate-600">Number of cards drawn simultaneously or sequentially without reshuffling.</p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Poker Hand Probability Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard 5-Card Poker Hand Probabilities
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The ranking system in poker directly correlates with mathematical rarity. Below is the complete statistical probability distribution for all 5-card poker hands drawn from a single standard 52-card deck:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Hand Rank</th>
                                    <th className="p-3">Combinations</th>
                                    <th className="p-3">Probability %</th>
                                    <th className="p-3">Odds Against</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Royal Flush</td>
                                    <td className="p-3 font-mono">4</td>
                                    <td className="p-3 font-bold text-indigo-600">0.000154%</td>
                                    <td className="p-3">649,739 : 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Straight Flush</td>
                                    <td className="p-3 font-mono">36</td>
                                    <td className="p-3 font-bold text-indigo-600">0.001385%</td>
                                    <td className="p-3">72,192 : 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Four of a Kind</td>
                                    <td className="p-3 font-mono">624</td>
                                    <td className="p-3 font-bold text-indigo-600">0.02401%</td>
                                    <td className="p-3">4,164 : 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Full House</td>
                                    <td className="p-3 font-mono">3,744</td>
                                    <td className="p-3 font-bold text-indigo-600">0.1441%</td>
                                    <td className="p-3">693 : 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Flush</td>
                                    <td className="p-3 font-mono">5,108</td>
                                    <td className="p-3 font-bold text-indigo-600">0.1965%</td>
                                    <td className="p-3">508 : 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Straight</td>
                                    <td className="p-3 font-mono">10,200</td>
                                    <td className="p-3 font-bold text-indigo-600">0.3925%</td>
                                    <td className="p-3">254 : 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Three of a Kind</td>
                                    <td className="p-3 font-mono">54,912</td>
                                    <td className="p-3 font-bold text-indigo-600">2.1128%</td>
                                    <td className="p-3">46.3 : 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Two Pair</td>
                                    <td className="p-3 font-mono">123,552</td>
                                    <td className="p-3 font-bold text-indigo-600">4.7539%</td>
                                    <td className="p-3">20.0 : 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">One Pair</td>
                                    <td className="p-3 font-mono">1,098,240</td>
                                    <td className="p-3 font-bold text-indigo-600">42.2569%</td>
                                    <td className="p-3">1.37 : 1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">High Card</td>
                                    <td className="p-3 font-mono">1,302,540</td>
                                    <td className="p-3 font-bold text-indigo-600">50.1177%</td>
                                    <td className="p-3">0.995 : 1</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Practical Worked Probability Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Probability Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To understand how probabilities are calculated in card games, explore these step-by-step worked case studies:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Drawing at Least 1 Ace in a 5-Card Hand</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Hypergeometric</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Question:</strong> What is the probability of getting at least one Ace when dealt 5 cards?</li>
                                <li><strong>Step 1:</strong> Calculate total non-Ace cards: $52 - 4 = 48$.</li>
                                <li><strong>Step 2:</strong> Calculate combinations of getting 0 Aces: $C(48, 5) = 1,712,304$.</li>
                                <li><strong>Step 3:</strong> Divide by total hands: $1,712,304 / 2,598,960 = 0.6588$ (65.88% chance of 0 Aces).</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Result: $100\% - 65.88\% = 34.12\%$ chance of holding 1+ Aces.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Suited Blackjack Probability (Natural 21)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Blackjack</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Question:</strong> What are the odds of drawing a Natural 21 (Ace + 10-value card)?</li>
                                <li><strong>Step 1:</strong> Ace count = 4; Ten-value count (10, J, Q, K) = 16.</li>
                                <li><strong>Step 2:</strong> Favorable 2-card combinations = $4 \times 16 = 64$.</li>
                                <li><strong>Step 3:</strong> Total 2-card combinations from 52 cards = $C(52, 2) = 1,326$.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Result: $64 / 1,326 = 4.827\%$ (approx 1 in 20.7 hands).
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Cognitive Biases & Physical vs Algorithmic Card Shuffling */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Physical Shuffling Physics vs Digital Cryptographic Entropy
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Human perception of randomness often clashes with mathematical reality. Understanding the mechanics of physical card manipulation versus cryptographic software shuffling highlights key differences:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Target className="w-4 h-4 text-indigo-600" /> 7 Riffle Shuffle Rule
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Mathematician Persi Diaconis proved that a physical deck requires at least 7 riffle shuffles to achieve mathematical unbias. Fewer shuffles leave significant sequence correlations from previous hands.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600" /> Clustering Illusion
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Players often perceive naturally occurring streaks (such as drawing 3 consecutive suit cards) as "non-random." In truth, true random distributions naturally feature clusters and streaks.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Hardware PRNG
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Standard software PRNGs like <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">Math.random()</code> are pseudo-random. Our Fisher-Yates implementation uses Web Crypto API entropy for true zero-bias results.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Static FAQ Section */}
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
                                How does the Fisher-Yates shuffle algorithm work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Fisher-Yates (Durstenfeld) shuffle produces an unbiased random permutation of a finite set by iterating backward through an array and swapping each element with a randomly chosen unpicked element at or before it.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is this card drawer cryptographically fair?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Instead of standard pseudorandom generators like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code>, our tool uses Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>) hardware entropy to eliminate predictive bias.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the exact odds of getting a Royal Flush in 5-card poker?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Out of 2,598,960 possible 5-card hands drawn from a standard 52-card deck, exactly 4 are Royal Flushes. The probability is 4 / 2,598,960 = 0.000154% (or 1 in 649,740 hands).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I simulate multi-deck shoe card dealing for Blackjack?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can configure up to 8 standard 52-card decks (416 cards total) in the settings panel to simulate authentic multi-deck casino card dealing environments.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why are physical riffle shuffles often imperfect compared to digital algorithms?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Physical riffle shuffles follow the Gilbert-Shannon-Reeds model. Studies show it takes at least 7 full physical riffle shuffles to randomize a standard 52-card deck thoroughly, whereas our digital Fisher-Yates shuffle achieves complete unbiased statistical randomness instantaneously in a single execution.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is card counting and does drawing without replacement change odds?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Drawing without replacement creates conditional dependencies (Hypergeometric Distribution). As high cards leave the deck, the probability density of drawing remaining low cards increases, forming the mathematical foundation of blackjack card counting.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}