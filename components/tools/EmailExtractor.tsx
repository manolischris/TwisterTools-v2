"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Mail,
    Copy,
    Check,
    Download,
    RefreshCw,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Lightbulb,
    AlertTriangle,
    Layers,
    Filter,
    ArrowDownToLine,
    CheckCircle2,
    Sparkles,
    Trash2,
    FileText,
    Globe,
    AtSign
} from "lucide-react";

interface Preset {
    id: string;
    label: string;
    tag: string;
    content: string;
}

const PRESETS: Preset[] = [
    {
        id: "corporate-directory",
        label: "Corporate Directory",
        tag: "Sample Leads",
        content: `Contact our executive team for inquiries:
CEO: john.doe@enterprise-corp.com
Sales Lead: sarah.smith@enterprise-corp.com
Support Desk: support@enterprise-corp.com
Billing Dept: billing@enterprise-corp.com
Invalid / Junk: test@example, admin@@domain.com, contact@domain
Duplicate Entry: john.doe@enterprise-corp.com`
    },
    {
        id: "marketing-list",
        label: "Marketing Outreach",
        tag: "Mixed Text",
        content: `Here are the partner agencies for our campaign:
Media Relations: press@globalmedia.org
Partnerships: alex.jones@globalmedia.org
Ignored format: info(at)globalmedia.org
General Inquiries: hello@startup-hub.io
Duplicate test: hello@startup-hub.io`
    },
    {
        id: "support-tickets",
        label: "Support Ticket Dump",
        tag: "Raw Logs",
        content: `Ticket #1042 submitted by client_lead@techflow.net regarding API token failure.
CC: devops-lead@techflow.net, security@techflow.net
Malformed string: invalid.email@.com
Another valid: contact@techflow.net`
    }
];

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
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function EmailExtractor() {
    // Input State
    const [rawText, setRawText] = useState("");

    // Filtering & Extraction Options
    const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
    const [filterDomain, setFilterDomain] = useState<string>("");
    const [excludeDomain, setExcludeDomain] = useState<string>("");
    const [selectedTLDs, setSelectedTLDs] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"none" | "alpha-asc" | "alpha-desc" | "domain">("none");

    // UI States
    const [copied, setCopied] = useState<boolean>(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Core Email Extraction Logic
    const extractedEmails = useMemo(() => {
        if (!rawText.trim()) return [];

        // Comprehensive RFC 5322 compliant regex for robust email matching
        const emailRegex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;

        const matches = rawText.match(emailRegex) || [];

        // Normalize to lowercase for deduplication and clean processing
        let processed = matches.map((email) => email.trim().toLowerCase());

        // 1. Remove Duplicates if enabled
        if (removeDuplicates) {
            processed = Array.from(new Set(processed));
        }

        // 2. Filter by specific domain if provided
        if (filterDomain.trim()) {
            const targetDomain = filterDomain.trim().toLowerCase();
            processed = processed.filter((email) => email.endsWith(`@${targetDomain}`) || email.includes(`@${targetDomain}`));
        }

        // 3. Exclude specific domain if provided
        if (excludeDomain.trim()) {
            const badDomain = excludeDomain.trim().toLowerCase();
            processed = processed.filter((email) => !email.endsWith(`@${badDomain}`) && !email.includes(`@${badDomain}`));
        }

        // 4. Filter by selected TLDs if any are checked
        if (selectedTLDs.length > 0) {
            processed = processed.filter((email) => {
                return selectedTLDs.some((tld) => email.endsWith(`.${tld}`));
            });
        }

        // 5. Sorting
        if (sortBy === "alpha-asc") {
            processed.sort((a, b) => a.localeCompare(b));
        } else if (sortBy === "alpha-desc") {
            processed.sort((a, b) => b.localeCompare(a));
        } else if (sortBy === "domain") {
            processed.sort((a, b) => {
                const domainA = a.split("@")[1] || "";
                const domainB = b.split("@")[1] || "";
                return domainA.localeCompare(domainB) || a.localeCompare(b);
            });
        }

        return processed;
    }, [rawText, removeDuplicates, filterDomain, excludeDomain, selectedTLDs, sortBy]);

    // Statistics breakdown
    const stats = useMemo(() => {
        const totalFound = extractedEmails.length;
        const uniqueDomains = new Set(extractedEmails.map((e) => e.split("@")[1])).size;
        const freeProvidersCount = extractedEmails.filter((e) => {
            const domain = e.split("@")[1] || "";
            return ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"].includes(domain);
        }).length;
        const corporateCount = totalFound - freeProvidersCount;

        return {
            totalFound,
            uniqueDomains,
            freeProvidersCount,
            corporateCount,
        };
    }, [extractedEmails]);

    const applyPreset = (preset: Preset) => {
        setRawText(preset.content);
        setActivePresetId(preset.id);
    };

    const handleClear = () => {
        setRawText("");
        setActivePresetId(null);
        setFilterDomain("");
        setExcludeDomain("");
        setSelectedTLDs([]);
    };

    const handleCopyResults = () => {
        const textToCopy = extractedEmails.join("\n");
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportTXT = () => {
        const blob = new Blob([extractedEmails.join("\n")], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `extracted_emails_${Date.now()}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCSV = () => {
        const headers = ["Email Address", "Domain", "Provider Type"];
        const rows = extractedEmails.map((email) => {
            const domain = email.split("@")[1] || "";
            const isFree = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"].includes(domain);
            return [email, domain, isFree ? "Webmail / Free" : "Corporate / Custom"];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `extracted_emails_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Email Address Extractor & Scraper",
        "url": "https://twistertools.com/tools/text-tools/email-extractor",
        "description": "Extract, clean, filter, and sort email addresses instantly from raw text, code logs, or unstructured documents directly in your browser.",
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
                "name": "How does the Email Address Extractor work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses robust regular expression matching adhering to RFC 5322 email syntax standards to scan unstructured text and isolate valid email patterns instantly."
                }
            },
            {
                "@type": "Question",
                "name": "Are my pasted documents or lists sent to a server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All text parsing, filtering, and extraction operations execute 100% client-side inside your browser for complete data privacy and security."
                }
            },
            {
                "@type": "Question",
                "name": "Can I filter extracted emails by specific domains?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, you can include specific target domains or exclude unwanted domains using the advanced filtering controls built into the workspace."
                }
            },
            {
                "@type": "Question",
                "name": "How do I export my extracted email list?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can instantly copy the results to your clipboard or download them as a clean TXT or structured CSV file with a single click."
                }
            },
            {
                "@type": "Question",
                "name": "Does the tool automatically remove duplicate emails?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, duplicate removal is enabled by default to ensure your final export contains only unique email addresses."
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
                {/* Left Workspace Panel: Raw Text Input & Presets */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[680px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Source Text Input
                            </h2>
                            {rawText && (
                                <button
                                    onClick={handleClear}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-slate-600">
                            Paste unstructured documents, web pages, source code logs, or contact directories below to extract all valid email addresses.
                        </p>

                        <div className="flex-1 flex flex-col min-h-[280px]">
                            <textarea
                                value={rawText}
                                onChange={(e) => {
                                    setRawText(e.target.value);
                                    setActivePresetId(null);
                                }}
                                placeholder="Paste raw text containing emails here..."
                                className="w-full flex-1 p-3.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[280px]"
                            />
                        </div>

                        {/* Presets Bar */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Load Samples
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Sample Loaded
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Characters: {rawText.length.toLocaleString()}</span>
                        <span className="text-indigo-600 font-semibold">{stats.totalFound} valid emails detected</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Results & Extraction Options */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[680px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <AtSign className="w-5 h-5 text-indigo-600" />
                                Extracted Results ({stats.totalFound})
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyResults}
                                    disabled={extractedEmails.length === 0}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied" : "Copy List"}
                                </button>
                            </div>
                        </div>

                        {/* Filter & Sorting Controls */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filtering & Rules
                                </span>
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={removeDuplicates}
                                        onChange={(e) => setRemoveDuplicates(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    Remove Duplicates
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Include Domain Filter
                                    </label>
                                    <input
                                        type="text"
                                        value={filterDomain}
                                        onChange={(e) => setFilterDomain(e.target.value)}
                                        placeholder="e.g. enterprise-corp.com"
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Exclude Domain
                                    </label>
                                    <input
                                        type="text"
                                        value={excludeDomain}
                                        onChange={(e) => setExcludeDomain(e.target.value)}
                                        placeholder="e.g. example.com"
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] font-bold text-slate-600">Sort Results:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as "none" | "alpha-asc" | "alpha-desc" | "domain")}
                                    className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="none">Default Order</option>
                                    <option value="alpha-asc">Alphabetical (A → Z)</option>
                                    <option value="alpha-desc">Alphabetical (Z → A)</option>
                                    <option value="domain">Group by Domain</option>
                                </select>
                            </div>
                        </div>

                        {/* Results Output Box */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span>Output Preview</span>
                                <span className="text-slate-500 font-normal">{stats.uniqueDomains} unique domains</span>
                            </div>

                            <div className="w-full h-56 p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 bg-slate-50 overflow-y-auto space-y-1">
                                {extractedEmails.length > 0 ? (
                                    extractedEmails.map((email, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-1 px-2 rounded hover:bg-indigo-50/60 transition">
                                            <span className="text-slate-900 font-medium">{email}</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                                {email.split("@")[1]}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 italic">
                                        No email addresses detected yet. Paste text or load a sample.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleExportTXT}
                            disabled={extractedEmails.length === 0}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export .TXT
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={extractedEmails.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-sm transition border border-slate-200 cursor-pointer"
                        >
                            <ArrowDownToLine className="w-4 h-4" /> Export .CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: How Email Extraction Works */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Email Extraction & RFC 5322 Parsing Works
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Extracting email addresses from unstructured sources—such as scraped web pages, customer support ticket logs, or raw code files—requires precise pattern matching. The TwisterTools Email Extractor engine utilizes advanced Regular Expressions (RegEx) calibrated to the <strong>RFC 5322 specification</strong>. This ensures that valid local-part identifiers, alphanumeric symbols, and complex top-level domains are captured accurately while filtering out malformed strings, double "@" symbols, and broken punctuation.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> 100% Client-Side Privacy
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Unlike cloud scrapers that transmit lead lists over external APIs, all parsing, duplicate purging, and domain filtering executes entirely in your browser memory via native JavaScript. Your data never leaves your device.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-indigo-600" /> Automated De-duplication
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Large document dumps often contain repeat mentions of identical contacts. The engine normalizes all matches to lowercase and strips duplicates instantly to deliver clean lead sheets.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Use Cases & Industry Applications */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Professional Use Cases for Email Scraping & Parsing
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Data cleaning and email harvesting play a vital role across multiple technical and business workflows:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Sales Lead Generation</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Harvest contact directories from partner websites, business listings, or event prospectus documents into clean CSV spreadsheets.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Log File Auditing</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Scan server error logs or user registration backups to extract active customer emails for verification and security audits.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Migration Cleanup</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Clean up legacy database exports or messy CRM text dumps by isolating valid addresses and eliminating junk characters.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
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
                                How does the Email Address Extractor work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool uses robust regular expression matching adhering to RFC 5322 email syntax standards to scan unstructured text and isolate valid email patterns instantly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my pasted documents or lists sent to a server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All text parsing, filtering, and extraction operations execute 100% client-side inside your browser for complete data privacy and security.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I filter extracted emails by specific domains?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, you can include specific target domains or exclude unwanted domains using the advanced filtering controls built into the workspace.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I export my extracted email list?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can instantly copy the results to your clipboard or download them as a clean TXT or structured CSV file with a single click.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does the tool automatically remove duplicate emails?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, duplicate removal is enabled by default to ensure your final export contains only unique email addresses.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}