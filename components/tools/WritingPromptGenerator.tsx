"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Sparkles,
    PenTool,
    RefreshCw,
    Copy,
    Check,
    Download,
    BookOpen,
    HelpCircle,
    SlidersHorizontal,
    Feather,
    Flame,
    Compass,
    Dice5,
    Lightbulb,
    Target,
    Layers,
    Bookmark,
    CheckCircle2,
    Lock,
    Unlock,
    Timer,
    Play,
    Pause,
    RotateCcw,
    Sparkle,
    FileText,
    Shuffle
} from "lucide-react";

type GenreType = "all" | "sci-fi" | "fantasy" | "thriller" | "romance" | "horror" | "literary" | "mystery";
type PromptMode = "full-hook" | "opening-line" | "plot-twist" | "character-dilemma";

interface SlotItem {
    id: string;
    text: string;
    genres: GenreType[];
}

const PREMISE_POOL: SlotItem[] = [
    { id: "pr-1", text: "Every citizen is assigned an expiration date at age eighteen, but you just inherited seventy unused years from an unknown 19th-century ledger.", genres: ["sci-fi", "thriller"] },
    { id: "pr-2", text: "Spells can only be forged from sounds vocalized during true death, and an aristocratic executioner discovers the royal heir whispered an impossible chord.", genres: ["fantasy"] },
    { id: "pr-3", text: "An orbital deep-space telescope receives a mirror reflection of Earth where oceans are chalk and continents glow with uncataloged bioluminescence.", genres: ["sci-fi"] },
    { id: "pr-4", text: "An overnight emergency dispatcher receives a call from an empty telephone booth reciting her private apartment floorplan.", genres: ["thriller", "mystery"] },
    { id: "pr-5", text: "An arborist purchases a foreclosed orchard, only to discover the root systems fruit exclusively when human teeth are buried beneath the mulch.", genres: ["horror"] },
    { id: "pr-6", text: "Two rival restoration architects find their correspondence left inside a centuries-old cathedral wall is crossing an exact twelve-hour time rift.", genres: ["romance", "literary"] },
    { id: "pr-7", text: "A luxury express train reaches its final terminus with every private cabin locked from within and table meals warm, but zero passengers on board.", genres: ["mystery", "thriller"] },
    { id: "pr-8", text: "A forensic accountant auditing a billionaire's estate unearths automated recurring wire transfers sent to their own childhood home address.", genres: ["thriller"] },
    { id: "pr-9", text: "The regional government orders the lake bed paved, paying the town's last boatwright to chisel memorials for bird species extinct for decades.", genres: ["literary"] },
    { id: "pr-10", text: "A condemned tenement caretaker notices that the nightly boiler knock at 3:00 AM is consistently answered from within the soles of his own work boots.", genres: ["horror"] },
    { id: "pr-11", text: "An antique mirror restorer discovers silvered glass that reflects not physical faces, but the exact guilt-ridden thoughts of whoever peers into it.", genres: ["fantasy", "horror"] },
    { id: "pr-12", text: "A cartographer mapping subterranean cave systems encounters a modern highway milestone marker buried four hundred meters under solid basalt.", genres: ["mystery", "sci-fi"] },
    { id: "pr-13", text: "A museum archivist is hired to forge love letters between rival Renaissance painters, only to discover the patron is her estranged ex-husband.", genres: ["romance"] },
    { id: "pr-14", text: "A memory-harvesting clinic accidentally downloads the combat reflexes of an international spy into the brain of a terminally shy kindergarten tutor.", genres: ["sci-fi", "thriller"] },
    { id: "pr-15", text: "A deep-sea drilling rig pulls up a sealed titanium container inscribed with the current crew captain's handwritten personal signature.", genres: ["sci-fi", "horror"] },
    { id: "pr-16", text: "A lighthouse keeper discovers the lamp beacon has not been guiding coastal ships, but systematically warding off something pacing the tide line.", genres: ["horror", "fantasy"] }
];

const PROTAGONIST_POOL: SlotItem[] = [
    { id: "pt-1", text: "An unlicensed biomechanical archivist who suffers from irreversible chronological stuttering.", genres: ["sci-fi"] },
    { id: "pt-2", text: "A disgraced paladin whose former holy order was dissolved thirty years ago for heresy.", genres: ["fantasy"] },
    { id: "pt-3", text: "An insomniac 911 audio dispatcher with absolute photographic memory of metropolitan emergency frequencies.", genres: ["thriller", "mystery"] },
    { id: "pt-4", text: "A reclusive botanist escaping a catastrophic clinical pharmacology trial.", genres: ["horror", "thriller"] },
    { id: "pt-5", text: "A stubborn architectural preservationist who communicates almost exclusively through handwritten courier letters.", genres: ["romance", "literary"] },
    { id: "pt-6", text: "An aging forensic accountant with zero digital footprint and a chronic inability to tell polite lies.", genres: ["thriller", "mystery"] },
    { id: "pt-7", text: "A retired railroad detective working on a mandatory final contractual case before pension forfeiture.", genres: ["mystery"] },
    { id: "pt-8", text: "A deaf acoustics-smith capable of perceiving low-frequency runic resonances through bone conduction.", genres: ["fantasy"] },
    { id: "pt-9", text: "A solitary zero-g maintenance engineer who has not touched planetary soil in nineteen years.", genres: ["sci-fi"] },
    { id: "pt-10", text: "An art restorer with a terminal tremor that miraculously stops only when wielding a forgery blade.", genres: ["romance", "thriller"] },
    { id: "pt-11", text: "A night-shift embalmer who meticulously interviews corpses to pass the graveyard hours.", genres: ["horror", "literary"] },
    { id: "pt-12", text: "A prodigal cartographer who lost his right hand navigating an unmapped dimensional trench.", genres: ["fantasy", "sci-fi"] }
];

const SETTING_POOL: SlotItem[] = [
    { id: "st-1", text: "A rain-drowned subterranean district below Sector 4, where clean oxygen is metered by the cubic meter.", genres: ["sci-fi"] },
    { id: "st-2", text: "The Sunken Reliquary of Aethelgard, where submerged stone crypts are flooded waist-deep in sanctified brine.", genres: ["fantasy"] },
    { id: "st-3", text: "A windowless metropolitan emergency dispatch bunker during a localized electrical brownout at 3:14 AM.", genres: ["thriller"] },
    { id: "st-4", text: "A fog-draped hollow in western West Virginia surrounded by impassable limestone cliffs.", genres: ["horror"] },
    { id: "st-5", text: "The scaffolding of an unheated 18th-century Parisian glasshouse during twilight winter restoration.", genres: ["romance", "literary"] },
    { id: "st-6", text: "A high-rise vault archive in Zurich, Switzerland while an unseasonal blizzard seals the city streets.", genres: ["thriller", "mystery"] },
    { id: "st-7", text: "A stranded luxury sleeper train idling along an isolated mountain pass in the Swiss Alps.", genres: ["mystery"] },
    { id: "st-8", text: "A sun-bleached desert basin littered with stranded dhows and evaporating salt flats.", genres: ["literary"] },
    { id: "st-9", text: "A remote deep-ocean oil platform stationed directly above an uncharted ocean trench.", genres: ["sci-fi", "horror"] },
    { id: "st-10", text: "A decrepit Victorian tenement scheduled for civic demolition within forty-eight hours.", genres: ["horror"] },
    { id: "st-11", text: "An isolated coastal lighthouse where high tide cuts off land access for fourteen days each month.", genres: ["mystery", "horror"] },
    { id: "st-12", text: "A floating airship foundry tethered above a canyon of perpetual lightning strikes.", genres: ["fantasy", "sci-fi"] }
];

const CONFLICT_POOL: SlotItem[] = [
    { id: "cf-1", text: "The Central Mortality Registry classifies your new balance as a temporal crime, dispatching extraction marshals.", genres: ["sci-fi"] },
    { id: "cf-2", text: "The high magistrate orders the spoken syllable excised from every legal parchment before sundown.", genres: ["fantasy"] },
    { id: "cf-3", text: "Protocol demands flagging the surveillance recording, but the voice matches a relative buried five years ago.", genres: ["thriller"] },
    { id: "cf-4", text: "The town council gives an ultimatum: deliver forty bushels of unblemished fruit by the equinox or face arson.", genres: ["horror"] },
    { id: "cf-5", text: "Renovating the landmark preserves structural integrity, but permanently destroys the cavity enabling cross-time communication.", genres: ["romance", "literary"] },
    { id: "cf-6", text: "Disclosing the offshore routing ledger confirms financial fraud, but guarantees federal imprisonment for an innocent mother.", genres: ["thriller"] },
    { id: "cf-7", text: "Thermal cameras prove no carriage doors ever opened, and the airbrake lines show zero drop in mechanical pressure.", genres: ["mystery"] },
    { id: "cf-8", text: "Pulling the sanctified blade frees the trapped garrison, but collapses the continental shelf beneath the kingdom.", genres: ["fantasy"] },
    { id: "cf-9", text: "The satellite transmission is accelerating, rapidly overriding the station's life-support atmospheric scrubber.", genres: ["sci-fi"] },
    { id: "cf-10", text: "Authenticating the art collection validates a landmark museum exhibition, but legally forfeits your personal copyright.", genres: ["romance"] },
    { id: "cf-11", text: "The quarantine beacon activates, locking both inside the vault with only ninety minutes of breathable oxygen.", genres: ["thriller", "sci-fi"] },
    { id: "cf-12", text: "The town water supply starts whispering names in reverse alphabetical order each midnight.", genres: ["horror"] }
];

const TWIST_POOL: SlotItem[] = [
    { id: "tw-1", text: "The unknown benefactor who deeded the timeline was your direct descendant traveling backward to prevent their own birth.", genres: ["sci-fi"] },
    { id: "tw-2", text: "The ancient sealed abomination beneath the altar is the very goddess the priesthood has worshipped for six centuries.", genres: ["fantasy"] },
    { id: "tw-3", text: "The mysterious emergency caller audio was synthesized using recordings you submitted during private counseling.", genres: ["thriller"] },
    { id: "tw-4", text: "The ancient orchard trees are not organic wood, but petrified human skeletons from an expunged colonial massacre.", genres: ["horror"] },
    { id: "tw-5", text: "Your cross-time correspondent is the original historic architect who drew the original building plans two hundred years ago.", genres: ["romance"] },
    { id: "tw-6", text: "The billionaire's trust funds were set up to purchase your silence regarding an event you haven't lived through yet.", genres: ["thriller"] },
    { id: "tw-7", text: "The train's manifest matches the victim roster of an avalanche derailment that occurred on this exact track in 1952.", genres: ["mystery"] },
    { id: "tw-8", text: "You did not survive the original boiler explosion; the rhythmic knocking is the emergency search team digging you out.", genres: ["horror"] },
    { id: "tw-9", text: "The telescope is not pointing across space; it is receiving Earth's atmospheric broadcast delayed by exactly 24 hours in the future.", genres: ["sci-fi"] },
    { id: "tw-10", text: "The forged letters you were hired to mimic are word-for-word love notes you wrote your former spouse years ago.", genres: ["romance"] },
    { id: "tw-11", text: "The investigating detective committed the crime twelve hours prior, but suffered traumatic amnesia from the gunshot recoil.", genres: ["mystery", "thriller"] },
    { id: "tw-12", text: "The whispered incantation does not summon protection; it acts as the counter-vibration that shatters the protective ward.", genres: ["fantasy"] }
];

const OPENERS_POOL: SlotItem[] = [
    { id: "op-1", text: "The ledger did not bleed, but when the terminal credited seventy years to my retina, my wrist chronometer hummed with centuries-old copper.", genres: ["sci-fi"] },
    { id: "op-2", text: "Most executions yield coarse, dissonant groans, but the condemned prince hummed a pure major sixth that silenced the courtyard.", genres: ["fantasy"] },
    { id: "op-3", text: "We aligned the satellite array three times before acknowledging the lens was pointed directly at our own atmosphere—and it wasn't breathing.", genres: ["sci-fi"] },
    { id: "op-4", text: "The emergency console illuminated amber at 03:14, but the audio feed opened with the whistling of my own kitchen kettle.", genres: ["thriller"] },
    { id: "op-5", text: "The bark did not peel like cedar; it bruised beneath the blade, weeping thick amber sap smelling distinctly of arterial blood.", genres: ["horror"] },
    { id: "op-6", text: "Her reply was wedged into the stone mortar: the ink was fresh, smelling of clover and coal smoke, on vellum that had not aged an hour.", genres: ["romance", "literary"] },
    { id: "op-7", text: "Steam hissed from the undercarriage of Car 7, the dining tables were set with warm toast and hot coffee, but the train was empty.", genres: ["mystery"] },
    { id: "op-8", text: "Financial ledgers are clean because numbers lack human sentiment, until an offshore account number spells your mother's maiden name.", genres: ["thriller"] },
    { id: "op-9", text: "Salt enters chisel grooves before stone dries, making every memorial chiseled for the extinct terns look as though it wept itself into limestone.", genres: ["literary"] },
    { id: "op-10", text: "Seven raps against the joists above room 302, rhythmic as clockwork, followed by the shifting of fine grit inside my own boot soles.", genres: ["horror"] },
    { id: "op-11", text: "Forging true heartbreak requires aged lampblack ink, a rusted steel nib, and the discipline never to let tears smear the third paragraph.", genres: ["romance"] },
    { id: "op-12", text: "The hilt was glacial river stone, and when my fingers closed around the grip, the crypt floor trembled with the pulse of a waking heart.", genres: ["fantasy"] }
];

const CHAOS_MODIFIERS: string[] = [
    "Write the scene without using the letter 'E' anywhere in the text.",
    "Must include a ticking physical clock with under 10 minutes remaining.",
    "The protagonist cannot tell a direct lie, but must deliberately mislead someone.",
    "Every line of dialogue must consist of eight words or fewer.",
    "Narrate the scene from the second-person perspective ('You').",
    "Incorporate a physical sensory detail involving the scent of wet copper.",
    "The two characters speaking must never directly make eye contact during the scene.",
    "A crucial secret must be accidentally revealed in the background through ambient sound."
];

interface GeneratedPrompt {
    premise: SlotItem;
    protagonist: SlotItem;
    setting: SlotItem;
    conflict: SlotItem;
    twist: SlotItem;
    opener: SlotItem;
}

const filterPoolByGenre = (pool: SlotItem[], genre: GenreType): SlotItem[] => {
    if (genre === "all") return pool;
    const matched = pool.filter((item) => item.genres.includes(genre));
    return matched.length > 0 ? matched : pool;
};

const getRandomSlot = (pool: SlotItem[], genre: GenreType): SlotItem => {
    const valid = filterPoolByGenre(pool, genre);
    const index = Math.floor(Math.random() * valid.length);
    return valid[index];
};

export default function WritingPromptGenerator() {
    const [selectedGenre, setSelectedGenre] = useState<GenreType>("all");
    const [selectedMode, setSelectedMode] = useState<PromptMode>("full-hook");
    const [complexityLevel, setComplexityLevel] = useState<"standard" | "complex">("complex");
    const [wordCountTarget, setWordCountTarget] = useState<number>(500);

    // Slot Lock States
    const [lockedSlots, setLockedSlots] = useState<{
        premise: boolean;
        protagonist: boolean;
        setting: boolean;
        conflict: boolean;
        twist: boolean;
        opener: boolean;
    }>({
        premise: false,
        protagonist: false,
        setting: false,
        conflict: false,
        twist: false,
        opener: false
    });

    // Active Slot Values
    const [currentSlots, setCurrentSlots] = useState<GeneratedPrompt>(() => ({
        premise: PREMISE_POOL[0],
        protagonist: PROTAGONIST_POOL[0],
        setting: SETTING_POOL[0],
        conflict: CONFLICT_POOL[0],
        twist: TWIST_POOL[0],
        opener: OPENERS_POOL[0]
    }));

    // Chaos Modifier
    const [activeModifier, setActiveModifier] = useState<string | null>(null);

    // Sprint & Scratchpad State
    const [scratchpadText, setScratchpadText] = useState<string>("");
    const [sprintDuration, setSprintDuration] = useState<number>(15 * 60); // 15 mins
    const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // UI States
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const [savedDossiers, setSavedDossiers] = useState<Array<{ id: number; title: string; text: string }>>([]);

    // Live Word Counter
    const wordCount = useMemo(() => {
        const trimmed = scratchpadText.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).filter(Boolean).length;
    }, [scratchpadText]);

    const progressPct = useMemo(() => {
        if (wordCountTarget <= 0) return 0;
        return Math.min(100, Math.round((wordCount / wordCountTarget) * 100));
    }, [wordCount, wordCountTarget]);

    // Timer logic
    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setIsTimerRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning]);

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const toggleLock = (key: keyof typeof lockedSlots) => {
        setLockedSlots((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleRerollSlot = (key: keyof typeof lockedSlots) => {
        const pools = {
            premise: PREMISE_POOL,
            protagonist: PROTAGONIST_POOL,
            setting: SETTING_POOL,
            conflict: CONFLICT_POOL,
            twist: TWIST_POOL,
            opener: OPENERS_POOL
        };
        const next = getRandomSlot(pools[key], selectedGenre);
        setCurrentSlots((prev) => ({ ...prev, [key]: next }));
    };

    const handleGenerateAll = () => {
        setCurrentSlots((prev) => ({
            premise: lockedSlots.premise ? prev.premise : getRandomSlot(PREMISE_POOL, selectedGenre),
            protagonist: lockedSlots.protagonist ? prev.protagonist : getRandomSlot(PROTAGONIST_POOL, selectedGenre),
            setting: lockedSlots.setting ? prev.setting : getRandomSlot(SETTING_POOL, selectedGenre),
            conflict: lockedSlots.conflict ? prev.conflict : getRandomSlot(CONFLICT_POOL, selectedGenre),
            twist: lockedSlots.twist ? prev.twist : getRandomSlot(TWIST_POOL, selectedGenre),
            opener: lockedSlots.opener ? prev.opener : getRandomSlot(OPENERS_POOL, selectedGenre)
        }));
    };

    const handleToggleChaos = () => {
        if (activeModifier) {
            setActiveModifier(null);
        } else {
            const mod = CHAOS_MODIFIERS[Math.floor(Math.random() * CHAOS_MODIFIERS.length)];
            setActiveModifier(mod);
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(label);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const handleSaveDossier = () => {
        const title = currentSlots.premise.text.slice(0, 45) + "...";
        const text = `GENRE: ${selectedGenre.toUpperCase()}
PREMISE: ${currentSlots.premise.text}
PROTAGONIST: ${currentSlots.protagonist.text}
SETTING: ${currentSlots.setting.text}
CONFLICT: ${currentSlots.conflict.text}
TWIST: ${currentSlots.twist.text}
FIRST LINE: "${currentSlots.opener.text}"
${activeModifier ? `CONSTRAINT: ${activeModifier}\n` : ""}WORDS WRITTEN: ${wordCount} / ${wordCountTarget}
DRAFT CONTENT:
${scratchpadText}`;

        setSavedDossiers((prev) => [{ id: Date.now(), title, text }, ...prev].slice(0, 15));
    };

    const handleExportTxt = () => {
        const textContent = `TWISTERTOOLS CREATIVE WRITING SPRINT
==================================================
Date: ${new Date().toLocaleDateString()}
Genre: ${selectedGenre.toUpperCase()} | Sprint Target: ${wordCountTarget} words
Time Remaining: ${formatTimer(timeLeft)}
Words Logged: ${wordCount} words (${progressPct}% completed)
==================================================

STORY ARCHITECTURE:
- Premise: ${currentSlots.premise.text}
- Protagonist: ${currentSlots.protagonist.text}
- Setting: ${currentSlots.setting.text}
- Inciting Conflict: ${currentSlots.conflict.text}
- Narrative Reversal: ${currentSlots.twist.text}
- Opening Line: "${currentSlots.opener.text}"
${activeModifier ? `- Creative Constraint: ${activeModifier}\n` : ""}
==================================================
LIVE SCRATCHPAD DRAFT:
==================================================
${scratchpadText || "[No scratchpad draft text typed yet.]"}
`;

        const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `story-sprint-${selectedGenre}-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setWordCountTarget(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        setWordCountTarget(isNaN(num) ? 0 : Math.min(50000, Math.max(0, num)));
    };

    const fullStoryBrief = `GENRE: ${selectedGenre.toUpperCase()}
PREMISE: ${currentSlots.premise.text}
PROTAGONIST: ${currentSlots.protagonist.text}
SETTING: ${currentSlots.setting.text}
CONFLICT: ${currentSlots.conflict.text}
TWIST: ${currentSlots.twist.text}
OPENER: "${currentSlots.opener.text}"
${activeModifier ? `CONSTRAINT: ${activeModifier}\n` : ""}`;

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Writing Prompt & Story Hook Generator",
        "url": "https://twistertools.com/tools/random-tools/writing-prompt-generator",
        "description": "Combinatoric procedural story engine with lockable premise slots, live writing sprint countdown timer, word count tracker, and integrated creative scratchpad.",
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
                "name": "How does this combinatoric writing prompt generator create millions of story permutations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Rather than serving a small library of static cards, this tool independently synthesizes premises, character traits, settings, narrative conflicts, and twists using client-side combinatorics. With hundreds of thousands of possible combinations across genres, writers can lock favorite elements and re-roll the rest."
                }
            },
            {
                "@type": "Question",
                "name": "How does the 'Lock & Reroll' slot mechanic work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Clicking the lock icon next to any slot (such as Protagonist or Setting) freezes that specific story element in place. When you click 'Generate Story Hook', only your unlocked elements are reshuffled, giving you complete granular creative control."
                }
            },
            {
                "@type": "Question",
                "name": "Is my scratchpad draft private and secure?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, 100%. All generation math, timer functions, and scratchpad text remain entirely inside your local browser memory. Zero keystrokes, story drafts, or personal data are ever transmitted to any external server."
                }
            },
            {
                "@type": "Question",
                "name": "How should I structure a 15-minute flash writing sprint?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Start the 15-minute countdown clock, begin typing immediately using the generated first sentence, establish the core conflict by minute five, introduce the third-act reversal by minute ten, and wrap up the scene before the timer rings."
                }
            },
            {
                "@type": "Question",
                "name": "Can I publish or sell commercial novels written from these prompts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Every prompt generated is 100% royalty-free and belongs to the public domain. Your prose, dialogue, and completed manuscripts remain your exclusive intellectual property."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />



            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Combinatoric Slot Engine */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                                Combinatoric Slot Engine
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                                3,500,000+ Permutations
                            </span>
                        </div>

                        {/* Genre Filter Pills */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-indigo-600" />
                                Literary Genre Focus
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(["all", "sci-fi", "fantasy", "thriller", "romance", "horror", "literary", "mystery"] as GenreType[]).map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setSelectedGenre(g)}
                                        className={`py-2 px-2 text-xs font-bold rounded-xl transition border text-center capitalize cursor-pointer ${selectedGenre === g
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modular Lockable Slots */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Narrative Architecture Slots
                                </label>
                                <span className="text-[11px] text-slate-400 font-medium">Pin elements to lock them</span>
                            </div>

                            {/* Slot 1: Core Premise */}
                            <div className={`p-3 rounded-xl border transition ${lockedSlots.premise ? "bg-indigo-50/50 border-indigo-300" : "bg-slate-50 border-slate-200"}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                                        <Flame className="w-3.5 h-3.5 text-indigo-600" /> Core Premise Hook
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleRerollSlot("premise")}
                                            className="p-1 rounded hover:bg-white text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                                            title="Reroll this slot"
                                        >
                                            <Shuffle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => toggleLock("premise")}
                                            className={`p-1 rounded transition cursor-pointer ${lockedSlots.premise ? "text-indigo-600 bg-white shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                                            title={lockedSlots.premise ? "Unlock" : "Lock in place"}
                                        >
                                            {lockedSlots.premise ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                                    {currentSlots.premise.text}
                                </p>
                            </div>

                            {/* Slot 2: Protagonist */}
                            <div className={`p-3 rounded-xl border transition ${lockedSlots.protagonist ? "bg-indigo-50/50 border-indigo-300" : "bg-slate-50 border-slate-200"}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                                        <Target className="w-3.5 h-3.5 text-indigo-600" /> Flawed Protagonist
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleRerollSlot("protagonist")}
                                            className="p-1 rounded hover:bg-white text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                                            title="Reroll this slot"
                                        >
                                            <Shuffle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => toggleLock("protagonist")}
                                            className={`p-1 rounded transition cursor-pointer ${lockedSlots.protagonist ? "text-indigo-600 bg-white shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                                            title={lockedSlots.protagonist ? "Unlock" : "Lock in place"}
                                        >
                                            {lockedSlots.protagonist ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                                    {currentSlots.protagonist.text}
                                </p>
                            </div>

                            {/* Slot 3: Setting */}
                            <div className={`p-3 rounded-xl border transition ${lockedSlots.setting ? "bg-indigo-50/50 border-indigo-300" : "bg-slate-50 border-slate-200"}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                                        <Compass className="w-3.5 h-3.5 text-indigo-600" /> Atmosphere & World
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleRerollSlot("setting")}
                                            className="p-1 rounded hover:bg-white text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                                            title="Reroll this slot"
                                        >
                                            <Shuffle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => toggleLock("setting")}
                                            className={`p-1 rounded transition cursor-pointer ${lockedSlots.setting ? "text-indigo-600 bg-white shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                                            title={lockedSlots.setting ? "Unlock" : "Lock in place"}
                                        >
                                            {lockedSlots.setting ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                                    {currentSlots.setting.text}
                                </p>
                            </div>

                            {/* Slot 4: Conflict */}
                            <div className={`p-3 rounded-xl border transition ${lockedSlots.conflict ? "bg-indigo-50/50 border-indigo-300" : "bg-slate-50 border-slate-200"}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                                        <Flame className="w-3.5 h-3.5 text-amber-600" /> High-Stakes Conflict
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleRerollSlot("conflict")}
                                            className="p-1 rounded hover:bg-white text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                                            title="Reroll this slot"
                                        >
                                            <Shuffle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => toggleLock("conflict")}
                                            className={`p-1 rounded transition cursor-pointer ${lockedSlots.conflict ? "text-indigo-600 bg-white shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                                            title={lockedSlots.conflict ? "Unlock" : "Lock in place"}
                                        >
                                            {lockedSlots.conflict ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                                    {currentSlots.conflict.text}
                                </p>
                            </div>

                            {/* Slot 5: Reversal Twist */}
                            <div className={`p-3 rounded-xl border transition ${lockedSlots.twist ? "bg-indigo-50/50 border-indigo-300" : "bg-slate-50 border-slate-200"}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                                        <Sparkle className="w-3.5 h-3.5 text-indigo-600" /> Third-Act Reversal
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleRerollSlot("twist")}
                                            className="p-1 rounded hover:bg-white text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                                            title="Reroll this slot"
                                        >
                                            <Shuffle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => toggleLock("twist")}
                                            className={`p-1 rounded transition cursor-pointer ${lockedSlots.twist ? "text-indigo-600 bg-white shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                                            title={lockedSlots.twist ? "Unlock" : "Lock in place"}
                                        >
                                            {lockedSlots.twist ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                                    {currentSlots.twist.text}
                                </p>
                            </div>
                        </div>

                        {/* Chaos Constraint Toggle */}
                        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                                    <Dice5 className="w-4 h-4 text-amber-600" /> Creative Chaos Modifier
                                </span>
                                <span className="text-[11px] text-amber-700">Add an unexpected technical constraint</span>
                            </div>
                            <button
                                onClick={handleToggleChaos}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeModifier ? "bg-amber-600 text-white shadow-xs" : "bg-white text-amber-800 border border-amber-300 hover:bg-amber-100"}`}
                            >
                                {activeModifier ? "Active" : "Apply Modifier"}
                            </button>
                        </div>

                        {activeModifier && (
                            <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs font-medium text-amber-950 italic">
                                &ldquo;{activeModifier}&rdquo;
                            </div>
                        )}
                    </div>

                    {/* Bottom Generation Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleGenerateAll}
                            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4" />
                            Shuffle Unlocked Slots
                        </button>
                        <button
                            onClick={handleSaveDossier}
                            className="py-3 px-4 rounded-xl font-bold text-sm transition border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Bookmark className="w-4 h-4" />
                            Save Outline
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Integrated Sprint & Live Scratchpad */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Feather className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-bold text-slate-900">Sprint & Writing Scratchpad</h2>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                                {selectedGenre}
                            </span>
                        </div>

                        {/* First-Line Opener Box */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-2">
                            <div className="flex items-center justify-between text-xs text-indigo-300">
                                <span className="font-bold flex items-center gap-1 uppercase tracking-wide">
                                    <Flame className="w-3.5 h-3.5 text-indigo-400" /> Suggested First Sentence Opener
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleRerollSlot("opener")}
                                        className="text-indigo-300 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                                        title="Reroll first line"
                                    >
                                        <Shuffle className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleCopy(currentSlots.opener.text, "opener")}
                                        className="text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer pl-1"
                                    >
                                        {copiedSection === "opener" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedSection === "opener" ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm sm:text-base font-serif italic text-slate-100 leading-relaxed pl-2 border-l-2 border-indigo-400">
                                &ldquo;{currentSlots.opener.text}&rdquo;
                            </p>
                        </div>

                        {/* Sprint Timer Controls Bar */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                                    <Timer className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">Sprint Timer</div>
                                    <div className="text-lg font-mono font-black text-slate-900">
                                        {formatTimer(timeLeft)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${isTimerRunning
                                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        }`}
                                >
                                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                    {isTimerRunning ? "Pause" : "Start"}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsTimerRunning(false);
                                        setTimeLeft(sprintDuration);
                                    }}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    title="Reset timer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                <select
                                    value={sprintDuration}
                                    onChange={(e) => {
                                        const secs = Number(e.target.value);
                                        setSprintDuration(secs);
                                        setTimeLeft(secs);
                                        setIsTimerRunning(false);
                                    }}
                                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none"
                                >
                                    <option value={5 * 60}>5 Mins</option>
                                    <option value={10 * 60}>10 Mins</option>
                                    <option value={15 * 60}>15 Mins</option>
                                    <option value={25 * 60}>25 Mins (Pomodoro)</option>
                                    <option value={45 * 60}>45 Mins</option>
                                </select>
                            </div>
                        </div>

                        {/* Live Word Count Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-700 flex items-center gap-1">
                                    Target:
                                    <input
                                        type="number"
                                        min="50"
                                        max="50000"
                                        value={wordCountTarget === 0 ? "" : wordCountTarget}
                                        onChange={handleNumberInput}
                                        className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-slate-900 font-bold text-xs ml-1"
                                    />
                                    words
                                </span>
                                <span className={progressPct >= 100 ? "text-emerald-600 font-extrabold" : "text-indigo-600 font-bold"}>
                                    {wordCount} Words ({progressPct}%)
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                    className={`h-full transition-all duration-300 ${progressPct >= 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Interactive In-Browser Scratchpad Textarea */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                                <span>Private Local Scratchpad</span>
                                <span>100% In-Browser & Secure</span>
                            </div>
                            <textarea
                                value={scratchpadText}
                                onChange={(e) => setScratchpadText(e.target.value)}
                                placeholder="Paste your first line here and write uninterrupted until the sprint timer completes..."
                                rows={7}
                                className="w-full p-3.5 rounded-xl border border-slate-200 text-slate-900 font-serif text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 resize-y min-h-[160px]"
                            />
                        </div>

                        {/* Saved Outlines Drawer */}
                        {savedDossiers.length > 0 && (
                            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-1">
                                        <Bookmark className="w-3.5 h-3.5 text-indigo-600" /> Saved Outlines ({savedDossiers.length})
                                    </span>
                                    <button
                                        onClick={() => setSavedDossiers([])}
                                        className="text-slate-400 hover:text-red-500 text-[11px] font-semibold cursor-pointer"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                                    {savedDossiers.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
                                            <span className="font-semibold text-slate-800 truncate pr-2">
                                                {item.title}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(item.text, `dossier-${item.id}`)}
                                                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold whitespace-nowrap cursor-pointer"
                                            >
                                                {copiedSection === `dossier-${item.id}` ? "Copied" : "Copy"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Export & Copy Controls */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={() => handleCopy(fullStoryBrief, "full")}
                            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedSection === "full" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedSection === "full" ? "Copied Full Architecture" : "Copy Story Architecture"}
                        </button>
                        <button
                            onClick={handleExportTxt}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            Export Sprint Dossier (.TXT)
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Anatomical Framework of a Narrative Hook */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Anatomy of a High-Impact Story Hook
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A successful literary hook is not a passive descriptive summary; it is an unstable equilibrium that compels immediate narrative momentum. To break through writer&apos;s block, narrative hooks must contain four fundamental pillars:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> The Inciting Disruption
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The immediate fracture of normal conditions. Whether it is an inheritance of stolen time or an emergency dispatch call reciting your private address, the disruption removes the option of returning to status quo.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-600" /> The Asymmetric Constraint
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Protagonists must operate under concrete disadvantages: missing technology, ticking biological clocks, or legal restrictions that eliminate standard avenues of resolution.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" /> The Moral Trilemma
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Compelling fiction avoids trivial good-versus-evil dichotomies. Characters must choose between two unfavorable outcomes, guaranteeing personal loss regardless of decision.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> The Perceptual Reversal
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                A mid-narrative paradigm shift that forces readers and characters to re-evaluate every action taken in Act One, escalating stakes before the climactic resolution.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Genre Mechanics & Structural Expectations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Genre Conventions & Narrative Pacing Guide
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Different genres demand distinct narrative engines to captivate audiences. Use this structural reference matrix to guide pacing, atmosphere, and sensory details:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Genre</th>
                                    <th className="p-3">Primary Dramatic Engine</th>
                                    <th className="p-3">Atmospheric Priority</th>
                                    <th className="p-3">Crucial Pivot Point</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Sci-Fi</td>
                                    <td className="p-3">Technological or Temporal Friction</td>
                                    <td className="p-3">Clinical estrangement, systemic scales</td>
                                    <td className="p-3">System failure or unintended consequence</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Fantasy</td>
                                    <td className="p-3">Cost of Preternatural Power</td>
                                    <td className="p-3">Mythic resonance, tactile antiquity</td>
                                    <td className="p-3">Shattering of ancient protective covenant</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Thriller / Mystery</td>
                                    <td className="p-3">Information Asymmetry & Time Leaks</td>
                                    <td className="p-3">Claustrophobia, surveillance paranoia</td>
                                    <td className="p-3">The ally discovered as the primary architect</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Horror</td>
                                    <td className="p-3">Inevitability & Bodily Violation</td>
                                    <td className="p-3">Sensory rot, sound distortion, dread</td>
                                    <td className="p-3">Realization that escape accelerates infection</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Romance</td>
                                    <td className="p-3">Emotional Vulnerability vs Self-Preservation</td>
                                    <td className="p-3">Intimate observation, suppressed longing</td>
                                    <td className="p-3">The secret confession that risks everything</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5-Step Flash Fiction Sprint Blueprint */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The 5-Step 30-Minute Writing Sprint Blueprint
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To build productive daily drafting habits, apply the timed sprint method using generated hooks:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">Phase 1: Anchor</span>
                                <span className="text-[11px] font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">0-5 Min</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Paste the generated opening line directly into your document. Do not edit or soften it. Write your protagonist immediately reacting to a physical sensation.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">Phase 2: Escalate</span>
                                <span className="text-[11px] font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">5-20 Min</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Introduce the core conflict by sentence four. Force the protagonist to make an active choice that closes off their easiest retreat path.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">Phase 3: Pivot</span>
                                <span className="text-[11px] font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">20-30 Min</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Trigger the narrative reversal. End the scene on an unresolved consequence rather than an artificial neat resolution to maintain story momentum.
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
                                How does this combinatoric writing prompt generator create millions of story permutations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Rather than serving a small library of static cards, this tool independently synthesizes premises, character traits, settings, narrative conflicts, and twists using client-side combinatorics. With hundreds of thousands of possible combinations across genres, writers can lock favorite elements and re-roll the rest.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the &apos;Lock &amp; Reroll&apos; slot mechanic work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Clicking the lock icon next to any slot (such as Protagonist or Setting) freezes that specific story element in place. When you click &apos;Shuffle Unlocked Slots&apos;, only your unlocked elements are reshuffled, giving you complete granular creative control.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my scratchpad draft private and secure?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, 100%. All generation math, timer functions, and scratchpad text remain entirely inside your local browser memory. Zero keystrokes, story drafts, or personal data are ever transmitted to any external server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How should I structure a 15-minute flash writing sprint?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Start the 15-minute countdown clock, begin typing immediately using the generated first sentence, establish the core conflict by minute five, introduce the third-act reversal by minute ten, and wrap up the scene before the timer rings.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I publish or sell commercial novels written from these prompts?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Every prompt generated is 100% royalty-free and belongs to the public domain. Your prose, dialogue, and completed manuscripts remain your exclusive intellectual property.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}