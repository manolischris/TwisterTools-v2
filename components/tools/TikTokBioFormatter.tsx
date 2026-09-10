"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Sliders,
    Sparkles,
    Copy,
    Check,
    Trash2,
    Plus,
    X,
    Smartphone,
    ShieldAlert,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Terminal,
    Link2,
    Compass,
    Tag,
    UserCheck,
    MousePointerClick,
    ShoppingBag,
    Music,
    ArrowUpRight,
    ExternalLink
} from "lucide-react";

interface CalloutItem {
    id: string;
    prefix: string;
    text: string;
}

const BIO_LIMIT = 80;

const SAMPLE_CONFIGURATIONS = {
    creator: {
        handle: "creator_daily",
        displayName: "Jordan Alex | Creator",
        hook: "Helping video creators scale without burnout",
        callouts: [
            { id: "c1", prefix: "FREE:", text: "Creator Kit & Presets" },
            { id: "c2", prefix: "JOIN:", text: "45K Creator Community" },
            { id: "c3", prefix: "WATCH:", text: "New Editing Masterclass" }
        ],
        ctaText: "Grab Free Assets Below",
        targetUrl: "creatorhub.io/assets",
        fontStyle: "clean"
    },
    ecommerce: {
        handle: "lumina_apparel",
        displayName: "Lumina Minimalist Wear",
        hook: "Sustainable street essentials made to last",
        callouts: [
            { id: "c1", prefix: "DROP:", text: "Autumn 2026 Restock Live" },
            { id: "c2", prefix: "SAVE:", text: "15% With Code TIKTOK15" },
            { id: "c3", prefix: "SHIP:", text: "Worldwide Free Over $60" }
        ],
        ctaText: "Shop The Restock Now",
        targetUrl: "shoplumina.store/new",
        fontStyle: "caps"
    },
    coaching: {
        handle: "coach_marcus",
        displayName: "Marcus Vance | High Flow Coach",
        hook: "Zero-fluff performance optimization for founders",
        callouts: [
            { id: "c1", prefix: "GUIDE:", text: "7-Day Energy Audit PDF" },
            { id: "c2", prefix: "BOOK:", text: "1-on-1 Strategy Sprint" },
            { id: "c3", prefix: "POD:", text: "Episode 112 Streaming Now" }
        ],
        ctaText: "Download The Free Audit",
        targetUrl: "marcusvance.com/audit",
        fontStyle: "bold"
    }
};

const BOLD_MAP: Record<string, string> = {
    a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶",
    j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿",
    s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇",
    A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜",
    J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥",
    S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗤",
    "0": "𝟬", "1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", "8": "𝟴", "9": "𝟵"
};

const SANS_BOLD_MAP: Record<string, string> = {
    a: "𝙖", b: "𝙗", c: "𝙘", d: "𝙙", e: "𝙚", f: "𝙛", g: "𝙜", h: "𝙝", i: "𝙞",
    j: "𝙟", k: "𝙠", l: "𝙡", m: "𝙢", n: "𝙣", o: "𝙤", p: "𝙥", q: "𝙦", r: "𝙧",
    s: "𝙨", t: "𝙩", u: "𝙪", v: "𝙫", w: "𝙬", x: "𝙭", y: "𝙮", z: "𝙯",
    A: "𝘼", B: "𝘽", C: "𝘾", D: "𝘿", E: "𝙀", F: "𝙁", G: "𝙂", H: "𝙃", I: "𝙄",
    J: "𝙅", K: "𝙆", L: "𝙇", M: "𝙈", N: "𝙉", O: "𝙊", P: "𝙋", Q: "𝙌", R: "𝙍",
    S: "𝙎", T: "𝙏", U: "𝙐", V: "𝙑", W: "𝙒", X: "𝙓", Y: "𝙔", Z: "𝙕",
    "0": "𝟬", "1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", "8": "𝟴", "9": "𝟵"
};

function applyCustomFont(text: string, style: string): string {
    if (style === "bold") {
        return text
            .split("")
            .map((char) => BOLD_MAP[char] || char)
            .join("");
    }
    if (style === "sans") {
        return text
            .split("")
            .map((char) => SANS_BOLD_MAP[char] || char)
            .join("");
    }
    if (style === "caps") {
        return text.toUpperCase();
    }
    return text;
}

export default function TikTokBioFormatter() {
    const [handle, setHandle] = useState<string>("creator_daily");
    const [displayName, setDisplayName] = useState<string>("Jordan Alex | Creator");
    const [hook, setHook] = useState<string>("Helping video creators scale without burnout");
    const [ctaText, setCtaText] = useState<string>("Grab Free Assets Below");
    const [targetUrl, setTargetUrl] = useState<string>("creatorhub.io/assets");
    const [fontStyle, setFontStyle] = useState<string>("clean");
    const [bulletStyle, setBulletStyle] = useState<string>("arrow");
    const [showUnderlineCta, setShowUnderlineCta] = useState<boolean>(true);
    const [callouts, setCallouts] = useState<CalloutItem[]>([
        { id: "c1", prefix: "FREE:", text: "Creator Kit & Presets" },
        { id: "c2", prefix: "JOIN:", text: "45K Creator Community" },
        { id: "c3", prefix: "WATCH:", text: "New Editing Masterclass" }
    ]);
    const [copiedBio, setCopiedBio] = useState<boolean>(false);
    const [copiedAll, setCopiedAll] = useState<boolean>(false);

    const handleInputId = useId();
    const displayNameId = useId();
    const hookInputId = useId();
    const ctaInputId = useId();
    const urlInputId = useId();
    const bulletSelectId = useId();
    const fontSelectId = useId();

    const bulletToken = useMemo(() => {
        switch (bulletStyle) {
            case "arrow":
                return "->";
            case "pointer":
                return ">>";
            case "dash":
                return "-";
            case "bullet":
                return "*";
            case "bracket":
                return "[+]";
            default:
                return "->";
        }
    }, [bulletStyle]);

    const formattedBioBody = useMemo(() => {
        const segments: string[] = [];

        if (hook.trim()) {
            segments.push(applyCustomFont(hook.trim(), fontStyle));
        }

        callouts.forEach((item) => {
            const cleanText = item.text.trim();
            const cleanPrefix = item.prefix.trim();
            if (cleanText || cleanPrefix) {
                const prefixPart = cleanPrefix ? `${cleanPrefix} ` : "";
                const row = `${bulletToken} ${prefixPart}${cleanText}`.trim();
                segments.push(applyCustomFont(row, fontStyle));
            }
        });

        if (ctaText.trim()) {
            const formattedCta = applyCustomFont(ctaText.trim(), fontStyle);
            const prefixCta = showUnderlineCta ? `v ${formattedCta} v` : formattedCta;
            segments.push(prefixCta);
        }

        return segments.join("\n");
    }, [hook, callouts, ctaText, fontStyle, bulletToken, showUnderlineCta]);

    const characterCount = formattedBioBody.length;
    const isOverLimit = characterCount > BIO_LIMIT;

    const fullExport = useMemo(() => {
        const cleanUrl = targetUrl.trim();
        const base = formattedBioBody;
        return cleanUrl ? `${base}\n${cleanUrl}` : base;
    }, [formattedBioBody, targetUrl]);

    const handleAddCallout = () => {
        if (callouts.length >= 4) return;
        const newId = `c_${Date.now()}`;
        setCallouts([...callouts, { id: newId, prefix: "NEW:", text: "Action Item Link" }]);
    };

    const handleRemoveCallout = (id: string) => {
        setCallouts(callouts.filter((item) => item.id !== id));
    };

    const handleUpdateCallout = (id: string, field: "prefix" | "text", val: string) => {
        setCallouts(
            callouts.map((item) => (item.id === id ? { ...item, [field]: val } : item))
        );
    };

    const handleCopyBioOnly = () => {
        if (!formattedBioBody) return;
        navigator.clipboard.writeText(formattedBioBody);
        setCopiedBio(true);
        setTimeout(() => setCopiedBio(false), 2000);
    };

    const handleCopyComplete = () => {
        if (!fullExport) return;
        navigator.clipboard.writeText(fullExport);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    const loadSample = (preset: "creator" | "ecommerce" | "coaching") => {
        const data = SAMPLE_CONFIGURATIONS[preset];
        setHandle(data.handle);
        setDisplayName(data.displayName);
        setHook(data.hook);
        setCallouts(data.callouts.map((c) => ({ ...c })));
        setCtaText(data.ctaText);
        setTargetUrl(data.targetUrl);
        setFontStyle(data.fontStyle);
    };

    const handleClear = () => {
        setHook("");
        setCallouts([]);
        setCtaText("");
        setTargetUrl("");
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "TikTok Bio Link & Multi-Callout Generator",
        "url": "https://twistertools.com/tools/social-tools/tiktok-bio-formatter",
        "description": "Optimize your 80-character TikTok bio with clean multi-callout links, high-converting CTAs, and a pixel-accurate mobile feed simulator.",
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
                "name": "What is the exact character limit for a TikTok bio?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "TikTok strictly caps bio descriptions at 80 characters. Any text, spaces, or unicode characters beyond this 80-character threshold are cut off or rejected by the TikTok mobile client."
                }
            },
            {
                "@type": "Question",
                "name": "How do creators fit multiple links or callouts into 80 characters?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Top creators structure their bio with concise anchor prefixes (such as FREE:, POD:, VIP:) paired with punchy 2-4 word benefits, directly funneling attention down to their designated website link field."
                }
            },
            {
                "@type": "Question",
                "name": "Why is the website link entered in a separate field on TikTok?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "TikTok provides a dedicated clickable Website field for Business accounts or accounts with over 1,000 followers. Links typed directly into the 80-character bio description remain non-clickable plain text."
                }
            },
            {
                "@type": "Question",
                "name": "Do unicode bold characters take up more space in the bio limit?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Mathematical and alphanumeric unicode symbols consume multiple bytes in UTF-8 encoding. While TikTok counts visual characters, certain mobile operating systems calculate byte limits differently, making clean standard text the safest choice for staying within bounds."
                }
            },
            {
                "@type": "Question",
                "name": "Is this tool completely free and client-side?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. TwisterTools executes entirely in your browser with zero data storage, tracking, or account requirements."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Asymmetrical 5/7 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Configuration Controls (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Bio Architecture
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => loadSample("creator")}
                                className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Creator
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("ecommerce")}
                                className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Brand
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("coaching")}
                                className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Coach
                            </button>
                        </div>
                    </div>

                    {/* Profile Metadata */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor={handleInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Username / Handle
                            </label>
                            <input
                                id={handleInputId}
                                type="text"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value)}
                                aria-label="TikTok Handle"
                                placeholder="username"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor={displayNameId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Display Name
                            </label>
                            <input
                                id={displayNameId}
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                aria-label="TikTok Display Name"
                                placeholder="Brand or Full Name"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Value Hook */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor={hookInputId} className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Step 1: Headline Hook
                            </label>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {hook.length} chars
                            </span>
                        </div>
                        <input
                            id={hookInputId}
                            type="text"
                            value={hook}
                            onChange={(e) => setHook(e.target.value)}
                            aria-label="Headline Hook"
                            placeholder="e.g., Helping video creators scale without burnout"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>

                    {/* Multi-Callout Bullets */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Step 2: Multi-Callouts (Max 4)
                            </label>
                            <button
                                type="button"
                                onClick={handleAddCallout}
                                disabled={callouts.length >= 4}
                                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 disabled:opacity-40 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Row
                            </button>
                        </div>

                        <div className="space-y-2">
                            {callouts.map((item, idx) => (
                                <div key={item.id} className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-4">
                                        {idx + 1}.
                                    </span>
                                    <input
                                        type="text"
                                        value={item.prefix}
                                        onChange={(e) => handleUpdateCallout(item.id, "prefix", e.target.value)}
                                        aria-label={`Callout prefix ${idx + 1}`}
                                        placeholder="PREFIX:"
                                        className="w-20 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 uppercase"
                                    />
                                    <input
                                        type="text"
                                        value={item.text}
                                        onChange={(e) => handleUpdateCallout(item.id, "text", e.target.value)}
                                        aria-label={`Callout description ${idx + 1}`}
                                        placeholder="Offer, community, or asset title"
                                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCallout(item.id)}
                                        aria-label={`Remove callout ${idx + 1}`}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {callouts.length === 0 && (
                                <p className="text-xs text-slate-500 italic py-2">
                                    No callout rows configured. Click &quot;Add Row&quot; above to introduce bulleted highlights.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Step 3: Link & CTA Directives */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1.5">
                            <label htmlFor={ctaInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Step 3: Call-To-Action Directive
                            </label>
                            <input
                                id={ctaInputId}
                                type="text"
                                value={ctaText}
                                onChange={(e) => setCtaText(e.target.value)}
                                aria-label="CTA Directive"
                                placeholder="e.g., Grab Free Assets Below"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor={urlInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Target Bio Link Destination (TikTok Link Field)
                            </label>
                            <div className="relative">
                                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                    id={urlInputId}
                                    type="text"
                                    value={targetUrl}
                                    onChange={(e) => setTargetUrl(e.target.value)}
                                    aria-label="Target Bio Link URL"
                                    placeholder="creatorhub.io/assets"
                                    className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Style Configuration Options */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1.5">
                            <label htmlFor={bulletSelectId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Bullet Marker
                            </label>
                            <select
                                id={bulletSelectId}
                                value={bulletStyle}
                                onChange={(e) => setBulletStyle(e.target.value)}
                                aria-label="Bullet Marker Style"
                                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                            >
                                <option value="arrow">Arrow ( -&gt; )</option>
                                <option value="pointer">Double Chevrons ( &gt;&gt; )</option>
                                <option value="dash">Hyphen Dash ( - )</option>
                                <option value="bullet">Clean Asterisk ( * )</option>
                                <option value="bracket">System Bracket ( [+] )</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor={fontSelectId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Font Accent
                            </label>
                            <select
                                id={fontSelectId}
                                value={fontStyle}
                                onChange={(e) => setFontStyle(e.target.value)}
                                aria-label="Font Accent Style"
                                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                            >
                                <option value="clean">Standard Clean (Recommended)</option>
                                <option value="bold">Unicode Math Bold</option>
                                <option value="sans">Unicode Sans Italic</option>
                                <option value="caps">All Uppercase</option>
                            </select>
                        </div>
                    </div>

                    {/* Underline Indicator Toggle */}
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showUnderlineCta}
                            onChange={(e) => setShowUnderlineCta(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                        />
                        <span>Enclose CTA in directional arrows (v CTA v)</span>
                    </label>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => loadSample("creator")}
                            className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Reload Preset
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Reset
                        </button>
                    </div>
                </div>

                {/* Preview & Feed Simulator (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0 lg:sticky lg:top-6 self-start">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                TikTok Live Feed Profile Mockup
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                80 Chars Max
                            </span>
                        </div>

                        {/* Pixel-Accurate TikTok Profile Mockup */}
                        <div className="border border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-950 text-white overflow-hidden shadow-md max-w-md mx-auto">
                            {/* Top System Bar */}
                            <div className="px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-bold text-slate-400">
                                <span>9:41</span>
                                <div className="flex items-center gap-1.5">
                                    <span>5G</span>
                                    <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-[1px]">
                                        <div className="w-full h-full bg-white rounded-xs" />
                                    </div>
                                </div>
                            </div>

                            {/* TikTok Profile Header */}
                            <div className="px-5 pt-2 pb-4 text-center space-y-3">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                                    <Compass className="w-5 h-5 text-slate-400" />
                                    <span className="font-bold text-sm tracking-tight text-white">
                                        @{handle || "your_handle"}
                                    </span>
                                    <span className="font-bold text-lg leading-none cursor-pointer">...</span>
                                </div>

                                {/* Avatar */}
                                <div className="flex flex-col items-center justify-center pt-1">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-600 to-rose-500 p-0.5 shadow-lg">
                                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-950">
                                            <span className="text-xl font-black text-white">TT</span>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-white mt-2">
                                        {displayName || "Your Display Name"}
                                    </h3>
                                </div>

                                {/* Stats Bar */}
                                <div className="flex justify-center items-center gap-6 text-center pt-1">
                                    <div>
                                        <p className="text-sm font-bold text-white">124</p>
                                        <p className="text-[10px] text-slate-400">Following</p>
                                    </div>
                                    <div className="h-6 w-[1px] bg-slate-800" />
                                    <div>
                                        <p className="text-sm font-bold text-white">84.2K</p>
                                        <p className="text-[10px] text-slate-400">Followers</p>
                                    </div>
                                    <div className="h-6 w-[1px] bg-slate-800" />
                                    <div>
                                        <p className="text-sm font-bold text-white">1.9M</p>
                                        <p className="text-[10px] text-slate-400">Likes</p>
                                    </div>
                                </div>

                                {/* Follow / Edit Profile Action Buttons */}
                                <div className="flex items-center justify-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        className="px-6 py-2 rounded-md bg-rose-600 font-bold text-xs text-white shadow-xs"
                                    >
                                        Follow
                                    </button>
                                    <button
                                        type="button"
                                        className="px-3 py-2 rounded-md bg-slate-800 font-semibold text-xs text-white border border-slate-700"
                                    >
                                        Message
                                    </button>
                                    <button
                                        type="button"
                                        className="p-2 rounded-md bg-slate-800 font-semibold text-xs text-white border border-slate-700"
                                    >
                                        <UserCheck className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Profile Bio Body (The Target Under Inspection) */}
                                <div className="pt-3 text-left space-y-2 border-t border-slate-900">
                                    <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-text font-sans">
                                        {formattedBioBody || (
                                            <span className="text-slate-500 italic">
                                                Your formatted TikTok bio will render here...
                                            </span>
                                        )}
                                    </div>

                                    {/* Dedicated Clickable Website Row */}
                                    {targetUrl.trim() && (
                                        <div className="pt-1 flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline">
                                            <Link2 className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{targetUrl.trim()}</span>
                                            <ArrowUpRight className="w-3 h-3 shrink-0" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Real-Time Limit Counter Alert */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3.5 rounded-xl border text-center space-y-0.5 ${isOverLimit
                                    ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                }`}>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Bio Characters
                                </span>
                                <p className={`text-xl font-bold font-mono ${isOverLimit ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                                    }`}>
                                    {characterCount} <span className="text-xs text-slate-600 dark:text-slate-300 font-normal">/ {BIO_LIMIT}</span>
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {isOverLimit ? (
                                        <span className="text-rose-600 font-semibold">{characterCount - BIO_LIMIT} chars over limit</span>
                                    ) : (
                                        <span className="text-emerald-600 font-semibold">{BIO_LIMIT - characterCount} chars remaining</span>
                                    )}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Callout Rows
                                </span>
                                <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {callouts.length} <span className="text-xs text-slate-600 dark:text-slate-300 font-normal">/ 4</span>
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Optimal vertical stack
                                </p>
                            </div>
                        </div>

                        {/* Copy Triggers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleCopyBioOnly}
                                disabled={!formattedBioBody}
                                className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copiedBio
                                        ? "bg-emerald-600 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    }`}
                            >
                                {copiedBio ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Bio Copied to Clipboard!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>Copy Bio Description Only</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleCopyComplete}
                                disabled={!fullExport}
                                className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition border flex items-center justify-center gap-2 cursor-pointer ${copiedAll
                                        ? "bg-emerald-500 text-white border-emerald-500"
                                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    }`}
                            >
                                {copiedAll ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Copied Bio + Link!</span>
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Copy Bio + Target Link</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Trademark Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
                </p>
            </div>

            {/* Below-The-Fold Comprehensive Editorial Cards */}
            <div className="space-y-6">
                {/* Card 1: The Anatomy of an 80-Character TikTok Bio */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Engineering of TikTok Bios: Maximizing the 80-Character Limit
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Unlike Instagram (150 characters) or Twitter/X (160 characters), TikTok imposes one of the most restrictive biography limits in modern social networking: exactly 80 UTF-8 characters. To establish credibility, communicate value, and guide profile visitors into marketing funnels, every character must serve an intentional purpose:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <MousePointerClick className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 1. The Curiosity Hook
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Dedicate 30 to 40 characters to answer who you help and what outcome they achieve. Vague statements like &ldquo;Creating vibes daily&rdquo; squander valuable screen real estate.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 2. Multi-Callout Anchors
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Use uppercase micro-tags such as <code className="font-mono text-indigo-600 dark:text-indigo-400">FREE:</code>, <code className="font-mono text-indigo-600 dark:text-indigo-400">POD:</code>, or <code className="font-mono text-indigo-600 dark:text-indigo-400">DISCOUNT:</code> to signpost high-value assets inside a compact vertical footprint.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 3. Direct Link Funneling
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                End your bio description with downward chevrons pointing directly at TikTok&apos;s clickable external link slot to maximize tap-through conversions.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Real-World Layout Comparison
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4 font-mono text-xs">
                            <div className="p-3 bg-slate-950 rounded-lg border border-rose-900/50 space-y-1">
                                <span className="text-rose-400 font-bold">Unformatted Bio (Low CTR)</span>
                                <p className="text-slate-400">
                                    &ldquo;Welcome to my profile! I post daily fitness videos and sell workout routines on my website link below.&rdquo;
                                </p>
                                <p className="text-rose-400 text-[11px] pt-1">
                                    96 characters (Exceeds limit by 16 chars; zero scannability)
                                </p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-emerald-900/50 space-y-1">
                                <span className="text-emerald-400 font-bold">TwisterTools Structured Bio (High CTR)</span>
                                <p className="text-slate-300">
                                    &ldquo;Lose fat without boring cardio<br />
                                    -&gt; FREE: 5-Day Meal Plan<br />
                                    v Grab Blueprint Below v&rdquo;
                                </p>
                                <p className="text-emerald-400 text-[11px] pt-1">
                                    74 characters (100% compliant; clear visual hierarchy)
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategy Comparison Matrix */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Architecture: TikTok Bio Formats
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Examine how different bio structures influence profile dwell time, brand perception, and external link clicks:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Bio Layout Model</th>
                                    <th className="p-3">Character Efficiency</th>
                                    <th className="p-3">Link Click-Through Rate</th>
                                    <th className="p-3">Skim Reading Speed</th>
                                    <th className="p-3">Suitability</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Hook + Multi-Callout Bullets</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Optimal (70-79 chars)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Highest (Direct CTA)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">&lt; 1.5 Seconds</td>
                                    <td className="p-3 font-semibold text-indigo-600">Creators, SaaS, E-com</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Paragraph Sentence Format</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Poor (Wastes spacing)</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Low (Unclear action)</td>
                                    <td className="p-3 text-amber-600">3.0+ Seconds</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Personal Casual Accounts</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Dense Hashtag Clutter</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">Extremely Inefficient</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">Lowest (Spam Signals)</td>
                                    <td className="p-3 text-rose-600">Unreadable</td>
                                    <td className="p-3 text-rose-600 font-bold">Not Recommended</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5 Proven Conversion Strategies */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Tactical Optimization: 5 Rules for High-Converting TikTok Profiles
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        When viewers tap your profile after a viral video, you have approximately two seconds to turn that attention into a follower or customer:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Separate Link from Bio Text:</strong> Always place your URL into TikTok&apos;s native &ldquo;Website&rdquo; field so it remains clickable on mobile.
                                </li>
                                <li>
                                    • <strong>Lead With the Offer:</strong> If you sell digital products or services, feature your primary lead magnet prominently in Callout 1.
                                </li>
                                <li>
                                    • <strong>Maintain High Contrast Formatting:</strong> Use clean text and standard bullet glyphs so your bio renders identically on iOS, Android, and desktop.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Pitfalls to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Typing Raw URLs in the 80-Char Field:</strong> TikTok does not hyperlink URLs inside the bio text, squandering up to 30 characters on unclickable text.
                                </li>
                                <li>
                                    • <strong>Excessive Unicode Font Conversion:</strong> Complex unicode font glyphs can fail screen-reader accessibility tests and render as broken question-mark boxes on older mobile devices.
                                </li>
                                <li>
                                    • <strong>No Direct CTA:</strong> Without directional text indicating where to tap, click-through rates drop noticeably.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Static FAQ Section */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the exact character limit for a TikTok bio?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                TikTok strictly caps bio descriptions at 80 characters. Any text, spaces, or unicode characters beyond this 80-character threshold are cut off or rejected by the TikTok mobile client.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do creators fit multiple links or callouts into 80 characters?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Top creators structure their bio with concise anchor prefixes (such as FREE:, POD:, VIP:) paired with punchy 2-4 word benefits, directly funneling attention down to their designated website link field.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why is the website link entered in a separate field on TikTok?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                TikTok provides a dedicated clickable Website field for Business accounts or accounts with over 1,000 followers. Links typed directly into the 80-character bio description remain non-clickable plain text.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Do unicode bold characters take up more space in the bio limit?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Mathematical and alphanumeric unicode symbols consume multiple bytes in UTF-8 encoding. While TikTok counts visual characters, certain mobile operating systems calculate byte limits differently, making clean standard text the safest choice for staying within bounds.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Is this tool completely free and client-side?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. TwisterTools executes entirely in your browser with zero data storage, tracking, or account requirements.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}