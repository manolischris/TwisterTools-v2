"use client";

import React, { useState, useMemo, useId } from "react";
import {
    ShieldCheck,
    Copy,
    Check,
    Sliders,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Mail,
    Terminal,
    Layers,
    RotateCcw,
    ShieldAlert,
    Sparkles,
    FileCheck,
    Info,
    ExternalLink
} from "lucide-react";

type DmarcPolicy = "none" | "quarantine" | "reject";
type SubdomainPolicy = "default" | "none" | "quarantine" | "reject";
type AlignmentMode = "r" | "s"; // r = relaxed, s = strict
type ReportingInterval = 86400 | 172800 | 604800; // 24h, 48h, 7d in seconds

export default function DmarcRecordGenerator() {
    // Form States
    const [domain, setDomain] = useState<string>("example.com");
    const [policy, setPolicy] = useState<DmarcPolicy>("none");
    const [subdomainPolicy, setSubdomainPolicy] = useState<SubdomainPolicy>("default");
    const [percentage, setPercentage] = useState<number>(100);
    const [ruaEmail, setRuaEmail] = useState<string>("dmarc-reports@example.com");
    const [rufEmail, setRufEmail] = useState<string>("");
    const [dkimAlignment, setDkimAlignment] = useState<AlignmentMode>("r");
    const [spfAlignment, setSpfAlignment] = useState<AlignmentMode>("r");
    const [reportInterval, setReportInterval] = useState<ReportingInterval>(86400);
    const [includeForensicOptions, setIncludeForensicOptions] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    // Form element IDs for WCAG accessibility
    const domainInputId = useId();
    const policySelectId = useId();
    const subPolicySelectId = useId();
    const percentageInputId = useId();
    const ruaInputId = useId();
    const rufInputId = useId();
    const dkimSelectId = useId();
    const spfSelectId = useId();
    const intervalSelectId = useId();

    // Sanitize domain name input
    const cleanDomain = useMemo(() => {
        let cleaned = domain.trim().toLowerCase();
        cleaned = cleaned.replace(/^https?:\/\//, "");
        cleaned = cleaned.replace(/\/.*$/, "");
        return cleaned || "example.com";
    }, [domain]);

    // Handle percentage input without leading zeroes
    const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setPercentage(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        if (isNaN(num)) {
            setPercentage(0);
        } else if (num > 100) {
            setPercentage(100);
        } else if (num < 0) {
            setPercentage(0);
        } else {
            setPercentage(num);
        }
    };

    // Calculate formatted DMARC TXT record
    const dmarcRecord = useMemo(() => {
        const tags: string[] = ["v=DMARC1", `p=${policy}`];

        if (subdomainPolicy !== "default") {
            tags.push(`sp=${subdomainPolicy}`);
        }

        if (percentage < 100) {
            tags.push(`pct=${percentage}`);
        }

        if (ruaEmail.trim()) {
            const emails = ruaEmail
                .split(/[\s,]+/)
                .filter(Boolean)
                .map((mail) => (mail.startsWith("mailto:") ? mail : `mailto:${mail}`));
            if (emails.length > 0) {
                tags.push(`rua=${emails.join(",")}`);
            }
        }

        if (rufEmail.trim()) {
            const emails = rufEmail
                .split(/[\s,]+/)
                .filter(Boolean)
                .map((mail) => (mail.startsWith("mailto:") ? mail : `mailto:${mail}`));
            if (emails.length > 0) {
                tags.push(`ruf=${emails.join(",")}`);
            }
        }

        if (dkimAlignment === "s") {
            tags.push("adkim=s");
        }

        if (spfAlignment === "s") {
            tags.push("aspf=s");
        }

        if (reportInterval !== 86400) {
            tags.push(`ri=${reportInterval}`);
        }

        if (includeForensicOptions && rufEmail.trim()) {
            tags.push("fo=1");
        }

        return tags.join("; ");
    }, [
        policy,
        subdomainPolicy,
        percentage,
        ruaEmail,
        rufEmail,
        dkimAlignment,
        spfAlignment,
        reportInterval,
        includeForensicOptions
    ]);

    const dmarcHost = `_dmarc.${cleanDomain}`;

    const handleCopy = () => {
        if (!dmarcRecord) return;
        navigator.clipboard.writeText(dmarcRecord);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setDomain("example.com");
        setPolicy("none");
        setSubdomainPolicy("default");
        setPercentage(100);
        setRuaEmail("dmarc-reports@example.com");
        setRufEmail("");
        setDkimAlignment("r");
        setSpfAlignment("r");
        setReportInterval(86400);
        setIncludeForensicOptions(false);
    };

    const loadPreset = (preset: "monitoring" | "quarantine" | "strict") => {
        if (preset === "monitoring") {
            setPolicy("none");
            setSubdomainPolicy("default");
            setPercentage(100);
            setDkimAlignment("r");
            setSpfAlignment("r");
            setReportInterval(86400);
        } else if (preset === "quarantine") {
            setPolicy("quarantine");
            setSubdomainPolicy("quarantine");
            setPercentage(100);
            setDkimAlignment("r");
            setSpfAlignment("r");
            setReportInterval(86400);
        } else if (preset === "strict") {
            setPolicy("reject");
            setSubdomainPolicy("reject");
            setPercentage(100);
            setDkimAlignment("s");
            setSpfAlignment("s");
            setReportInterval(86400);
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "DMARC Policy TXT Record Formatter & Reporting Tool",
        "url": "https://twistertools.com/tools/web-tools/dmarc-record-generator",
        "description": "Generate RFC 7489 compliant DMARC TXT records with custom policy levels, aggregate rua and forensic ruf reporting tags, and DKIM/SPF alignment.",
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
                "name": "What is a DMARC TXT record and why is it mandatory?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "DMARC (Domain-based Message Authentication, Reporting, and Conformance) is an email authentication protocol defined in RFC 7489. It builds on SPF and DKIM to tell receiving mail exchangers how to handle messages that fail authentication. Google and Yahoo enforce mandatory DMARC records for bulk senders to prevent domain spoofing and phishing."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between p=none, p=quarantine, and p=reject?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The p tag specifies the receiver policy. 'p=none' monitors email flows and delivers unauthenticated messages while generating XML telemetry reports. 'p=quarantine' diverts unverified emails to the spam or junk folder. 'p=reject' instructs the receiving MTA to drop unauthenticated messages entirely at the SMTP envelope layer."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between rua and ruf reporting tags?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The rua tag defines the destination for Aggregate Reports, which are daily XML documents containing aggregate pass/fail statistics across all sending IP addresses. The ruf tag requests Forensic (Failure) Reports, which send real-time redacted copies of individual messages that failed SPF or DKIM alignment."
                }
            },
            {
                "@type": "Question",
                "name": "What is the correct DNS Host or Name for a DMARC record?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A DMARC record must be published as a DNS TXT record under the subdomain '_dmarc.yourdomain.com'. In most DNS control panels (such as Cloudflare, Route 53, or GoDaddy), enter '_dmarc' in the Name/Host field."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between relaxed (r) and strict (s) alignment?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Relaxed alignment (adkim=r, aspf=r) permits subdomains to match the parent organizational domain in the From header. Strict alignment (adkim=s, aspf=s) requires the d= domain in DKIM or the Return-Path domain in SPF to exactly match the From header domain byte-for-byte."
                }
            },
            {
                "@type": "Question",
                "name": "How does the percentage (pct) tag safeguard email delivery during migration?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The pct tag instructs receiving mail servers to apply the policy (quarantine or reject) to only a fraction of failing messages (e.g., pct=20). The remaining percentage defaults to p=none. This enables organizations to test enforcement safely without risking complete outbound email loss."
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
                {/* Left Panel: Configuration Controls (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            DMARC Record Parameters
                        </h2>
                    </div>

                    {/* Preset Action Buttons (Full width, 3 equal columns) */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => loadPreset("monitoring")}
                            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-center"
                        >
                            Monitor
                        </button>
                        <button
                            type="button"
                            onClick={() => loadPreset("quarantine")}
                            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-center"
                        >
                            Quarantine
                        </button>
                        <button
                            type="button"
                            onClick={() => loadPreset("strict")}
                            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer text-center"
                        >
                            Strict Reject
                        </button>
                    </div>

                    {/* Domain Input */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor={domainInputId}
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                        >
                            Apex Domain Name:
                        </label>
                        <input
                            id={domainInputId}
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="example.com"
                            aria-label="Target domain name for DMARC record"
                            className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        />
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Enter your base domain without protocol prefixes or trailing slashes.
                        </p>
                    </div>

                    {/* Policy Selection (p tag) */}
                    <div className="space-y-2">
                        <label
                            htmlFor={policySelectId}
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                        >
                            Receiver Policy (p tag):
                        </label>
                        <select
                            id={policySelectId}
                            value={policy}
                            onChange={(e) => setPolicy(e.target.value as DmarcPolicy)}
                            aria-label="DMARC receiver policy level"
                            className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        >
                            <option value="none">none - Monitor only; deliver unauthenticated emails normally</option>
                            <option value="quarantine">quarantine - Divert unauthenticated messages to Spam/Junk</option>
                            <option value="reject">reject - Direct MTAs to drop unauthenticated messages immediately</option>
                        </select>
                    </div>

                    {/* Subdomain Policy (sp tag) & Percentage (pct tag) Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label
                                htmlFor={subPolicySelectId}
                                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Subdomain Policy (sp):
                            </label>
                            <select
                                id={subPolicySelectId}
                                value={subdomainPolicy}
                                onChange={(e) => setSubdomainPolicy(e.target.value as SubdomainPolicy)}
                                aria-label="DMARC subdomain policy"
                                className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            >
                                <option value="default">Inherit Primary Policy</option>
                                <option value="none">none</option>
                                <option value="quarantine">quarantine</option>
                                <option value="reject">reject</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor={percentageInputId}
                                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Enforcement % (pct):
                            </label>
                            <input
                                id={percentageInputId}
                                type="number"
                                min={0}
                                max={100}
                                value={percentage}
                                onChange={handlePercentageChange}
                                aria-label="Enforcement percentage tag"
                                className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Reporting URIs (rua & ruf) */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1.5">
                            <label
                                htmlFor={ruaInputId}
                                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Aggregate XML Report Email (rua):
                            </label>
                            <input
                                id={ruaInputId}
                                type="text"
                                value={ruaEmail}
                                onChange={(e) => setRuaEmail(e.target.value)}
                                placeholder="dmarc-rua@example.com"
                                aria-label="Aggregate report mailto address"
                                className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                Multiple addresses may be separated by commas. &ldquo;mailto:&rdquo; prefix is appended automatically.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor={rufInputId}
                                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Forensic Failure Report Email (ruf) - Optional:
                            </label>
                            <input
                                id={rufInputId}
                                type="text"
                                value={rufEmail}
                                onChange={(e) => setRufEmail(e.target.value)}
                                placeholder="dmarc-ruf@example.com"
                                aria-label="Forensic failure report mailto address"
                                className="w-full px-3.5 py-2.5 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Alignment Modes & Intervals */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1.5">
                            <label
                                htmlFor={dkimSelectId}
                                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                            >
                                DKIM Alignment:
                            </label>
                            <select
                                id={dkimSelectId}
                                value={dkimAlignment}
                                onChange={(e) => setDkimAlignment(e.target.value as AlignmentMode)}
                                aria-label="DKIM alignment mode"
                                className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="r">Relaxed (r)</option>
                                <option value="s">Strict (s)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor={spfSelectId}
                                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                            >
                                SPF Alignment:
                            </label>
                            <select
                                id={spfSelectId}
                                value={spfAlignment}
                                onChange={(e) => setSpfAlignment(e.target.value as AlignmentMode)}
                                aria-label="SPF alignment mode"
                                className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="r">Relaxed (r)</option>
                                <option value="s">Strict (s)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor={intervalSelectId}
                                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Report Interval:
                            </label>
                            <select
                                id={intervalSelectId}
                                value={reportInterval}
                                onChange={(e) => setReportInterval(Number(e.target.value) as ReportingInterval)}
                                aria-label="Reporting interval in seconds"
                                className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value={86400}>24 Hours</option>
                                <option value={172800}>48 Hours</option>
                                <option value={604800}>7 Days</option>
                            </select>
                        </div>
                    </div>

                    {/* Forensic Toggle & Reset Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={includeForensicOptions}
                                onChange={(e) => setIncludeForensicOptions(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                            />
                            <span>Include Failure Options Tag (fo=1)</span>
                        </label>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 transition cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                        </button>
                    </div>
                </div>

                {/* Right Panel: DNS Output & Real-Time Record Verification (Column Span 6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Generated DNS TXT Record
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                RFC 7489 Compliant
                            </span>
                        </div>

                        {/* DNS Entry Details Card */}
                        <div className="space-y-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                                    Record Type:
                                </span>
                                <p className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    TXT
                                </p>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                                    Host / Name:
                                </span>
                                <p className="font-mono text-xs font-bold text-slate-900 dark:text-white select-all">
                                    {dmarcHost}
                                </p>
                            </div>

                            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-2">
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                                    TXT Value / Data:
                                </span>
                                <div className="font-mono text-xs text-indigo-300 break-all select-all leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                                    {dmarcRecord}
                                </div>
                            </div>
                        </div>

                        {/* Record Audit Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Policy
                                </span>
                                <p className={`text-xs font-bold font-mono ${policy === "reject" ? "text-rose-600 dark:text-rose-400" : policy === "quarantine" ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                                    p={policy}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Coverage
                                </span>
                                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                    {percentage}%
                                </p>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    DKIM Mode
                                </span>
                                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                    {dkimAlignment === "s" ? "Strict" : "Relaxed"}
                                </p>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    SPF Mode
                                </span>
                                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                    {spfAlignment === "s" ? "Strict" : "Relaxed"}
                                </p>
                            </div>
                        </div>

                        {/* Copy Action Button */}
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
                                    <span>Copied Record to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-white" />
                                    <span>Copy DMARC TXT Record</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Enforcement Security Notice Banner */}
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong>Security Advisory:</strong> If you are deploying DMARC for the first time, begin with <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">p=none</code>. Review aggregate RUA telemetry for 2 to 4 weeks to identify legitimate third-party senders (SendGrid, Mailchimp, Zendesk) before graduating to <code className="font-mono font-bold">p=quarantine</code> and <code className="font-mono font-bold">p=reject</code>.
                        </p>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: RFC 7489 Anatomy and Architecture */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Anatomy of RFC 7489: How DMARC Enforces Domain Integrity
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Domain-based Message Authentication, Reporting, and Conformance (DMARC) serves as the governance layer across Internet email communication. While SPF verifies sending IP authorization and DKIM guarantees cryptographic message integrity, neither protocol binds those checks directly to the human-readable &ldquo;From&rdquo; address shown in email clients. DMARC resolves this architectural gap through identifier alignment.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Identifier Alignment
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                DMARC verifies that the RFC 5322 From domain matches the domain authenticated by SPF (Return-Path / RFC 5321.MailFrom) and/or the DKIM signature domain (<code className="font-mono text-indigo-600 dark:text-indigo-400">d=</code> tag).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Sender Policy Enforcement
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Domain administrators explicitly dictate the disposition of unauthorized emails: passive monitoring (<code className="font-mono">none</code>), spam folder isolation (<code className="font-mono">quarantine</code>), or boundary SMTP rejection (<code className="font-mono">reject</code>).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Telemetry & Aggregate Data
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Mail Transfer Agents (MTAs) worldwide parse incoming messages and transmit structured XML telemetry reports daily back to the addresses specified in <code className="font-mono text-indigo-600 dark:text-indigo-400">rua</code> tags.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> DMARC Tag Dictionary & Specification Standard
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono text-slate-300">
                                <thead>
                                    <tr className="border-b border-slate-800 text-indigo-300">
                                        <th className="py-2 pr-4 font-bold">Tag</th>
                                        <th className="py-2 pr-4 font-bold">Status</th>
                                        <th className="py-2 font-bold">Functional Purpose</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">v=DMARC1</td>
                                        <td className="py-2 pr-4 text-emerald-400">Mandatory</td>
                                        <td className="py-2">Protocol version specification. Must be first tag in the TXT record.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">p=</td>
                                        <td className="py-2 pr-4 text-emerald-400">Mandatory</td>
                                        <td className="py-2">Primary policy: none, quarantine, or reject.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">rua=</td>
                                        <td className="py-2 pr-4 text-amber-400">Recommended</td>
                                        <td className="py-2">Comma-separated mailto URIs for receiving aggregate XML reports.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">ruf=</td>
                                        <td className="py-2 pr-4 text-slate-400">Optional</td>
                                        <td className="py-2">Comma-separated mailto URIs for granular forensic failure reports.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">sp=</td>
                                        <td className="py-2 pr-4 text-slate-400">Optional</td>
                                        <td className="py-2">Subdomain policy override. Inherits p tag value if omitted.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">pct=</td>
                                        <td className="py-2 pr-4 text-slate-400">Optional</td>
                                        <td className="py-2">Integer percentage (0–100) of failing messages subject to policy enforcement.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">adkim= / aspf=</td>
                                        <td className="py-2 pr-4 text-slate-400">Optional</td>
                                        <td className="py-2">Alignment mode: relaxed (r, default) or strict (s).</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Matrix: Email Authentication Protocol Architecture
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        A robust defensive perimeter against phishing and spoofing requires coordinating SPF, DKIM, and DMARC in unison. Compare how each security standard operates within the email transport pipeline:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Security Protocol</th>
                                    <th className="p-3">RFC Standard</th>
                                    <th className="p-3">Primary Verification Mechanism</th>
                                    <th className="p-3">DNS Host Target</th>
                                    <th className="p-3">Vulnerability / Weakness</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">DMARC</td>
                                    <td className="p-3 font-mono text-xs">RFC 7489</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">From Header Identifier Alignment</td>
                                    <td className="p-3 font-mono text-xs">_dmarc.domain.com</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Requires SPF and DKIM configured first</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">SPF (Sender Policy)</td>
                                    <td className="p-3 font-mono text-xs">RFC 7208</td>
                                    <td className="p-3 text-slate-700 dark:text-slate-300">Envelope Return-Path IP Whitelist</td>
                                    <td className="p-3 font-mono text-xs">@ (Apex)</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Breaks on email forwarding; 10 DNS lookup limit</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">DKIM (DomainKeys)</td>
                                    <td className="p-3 font-mono text-xs">RFC 6376</td>
                                    <td className="p-3 text-slate-700 dark:text-slate-300">Public-Key Cryptographic Signature</td>
                                    <td className="p-3 font-mono text-xs">[selector]._domainkey</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Does not authenticate visible From address alone</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">BIMI (Brand Indicators)</td>
                                    <td className="p-3 font-mono text-xs">Draft RFC</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Visual VMC SVG Avatar in Inbox</td>
                                    <td className="p-3 font-mono text-xs">default._bimi</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Strict prerequisite: DMARC p=quarantine or reject</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5-Step Phased Enforcement Rollout Strategy */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Zero-Downtime Migration: The 5-Stage DMARC Deployment Roadmap
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Jumping straight to a strict reject policy risks blocking legitimate transactional emails from CRM platforms, customer support desks, and marketing automation tools. Follow this production-tested rollout plan:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Deployment Steps
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Phase 1: Telemetry Collection (p=none):</strong> Deploy a monitoring record with a valid <code className="font-mono text-indigo-600 dark:text-indigo-400">rua</code> inbox. Gather reports for 14 to 30 days to map all corporate sending services.
                                </li>
                                <li>
                                    • <strong>Phase 2: Source Remediation:</strong> Update SPF records and configure dedicated DKIM custom domain keys for all authorized SaaS providers (Google Workspace, Microsoft 365, Mailgun, HubSpot).
                                </li>
                                <li>
                                    • <strong>Phase 3: Canary Quarantine (p=quarantine; pct=25):</strong> Apply quarantine enforcement to a conservative 25% of failing mail. Monitor feedback loops for false positives.
                                </li>
                                <li>
                                    • <strong>Phase 4: Full Quarantine (p=quarantine; pct=100):</strong> Protect users by ensuring 100% of unaligned emails route directly to recipient spam folders.
                                </li>
                                <li>
                                    • <strong>Phase 5: Maximum Enforcement (p=reject):</strong> Set reject mode. All unauthorized spoofed emails are dropped at the edge, unlocking eligibility for BIMI verified brand logos.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Configuration Hazards
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Multiple DMARC Records:</strong> Publishing more than one TXT record containing <code className="font-mono">v=DMARC1</code> at the same host invalidates DMARC entirely according to RFC 7489 §6.6.3.
                                </li>
                                <li>
                                    • <strong>Missing mailto: Scheme:</strong> Omitting <code className="font-mono">mailto:</code> before the reporting email in the rua/ruf tags causes receiving MTAs to reject telemetry delivery.
                                </li>
                                <li>
                                    • <strong>Exceeding SPF 10-Lookup Limits:</strong> If your SPF record exceeds 10 DNS lookups, SPF returns PermError, causing DMARC SPF evaluation to fail. Always authenticate DKIM independently.
                                </li>
                                <li>
                                    • <strong>Unmonitored Reporting Inboxes:</strong> High-volume domains receive hundreds of XML attachments daily. Route RUA reports to an automated DMARC analysis tool or dedicated processing mailbox.
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
                                What is a DMARC TXT record and why is it mandatory?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                DMARC (Domain-based Message Authentication, Reporting, and Conformance) is an email authentication protocol defined in RFC 7489. It builds on SPF and DKIM to tell receiving mail exchangers how to handle messages that fail authentication. Google and Yahoo enforce mandatory DMARC records for bulk senders to prevent domain spoofing and phishing.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between p=none, p=quarantine, and p=reject?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The p tag specifies the receiver policy. &ldquo;p=none&rdquo; monitors email flows and delivers unauthenticated messages while generating XML telemetry reports. &ldquo;p=quarantine&rdquo; diverts unverified emails to the spam or junk folder. &ldquo;p=reject&rdquo; instructs the receiving MTA to drop unauthenticated messages entirely at the SMTP envelope layer.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between rua and ruf reporting tags?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The rua tag defines the destination for Aggregate Reports, which are daily XML documents containing aggregate pass/fail statistics across all sending IP addresses. The ruf tag requests Forensic (Failure) Reports, which send real-time redacted copies of individual messages that failed SPF or DKIM alignment.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the correct DNS Host or Name for a DMARC record?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A DMARC record must be published as a DNS TXT record under the subdomain &lsquo;_dmarc.yourdomain.com&rsquo;. In most DNS control panels (such as Cloudflare, Route 53, or GoDaddy), enter &lsquo;_dmarc&rsquo; in the Name/Host field.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between relaxed (r) and strict (s) alignment?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Relaxed alignment (adkim=r, aspf=r) permits subdomains to match the parent organizational domain in the From header. Strict alignment (adkim=s, aspf=s) requires the d= domain in DKIM or the Return-Path domain in SPF to exactly match the From header domain byte-for-byte.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does the percentage (pct) tag safeguard email delivery during migration?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The pct tag instructs receiving mail servers to apply the policy (quarantine or reject) to only a fraction of failing messages (e.g., pct=20). The remaining percentage defaults to p=none. This enables organizations to test enforcement safely without risking complete outbound email loss.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}