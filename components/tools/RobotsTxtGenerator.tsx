"use client";

import React, { useState, useMemo } from "react";
import {
    Bot,
    FileCode,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Copy,
    Check,
    Download,
    RefreshCw,
    Plus,
    Trash2,
    Globe,
    Layers,
    Search,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Code2,
    Sparkles,
    FileText,
    Terminal,
    Settings,
    Cpu,
    ExternalLink
} from "lucide-react";

interface RuleGroup {
    id: string;
    userAgent: string;
    allow: string[];
    disallow: string[];
    crawlDelay?: number | "";
}

interface CommonBot {
    name: string;
    userAgent: string;
    description: string;
    category: "Search Engine" | "AI Crawler" | "Social / Scraper";
}

const COMMON_BOTS: CommonBot[] = [
    { name: "All Search Engines & Bots", userAgent: "*", description: "Default catch-all for web crawlers", category: "Search Engine" },
    { name: "Googlebot", userAgent: "Googlebot", description: "Google Search main indexer", category: "Search Engine" },
    { name: "Googlebot Image", userAgent: "Googlebot-Image", description: "Google Image Search crawler", category: "Search Engine" },
    { name: "Bingbot", userAgent: "Bingbot", description: "Microsoft Bing crawler", category: "Search Engine" },
    { name: "Baiduspider", userAgent: "Baiduspider", description: "Baidu search engine crawler", category: "Search Engine" },
    { name: "YandexBot", userAgent: "YandexBot", description: "Yandex crawler", category: "Search Engine" },
    { name: "DuckDuckBot", userAgent: "DuckDuckBot", description: "DuckDuckGo indexing crawler", category: "Search Engine" },
    { name: "GPTBot (OpenAI)", userAgent: "GPTBot", description: "OpenAI ChatGPT & LLM training crawler", category: "AI Crawler" },
    { name: "ChatGPT-User", userAgent: "ChatGPT-User", description: "OpenAI ChatGPT live web browsing", category: "AI Crawler" },
    { name: "ClaudeBot (Anthropic)", userAgent: "ClaudeBot", description: "Anthropic Claude AI training web scraper", category: "AI Crawler" },
    { name: "PerplexityBot", userAgent: "PerplexityBot", description: "Perplexity AI real-time search bot", category: "AI Crawler" },
    { name: "CCBot (Common Crawl)", userAgent: "CCBot", description: "Open web repository used by AI labs", category: "AI Crawler" },
    { name: "Google-Extended", userAgent: "Google-Extended", description: "Google Gemini & Vertex AI crawler", category: "AI Crawler" },
    { name: "FacebookBot", userAgent: "facebookexternalhit", description: "Meta link preview & indexing bot", category: "Social / Scraper" },
    { name: "TwitterBot", userAgent: "Twitterbot", description: "X (Twitter) card generator & crawler", category: "Social / Scraper" },
    { name: "AhrefsBot", userAgent: "AhrefsBot", description: "Ahrefs SEO & backlink crawler", category: "Social / Scraper" },
    { name: "SemrushBot", userAgent: "SemrushBot", description: "Semrush digital marketing audit crawler", category: "Social / Scraper" }
];

const PRESETS = [
    {
        id: "allow-all",
        name: "Standard Allow All",
        desc: "Open to all search bots, disallow private admin & API routes",
        groups: [
            {
                id: "g1",
                userAgent: "*",
                allow: ["/"],
                disallow: ["/admin/", "/api/", "/dashboard/", "/checkout/"],
                crawlDelay: ""
            }
        ]
    },
    {
        id: "ai-block",
        name: "Search Allowed + AI Blocked",
        desc: "Allow Google/Bing while strictly blocking OpenAI, Anthropic, CCBot & Perplexity",
        groups: [
            {
                id: "g1",
                userAgent: "*",
                allow: ["/"],
                disallow: ["/admin/", "/private/"],
                crawlDelay: ""
            },
            {
                id: "g2",
                userAgent: "GPTBot",
                allow: [],
                disallow: ["/"],
                crawlDelay: ""
            },
            {
                id: "g3",
                userAgent: "ClaudeBot",
                allow: [],
                disallow: ["/"],
                crawlDelay: ""
            },
            {
                id: "g4",
                userAgent: "PerplexityBot",
                allow: [],
                disallow: ["/"],
                crawlDelay: ""
            },
            {
                id: "g5",
                userAgent: "CCBot",
                allow: [],
                disallow: ["/"],
                crawlDelay: ""
            },
            {
                id: "g6",
                userAgent: "Google-Extended",
                allow: [],
                disallow: ["/"],
                crawlDelay: ""
            }
        ]
    },
    {
        id: "staging-block-all",
        name: "Staging / Private (Disallow All)",
        desc: "Completely restrict all web crawlers and robots from entire website",
        groups: [
            {
                id: "g1",
                userAgent: "*",
                allow: [],
                disallow: ["/"],
                crawlDelay: ""
            }
        ]
    },
    {
        id: "ecommerce-optimized",
        name: "E-Commerce SEO Shield",
        desc: "Allow catalog, block cart/search facet URLs and aggressive scrapers",
        groups: [
            {
                id: "g1",
                userAgent: "*",
                allow: ["/"],
                disallow: [
                    "/cart",
                    "/checkout",
                    "/account/",
                    "/search?*",
                    "*?sort=*",
                    "*?filter=*",
                    "/admin/"
                ],
                crawlDelay: ""
            },
            {
                id: "g2",
                userAgent: "AhrefsBot",
                allow: [],
                disallow: ["/search"],
                crawlDelay: 5
            }
        ]
    }
];

export default function RobotsTxtGenerator() {
    // Mode toggle: Generator or Live Text Validator
    const [mode, setMode] = useState<"builder" | "raw">("builder");

    // Generator State
    const [sitemaps, setSitemaps] = useState<string[]>([
        "https://example.com/sitemap.xml"
    ]);
    const [host, setHost] = useState<string>("example.com");
    const [groups, setGroups] = useState<RuleGroup[]>(PRESETS[0].groups as RuleGroup[]);

    // Raw Mode Content (for manual edits or copy-pasted validation)
    const [rawRobotsTxt, setRawRobotsTxt] = useState<string>("");

    // Tester / Validator Interactive State
    const [testUrlPath, setTestUrlPath] = useState<string>("/admin/users");
    const [testBot, setTestBot] = useState<string>("Googlebot");

    // UI Feedback
    const [copied, setCopied] = useState<boolean>(false);

    // Helper: Number input zero-sanitizer for crawl delay
    const handleCrawlDelayInput = (val: string, groupIndex: number) => {
        if (val === "") {
            updateGroup(groupIndex, "crawlDelay", "");
            return;
        }
        const cleaned = val.replace(/^0+(?=\d)/, "");
        const parsed = parseInt(cleaned, 10);
        updateGroup(groupIndex, "crawlDelay", isNaN(parsed) ? "" : Math.max(0, parsed));
    };

    // Synchronize generated robots.txt text
    const generatedRobotsTxt = useMemo(() => {
        const lines: string[] = [];

        lines.push("# --------------------------------------------------");
        lines.push("# Robots.txt generated via TwisterTools.com");
        lines.push("# Standard Robots Exclusion Protocol (REP) Compliance");
        lines.push("# --------------------------------------------------");
        lines.push("");

        groups.forEach((grp, idx) => {
            lines.push(`User-agent: ${grp.userAgent.trim() || "*"}`);

            grp.disallow.forEach((path) => {
                if (path.trim() !== "") {
                    lines.push(`Disallow: ${path.trim()}`);
                }
            });

            grp.allow.forEach((path) => {
                if (path.trim() !== "") {
                    lines.push(`Allow: ${path.trim()}`);
                }
            });

            if (grp.crawlDelay !== undefined && grp.crawlDelay !== "") {
                lines.push(`Crawl-delay: ${grp.crawlDelay}`);
            }

            if (idx < groups.length - 1) {
                lines.push("");
            }
        });

        const activeSitemaps = sitemaps.filter((s) => s.trim().length > 0);
        if (activeSitemaps.length > 0) {
            lines.push("");
            lines.push("# Sitemaps");
            activeSitemaps.forEach((sm) => {
                lines.push(`Sitemap: ${sm.trim()}`);
            });
        }

        if (host.trim().length > 0) {
            lines.push("");
            lines.push(`Host: ${host.trim()}`);
        }

        return lines.join("\n");
    }, [groups, sitemaps, host]);

    // Content used for display & testing
    const activeRobotsText = mode === "builder" ? generatedRobotsTxt : rawRobotsTxt;

    // Rule Group Mutation Handlers
    const addGroup = () => {
        const newGroup: RuleGroup = {
            id: `g_${Date.now()}`,
            userAgent: "*",
            allow: [],
            disallow: ["/private/"],
            crawlDelay: ""
        };
        setGroups([...groups, newGroup]);
    };

    const removeGroup = (index: number) => {
        if (groups.length <= 1) return;
        const updated = [...groups];
        updated.splice(index, 1);
        setGroups(updated);
    };

    const updateGroup = (index: number, field: keyof RuleGroup, value: any) => {
        const updated = [...groups];
        updated[index] = { ...updated[index], [field]: value };
        setGroups(updated);
    };

    const addPathToGroup = (groupIndex: number, type: "allow" | "disallow", path: string = "/") => {
        const updated = [...groups];
        updated[groupIndex][type].push(path);
        setGroups(updated);
    };

    const removePathFromGroup = (groupIndex: number, type: "allow" | "disallow", pathIndex: number) => {
        const updated = [...groups];
        updated[groupIndex][type].splice(pathIndex, 1);
        setGroups(updated);
    };

    const updatePathInGroup = (groupIndex: number, type: "allow" | "disallow", pathIndex: number, val: string) => {
        const updated = [...groups];
        updated[groupIndex][type][pathIndex] = val;
        setGroups(updated);
    };

    // Sitemap Handlers
    const addSitemap = () => {
        setSitemaps([...sitemaps, "https://example.com/sitemap.xml"]);
    };

    const removeSitemap = (index: number) => {
        const updated = [...sitemaps];
        updated.splice(index, 1);
        setSitemaps(updated);
    };

    const updateSitemap = (index: number, val: string) => {
        const updated = [...sitemaps];
        updated[index] = val;
        setSitemaps(updated);
    };

    // Preset Applicator
    const applyPreset = (preset: typeof PRESETS[0]) => {
        setGroups(JSON.parse(JSON.stringify(preset.groups)));
    };

    // Path Matcher Engine (RFC 9309 Compliant path match + wildcards)
    const matchesPattern = (targetPath: string, pattern: string): boolean => {
        if (!pattern) return false;
        // Escape standard regex characters except * and $
        let regexString = pattern
            .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
            .replace(/\*/g, ".*");

        if (!regexString.endsWith("$")) {
            regexString = "^" + regexString;
        } else {
            regexString = "^" + regexString;
        }

        try {
            const regex = new RegExp(regexString);
            return regex.test(targetPath);
        } catch {
            return targetPath.startsWith(pattern);
        }
    };

    // Parse active robots.txt text to execute Real-Time URL Validation
    const validationAnalysis = useMemo(() => {
        const lines = activeRobotsText.split("\n");
        const parsedGroups: { userAgent: string; rules: { type: "allow" | "disallow"; path: string; lineNum: number }[] }[] = [];
        let currentGrp: { userAgent: string; rules: { type: "allow" | "disallow"; path: string; lineNum: number }[] } | null = null;

        const syntaxErrors: { line: number; message: string; text: string }[] = [];
        let sitemapCount = 0;

        lines.forEach((rawLine, index) => {
            const lineNum = index + 1;
            const line = rawLine.split("#")[0].trim();
            if (!line) return;

            const colonIdx = line.indexOf(":");
            if (colonIdx === -1) {
                syntaxErrors.push({ line: lineNum, message: "Missing directive delimiter ':'", text: rawLine });
                return;
            }

            const directive = line.slice(0, colonIdx).trim().toLowerCase();
            const value = line.slice(colonIdx + 1).trim();

            if (directive === "user-agent") {
                currentGrp = { userAgent: value, rules: [] };
                parsedGroups.push(currentGrp);
            } else if (directive === "disallow") {
                if (currentGrp) {
                    currentGrp.rules.push({ type: "disallow", path: value, lineNum });
                } else {
                    syntaxErrors.push({ line: lineNum, message: "Disallow directive without an active User-agent header", text: rawLine });
                }
            } else if (directive === "allow") {
                if (currentGrp) {
                    currentGrp.rules.push({ type: "allow", path: value, lineNum });
                } else {
                    syntaxErrors.push({ line: lineNum, message: "Allow directive without an active User-agent header", text: rawLine });
                }
            } else if (directive === "sitemap") {
                sitemapCount++;
                if (!value.startsWith("http://") && !value.startsWith("https://")) {
                    syntaxErrors.push({ line: lineNum, message: "Sitemap URL must be an absolute URL (e.g. https://...)", text: rawLine });
                }
            } else if (directive === "crawl-delay") {
                const parsed = Number(value);
                if (isNaN(parsed) || parsed < 0) {
                    syntaxErrors.push({ line: lineNum, message: "Crawl-delay must be a positive number", text: rawLine });
                }
            } else if (directive !== "host") {
                syntaxErrors.push({ line: lineNum, message: `Unrecognized robots directive '${directive}'`, text: rawLine });
            }
        });

        // Evaluate Test URL against the target Bot
        const normalizedPath = testUrlPath.startsWith("/") ? testUrlPath : `/${testUrlPath}`;

        // Find relevant user-agent group (Bot specific first, otherwise fallback to '*')
        const specificGroup = parsedGroups.find((g) => g.userAgent.toLowerCase() === testBot.toLowerCase());
        const wildcardGroup = parsedGroups.find((g) => g.userAgent === "*");
        const targetGroup = specificGroup || wildcardGroup;

        let verdict: "ALLOWED" | "BLOCKED" = "ALLOWED";
        let matchedRule: { type: "allow" | "disallow"; path: string; lineNum: number } | null = null;

        if (targetGroup) {
            // Longest match prefix rule RFC 9309 resolution
            let longestMatchLength = -1;
            let chosenRule: { type: "allow" | "disallow"; path: string; lineNum: number } | null = null;

            for (const rule of targetGroup.rules) {
                if (!rule.path) {
                    // Empty "Disallow: " represents Allow All
                    if (rule.type === "disallow" && longestMatchLength < 0) {
                        longestMatchLength = 0;
                        chosenRule = rule;
                    }
                    continue;
                }

                if (matchesPattern(normalizedPath, rule.path)) {
                    if (rule.path.length > longestMatchLength) {
                        longestMatchLength = rule.path.length;
                        chosenRule = rule;
                    } else if (rule.path.length === longestMatchLength && rule.type === "allow") {
                        // In RFC 9309, if an Allow and Disallow pattern have identical lengths, Allow takes precedence
                        chosenRule = rule;
                    }
                }
            }

            if (chosenRule) {
                matchedRule = chosenRule;
                verdict = chosenRule.type === "disallow" && chosenRule.path !== "" ? "BLOCKED" : "ALLOWED";
            }
        }

        return {
            syntaxErrors,
            sitemapCount,
            totalRuleGroups: parsedGroups.length,
            testResult: {
                verdict,
                matchedAgent: targetGroup ? targetGroup.userAgent : "None (Default Allow)",
                matchedRule,
                testedPath: normalizedPath
            }
        };
    }, [activeRobotsText, testUrlPath, testBot]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(activeRobotsText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadFile = () => {
        const blob = new Blob([activeRobotsText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "robots.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Robots.txt Code Generator & RFC 9309 Validator",
        "url": "https://twistertools.com/tools/developer-tools/robots-txt-generator",
        "description": "Generate clean, production-ready robots.txt files with visual user-agent control, AI crawler blockers, sitemap directives, and real-time RFC 9309 URL crawl path validation.",
        "applicationCategory": "DeveloperApplication",
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
                "name": "What is robots.txt and where must it be hosted?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A robots.txt file is a plain text file placed strictly at the root directory of your website (e.g., https://example.com/robots.txt). It instructs compliant search engine crawlers, bots, and AI scrapers which URL paths they are allowed or disallowed from accessing according to the Robots Exclusion Protocol."
                }
            },
            {
                "@type": "Question",
                "name": "Does robots.txt guarantee that private web pages will not be indexed or seen?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Robots.txt is an advisory access control for compliant crawlers, not a security firewall. If other public websites link to a disallowed URL, search engines like Google may still index the URL without reading its content. To keep pages strictly confidential or unindexed, use HTTP Authentication, password walls, or the <meta name='robots' content='noindex'> tag."
                }
            },
            {
                "@type": "Question",
                "name": "How do I block modern AI bots like ChatGPT, Claude, and Perplexity?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can declare explicit User-agent rule blocks targeting AI scrapers. For example: User-agent: GPTBot, User-agent: ClaudeBot, User-agent: PerplexityBot, User-agent: CCBot, and User-agent: Google-Extended followed by Disallow: /. Our generator includes a preconfigured 1-click 'Search Allowed + AI Blocked' preset."
                }
            },
            {
                "@type": "Question",
                "name": "How does RFC 9309 handle conflicting Allow and Disallow rules?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Under the official RFC 9309 Robots Exclusion Protocol specification, crawlers evaluate path rules using longest-match precedence. If both an Allow and Disallow rule match a URL path, the rule with the longest character pattern wins. If both patterns have identical lengths, the Allow rule takes priority."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Crawl-delay directive and is it supported by Google?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Crawl-delay directive instructs bots to wait a specified number of seconds between successive requests to prevent server overloading. It is supported by Bingbot, Yandex, and Baidu, but Googlebot does not recognize Crawl-delay in robots.txt (Google manages crawl rates dynamically through Google Search Console)."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use wildcard asterisks (*) and dollar signs ($) in robots.txt?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The asterisk (*) matches any sequence of zero or more characters (e.g., Disallow: /*?sort=*), while the dollar sign ($) anchors the end of a URL pattern (e.g., Disallow: /*.pdf$ to block all PDF files)."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Quick-Action Preset Selector Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">1-Click Industry Standard Presets</h2>
                            <p className="text-xs text-slate-500">Apply instant best-practice rules tailored for SEO and crawler security</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => {
                                    applyPreset(preset);
                                    if (mode === "raw") setMode("builder");
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                title={preset.desc}
                            >
                                <Bot className="w-3.5 h-3.5 text-indigo-500" />
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Visual Rule Builder / Raw Editor */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Panel Header & Mode Switcher */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                    {mode === "builder" ? "Robots Rule Builder" : "Raw robots.txt Input"}
                                </h2>
                            </div>

                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => {
                                        if (mode === "raw") {
                                            // Keep current raw text in sync if leaving
                                        }
                                        setMode("builder");
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${mode === "builder" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    Visual UI
                                </button>
                                <button
                                    onClick={() => {
                                        setRawRobotsTxt(generatedRobotsTxt);
                                        setMode("raw");
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${mode === "raw" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Terminal className="w-3.5 h-3.5" />
                                    Direct Editor
                                </button>
                            </div>
                        </div>

                        {mode === "builder" ? (
                            <div className="space-y-6">
                                {/* Rule Groups Container */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Bot className="w-4 h-4 text-indigo-600" />
                                            User-Agent Directives & Permissions
                                        </label>
                                        <button
                                            onClick={addGroup}
                                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Agent Block
                                        </button>
                                    </div>

                                    {groups.map((group, gIdx) => (
                                        <div
                                            key={group.id}
                                            className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4 relative"
                                        >
                                            {/* Group Top Row */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-700">User-Agent:</span>
                                                        <select
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    updateGroup(gIdx, "userAgent", e.target.value);
                                                                }
                                                            }}
                                                            className="text-[11px] font-medium bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>Select Known Bot...</option>
                                                            {COMMON_BOTS.map((b) => (
                                                                <option key={b.userAgent} value={b.userAgent}>
                                                                    {b.name} ({b.userAgent})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={group.userAgent}
                                                        onChange={(e) => updateGroup(gIdx, "userAgent", e.target.value)}
                                                        placeholder="e.g. *, Googlebot, GPTBot"
                                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>

                                                {groups.length > 1 && (
                                                    <button
                                                        onClick={() => removeGroup(gIdx)}
                                                        className="self-end sm:self-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                        title="Delete user-agent group"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Disallow Rules */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                                                        <ShieldAlert className="w-3.5 h-3.5" /> Disallow Paths:
                                                    </span>
                                                    <button
                                                        onClick={() => addPathToGroup(gIdx, "disallow", "/")}
                                                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center gap-0.5"
                                                    >
                                                        <Plus className="w-3 h-3" /> Add Disallow
                                                    </button>
                                                </div>
                                                {group.disallow.map((dPath, dIdx) => (
                                                    <div key={dIdx} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={dPath}
                                                            onChange={(e) => updatePathInGroup(gIdx, "disallow", dIdx, e.target.value)}
                                                            placeholder="e.g. /admin/, /*?sort=*"
                                                            className="flex-1 px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:ring-1 focus:ring-rose-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => removePathFromGroup(gIdx, "disallow", dIdx)}
                                                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Allow Rules */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Allow Paths:
                                                    </span>
                                                    <button
                                                        onClick={() => addPathToGroup(gIdx, "allow", "/public/")}
                                                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 cursor-pointer flex items-center gap-0.5"
                                                    >
                                                        <Plus className="w-3 h-3" /> Add Allow
                                                    </button>
                                                </div>
                                                {group.allow.map((aPath, aIdx) => (
                                                    <div key={aIdx} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={aPath}
                                                            onChange={(e) => updatePathInGroup(gIdx, "allow", aIdx, e.target.value)}
                                                            placeholder="e.g. /, /public/"
                                                            className="flex-1 px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => removePathFromGroup(gIdx, "allow", aIdx)}
                                                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Crawl Delay */}
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                                <span className="text-xs font-medium text-slate-600">
                                                    Crawl-Delay (Seconds):
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="60"
                                                    value={group.crawlDelay === undefined ? "" : group.crawlDelay}
                                                    onChange={(e) => handleCrawlDelayInput(e.target.value, gIdx)}
                                                    placeholder="None"
                                                    className="w-24 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Global Directives: Sitemaps & Host */}
                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Globe className="w-4 h-4 text-indigo-600" />
                                            XML Sitemap Declarations
                                        </label>
                                        <button
                                            onClick={addSitemap}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Sitemap
                                        </button>
                                    </div>

                                    {sitemaps.map((sm, smIdx) => (
                                        <div key={smIdx} className="flex items-center gap-2">
                                            <input
                                                type="url"
                                                value={sm}
                                                onChange={(e) => updateSitemap(smIdx, e.target.value)}
                                                placeholder="https://example.com/sitemap.xml"
                                                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            {sitemaps.length > 1 && (
                                                <button
                                                    onClick={() => removeSitemap(smIdx)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Cpu className="w-4 h-4 text-indigo-600" />
                                            Host Directive (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={host}
                                            onChange={(e) => setHost(e.target.value)}
                                            placeholder="example.com"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Direct Raw Textarea Mode */
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Direct robots.txt Buffer (Paste or Type Freely)
                                </label>
                                <textarea
                                    value={rawRobotsTxt}
                                    onChange={(e) => setRawRobotsTxt(e.target.value)}
                                    rows={18}
                                    className="w-full p-4 rounded-xl font-mono text-xs leading-relaxed bg-slate-900 text-indigo-300 border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                                    placeholder="User-agent: *&#10;Disallow: /admin/&#10;Sitemap: https://..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Left Panel Footer Actions */}
                    <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => {
                                setGroups(PRESETS[0].groups as RuleGroup[]);
                                setSitemaps(["https://example.com/sitemap.xml"]);
                                setHost("example.com");
                                setRawRobotsTxt("");
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reset Generator
                        </button>
                        <span className="text-xs text-slate-400 ml-auto">
                            {groups.length} User-Agent block{groups.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Code & Interactive RFC 9309 Tester */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-indigo-600" />
                                Production Output & Validator
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyCode}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                                <button
                                    onClick={handleDownloadFile}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </button>
                            </div>
                        </div>

                        {/* Interactive URL Tester / Simulator Bar */}
                        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Search className="w-4 h-4 text-indigo-600" />
                                    RFC 9309 URL Crawl Tester
                                </span>
                                <span className="text-[11px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                                    Real-time Match
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-1">
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Bot Crawler:</label>
                                    <select
                                        value={testBot}
                                        onChange={(e) => setTestBot(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="Googlebot">Googlebot</option>
                                        <option value="Bingbot">Bingbot</option>
                                        <option value="GPTBot">GPTBot (ChatGPT)</option>
                                        <option value="ClaudeBot">ClaudeBot</option>
                                        <option value="PerplexityBot">PerplexityBot</option>
                                        <option value="CCBot">CCBot</option>
                                        <option value="AhrefsBot">AhrefsBot</option>
                                        <option value="*">Generic (*)</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">URL Path to Test:</label>
                                    <input
                                        type="text"
                                        value={testUrlPath}
                                        onChange={(e) => setTestUrlPath(e.target.value)}
                                        placeholder="/admin/users or /blog/post-1"
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Live Crawl Verdict Result */}
                            <div className={`p-3 rounded-xl border flex items-center justify-between ${validationAnalysis.testResult.verdict === "ALLOWED"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                    : "bg-rose-50 border-rose-200 text-rose-900"
                                }`}>
                                <div className="flex items-center gap-2">
                                    {validationAnalysis.testResult.verdict === "ALLOWED" ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    ) : (
                                        <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                                    )}
                                    <div>
                                        <p className="text-xs font-bold">
                                            Status: <span className="uppercase">{validationAnalysis.testResult.verdict}</span> for {testBot}
                                        </p>
                                        <p className="text-[11px] opacity-80">
                                            {validationAnalysis.testResult.matchedRule
                                                ? `Matched directive: "${validationAnalysis.testResult.matchedRule.type}: ${validationAnalysis.testResult.matchedRule.path}" (Line ${validationAnalysis.testResult.matchedRule.lineNum})`
                                                : "No specific rule matched (Defaults to Allowed)"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Syntax Analysis / Diagnostics Box */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    Syntax Integrity & Diagnostics
                                </span>
                                <span>
                                    {validationAnalysis.syntaxErrors.length === 0 ? (
                                        <span className="text-emerald-600 font-bold">100% Clean Syntax</span>
                                    ) : (
                                        <span className="text-rose-600 font-bold">{validationAnalysis.syntaxErrors.length} Warning(s)</span>
                                    )}
                                </span>
                            </div>

                            {validationAnalysis.syntaxErrors.length > 0 && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-800">
                                    {validationAnalysis.syntaxErrors.map((err, eIdx) => (
                                        <div key={eIdx} className="flex items-start gap-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
                                            <span><strong>Line {err.line}:</strong> {err.message} (<code className="font-mono bg-rose-100 px-1 rounded">{err.text}</code>)</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Raw Code Preview Terminal */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span>File Preview (robots.txt)</span>
                                <span className="font-mono text-[11px] text-slate-400">Encoding: UTF-8</span>
                            </div>
                            <pre className="p-4 rounded-xl font-mono text-xs leading-relaxed bg-slate-950 text-indigo-300 border border-slate-800 overflow-x-auto max-h-[320px] select-all">
                                {activeRobotsText}
                            </pre>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            RFC 9309 Compliant
                        </span>
                        <span>TwisterTools Engine 2.0</span>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Architectural Foundations & RFC 9309 Standards */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Robots Exclusion Protocol (RFC 9309) & Search Engine Crawl Mechanics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <strong>Robots Exclusion Protocol (REP)</strong>, formalized as an official Internet standard in <strong>IETF RFC 9309</strong>, establishes how automated web agents (such as Googlebot, Bingbot, and AI LLM crawlers) interact with web properties. A website's <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">robots.txt</code> file acts as the primary gateway, instructing crawlers on which resource paths may be fetched and indexed into search engine databases.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To function properly, the file must always reside at the absolute root of the domain origin (e.g., <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">https://example.com/robots.txt</code>) and be served with a <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">text/plain</code> Content-Type encoded in standard UTF-8. Subdirectories (such as <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">example.com/blog/robots.txt</code>) are ignored by search engines.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" /> RFC 9309 Longest-Match Resolution
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When a URL path matches both an <code className="font-mono text-xs bg-slate-200 px-1 rounded">Allow:</code> and a <code className="font-mono text-xs bg-slate-200 px-1 rounded">Disallow:</code> directive, crawlers determine the winner by the longest character length of the matched path. If pattern lengths are identical, the <strong>Allow</strong> directive wins.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-indigo-600" /> Crawl Access vs. Indexation Shield
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Blocking a page in <code className="font-mono text-xs bg-slate-200 px-1 rounded">robots.txt</code> prevents bots from crawling its HTML, but Google may still index the bare URL if external backlinks point to it. To guarantee total de-indexing, remove the robots.txt disallow and use a <code className="font-mono text-xs bg-slate-200 px-1 rounded">noindex</code> robots meta tag.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: AI Crawler Control & Intellectual Property Protection */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            AI Scraping Governance & Major LLM Crawler User-Agents
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        With the rise of Generative AI, modern websites require differentiated bot management. Blocking AI scraping bots allows publishers to safeguard copyright and intellectual property without sacrificing organic Google and Bing search rankings.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Organization / Platform</th>
                                    <th className="p-3">User-Agent Token</th>
                                    <th className="p-3">Crawler Purpose</th>
                                    <th className="p-3">Disallow Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">OpenAI (ChatGPT)</td>
                                    <td className="p-3 font-mono text-indigo-600">GPTBot</td>
                                    <td className="p-3">Foundation model training datasets</td>
                                    <td className="p-3 text-emerald-700 font-bold">Blocks AI Training Only</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">OpenAI (Browsing)</td>
                                    <td className="p-3 font-mono text-indigo-600">ChatGPT-User</td>
                                    <td className="p-3">Real-time user queries inside ChatGPT</td>
                                    <td className="p-3 text-slate-600 font-bold">Blocks Live Chat Retrieval</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Anthropic (Claude)</td>
                                    <td className="p-3 font-mono text-indigo-600">ClaudeBot</td>
                                    <td className="p-3">Claude model training & web scraping</td>
                                    <td className="p-3 text-emerald-700 font-bold">Blocks AI Training Only</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Perplexity AI</td>
                                    <td className="p-3 font-mono text-indigo-600">PerplexityBot</td>
                                    <td className="p-3">Real-time AI search indexing & scraping</td>
                                    <td className="p-3 text-amber-700 font-bold">Excludes from Perplexity</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Google Gemini & Vertex</td>
                                    <td className="p-3 font-mono text-indigo-600">Google-Extended</td>
                                    <td className="p-3">Gemini model training datasets</td>
                                    <td className="p-3 text-emerald-700 font-bold">Does Not Hurt Google SEO</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Common Crawl</td>
                                    <td className="p-3 font-mono text-indigo-600">CCBot</td>
                                    <td className="p-3">Open-source web archive used by AI labs</td>
                                    <td className="p-3 text-emerald-700 font-bold">Blocks Global AI Datasets</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Directives, Wildcards & Syntax Master Reference */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Directives, Pattern Wildcards & Syntax Reference
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern search engine crawlers support pattern matching with asterisks (<code className="font-mono text-xs bg-slate-200 px-1 rounded">*</code>) and end-of-URL anchors (<code className="font-mono text-xs bg-slate-200 px-1 rounded">$</code>). Leverage these standard syntax rules to manage complex URL architectures:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Disallow URL Query Parameters</h3>
                            <div className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg font-mono text-xs">
                                User-agent: *<br />
                                Disallow: /*?*<br />
                                Disallow: /*?sort=*
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Prevents crawling of duplicate faceted navigation and sorting parameters while keeping canonical URLs indexable.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Block Specific File Extensions</h3>
                            <div className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg font-mono text-xs">
                                User-agent: *<br />
                                Disallow: /*.pdf$<br />
                                Disallow: /*.zip$
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The <code className="font-mono text-xs bg-slate-200 px-1 rounded">$</code> anchor signifies the exact end of the path string, protecting PDFs and archive downloads from indexing.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Allow Single Subfolder Within Disallowed Tree</h3>
                            <div className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg font-mono text-xs">
                                User-agent: *<br />
                                Disallow: /private/<br />
                                Allow: /private/public-press-kit/
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Longest-match RFC 9309 resolution ensures the specific allow path takes precedence over the parent directory block.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Multiple Sitemap Indexing</h3>
                            <div className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg font-mono text-xs">
                                Sitemap: https://example.com/sitemap.xml<br />
                                Sitemap: https://example.com/blog-sitemap.xml
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                You can declare unlimited XML Sitemap endpoints anywhere in your robots.txt to accelerate discovery across large web applications.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Production Deployment Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Terminal className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Production Implementation & Verification Guide
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 1</span>
                            <h3 className="font-bold text-slate-900 text-sm">Generate & Download</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Configure your bot directives, sitemaps, and test paths above. Click <strong>Download robots.txt</strong> to obtain the UTF-8 text file.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 2</span>
                            <h3 className="font-bold text-slate-900 text-sm">Deploy to Public Root</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Upload to your server root directory (e.g. Next.js <code className="font-mono bg-slate-200 px-1 rounded">public/robots.txt</code>, Apache <code className="font-mono bg-slate-200 px-1 rounded">public_html/</code>, or NGINX root).
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 3</span>
                            <h3 className="font-bold text-slate-900 text-sm">Verify in Search Console</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Open Google Search Console &gt; Settings &gt; Robots.txt to verify Googlebot reads the fresh version with HTTP 200 status code.
                            </p>
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
                                What is robots.txt and where must it be hosted?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A robots.txt file is a plain text file placed strictly at the root directory of your website (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">https://example.com/robots.txt</code>). It instructs compliant search engine crawlers, bots, and AI scrapers which URL paths they are allowed or disallowed from accessing according to the Robots Exclusion Protocol.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does robots.txt guarantee that private web pages will not be indexed or seen?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. Robots.txt is an advisory access control for compliant crawlers, not a security firewall. If other public websites link to a disallowed URL, search engines like Google may still index the URL without reading its content. To keep pages strictly confidential or unindexed, use HTTP Authentication, password walls, or the <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;meta name="robots" content="noindex"&gt;</code> tag.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I block modern AI bots like ChatGPT, Claude, and Perplexity?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can declare explicit User-agent rule blocks targeting AI scrapers. For example: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">User-agent: GPTBot</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">User-agent: ClaudeBot</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">User-agent: PerplexityBot</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">User-agent: CCBot</code>, and <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">User-agent: Google-Extended</code> followed by <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Disallow: /</code>. Our generator includes a preconfigured 1-click "Search Allowed + AI Blocked" preset.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does RFC 9309 handle conflicting Allow and Disallow rules?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Under the official RFC 9309 Robots Exclusion Protocol specification, crawlers evaluate path rules using longest-match precedence. If both an Allow and Disallow rule match a URL path, the rule with the longest character pattern wins. If both patterns have identical lengths, the Allow rule takes priority.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Crawl-delay directive and is it supported by Google?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Crawl-delay directive instructs bots to wait a specified number of seconds between successive requests to prevent server overloading. It is supported by Bingbot, Yandex, and Baidu, but Googlebot does not recognize Crawl-delay in robots.txt (Google manages crawl rates dynamically through Google Search Console).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I use wildcard asterisks (*) and dollar signs ($) in robots.txt?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The asterisk (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">*</code>) matches any sequence of zero or more characters (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Disallow: /*?sort=*</code>), while the dollar sign (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">$</code>) anchors the end of a URL pattern (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Disallow: /*.pdf$</code> to block all PDF files).
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}