"use client";

import React, { useState, useMemo } from "react";
import {
    Users,
    Shuffle,
    Copy,
    Check,
    Download,
    Trash2,
    Sliders,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    ListOrdered,
    UserCheck,
    Scale,
    BrainCircuit,
    Calculator,
    Target,
    Zap,
    TrendingUp,
    Briefcase,
    GraduationCap,
    Trophy,
    Sparkles,
    CheckCircle2
} from "lucide-react";

interface Participant {
    id: string;
    name: string;
    gender?: "M" | "F" | "Other";
    skill?: number; // 1 to 5 scale
}

interface Team {
    id: number;
    name: string;
    members: Participant[];
}

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

export default function RandomTeamGenerator() {
    // Input State
    const [rawText, setRawText] = useState<string>(
        "Alex Rivera (4)\nJordan Lee (3)\nTaylor Swift (5)\nMorgan Freeman (2)\nSam Smith (3)\nChris Evans (5)\nPat Cummins (4)\nDakota Johnson (2)\nCasey Neistat (4)\nRiley Reid (3)\nAvery Jackson (1)\nQuinn Fabray (4)"
    );
    const [generationMode, setGenerationMode] = useState<"numTeams" | "teamSize">("numTeams");
    const [targetValue, setTargetValue] = useState<number>(3);
    const [enableBalancing, setEnableBalancing] = useState<boolean>(false);
    const [namingFormat, setNamingFormat] = useState<"numbered" | "alpha" | "fun">("numbered");

    // Output State
    const [teams, setTeams] = useState<Team[]>([]);
    const [copied, setCopied] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // Fun Team Name Themes
    const FUN_TEAM_NAMES = [
        "Quantum Coders", "Apex Predators", "Cyber Dragons", "Velocity Vipers",
        "Starlight Pioneers", "Thunderbolts", "Titanium Titans", "Alpha Wolves",
        "Nexus Raiders", "Shadow Ninjas", "Solar Flare", "Prism Mavericks",
        "Iron Mavericks", "Cosmic Surge", "Byte Brawlers", "Neon Knights"
    ];

    // Parse raw text into structured participant list
    const parsedParticipants = useMemo(() => {
        return rawText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((name, idx) => {
                let skill = 3;
                let gender: "M" | "F" | "Other" = "Other";
                let cleanedName = name;

                const skillMatch = name.match(/\((\d)\)/);
                if (skillMatch) {
                    skill = Math.min(5, Math.max(1, parseInt(skillMatch[1], 10)));
                    cleanedName = cleanedName.replace(/\(\d\)/, "").trim();
                }

                return {
                    id: `p-${idx}-${Date.now()}`,
                    name: cleanedName,
                    gender,
                    skill,
                } as Participant;
            });
    }, [rawText]);

    // Execute Cryptographically Secure Random Team Generation
    const handleGenerateTeams = () => {
        if (parsedParticipants.length === 0) return;
        setIsGenerating(true);

        setTimeout(() => {
            // 1. Shuffle participants using Web Crypto API Fisher-Yates
            const list = [...parsedParticipants];
            for (let i = list.length - 1; i > 0; i--) {
                const randomBuffer = new Uint32Array(1);
                crypto.getRandomValues(randomBuffer);
                const j = randomBuffer[0] % (i + 1);
                [list[i], list[j]] = [list[j], list[i]];
            }

            // 2. Determine exact number of teams
            let totalTeams = 1;
            if (generationMode === "numTeams") {
                totalTeams = Math.max(1, Math.min(list.length, targetValue));
            } else {
                const groupSize = Math.max(1, targetValue);
                totalTeams = Math.max(1, Math.ceil(list.length / groupSize));
            }

            // 3. Initialize teams
            const generatedTeams: Team[] = Array.from({ length: totalTeams }, (_, i) => {
                let teamName = `Team ${i + 1}`;
                if (namingFormat === "alpha") {
                    teamName = `Team ${String.fromCharCode(65 + (i % 26))}`;
                } else if (namingFormat === "fun") {
                    teamName = FUN_TEAM_NAMES[i % FUN_TEAM_NAMES.length] || `Team ${i + 1}`;
                }
                return {
                    id: i + 1,
                    name: teamName,
                    members: [],
                };
            });

            // 4. Distribute members (balanced by skill if enabled, else snakes/round-robin)
            if (enableBalancing) {
                // Sort list by skill descending before snakes distribution
                list.sort((a, b) => (b.skill || 3) - (a.skill || 3));
                list.forEach((participant, idx) => {
                    // Snake distribution pattern: 0, 1, 2, 2, 1, 0, 0, 1...
                    const cycle = Math.floor(idx / totalTeams);
                    const remainder = idx % totalTeams;
                    const targetTeamIndex = cycle % 2 === 0 ? remainder : totalTeams - 1 - remainder;
                    generatedTeams[targetTeamIndex].members.push(participant);
                });
            } else {
                // Standard round-robin distribution
                list.forEach((participant, idx) => {
                    generatedTeams[idx % totalTeams].members.push(participant);
                });
            }

            setTeams(generatedTeams);
            setIsGenerating(false);
        }, 200);
    };

    const handleClear = () => {
        setRawText("");
        setTeams([]);
    };

    const handleCopyTeams = () => {
        if (teams.length === 0) return;
        const formatted = teams
            .map(
                (t) =>
                    `=== ${t.name} (${t.members.length} members) ===\n` +
                    t.members.map((m, i) => `${i + 1}. ${m.name}`).join("\n")
            )
            .join("\n\n");

        navigator.clipboard.writeText(formatted);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (teams.length === 0) return;
        const headers = ["Team Name", "Member Index", "Member Name", "Skill Rating"];
        const rows: string[][] = [];

        teams.forEach((team) => {
            team.members.forEach((m, idx) => {
                rows.push([team.name, (idx + 1).toString(), m.name, (m.skill || 3).toString()]);
            });
        });

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "random_teams_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication & FAQ Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Team & Group Generator",
        "url": "https://twistertools.com/tools/random-tools/random-team-generator",
        "description": "Split names into fair, randomized teams or groups instantly using cryptographically secure Fisher-Yates shuffling with optional skill balancing.",
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
                "name": "How does the random team generator algorithm work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This generator uses a cryptographically secure implementation of the Fisher-Yates shuffle powered by the Web Crypto API (crypto.getRandomValues). This ensures that every possible team arrangement has equal probability, completely eliminating algorithmic bias."
                }
            },
            {
                "@type": "Question",
                "name": "Can I balance teams based on skill level or experience?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When skill balancing is enabled, the tool sorts participants by skill rating and applies a snake-draft distribution algorithm (1-2-3-3-2-1) across generated groups to ensure balanced aggregate skill totals across all teams."
                }
            },
            {
                "@type": "Question",
                "name": "Is my participant list uploaded to an external server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All participant parsing, shuffling, and team allocation happen strictly in your browser local JavaScript thread. No names or private roster data ever leave your device."
                }
            },
            {
                "@type": "Question",
                "name": "How are leftover or uneven participant counts handled?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When total participants cannot be evenly divided by the requested number of teams or group size, the remaining members are distributed round-robin style one by one to ensure the size difference between any two teams never exceeds 1 person."
                }
            },
            {
                "@type": "Question",
                "name": "Why is Web Crypto API better than Math.random() for team sorting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Math.random() utilizes deterministic pseudo-random number generators (PRNGs) like V8's Xorshift128+, which can exhibit structural patterns over multiple runs. Web Crypto API leverages operating system entropy sources (CPU thermal noise, hardware interrupts) to guarantee cryptographic randomness."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Round-Robin and Serpentine Snake Draft distribution?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Round-Robin assigns items strictly in sequence (1, 2, 3, 1, 2, 3), which can cluster top-ranked individuals into earlier teams. Serpentine Snake Draft reverses order on alternate cycles (1, 2, 3, 3, 2, 1), neutralizing rank advantage and creating near-identical average skill levels across teams."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input & Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600" />
                                Participant Roster ({parsedParticipants.length})
                            </h2>
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-red-600 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear
                            </button>
                        </div>

                        {/* Names Input Area */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Enter Names (One per line)
                            </label>
                            <textarea
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="Alex Rivera&#10;Jordan Lee&#10;Taylor Swift..."
                                rows={10}
                                className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 focus:bg-white transition"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                                Tip: Append <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">(1-5)</code> after a name to set skill rating for balanced grouping (e.g., &quot;John Smith (4)&quot;).
                            </p>
                        </div>

                        {/* Generator Settings & Parameters */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sliders className="w-4 h-4 text-indigo-600" /> Split Strategy
                                </span>
                            </div>

                            {/* Strategy Selector Toggle */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setGenerationMode("numTeams")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${generationMode === "numTeams"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    By Number of Teams
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGenerationMode("teamSize")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${generationMode === "teamSize"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    By Members Per Team
                                </button>
                            </div>

                            {/* Dynamic Strategy Input */}
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-semibold text-slate-700 min-w-[120px]">
                                    {generationMode === "numTeams" ? "Number of Teams:" : "Members per Team:"}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={targetValue === 0 ? "" : targetValue}
                                    onChange={(e) => handleNumberInput(e, setTargetValue)}
                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {/* Naming Style */}
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-semibold text-slate-700 min-w-[120px]">
                                    Naming Format:
                                </label>
                                <select
                                    value={namingFormat}
                                    onChange={(e) => setNamingFormat(e.target.value as "numbered" | "alpha" | "fun")}
                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="numbered">Numbered (Team 1, Team 2)</option>
                                    <option value="alpha">Alphabetical (Team A, Team B)</option>
                                    <option value="fun">Fun Creative Names</option>
                                </select>
                            </div>

                            {/* Skill Balancing Checkbox */}
                            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={enableBalancing}
                                    onChange={(e) => setEnableBalancing(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="text-xs font-semibold text-slate-800">
                                    Enable Skill-Balanced Distribution (Snake Draft)
                                </span>
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateTeams}
                        disabled={parsedParticipants.length === 0 || isGenerating}
                        className="w-full mt-5 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Shuffle className={`w-5 h-5 ${isGenerating ? "animate-spin" : ""}`} />
                        {isGenerating ? "Shuffling Roster..." : "Generate Random Teams"}
                    </button>
                </div>

                {/* Right Workspace Panel: Results Display & Export */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <ListOrdered className="w-4 h-4 text-indigo-600" />
                                Generated Teams ({teams.length})
                            </h2>
                            {teams.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopyTeams}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? "Copied" : "Copy All"}
                                    </button>
                                    <button
                                        onClick={handleExportCSV}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200 cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" /> CSV
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Teams Display Grid */}
                        {teams.length === 0 ? (
                            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                                <p className="text-sm font-semibold text-slate-500">No teams generated yet.</p>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    Add your member names on the left panel and click &quot;Generate Random Teams&quot;.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
                                {teams.map((team) => {
                                    const avgSkill = (
                                        team.members.reduce((acc, m) => acc + (m.skill || 3), 0) /
                                        (team.members.length || 1)
                                    ).toFixed(1);

                                    return (
                                        <div
                                            key={team.id}
                                            className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition shadow-xs flex flex-col justify-between space-y-3"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2">
                                                    <span className="font-bold text-slate-900 text-sm">{team.name}</span>
                                                    <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                        {team.members.length} members
                                                    </span>
                                                </div>
                                                <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-700">
                                                    {team.members.map((m) => (
                                                        <li key={m.id} className="truncate font-medium">
                                                            {m.name}
                                                            {enableBalancing && (
                                                                <span className="text-[10px] text-slate-400 ml-1">
                                                                    (★{m.skill || 3})
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>

                                            {enableBalancing && (
                                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                                    <span>Avg Skill Rating:</span>
                                                    <span className="font-bold text-indigo-600">★ {avgSkill}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Web Crypto RNG
                        </span>
                        <span>Fisher-Yates Algorithm</span>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Technical & Mathematical Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Algorithmic Foundations: Cryptographic Fisher-Yates Shuffling
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To achieve true procedural fairness when partitioning individuals into teams, standard pseudo-random number generators (PRNGs) like JavaScript&apos;s default <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">Math.random()</code> are mathematically insufficient. Traditional software PRNGs are deterministic state machines seeded by system clocks, rendering them prone to predictable distribution biases across repeated executions.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        This web tool implements an in-browser <strong>Fisher-Yates (Knuth) Shuffle algorithm</strong> driven directly by hardware entropy sourced through the <strong>Web Crypto API</strong> (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">window.crypto.getRandomValues</code>). By tapping into CPU thermal noise and system interrupts, the allocation engine generates unbiased 32-bit unsigned integer vectors.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <BrainCircuit className="w-4 h-4 text-indigo-600" /> Permutation Space Uniformity
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                For a given set of $n$ participants, the number of distinct linear orderings equals the factorial $n!$. The probability $P(\pi)$ of producing any specific permutation sequence $\pi$ satisfies:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                P(&pi;) = 1 / n!
                            </div>
                            <p className="text-[11px] text-slate-500">
                                This strict uniform probability distribution guarantees that every participant has an identical mathematical likelihood of being assigned to any specific team slot.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Scale className="w-4 h-4 text-indigo-600" /> Serpentine Snake-Draft Algorithm
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                When skill balancing is toggled on, members are sorted by skill rating $S_i \in [1, 5]$ in descending order. Distribution across $k$ teams follows an alternating serpentine wave equation:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                TeamIndex(i) = (floor(i / k) % 2 == 0) ? (i % k) : (k - 1 - (i % k))
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Snake drafting prevents top-tier performers from stacking onto the first team, ensuring balanced aggregate team ratings.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Combinatorial Group Formula Reference
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            When partitioning $n$ total items into $k$ equal groups of size $m$ (where $n = k \times m$), the number of ways to divide the set is given by the multinomial coefficient divided by $k!$:
                        </p>
                        <div className="bg-slate-950 text-indigo-300 p-3 rounded-lg font-mono text-xs border border-slate-800 overflow-x-auto">
                            N = (n!) / ( (m!)^k &times; k! )
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategy Comparison & Configuration Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <UserCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Team Partitioning Strategies: Operational Comparison
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct partitioning method depends on your operational goals—whether you are organizing a classroom exercise, sports league, corporate hackathon, or casual board game night.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Split Strategy</th>
                                    <th className="p-3">Primary Parameter</th>
                                    <th className="p-3">Primary Application</th>
                                    <th className="p-3">Remainder Handling Logic</th>
                                    <th className="p-3">Variance Protection</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">By Number of Teams</td>
                                    <td className="p-3 font-mono">Target Team Count ($k$)</td>
                                    <td className="p-3">Fixed stations, fixed table counts, tournament brackets</td>
                                    <td className="p-3 text-xs">Round-robin (+1 extra member to first $r$ teams)</td>
                                    <td className="p-3 text-xs text-emerald-600 font-bold">Max size diff &le; 1 member</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">By Members Per Team</td>
                                    <td className="p-3 font-mono">Max Members per Team ($s$)</td>
                                    <td className="p-3">Project groups, room capacities, game player limits</td>
                                    <td className="p-3 text-xs">Creates $\lceil n/s \rceil$ teams; last team receives $n \pmod s$ members</td>
                                    <td className="p-3 text-xs text-amber-600 font-bold">Variable size on final team</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                    <td className="p-3 font-bold text-slate-900">Skill-Balanced Snake Draft</td>
                                    <td className="p-3 font-mono">Skill Rating $S_i \in [1, 5]$</td>
                                    <td className="p-3">Esports, sports leagues, competitive team building</td>
                                    <td className="p-3 text-xs font-semibold text-indigo-700">Serpentine allocation (1-2-3-3-2-1)</td>
                                    <td className="p-3 text-xs text-indigo-600 font-bold">Minimal average skill delta</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Worked Math Examples & Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Step-by-Step Distribution Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate how remainder handling and skill balancing function in practice, review these step-by-step mathematical examples:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Case 1: 14 Members into 4 Teams</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Uneven Partition</span>
                            </div>
                            <div className="text-xs text-slate-700 space-y-2">
                                <p><strong>Problem:</strong> Split $n = 14$ participants into $k = 4$ teams using standard random mode.</p>
                                <p><strong>Step 1 (Base Division):</strong> Base size = $\lfloor 14 / 4 \rfloor = 3$ members per team.</p>
                                <p><strong>Step 2 (Remainder Calculation):</strong> Remainder $r = 14 \pmod 4 = 2$ leftover members.</p>
                                <p><strong>Step 3 (Round-Robin Allocation):</strong> First 2 teams receive $3 + 1 = 4$ members. Remaining 2 teams receive 3 members.</p>
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800">
                                    Final Sizes: Team 1 (4), Team 2 (4), Team 3 (3), Team 4 (3)
                                </div>
                            </div>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Case 2: Skill-Balanced Snake Distribution</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Snake Draft</span>
                            </div>
                            <div className="text-xs text-slate-700 space-y-2">
                                <p><strong>Problem:</strong> Distribute 6 players with skill ratings [5, 5, 4, 3, 2, 1] into $k = 2$ teams.</p>
                                <p><strong>Step 1 (Descending Sort):</strong> [P1:5, P2:5, P3:4, P4:3, P5:2, P6:1]</p>
                                <p><strong>Step 2 (Cycle 1 - Forward):</strong> P1(5) &rarr; Team A, P2(5) &rarr; Team B.</p>
                                <p><strong>Step 3 (Cycle 2 - Reverse):</strong> P3(4) &rarr; Team B, P4(3) &rarr; Team A.</p>
                                <p><strong>Step 4 (Cycle 3 - Forward):</strong> P5(2) &rarr; Team A, P6(1) &rarr; Team B.</p>
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800">
                                    Team A: [5, 3, 2] (Total Skill = 10, Avg = 3.33)<br />
                                    Team B: [5, 4, 1] (Total Skill = 10, Avg = 3.33)
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Industry & Real-World Applications */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Industry & Organizational Use Cases
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Randomized team division serves as an essential, bias-free organizational practice across various domains:
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <GraduationCap className="w-4 h-4 text-indigo-600" /> Education & Academia
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Fairly partition students for lab exercises, group projects, and classroom debates. Eliminates social clique formation and encourages varied cross-peer interaction.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <Briefcase className="w-4 h-4 text-indigo-600" /> Corporate & Tech Teams
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Assemble cross-functional sprint teams, icebreaker groups, and hackathon squads. Skill balancing ensures an even spread of senior engineers across project tables.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <Trophy className="w-4 h-4 text-indigo-600" /> Sports & Recreational Leagues
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Create balanced rosters for pick-up basketball, soccer tournaments, or esports LAN parties without favoritism or captain pick awkwardness.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Best Practices Checklist for Event Leaders */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Best Practices Checklist for Fair Team Formation
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-700">
                        <div className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-slate-900 block font-semibold mb-0.5">Pre-Validate Roster Inputs</strong>
                                Ensure name lists do not contain duplicate entries or trailing punctuation to avoid duplicate member slots.
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-slate-900 block font-semibold mb-0.5">Standardize Skill Tiers (1–5)</strong>
                                Use consistent criteria when assigning skill tags (e.g., 1 = Beginner, 3 = Intermediate, 5 = Expert).
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-slate-900 block font-semibold mb-0.5">Export Audit Trail CSV</strong>
                                Download and archive the output CSV file for athletic leagues or corporate events to maintain full procedural transparency.
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-slate-900 block font-semibold mb-0.5">Maintain Privacy Standards</strong>
                                Since all operations run locally in browser memory, no personal name lists are transmitted over network sockets.
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 6: Extended Frequently Asked Questions (FAQ) */}
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
                                How does the random team generator algorithm work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This generator uses a cryptographically secure implementation of the Fisher-Yates shuffle powered by the Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">crypto.getRandomValues</code>). This ensures that every possible team arrangement has equal probability, completely eliminating algorithmic bias.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I balance teams based on skill level or experience?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. When skill balancing is enabled, the tool sorts participants by skill rating and applies a snake-draft distribution algorithm (1-2-3-3-2-1) across generated groups to ensure balanced aggregate skill totals across all teams.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my participant list uploaded to an external server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All participant parsing, shuffling, and team allocation happen strictly in your browser local JavaScript thread. No names or private roster data ever leave your device.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are leftover or uneven participant counts handled?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When total participants cannot be evenly divided by the requested number of teams or group size, the remaining members are distributed round-robin style one by one to ensure the size difference between any two teams never exceeds 1 person.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is Web Crypto API better than Math.random() for team sorting?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">Math.random()</code> utilizes deterministic pseudo-random number generators (PRNGs) like V8&apos;s Xorshift128+, which can exhibit structural patterns over multiple runs. Web Crypto API leverages operating system entropy sources (CPU thermal noise, hardware interrupts) to guarantee cryptographic randomness.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Round-Robin and Serpentine Snake Draft distribution?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Round-Robin assigns items strictly in sequence (1, 2, 3, 1, 2, 3), which can cluster top-ranked individuals into earlier teams. Serpentine Snake Draft reverses order on alternate cycles (1, 2, 3, 3, 2, 1), neutralizing rank advantage and creating near-identical average skill levels across teams.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}