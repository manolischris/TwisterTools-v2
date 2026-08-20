"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Laptop,
    Globe,
    Cpu,
    ShieldAlert,
    Bot,
    CheckCircle2,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Search,
    BookOpen,
    HelpCircle,
    Layers,
    Terminal,
    Fingerprint,
    HardDrive,
    MonitorSmartphone,
    Share2,
    Info,
    CheckSquare,
    Square
} from "lucide-react";

interface ParsedUA {
    raw: string;
    browser: {
        name: string;
        version: string;
        major: string;
    };
    engine: {
        name: string;
        version: string;
    };
    os: {
        name: string;
        version: string;
        platform: string;
    };
    device: {
        type: "Desktop" | "Mobile" | "Tablet" | "Smart TV" | "Console" | "Wearable" | "Bot/Crawler" | "Unknown";
        vendor: string;
        model: string;
    };
    cpu: {
        architecture: string;
    };
    bot: {
        isBot: boolean;
        category?: string;
        details?: string;
    };
    tokens: string[];
}

interface PresetUA {
    label: string;
    category: string;
    ua: string;
}

const PRESET_USER_AGENTS: PresetUA[] = [
    {
        label: "Chrome 128 (macOS Sonoma)",
        category: "Desktop",
        ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    },
    {
        label: "Safari 17.5 (macOS Sonoma)",
        category: "Desktop",
        ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    },
    {
        label: "Firefox 130 (Windows 11)",
        category: "Desktop",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
    },
    {
        label: "Edge 128 (Windows 11)",
        category: "Desktop",
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.2739.42",
    },
    {
        label: "iPhone 15 Pro (iOS 17.5 / Safari)",
        category: "Mobile",
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    },
    {
        label: "Samsung Galaxy S24 (Android 14 / Chrome)",
        category: "Mobile",
        ua: "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36",
    },
    {
        label: "iPad Pro (iPadOS 17.5 / Safari)",
        category: "Tablet",
        ua: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    },
    {
        label: "Googlebot Desktop",
        category: "Bots & Crawlers",
        ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
    {
        label: "Googlebot Smartphone",
        category: "Bots & Crawlers",
        ua: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.137 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
    {
        label: "Bingbot Crawler",
        category: "Bots & Crawlers",
        ua: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    },
    {
        label: "GPTBot (OpenAI AI Scraping)",
        category: "AI & Crawlers",
        ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
    },
    {
        label: "ClaudeBot (Anthropic AI)",
        category: "AI & Crawlers",
        ua: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    },
    {
        label: "PerplexityBot (Perplexity AI)",
        category: "AI & Crawlers",
        ua: "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    },
    {
        label: "PlayStation 5 WebBrowser",
        category: "Gaming Consoles",
        ua: "Mozilla/5.0 (PlayStation; PlayStation 5/7.00) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    },
    {
        label: "Apple TV (tvOS 17)",
        category: "Smart TV",
        ua: "AppleTV11,1/11.1 AppleCoreMedia/1.0.0.19J580 (Apple TV; U; CPU OS 17_0 like Mac OS X; en_us)",
    },
];

function parseUserAgentString(ua: string): ParsedUA {
    const raw = ua.trim();
    if (!raw) {
        return {
            raw: "",
            browser: { name: "Unknown", version: "Unknown", major: "Unknown" },
            engine: { name: "Unknown", version: "Unknown" },
            os: { name: "Unknown", version: "Unknown", platform: "Unknown" },
            device: { type: "Unknown", vendor: "Unknown", model: "Unknown" },
            cpu: { architecture: "Unknown" },
            bot: { isBot: false },
            tokens: [],
        };
    }

    // Parse tokens (e.g. Mozilla/5.0, (Macintosh; ...), AppleWebKit/537.36, etc.)
    const tokens: string[] = [];
    const tokenRegex = /([^\s()]+|\([^)]+\))/g;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(raw)) !== null) {
        tokens.push(match[0]);
    }

    // Bot detection regexes
    const botPatterns = [
        { name: "Googlebot", pattern: /googlebot/i, category: "Search Engine Crawler", details: "Google indexing spider" },
        { name: "Bingbot", pattern: /bingbot/i, category: "Search Engine Crawler", details: "Microsoft Bing indexing crawler" },
        { name: "YandexBot", pattern: /yandexbot/i, category: "Search Engine Crawler", details: "Yandex search spider" },
        { name: "DuckDuckBot", pattern: /duckduckbot/i, category: "Search Engine Crawler", details: "DuckDuckGo search crawler" },
        { name: "Baiduspider", pattern: /baiduspider/i, category: "Search Engine Crawler", details: "Baidu indexing bot" },
        { name: "GPTBot", pattern: /gptbot/i, category: "AI LLM Training / Retrieval Crawler", details: "OpenAI crawler" },
        { name: "ChatGPT-User", pattern: /chatgpt-user/i, category: "AI Assistant Live Fetch", details: "OpenAI live web plugin" },
        { name: "ClaudeBot", pattern: /claudebot/i, category: "AI LLM Crawler", details: "Anthropic Claude web harvester" },
        { name: "PerplexityBot", pattern: /perplexitybot/i, category: "AI Search Retrieval", details: "Perplexity AI indexing agent" },
        { name: "facebookexternalhit", pattern: /facebookexternalhit/i, category: "Social Media Metadata Link Preview", details: "Meta Open Graph scraper" },
        { name: "Twitterbot", pattern: /twitterbot/i, category: "Social Media Preview", details: "X (Twitter) Card preview parser" },
        { name: "LinkedInBot", pattern: /linkedinbot/i, category: "Social Media Preview", details: "LinkedIn rich preview bot" },
        { name: "AhrefsBot", pattern: /ahrefsbot/i, category: "SEO & Backlink Analyzer", details: "Ahrefs SEO Crawler" },
        { name: "SemrushBot", pattern: /semrushbot/i, category: "SEO Crawler", details: "Semrush audit bot" },
        { name: "Discordbot", pattern: /discordbot/i, category: "Social Media Preview", details: "Discord embed generator" },
        { name: "Slackbot", pattern: /slackbot/i, category: "Social Media Preview", details: "Slack link expander" },
        { name: "GenericBot", pattern: /(bot|crawler|spider|scraper|crawl|curl|wget|python-requests|headlesschrome)/i, category: "Automated Utility", details: "Generic headless or automated scraper" },
    ];

    let isBot = false;
    let botCategory: string | undefined;
    let botDetails: string | undefined;

    for (const b of botPatterns) {
        if (b.pattern.test(raw)) {
            isBot = true;
            botCategory = b.category;
            botDetails = b.details;
            break;
        }
    }

    // Operating System parsing
    let osName = "Unknown";
    let osVersion = "Unknown";
    let platform = "Unknown";

    if (/windows nt 10\.0/i.test(raw)) {
        osName = "Windows";
        osVersion = "10 / 11";
        platform = "x86/x64 PC";
    } else if (/windows nt 6\.3/i.test(raw)) {
        osName = "Windows";
        osVersion = "8.1";
        platform = "PC";
    } else if (/windows nt 6\.2/i.test(raw)) {
        osName = "Windows";
        osVersion = "8";
        platform = "PC";
    } else if (/windows nt 6\.1/i.test(raw)) {
        osName = "Windows";
        osVersion = "7";
        platform = "PC";
    } else if (/windows/i.test(raw)) {
        osName = "Windows";
        osVersion = "Generic Windows";
        platform = "PC";
    } else if (/iphone/i.test(raw)) {
        osName = "iOS";
        platform = "Apple Mobile";
        const vMatch = raw.match(/OS (\d+[_.]\d+([_.]\d+)?)/i);
        osVersion = vMatch ? vMatch[1].replace(/_/g, ".") : "Unknown";
    } else if (/ipad/i.test(raw)) {
        osName = "iPadOS / iOS";
        platform = "Apple Tablet";
        const vMatch = raw.match(/OS (\d+[_.]\d+([_.]\d+)?)/i);
        osVersion = vMatch ? vMatch[1].replace(/_/g, ".") : "Unknown";
    } else if (/macintosh|mac os x/i.test(raw)) {
        osName = "macOS";
        platform = "Apple Mac";
        const vMatch = raw.match(/Mac OS X (\d+[_.]\d+([_.]\d+)?)/i);
        osVersion = vMatch ? vMatch[1].replace(/_/g, ".") : "Unknown";
    } else if (/android/i.test(raw)) {
        osName = "Android";
        platform = "Mobile Device";
        const vMatch = raw.match(/Android (\d+(\.\d+)?)/i);
        osVersion = vMatch ? vMatch[1] : "Unknown";
    } else if (/cros/i.test(raw)) {
        osName = "Chrome OS";
        platform = "Chromebook";
        osVersion = "Generic";
    } else if (/linux/i.test(raw)) {
        osName = "Linux";
        platform = "Unix/Linux";
        osVersion = "Generic Linux";
    } else if (/playstation 5/i.test(raw)) {
        osName = "PlayStation OS";
        osVersion = "5.0";
        platform = "Gaming Console";
    } else if (/playstation 4/i.test(raw)) {
        osName = "PlayStation OS";
        osVersion = "4.0";
        platform = "Gaming Console";
    } else if (/xbox/i.test(raw)) {
        osName = "Xbox OS";
        osVersion = "Xbox Live OS";
        platform = "Gaming Console";
    }

    // CPU Architecture parsing
    let cpuArch = "Unknown";
    if (/win64|x64|x86_64|amd64|wow64/i.test(raw)) {
        cpuArch = "x86-64 (64-bit)";
    } else if (/arm64|aarch64/i.test(raw)) {
        cpuArch = "ARM64 (Apple Silicon / Qualcomm / Dimensity)";
    } else if (/i686|i386|x86/i.test(raw)) {
        cpuArch = "x86 (32-bit)";
    } else if (/armv7|armv8|arm/i.test(raw)) {
        cpuArch = "ARM (Mobile)";
    } else if (/intel/i.test(raw)) {
        cpuArch = "Intel Architecture";
    }

    // Browser Engine Parsing
    let engineName = "Unknown";
    let engineVersion = "Unknown";

    if (/applewebkit\/([0-9.]+)/i.test(raw)) {
        engineName = "Blink / WebKit";
        const engMatch = raw.match(/applewebkit\/([0-9.]+)/i);
        engineVersion = engMatch ? engMatch[1] : "Unknown";
        if (/chrome|edg|opr/i.test(raw)) {
            engineName = "Blink (Chromium)";
        } else if (/safari/i.test(raw) && !/chrome|crios|android/i.test(raw)) {
            engineName = "WebKit (Apple)";
        }
    } else if (/gecko\/([0-9.]+)/i.test(raw) || /rv:([0-9.]+)/i.test(raw)) {
        engineName = "Gecko (Mozilla)";
        const engMatch = raw.match(/rv:([0-9.]+)/i) || raw.match(/gecko\/([0-9.]+)/i);
        engineVersion = engMatch ? engMatch[1] : "Unknown";
    } else if (/trident\/([0-9.]+)/i.test(raw)) {
        engineName = "Trident (MS Internet Explorer)";
        const engMatch = raw.match(/trident\/([0-9.]+)/i);
        engineVersion = engMatch ? engMatch[1] : "Unknown";
    }

    // Browser Name & Version Parsing
    let browserName = "Unknown";
    let browserVersion = "Unknown";

    if (/edg\/([0-9.]+)/i.test(raw)) {
        browserName = "Microsoft Edge";
        browserVersion = raw.match(/edg\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/opr\/([0-9.]+)|opera\/([0-9.]+)/i.test(raw)) {
        browserName = "Opera";
        browserVersion = raw.match(/(?:opr|opera)\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/brave/i.test(raw)) {
        browserName = "Brave";
        browserVersion = raw.match(/chrome\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/vivaldi\/([0-9.]+)/i.test(raw)) {
        browserName = "Vivaldi";
        browserVersion = raw.match(/vivaldi\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/samsungbrowser\/([0-9.]+)/i.test(raw)) {
        browserName = "Samsung Internet";
        browserVersion = raw.match(/samsungbrowser\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/duckduckgo\/([0-9.]+)/i.test(raw)) {
        browserName = "DuckDuckGo Privacy Browser";
        browserVersion = raw.match(/duckduckgo\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/crios\/([0-9.]+)/i.test(raw)) {
        browserName = "Google Chrome (iOS)";
        browserVersion = raw.match(/crios\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/fxios\/([0-9.]+)/i.test(raw)) {
        browserName = "Mozilla Firefox (iOS)";
        browserVersion = raw.match(/fxios\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/chrome\/([0-9.]+)/i.test(raw)) {
        browserName = "Google Chrome";
        browserVersion = raw.match(/chrome\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/version\/([0-9.]+).*safari/i.test(raw)) {
        browserName = "Apple Safari";
        browserVersion = raw.match(/version\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/firefox\/([0-9.]+)/i.test(raw)) {
        browserName = "Mozilla Firefox";
        browserVersion = raw.match(/firefox\/([0-9.]+)/i)?.[1] || "Unknown";
    } else if (/msie\s([0-9.]+)/i.test(raw)) {
        browserName = "Internet Explorer";
        browserVersion = raw.match(/msie\s([0-9.]+)/i)?.[1] || "Unknown";
    } else if (isBot) {
        browserName = botPatterns.find((b) => b.pattern.test(raw))?.name || "Automated Bot";
        browserVersion = "Bot Engine";
    }

    const browserMajor = browserVersion !== "Unknown" ? browserVersion.split(".")[0] : "Unknown";

    // Device Type & Vendor Parsing
    let deviceType: ParsedUA["device"]["type"] = "Desktop";
    let vendor = "Generic";
    let model = "Generic Device";

    if (isBot) {
        deviceType = "Bot/Crawler";
        vendor = "Crawler Engine";
        model = botCategory || "Web Spider";
    } else if (/playstation|xbox|nintendo/i.test(raw)) {
        deviceType = "Console";
        vendor = /playstation/i.test(raw) ? "Sony" : /xbox/i.test(raw) ? "Microsoft" : "Nintendo";
        model = /playstation 5/i.test(raw) ? "PlayStation 5" : /playstation 4/i.test(raw) ? "PlayStation 4" : "Console";
    } else if (/smart-tv|appletv|googletv|tizen|roku|hbbtv/i.test(raw)) {
        deviceType = "Smart TV";
        vendor = /appletv/i.test(raw) ? "Apple" : /samsung|tizen/i.test(raw) ? "Samsung" : /roku/i.test(raw) ? "Roku" : "Smart TV Vendor";
        model = "Connected TV";
    } else if (/ipad|tablet|playbook|silk/i.test(raw) || (/macintosh/i.test(raw) && typeof window !== "undefined" && navigator.maxTouchPoints > 1)) {
        deviceType = "Tablet";
        vendor = /ipad|macintosh/i.test(raw) ? "Apple" : "Generic Android Tablet";
        model = /ipad/i.test(raw) ? "iPad" : "Tablet";
    } else if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(raw)) {
        deviceType = "Mobile";
        if (/iphone/i.test(raw)) {
            vendor = "Apple";
            model = "iPhone";
        } else if (/sm-[a-z0-9]+/i.test(raw)) {
            vendor = "Samsung";
            const smMatch = raw.match(/sm-[a-z0-9]+/i);
            model = smMatch ? smMatch[0].toUpperCase() : "Galaxy Device";
        } else if (/pixel/i.test(raw)) {
            vendor = "Google";
            const pMatch = raw.match(/pixel(\s[a-z0-9]+)?/i);
            model = pMatch ? pMatch[0] : "Pixel";
        } else {
            vendor = "Generic Android / Mobile";
            model = "Smartphone";
        }
    } else {
        deviceType = "Desktop";
        if (/macintosh/i.test(raw)) {
            vendor = "Apple";
            model = "Macintosh (MacBook / iMac / Mac Studio)";
        } else if (/windows/i.test(raw)) {
            vendor = "Microsoft PC Ecosystem";
            model = "Windows Workstation / Laptop";
        } else if (/linux/i.test(raw)) {
            vendor = "Open Source Linux";
            model = "Desktop Workstation";
        }
    }

    return {
        raw,
        browser: {
            name: browserName,
            version: browserVersion,
            major: browserMajor,
        },
        engine: {
            name: engineName,
            version: engineVersion,
        },
        os: {
            name: osName,
            version: osVersion,
            platform,
        },
        device: {
            type: deviceType,
            vendor,
            model,
        },
        cpu: {
            architecture: cpuArch,
        },
        bot: {
            isBot,
            category: botCategory,
            details: botDetails,
        },
        tokens,
    };
}

export default function UserAgentParser() {
    const [uaInput, setUaInput] = useState<string>("");
    const [copiedJson, setCopiedJson] = useState<boolean>(false);
    const [copiedRaw, setCopiedRaw] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"inspector" | "json" | "tokens">("inspector");

    // Client Hints Extra State
    const [clientHints, setClientHints] = useState<{
        platform?: string;
        mobile?: boolean;
        brands?: { brand: string; version: string }[];
        screenRes?: string;
        viewport?: string;
        pixelRatio?: number;
        colorDepth?: number;
        touchPoints?: number;
        language?: string;
        cookiesEnabled?: boolean;
        doNotTrack?: string | null;
    }>({});

    // Read current browser's live user-agent on mount
    useEffect(() => {
        if (typeof window !== "undefined" && typeof navigator !== "undefined") {
            const currentUa = navigator.userAgent;
            setUaInput(currentUa);

            // Read modern navigator properties & NavigatorUAData (Client Hints) if supported
            const navData = (navigator as unknown as { userAgentData?: { platform?: string; mobile?: boolean; brands?: { brand: string; version: string }[] } }).userAgentData;

            setClientHints({
                platform: navData?.platform || navigator.platform,
                mobile: navData?.mobile,
                brands: navData?.brands || [],
                screenRes: `${window.screen.width} x ${window.screen.height}`,
                viewport: `${window.innerWidth} x ${window.innerHeight}`,
                pixelRatio: window.devicePixelRatio || 1,
                colorDepth: window.screen.colorDepth || 24,
                touchPoints: navigator.maxTouchPoints || 0,
                language: navigator.language || "en-US",
                cookiesEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,
            });
        }
    }, []);

    // Perform real-time parsing
    const parsedData = useMemo(() => parseUserAgentString(uaInput), [uaInput]);

    const handleCopyJSON = () => {
        const fullOutput = {
            parsed: parsedData,
            clientHints: clientHints,
            timestamp: new Date().toISOString(),
        };
        navigator.clipboard.writeText(JSON.stringify(fullOutput, null, 2));
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
    };

    const handleCopyRaw = () => {
        navigator.clipboard.writeText(uaInput);
        setCopiedRaw(true);
        setTimeout(() => setCopiedRaw(false), 2000);
    };

    const handleResetToMyBrowser = () => {
        if (typeof window !== "undefined" && typeof navigator !== "undefined") {
            setUaInput(navigator.userAgent);
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "User-Agent String Parser & Inspector",
        "url": "https://twistertools.com/tools/developer-tools/user-agent-parser",
        "description": "Inspect and parse HTTP User-Agent strings in real time. Decode browser versions, rendering engines, operating systems, hardware architecture, mobile devices, and AI bot crawlers instantly.",
        "applicationCategory": "DeveloperApplication",
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
                "name": "What is an HTTP User-Agent string?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An HTTP User-Agent string is a request header broadcast by web browsers, spiders, and mobile applications to web servers. It identifies the client's rendering engine, browser build version, operating system, device family, and compatibility tokens so servers can deliver device-tailored content."
                }
            },
            {
                "@type": "Question",
                "name": "Why do almost all modern User-Agent strings begin with Mozilla/5.0?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This is a legacy compatibility artifact from the 1990s browser wars. Early web servers restricted advanced features exclusively to Netscape Navigator (codenamed Mozilla). Competitors like Internet Explorer, and later WebKit, Chrome, and Safari, began prepending Mozilla/5.0 to their strings to ensure servers didn't downgrade their web experiences."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between User-Agent Strings and Client Hints (Sec-CH-UA)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Traditional User-Agent strings broadcast full system metadata indiscriminately with every HTTP request. User-Agent Client Hints (UA-CH) represent a modern privacy-preserving standard where browsers send minimal brand tokens by default and only expose granular details (such as OS build or device model) when the server explicitly requests them via Sec-CH-UA headers."
                }
            },
            {
                "@type": "Question",
                "name": "How does User-Agent parsing detect AI crawlers and bots like GPTBot and ClaudeBot?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Web crawlers and automated LLM harvesters embed distinct identification tokens and URLs in their User-Agent headers (e.g., 'GPTBot/1.2; +https://openai.com/gptbot'). Our parser matches these tokens against recognized crawler signatures to categorize bot activity instantly."
                }
            },
            {
                "@type": "Question",
                "name": "Is User-Agent sniffing reliable for responsive web design?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Relying solely on User-Agent sniffing for responsive layouts is an anti-pattern because UA strings can be spoofed or frozen. Best practices dictate using CSS Media Queries, Container Queries, and progressive Feature Detection (CSS @supports or modern JS APIs) for layout adaptability."
                }
            },
            {
                "@type": "Question",
                "name": "Does this User-Agent parser transmit my data to an external server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The parser executes 100% locally within your client browser thread using fast JavaScript regular expression matching and tokenization. Zero network requests or header telemetry logs are generated."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Interactive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: UA Input & Preset Selector */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Search className="w-5 h-5 text-indigo-600" />
                                Input User-Agent String
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleResetToMyBrowser}
                                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Detect My Browser
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    onClick={handleCopyRaw}
                                    disabled={!uaInput}
                                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition disabled:opacity-40 cursor-pointer"
                                >
                                    {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedRaw ? "Copied" : "Copy Raw"}
                                </button>
                            </div>
                        </div>

                        {/* Textarea Input Container */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Raw HTTP User-Agent Header
                            </label>
                            <textarea
                                value={uaInput}
                                onChange={(e) => setUaInput(e.target.value)}
                                rows={4}
                                placeholder="Paste any User-Agent string here (e.g. Mozilla/5.0...)"
                                className="w-full p-3.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50 transition resize-y min-h-[110px]"
                            />
                        </div>

                        {/* Presets & Emulation Profiles */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Or Load Common Device & Bot Presets
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                                {PRESET_USER_AGENTS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setUaInput(preset.ua)}
                                        className={`text-left p-2.5 rounded-lg border transition text-xs flex flex-col gap-0.5 cursor-pointer ${uaInput === preset.ua
                                                ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs font-semibold"
                                                : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-bold truncate">{preset.label}</span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                                {preset.category}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-mono text-slate-400 truncate w-full">
                                            {preset.ua}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live Browser Environment Telemetry Card */}
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                    <Fingerprint className="w-4 h-4 text-indigo-600" />
                                    Client Environment Signals
                                </span>
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Live Browser Session
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
                                    <span className="text-slate-400 block text-[10px]">Screen / Viewport</span>
                                    <strong className="text-slate-800 font-semibold text-[11px]">{clientHints.screenRes} ({clientHints.viewport})</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
                                    <span className="text-slate-400 block text-[10px]">Pixel Ratio / Depth</span>
                                    <strong className="text-slate-800 font-semibold text-[11px]">{clientHints.pixelRatio}x / {clientHints.colorDepth}-bit</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
                                    <span className="text-slate-400 block text-[10px]">Touch Points</span>
                                    <strong className="text-slate-800 font-semibold text-[11px]">{clientHints.touchPoints} Max Touch</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
                                    <span className="text-slate-400 block text-[10px]">System Locale</span>
                                    <strong className="text-slate-800 font-semibold text-[11px]">{clientHints.language}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
                                    <span className="text-slate-400 block text-[10px]">Cookies Enabled</span>
                                    <strong className="text-slate-800 font-semibold text-[11px]">{clientHints.cookiesEnabled ? "Active (Yes)" : "Disabled"}</strong>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-indigo-100/60">
                                    <span className="text-slate-400 block text-[10px]">Do Not Track</span>
                                    <strong className="text-slate-800 font-semibold text-[11px]">{clientHints.doNotTrack || "Unspecified"}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                            Characters: <strong className="text-slate-800">{uaInput.length}</strong> | Tokens: <strong className="text-slate-800">{parsedData.tokens.length}</strong>
                        </span>
                        <button
                            onClick={() => setUaInput("")}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold transition cursor-pointer"
                        >
                            Clear Input
                        </button>
                    </div>
                </div>

                {/* Right Panel: Parsed Inspector & Structured Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Inspector Breakdown
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("inspector")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "inspector" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Fields
                                </button>
                                <button
                                    onClick={() => setActiveTab("json")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "json" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    JSON
                                </button>
                                <button
                                    onClick={() => setActiveTab("tokens")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "tokens" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Tokens ({parsedData.tokens.length})
                                </button>
                            </div>
                        </div>

                        {/* Top Summary Banner: Primary Browser & OS */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                                        Detected Environment
                                    </span>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        {parsedData.browser.name} <span className="text-sm text-slate-300 font-normal">v{parsedData.browser.version}</span>
                                    </h3>
                                    <p className="text-xs text-slate-300 font-medium">
                                        {parsedData.os.name} {parsedData.os.version} • {parsedData.device.type} ({parsedData.cpu.architecture})
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    {parsedData.bot.isBot ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                            <Bot className="w-3.5 h-3.5" /> Bot / Spider
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Human Browser
                                        </span>
                                    )}
                                    <span className="text-[11px] text-slate-400 font-mono">
                                        Engine: {parsedData.engine.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* TAB 1: Structured Fields Inspector */}
                        {activeTab === "inspector" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Browser Card */}
                                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <Globe className="w-4 h-4 text-indigo-600" /> Browser Info
                                    </span>
                                    <p className="text-sm font-bold text-slate-900">{parsedData.browser.name}</p>
                                    <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                                        <div>Full Version: <strong className="text-slate-800 font-mono">{parsedData.browser.version}</strong></div>
                                        <div>Major Release: <strong className="text-slate-800 font-mono">{parsedData.browser.major}</strong></div>
                                    </div>
                                </div>

                                {/* OS Card */}
                                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <Laptop className="w-4 h-4 text-indigo-600" /> Operating System
                                    </span>
                                    <p className="text-sm font-bold text-slate-900">{parsedData.os.name} {parsedData.os.version}</p>
                                    <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                                        <div>Platform Family: <strong className="text-slate-800">{parsedData.os.platform}</strong></div>
                                        <div>Architecture: <strong className="text-slate-800 font-mono">{parsedData.cpu.architecture}</strong></div>
                                    </div>
                                </div>

                                {/* Rendering Engine Card */}
                                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <Cpu className="w-4 h-4 text-indigo-600" /> Layout Engine
                                    </span>
                                    <p className="text-sm font-bold text-slate-900">{parsedData.engine.name}</p>
                                    <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                                        <div>Engine Build: <strong className="text-slate-800 font-mono">{parsedData.engine.version}</strong></div>
                                        <div>Standard: <strong className="text-slate-800">HTML5 / Web Standards</strong></div>
                                    </div>
                                </div>

                                {/* Hardware & Device Card */}
                                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <MonitorSmartphone className="w-4 h-4 text-indigo-600" /> Device & Hardware
                                    </span>
                                    <p className="text-sm font-bold text-slate-900">{parsedData.device.type}</p>
                                    <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                                        <div>Vendor: <strong className="text-slate-800">{parsedData.device.vendor}</strong></div>
                                        <div>Model: <strong className="text-slate-800">{parsedData.device.model}</strong></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: JSON Code View */}
                        {activeTab === "json" && (
                            <div className="relative">
                                <pre className="bg-slate-950 text-indigo-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[300px] border border-slate-800">
                                    {JSON.stringify({ parsed: parsedData, clientHints }, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* TAB 3: Tokenized Inspection */}
                        {activeTab === "tokens" && (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {parsedData.tokens.length === 0 ? (
                                    <p className="text-xs text-slate-400 p-3">No tokens parsed.</p>
                                ) : (
                                    parsedData.tokens.map((tok, i) => (
                                        <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                                    {i + 1}
                                                </span>
                                                <span className="font-mono font-medium text-slate-900 break-all">{tok}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyJSON}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedJson ? "Copied JSON Report" : "Copy JSON Data"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Architectural Anatomy of a User-Agent String */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Anatomy of an HTTP User-Agent: Historical Context & Segment Breakdown
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        An HTTP <strong>User-Agent (UA) string</strong> is a foundational header defined in RFC 9110 (and historically RFC 2616). When your browser requests web documents, stylesheets, or API endpoints, it attaches this metadata payload to describe its software version, rendering engine, operating platform, and architecture.
                    </p>

                    <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
                        <div className="text-indigo-400 font-bold text-[11px] uppercase tracking-wider">Example User-Agent String Breakdown:</div>
                        <div className="text-amber-300">Mozilla/5.0 <span className="text-slate-400">(Macintosh; Intel Mac OS X 10_15_7)</span> <span className="text-emerald-400">AppleWebKit/537.36</span> <span className="text-sky-300">(KHTML, like Gecko)</span> <span className="text-indigo-300">Chrome/128.0.0.0</span> <span className="text-pink-400">Safari/537.36</span></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-indigo-600" /> The "Mozilla/5.0" Artifact
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Originating from the early browser wars between Netscape Navigator and Internet Explorer, modern browsers still broadcast <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Mozilla/5.0</code> to prevent legacy web servers from serving degraded fallback layouts.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Platform & Architecture
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Contained inside parentheses, this token reveals the host OS kernel (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Windows NT</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Mac OS X</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Linux x86_64</code>, or <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Android</code>) and underlying processor instruction set.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600" /> Engine & Brand Clones
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Because modern Google Chrome, Microsoft Edge, Opera, and Brave all run on Chromium, they broadcast <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">AppleWebKit/537.36</code> and <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Safari/537.36</code> alongside their distinct application flags.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: User-Agent Client Hints vs Legacy UA Strings */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Shift to Client Hints (UA-CH) & User-Agent Reduction
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To curb passive browser fingerprinting and protect user privacy, Google Chromium, Mozilla Firefox, and Apple WebKit initiated <strong>User-Agent Reduction (User-Agent Freezing)</strong>. Under this standard, default User-Agent strings provide static, generalized version numbers while delegating granular inspections to <strong>User-Agent Client Hints (UA-CH)</strong>.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Feature Dimension</th>
                                    <th className="p-3">Legacy User-Agent Header</th>
                                    <th className="p-3">User-Agent Client Hints (Sec-CH-UA)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Transmission Mode</td>
                                    <td className="p-3 text-slate-600">Broadcasted passively on every HTTP request</td>
                                    <td className="p-3 text-indigo-700 font-semibold">Sent on-demand via server header opt-in (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">Accept-CH</code>)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Entropy & Fingerprinting</td>
                                    <td className="p-3 text-rose-600 font-semibold">High entropy (reveals OS patch, exact build)</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Low default entropy (brands + major version only)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Format & Structure</td>
                                    <td className="p-3 text-slate-600">Unstructured custom string requiring Regex parsers</td>
                                    <td className="p-3 text-indigo-700 font-semibold">Structured HTTP field headers (Structured Fields RFC 8941)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">JavaScript API Access</td>
                                    <td className="p-3 font-mono text-xs text-slate-700">navigator.userAgent</td>
                                    <td className="p-3 font-mono text-xs text-indigo-700">navigator.userAgentData.getHighEntropyValues()</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: AI Web Crawlers & Bot Detection Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Top Search Spiders, AI Harvesters & Social Link Crawlers
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Server logs and firewalls (such as Cloudflare, AWS WAF, and NGINX) inspect incoming User-Agents to apply rate limiting, prevent scrapers, or grant access to search indexing spiders.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Bot / Spider Name</th>
                                    <th className="p-3">Operator</th>
                                    <th className="p-3">Primary Purpose</th>
                                    <th className="p-3">Key User-Agent Identifier</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Googlebot</td>
                                    <td className="p-3">Google LLC</td>
                                    <td className="p-3 text-slate-600">Search Engine Indexing</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">Googlebot/2.1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">GPTBot</td>
                                    <td className="p-3">OpenAI</td>
                                    <td className="p-3 text-slate-600">AI LLM Model Training & RAG</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">GPTBot/1.2</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">ClaudeBot</td>
                                    <td className="p-3">Anthropic</td>
                                    <td className="p-3 text-slate-600">Claude Model Training & Ingestion</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">ClaudeBot/1.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">PerplexityBot</td>
                                    <td className="p-3">Perplexity AI</td>
                                    <td className="p-3 text-slate-600">Live Search & Conversational Index</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">PerplexityBot/1.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Bingbot</td>
                                    <td className="p-3">Microsoft</td>
                                    <td className="p-3 text-slate-600">Bing & Copilot Indexing</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">bingbot/2.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">facebookexternalhit</td>
                                    <td className="p-3">Meta</td>
                                    <td className="p-3 text-slate-600">Facebook/Instagram Link Previews</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">facebookexternalhit/1.1</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Best Practices for Developers */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Info className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Developer Best Practices: Detection vs Progressive Enhancement
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When building resilient web applications, modern architectural best practices recommend moving away from brittle User-Agent string sniffing in favor of progressive feature testing:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-emerald-600" /> Recommended: Feature & Media Queries
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                                <li>Use CSS <code className="bg-slate-200 px-1 py-0.5 rounded">@media (hover: hover)</code> to detect mouse vs touch devices.</li>
                                <li>Use <code className="bg-slate-200 px-1 py-0.5 rounded">CSS.supports()</code> or modern JS feature checks before calling cutting-edge Web APIs.</li>
                                <li>Leverage Container Queries (<code className="bg-slate-200 px-1 py-0.5 rounded">@container</code>) for fluid UI component scaling.</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Square className="w-4 h-4 text-amber-600" /> When to Use User-Agent Parsing
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                                <li>Server-side analytics and real-time dashboard telemetry.</li>
                                <li>Blocking malicious scrapers or automated vulnerability probes.</li>
                                <li>Serving native app download smart banners (iOS App Store vs Google Play).</li>
                            </ul>
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
                                What is an HTTP User-Agent string?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An HTTP User-Agent string is a request header broadcast by web browsers, spiders, and mobile applications to web servers. It identifies the client's rendering engine, browser build version, operating system, device family, and compatibility tokens so servers can deliver device-tailored content.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do almost all modern User-Agent strings begin with Mozilla/5.0?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This is a legacy compatibility artifact from the 1990s browser wars. Early web servers restricted advanced features exclusively to Netscape Navigator (codenamed Mozilla). Competitors like Internet Explorer, and later WebKit, Chrome, and Safari, began prepending Mozilla/5.0 to their strings to ensure servers didn't downgrade their web experiences.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between User-Agent Strings and Client Hints (Sec-CH-UA)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Traditional User-Agent strings broadcast full system metadata indiscriminately with every HTTP request. User-Agent Client Hints (UA-CH) represent a modern privacy-preserving standard where browsers send minimal brand tokens by default and only expose granular details (such as OS build or device model) when the server explicitly requests them via Sec-CH-UA headers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does User-Agent parsing detect AI crawlers and bots like GPTBot and ClaudeBot?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Web crawlers and automated LLM harvesters embed distinct identification tokens and URLs in their User-Agent headers (e.g., 'GPTBot/1.2; +https://openai.com/gptbot'). Our parser matches these tokens against recognized crawler signatures to categorize bot activity instantly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is User-Agent sniffing reliable for responsive web design?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. Relying solely on User-Agent sniffing for responsive layouts is an anti-pattern because UA strings can be spoofed or frozen. Best practices dictate using CSS Media Queries, Container Queries, and progressive Feature Detection (CSS @supports or modern JS APIs) for layout adaptability.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this User-Agent parser transmit my data to an external server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The parser executes 100% locally within your client browser thread using fast JavaScript regular expression matching and tokenization. Zero network requests or header telemetry logs are generated.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}