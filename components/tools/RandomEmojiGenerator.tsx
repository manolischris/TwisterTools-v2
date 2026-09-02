"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
    Smile,
    Sparkles,
    Copy,
    Check,
    RefreshCw,
    Download,
    Sliders,
    Layers,
    Shuffle,
    BookmarkPlus,
    Trash2,
    BookOpen,
    HelpCircle,
    Code,
    Cpu,
    Palette,
    FileText,
    MessageSquareQuote
} from "lucide-react";

type OutputFormat = "raw" | "unicode" | "html" | "json";
type Mode = "emoji" | "emoticon" | "hybrid";

interface SavedPalette {
    id: string;
    title: string;
    items: string[];
    timestamp: string;
}

// Universal Unicode emoji pool (broad OS compatibility across Windows, iOS, macOS, Android, Linux)
const EMOJI_POOLS = {
    smileys: [
        "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
        "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
        "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
        "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖",
        "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
        "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔",
        "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦",
        "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴",
        "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿",
        "👹", "👺", "🤡", "💩", "👻", "💀", "👽", "👾", "🤖", "🎃"
    ],
    gestures: [
        "👋", "🤚", "✋", "🖐", "🖖", "👌", "🤏", "✌", "🤞", "🤟",
        "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝", "👍", "👎",
        "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
        "✍", "💅", "🤳", "💪", "🦵", "🦶", "👂", "👃", "🧠", "👀",
        "👁", "👅", "👄", "💋", "👣", "👤", "👥", "🗣", "👶", "👧",
        "🧒", "👦", "👩", "🧑", "👨", "👵", "🧓", "👴", "👲", "👳‍♀️",
        "👳‍♂️", "🧕", "👮‍♀️", "👮‍♂️", "👷‍♀️", "👷‍♂️", "💂‍♀️", "💂‍♂️", "🕵️‍♀️", "🕵️‍♂️"
    ],
    animals: [
        "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
        "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒",
        "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇",
        "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜",
        "🦗", "🕷", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑",
        "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈",
        "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪",
        "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑",
        "🐐", "🦌", "🐕", "🐩", "🐈", "🐓", "🦃", "🦚", "🦜", "🦢"
    ],
    nature: [
        "🌵", "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "☘", "🍀", "🎍",
        "🎋", "🍃", "🍂", "🍁", "🍄", "🐚", "🌾", "💐", "🌷", "🌹",
        "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚",
        "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌎",
        "🌍", "🌏", "🪐", "💫", "⭐", "🌟", "✨", "⚡", "☄", "💥",
        "🔥", "🌪", "🌈", "☀️", "🌤", "⛅", "🌥", "☁️", "🌦", "🌧",
        "⛈", "🌩", "🌨", "❄️", "☃️", "⛄", "🌬", "💨", "💧", "💦",
        "🫧", "☔", "☂️", "🌊", "🌫", "🌋", "🏔", "⛰", "🗻", "🏕"
    ],
    food: [
        "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈",
        "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦",
        "🥬", "🥒", "🌶", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐",
        "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇",
        "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🥙",
        "🌮", "🌯", "🥗", "🥘", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣",
        "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍢", "🥠", "🍥",
        "🍡", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧",
        "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "☕", "🍵", "🍶",
        "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🥤", "🧊"
    ],
    activities: [
        "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
        "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🏹",
        "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸", "🥌",
        "🎿", "⛷", "🏂", "🏋️‍♀️", "🏋️‍♂️", "🤼‍♀️", "🤼‍♂️", "🤸‍♀️", "🤸‍♂️", "🤺",
        "🧗‍♀️", "🧗‍♂️", "🚵‍♀️", "🚵‍♂️", "🚴‍♀️", "🚴‍♂️", "🏆", "🥇", "🥈", "🥉",
        "🏅", "🎖", "🎫", "🎟", "🎪", "🎭", "🎨", "🎬", "🎤", "🎧"
    ],
    travel: [
        "🚗", "🚕", "🚙", "🚌", "🚎", "🏎", "🚓", "🚑", "🚒", "🚐",
        "🛻", "🚚", "🚛", "🚜", "🛵", "🏍", "🛺", "🚲", "🛴", "🚨",
        "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞",
        "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊", "🚉", "🚁",
        "🛩", "✈️", "🛫", "🛬", "🪂", "🛰", "🚀", "🛸", "⛵", "🚤",
        "🛥", "🛳", "⛴", "🚢", "⚓", "🛟", "🗺", "🗿", "🗽", "🗼",
        "🏰", "🏯", "🏟", "🎡", "🎢", "🎠", "⛲", "🏖", "🏝", "🏜"
    ],
    objects: [
        "⌚", "📱", "📲", "💻", "⌨", "🖥", "🖨", "🖱", "🖲", "🕹",
        "🗜", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥",
        "📽", "🎞", "📞", "☎", "📟", "📠", "📺", "📻", "🎙", "🎚",
        "🎛", "⏱", "⏲", "⏰", "🕰", "⌛", "⏳", "📡", "🔋", "🪫",
        "🔌", "💡", "🔦", "🕯", "🪔", "🧯", "🛢", "💸", "💵", "💴",
        "💶", "💷", "🪙", "💳", "💎", "⚖", "🪜", "🧰", "🪛", "🔧",
        "🔨", "⚒", "🛠", "⛏", "🪚", "🔩", "⚙", "🧱", "⛓", "🧲",
        "🔫", "💣", "🧨", "🪓", "🔪", "🗡", "⚔", "🛡", "🗝", "🔑",
        "🔒", "🔓", "🔏", "🔐", "📦", "📫", "📬", "📮", "📪", "📫",
        "📜", "📄", "📰", "📑", "🔖", "🏷", "💰", "✉️", "📧", "📥"
    ],
    symbols: [
        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
        "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮",
        "✝", "☪", "🕉", "☸", "✡", "🔯", "🕎", "☯", "☦", "🛐",
        "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
        "♑", "♒", "♓", "🆔", "⚛", "☣", "☢", "⚠️", "🚸", "⛔",
        "🚫", "🚳", "🚭", "🚯", "🚱", "🚷", "🔞", "🛑", "⭕", "❌",
        "❎", "➕", "➖", "➗", "✖️", "♾", "‼️", "⁉️", "❓", "❕",
        "❗", "〰️", "💱", "💲", "〽️", "❇️", "✳️", "❎", "✅", "💤"
    ]
};

const KAOMOJI_POOLS = {
    happy: [
        "(・∀・)", "(^^)", "(*´ω｀*)", "(◕ᴗ◕✿)", "(◠‿◕)",
        "\\(^o^)/", "(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧", "(づ｡◕‿‿◕｡)づ", "(* ^ ω ^)",
        "(o´∀`o)", "(´｡• ᵕ •｡`)", "(￣▽￣)", "(⌒▽⌒)☆", "ヽ(>∀<☆)ノ"
    ],
    cute: [
        "(｡♥‿♥｡)", "(人*´∀｀)｡*ﾟ+", "(*˘︶˘*).｡.:*♡",
        "(♡˙︶˙♡)", "(´,,•ω•,,)♡", "(◕‿◕)♡", "(/^-^(^ ^*)/ ♡", "( ◡‿◡ *)"
    ],
    confused: [
        "(＠_＠;)", "(• ▽ •;)", "(^～^;)ゞ", "(・_・;)", "(・_・ヾ",
        "(￣_￣)・・・", "┐(‘～`;)┌", "¯\\(°_o)/¯", "(◎_◎;)", "╮(︶▽︶)╭"
    ],
    action: [
        "(╯°□°）╯︵ ┻━┻", "┬─┬ノ( º _ ºノ)", "(ง'̀-'́)ง", "(ง •̀_•́)ง",
        "୧( ˵ ° ~ ° ˵ )୨", "٩(ˊᗜˋ*)و", "ᕙ(⇀‸↼‶)ᕗ"
    ],
    shrug: [
        "¯\\_(ツ)_/¯", "¯\\(°_o)/¯", "┐( ˘_˘ )┌", "┐(´∀｀)┌", "╮(─▽─)╭",
        "ヽ(ー_ー )ノ", "┐(￣ヘ￣)┌", "¯\\_ʘ‿ʘ_/¯"
    ],
    sad: [
        "(-_-;)", "(｡•́︿•̀｡)", "(T_T)", "( ; ω ; )",
        "(｡╯︵╰｡)", "(ノ_<。)", "(╥﹏╥)", "(TДT)", "(-_-)"
    ]
};

// Explicit font fallback to guarantee color emoji rendering across every OS
const EMOJI_FONT_FAMILY = {
    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", "Android Emoji", "EmojiSymbols", sans-serif',
    fontVariantEmoji: "emoji" as const
};

export default function RandomEmojiGenerator() {
    const [mode, setMode] = useState<Mode>("emoji");
    const [count, setCount] = useState<number>(5);
    const [separator, setSeparator] = useState<string>("space");
    const [customSep, setCustomSep] = useState<string>("-");
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("raw");
    const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);

    const [categories, setCategories] = useState<{ [key: string]: boolean }>({
        smileys: true,
        gestures: true,
        animals: true,
        nature: true,
        food: true,
        activities: true,
        travel: true,
        objects: true,
        symbols: true
    });

    const [kaomojiCategories, setKaomojiCategories] = useState<{ [key: string]: boolean }>({
        happy: true,
        cute: true,
        confused: false,
        action: true,
        shrug: true,
        sad: false
    });

    const [generatedList, setGeneratedList] = useState<string[]>([]);
    const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
    const [copied, setCopied] = useState<boolean>(false);

    const activeSeparation = useMemo(() => {
        switch (separator) {
            case "none": return "";
            case "space": return " ";
            case "comma": return ", ";
            case "dash": return " - ";
            case "newline": return "\n";
            case "custom": return customSep;
            default: return " ";
        }
    }, [separator, customSep]);

    const activeEmojiUniverse = useMemo(() => {
        let pool: string[] = [];
        Object.entries(categories).forEach(([cat, isEnabled]) => {
            if (isEnabled && EMOJI_POOLS[cat as keyof typeof EMOJI_POOLS]) {
                pool = pool.concat(EMOJI_POOLS[cat as keyof typeof EMOJI_POOLS]);
            }
        });
        return pool.length > 0 ? pool : EMOJI_POOLS.smileys;
    }, [categories]);

    const activeKaomojiUniverse = useMemo(() => {
        let pool: string[] = [];
        Object.entries(kaomojiCategories).forEach(([cat, isEnabled]) => {
            if (isEnabled && KAOMOJI_POOLS[cat as keyof typeof KAOMOJI_POOLS]) {
                pool = pool.concat(KAOMOJI_POOLS[cat as keyof typeof KAOMOJI_POOLS]);
            }
        });
        return pool.length > 0 ? pool : KAOMOJI_POOLS.happy;
    }, [kaomojiCategories]);

    const getSecureRandomInt = (max: number): number => {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    };

    const handleGenerate = useCallback(() => {
        const results: string[] = [];
        const targetCount = Math.max(1, Math.min(count, 50));

        if (mode === "emoji") {
            const available = [...activeEmojiUniverse];
            for (let i = 0; i < targetCount; i++) {
                if (available.length === 0) break;
                const idx = getSecureRandomInt(available.length);
                results.push(available[idx]);
                if (!allowDuplicates) {
                    available.splice(idx, 1);
                }
            }
        } else if (mode === "emoticon") {
            const available = [...activeKaomojiUniverse];
            for (let i = 0; i < targetCount; i++) {
                if (available.length === 0) break;
                const idx = getSecureRandomInt(available.length);
                results.push(available[idx]);
                if (!allowDuplicates) {
                    available.splice(idx, 1);
                }
            }
        } else {
            const emojiCopy = [...activeEmojiUniverse];
            const kaoCopy = [...activeKaomojiUniverse];
            for (let i = 0; i < targetCount; i++) {
                const pickEmoji = getSecureRandomInt(2) === 0;
                if (pickEmoji && emojiCopy.length > 0) {
                    const idx = getSecureRandomInt(emojiCopy.length);
                    results.push(emojiCopy[idx]);
                    if (!allowDuplicates) emojiCopy.splice(idx, 1);
                } else if (kaoCopy.length > 0) {
                    const idx = getSecureRandomInt(kaoCopy.length);
                    results.push(kaoCopy[idx]);
                    if (!allowDuplicates) kaoCopy.splice(idx, 1);
                } else if (emojiCopy.length > 0) {
                    const idx = getSecureRandomInt(emojiCopy.length);
                    results.push(emojiCopy[idx]);
                }
            }
        }

        setGeneratedList(results);
    }, [mode, count, activeEmojiUniverse, activeKaomojiUniverse, allowDuplicates]);

    React.useEffect(() => {
        handleGenerate();
    }, []);

    const formattedOutput = useMemo(() => {
        if (generatedList.length === 0) return "";

        if (outputFormat === "raw") {
            return generatedList.join(activeSeparation);
        }

        if (outputFormat === "unicode") {
            return generatedList
                .map((item) => {
                    return Array.from(item)
                        .map((char) => `U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}`)
                        .join(" ");
                })
                .join(activeSeparation);
        }

        if (outputFormat === "html") {
            return generatedList
                .map((item) => {
                    return Array.from(item)
                        .map((char) => `&#x${char.codePointAt(0)?.toString(16).toUpperCase()};`)
                        .join("");
                })
                .join(activeSeparation);
        }

        if (outputFormat === "json") {
            return JSON.stringify(
                {
                    mode,
                    count: generatedList.length,
                    results: generatedList,
                    details: generatedList.map((item) => ({
                        character: item,
                        unicode: Array.from(item).map((c) => `U+${c.codePointAt(0)?.toString(16).toUpperCase()}`),
                        htmlEntity: Array.from(item).map((c) => `&#x${c.codePointAt(0)?.toString(16).toUpperCase()};`).join("")
                    }))
                },
                null,
                2
            );
        }

        return generatedList.join(activeSeparation);
    }, [generatedList, outputFormat, activeSeparation, mode]);

    const handleCopy = () => {
        if (!formattedOutput) return;
        navigator.clipboard.writeText(formattedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSavePalette = () => {
        if (generatedList.length === 0) return;
        const newPalette: SavedPalette = {
            id: Date.now().toString(),
            title: `Palette #${savedPalettes.length + 1} (${generatedList.slice(0, 3).join("")})`,
            items: [...generatedList],
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setSavedPalettes([newPalette, ...savedPalettes]);
    };

    const handleDeletePalette = (id: string) => {
        setSavedPalettes(savedPalettes.filter((p) => p.id !== id));
    };

    const handleExportTxt = () => {
        if (!formattedOutput) return;
        const blob = new Blob([formattedOutput], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `emoji_combinations_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const toggleEmojiCategory = (key: string) => {
        setCategories((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            const anyActive = Object.values(next).some((v) => v);
            return anyActive ? next : prev;
        });
    };

    const toggleKaomojiCategory = (key: string) => {
        setKaomojiCategories((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            const anyActive = Object.values(next).some((v) => v);
            return anyActive ? next : prev;
        });
    };

    const totalPossibleCombos = useMemo(() => {
        let poolSize = 0;
        if (mode === "emoji") poolSize = activeEmojiUniverse.length;
        else if (mode === "emoticon") poolSize = activeKaomojiUniverse.length;
        else poolSize = activeEmojiUniverse.length + activeKaomojiUniverse.length;

        if (poolSize === 0) return "0";
        if (allowDuplicates) {
            const val = Math.pow(poolSize, Math.min(count, 10));
            return val > 1e12 ? val.toExponential(3) : val.toLocaleString();
        } else {
            let permutations = 1;
            for (let i = 0; i < Math.min(count, poolSize); i++) {
                permutations *= (poolSize - i);
            }
            return permutations > 1e12 ? permutations.toExponential(3) : permutations.toLocaleString();
        }
    }, [mode, activeEmojiUniverse, activeKaomojiUniverse, allowDuplicates, count]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Emoji & Emoticon Combination Generator",
        "url": "https://twistertools.com/tools/random-tools/random-emoji-generator",
        "description": "Generate cryptographically randomized emoji strings, Japanese Kaomoji emoticons, and aesthetic text palettes with custom separators and Unicode exports.",
        "applicationCategory": "UtilityApplication",
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
                "name": "Why do some emojis appear as empty boxes or rectangles on my screen?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This occurs when a device lacks font support for newer Unicode revisions. To solve this, our generator utilizes a universal emoji font stack ('Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji') and enforces font-variant-emoji to guarantee crisp, native rendering across all operating systems."
                }
            },
            {
                "@type": "Question",
                "name": "How does the random generator pick emojis without predictable patterns?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The engine utilizes the browser Web Crypto API (crypto.getRandomValues). Unlike standard pseudo-random algorithms like Math.random(), cryptographic entropy sources sample unpredictable hardware noise, ensuring zero statistical autocorrelation across generated combinations."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Unicode Emojis and Kaomoji emoticons?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Unicode emojis are standardized pictorial glyphs maintained by the Unicode Consortium and rendered via device font files. Kaomoji are Japanese textual emoticons assembled from multi-byte Japanese scripts, symbols, and punctuation without requiring emoji font support."
                }
            },
            {
                "@type": "Question",
                "name": "Can I export emoji combinations in raw HTML code or Unicode hex format?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can switch between Raw Characters, Unicode Hex points (U+XXXX), HTML Hex entities (&#xXXXX;), or complete JSON objects for seamless integration into web apps, databases, or stylesheets."
                }
            },
            {
                "@type": "Question",
                "name": "How are combinatorial state spaces computed for emoji strings?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "If sampling with replacement is enabled, combinations equal N^k, where N is the pool size and k is the count. If duplicates are disabled, combinations follow permutations P(N, k) = N! / (N - k)!, quickly yielding billions of unique sequences."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Top Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Generator Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Generator Configuration
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                                Web Crypto RNG
                            </span>
                        </div>

                        {/* Mode Switcher */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Generator Engine Mode
                            </label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                                {(["emoji", "emoticon", "hybrid"] as Mode[]).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMode(m)}
                                        className={`py-2 px-3 text-xs font-bold rounded-lg transition capitalize cursor-pointer ${mode === m
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {m === "emoji" ? "Unicode Emoji" : m === "emoticon" ? "Kaomoji Emoticon" : "Hybrid Mix"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity and Separation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Quantity (1-50)
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600 font-mono">{count} Items</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={count}
                                    onChange={(e) => setCount(parseInt(e.target.value, 10))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                                <div className="flex items-center gap-2 pt-1">
                                    {[3, 5, 8, 12, 20].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setCount(preset)}
                                            className={`px-2 py-1 rounded text-[11px] font-bold border transition cursor-pointer ${count === preset
                                                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Item Separator
                                </label>
                                <select
                                    value={separator}
                                    onChange={(e) => setSeparator(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="none">None (Glued together)</option>
                                    <option value="space">Single Space (" ")</option>
                                    <option value="comma">Comma & Space (", ")</option>
                                    <option value="dash">Hyphen Dash (" - ")</option>
                                    <option value="newline">Line Break (\n)</option>
                                    <option value="custom">Custom String</option>
                                </select>
                                {separator === "custom" && (
                                    <input
                                        type="text"
                                        value={customSep}
                                        onChange={(e) => setCustomSep(e.target.value)}
                                        placeholder="Enter custom delimiter"
                                        className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Duplicates Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                            <div>
                                <span className="text-xs font-bold text-slate-800 block">Allow Repeating Characters</span>
                                <span className="text-[11px] text-slate-500">Allow duplicate icons in the generated sequence</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={allowDuplicates}
                                onChange={(e) => setAllowDuplicates(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            />
                        </div>

                        {/* Category Pool Filters */}
                        {(mode === "emoji" || mode === "hybrid") && (
                            <div className="space-y-2.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                    <span>Universal Emoji Categories</span>
                                    <span className="text-[11px] text-indigo-600 lowercase font-normal">
                                        {activeEmojiUniverse.length} icons available
                                    </span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(categories).map(([cat, isSelected]) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => toggleEmojiCategory(cat)}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer ${isSelected
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(mode === "emoticon" || mode === "hybrid") && (
                            <div className="space-y-2.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                    <span>Kaomoji Styles</span>
                                    <span className="text-[11px] text-indigo-600 lowercase font-normal">
                                        {activeKaomojiUniverse.length} styles available
                                    </span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(kaomojiCategories).map(([cat, isSelected]) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => toggleKaomojiCategory(cat)}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer ${isSelected
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Trigger Button */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            onClick={handleGenerate}
                            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Shuffle className="w-5 h-5" />
                            Generate Random Sequence
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Preview & Output Formats */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Palette className="w-5 h-5 text-indigo-600" />
                                Sequence Canvas & Export
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSavePalette}
                                    title="Save to temporary palette history"
                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
                                >
                                    <BookmarkPlus className="w-4 h-4 text-indigo-600" />
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    title="Reroll sequence"
                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
                                >
                                    <RefreshCw className="w-4 h-4 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Visual Display Screen with Explicit Cross-Platform Emoji Font Fallback */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[160px] text-center relative overflow-hidden">
                            <div
                                style={EMOJI_FONT_FAMILY}
                                className="text-3xl sm:text-4xl md:text-5xl tracking-wider break-words max-w-full select-all leading-normal"
                            >
                                {generatedList.length > 0 ? generatedList.join(activeSeparation) : "Click Generate"}
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-4">
                                {generatedList.length} Items Rendered • Universal Font Fallback Active
                            </span>
                        </div>

                        {/* Format Switching Bar */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Export Syntax Encoding
                            </label>
                            <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl text-center">
                                {(["raw", "unicode", "html", "json"] as OutputFormat[]).map((fmt) => (
                                    <button
                                        key={fmt}
                                        type="button"
                                        onClick={() => setOutputFormat(fmt)}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition uppercase cursor-pointer ${outputFormat === fmt
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Raw Code View Box */}
                        <div className="relative">
                            <textarea
                                readOnly
                                value={formattedOutput}
                                rows={outputFormat === "json" ? 6 : 3}
                                style={EMOJI_FONT_FAMILY}
                                className="w-full p-3 bg-slate-900 text-indigo-300 font-mono text-xs rounded-xl border border-slate-800 outline-none resize-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Saved Palettes Drawer */}
                        {savedPalettes.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Saved Custom Palettes ({savedPalettes.length})
                                </label>
                                <div className="max-h-[130px] overflow-y-auto space-y-1.5 pr-1">
                                    {savedPalettes.map((pal) => (
                                        <div
                                            key={pal.id}
                                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                                        >
                                            <div className="truncate mr-2" style={EMOJI_FONT_FAMILY}>
                                                <span className="font-bold text-slate-800 mr-2">{pal.items.join(" ")}</span>
                                                <span className="text-[10px] text-slate-400">({pal.timestamp})</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(pal.items.join(activeSeparation))}
                                                    className="p-1 text-slate-500 hover:text-indigo-600"
                                                    title="Copy palette"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePalette(pal.id)}
                                                    className="p-1 text-slate-500 hover:text-rose-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy to Clipboard"}
                        </button>
                        <button
                            onClick={handleExportTxt}
                            disabled={generatedList.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export .TXT
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Combinatorics & Permutation Mathematics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Combinatorial Mathematics: Calculating Emoji Permutation Spaces
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Generating sequences from discrete symbol pools is governed by discrete combinatorial formulas. Depending on whether characters are sampled with or without replacement, the total number of distinct observable sequences varies exponentially.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Sampling With Replacement (Duplicates Allowed)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When any symbol in pool size $N$ can appear multiple times across sequence length $k$, the total number of permutations $S$ is expressed as:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                S = N^k
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" /> Sampling Without Replacement (Unique Icons)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When each symbol can appear at most once, the sample space collapses via $k$-permutations of $N$:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                P(N, k) = N! / (N - k)!
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Real-Time Configuration State Space
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Under your current parameters ({count} items selected across your active library), the absolute theoretical combination volume is:
                        </p>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-indigo-300 font-mono text-sm">
                            {totalPossibleCombos} Unique Variations
                        </div>
                    </div>
                </section>

                {/* Card 2: Permutation Scale Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Permutation Complexity Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate how quickly state spaces expand, the table below highlights distinct combinations achievable from an active pool of 350 emojis at varying sequence lengths:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Sequence Length ($k$)</th>
                                    <th className="p-3">With Duplicates ($350^k$)</th>
                                    <th className="p-3">Without Duplicates ($P(350, k)$)</th>
                                    <th className="p-3">Entropy Equivalent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 Item</td>
                                    <td className="p-3 font-mono">350</td>
                                    <td className="p-3 font-mono">350</td>
                                    <td className="p-3 text-indigo-600 font-bold">8.45 bits</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2 Items</td>
                                    <td className="p-3 font-mono">122,500</td>
                                    <td className="p-3 font-mono">122,150</td>
                                    <td className="p-3 text-indigo-600 font-bold">16.90 bits</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3 Items</td>
                                    <td className="p-3 font-mono">42,875,000</td>
                                    <td className="p-3 font-mono">42,508,200</td>
                                    <td className="p-3 text-indigo-600 font-bold">25.35 bits</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">5 Items</td>
                                    <td className="p-3 font-mono">5.25 × 10¹²</td>
                                    <td className="p-3 font-mono">5.10 × 10¹²</td>
                                    <td className="p-3 text-indigo-600 font-bold">42.26 bits</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-slate-900">8 Items</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">2.25 × 10²⁰</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">2.08 × 10²⁰</td>
                                    <td className="p-3 text-indigo-600 font-bold">67.61 bits</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Unicode Standard & Multi-Byte UTF Encoding */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Unicode Specifications, UTF-8 Surrogate Pairs, & ZWJ Sequences
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unlike regular ASCII characters that fit within a single 7-bit byte, modern emojis inhabit Unicode Plane 1 (Supplementary Multilingual Plane, U+10000 through U+1FFFF). In UTF-16 environments (such as JavaScript strings), high-code-point emojis require 16-bit surrogate pairs.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Surrogate Pairs</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                In JavaScript, <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">"😀".length</code> returns 2 because it consists of a high surrogate (<code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">\uD83D</code>) and a low surrogate (<code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">\uDE00</code>).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Zero Width Joiners (ZWJ)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Compound emojis link multiple Unicode glyphs using invisible ZWJ characters (<code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">U+200D</code>) into a single cohesive visual icon.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Variation Selectors</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Codepoint <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">U+FE0F</code> (VS16) explicitly forces host rendering engines to display a textual symbol as a colored graphic emoji rather than black-and-white line art.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Use Cases & Application Domains */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Applications: Creative Writing, UI Design, & Testing
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Random emoji and Kaomoji generation serves high-utility workflows across modern software engineering, branding, and content creation:
                    </p>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                            <strong className="text-slate-900 block text-sm">Social Copywriting</strong>
                            <p className="text-slate-600">Break up visual fatigue in newsletters, TikTok captions, Discord servers, and Instagram bios.</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                            <strong className="text-slate-900 block text-sm">Stress Testing & QA</strong>
                            <p className="text-slate-600">Verify database UTF-8mb4 collation compliance and test input fields against 4-byte astral characters.</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                            <strong className="text-slate-900 block text-sm">Aesthetic Moodboards</strong>
                            <p className="text-slate-600">Discover unexpected icon pairings for graphic design projects, sticker sheets, and brand palettes.</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                            <strong className="text-slate-900 block text-sm">Creative Writing Prompts</strong>
                            <p className="text-slate-600">Inspire flash-fiction narratives, storytelling games, and brainstorm prompts from spontaneous sequences.</p>
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
                                Why do some emojis appear as empty boxes or rectangles on my screen?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This occurs when a device lacks font support for newer Unicode revisions. To solve this, our generator utilizes a universal emoji font stack ('Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji') and enforces font-variant-emoji to guarantee crisp, native rendering across all operating systems.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the random generator pick emojis without predictable patterns?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The engine utilizes the browser Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>). Unlike standard pseudo-random number engines like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code>, cryptographic entropy sources sample unpredictable hardware noise, ensuring zero statistical autocorrelation across generated combinations.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Unicode Emojis and Kaomoji emoticons?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Unicode emojis are standardized pictorial glyphs maintained by the Unicode Consortium and rendered via device font files (e.g., Apple Color Emoji, Noto Color Emoji). Kaomoji are Japanese textual emoticons assembled from multi-byte Japanese scripts, symbols, and punctuation without requiring emoji font support.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I export emoji combinations in raw HTML code or Unicode hex format?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can switch between Raw Characters, Unicode Hex points (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">U+XXXX</code>), HTML Hex entities (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&#x26;#xXXXX;</code>), or complete JSON objects for seamless integration into web apps, databases, or stylesheets.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are combinatorial state spaces computed for emoji strings?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"If sampling with replacement is enabled, combinations equal $N^k$, where $N$ is the pool size and $k$ is the count. If duplicates are disabled, combinations follow permutations $P(N, k) = \\frac{N!}{(N - k)!}$, quickly yielding billions of unique sequences."}
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}