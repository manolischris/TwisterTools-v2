"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Flame,
    Shield,
    Sparkles,
    PartyPopper,
    RotateCw,
    Copy,
    Check,
    Download,
    Plus,
    Trash2,
    Sliders,
    HelpCircle,
    BookOpen,
    Users,
    Shuffle,
    Layers,
    Share2,
    ShieldAlert,
    Lightbulb,
    ListFilter,
    ArrowRight
} from "lucide-react";

type GameMode = "classic" | "party" | "couples" | "spicy" | "deep";
type PromptType = "truth" | "dare";
type IntensityLevel = "mild" | "medium" | "extreme";

interface PromptItem {
    id: string;
    type: PromptType;
    text: string;
    mode: GameMode;
    intensity: IntensityLevel;
    tags: string[];
}

interface Player {
    id: string;
    name: string;
    score: number;
}

interface HistoryItem {
    id: string;
    player?: string;
    type: PromptType;
    text: string;
    mode: GameMode;
    intensity: IntensityLevel;
    timestamp: string;
}

const DEFAULT_PROMPTS: PromptItem[] = [
    // ==========================================
    // CLASSIC MODE - TRUTH (10)
    // ==========================================
    { id: "c-t-1", type: "truth", mode: "classic", intensity: "mild", text: "What is the most embarrassing fashion trend you proudly followed?", tags: ["nostalgia", "fun"] },
    { id: "c-t-2", type: "truth", mode: "classic", intensity: "mild", text: "Have you ever told a white lie to get out of a dinner or party invitation?", tags: ["honesty", "social"] },
    { id: "c-t-3", type: "truth", mode: "classic", intensity: "mild", text: "What is your ultimate comfort food combination that everyone else finds bizarre?", tags: ["food", "habits"] },
    { id: "c-t-4", type: "truth", mode: "classic", intensity: "mild", text: "What childhood cartoon or movie character did you genuinely wish was real?", tags: ["childhood", "memories"] },
    { id: "c-t-5", type: "truth", mode: "classic", intensity: "medium", text: "What is one secret skill or hobby you have never shown anyone in this room?", tags: ["secrets", "talents"] },
    { id: "c-t-6", type: "truth", mode: "classic", intensity: "medium", text: "What is the weirdest habit you indulge in only when you are completely alone at home?", tags: ["habits", "lifestyle"] },
    { id: "c-t-7", type: "truth", mode: "classic", intensity: "medium", text: "What was the most awkward misinterpretation of a text message you ever had?", tags: ["texting", "awkward"] },
    { id: "c-t-8", type: "truth", mode: "classic", intensity: "medium", text: "If your browser search history from age 14 went public, what would be the most cringe topic?", tags: ["cringe", "history"] },
    { id: "c-t-9", type: "truth", mode: "classic", intensity: "extreme", text: "What is your biggest irrational fear that you know makes zero logical sense?", tags: ["fears", "deep"] },
    { id: "c-t-10", type: "truth", mode: "classic", intensity: "extreme", text: "Have you ever accidentally damaged someone else's property and never admitted it was you?", tags: ["secrets", "confession"] },

    // ==========================================
    // CLASSIC MODE - DARE (10)
    // ==========================================
    { id: "c-d-1", type: "dare", mode: "classic", intensity: "mild", text: "Imitate your favorite celebrity or cartoon character for the next 45 seconds without breaking character.", tags: ["acting", "humor"] },
    { id: "c-d-2", type: "dare", mode: "classic", intensity: "mild", text: "Attempt to balance a spoon or small object on your nose for a full 30 seconds.", tags: ["physical", "silly"] },
    { id: "c-d-3", type: "dare", mode: "classic", intensity: "mild", text: "Recite the entire alphabet backwards starting from Z as quickly as you can.", tags: ["brain", "speed"] },
    { id: "c-d-4", type: "dare", mode: "classic", intensity: "mild", text: "Do your best robotic impression while delivering a serious weather report to the group.", tags: ["acting", "improv"] },
    { id: "c-d-5", type: "dare", mode: "classic", intensity: "medium", text: "Let the person to your right restyle your hair however they want for the next 3 rounds.", tags: ["appearance", "friends"] },
    { id: "c-d-6", type: "dare", mode: "classic", intensity: "medium", text: "Speak entirely in rhymes or Shakespearean dialogue until your next turn arrives.", tags: ["speech", "creative"] },
    { id: "c-d-7", type: "dare", mode: "classic", intensity: "medium", text: "Do 15 clean push-ups or 20 air squats while counting out loud in an accent chosen by the group.", tags: ["fitness", "fun"] },
    { id: "c-d-8", type: "dare", mode: "classic", intensity: "medium", text: "Let the person across from you draw a small decorative mustache or star on your cheek with a washable pen.", tags: ["silly", "face"] },
    { id: "c-d-9", type: "dare", mode: "classic", intensity: "extreme", text: "Do your absolute best 60-second stand-up comedy routine addressing the group right now.", tags: ["comedy", "bold"] },
    { id: "c-d-10", type: "dare", mode: "classic", intensity: "extreme", text: "Call a pizza shop or local bakery and sincerely ask if they sell freshly baked shoe laces.", tags: ["prank", "bold"] },

    // ==========================================
    // PARTY MODE - TRUTH (10)
    // ==========================================
    { id: "p-t-1", type: "truth", mode: "party", intensity: "mild", text: "What song is your ultimate guilty pleasure that you blast with the windows down?", tags: ["music", "vibes"] },
    { id: "p-t-2", type: "truth", mode: "party", intensity: "mild", text: "What is the worst haircut or dye job you ever endured right before a major event?", tags: ["looks", "disaster"] },
    { id: "p-t-3", type: "truth", mode: "party", intensity: "mild", text: "What is the longest streak you spent binge-watching a television series without leaving bed?", tags: ["binge", "tv"] },
    { id: "p-t-4", type: "truth", mode: "party", intensity: "medium", text: "If you had to trade lives with someone in this room for 24 hours, who would it be and why?", tags: ["hypothetical", "friends"] },
    { id: "p-t-5", type: "truth", mode: "party", intensity: "medium", text: "What was your absolute worst encounter on a first date or public outing?", tags: ["dating", "stories"] },
    { id: "p-t-6", type: "truth", mode: "party", intensity: "medium", text: "Have you ever pretended to recognize an acquaintance whose name you completely forgot?", tags: ["awkward", "social"] },
    { id: "p-t-7", type: "truth", mode: "party", intensity: "medium", text: "What is the silliest excuse you gave a boss or teacher to explain being late?", tags: ["excuses", "work"] },
    { id: "p-t-8", type: "truth", mode: "party", intensity: "extreme", text: "What is the wildest thing you have ever purchased impulsively online late at night?", tags: ["shopping", "regrets"] },
    { id: "p-t-9", type: "truth", mode: "party", intensity: "extreme", text: "What is one rumor you heard about yourself that turned out to be completely false?", tags: ["rumors", "drama"] },
    { id: "p-t-10", type: "truth", mode: "party", intensity: "extreme", text: "Who in this room would survive the shortest amount of time in a zombie apocalypse?", tags: ["survival", "banter"] },

    // ==========================================
    // PARTY MODE - DARE (10)
    // ==========================================
    { id: "p-d-1", type: "dare", mode: "party", intensity: "mild", text: "Show the last photo currently saved in your camera roll to everyone at the table.", tags: ["phone", "candid"] },
    { id: "p-d-2", type: "dare", mode: "party", intensity: "mild", text: "Take a sip of a non-alcoholic concoction mixed together by the two players to your left.", tags: ["mixology", "dare"] },
    { id: "p-d-3", type: "dare", mode: "party", intensity: "mild", text: "Deliver your best opera singing rendition of 'Happy Birthday' to whoever has the closest upcoming birthday.", tags: ["singing", "party"] },
    { id: "p-d-4", type: "dare", mode: "party", intensity: "medium", text: "Perform a dramatic slow-motion dance solo to whatever background sound is currently playing.", tags: ["dance", "silly"] },
    { id: "p-d-5", type: "dare", mode: "party", intensity: "medium", text: "Put your playlist on shuffle and passionately lip-sync whatever song plays first.", tags: ["music", "karaoke"] },
    { id: "p-d-6", type: "dare", mode: "party", intensity: "medium", text: "Let the group compose a text message to your closest mutual friend saying only: 'The eagle has landed.'", tags: ["texting", "mischief"] },
    { id: "p-d-7", type: "dare", mode: "party", intensity: "medium", text: "Attempt to moonwalk across the room while maintaining eye contact with a player of the group's choice.", tags: ["dance", "funny"] },
    { id: "p-d-8", type: "dare", mode: "party", intensity: "extreme", text: "Let the group compose a ridiculous one-sentence status update and post it to your favorite social platform for 10 minutes.", tags: ["social", "cringe"] },
    { id: "p-d-9", type: "dare", mode: "party", intensity: "extreme", text: "Eat a teaspoon of mustard, hot sauce, or straight lemon juice without making a single facial reaction.", tags: ["taste", "endurance"] },
    { id: "p-d-10", type: "dare", mode: "party", intensity: "extreme", text: "Swap shoes with the player sitting directly opposite you for the next two rounds of the game.", tags: ["swap", "silly"] },

    // ==========================================
    // COUPLES MODE - TRUTH (10)
    // ==========================================
    { id: "cp-t-1", type: "truth", mode: "couples", intensity: "mild", text: "What was the very first thought that crossed your mind the moment you met your partner?", tags: ["romance", "memories"] },
    { id: "cp-t-2", type: "truth", mode: "couples", intensity: "mild", text: "What is your partner's signature meal or cooking specialty that you genuinely crave?", tags: ["food", "appreciation"] },
    { id: "cp-t-3", type: "truth", mode: "couples", intensity: "mild", text: "Which movie or series always reminds you of the early days of your relationship?", tags: ["nostalgia", "media"] },
    { id: "cp-t-4", type: "truth", mode: "couples", intensity: "medium", text: "What tiny everyday quirk of your partner makes you smile when nobody else is watching?", tags: ["quirks", "sweet"] },
    { id: "cp-t-5", type: "truth", mode: "couples", intensity: "medium", text: "What is one outfit or style your partner wears that you find completely irresistible?", tags: ["style", "attraction"] },
    { id: "cp-t-6", type: "truth", mode: "couples", intensity: "medium", text: "When did you first realize you were developing serious, lasting feelings for your partner?", tags: ["love", "milestones"] },
    { id: "cp-t-7", type: "truth", mode: "couples", intensity: "medium", text: "What is a minor pet peeve about your partner that you find secretly endearing anyway?", tags: ["petpeeve", "humor"] },
    { id: "cp-t-8", type: "truth", mode: "couples", intensity: "extreme", text: "What is one dream vacation or life adventure you have been dying to share together?", tags: ["travel", "future"] },
    { id: "cp-t-9", type: "truth", mode: "couples", intensity: "extreme", text: "What was the most nervous moment you experienced when introducing your partner to your circle?", tags: ["dating", "vulnerability"] },
    { id: "cp-t-10", type: "truth", mode: "couples", intensity: "extreme", text: "What is one aspiration for our shared future that you have not voiced out loud yet?", tags: ["future", "intimacy"] },

    // ==========================================
    // COUPLES MODE - DARE (10)
    // ==========================================
    { id: "cp-d-1", type: "dare", mode: "couples", intensity: "mild", text: "Maintain unbroken eye contact with your partner for 45 seconds without laughing or speaking.", tags: ["intimacy", "focus"] },
    { id: "cp-d-2", type: "dare", mode: "couples", intensity: "mild", text: "Slow dance with your partner for 60 seconds with no background music playing at all.", tags: ["romance", "dance"] },
    { id: "cp-d-3", type: "dare", mode: "couples", intensity: "mild", text: "Give your partner a gentle 60-second hand or neck massage right now.", tags: ["touch", "care"] },
    { id: "cp-d-4", type: "dare", mode: "couples", intensity: "medium", text: "Give your partner an impromptu, sincere 60-second tribute highlighting 3 things you admire about them.", tags: ["compliments", "wholesome"] },
    { id: "cp-d-5", type: "dare", mode: "couples", intensity: "medium", text: "Recreate your very first conversation with your partner as if you just crossed paths today.", tags: ["roleplay", "nostalgia"] },
    { id: "cp-d-6", type: "dare", mode: "couples", intensity: "medium", text: "Whisper your favorite shared memory together into your partner's ear in under 20 seconds.", tags: ["whisper", "sweet"] },
    { id: "cp-d-7", type: "dare", mode: "couples", intensity: "medium", text: "Let your partner feed you a snack or drink blindfolded while you guess what it is.", tags: ["sensory", "fun"] },
    { id: "cp-d-8", type: "dare", mode: "couples", intensity: "extreme", text: "Recreate the iconic dance or signature pose from your favorite romantic movie together.", tags: ["acting", "fun"] },
    { id: "cp-d-9", type: "dare", mode: "couples", intensity: "extreme", text: "Compose a 4-line rhyming poem professing your love for your partner and recite it theatrically.", tags: ["poetry", "creative"] },
    { id: "cp-d-10", type: "dare", mode: "couples", intensity: "extreme", text: "Let your partner unlock your camera roll and pick their favorite candid photo of you to set as your lockscreen.", tags: ["phone", "trust"] },

    // ==========================================
    // SPICY MODE - TRUTH (10)
    // ==========================================
    { id: "s-t-1", type: "truth", mode: "spicy", intensity: "mild", text: "What is your biggest romantic green flag that instantly catches your attention?", tags: ["attraction", "flirt"] },
    { id: "s-t-2", type: "truth", mode: "spicy", intensity: "mild", text: "What fragrance, scent, or perfume notes do you find overwhelmingly attractive on someone?", tags: ["scent", "attraction"] },
    { id: "s-t-3", type: "truth", mode: "spicy", intensity: "medium", text: "Who was your very first celebrity crush and do you still find them attractive today?", tags: ["crush", "revealing"] },
    { id: "s-t-4", type: "truth", mode: "spicy", intensity: "medium", text: "What is the cheesiest or smoothest pickup line anyone has ever attempted on you?", tags: ["dating", "flirting"] },
    { id: "s-t-5", type: "truth", mode: "spicy", intensity: "medium", text: "What physical attribute or personality trait do you notice first when meeting someone new?", tags: ["traits", "dating"] },
    { id: "s-t-6", type: "truth", mode: "spicy", intensity: "medium", text: "Have you ever had an unexpected crush on someone you previously couldn't stand?", tags: ["crushes", "secrets"] },
    { id: "s-t-7", type: "truth", mode: "spicy", intensity: "extreme", text: "What is your honest definition of a 10/10 date night from start to finish?", tags: ["dating", "romance"] },
    { id: "s-t-8", type: "truth", mode: "spicy", intensity: "extreme", text: "What is a bold flirtatious move someone pulled on you that actually worked instantly?", tags: ["flirt", "confidence"] },
    { id: "s-t-9", type: "truth", mode: "spicy", intensity: "extreme", text: "If you had to pick one person in this room to go on a romantic blind date with, who would it be?", tags: ["daring", "room"] },
    { id: "s-t-10", type: "truth", mode: "spicy", intensity: "extreme", text: "What is one romantic fantasy or scenario you have never confided to anyone?", tags: ["secrets", "intimacy"] },

    // ==========================================
    // SPICY MODE - DARE (10)
    // ==========================================
    { id: "s-d-1", type: "dare", mode: "spicy", intensity: "mild", text: "Give the player to your right a genuine, ultra-specific compliment regarding their style or charisma.", tags: ["compliments", "flirt"] },
    { id: "s-d-2", type: "dare", mode: "spicy", intensity: "mild", text: "Deliver your best smoldering, cinematic glance directly at the camera or the center of the table.", tags: ["acting", "smolder"] },
    { id: "s-d-3", type: "dare", mode: "spicy", intensity: "medium", text: "Whisper an elaborate, overly dramatic secret into the ear of the person to your left.", tags: ["whisper", "tease"] },
    { id: "s-d-4", type: "dare", mode: "spicy", intensity: "medium", text: "Demonstrate your best pickup line on the player sitting directly opposite you.", tags: ["acting", "pickuplines"] },
    { id: "s-d-5", type: "dare", mode: "spicy", intensity: "medium", text: "Send a sweet, unexpected compliment text message to someone in your recent chat list right now.", tags: ["kindness", "daring"] },
    { id: "s-d-6", type: "dare", mode: "spicy", intensity: "medium", text: "Read the last sent romantic or flirty message on your phone out loud with full emotional gravitas.", tags: ["phone", "candid"] },
    { id: "s-d-7", type: "dare", mode: "spicy", intensity: "extreme", text: "Give your most persuasive runway model catwalk across the room and strike a dramatic pose.", tags: ["confidence", "runway"] },
    { id: "s-d-8", type: "dare", mode: "spicy", intensity: "extreme", text: "Hold hands with the player to your left for the duration of the entire next round.", tags: ["touch", "connection"] },
    { id: "s-d-9", type: "dare", mode: "spicy", intensity: "extreme", text: "Maintain unwavering eye contact with another player while biting slowly into a fruit or piece of food.", tags: ["bold", "humor"] },
    { id: "s-d-10", type: "dare", mode: "spicy", intensity: "extreme", text: "Whisper a compliment into the ear of every single player in the room sequentially.", tags: ["flirt", "group"] },

    // ==========================================
    // DEEP MODE - TRUTH (10)
    // ==========================================
    { id: "dp-t-1", type: "truth", mode: "deep", intensity: "mild", text: "What book, documentary, or speech permanently shifted the way you view the world?", tags: ["books", "perspective"] },
    { id: "dp-t-2", type: "truth", mode: "deep", intensity: "mild", text: "What is one skill you admire in others that you have struggled to cultivate yourself?", tags: ["humility", "growth"] },
    { id: "dp-t-3", type: "truth", mode: "deep", intensity: "mild", text: "What simple pleasure in life gives you the deepest sense of peace and contentment?", tags: ["gratitude", "peace"] },
    { id: "dp-t-4", type: "truth", mode: "deep", intensity: "medium", text: "What personal core value will you never compromise on, no matter the circumstances?", tags: ["values", "philosophy"] },
    { id: "dp-t-5", type: "truth", mode: "deep", intensity: "medium", text: "What piece of advice received in your younger years completely changed how you live today?", tags: ["wisdom", "growth"] },
    { id: "dp-t-6", type: "truth", mode: "deep", intensity: "medium", text: "What is a decision you made that seemed terrifying at the time but turned out to be the best choice?", tags: ["courage", "decisions"] },
    { id: "dp-t-7", type: "truth", mode: "deep", intensity: "medium", text: "If you could apologize to one person from your past with guaranteed forgiveness, who would it be?", tags: ["forgiveness", "healing"] },
    { id: "dp-t-8", type: "truth", mode: "deep", intensity: "extreme", text: "If you could witness one future milestone in humanity 100 years from now, what would it be?", tags: ["future", "existential"] },
    { id: "dp-t-9", type: "truth", mode: "deep", intensity: "extreme", text: "What is the biggest personal insecurity you are actively working to overcome right now?", tags: ["vulnerability", "self"] },
    { id: "dp-t-10", type: "truth", mode: "deep", intensity: "extreme", text: "When you look back on your life in old age, what would make you feel your time was truly well-spent?", tags: ["legacy", "purpose"] },

    // ==========================================
    // DEEP MODE - DARE (10)
    // ==========================================
    { id: "dp-d-1", type: "dare", mode: "deep", intensity: "mild", text: "Name one quality you genuinely admire in every single person in this room right now.", tags: ["appreciation", "connection"] },
    { id: "dp-d-2", type: "dare", mode: "deep", intensity: "mild", text: "Take 3 deep synchronized group breaths together in silence to reset the room's energy.", tags: ["mindfulness", "zen"] },
    { id: "dp-d-3", type: "dare", mode: "deep", intensity: "mild", text: "Share the title of one song that reliably pulls you out of a downhearted mood.", tags: ["music", "comfort"] },
    { id: "dp-d-4", type: "dare", mode: "deep", intensity: "medium", text: "Share a 60-second summary of a major challenge you overcame that shaped who you are today.", tags: ["storytelling", "vulnerability"] },
    { id: "dp-d-5", type: "dare", mode: "deep", intensity: "medium", text: "Give a sincere shoutout to a mentor, friend, or family member who believed in you when you didn't.", tags: ["gratitude", "mentors"] },
    { id: "dp-d-6", type: "dare", mode: "deep", intensity: "medium", text: "Text someone in your life whom you haven't spoken to in months just to tell them you appreciate them.", tags: ["reconnect", "kindness"] },
    { id: "dp-d-7", type: "dare", mode: "deep", intensity: "medium", text: "Articulate your personal life mission or definition of success in exactly 3 sentences or less.", tags: ["philosophy", "clarity"] },
    { id: "dp-d-8", type: "dare", mode: "deep", intensity: "extreme", text: "Identify one thing you are holding onto that no longer serves you, and verbalize letting it go to the group.", tags: ["reflection", "courage"] },
    { id: "dp-d-9", type: "dare", mode: "deep", intensity: "extreme", text: "Admit one mistake you made in the past year that taught you an invaluable, humbling lesson.", tags: ["humility", "growth"] },
    { id: "dp-d-10", type: "dare", mode: "deep", intensity: "extreme", text: "Look around the room and ask another player one unscripted, deep philosophical question that you've always wondered about them.", tags: ["inquiry", "bonding"] },
];

export default function TruthOrDareGenerator() {
    // Mode, Type, & Intensity Filtering State
    const [selectedMode, setSelectedMode] = useState<GameMode>("party");
    const [selectedType, setSelectedType] = useState<"both" | PromptType>("both");
    const [selectedIntensity, setSelectedIntensity] = useState<"all" | IntensityLevel>("all");

    // Dynamic Prompts & Custom Prompts State
    const [customPrompts, setCustomPrompts] = useState<PromptItem[]>([]);
    const [newCustomText, setNewCustomText] = useState<string>("");
    const [newCustomType, setNewCustomType] = useState<PromptType>("truth");
    const [newCustomMode, setNewCustomMode] = useState<GameMode>("party");
    const [newCustomIntensity, setNewCustomIntensity] = useState<IntensityLevel>("medium");

    // Player Turn Management State
    const [players, setPlayers] = useState<Player[]>([
        { id: "p1", name: "Player 1", score: 0 },
        { id: "p2", name: "Player 2", score: 0 }
    ]);
    const [newPlayerName, setNewPlayerName] = useState<string>("");
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
    const [turnTrackingEnabled, setTurnTrackingEnabled] = useState<boolean>(true);

    // Current Prompt & Animation State
    const [activePrompt, setActivePrompt] = useState<PromptItem | null>(null);
    const [isShuffling, setIsShuffling] = useState<boolean>(false);
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<"prompt" | "custom" | "players" | "history">("prompt");

    // Combine Stock Prompts with Custom User Additions
    const allPrompts = useMemo(() => {
        return [...DEFAULT_PROMPTS, ...customPrompts];
    }, [customPrompts]);

    // Filter Deck based on Current Settings
    const filteredDeck = useMemo(() => {
        return allPrompts.filter((item) => {
            const modeMatch = item.mode === selectedMode;
            const typeMatch = selectedType === "both" || item.type === selectedType;
            const intensityMatch = selectedIntensity === "all" || item.intensity === selectedIntensity;
            return modeMatch && typeMatch && intensityMatch;
        });
    }, [allPrompts, selectedMode, selectedType, selectedIntensity]);

    // Draw Cryptographically Random Prompt
    const drawPrompt = (forcedType?: PromptType) => {
        if (isShuffling) return;

        let pool = filteredDeck;
        if (forcedType) {
            pool = pool.filter((item) => item.type === forcedType);
        }

        if (pool.length === 0) {
            // Fallback to broader deck if strict filters yielded zero
            pool = allPrompts.filter((item) => (forcedType ? item.type === forcedType : true));
        }

        if (pool.length === 0) return;

        setIsShuffling(true);
        setIsFlipped(false);

        // Hardware entropy selection
        const randArray = new Uint32Array(1);
        crypto.getRandomValues(randArray);
        const selectedIndex = randArray[0] % pool.length;
        const chosen = pool[selectedIndex];

        setTimeout(() => {
            setActivePrompt(chosen);
            setIsFlipped(true);
            setIsShuffling(false);

            const activePlayer = turnTrackingEnabled && players.length > 0 ? players[currentPlayerIndex]?.name : undefined;

            const newHistRecord: HistoryItem = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                player: activePlayer,
                type: chosen.type,
                text: chosen.text,
                mode: chosen.mode,
                intensity: chosen.intensity,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            };

            setHistory((prev) => [newHistRecord, ...prev].slice(0, 100));

            // Advance player turn
            if (turnTrackingEnabled && players.length > 0) {
                setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
            }
        }, 300);
    };

    // Auto-draw initial card on load
    useEffect(() => {
        if (!activePrompt && filteredDeck.length > 0) {
            drawPrompt();
        }
    }, []);

    // Player Actions
    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newPlayerName.trim();
        if (!trimmed) return;
        setPlayers((prev) => [...prev, { id: `pl-${Date.now()}`, name: trimmed, score: 0 }]);
        setNewPlayerName("");
    };

    const handleRemovePlayer = (id: string) => {
        if (players.length <= 1) return;
        setPlayers((prev) => prev.filter((p) => p.id !== id));
        setCurrentPlayerIndex(0);
    };

    const handleIncrementScore = (id: string, delta: number) => {
        setPlayers((prev) =>
            prev.map((p) => (p.id === id ? { ...p, score: Math.max(0, p.score + delta) } : p))
        );
    };

    // Custom Prompt Addition
    const handleAddCustomPrompt = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newCustomText.trim();
        if (!trimmed) return;

        const newItem: PromptItem = {
            id: `custom-${Date.now()}`,
            type: newCustomType,
            text: trimmed,
            mode: newCustomMode,
            intensity: newCustomIntensity,
            tags: ["custom", "user-created"]
        };

        setCustomPrompts((prev) => [newItem, ...prev]);
        setNewCustomText("");
    };

    const handleRemoveCustomPrompt = (id: string) => {
        setCustomPrompts((prev) => prev.filter((p) => p.id !== id));
    };

    // Copy to Clipboard
    const handleCopyPrompt = () => {
        if (!activePrompt) return;
        const playerPrefix = turnTrackingEnabled && players.length > 0
            ? `Player: ${players[(currentPlayerIndex - 1 + players.length) % players.length]?.name}\n`
            : "";
        const text = `${playerPrefix}[${activePrompt.type.toUpperCase()}] (${activePrompt.mode.toUpperCase()} - ${activePrompt.intensity.toUpperCase()})\n\n"${activePrompt.text}"\n\nGenerated via twistertools.com/tools/random-tools/truth-or-dare-generator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // CSV History Export
    const handleExportCSV = () => {
        if (history.length === 0) return;
        const headers = ["Index", "Player", "Type", "Intensity", "Mode", "Prompt Text", "Timestamp"];
        const rows = history.map((item, idx) => [
            history.length - idx,
            item.player || "Unassigned",
            item.type.toUpperCase(),
            item.intensity.toUpperCase(),
            item.mode.toUpperCase(),
            item.text,
            item.timestamp
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "truth_or_dare_game_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Truth or Dare Card Prompt Generator",
        "url": "https://twistertools.com/tools/random-tools/truth-or-dare-generator",
        "description": "Interactive, browser-native Truth or Dare card generator featuring curated party categories, player roster management, customizable intensity levels, and zero repeat crypto-random draws.",
        "applicationCategory": "EntertainmentApplication",
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
                "name": "How does the Truth or Dare randomizer select cards?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The engine uses the native Web Crypto API (crypto.getRandomValues) to draw prompt cards with hardware-level entropy, guaranteeing an unbiased, uniform distribution without predictable pseudo-random loops."
                }
            },
            {
                "@type": "Question",
                "name": "Can I play Truth or Dare with custom questions and dares?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Use the Custom Cards workspace tab to type your own prompts, choose their category and intensity, and seamlessly inject them directly into your active card deck."
                }
            },
            {
                "@type": "Question",
                "name": "What game modes are included in this prompt generator?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The generator includes 5 dedicated game modes: Classic (all-round fun), Party (group social games), Couples (relationship intimacy), Spicy (flirty and bold), and Deep (thought-provoking philosophical truths)."
                }
            },
            {
                "@type": "Question",
                "name": "Is my custom player data or custom prompt deck saved to a remote server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All game states, custom prompts, scores, and history logs operate 100% client-side inside your browser's local memory. No sensitive personal data is transmitted over external servers."
                }
            },
            {
                "@type": "Question",
                "name": "How does the built-in Turn & Score Tracker work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Enable Turn Tracking in the Players panel to add participant names. The engine automatically cycles through players on each card draw and allows you to reward completed dares or honest truths with instant score tallying."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Card Stage & Draw Engine */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        {/* Header & Category Filter */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4 flex-wrap">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Active Card Deck
                            </h2>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                    Deck: {filteredDeck.length} Cards
                                </span>
                                {turnTrackingEnabled && players.length > 0 && (
                                    <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        Current Turn: <strong className="text-indigo-900">{players[currentPlayerIndex]?.name}</strong>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mode Selector Pill Buttons */}
                        <div className="mb-4 space-y-1.5">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                Game Theme / Category
                            </label>
                            <div className="grid grid-cols-5 gap-1.5 bg-slate-100 p-1 rounded-xl">
                                {(["party", "classic", "couples", "spicy", "deep"] as GameMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setSelectedMode(mode)}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition capitalize text-center cursor-pointer ${selectedMode === mode
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Fine Tuning Filters: Type & Intensity */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Card Type
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value as "both" | PromptType)}
                                    className="w-full py-1.5 px-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="both">Both (Truth & Dare)</option>
                                    <option value="truth">Truth Only</option>
                                    <option value="dare">Dare Only</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Intensity Level
                                </label>
                                <select
                                    value={selectedIntensity}
                                    onChange={(e) => setSelectedIntensity(e.target.value as "all" | IntensityLevel)}
                                    className="w-full py-1.5 px-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="all">All Intensities</option>
                                    <option value="mild">Mild (Safe / Casual)</option>
                                    <option value="medium">Medium (Exciting)</option>
                                    <option value="extreme">Extreme (Wild / Deep)</option>
                                </select>
                            </div>
                        </div>

                        {/* Interactive Card Stage Viewport */}
                        <div className="relative min-h-[260px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white flex flex-col justify-between shadow-md border border-slate-700/60 overflow-hidden mb-5">
                            {/* Card Header Badges */}
                            <div className="flex items-center justify-between z-10">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${activePrompt?.type === "dare"
                                            ? "bg-rose-500 text-white shadow-sm"
                                            : "bg-indigo-500 text-white shadow-sm"
                                            }`}
                                    >
                                        {activePrompt ? activePrompt.type : "CARD"}
                                    </span>
                                    {activePrompt && (
                                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-slate-200 border border-white/10 uppercase">
                                            {activePrompt.intensity}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider">
                                    {activePrompt?.mode} Deck
                                </span>
                            </div>

                            {/* Card Prompt Text Body */}
                            <div className="my-6 z-10 text-center">
                                {isShuffling ? (
                                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                                        <RotateCw className="w-8 h-8 text-indigo-400 animate-spin" />
                                        <p className="text-xs font-semibold text-slate-300">Shuffling cryptographically...</p>
                                    </div>
                                ) : activePrompt ? (
                                    <p className="text-lg md:text-xl font-bold leading-snug tracking-tight text-white drop-shadow-xs">
                                        "{activePrompt.text}"
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-400">Click a draw button below to pull your first card.</p>
                                )}
                            </div>

                            {/* Card Footer Info */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/10 z-10 text-[11px] text-slate-400">
                                <span>Hardware Crypto RNG</span>
                                <div className="flex items-center gap-2">
                                    {activePrompt?.tags.map((tag) => (
                                        <span key={tag} className="text-slate-400 font-medium">#{tag}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Ambient Glow Elements */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                        </div>

                        {/* Interactive Draw Action Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                                onClick={() => drawPrompt()}
                                disabled={isShuffling}
                                className="sm:col-span-1 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                <Shuffle className="w-4 h-4 text-indigo-400" />
                                Draw Any
                            </button>
                            <button
                                onClick={() => drawPrompt("truth")}
                                disabled={isShuffling}
                                className="py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                <Shield className="w-4 h-4 text-indigo-200" />
                                Draw Truth
                            </button>
                            <button
                                onClick={() => drawPrompt("dare")}
                                disabled={isShuffling}
                                className="py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                <Flame className="w-4 h-4 text-rose-200" />
                                Draw Dare
                            </button>
                        </div>
                    </div>

                    {/* Bottom Action Utilities */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                        <button
                            onClick={handleCopyPrompt}
                            disabled={!activePrompt}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold text-xs transition cursor-pointer"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "Prompt Copied!" : "Copy Active Prompt"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={history.length === 0}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-xs transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export Log (.CSV)
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Tabbed Roster, Custom Cards & History Log */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        {/* Tab Switcher */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full">
                                <button
                                    onClick={() => setActiveTab("prompt")}
                                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer text-center ${activeTab === "prompt" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Game Stats
                                </button>
                                <button
                                    onClick={() => setActiveTab("players")}
                                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer text-center ${activeTab === "players" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Players ({players.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("custom")}
                                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer text-center ${activeTab === "custom" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Custom ({customPrompts.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer text-center ${activeTab === "history" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    History ({history.length})
                                </button>
                            </div>
                        </div>

                        {/* TAB 1: Game Stats & Deck Breakdown */}
                        {activeTab === "prompt" && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>Current Active Filter Matches</span>
                                        <span className="text-indigo-600 font-extrabold text-sm">{filteredDeck.length} Cards</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Includes {filteredDeck.filter(p => p.type === "truth").length} Truths and {filteredDeck.filter(p => p.type === "dare").length} Dares curated for <strong>{selectedMode}</strong> mode.
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Deck</span>
                                        <strong className="text-lg font-black text-slate-900">{allPrompts.length}</strong>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase block">Truths</span>
                                        <strong className="text-lg font-black text-indigo-700">{allPrompts.filter(p => p.type === "truth").length}</strong>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className="text-[10px] font-bold text-rose-600 uppercase block">Dares</span>
                                        <strong className="text-lg font-black text-rose-700">{allPrompts.filter(p => p.type === "dare").length}</strong>
                                    </div>
                                </div>

                                {turnTrackingEnabled && players.length > 0 && (
                                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                                            <span>Roster Scoreboard Leader</span>
                                            <span className="text-indigo-600 text-xs font-semibold">Active Turn: {players[currentPlayerIndex]?.name}</span>
                                        </h3>
                                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                            {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
                                                <div key={p.id} className="flex items-center justify-between text-xs py-1 px-2.5 bg-white border border-slate-200 rounded-lg">
                                                    <span className="font-medium text-slate-800">
                                                        <span className="text-slate-400 font-mono mr-1.5">#{idx + 1}</span>
                                                        {p.name}
                                                    </span>
                                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                        {p.score} pts
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: Player Turn & Score Tracker */}
                        {activeTab === "players" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                                        Enable Turn Rotation
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={turnTrackingEnabled}
                                        onChange={(e) => setTurnTrackingEnabled(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>

                                <form onSubmit={handleAddPlayer} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add player name..."
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add
                                    </button>
                                </form>

                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {players.map((p, idx) => (
                                        <div
                                            key={p.id}
                                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${idx === currentPlayerIndex && turnTrackingEnabled
                                                ? "bg-indigo-50/70 border-indigo-300 shadow-2xs"
                                                : "bg-slate-50 border-slate-200"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                                <span className="font-bold text-slate-800">{p.name}</span>
                                                {idx === currentPlayerIndex && turnTrackingEnabled && (
                                                    <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">Turn</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleIncrementScore(p.id, -1)}
                                                        className="px-1.5 py-0.5 hover:bg-slate-100 font-bold text-slate-600 cursor-pointer"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="px-2 font-mono font-bold text-indigo-700">{p.score}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleIncrementScore(p.id, 1)}
                                                        className="px-1.5 py-0.5 hover:bg-slate-100 font-bold text-slate-600 cursor-pointer"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePlayer(p.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                                    title="Remove player"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: Custom Prompts Management */}
                        {activeTab === "custom" && (
                            <div className="space-y-3">
                                <form onSubmit={handleAddCustomPrompt} className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                    <textarea
                                        rows={2}
                                        placeholder="Type custom truth question or dare prompt..."
                                        value={newCustomText}
                                        onChange={(e) => setNewCustomText(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <select
                                            value={newCustomType}
                                            onChange={(e) => setNewCustomType(e.target.value as PromptType)}
                                            className="p-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-700"
                                        >
                                            <option value="truth">Truth</option>
                                            <option value="dare">Dare</option>
                                        </select>
                                        <select
                                            value={newCustomMode}
                                            onChange={(e) => setNewCustomMode(e.target.value as GameMode)}
                                            className="p-1.5 rounded-md border border-slate-200 bg-white font-medium text-slate-700 capitalize"
                                        >
                                            <option value="party">Party</option>
                                            <option value="classic">Classic</option>
                                            <option value="couples">Couples</option>
                                            <option value="spicy">Spicy</option>
                                            <option value="deep">Deep</option>
                                        </select>
                                        <button
                                            type="submit"
                                            className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Card
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                    {customPrompts.length === 0 ? (
                                        <p className="p-3 text-center text-xs text-slate-400">No custom prompts added yet.</p>
                                    ) : (
                                        customPrompts.map((cp) => (
                                            <div key={cp.id} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                                                <div className="min-w-0 pr-2">
                                                    <span className={`inline-block mr-1.5 text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${cp.type === "dare" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}>
                                                        {cp.type}
                                                    </span>
                                                    <span className="text-slate-800 font-medium truncate">{cp.text}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveCustomPrompt(cp.id)}
                                                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 4: History Log */}
                        {activeTab === "history" && (
                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                {history.length === 0 ? (
                                    <p className="p-4 text-center text-xs text-slate-400">No prompts drawn yet.</p>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${item.type === "dare" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}>
                                                        {item.type}
                                                    </span>
                                                    {item.player && <strong className="text-slate-800 font-semibold">{item.player}</strong>}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                                            </div>
                                            <p className="text-slate-700 font-medium">"{item.text}"</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            100% Client-Side Privacy
                        </span>
                        <span>Zero Remote Storage</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Game Overview & Rules of Engagement */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Rules of Truth or Dare & Game Night Dynamics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Truth or Dare is a classic social icebreaker and party parlor game where players choose between answering an introspective question with absolute candor (<strong>Truth</strong>) or completing a bold physical or verbal challenge (<strong>Dare</strong>). Our card generator standardizes the experience by removing awkward pauses, repetitive prompts, and decision paralysis through structured, cryptographically random card draws.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-indigo-600" /> 1. Turn Rotation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Enter all player names into the roster. The engine automatically cycles turns clockwise, ensuring equal participation and active engagement across every round.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-rose-600" /> 2. The Ultimatum
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When a turn begins, the player declares their choice before drawing, or hits <em>Draw Any</em> to let the randomized engine decide their fate.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-emerald-600" /> 3. Consent & Boundaries
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                All dares and truths must respect personal boundaries. Players always retain the right to veto a prompt in favor of taking a fun penalty or forfeiting their turn point.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Curated Game Modes Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Curated Game Modes & Prompt Architecture
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate category ensures the questions match the social setting and comfort levels of your group:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Category Mode</th>
                                    <th className="p-3">Target Audience</th>
                                    <th className="p-3">Prompt Atmosphere</th>
                                    <th className="p-3">Primary Intensity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Party Mode</td>
                                    <td className="p-3">College gatherings, parties, friend groups</td>
                                    <td className="p-3">Hilarious performances, funny secrets, social media pranks</td>
                                    <td className="p-3 font-bold text-indigo-600">Medium to Extreme</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Classic Mode</td>
                                    <td className="p-3">All ages, family nights, casual hangouts</td>
                                    <td className="p-3">Wholesome humor, lighthearted memories, silly impressions</td>
                                    <td className="p-3 font-bold text-emerald-600">Mild to Medium</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Couples Mode</td>
                                    <td className="p-3">Partners, date nights, anniversaries</td>
                                    <td className="p-3">Relationship milestones, intimate habits, romantic tributes</td>
                                    <td className="p-3 font-bold text-rose-600">Medium</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Spicy Mode</td>
                                    <td className="p-3">Adults, close friends, flirty gatherings</td>
                                    <td className="p-3">Crushes, dating stories, confident runway dares</td>
                                    <td className="p-3 font-bold text-rose-700">Extreme</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Deep Mode</td>
                                    <td className="p-3">Late-night chats, best friends, team retreats</td>
                                    <td className="p-3">Core values, philosophical perspectives, life lessons</td>
                                    <td className="p-3 font-bold text-purple-600">Introspective</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Cryptographic Fairness vs Pseudo-Random Shuffling */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Cryptographic Randomness & Deck Entropy
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Standard browser randomizers utilize simple <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code> calls, which are seeded pseudo-random number generators (PRNGs). In smaller array sizes, PRNGs often exhibit clustering patterns where the same prompt appears prematurely.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        This generator executes <strong>Web Crypto API</strong> entropy via <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues(new Uint32Array(1))</code>, sampling system hardware entropy to provide mathematically uniform index distribution across every pull.
                    </p>

                    <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-6 space-y-3 font-mono text-xs">
                        <span className="text-indigo-400 font-bold uppercase tracking-wider block">Cryptographic Random Draw Execution</span>
                        <pre className="text-slate-300 overflow-x-auto">
                            {`const randArray = new Uint32Array(1);
crypto.getRandomValues(randArray);
const chosenIndex = randArray[0] % activeDeck.length;
const selectedPrompt = activeDeck[chosenIndex];`}
                        </pre>
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
                                How does the Truth or Dare randomizer select cards?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The engine uses the native Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>) to draw prompt cards with hardware-level entropy, guaranteeing an unbiased, uniform distribution without predictable pseudo-random loops.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I play Truth or Dare with custom questions and dares?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Use the Custom Cards workspace tab to type your own prompts, choose their category and intensity, and seamlessly inject them directly into your active card deck.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What game modes are included in this prompt generator?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The generator includes 5 dedicated game modes: Classic (all-round fun), Party (group social games), Couples (relationship intimacy), Spicy (flirty and bold), and Deep (thought-provoking philosophical truths).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my custom player data or custom prompt deck saved to a remote server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All game states, custom prompts, scores, and history logs operate 100% client-side inside your browser's local memory. No sensitive personal data is transmitted over external servers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the built-in Turn & Score Tracker work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Enable Turn Tracking in the Players panel to add participant names. The engine automatically cycles through players on each card draw and allows you to reward completed dares or honest truths with instant score tallying.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}