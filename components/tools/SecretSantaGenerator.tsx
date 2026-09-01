"use client";

import React, { useState } from "react";
import {
    Gift,
    Users,
    UserPlus,
    Trash2,
    Shuffle,
    Eye,
    EyeOff,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    AlertCircle,
    ShieldCheck,
    SlidersHorizontal,
    Share2,
    Download,
    DollarSign,
    Calendar,
    Mail,
    FileText,
    CheckCircle2,
    RefreshCw,
    XCircle,
    Lock,
    Clock,
    Award,
    Layers,
    HeartHandshake,
    Lightbulb
} from "lucide-react";

interface Participant {
    id: string;
    name: string;
    email: string;
    wishlist: string;
    exclusions: string[]; // List of participant IDs they cannot be matched with
}

interface MatchResult {
    giver: Participant;
    receiver: Participant;
    revealed: boolean;
}

const DEFAULT_PARTICIPANTS: Participant[] = [
    { id: "p-1", name: "Alex Johnson", email: "alex@example.com", wishlist: "Coffee beans, wool socks", exclusions: [] },
    { id: "p-2", name: "Sarah Miller", email: "sarah@example.com", wishlist: "Scented candles, gourmet tea", exclusions: [] },
    { id: "p-3", name: "David Chen", email: "david@example.com", wishlist: "Desk plant, tech cable organizer", exclusions: [] },
    { id: "p-4", name: "Elena Rostova", email: "elena@example.com", wishlist: "Sketchbook, fine tip pens", exclusions: [] },
];

export default function SecretSantaGenerator() {
    // Event Configuration State
    const [eventName, setEventName] = useState<string>("Holiday Gift Exchange 2026");
    const [budgetAmount, setBudgetAmount] = useState<number>(30);
    const [currencySymbol, setCurrencySymbol] = useState<string>("$");
    const [exchangeDate, setExchangeDate] = useState<string>("2026-12-24");
    const [additionalRules, setAdditionalRules] = useState<string>("Keep gifts fun, unwrapped or wrapped with festive tags!");

    // Participants State
    const [participants, setParticipants] = useState<Participant[]>(DEFAULT_PARTICIPANTS);
    const [newName, setNewName] = useState<string>("");
    const [newEmail, setNewEmail] = useState<string>("");
    const [newWishlist, setNewWishlist] = useState<string>("");

    // Matching Engine State
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [hasGenerated, setHasGenerated] = useState<boolean>(false);

    // View / Reveal & Share States
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState<boolean>(false);
    const [selectedParticipantModal, setSelectedParticipantModal] = useState<Participant | null>(null);

    // Quick sanitizing number handler
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

    // Add new participant
    const handleAddParticipant = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmedName = newName.trim();
        if (!trimmedName) return;

        const newEntry: Participant = {
            id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: trimmedName,
            email: newEmail.trim(),
            wishlist: newWishlist.trim(),
            exclusions: [],
        };

        setParticipants((prev) => [...prev, newEntry]);
        setNewName("");
        setNewEmail("");
        setNewWishlist("");
        // Reset generated matches if roster changes
        setHasGenerated(false);
        setMatches([]);
        setMatchError(null);
    };

    // Remove participant
    const handleRemoveParticipant = (id: string) => {
        setParticipants((prev) => {
            const updated = prev.filter((p) => p.id !== id);
            // Also clean up any exclusions referencing this deleted ID
            return updated.map((p) => ({
                ...p,
                exclusions: p.exclusions.filter((exId) => exId !== id),
            }));
        });
        setHasGenerated(false);
        setMatches([]);
        setMatchError(null);
    };

    // Toggle exclusion constraint
    const handleToggleExclusion = (participantId: string, excludedId: string) => {
        setParticipants((prev) =>
            prev.map((p) => {
                if (p.id !== participantId) return p;
                const exists = p.exclusions.includes(excludedId);
                const updatedExclusions = exists
                    ? p.exclusions.filter((id) => id !== excludedId)
                    : [...p.exclusions, excludedId];
                return { ...p, exclusions: updatedExclusions };
            })
        );
        setHasGenerated(false);
        setMatches([]);
        setMatchError(null);
    };

    // Backtracking / Derangement Matching Algorithm
    const runMatchingEngine = () => {
        if (participants.length < 3) {
            setMatchError("At least 3 participants are required to organize a Secret Santa exchange.");
            return;
        }

        setIsGenerating(true);
        setMatchError(null);

        setTimeout(() => {
            const n = participants.length;
            const givers = [...participants];
            let successfulReceivers: Participant[] | null = null;

            // Maximum randomized attempts with backtracking
            const MAX_ATTEMPTS = 500;

            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                const availableReceivers = [...participants];
                const candidatePairs: Participant[] = [];
                let failed = false;

                // Shuffle givers order for unbiased permutation selection
                const shuffledGivers = [...givers].sort(() => Math.random() - 0.5);

                for (let i = 0; i < n; i++) {
                    const giver = shuffledGivers[i];
                    // Candidate receivers: Not themselves, and not in their explicit exclusion list
                    const validReceivers = availableReceivers.filter(
                        (rec) => rec.id !== giver.id && !giver.exclusions.includes(rec.id)
                    );

                    if (validReceivers.length === 0) {
                        failed = true;
                        break;
                    }

                    // Pick a random valid receiver
                    const chosenIndex = Math.floor(Math.random() * validReceivers.length);
                    const chosen = validReceivers[chosenIndex];

                    candidatePairs.push(chosen);
                    // Remove chosen from remaining available pool
                    const poolIndex = availableReceivers.findIndex((r) => r.id === chosen.id);
                    availableReceivers.splice(poolIndex, 1);
                }

                if (!failed && candidatePairs.length === n) {
                    // Match successful: Reconstruct in original participant order
                    const pairMap = new Map<string, Participant>();
                    for (let i = 0; i < n; i++) {
                        pairMap.set(shuffledGivers[i].id, candidatePairs[i]);
                    }

                    successfulReceivers = givers.map((g) => pairMap.get(g.id)!);
                    break;
                }
            }

            if (successfulReceivers) {
                const finalMatches: MatchResult[] = givers.map((giver, idx) => ({
                    giver,
                    receiver: successfulReceivers![idx],
                    revealed: false,
                }));
                setMatches(finalMatches);
                setHasGenerated(true);
                setMatchError(null);
            } else {
                setMatchError(
                    "Impossible exclusion rules detected! The constraints prevent a valid Secret Santa chain. Please remove one or more exclusion restrictions."
                );
                setHasGenerated(false);
            }

            setIsGenerating(false);
        }, 200);
    };

    // Toggle individual match reveal
    const toggleReveal = (index: number) => {
        setMatches((prev) =>
            prev.map((m, idx) => (idx === index ? { ...m, revealed: !m.revealed } : m))
        );
    };

    // Copy individual private invitation string
    const handleCopyIndividualInvite = (match: MatchResult, index: number) => {
        const text = `🎄 SECRET SANTA PAIRING: ${eventName} 🎄
--------------------------------------------------
Hi ${match.giver.name}!

You are the Secret Santa for: 🎁 *** ${match.receiver.name} *** 🎁

Event Details:
• Suggested Budget: ${currencySymbol}${budgetAmount}
• Exchange Date: ${exchangeDate || "To be announced"}
${match.receiver.wishlist ? `• ${match.receiver.name}'s Wishlist / Hints: ${match.receiver.wishlist}` : "• Wishlist: No specific items listed. Surprise them!"}
${additionalRules ? `• Notes: ${additionalRules}` : ""}

Keep it a total secret until exchange day! 🤫
Generated via twistertools.com/tools/random-tools/secret-santa-generator`;

        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Copy entire manifest (for the organizer)
    const handleCopyAllSummary = () => {
        const lines = matches.map(
            (m, i) => `${i + 1}. ${m.giver.name} ➔ ${m.receiver.name} ${m.receiver.wishlist ? `(Wishlist: ${m.receiver.wishlist})` : ""}`
        );

        const fullManifest = `🎅 MASTER SECRET SANTA ROSTER: ${eventName} 🎅
Budget: ${currencySymbol}${budgetAmount} | Date: ${exchangeDate}
--------------------------------------------------
${lines.join("\n")}
--------------------------------------------------
Generated via twistertools.com/tools/random-tools/secret-santa-generator`;

        navigator.clipboard.writeText(fullManifest);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    // Download CSV manifest
    const handleDownloadCSV = () => {
        const header = ["Giver Name", "Giver Email", "Receiver Name", "Receiver Wishlist", "Budget", "Date"];
        const rows = matches.map((m) => [
            `"${m.giver.name.replace(/"/g, '""')}"`,
            `"${m.giver.email.replace(/"/g, '""')}"`,
            `"${m.receiver.name.replace(/"/g, '""')}"`,
            `"${(m.receiver.wishlist || "").replace(/"/g, '""')}"`,
            `"${currencySymbol}${budgetAmount}"`,
            `"${exchangeDate}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [header.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `secret-santa-${eventName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetAll = () => {
        setParticipants(DEFAULT_PARTICIPANTS);
        setMatches([]);
        setHasGenerated(false);
        setMatchError(null);
        setEventName("Holiday Gift Exchange 2026");
        setBudgetAmount(30);
    };

    // Schema Markups
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Secret Santa & Holiday Gift Exchange Matcher",
        "url": "https://twistertools.com/tools/random-tools/secret-santa-generator",
        "description": "Generate unbiased, collision-free Secret Santa pairings with custom exclusion constraints, budget caps, wishlists, and private reveal cards.",
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
                "name": "How does the Secret Santa matching algorithm prevent someone from picking themselves?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The matcher generates a valid mathematical derangement (a permutation where zero elements appear in their original position). It continuously tests randomized circular pairings while enforcing strict exclusions so that no participant is ever assigned to themselves or restricted pairs."
                }
            },
            {
                "@type": "Question",
                "name": "Can I prevent spouses, partners, or roommates from drawing each other?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Each participant card has an 'Exclusions' panel where you can check off specific individuals they cannot be assigned to. The backtracking engine automatically factors in these constraints when building the exchange chain."
                }
            },
            {
                "@type": "Question",
                "name": "Is my party's participant data, emails, or wishlists stored on your servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools operates with 100% client-side execution. All participant names, email addresses, wishlists, and pairing computations remain entirely inside your web browser's local memory and are never transmitted to external databases."
                }
            },
            {
                "@type": "Question",
                "name": "How do I distribute the assignments secretly without spoiling the surprises?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Each paired result includes an individual 'Copy Invite' button. The organizer can copy and privately send each customized invitation block directly via Slack, WhatsApp, SMS, or Email without revealing other pairs."
                }
            },
            {
                "@type": "Question",
                "name": "What is the minimum number of participants required for Secret Santa?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A minimum of 3 participants is required. With 2 people, a secret exchange is trivial and mutually obvious. Larger groups of 4 to 100+ work seamlessly with custom exclusion matrices."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Secret Santa, White Elephant, and Yankee Swap?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Secret Santa assigns specific 1-to-1 personalized gift recipients ahead of time. White Elephant centers on humorous, eccentric, or gag gifts opened sequentially with stealing rules. Yankee Swap involves practical or desirable gifts with turn-based unboxing and competitive swapping."
                }
            },
            {
                "@type": "Question",
                "name": "What should the organizer do if the matching engine reports impossible exclusions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An impossible exclusion happens when constraints create an isolated node or loop trap (e.g., Person A excludes everyone except Person B, while Person B excludes Person A). Simply click 'Exclusions' on the affected participants, uncheck one or two restrictions to open up alternate paths, and click draw again."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Roster, Rules & Exclusions */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                Exchange Details & Roster
                            </h2>
                            <button
                                onClick={handleResetAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset Roster
                            </button>
                        </div>

                        {/* Event Metadata Config */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-3 space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Event / Group Name
                                </label>
                                <input
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="e.g. Engineering Team Gift Swap"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Spending Budget
                                </label>
                                <div className="flex items-center gap-1">
                                    <select
                                        value={currencySymbol}
                                        onChange={(e) => setCurrencySymbol(e.target.value)}
                                        className="px-2 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    >
                                        <option value="$">$ USD</option>
                                        <option value="€">€ EUR</option>
                                        <option value="£">£ GBP</option>
                                        <option value="¥">¥ JPY</option>
                                        <option value="C$">C$ CAD</option>
                                        <option value="A$">A$ AUD</option>
                                    </select>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10000}
                                        value={budgetAmount === 0 ? "" : budgetAmount}
                                        onChange={(e) => handleNumberInput(e, setBudgetAmount)}
                                        className="w-full px-3 py-2 text-right font-bold text-slate-900 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2 space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Exchange Date
                                </label>
                                <input
                                    type="date"
                                    value={exchangeDate}
                                    onChange={(e) => setExchangeDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Add Participant Form */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <UserPlus className="w-4 h-4 text-indigo-600" />
                                Add Participant
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Name (Required)"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <input
                                    type="email"
                                    placeholder="Email (Optional)"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <div className="sm:col-span-2 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Wishlist hints or preferences (Optional)"
                                        value={newWishlist}
                                        onChange={(e) => setNewWishlist(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddParticipant()}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition flex items-center gap-1 cursor-pointer flex-shrink-0"
                                    >
                                        <UserPlus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Participant List & Exclusion Rules */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Active Participants ({participants.length})
                                </span>
                                <span className="text-[11px] text-slate-400">Click &apos;Exclusions&apos; to prevent pairings</span>
                            </div>

                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                {participants.map((p) => {
                                    const otherParticipants = participants.filter((o) => o.id !== p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition space-y-2 shadow-2xs"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 text-sm truncate">{p.name}</span>
                                                        {p.email && (
                                                            <span className="text-[11px] text-slate-400 truncate max-w-[130px]">({p.email})</span>
                                                        )}
                                                    </div>
                                                    {p.wishlist && (
                                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                                            🎁 <span className="italic">{p.wishlist}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedParticipantModal(selectedParticipantModal?.id === p.id ? null : p)}
                                                        className={`px-2 py-1 text-[11px] font-bold rounded-md border transition cursor-pointer ${p.exclusions.length > 0
                                                            ? "bg-amber-50 text-amber-700 border-amber-300"
                                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                            }`}
                                                    >
                                                        {p.exclusions.length > 0 ? `🚫 Exclusions (${p.exclusions.length})` : "Exclusions"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveParticipant(p.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-md hover:bg-rose-50 cursor-pointer"
                                                        title="Remove participant"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Exclusion Checklist drawer */}
                                            {selectedParticipantModal?.id === p.id && (
                                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-slate-800">
                                                            Select people {p.name} CANNOT draw:
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedParticipantModal(null)}
                                                            className="text-slate-400 hover:text-slate-600 text-[11px] underline cursor-pointer"
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                    {otherParticipants.length === 0 ? (
                                                        <p className="text-slate-400 italic">No other participants to exclude yet.</p>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-1.5">
                                                            {otherParticipants.map((other) => {
                                                                const isExcluded = p.exclusions.includes(other.id);
                                                                return (
                                                                    <label
                                                                        key={other.id}
                                                                        className={`flex items-center gap-2 p-1.5 rounded border transition cursor-pointer ${isExcluded ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-white border-slate-200 text-slate-700"
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isExcluded}
                                                                            onChange={() => handleToggleExclusion(p.id, other.id)}
                                                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                                                        />
                                                                        <span className="truncate">{other.name}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Additional rules textarea */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Group Guidelines / Notes
                            </label>
                            <textarea
                                rows={2}
                                value={additionalRules}
                                onChange={(e) => setAdditionalRules(e.target.value)}
                                placeholder="Add party location, theme, or unwrapping instructions..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Client-Side Derangement Engine (100% Private)
                        </span>
                        <button
                            type="button"
                            onClick={runMatchingEngine}
                            disabled={isGenerating || participants.length < 3}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition shadow-sm cursor-pointer ${participants.length < 3
                                ? "bg-slate-300 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            <Shuffle className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                            {hasGenerated ? "Re-Shuffle Secret Santa" : "Draw Names & Match"}
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Secret Santa Reveal Deck */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Gift className="w-5 h-5 text-indigo-600" />
                                Secret Santa Results & Reveal Cards
                            </h2>
                            {hasGenerated && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Matched ({matches.length})
                                </span>
                            )}
                        </div>

                        {/* Error Notification */}
                        {matchError && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Matching Conflict Error</p>
                                    <p>{matchError}</p>
                                </div>
                            </div>
                        )}

                        {/* Empty / Unmatched State */}
                        {!hasGenerated && !matchError && (
                            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                                    <Gift className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-sm">Ready to Pick Names</h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                        Configure your roster, set exclusions if needed, and click <strong>&quot;Draw Names &amp; Match&quot;</strong> to generate randomized Secret Santa assignments.
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-semibold">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                    Budget: {currencySymbol}{budgetAmount} • {participants.length} Participants
                                </div>
                            </div>
                        )}

                        {/* Generated Matches Deck */}
                        {hasGenerated && (
                            <div className="space-y-3">
                                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                                    <span className="font-medium">
                                        🎅 Keep it secret! Share individual invites with each person.
                                    </span>
                                    <span className="font-bold">{currencySymbol}{budgetAmount} Max</span>
                                </div>

                                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                    {matches.map((match, idx) => (
                                        <div
                                            key={match.giver.id}
                                            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition space-y-3 shadow-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-bold text-slate-900 text-sm">{match.giver.name}</span>
                                                    <span className="text-xs text-slate-400">gives to ➔</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleReveal(idx)}
                                                    className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer"
                                                >
                                                    {match.revealed ? (
                                                        <>
                                                            <EyeOff className="w-3.5 h-3.5" /> Hide
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="w-3.5 h-3.5" /> Reveal
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Receiver Reveal Container */}
                                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                                        Assigned Recipient
                                                    </span>
                                                    {match.revealed ? (
                                                        <div className="space-y-0.5">
                                                            <p className="font-extrabold text-indigo-700 text-base">
                                                                🎁 {match.receiver.name}
                                                            </p>
                                                            {match.receiver.wishlist && (
                                                                <p className="text-xs text-slate-600">
                                                                    Wishlist: <span className="font-medium">{match.receiver.wishlist}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="font-mono text-xs text-slate-400 flex items-center gap-1.5 py-1">
                                                            <Lock className="w-3.5 h-3.5" /> •••••••••••••• (Click Reveal)
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyIndividualInvite(match, idx)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 text-xs font-bold transition shadow-2xs cursor-pointer flex-shrink-0"
                                                >
                                                    {copiedIndex === idx ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5" /> Copy Invite
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Bar */}
                    {hasGenerated && (
                        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleCopyAllSummary}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                            >
                                {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                {copiedAll ? "Organizer Manifest Copied!" : "Copy Full Organizer Manifest"}
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadCSV}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                            >
                                <Download className="w-4 h-4" />
                                Export Results as CSV
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: What is Secret Santa & Combinatorial Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is Secret Santa? Mechanics, Mathematics & Derangements
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Secret Santa is a worldwide gift exchange tradition where a group of members are anonymously assigned an individual recipient to whom they give a thoughtful gift. Popular in workplaces, schools, friend circles, and large families, this format eliminates the financial strain and logistical stress of buying individual presents for every single person in a large group.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Subfactorial Derangements
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                In combinatorics, a Secret Santa draw without exclusions produces a derangement — a permutation where no element is fixed in its original position. The number of valid derangements for n participants approximates n! divided by Euler&apos;s number e, growing rapidly with group size.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Backtracking Constraint Graphs
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Real-world groups have real-world constraints—partners shouldn&apos;t draw each other, and managers shouldn&apos;t draw direct reports. Our algorithm models the group as a directed graph and uses depth-first backtracking to resolve non-conflicting exchange cycles.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Zero-Knowledge Browser Storage
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Unlike centralized event tools that harvest attendee email addresses for marketing databases, TwisterTools executes 100% client-side inside your browser sandbox. Your personal data, wishlists, and relationships never leave your device.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Game Matrix: Secret Santa vs White Elephant vs Yankee Swap */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Holiday Gift Exchange Comparison Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the right holiday format depends on your group size, dynamic, and budget. Here is how Secret Santa compares with other popular seasonal exchange formats:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Exchange Format</th>
                                    <th className="p-3">Gift Style</th>
                                    <th className="p-3">Pairing Mechanism</th>
                                    <th className="p-3">Stealing Allowed?</th>
                                    <th className="p-3">Best Suited For</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-700">Secret Santa</td>
                                    <td className="p-3">Personalized & Wishlist-based</td>
                                    <td className="p-3">Pre-drawn 1-to-1 secret assignments</td>
                                    <td className="p-3 text-slate-500 font-semibold">No (Direct gifting)</td>
                                    <td className="p-3 text-xs text-slate-600">Close friends, office teams, and families.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">White Elephant</td>
                                    <td className="p-3">Humorous, quirky, or gag items</td>
                                    <td className="p-3">Random number draw on party day</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Yes (Up to 3 steals/turn)</td>
                                    <td className="p-3 text-xs text-slate-600">Casual social gatherings, party nights, and icebreakers.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Yankee Swap</td>
                                    <td className="p-3">Practical, high-value, or coveted items</td>
                                    <td className="p-3">Numbered order draw with strategic trades</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Yes (Aggressive trading)</td>
                                    <td className="p-3 text-xs text-slate-600">Competitive friend groups and corporate holiday parties.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Kris Kringle</td>
                                    <td className="p-3">Small tokens, treats, or anonymous notes</td>
                                    <td className="p-3">Daily or weekly mystery drops</td>
                                    <td className="p-3 text-slate-500 font-semibold">No</td>
                                    <td className="p-3 text-xs text-slate-600">Classrooms, school staff rooms, and multi-day workshops.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Organizing Masterplan & Step-by-Step Timeline */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The 4-Week Secret Santa Organizer Timeline
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Avoid last-minute panic and shipping delays with this battle-tested 4-week timeline designed for both in-person gatherings and distributed remote workplaces:
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                <span>Week 1</span>
                                <Clock className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">Roster & Rules</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Collect names, email addresses, and general wishlist preferences. Establish a strict, non-negotiable budget cap ($20, $30, or $50).
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                <span>Week 2</span>
                                <Shuffle className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">Draw & Exclusions</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Set up exclusion rules for partners/families. Run the TwisterTools matcher and privately distribute individual reveal links via direct message or email.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                <span>Week 3</span>
                                <Gift className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">Shopping & Shipping</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Participants purchase gifts. For remote teams, ship gifts directly to recipients with &quot;DO NOT OPEN UNTIL EXCHANGE PARTY&quot; notes on the packaging.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                <span>Week 4</span>
                                <Award className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm">The Big Reveal</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Host the unboxing party (in person or over Zoom/Teams). Each person opens their gift and guesses the identity of their Secret Santa before they reveal themselves!
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Budget-Tiered Gift Ideas & Wishlist Inspiration */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Curated Gift Ideas by Budget Category
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Need inspiration for your wishlist or struggling to find something within the budget? Here are crowd-pleasing gift categories segmented by common price brackets:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Under $15 (Token Tier)</span>
                                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">$10–$15</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>• <strong>Artisanal Treats:</strong> Single-origin chocolate bars, gourmet tea samplers, or specialty hot sauce.</li>
                                <li>• <strong>Desk Essentials:</strong> Cable management clips, ceramic coffee mugs, or magnetic phone stands.</li>
                                <li>• <strong>Relaxation:</strong> Soy wax scented candles, essential oil shower steamers, or luxury hand balms.</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Under $30 (Standard Tier)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">$20–$30</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>• <strong>Beverage Gear:</strong> Insulated stainless steel tumblers (e.g. Yeti/Hydro Flask) or pour-over drippers.</li>
                                <li>• <strong>Lifestyle & Games:</strong> Compact card games (Exploding Kittens, Taco Cat Goat Cheese Pizza), or hardcover journals.</li>
                                <li>• <strong>Home & Comfort:</strong> Plush fleece throw blankets, low-maintenance succulent plants, or French press coffee makers.</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Under $50+ (Premium Tier)</span>
                                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">$40–$50+</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>• <strong>Smart Tech:</strong> Wireless fast-charging stations, portable Bluetooth speakers, or smart smart-plugs.</li>
                                <li>• <strong>Culinary Upgrades:</strong> Cast iron skillets, chef-grade olive oil sets, or electric milk frothers.</li>
                                <li>• <strong>Premium Apparel:</strong> Merino wool beanies, cashmere-blend scarves, or packing cube travel sets.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Rules & Etiquette Best Practices */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HeartHandshake className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Rules & Etiquette for Workplace and Family Swaps
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To maintain a joyful, inclusive, and stress-free holiday exchange across remote teams, corporate departments, or extended family gatherings, adhere to these golden rules of Secret Santa etiquette:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Guideline</th>
                                    <th className="p-3">Standard Practice</th>
                                    <th className="p-3">Why It Matters</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Firm Budget Cap</td>
                                    <td className="p-3 font-mono text-indigo-600">$20 – $50 USD</td>
                                    <td className="p-3 text-xs text-slate-600">Prevents awkward socioeconomic disparities where one person overspends and another feels guilty.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Wishlist Inclusions</td>
                                    <td className="p-3">2–3 general hints</td>
                                    <td className="p-3 text-xs text-slate-600">Guides the giver toward items the recipient actually enjoys while preserving room for creativity.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Strict Secrecy</td>
                                    <td className="p-3">Zero disclosure before event</td>
                                    <td className="p-3 text-xs text-slate-600">The suspense of guessing who drew your name during the unwrapping ceremony is the core magic.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Exclusion Matrix</td>
                                    <td className="p-3">Exclude cohabiting partners</td>
                                    <td className="p-3 text-xs text-slate-600">Ensures participants do not simply exchange gifts with household members they already shop for.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Professional Boundaries</td>
                                    <td className="p-3">Avoid inappropriate/intimate gifts</td>
                                    <td className="p-3 text-xs text-slate-600">Keeps corporate exchanges respectful and HR-compliant across all departments.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 6: Frequently Asked Questions (FAQ) */}
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
                                How does the Secret Santa matching algorithm prevent someone from picking themselves?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The matcher generates a valid mathematical derangement (a permutation where zero elements appear in their original position). It continuously tests randomized circular pairings while enforcing strict exclusions so that no participant is ever assigned to themselves or restricted pairs.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I prevent spouses, partners, or roommates from drawing each other?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Each participant card has an &quot;Exclusions&quot; button where you can check off specific individuals they cannot be assigned to. The backtracking engine automatically factors in these constraints when building the exchange chain.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my party&apos;s participant data, emails, or wishlists stored on your servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. TwisterTools operates with 100% client-side execution. All participant names, email addresses, wishlists, and pairing computations remain entirely inside your web browser&apos;s local memory and are never transmitted to external databases.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I distribute the assignments secretly without spoiling the surprises?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Each paired result includes an individual &quot;Copy Invite&quot; button. The organizer can copy and privately send each customized invitation block directly via Slack, WhatsApp, SMS, or Email without revealing other pairs.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the minimum number of participants required for Secret Santa?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A minimum of 3 participants is required. With 2 people, a secret exchange is trivial and mutually obvious. Larger groups of 4 to 100+ work seamlessly with custom exclusion matrices.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Secret Santa, White Elephant, and Yankee Swap?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Secret Santa assigns specific 1-to-1 personalized gift recipients ahead of time. White Elephant centers on humorous, eccentric, or gag gifts opened sequentially with stealing rules. Yankee Swap involves practical or desirable gifts with turn-based unboxing and competitive swapping.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What should the organizer do if the matching engine reports impossible exclusions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An impossible exclusion happens when constraints create an isolated node or loop trap (e.g., Person A excludes everyone except Person B, while Person B excludes Person A). Simply click &quot;Exclusions&quot; on the affected participants, uncheck one or two restrictions to open up alternate paths, and click draw again.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}