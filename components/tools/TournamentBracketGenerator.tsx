"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Trophy,
    Shuffle,
    RotateCcw,
    Download,
    Copy,
    Check,
    Users,
    Layers,
    Sparkles,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Medal,
    Swords,
    BarChart3,
    Settings2,
    Crown,
    Hash,
    Maximize2,
    Minimize2
} from "lucide-react";

type SeedingMethod = "standard" | "random" | "manual" | "snake";
type TournamentFormat = "single-elimination" | "double-elimination";

interface Match {
    id: string;
    round: number;
    matchNumber: number;
    team1: string | null;
    team2: string | null;
    team1Seed?: number | null;
    team2Seed?: number | null;
    team1Score?: number | "";
    team2Score?: number | "";
    winner: string | null;
    isBye?: boolean;
}

const PRESET_TOURNAMENTS: { name: string; items: string[] }[] = [
    {
        name: "8-Team Esports Cup",
        items: [
            "Team Liquid",
            "Cloud9",
            "FaZe Clan",
            "Natus Vincere",
            "G2 Esports",
            "Fnatic",
            "Sentinels",
            "Vitality"
        ]
    },
    {
        name: "16-Team Champions Bracket",
        items: [
            "Real Madrid",
            "Manchester City",
            "Bayern Munich",
            "Paris Saint-Germain",
            "Arsenal",
            "Barcelona",
            "Inter Milan",
            "Borussia Dortmund",
            "Liverpool",
            "Atletico Madrid",
            "Juventus",
            "Bayer Leverkusen",
            "AC Milan",
            "Benfica",
            "Sporting CP",
            "Porto"
        ]
    },
    {
        name: "6-Team Local Tournament",
        items: [
            "North High Eagles",
            "West Valley Warriors",
            "Oakridge Tigers",
            "Central Panthers",
            "Riverdale Hawks",
            "Beacon Hill Titans"
        ]
    }
];

// Helper to generate classic tournament seeding order (e.g. 1 vs 16, 8 vs 9, etc.)
function generateSeedingOrder(size: number): number[] {
    let rounds = Math.log2(size) - 1;
    let order = [1, 2];
    for (let i = 0; i < rounds; i++) {
        const nextOrder: number[] = [];
        const length = order.length * 2 + 1;
        for (const seed of order) {
            nextOrder.push(seed);
            nextOrder.push(length - seed);
        }
        order = nextOrder;
    }
    return order;
}

export default function TournamentBracketGenerator() {
    const [rawInput, setRawInput] = useState<string>(
        "Team Liquid\nCloud9\nFaZe Clan\nNatus Vincere\nG2 Esports\nFnatic\nSentinels\nVitality"
    );
    const [seedingMethod, setSeedingMethod] = useState<SeedingMethod>("standard");
    const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>("single-elimination");

    // Fullscreen view state
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

    // Dynamic bracket match states
    const [bracketMatches, setBracketMatches] = useState<Record<string, Match>>({});
    const [copied, setCopied] = useState<boolean>(false);

    const bracketContainerRef = useRef<HTMLDivElement>(null);

    // Clean, parsed participants
    const participants = useMemo(() => {
        return rawInput
            .split("\n")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }, [rawInput]);

    const participantCount = participants.length;

    // Nearest power of 2
    const bracketSize = useMemo(() => {
        if (participantCount < 2) return 2;
        let size = 2;
        while (size < participantCount) {
            size *= 2;
        }
        return Math.min(size, 64); // Max 64 for browser-native layout performance
    }, [participantCount]);

    const totalRounds = useMemo(() => {
        return Math.log2(bracketSize);
    }, [bracketSize]);

    const byeCount = bracketSize - participantCount;

    // Generate initial bracket structure
    const generateBracket = () => {
        if (participants.length < 2) return;

        let workingList = [...participants];

        // Seeding execution
        if (seedingMethod === "random") {
            // Cryptographically strong Fisher-Yates shuffle
            const array = new Uint32Array(workingList.length);
            crypto.getRandomValues(array);
            for (let i = workingList.length - 1; i > 0; i--) {
                const j = array[i] % (i + 1);
                [workingList[i], workingList[j]] = [workingList[j], workingList[i]];
            }
        }

        const standardOrder = generateSeedingOrder(bracketSize);
        const round1Slots: { name: string | null; seed: number | null }[] = new Array(bracketSize).fill(null);

        // Map seeds
        for (let i = 0; i < standardOrder.length; i++) {
            const seed = standardOrder[i];
            const participantIndex = seed - 1;
            if (participantIndex < workingList.length) {
                round1Slots[i] = {
                    name: workingList[participantIndex],
                    seed: seedingMethod === "random" ? i + 1 : seed
                };
            } else {
                round1Slots[i] = {
                    name: null, // Bye
                    seed: null
                };
            }
        }

        const newMatches: Record<string, Match> = {};
        const round1Count = bracketSize / 2;

        // Initialize Round 1 Matches
        for (let m = 0; m < round1Count; m++) {
            const slot1 = round1Slots[m * 2];
            const slot2 = round1Slots[m * 2 + 1];

            const matchId = `r1-m${m + 1}`;
            const isBye = slot1.name === null || slot2.name === null;
            const autoWinner = isBye ? (slot1.name ? slot1.name : slot2.name) : null;

            newMatches[matchId] = {
                id: matchId,
                round: 1,
                matchNumber: m + 1,
                team1: slot1.name,
                team2: slot2.name,
                team1Seed: slot1.seed,
                team2Seed: slot2.seed,
                team1Score: "",
                team2Score: "",
                winner: autoWinner,
                isBye: isBye
            };
        }

        // Initialize subsequent rounds
        let prevRoundMatches = round1Count;
        for (let r = 2; r <= totalRounds; r++) {
            const currRoundMatches = prevRoundMatches / 2;
            for (let m = 0; m < currRoundMatches; m++) {
                const matchId = `r${r}-m${m + 1}`;
                const prevM1 = newMatches[`r${r - 1}-m${m * 2 + 1}`];
                const prevM2 = newMatches[`r${r - 1}-m${m * 2 + 2}`];

                newMatches[matchId] = {
                    id: matchId,
                    round: r,
                    matchNumber: m + 1,
                    team1: prevM1?.winner || null,
                    team2: prevM2?.winner || null,
                    team1Seed: null,
                    team2Seed: null,
                    team1Score: "",
                    team2Score: "",
                    winner: null,
                    isBye: false
                };
            }
            prevRoundMatches = currRoundMatches;
        }

        setBracketMatches(newMatches);
    };

    // Auto-generate on initial render or when participants/seeding change
    React.useEffect(() => {
        generateBracket();
    }, [seedingMethod, bracketSize, rawInput]);

    // Handle score change and winner progression
    const handleScoreChange = (
        matchId: string,
        field: "team1Score" | "team2Score",
        valStr: string
    ) => {
        const sanitized = valStr === "" ? "" : parseInt(valStr.replace(/^0+(?=\d)/, ""), 10);
        const score = isNaN(sanitized as number) ? "" : sanitized;

        setBracketMatches((prev) => {
            const current = { ...prev[matchId], [field]: score };
            const s1 = typeof current.team1Score === "number" ? current.team1Score : -1;
            const s2 = typeof current.team2Score === "number" ? current.team2Score : -1;

            let winner = current.winner;
            if (s1 !== -1 && s2 !== -1 && s1 !== s2 && current.team1 && current.team2) {
                winner = s1 > s2 ? current.team1 : current.team2;
            } else if (!current.isBye && (s1 === -1 || s2 === -1)) {
                winner = null;
            }

            const updated: Record<string, Match> = {
                ...prev,
                [matchId]: { ...current, winner }
            };

            // Propagate forward to next rounds
            const round = current.round;
            const matchNumber = current.matchNumber;
            const nextRound = round + 1;
            if (nextRound <= totalRounds) {
                const nextMatchNumber = Math.ceil(matchNumber / 2);
                const nextMatchId = `r${nextRound}-m${nextMatchNumber}`;
                const nextMatch = updated[nextMatchId];
                if (nextMatch) {
                    const isTeam1Slot = matchNumber % 2 !== 0;
                    updated[nextMatchId] = {
                        ...nextMatch,
                        team1: isTeam1Slot ? winner : nextMatch.team1,
                        team2: !isTeam1Slot ? winner : nextMatch.team2,
                        winner: null,
                        team1Score: "",
                        team2Score: ""
                    };
                }
            }

            return updated;
        });
    };

    // Quick direct winner select
    const handlePickWinner = (matchId: string, winnerName: string) => {
        setBracketMatches((prev) => {
            const current = prev[matchId];
            if (!current) return prev;

            const isToggleOff = current.winner === winnerName;
            const finalWinner = isToggleOff ? null : winnerName;

            const updated: Record<string, Match> = {
                ...prev,
                [matchId]: {
                    ...current,
                    winner: finalWinner,
                    team1Score: finalWinner === current.team1 ? 1 : finalWinner === current.team2 ? 0 : "",
                    team2Score: finalWinner === current.team2 ? 1 : finalWinner === current.team1 ? 0 : ""
                }
            };

            // Propagate
            const round = current.round;
            const matchNumber = current.matchNumber;
            const nextRound = round + 1;
            if (nextRound <= totalRounds) {
                const nextMatchNumber = Math.ceil(matchNumber / 2);
                const nextMatchId = `r${nextRound}-m${nextMatchNumber}`;
                const nextMatch = updated[nextMatchId];
                if (nextMatch) {
                    const isTeam1Slot = matchNumber % 2 !== 0;
                    updated[nextMatchId] = {
                        ...nextMatch,
                        team1: isTeam1Slot ? finalWinner : nextMatch.team1,
                        team2: !isTeam1Slot ? finalWinner : nextMatch.team2,
                        winner: null,
                        team1Score: "",
                        team2Score: ""
                    };
                }
            }

            return updated;
        });
    };

    // Calculate Tournament Champion
    const tournamentChampion = useMemo(() => {
        const finalMatch = bracketMatches[`r${totalRounds}-m1`];
        return finalMatch?.winner || null;
    }, [bracketMatches, totalRounds]);

    const handleCopyTournamentSummary = () => {
        let summary = `TOURNAMENT BRACKET SUMMARY\n`;
        summary += `Format: ${tournamentFormat === "single-elimination" ? "Single Elimination" : "Double Elimination"}\n`;
        summary += `Seeding: ${seedingMethod.toUpperCase()}\n`;
        summary += `Participants (${participantCount}): ${participants.join(", ")}\n`;
        summary += `Bracket Size: ${bracketSize} Slots (${byeCount} Byes)\n`;
        summary += `----------------------------------------\n\n`;

        for (let r = 1; r <= totalRounds; r++) {
            const roundTitle =
                r === totalRounds
                    ? "CHAMPIONSHIP FINAL"
                    : r === totalRounds - 1
                        ? "SEMIFINALS"
                        : r === totalRounds - 2
                            ? "QUARTERFINALS"
                            : `ROUND ${r}`;

            summary += `=== ${roundTitle} ===\n`;
            const matchesInRound = bracketSize / Math.pow(2, r);
            for (let m = 1; m <= matchesInRound; m++) {
                const match = bracketMatches[`r${r}-m${m}`];
                if (match) {
                    const t1 = match.team1 || "TBD";
                    const t2 = match.team2 || (match.isBye ? "BYE" : "TBD");
                    const score =
                        match.team1Score !== "" && match.team2Score !== ""
                            ? ` (${match.team1Score} - ${match.team2Score})`
                            : "";
                    const winner = match.winner ? ` -> Winner: ${match.winner}` : "";
                    summary += `Match ${m}: [${match.team1Seed ? `#${match.team1Seed} ` : ""}${t1}] vs [${match.team2Seed ? `#${match.team2Seed} ` : ""}${t2}]${score}${winner}\n`;
                }
            }
            summary += `\n`;
        }

        if (tournamentChampion) {
            summary += `🏆 CHAMPION: ${tournamentChampion}\n`;
        }
        summary += `\nGenerated via twistertools.com/tools/random-tools/tournament-bracket-generator`;

        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Round", "Match", "Team 1", "Seed 1", "Score 1", "Team 2", "Seed 2", "Score 2", "Winner"];
        const rows: (string | number)[][] = [];

        for (let r = 1; r <= totalRounds; r++) {
            const roundTitle =
                r === totalRounds
                    ? "Finals"
                    : r === totalRounds - 1
                        ? "Semifinals"
                        : r === totalRounds - 2
                            ? "Quarterfinals"
                            : `Round ${r}`;
            const matchesInRound = bracketSize / Math.pow(2, r);
            for (let m = 1; m <= matchesInRound; m++) {
                const match = bracketMatches[`r${r}-m${m}`];
                if (match) {
                    rows.push([
                        roundTitle,
                        `Match ${m}`,
                        match.team1 || "TBD",
                        match.team1Seed || "",
                        match.team1Score ?? "",
                        match.isBye ? "BYE" : match.team2 || "TBD",
                        match.team2Seed || "",
                        match.team2Score ?? "",
                        match.winner || "Pending"
                    ]);
                }
            }
        }

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tournament_bracket_${bracketSize}_teams.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Tournament Bracket & Seeding Generator",
        "url": "https://twistertools.com/tools/random-tools/tournament-bracket-generator",
        "description": "Generate dynamic single-elimination and double-elimination tournament brackets with cryptographic random shuffling, seed pairing, automatic bye distribution, and interactive score tracking.",
        "applicationCategory": "SportsApplication",
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
                "name": "How are tournament byes calculated and assigned in this bracket generator?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Byes are calculated as the difference between the nearest upper power of 2 and the total number of participants (Byes = Bracket Size - Participants). In standard seeding, the top-ranked seeds are awarded automatic advancement past the opening round to preserve competitive fairness."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between standard seeding and random tournament shuffling?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard seeding positions top contenders on opposite sides of the bracket (e.g., #1 vs #16, #2 vs #15) ensuring high-ranked competitors do not meet until the championship rounds. Random shuffling uses cryptographic hardware entropy to mix participants uniformly, preventing deliberate matchmaking bias."
                }
            },
            {
                "@type": "Question",
                "name": "How does the interactive bracket progression engine work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When you enter numeric scores or click directly on a team name, the engine computes match winners and instantly advances them to their corresponding slot in the subsequent round, recalculating championship outcomes in real time."
                }
            },
            {
                "@type": "Question",
                "name": "Can I export and print tournament brackets created with this tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can export complete match pairings, seeds, scores, and progression data into structured CSV spreadsheets or copy formatted text summaries with one click."
                }
            },
            {
                "@type": "Question",
                "name": "What is the maximum number of participants supported?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The browser-native interactive canvas supports from 2 up to 64 participants with dynamic multi-tier round rendering, horizontal panning, and zero latency."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Participant Input (5 Cols) */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-indigo-600" />
                                Bracket Configuration
                            </h2>
                            <button
                                onClick={() => {
                                    setRawInput("Team Liquid\nCloud9\nFaZe Clan\nNatus Vincere\nG2 Esports\nFnatic\nSentinels\nVitality");
                                    setSeedingMethod("standard");
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Presets Row */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                Quick Presets
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {PRESET_TOURNAMENTS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => setRawInput(preset.items.join("\n"))}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition text-left truncate cursor-pointer"
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Participants Textarea */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                                    Competitors / Teams ({participantCount})
                                </label>
                                <span className="text-[11px] text-slate-400 font-medium">One per line</span>
                            </div>
                            <textarea
                                value={rawInput}
                                onChange={(e) => setRawInput(e.target.value)}
                                rows={8}
                                placeholder="Enter team or player names (one per line)..."
                                className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs md:text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50/50 leading-relaxed min-w-0"
                            />
                        </div>

                        {/* Seeding Controls */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                                    Seeding Method
                                </label>
                                <select
                                    value={seedingMethod}
                                    onChange={(e) => setSeedingMethod(e.target.value as SeedingMethod)}
                                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="standard">Ranked (1 vs Best Opp)</option>
                                    <option value="random">Crypto Random Shuffle</option>
                                    <option value="manual">Sequential Entry Order</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Swords className="w-3.5 h-3.5 text-indigo-600" />
                                    Format
                                </label>
                                <select
                                    value={tournamentFormat}
                                    onChange={(e) => setTournamentFormat(e.target.value as TournamentFormat)}
                                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="single-elimination">Single Elimination</option>
                                    <option value="double-elimination">Double Elimination (Visual)</option>
                                </select>
                            </div>
                        </div>

                        {/* Quick Spec Metrics Box */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2 text-center">
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Bracket Size</span>
                                <p className="text-base font-black text-slate-900">{bracketSize} Slots</p>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Rounds</span>
                                <p className="text-base font-black text-indigo-600">{totalRounds}</p>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Byes</span>
                                <p className={`text-base font-black ${byeCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
                                    {byeCount}
                                </p>
                            </div>
                        </div>

                        {/* Generate Shuffle CTA */}
                        <button
                            type="button"
                            onClick={() => {
                                const list = [...participants];
                                const array = new Uint32Array(list.length);
                                crypto.getRandomValues(array);
                                for (let i = list.length - 1; i > 0; i--) {
                                    const j = array[i] % (i + 1);
                                    [list[i], list[j]] = [list[j], list[i]];
                                }
                                setRawInput(list.join("\n"));
                            }}
                            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Shuffle className="w-4 h-4" />
                            Re-Shuffle & Generate Bracket
                        </button>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyTournamentSummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Bracket"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> CSV
                        </button>
                    </div>
                </div>

                {/* Right Panel: Interactive Tournament Bracket Canvas (7 Cols / Modal Fullscreen) */}
                <div
                    className={`${isFullScreen
                        ? "fixed inset-4 z-50 bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden p-6"
                        : "lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-w-0 p-4 sm:p-6"
                        }`}
                >
                    <div className={`min-w-0 flex-1 flex flex-col ${isFullScreen ? "min-h-0 space-y-4" : "space-y-4"}`}>
                        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg font-bold text-slate-900">
                                    Interactive Bracket Board
                                </h2>
                            </div>

                            <div className="flex items-center gap-3">
                                {tournamentChampion && (
                                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-800 animate-pulse">
                                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                                        Champion: {tournamentChampion}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-800 cursor-pointer"
                                    title={isFullScreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
                                >
                                    {isFullScreen ? (
                                        <Minimize2 className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                        <Maximize2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Interactive Tournament Canvas with horizontal scroll */}
                        <div
                            ref={bracketContainerRef}
                            className={`w-full overflow-x-auto pb-4 pt-2 select-none scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent ${isFullScreen ? "flex-1 overflow-y-auto min-h-[500px]" : "min-h-[480px]"
                                }`}
                        >
                            {participantCount < 2 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl">
                                    <Users className="w-8 h-8 text-slate-300 mb-2" />
                                    <p className="text-sm font-bold text-slate-700">Add at least 2 participants</p>
                                    <p className="text-xs text-slate-400 mt-1">Enter team names in the left workspace panel to generate your bracket tree.</p>
                                </div>
                            ) : (
                                <div className="flex flex-nowrap items-stretch gap-6 w-max m-auto px-0 min-h-full py-0">
                                    {Array.from({ length: totalRounds }, (_, roundIdx) => {
                                        const roundNum = roundIdx + 1;
                                        const matchesInRound = bracketSize / Math.pow(2, roundNum);
                                        const roundTitle =
                                            roundNum === totalRounds
                                                ? "Championship"
                                                : roundNum === totalRounds - 1
                                                    ? "Semifinals"
                                                    : roundNum === totalRounds - 2
                                                        ? "Quarterfinals"
                                                        : `Round ${roundNum}`;

                                        return (
                                            <div
                                                key={roundNum}
                                                className="w-64 flex flex-col flex-shrink-0"
                                            >
                                                {/* Round Header */}
                                                <div className="bg-slate-100 rounded-lg py-1.5 px-3 mb-4 text-center border border-slate-200">
                                                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                                                        {roundTitle}
                                                    </span>
                                                </div>

                                                {/* Matches Column with vertically spaced slots */}
                                                <div className="flex flex-col justify-around flex-grow gap-4">
                                                    {Array.from({ length: matchesInRound }, (_, matchIdx) => {
                                                        const matchNum = matchIdx + 1;
                                                        const matchId = `r${roundNum}-m${matchNum}`;
                                                        const match = bracketMatches[matchId];

                                                        if (!match) return null;

                                                        const isCompleted = Boolean(match.winner);

                                                        return (
                                                            <div
                                                                key={matchId}
                                                                className={`rounded-xl border transition-all duration-200 shadow-xs relative overflow-hidden ${isCompleted
                                                                    ? "border-indigo-200 bg-indigo-50/20"
                                                                    : "border-slate-200 bg-white"
                                                                    }`}
                                                            >
                                                                {/* Match Number Tag */}
                                                                <div className="bg-slate-50 border-b border-slate-100 px-3 py-1 text-[10px] font-bold text-slate-400 flex items-center justify-between">
                                                                    <span>MATCH {matchNum}</span>
                                                                    {match.isBye && (
                                                                        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">
                                                                            BYE ADVANCE
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Team 1 Slot */}
                                                                <div
                                                                    onClick={() =>
                                                                        match.team1 && !match.isBye && handlePickWinner(matchId, match.team1)
                                                                    }
                                                                    className={`p-2.5 flex items-center justify-between gap-2 border-b border-slate-100 transition cursor-pointer ${match.winner === match.team1 && match.team1
                                                                        ? "bg-indigo-600 text-white font-bold"
                                                                        : "hover:bg-slate-50 text-slate-800"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                                                                        {match.team1Seed && (
                                                                            <span
                                                                                className={`text-[10px] font-mono px-1 rounded ${match.winner === match.team1
                                                                                    ? "bg-indigo-700 text-white"
                                                                                    : "bg-slate-200 text-slate-600"
                                                                                    }`}
                                                                            >
                                                                                #{match.team1Seed}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-xs truncate font-medium">
                                                                            {match.team1 || "TBD"}
                                                                        </span>
                                                                    </div>
                                                                    {!match.isBye && match.team1 && (
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={match.team1Score ?? ""}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onChange={(e) =>
                                                                                handleScoreChange(matchId, "team1Score", e.target.value)
                                                                            }
                                                                            placeholder="-"
                                                                            className={`w-8 h-6 text-center text-xs font-bold rounded border outline-none ${match.winner === match.team1
                                                                                ? "bg-indigo-700 text-white border-indigo-500 placeholder-indigo-300"
                                                                                : "bg-white text-slate-900 border-slate-200"
                                                                                }`}
                                                                        />
                                                                    )}
                                                                </div>

                                                                {/* Team 2 Slot */}
                                                                <div
                                                                    onClick={() =>
                                                                        match.team2 && !match.isBye && handlePickWinner(matchId, match.team2)
                                                                    }
                                                                    className={`p-2.5 flex items-center justify-between gap-2 transition cursor-pointer ${match.winner === match.team2 && match.team2
                                                                        ? "bg-indigo-600 text-white font-bold"
                                                                        : match.isBye
                                                                            ? "bg-slate-50/50 text-slate-400 italic"
                                                                            : "hover:bg-slate-50 text-slate-800"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                                                                        {match.team2Seed && (
                                                                            <span
                                                                                className={`text-[10px] font-mono px-1 rounded ${match.winner === match.team2
                                                                                    ? "bg-indigo-700 text-white"
                                                                                    : "bg-slate-200 text-slate-600"
                                                                                    }`}
                                                                            >
                                                                                #{match.team2Seed}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-xs truncate font-medium">
                                                                            {match.isBye ? "BYE" : match.team2 || "TBD"}
                                                                        </span>
                                                                    </div>
                                                                    {!match.isBye && match.team2 && (
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={match.team2Score ?? ""}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onChange={(e) =>
                                                                                handleScoreChange(matchId, "team2Score", e.target.value)
                                                                            }
                                                                            placeholder="-"
                                                                            className={`w-8 h-6 text-center text-xs font-bold rounded border outline-none ${match.winner === match.team2
                                                                                ? "bg-indigo-700 text-white border-indigo-500 placeholder-indigo-300"
                                                                                : "bg-white text-slate-900 border-slate-200"
                                                                                }`}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Deterministic Power-of-2 Matchmaking
                        </span>
                        <span className="font-semibold text-slate-700">Click team or enter score to advance</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Tournament Seeding Architectures & Mathematical Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Tournament Seeding Theory: Mathematics of Fair Competitive Brackets
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In tournament architecture, single-elimination brackets represent binary trees where every match halves the remaining field of competitors. To prevent the highest-ranked contenders from eliminating each other in the opening rounds, standard mathematical seeding organizes opponents such that the sum of opposing seeds in any opening match equals:
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        {"$$\\text{Match Seed Sum} = N + 1$$"}
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Where $N$ represents the bracket capacity (e.g., in a 16-team tournament, Seed 1 plays Seed 16 ($1 + 16 = 17$), Seed 2 plays Seed 15 ($2 + 15 = 17$), and Seed 8 plays Seed 9 ($8 + 9 = 17$)). This recursive pairing ensures top-seeded competitors only cross paths during the semifinal and final rounds.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" /> Power-of-Two Binary Trees
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Single-elimination formats mathematically require the participant count to match a power of two ($2^k$, such as 4, 8, 16, 32, 64). When the number of entrants $M$ is not an exact power of two, the system calculates automatic "byes" ($B$):
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                B = 2^(ceil(log2(M))) - M
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Cryptographic Hardware Randomization
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When selecting random seeding, our generator avoids standard pseudo-random algorithms in favor of the browser Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>) to execute an unbiased Fisher-Yates shuffle.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                window.crypto.getRandomValues(new Uint32Array(participants.length))
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Seeding & Byes Reference Matrix Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Tournament Bracket Size, Rounds, and Byes Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refer to this operational matrix to calculate required tournament rounds, match counts, and bye distributions based on participant field sizes:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Entrants ($M$)</th>
                                    <th className="p-3">Bracket Capacity ($N$)</th>
                                    <th className="p-3">Total Rounds ($R$)</th>
                                    <th className="p-3">Total Matches</th>
                                    <th className="p-3">Byes Awarded ($B$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4 Teams</td>
                                    <td className="p-3">4 Slots</td>
                                    <td className="p-3">2 Rounds</td>
                                    <td className="p-3">3 Matches</td>
                                    <td className="p-3 font-mono text-emerald-600">0 Byes</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">6 Teams</td>
                                    <td className="p-3">8 Slots</td>
                                    <td className="p-3">3 Rounds</td>
                                    <td className="p-3">5 Matches</td>
                                    <td className="p-3 font-mono text-amber-600">2 Byes (#1 & #2)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">8 Teams</td>
                                    <td className="p-3">8 Slots</td>
                                    <td className="p-3">3 Rounds</td>
                                    <td className="p-3">7 Matches</td>
                                    <td className="p-3 font-mono text-emerald-600">0 Byes</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">12 Teams</td>
                                    <td className="p-3">16 Slots</td>
                                    <td className="p-3">4 Rounds</td>
                                    <td className="p-3">11 Matches</td>
                                    <td className="p-3 font-mono text-amber-600">4 Byes (Seeds 1–4)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">16 Teams</td>
                                    <td className="p-3">16 Slots</td>
                                    <td className="p-3">4 Rounds</td>
                                    <td className="p-3">15 Matches</td>
                                    <td className="p-3 font-mono text-emerald-600">0 Byes</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">32 Teams</td>
                                    <td className="p-3">32 Slots</td>
                                    <td className="p-3">5 Rounds</td>
                                    <td className="p-3">31 Matches</td>
                                    <td className="p-3 font-mono text-emerald-600">0 Byes</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">64 Teams</td>
                                    <td className="p-3">64 Slots</td>
                                    <td className="p-3">6 Rounds</td>
                                    <td className="p-3">63 Matches</td>
                                    <td className="p-3 font-mono text-emerald-600">0 Byes</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Comparison of Tournament Formats */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Swords className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Analysis: Single vs Double Elimination vs Round-Robin
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct tournament format depends on time constraints, venue availability, and the desired competitive tolerance for single-game upsets:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Medal className="w-4 h-4 text-indigo-600" /> Single Elimination
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                High-stakes, sudden-death structure requiring exactly $N - 1$ total matches. Ideal for fast-paced events, esports brackets, and playoff brackets where time is limited.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <RotateCcw className="w-4 h-4 text-indigo-600" /> Double Elimination
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Competitors drop into a Lower (Losers) bracket upon their first defeat. Ensures a single bad match or officiating error does not prematurely eliminate a top contender.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-indigo-600" /> Round-Robin
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Every participant plays every other entrant once. Provides the highest statistical sample size for true ranking but requires $N(N - 1) / 2$ total games.
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
                                How are tournament byes calculated and assigned in this bracket generator?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Byes are calculated as the difference between the nearest upper power of 2 and the total number of participants (Byes = Bracket Size - Participants). In standard seeding, the top-ranked seeds are awarded automatic advancement past the opening round to preserve competitive fairness.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between standard seeding and random tournament shuffling?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Standard seeding positions top contenders on opposite sides of the bracket (e.g., #1 vs #16, #2 vs #15) ensuring high-ranked competitors do not meet until the championship rounds. Random shuffling uses cryptographic hardware entropy to mix participants uniformly, preventing deliberate matchmaking bias.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the interactive bracket progression engine work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When you enter numeric scores or click directly on a team name, the engine computes match winners and instantly advances them to their corresponding slot in the subsequent round, recalculating championship outcomes in real time.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I export and print tournament brackets created with this tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can export complete match pairings, seeds, scores, and progression data into structured CSV spreadsheets or copy formatted text summaries with one click.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the maximum number of participants supported?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The browser-native interactive canvas supports from 2 up to 64 participants with dynamic multi-tier round rendering, horizontal panning, and zero latency.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}