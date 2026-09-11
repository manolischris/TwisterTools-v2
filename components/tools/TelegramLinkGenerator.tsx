"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Send,
    Copy,
    Check,
    ExternalLink,
    QrCode,
    Sliders,
    HelpCircle,
    BookOpen,
    ShieldAlert,
    Trash2,
    Sparkles,
    Smartphone,
    Layers,
    Share2,
    MessageSquare,
    Bot,
    UserCheck,
    Radio,
    FileCode,
    CheckCircle2,
    AlertCircle,
    Info
} from "lucide-react";

type LinkType = "direct_chat" | "bot_start" | "channel_group" | "share_text" | "phone_number";

interface TypeConfig {
    label: string;
    description: string;
    icon: React.ElementType;
    placeholderTarget: string;
    targetLabel: string;
}

const TYPE_CONFIGS: Record<LinkType, TypeConfig> = {
    direct_chat: {
        label: "Direct User / Creator",
        description: "Open chat directly with a specific user profile",
        icon: UserCheck,
        placeholderTarget: "durov",
        targetLabel: "Telegram Username (without @)"
    },
    bot_start: {
        label: "Bot Deep-Link (Start Param)",
        description: "Trigger a Telegram bot with dynamic /start parameters",
        icon: Bot,
        placeholderTarget: "PremiumBot",
        targetLabel: "Bot Username (without @)"
    },
    channel_group: {
        label: "Public Channel / Group",
        description: "Direct invitation link to a public community",
        icon: Radio,
        placeholderTarget: "telegram",
        targetLabel: "Channel / Group Username (without @)"
    },
    share_text: {
        label: "Universal Share Dialog",
        description: "Pre-fills message and URL into native Telegram forward picker",
        icon: Share2,
        placeholderTarget: "https://twistertools.com",
        targetLabel: "Shared Resource Web URL"
    },
    phone_number: {
        label: "International Phone Number",
        description: "Direct chat via E.164 phone number",
        icon: Smartphone,
        placeholderTarget: "+14155552671",
        targetLabel: "Full Phone Number (with country code)"
    }
};

const TEMPLATE_PRESETS = {
    support: {
        type: "direct_chat" as LinkType,
        target: "twister_support",
        startParam: "",
        message: "Hello Support Team! I have an inquiry regarding my TwisterTools account."
    },
    botAffiliate: {
        type: "bot_start" as LinkType,
        target: "TwisterMetricsBot",
        startParam: "ref_promo2026",
        message: ""
    },
    viralShare: {
        type: "share_text" as LinkType,
        target: "https://twistertools.com/tools/social-tools/telegram-link-generator",
        startParam: "",
        message: "Check out this free Telegram deep-link and pre-filled message generator!"
    }
};

export default function TelegramLinkGenerator() {
    const [linkType, setLinkType] = useState<LinkType>("direct_chat");
    const [target, setTarget] = useState<string>("twister_support");
    const [startParam, setStartParam] = useState<string>("");
    const [message, setMessage] = useState<string>("Hi! I would like more information about your platform.");
    const [useAppScheme, setUseAppScheme] = useState<boolean>(false);
    const [copiedLink, setCopiedLink] = useState<boolean>(false);
    const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
    const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);

    const targetInputId = useId();
    const startParamInputId = useId();
    const messageInputId = useId();

    const sanitizedTarget = useMemo(() => {
        let cleaned = target.trim();
        if (linkType === "phone_number") {
            return cleaned.replace(/[^\d+]/g, "");
        }
        if (linkType === "share_text") {
            return cleaned;
        }
        return cleaned.replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");
    }, [target, linkType]);

    const sanitizedStartParam = useMemo(() => {
        return startParam.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    }, [startParam]);

    const generatedLink = useMemo(() => {
        const encodedText = message ? encodeURIComponent(message) : "";
        const encodedUrl = linkType === "share_text" && sanitizedTarget ? encodeURIComponent(sanitizedTarget) : "";

        if (useAppScheme) {
            switch (linkType) {
                case "direct_chat":
                case "channel_group":
                    if (!sanitizedTarget) return "tg://resolve";
                    return encodedText
                        ? `tg://resolve?domain=${sanitizedTarget}&text=${encodedText}`
                        : `tg://resolve?domain=${sanitizedTarget}`;
                case "bot_start":
                    if (!sanitizedTarget) return "tg://resolve";
                    if (sanitizedStartParam) {
                        return `tg://resolve?domain=${sanitizedTarget}&start=${sanitizedStartParam}`;
                    }
                    return `tg://resolve?domain=${sanitizedTarget}`;
                case "share_text":
                    return `tg://msg_url?url=${encodedUrl}${encodedText ? `&text=${encodedText}` : ""}`;
                case "phone_number":
                    const cleanPhone = sanitizedTarget.replace(/\+/g, "");
                    return cleanPhone
                        ? `tg://resolve?phone=${cleanPhone}${encodedText ? `&text=${encodedText}` : ""}`
                        : "tg://resolve";
            }
        }

        switch (linkType) {
            case "direct_chat":
            case "channel_group":
                if (!sanitizedTarget) return "https://t.me/";
                return encodedText
                    ? `https://t.me/${sanitizedTarget}?text=${encodedText}`
                    : `https://t.me/${sanitizedTarget}`;
            case "bot_start":
                if (!sanitizedTarget) return "https://t.me/";
                if (sanitizedStartParam) {
                    return `https://t.me/${sanitizedTarget}?start=${sanitizedStartParam}`;
                }
                return `https://t.me/${sanitizedTarget}`;
            case "share_text":
                return `https://t.me/share/url?url=${encodedUrl}${encodedText ? `&text=${encodedText}` : ""}`;
            case "phone_number":
                const cleanPhone = sanitizedTarget.replace(/\+/g, "");
                return cleanPhone
                    ? `https://t.me/+${cleanPhone}${encodedText ? `?text=${encodedText}` : ""}`
                    : "https://t.me/";
        }
    }, [linkType, sanitizedTarget, sanitizedStartParam, message, useAppScheme]);

    const qrCodeUrl = useMemo(() => {
        if (!generatedLink) return "";
        return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(generatedLink)}`;
    }, [generatedLink]);

    const htmlSnippet = useMemo(() => {
        return `<a href="${generatedLink}" target="_blank" rel="noopener noreferrer">Contact us on Telegram</a>`;
    }, [generatedLink]);

    const markdownSnippet = useMemo(() => {
        return `[Contact us on Telegram](${generatedLink})`;
    }, [generatedLink]);

    const handleCopy = (text: string, type: "link" | "html" | "markdown") => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (type === "link") {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } else if (type === "html") {
            setCopiedHtml(true);
            setTimeout(() => setCopiedHtml(false), 2000);
        } else {
            setCopiedMarkdown(true);
            setTimeout(() => setCopiedMarkdown(false), 2000);
        }
    };

    const handleClear = () => {
        setTarget("");
        setStartParam("");
        setMessage("");
    };

    const loadPreset = (presetKey: keyof typeof TEMPLATE_PRESETS) => {
        const item = TEMPLATE_PRESETS[presetKey];
        setLinkType(item.type);
        setTarget(item.target);
        setStartParam(item.startParam);
        setMessage(item.message);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Telegram Deep-Link & Pre-Filled Message Generator",
        "url": "https://twistertools.com/tools/social-tools/telegram-link-generator",
        "description": "Generate custom t.me deep-links, bot launch parameters, universal share URLs, and pre-filled conversation messages with instant QR codes.",
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
                "name": "What is the difference between https://t.me/ and tg:// link formats?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The https://t.me/ domain is a universal web wrapper that opens a preview landing page in any browser before redirecting to the Telegram client. The tg:// URI scheme directly triggers the Telegram native desktop or mobile application without loading an intermediary web browser page."
                }
            },
            {
                "@type": "Question",
                "name": "How do pre-filled messages function when a user clicks my Telegram link?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When a target user clicks a link with a ?text= parameter, Telegram launches the designated conversation interface and automatically populates their input text box with your pre-defined message. The user retains full control and simply taps Send to deliver it."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Telegram bot start parameter and how is it tracked?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Telegram bots accept a ?start= parameter containing up to 64 alphanumeric characters. When clicked, Telegram passes this payload directly to your bot backend via the /start command, allowing developers to attribute referrals, track ad campaigns, and unlock specific onboard workflows."
                }
            },
            {
                "@type": "Question",
                "name": "Do I need to include the @ symbol when inputting a Telegram username?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Telegram t.me URLs use clean username strings without the @ symbol. This generator automatically strips leading @ characters and invalid punctuation to ensure your link syntax is valid."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use phone numbers instead of public usernames to generate direct chats?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Telegram supports international E.164 phone numbers using the https://t.me/+<phone> format. However, direct initiation via phone number requires the target user's privacy settings to allow phone number discovery by non-contacts."
                }
            },
            {
                "@type": "Question",
                "name": "Are the QR codes generated by TwisterTools dynamic or permanent?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The generated QR codes are 100% static and permanent. The encoded deep-link destination and message parameters are embedded directly into the QR matrix, meaning they will never expire and require no external redirection server."
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

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Parameters (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Link Configuration
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => loadPreset("support")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Support
                            </button>
                            <button
                                type="button"
                                onClick={() => loadPreset("botAffiliate")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Bot Ref
                            </button>
                            <button
                                type="button"
                                onClick={() => loadPreset("viralShare")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Target Channel or Action Type:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(Object.keys(TYPE_CONFIGS) as LinkType[]).map((typeKey) => {
                                const cfg = TYPE_CONFIGS[typeKey];
                                const IconComponent = cfg.icon;
                                const isSelected = linkType === typeKey;
                                return (
                                    <button
                                        key={typeKey}
                                        type="button"
                                        onClick={() => setLinkType(typeKey)}
                                        className={`p-3 rounded-xl border text-xs font-medium text-left transition cursor-pointer flex flex-col gap-1 ${isSelected
                                            ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                            }`}
                                    >
                                        <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                            <IconComponent className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                            {cfg.label}
                                        </span>
                                        <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                                            {cfg.description}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Target Input */}
                    <div className="space-y-1.5">
                        <label htmlFor={targetInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            {TYPE_CONFIGS[linkType].targetLabel}:
                        </label>
                        <div className="relative">
                            <input
                                id={targetInputId}
                                type={linkType === "share_text" ? "url" : "text"}
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                placeholder={TYPE_CONFIGS[linkType].placeholderTarget}
                                aria-label={TYPE_CONFIGS[linkType].targetLabel}
                                className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            {linkType === "phone_number"
                                ? "Use standard E.164 notation including country code (e.g. +14155552671)."
                                : linkType === "share_text"
                                    ? "The web address you want Telegram users to circulate."
                                    : "Leading @ symbols are automatically cleaned and removed."}
                        </p>
                    </div>

                    {/* Bot Deep-Link Parameter (Conditional) */}
                    {linkType === "bot_start" && (
                        <div className="space-y-1.5 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
                            <div className="flex items-center justify-between">
                                <label htmlFor={startParamInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Deep-Link Start Parameter:
                                </label>
                                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                                    {sanitizedStartParam.length}/64 chars
                                </span>
                            </div>
                            <input
                                id={startParamInputId}
                                type="text"
                                maxLength={64}
                                value={startParam}
                                onChange={(e) => setStartParam(e.target.value)}
                                placeholder="affiliate_998_campaign"
                                aria-label="Bot Start Parameter"
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                Transmitted as <code className="font-mono text-indigo-600 dark:text-indigo-400">/start [param]</code> payload to your bot server logic upon user entry.
                            </p>
                        </div>
                    )}

                    {/* Pre-filled Message Input */}
                    {linkType !== "bot_start" && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor={messageInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Pre-Filled Message Text (Optional):
                                </label>
                                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                    {message.length} chars
                                </span>
                            </div>
                            <textarea
                                id={messageInputId}
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write the draft message that should automatically appear in the user's message input box..."
                                aria-label="Pre-filled conversation message"
                                className="w-full p-3 text-xs sm:text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-y min-h-[100px]"
                            />
                        </div>
                    )}

                    {/* Protocol Selector Toggle */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Target URI Protocol:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setUseAppScheme(false)}
                                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer flex flex-col gap-0.5 ${!useAppScheme
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="font-bold text-slate-900 dark:text-white">Universal Web (t.me)</span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-300">Best for web pages, emails, & social</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setUseAppScheme(true)}
                                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer flex flex-col gap-0.5 ${useAppScheme
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="font-bold text-slate-900 dark:text-white">Native App (tg://)</span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-300">Direct app launch without web page</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Controls */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => loadPreset("support")}
                            className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Sample Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Clear All
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output, QR Generator & Mockup Simulation (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0">
                    {/* Primary Output & Deployment Options */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Generated Telegram Deep-Link
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Use
                            </span>
                        </div>

                        {/* Link Preview Box */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                Raw Clickable Destination:
                            </label>
                            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl">
                                <span className="font-mono text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 break-all select-all flex-1">
                                    {generatedLink}
                                </span>
                                <a
                                    href={generatedLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Test generated Telegram link in new tab"
                                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Primary Copy Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => handleCopy(generatedLink, "link")}
                                className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copiedLink
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                            >
                                {copiedLink ? (
                                    <>
                                        <Check className="w-4 h-4 text-white" />
                                        <span>Link Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 text-white" />
                                        <span>Copy Link</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleCopy(htmlSnippet, "html")}
                                className={`py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm border transition flex items-center justify-center gap-1.5 cursor-pointer ${copiedHtml
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200"
                                    }`}
                            >
                                {copiedHtml ? <Check className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                                <span>Copy HTML</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleCopy(markdownSnippet, "markdown")}
                                className={`py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm border transition flex items-center justify-center gap-1.5 cursor-pointer ${copiedMarkdown
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200"
                                    }`}
                            >
                                {copiedMarkdown ? <Check className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                <span>Copy Markdown</span>
                            </button>
                        </div>

                        {/* Interactive QR Code & Desktop Simulation Block */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 items-center">
                            {/* QR Code Matrix Display */}
                            <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-2.5">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    Permanent Scan QR
                                </span>
                                <div className="p-2 bg-white rounded-lg shadow-xs border border-slate-200">
                                    <img
                                        src={qrCodeUrl}
                                        alt="Telegram Deep-Link QR Code"
                                        width={160}
                                        height={160}
                                        className="w-36 h-36 object-contain"
                                        loading="lazy"
                                    />
                                </div>
                                <a
                                    href={qrCodeUrl}
                                    download="telegram-qr-code.png"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Download High-Res PNG
                                </a>
                            </div>

                            {/* Client Simulation Card */}
                            <div className="sm:col-span-7 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-xs">
                                <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                            <Send className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                                {sanitizedTarget ? `@${sanitizedTarget}` : "Telegram User"}
                                            </p>
                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">bot / active online</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        Preview
                                    </span>
                                </div>

                                <div className="p-4 space-y-3 min-h-[140px] flex flex-col justify-end bg-slate-100/50 dark:bg-slate-900/30">
                                    {linkType === "bot_start" && sanitizedStartParam && (
                                        <div className="self-center bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-[11px] font-mono px-3 py-1 rounded-full">
                                            /start {sanitizedStartParam}
                                        </div>
                                    )}

                                    {message && linkType !== "bot_start" && (
                                        <div className="self-end max-w-[85%] bg-indigo-600 text-white text-xs p-3 rounded-2xl rounded-br-none shadow-xs space-y-1">
                                            <p className="whitespace-pre-wrap leading-relaxed select-text">{message}</p>
                                            <div className="text-[9px] text-indigo-200 text-right">Drafted into message input</div>
                                        </div>
                                    )}

                                    {!message && linkType !== "bot_start" && (
                                        <div className="text-center text-slate-600 dark:text-slate-300 text-xs italic py-6">
                                            No draft text provided. The chat will open with a blank message input box.
                                        </div>
                                    )}
                                </div>

                                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                                    <span className="flex items-center gap-1.5">
                                        <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                        <span>Clicking automatically prepares this message</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mandatory Social Platform Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Telegram Deep-Linking Architecture */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Deep-Linking Mechanics: Understanding How Telegram Protocols Connect Users
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        In online customer acquisition and conversion optimization, reducing friction is the fundamental law of conversion. Traditional methods of connecting web visitors to Telegram require users to copy a handle, manually switch apps, paste the text into a search bar, and select the correct account from hundreds of lookalike impersonators. Deep-linking solves this by leveraging standard Uniform Resource Identifiers (URI) to automate the journey in a single click:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Universal t.me Gateways
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The official <code className="font-mono text-indigo-600 dark:text-indigo-400">https://t.me/</code> domain acts as a universal browser fallback. If the user has Telegram installed, the web page issues an app switch intent; if not, it provides web client access or App Store links.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Parametric Bot Attribution
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Using the <code className="font-mono text-indigo-600 dark:text-indigo-400">?start=[param]</code> query, marketing teams pass referral codes, UTM source parameters, or personalized session tokens directly into Telegram bot instances via the Bot API.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Pre-Filled User Prompts
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Passing UTF-8 percent-encoded strings via the <code className="font-mono text-indigo-600 dark:text-indigo-400">?text=</code> parameter instantly seeds the user&apos;s composition textarea with inquiries, ticket IDs, or discount claims.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Deep Link Protocol Comparison */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Protocol Comparison: HTTPS Web Routing vs. Native tg:// Custom URIs
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the correct protocol structure depends on your target deployment environment. Understanding when to implement universal URLs versus direct operating system custom URI handlers ensures seamless UX across mobile and desktop devices:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Link Format</th>
                                    <th className="p-3">Syntax Example</th>
                                    <th className="p-3">Operating Context</th>
                                    <th className="p-3">Fallback Behavior</th>
                                    <th className="p-3">Best Recommended Use</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Universal HTTPS</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">https://t.me/username?text=Hi</td>
                                    <td className="p-3">Websites, Newsletters, Social Profiles</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Loads browser preview page</td>
                                    <td className="p-3 font-bold text-emerald-600">Standard Web Links</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Native Application URI</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">tg://resolve?domain=username</td>
                                    <td className="p-3">Internal Mobile Apps, WebView Buttons</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Fails if app not installed</td>
                                    <td className="p-3 font-bold text-amber-600">Native In-App CTAs</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Universal Share Dialog</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">https://t.me/share/url?url=...</td>
                                    <td className="p-3">Blog Share Buttons, E-Commerce</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Prompts contact picker</td>
                                    <td className="p-3 font-bold text-indigo-600">Social Virality Tools</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">International Phone URL</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">https://t.me/+14155552671</td>
                                    <td className="p-3">Private Customer Support Desks</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Subject to privacy settings</td>
                                    <td className="p-3 font-bold text-slate-600">Direct Personal Contact</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5 Proven Strategies for Telegram Marketing */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Conversion Strategy: 5 Rules for Generating High-Engagement Telegram Links
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Constructing high-converting customer touchpoints requires careful structure of URLs and default messages. Follow these five industry-tested principles to increase click-throughs and conversations:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for Direct Conversion
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Draft Specific Openers:</strong> Avoid generic greetings like &ldquo;Hi&rdquo;. Seed customer inquiries with specific requests such as &ldquo;Hello, I would like to book a demo for the Enterprise Plan.&rdquo;
                                </li>
                                <li>
                                    • <strong>Encode Campaign Tags in Start Params:</strong> When deploying Telegram bots, assign unique alphanumeric strings (e.g. <code className="font-mono">fb_ad_summer26</code>) to distinguish high-performing channels.
                                </li>
                                <li>
                                    • <strong>Deploy Permanent QR Codes in Print:</strong> Static QR codes with pre-filled support messages on packaging, business cards, or event banners allow in-person audiences to open a conversation instantly.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600" /> Pitfalls That Disrupt Routing
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Including @ Symbols in Paths:</strong> Placing an &ldquo;@&rdquo; character inside <code className="font-mono">https://t.me/@handle</code> creates routing errors on older mobile clients. TwisterTools automatically strips this.
                                </li>
                                <li>
                                    • <strong>Unencoded Special Characters:</strong> Manually typing spaces or non-ASCII characters without proper URL percent-encoding corrupts deep-link strings across external applications.
                                </li>
                                <li>
                                    • <strong>Exceeding Bot Parameter Lengths:</strong> The Telegram Bot API strictly limits the <code className="font-mono">start</code> parameter payload to 64 bytes. Characters beyond this threshold will be truncated by Telegram servers.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
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
                                What is the difference between https://t.me/ and tg:// link formats?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The https://t.me/ domain is a universal web wrapper that opens a preview landing page in any browser before redirecting to the Telegram client. The tg:// URI scheme directly triggers the Telegram native desktop or mobile application without loading an intermediary web browser page.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do pre-filled messages function when a user clicks my Telegram link?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                When a target user clicks a link with a ?text= parameter, Telegram launches the designated conversation interface and automatically populates their input text box with your pre-defined message. The user retains full control and simply taps Send to deliver it.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the Telegram bot start parameter and how is it tracked?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Telegram bots accept a ?start= parameter containing up to 64 alphanumeric characters. When clicked, Telegram passes this payload directly to your bot backend via the /start command, allowing developers to attribute referrals, track ad campaigns, and unlock specific onboard workflows.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Do I need to include the @ symbol when inputting a Telegram username?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. Telegram t.me URLs use clean username strings without the @ symbol. This generator automatically strips leading @ characters and invalid punctuation to ensure your link syntax is valid.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I use phone numbers instead of public usernames to generate direct chats?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Telegram supports international E.164 phone numbers using the https://t.me/+&lt;phone&gt; format. However, direct initiation via phone number requires the target user&apos;s privacy settings to allow phone number discovery by non-contacts.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Are the QR codes generated by TwisterTools dynamic or permanent?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The generated QR codes are 100% static and permanent. The encoded deep-link destination and message parameters are embedded directly into the QR matrix, meaning they will never expire and require no external redirection server.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}