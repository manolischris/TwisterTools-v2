"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Link2,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Globe,
    Code,
    FileCode,
    Layers,
    Terminal,
    ExternalLink,
    ShieldCheck,
    Search,
    RefreshCw,
    Languages,
    Share2,
    FileSpreadsheet,
    Download
} from "lucide-react";

interface AuditWarning {
    type: "error" | "warning" | "info" | "success";
    title: string;
    message: string;
    recommendation: string;
}

interface HreflangPair {
    id: string;
    lang: string;
    url: string;
}

const SAMPLE_CANONICALS = {
    standardEcommerce: {
        pageUrl: "https://www.example.com/shop/apparel/hoodies?sort=price_asc&color=black&session_id=987654321",
        canonicalUrl: "https://example.com/shop/apparel/hoodies",
        enableTrailingSlash: false,
        forceLowerCase: true,
        stripParameters: true,
        keptParameters: "page",
        enableCrossDomain: false,
        targetDomain: "",
        includeOpenGraph: true,
        includeTwitterCard: true,
        includeHttpHeader: true,
        includeRobotsTag: true,
        robotsValue: "index, follow",
        hreflangs: [
            { id: "1", lang: "x-default", url: "https://example.com/shop/apparel/hoodies" },
            { id: "2", lang: "en-us", url: "https://example.com/shop/apparel/hoodies" },
            { id: "3", lang: "es-es", url: "https://example.com/es/shop/apparel/hoodies" }
        ]
    },
    syndicatedArticle: {
        pageUrl: "https://partner-news.org/tech/2026/04/deep-learning-advancements.html",
        canonicalUrl: "https://primary-publisher.com/insights/deep-learning-advancements",
        enableTrailingSlash: false,
        forceLowerCase: true,
        stripParameters: true,
        keptParameters: "",
        enableCrossDomain: true,
        targetDomain: "primary-publisher.com",
        includeOpenGraph: true,
        includeTwitterCard: true,
        includeHttpHeader: true,
        includeRobotsTag: true,
        robotsValue: "index, follow",
        hreflangs: []
    },
    paginationSass: {
        pageUrl: "https://cloudapp.io/blog/?category=engineering&page=3&utm_source=twitter&utm_medium=social",
        canonicalUrl: "https://cloudapp.io/blog?category=engineering&page=3",
        enableTrailingSlash: false,
        forceLowerCase: true,
        stripParameters: false,
        keptParameters: "category, page",
        enableCrossDomain: false,
        targetDomain: "",
        includeOpenGraph: true,
        includeTwitterCard: true,
        includeHttpHeader: false,
        includeRobotsTag: true,
        robotsValue: "index, follow",
        hreflangs: [
            { id: "1", lang: "en", url: "https://cloudapp.io/blog?category=engineering&page=3" }
        ]
    }
};

export default function CanonicalUrlTagBuilder() {
    // Core Form States
    const [pageUrl, setPageUrl] = useState<string>("https://www.example.com/products/wireless-headphones?utm_source=newsletter&utm_medium=email&color=midnight-black");
    const [canonicalUrl, setCanonicalUrl] = useState<string>("https://example.com/products/wireless-headphones");
    const [enableTrailingSlash, setEnableTrailingSlash] = useState<boolean>(false);
    const [forceLowerCase, setForceLowerCase] = useState<boolean>(true);
    const [stripParameters, setStripParameters] = useState<boolean>(true);
    const [keptParameters, setKeptParameters] = useState<string>("page, p");
    const [enableCrossDomain, setEnableCrossDomain] = useState<boolean>(false);
    const [targetDomain, setTargetDomain] = useState<string>("");
    const [includeOpenGraph, setIncludeOpenGraph] = useState<boolean>(true);
    const [includeTwitterCard, setIncludeTwitterCard] = useState<boolean>(true);
    const [includeHttpHeader, setIncludeHttpHeader] = useState<boolean>(true);
    const [includeRobotsTag, setIncludeRobotsTag] = useState<boolean>(true);
    const [robotsValue, setRobotsValue] = useState<string>("index, follow");
    const [hreflangs, setHreflangs] = useState<HreflangPair[]>([
        { id: "1", lang: "x-default", url: "https://example.com/products/wireless-headphones" },
        { id: "2", lang: "en-us", url: "https://example.com/products/wireless-headphones" }
    ]);

    // Active View Tab State
    const [activeOutputTab, setActiveOutputTab] = useState<"html" | "headers" | "htaccess" | "audit">("html");
    const [copied, setCopied] = useState<boolean>(false);

    // Form element IDs for WCAG accessibility
    const pageUrlInputId = useId();
    const canonicalUrlInputId = useId();
    const keptParamsInputId = useId();
    const crossDomainInputId = useId();
    const robotsSelectId = useId();

    // Sanitize and normalize URLs helper
    const sanitizeUrl = (urlStr: string): string => {
        if (!urlStr) return "";
        let working = urlStr.trim();
        if (!/^https?:\/\//i.test(working)) {
            working = "https://" + working;
        }

        try {
            const parsed = new URL(working);
            if (forceLowerCase) {
                parsed.hostname = parsed.hostname.toLowerCase();
                parsed.pathname = parsed.pathname.toLowerCase();
            }

            if (stripParameters) {
                const allowed = keptParameters
                    .split(",")
                    .map((p) => p.trim().toLowerCase())
                    .filter(Boolean);

                const currentParams = new URLSearchParams(parsed.search);
                const nextParams = new URLSearchParams();

                allowed.forEach((param) => {
                    if (currentParams.has(param)) {
                        currentParams.getAll(param).forEach((val) => {
                            nextParams.append(param, val);
                        });
                    }
                });

                parsed.search = nextParams.toString() ? `?${nextParams.toString()}` : "";
            }

            // Trailing slash handling for pathname
            if (parsed.pathname !== "" && parsed.pathname !== "/") {
                if (enableTrailingSlash && !parsed.pathname.endsWith("/")) {
                    parsed.pathname = `${parsed.pathname}/`;
                } else if (!enableTrailingSlash && parsed.pathname.endsWith("/")) {
                    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
                }
            }

            return parsed.toString();
        } catch {
            return urlStr.trim();
        }
    };

    const cleanedCanonicalUrl = useMemo(() => {
        return sanitizeUrl(canonicalUrl);
    }, [canonicalUrl, enableTrailingSlash, forceLowerCase, stripParameters, keptParameters]);

    // Audit and Validation Engine
    const auditDiagnostics = useMemo<AuditWarning[]>(() => {
        const diagnostics: AuditWarning[] = [];
        if (!canonicalUrl.trim()) {
            diagnostics.push({
                type: "error",
                title: "Missing Canonical Target",
                message: "No canonical destination URL was defined.",
                recommendation: "Specify an absolute target URL including https:// protocol."
            });
            return diagnostics;
        }

        try {
            const parsedCanonical = new URL(canonicalUrl.trim());
            const parsedPage = pageUrl.trim() ? new URL(pageUrl.trim().startsWith("http") ? pageUrl.trim() : `https://${pageUrl.trim()}`) : null;

            // 1. Protocol Validation
            if (parsedCanonical.protocol !== "https:") {
                diagnostics.push({
                    type: "warning",
                    title: "Insecure Protocol Specified",
                    message: `Canonical target points to '${parsedCanonical.protocol}//'. Modern search engines strictly prefer HTTPS canonical targets.`,
                    recommendation: "Migrate the target to HTTPS to prevent mixed-signal algorithmic confusion."
                });
            }

            // 2. Relative URL check
            if (!parsedCanonical.hostname) {
                diagnostics.push({
                    type: "error",
                    title: "Relative URL Target Detected",
                    message: "Canonical links should always be absolute URLs. Relative paths can cause crawler loop errors.",
                    recommendation: "Prepend your target domain (e.g., https://example.com/page)."
                });
            }

            // 3. WWW vs Non-WWW Host Discrepancy
            if (parsedPage && parsedPage.hostname !== parsedCanonical.hostname) {
                const pageHasWww = parsedPage.hostname.startsWith("www.");
                const canonHasWww = parsedCanonical.hostname.startsWith("www.");
                const pageBase = parsedPage.hostname.replace(/^www\./, "");
                const canonBase = parsedCanonical.hostname.replace(/^www\./, "");

                if (pageBase === canonBase && pageHasWww !== canonHasWww) {
                    diagnostics.push({
                        type: "warning",
                        title: "Subdomain Mismatch (WWW vs Non-WWW)",
                        message: `The active page uses '${parsedPage.hostname}' while the canonical references '${parsedCanonical.hostname}'.`,
                        recommendation: "Standardize your site-wide internal links and canonical targets to one canonical host variant."
                    });
                } else if (pageBase !== canonBase) {
                    diagnostics.push({
                        type: "info",
                        title: "Cross-Domain Canonical In Effect",
                        message: `The canonical tag points to an external root domain (${parsedCanonical.hostname}).`,
                        recommendation: "Verify that both domains have verified cross-domain authority or syndication agreements."
                    });
                }
            }

            // 4. Query Parameter Check
            if (parsedCanonical.search) {
                diagnostics.push({
                    type: "warning",
                    title: "Query Parameters in Canonical URL",
                    message: `Target includes search parameters (${parsedCanonical.search}). Parameters often indicate duplicate tracking views.`,
                    recommendation: "Strip dynamic or tracking parameters unless essential for distinct content pagination."
                });
            }

            // 5. Trailing Slash Check
            if (parsedPage && parsedCanonical.pathname !== "/") {
                const pageSlash = parsedPage.pathname.endsWith("/");
                const canonSlash = parsedCanonical.pathname.endsWith("/");
                if (pageSlash !== canonSlash) {
                    diagnostics.push({
                        type: "info",
                        title: "Trailing Slash Asymmetry",
                        message: `Current page ${pageSlash ? "has" : "lacks"} a trailing slash, whereas canonical ${canonSlash ? "has" : "lacks"} it.`,
                        recommendation: "Ensure server-side 301 redirects match canonical trailing slash rules to avoid crawl budget wastage."
                    });
                }
            }

            // 6. Robots conflict check
            if (robotsValue.includes("noindex")) {
                diagnostics.push({
                    type: "error",
                    title: "Conflicting Directives: noindex paired with Canonical",
                    message: "A page marked 'noindex' should not designate a canonical tag, as search spiders will ignore the canonical pointer once noindexed.",
                    recommendation: "Use 'index, follow' on canonical targets or remove noindex if consolidating page equity."
                });
            }

            if (diagnostics.filter((d) => d.type === "error").length === 0) {
                diagnostics.push({
                    type: "success",
                    title: "Syntactically Sound Canonical Structure",
                    message: "Target is absolute, follows modern protocol guidelines, and passes core SEO crawl validation criteria.",
                    recommendation: "Proceed with injecting the tags into your HTML head or reverse proxy headers."
                });
            }
        } catch {
            diagnostics.push({
                type: "error",
                title: "Invalid URL Formatting",
                message: "Unable to parse URL structure. Ensure valid RFC 3986 format.",
                recommendation: "Check for unencoded special symbols or invalid domain nomenclature."
            });
        }

        return diagnostics;
    }, [canonicalUrl, pageUrl, robotsValue]);

    // Code Output Generators
    const generatedHtmlCode = useMemo(() => {
        const lines: string[] = [];
        const finalCanonical = cleanedCanonicalUrl || "https://example.com/page";

        lines.push(`<!-- Primary Canonical Link Tag -->`);
        lines.push(`<link rel="canonical" href="${finalCanonical}" />`);

        if (includeRobotsTag) {
            lines.push(``);
            lines.push(`<!-- Search Engine Crawl Directives -->`);
            lines.push(`<meta name="robots" content="${robotsValue}" />`);
        }

        if (includeOpenGraph) {
            lines.push(``);
            lines.push(`<!-- Open Graph Canonical Resolution -->`);
            lines.push(`<meta property="og:url" content="${finalCanonical}" />`);
        }

        if (includeTwitterCard) {
            lines.push(``);
            lines.push(`<!-- Twitter / X Card URL Mapping -->`);
            lines.push(`<meta name="twitter:url" content="${finalCanonical}" />`);
        }

        if (hreflangs.length > 0) {
            lines.push(``);
            lines.push(`<!-- International Hreflang Canonical Alternate Matrix -->`);
            hreflangs.forEach((h) => {
                if (h.lang && h.url) {
                    lines.push(`<link rel="alternate" hreflang="${h.lang.trim()}" href="${h.url.trim()}" />`);
                }
            });
        }

        return lines.join("\n");
    }, [cleanedCanonicalUrl, includeRobotsTag, robotsValue, includeOpenGraph, includeTwitterCard, hreflangs]);

    const generatedHttpHeaderCode = useMemo(() => {
        const finalCanonical = cleanedCanonicalUrl || "https://example.com/page";
        return `# HTTP Response Header Canonical Injection (RFC 5988)\nLink: <${finalCanonical}>; rel="canonical"`;
    }, [cleanedCanonicalUrl]);

    const generatedHtaccessCode = useMemo(() => {
        const finalCanonical = cleanedCanonicalUrl || "https://example.com/page";
        return `# Apache .htaccess / Mod_Headers Canonical Injection for Non-HTML Documents (PDF, XML, JSON)\n<FilesMatch "\\.(pdf|docx|epub|xml)$">\n    Header set Link "<${finalCanonical}>; rel=\\"canonical\\""\n</FilesMatch>`;
    }, [cleanedCanonicalUrl]);

    const handleCopy = () => {
        let textToCopy = generatedHtmlCode;
        if (activeOutputTab === "headers") textToCopy = generatedHttpHeaderCode;
        if (activeOutputTab === "htaccess") textToCopy = generatedHtaccessCode;
        if (activeOutputTab === "audit") {
            textToCopy = auditDiagnostics.map((d) => `[${d.type.toUpperCase()}] ${d.title}: ${d.message} -> ${d.recommendation}`).join("\n");
        }

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLoadSample = (sampleKey: "standardEcommerce" | "syndicatedArticle" | "paginationSass") => {
        const sample = SAMPLE_CANONICALS[sampleKey];
        setPageUrl(sample.pageUrl);
        setCanonicalUrl(sample.canonicalUrl);
        setEnableTrailingSlash(sample.enableTrailingSlash);
        setForceLowerCase(sample.forceLowerCase);
        setStripParameters(sample.stripParameters);
        setKeptParameters(sample.keptParameters);
        setEnableCrossDomain(sample.enableCrossDomain);
        setTargetDomain(sample.targetDomain);
        setIncludeOpenGraph(sample.includeOpenGraph);
        setIncludeTwitterCard(sample.includeTwitterCard);
        setIncludeHttpHeader(sample.includeHttpHeader);
        setIncludeRobotsTag(sample.includeRobotsTag);
        setRobotsValue(sample.robotsValue);
        setHreflangs(sample.hreflangs);
    };

    const handleClear = () => {
        setPageUrl("");
        setCanonicalUrl("");
        setKeptParameters("");
        setTargetDomain("");
        setHreflangs([]);
    };

    const addHreflangRow = () => {
        setHreflangs((prev) => [
            ...prev,
            { id: Date.now().toString(), lang: "", url: "" }
        ]);
    };

    const updateHreflangRow = (id: string, field: "lang" | "url", value: string) => {
        setHreflangs((prev) =>
            prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    const removeHreflangRow = (id: string) => {
        setHreflangs((prev) => prev.filter((row) => row.id !== id));
    };

    // JSON-LD Schemas for High Authority SEO
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Canonical URL Link Tag & Cross-Domain Audit Formatter",
        "url": "https://twistertools.com/tools/web-tools/canonical-url-tag-builder",
        "description": "Generate, sanitize, and validate search engine canonical link tags, HTTP response headers, hreflang clusters, and cross-domain rel=canonical markup with instant SEO audit diagnostics.",
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
                "name": "What is a canonical URL tag and why is it required for SEO?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A canonical tag (rel='canonical') is an HTML header directive telling search engines like Google, Bing, and Yandex which specific URL represents the master, primary, or definitive version of a web page. It prevents split page-rank equity, consolidates duplicate content created by faceted navigation and UTM tracking codes, and guarantees ranking authority is channeled to your preferred URL."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a self-referential canonical and a cross-domain canonical?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A self-referential canonical points a page's canonical tag directly to its own clean, normalized URL, safeguarding it against unexpected tracking parameters. A cross-domain canonical points to a different domain altogether, widely utilized in content syndication, corporate acquisitions, and multi-brand publishing to transfer 100% of indexation credit to the original publication source."
                }
            },
            {
                "@type": "Question",
                "name": "Should canonical link tags be absolute or relative URLs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Canonical URLs should always be absolute (e.g., https://example.com/category/product) rather than relative (/product). Search engine crawlers can misinterpret relative paths when resolving international subfolders, staging environments, or alternate CDN subdomains, causing indexing dropouts."
                }
            },
            {
                "@type": "Question",
                "name": "How do canonical tags interact with 301 redirects and noindex directives?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A canonical tag is a soft recommendation (a hint), whereas a 301 HTTP redirect is a strict command forcing users and bots to the new location. You should never pair rel='canonical' with a 'noindex' robots tag on the same target, as the noindex directive signals crawlers to omit the page from the index entirely, discarding the canonical consolidation signal."
                }
            },
            {
                "@type": "Question",
                "name": "How do you specify canonical URLs for non-HTML assets like PDF whitepapers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Non-HTML files such as PDFs, Word documents, and spreadsheets cannot include HTML head tags. Instead, canonicalization is accomplished via HTTP Response Headers using RFC 5988 syntax: Link: <https://example.com/whitepapers/report.pdf>; rel='canonical', configured through your web server (Apache .htaccess, Nginx, Cloudflare Workers, or AWS CloudFront)."
                }
            },
            {
                "@type": "Question",
                "name": "Does Google guarantee that it will honor the rel=canonical tag?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Google treats rel='canonical' as a strong suggestion, not an absolute directive. If the target page returns a 404 error, has conflicting internal links, mismatches HTTP/HTTPS protocols, or contains substantially divergent content, Google's algorithms will discard the specified canonical and autonomously select an alternate canonical URL."
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

            {/* 12-Column Responsive Symmetrical Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Parameters (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            URL Audit &amp; Canonical Rules
                        </h2>
                    </div>

                    {/* Preset Sample Buttons Grid (Full Width, 1/3 each) */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => handleLoadSample("standardEcommerce")}
                            className="w-full py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer text-center"
                        >
                            E-Comm
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLoadSample("syndicatedArticle")}
                            className="w-full py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer text-center"
                        >
                            Cross-Domain
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLoadSample("paginationSass")}
                            className="w-full py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer text-center"
                        >
                            Paginated
                        </button>
                    </div>

                    {/* Active URL & Canonical Destination Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor={pageUrlInputId} className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                Active Page URL (Current URL with tracking or facets):
                            </label>
                            <div className="relative">
                                <input
                                    id={pageUrlInputId}
                                    type="text"
                                    aria-label="Active current page URL"
                                    value={pageUrl}
                                    onChange={(e) => setPageUrl(e.target.value)}
                                    placeholder="https://example.com/shop/item?utm_source=adwords"
                                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor={canonicalUrlInputId} className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                Canonical Destination URL (Master Canonical Entity):
                            </label>
                            <div className="relative">
                                <input
                                    id={canonicalUrlInputId}
                                    type="text"
                                    aria-label="Canonical master target URL"
                                    value={canonicalUrl}
                                    onChange={(e) => setCanonicalUrl(e.target.value)}
                                    placeholder="https://example.com/shop/item"
                                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/20 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* URL Sanitization & Canonical Settings */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Sanitization Rules &amp; Edge Normalization:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={forceLowerCase}
                                    onChange={(e) => setForceLowerCase(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Force Lowercase Host &amp; Path</span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={enableTrailingSlash}
                                    onChange={(e) => setEnableTrailingSlash(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Append Trailing Slash (/)</span>
                            </label>

                            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none sm:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={stripParameters}
                                    onChange={(e) => setStripParameters(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Strip Dynamic &amp; Analytics Query Parameters (UTM, GCLID, Session)</span>
                            </label>
                        </div>

                        {stripParameters && (
                            <div className="pt-1.5 space-y-1">
                                <label htmlFor={keptParamsInputId} className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                    Whitelisted Parameters to Preserve (comma-separated, e.g. page, p, category):
                                </label>
                                <input
                                    id={keptParamsInputId}
                                    type="text"
                                    value={keptParameters}
                                    onChange={(e) => setKeptParameters(e.target.value)}
                                    aria-label="Preserved query parameters"
                                    placeholder="page, category, id"
                                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        )}
                    </div>

                    {/* Metadata Directives Configuration */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Header &amp; Social Synchronization Tags:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeOpenGraph}
                                    onChange={(e) => setIncludeOpenGraph(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600"
                                />
                                <span>Open Graph (og:url)</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeTwitterCard}
                                    onChange={(e) => setIncludeTwitterCard(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600"
                                />
                                <span>Twitter URL Card</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeRobotsTag}
                                    onChange={(e) => setIncludeRobotsTag(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600"
                                />
                                <span>Robots Meta Tag</span>
                            </label>
                        </div>

                        {includeRobotsTag && (
                            <div className="pt-2 flex items-center gap-2.5">
                                <label htmlFor={robotsSelectId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Robots Directive:
                                </label>
                                <select
                                    id={robotsSelectId}
                                    value={robotsValue}
                                    onChange={(e) => setRobotsValue(e.target.value)}
                                    aria-label="Select search robots crawl directive"
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                >
                                    <option value="index, follow">index, follow (Standard)</option>
                                    <option value="noindex, follow">noindex, follow (Drop from SERPs)</option>
                                    <option value="index, nofollow">index, nofollow (Do not follow out)</option>
                                    <option value="noindex, nofollow">noindex, nofollow (Block all)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Hreflang Alternates Configuration */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Languages className="w-3.5 h-3.5 text-indigo-600" />
                                Hreflang Canonical Alternates:
                            </label>
                            <button
                                type="button"
                                onClick={addHreflangRow}
                                className="px-2 py-1 text-[11px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                            >
                                + Add Alternate
                            </button>
                        </div>

                        <div className="space-y-2">
                            {hreflangs.map((h) => (
                                <div key={h.id} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={h.lang}
                                        onChange={(e) => updateHreflangRow(h.id, "lang", e.target.value)}
                                        placeholder="en-us / es / x-default"
                                        aria-label="Hreflang language locale code"
                                        className="w-24 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                    <input
                                        type="text"
                                        value={h.url}
                                        onChange={(e) => updateHreflangRow(h.id, "url", e.target.value)}
                                        placeholder="https://example.com/es/page"
                                        aria-label="Hreflang destination target URL"
                                        className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeHreflangRow(h.id)}
                                        aria-label="Delete hreflang entry"
                                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            {hreflangs.length === 0 && (
                                <p className="text-xs text-slate-500 italic">No localized hreflang alternates configured.</p>
                            )}
                        </div>
                    </div>

                    {/* Reset Controls */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer flex items-center gap-1.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset Form
                        </button>
                    </div>
                </div>

                {/* Right Panel: Code Output & Audit Diagnostics (Column Span 6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        {/* Tab Bar */}
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveOutputTab("html")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeOutputTab === "html"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <Code className="w-3.5 h-3.5" /> HTML Tag
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveOutputTab("headers")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeOutputTab === "headers"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <FileCode className="w-3.5 h-3.5" /> HTTP Header
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveOutputTab("htaccess")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeOutputTab === "htaccess"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <Terminal className="w-3.5 h-3.5" /> .htaccess
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveOutputTab("audit")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeOutputTab === "audit"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <Search className="w-3.5 h-3.5" /> Audit Checks
                                </button>
                            </div>
                        </div>

                        {/* Code Display Area */}
                        {activeOutputTab !== "audit" ? (
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto border border-slate-800 max-h-[360px] min-h-[220px] leading-relaxed select-all">
                                    <pre>
                                        {activeOutputTab === "html" && generatedHtmlCode}
                                        {activeOutputTab === "headers" && generatedHttpHeaderCode}
                                        {activeOutputTab === "htaccess" && generatedHtaccessCode}
                                    </pre>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {activeOutputTab === "html" && "Insert into the <head> segment before any downstream tracking scripts or stylesheets."}
                                    {activeOutputTab === "headers" && "Configured inside edge reverse proxies, Cloudflare Workers, or Nginx server blocks."}
                                    {activeOutputTab === "htaccess" && "Applies canonical header pointers to non-HTML MIME formats like PDFs or images."}
                                </p>
                            </div>
                        ) : (
                            /* Audit Diagnostic Checklist */
                            <div className="space-y-3 min-h-[220px]">
                                {auditDiagnostics.map((diag, index) => (
                                    <div
                                        key={index}
                                        className={`p-3.5 rounded-xl border text-xs space-y-1 ${diag.type === "error"
                                                ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-200"
                                                : diag.type === "warning"
                                                    ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200"
                                                    : diag.type === "info"
                                                        ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-950 dark:text-blue-200"
                                                        : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 font-bold">
                                            {diag.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                                            {diag.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                                            {diag.type === "info" && <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                                            {diag.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                            <span>{diag.title}</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed opacity-90 pl-6">{diag.message}</p>
                                        <p className="text-[11px] font-semibold opacity-100 pl-6 pt-0.5 text-slate-800 dark:text-slate-300">
                                            Action: {diag.recommendation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Normalized Canonical Status Overview Bar */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Resolved Normalized Canonical:
                                </span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                    RFC Compliant
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-indigo-600 dark:text-indigo-400 break-all select-all">
                                {cleanedCanonicalUrl || "Awaiting target URL input..."}
                            </div>
                        </div>

                        {/* Primary Quick Copy Button */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5 text-white" />
                                    <span>Copied to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-white" />
                                    <span>Copy Formatted Code</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: The Canonicalization Protocol Explained */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Canonical URLs Explained: The Mathematical Engine of Search Rank Consolidation
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Modern content management systems, e-commerce faceted filters, tracking scripts, and secure transfer protocols create identical or near-identical duplicate URLs across modern websites. Without explicit canonical orchestration, search spiders evaluate each URL permutation as an independent resource. This dilutes inbound link equity (PageRank) across dozens of duplicate copies and wastes scarce crawler bandwidth.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Link Equity Consolidation
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                When external publishers link to various tracking URLs, campaign UTM links, or faceted parameters, the <code className="font-mono text-indigo-600 dark:text-indigo-400">rel=&quot;canonical&quot;</code> directive instructs Google to funnel 100% of accumulated PageRank into the master destination URL.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Crawl Budget Optimization
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Search bots allocate finite resources to each domain. By signaling the definitive version of e-commerce pages, search engines avoid indexing endless sorting filters (<code className="font-mono text-indigo-600 dark:text-indigo-400">?sort=asc</code>) and focus crawling capacity on net-new indexable content.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Cross-Domain Syndication
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Publishing articles across Medium, Substack, LinkedIn Pulse, or commercial partner domains without cross-domain canonicals creates index collisions. A cross-domain canonical preserves the original author&apos;s definitive SERP ranking authority.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Technical Specification: HTML Head vs HTTP Header Injection
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Websites can declare canonical relationships through two standardized mechanisms depending on the MIME content-type of the target document:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`<!-- 1. HTML DOM Injection (Standard for web pages) -->
<link rel="canonical" href="https://example.com/insights/definitive-guide" />

<!-- 2. HTTP RFC 5988 Header Injection (Required for PDF whitepapers & binary assets) -->
Link: <https://example.com/whitepapers/market-report.pdf>; rel="canonical"`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Architecture: Canonical Tags vs 301 Redirects vs Noindex
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the correct duplicate content mitigation strategy is essential for technical site audits. Each directive serves a unique architectural function:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Methodology</th>
                                    <th className="p-3">Direct Human Visitor Behavior</th>
                                    <th className="p-3">Search Engine Treatment</th>
                                    <th className="p-3">PageRank Transfer</th>
                                    <th className="p-3">Recommended Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">rel=&quot;canonical&quot;</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Remains on current URL (no redirection)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">Consolidates duplicates as a soft hint</td>
                                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">~95% - 100%</td>
                                    <td className="p-3 text-xs">Faceted e-commerce, UTM links, syndicated posts</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">301 Permanent Redirect</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400">Instantly forwarded to target URL</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-semibold">Strict server command to de-index old URL</td>
                                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">~100%</td>
                                    <td className="p-3 text-xs">Site migrations, domain rebrands, deleted articles</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">meta name=&quot;robots&quot; noindex</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Remains on current URL</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-semibold">Permanently purges page from search results</td>
                                    <td className="p-3 font-mono text-rose-600 dark:text-rose-400 font-bold">0% (Lost entirely)</td>
                                    <td className="p-3 text-xs">Internal admin dashboards, thank-you pages</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Robots.txt Disallow</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Remains on current URL</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400 font-semibold">Blocks crawl fetching; URL can still index</td>
                                    <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">0% (Trapped)</td>
                                    <td className="p-3 text-xs">Internal search queries, heavy staging APIs</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5 Critical Rules for Canonical Tag Implementation */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Technical Playbook: 5 Best Practices for Flawless Implementation
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Search spiders execute millions of parsing routines per minute. Violating standard canonical patterns results in Google silently ignoring your directives. Apply these five architectural safeguards:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mandatory Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
                                <li>
                                    • <strong>Always Use Fully Qualified Absolute URLs:</strong> Never declare relative paths like <code className="font-mono text-indigo-600 dark:text-indigo-400">href=&quot;/category/item&quot;</code>. Explicitly state the protocol and domain (<code className="font-mono text-indigo-600 dark:text-indigo-400">https://example.com/category/item</code>) to eliminate crawler ambiguity across alternate environments.
                                </li>
                                <li>
                                    • <strong>Self-Canonicalize Every Unique Page:</strong> Each distinct standalone web page should include a self-referencing canonical pointing to itself. This guards against scraper sites and automatic tracking URL appends by social platforms.
                                </li>
                                <li>
                                    • <strong>Harmonize with Hreflang Clusters:</strong> When implementing multilingual sites, ensure that each hreflang alternate URL points to a canonical tag referencing itself in that respective language directory.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600" /> Severe Mistakes to Prevent
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
                                <li>
                                    • <strong>Never Point Canonicals to 301 Redirects:</strong> Pointing a canonical tag to a URL that immediately triggers a 301 redirect creates a canonical-redirect loop, destroying crawl performance and confusing indexers.
                                </li>
                                <li>
                                    • <strong>Avoid Multiple Canonical Declarations:</strong> If an HTML page contains more than one <code className="font-mono text-indigo-600 dark:text-indigo-400">&lt;link rel=&quot;canonical&quot;&gt;</code> tag (often injected inadvertently by multiple SEO plugins), Google will ignore all declared canonicals completely.
                                </li>
                                <li>
                                    • <strong>Do Not Canonicalize Paginated Series to Page 1:</strong> Pointing Page 2, Page 3, or Page 4 of an archive to Page 1 prevents search engines from indexing downstream articles. Use self-referential canonicals with pagination parameters preserved.
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
                                What is a canonical URL tag and why is it required for SEO?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A canonical tag (rel=&quot;canonical&quot;) is an HTML header directive telling search engines like Google, Bing, and Yandex which specific URL represents the master, primary, or definitive version of a web page. It prevents split page-rank equity, consolidates duplicate content created by faceted navigation and UTM tracking codes, and guarantees ranking authority is channeled to your preferred URL.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between a self-referential canonical and a cross-domain canonical?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A self-referential canonical points a page&apos;s canonical tag directly to its own clean, normalized URL, safeguarding it against unexpected tracking parameters. A cross-domain canonical points to a different domain altogether, widely utilized in content syndication, corporate acquisitions, and multi-brand publishing to transfer 100% of indexation credit to the original publication source.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Should canonical link tags be absolute or relative URLs?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Canonical URLs should always be absolute (e.g., https://example.com/category/product) rather than relative (/product). Search engine crawlers can misinterpret relative paths when resolving international subfolders, staging environments, or alternate CDN subdomains, causing indexing dropouts.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do canonical tags interact with 301 redirects and noindex directives?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A canonical tag is a soft recommendation (a hint), whereas a 301 HTTP redirect is a strict command forcing users and bots to the new location. You should never pair rel=&quot;canonical&quot; with a &apos;noindex&apos; robots tag on the same target, as the noindex directive signals crawlers to omit the page from the index entirely, discarding the canonical consolidation signal.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do you specify canonical URLs for non-HTML assets like PDF whitepapers?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Non-HTML files such as PDFs, Word documents, and spreadsheets cannot include HTML head tags. Instead, canonicalization is accomplished via HTTP Response Headers using RFC 5988 syntax: Link: &lt;https://example.com/whitepapers/report.pdf&gt;; rel=&quot;canonical&quot;, configured through your web server (Apache .htaccess, Nginx, Cloudflare Workers, or AWS CloudFront).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does Google guarantee that it will honor the rel=canonical tag?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. Google treats rel=&quot;canonical&quot; as a strong suggestion, not an absolute directive. If the target page returns a 404 error, has conflicting internal links, mismatches HTTP/HTTPS protocols, or contains substantially divergent content, Google&apos;s algorithms will discard the specified canonical and autonomously select an alternate canonical URL.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}