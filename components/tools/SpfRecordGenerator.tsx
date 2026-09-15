"use client";

import React, { useState, useMemo, useId } from "react";
import {
    ShieldCheck,
    ShieldAlert,
    Copy,
    Check,
    Sliders,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Terminal,
    Layers,
    Server,
    Globe,
    Plus,
    Trash2,
    Search,
    Cpu
} from "lucide-react";

type Qualifier = "+" | "~" | "-" | "?";

interface SpfPreset {
    id: string;
    label: string;
    mechanism: "include";
    value: string;
    description: string;
}

const COMMON_SERVICES: SpfPreset[] = [
    { id: "google", label: "Google Workspace / Gmail", mechanism: "include", value: "_spf.google.com", description: "Standard sending pool for Google Workspace domains" },
    { id: "m365", label: "Microsoft 365 / Outlook", mechanism: "include", value: "spf.protection.outlook.com", description: "Standard outbound cloud mail routing for M365" },
    { id: "sendgrid", label: "Twilio SendGrid", mechanism: "include", value: "sendgrid.net", description: "Transactional and marketing email relays" },
    { id: "mailgun", label: "Mailgun by Sinch", mechanism: "include", value: "mailgun.org", description: "Developer transactional email delivery" },
    { id: "postmark", label: "Postmark (ActiveCampaign)", mechanism: "include", value: "spf.mtasv.net", description: "High-deliverability transactional messaging" },
    { id: "amazonses", label: "Amazon Simple Email Service (SES)", mechanism: "include", value: "amazonses.com", description: "AWS cloud outbound mail authentication" },
    { id: "zoho", label: "Zoho Mail", mechanism: "include", value: "zoho.com", description: "Business email suite outbound routes" },
    { id: "brevo", label: "Brevo (formerly Sendinblue)", mechanism: "include", value: "spf.brevo.com", description: "CRM and newsletter email delivery relays" },
    { id: "klaviyo", label: "Klaviyo", mechanism: "include", value: "klaviyo.com", description: "E-commerce automated lifecycle flows" }
];

const PRESET_TEMPLATES = {
    googleM365: {
        domain: "example.com",
        includeMx: true,
        includeA: false,
        includePtr: false,
        ip4List: ["198.51.100.24", "203.0.113.0/24"],
        ip6List: [],
        includes: ["_spf.google.com", "spf.protection.outlook.com"],
        allPolicy: "-all" as Qualifier | "-all" | "~all" | "+all" | "?all",
        redirect: "",
        exp: ""
    },
    transactionalSES: {
        domain: "outbound.example.com",
        includeMx: false,
        includeA: true,
        includePtr: false,
        ip4List: ["192.0.2.10"],
        ip6List: ["2001:db8::1/64"],
        includes: ["amazonses.com", "sendgrid.net"],
        allPolicy: "-all" as Qualifier | "-all" | "~all" | "+all" | "?all",
        redirect: "",
        exp: ""
    },
    defensiveParked: {
        domain: "parked-domain.com",
        includeMx: false,
        includeA: false,
        includePtr: false,
        ip4List: [],
        ip6List: [],
        includes: [],
        allPolicy: "-all" as Qualifier | "-all" | "~all" | "+all" | "?all",
        redirect: "",
        exp: ""
    }
};

export default function SpfRecordGenerator() {
    // Basic Settings
    const [domain, setDomain] = useState<string>("companydomain.com");
    const [includeMx, setIncludeMx] = useState<boolean>(true);
    const [includeA, setIncludeA] = useState<boolean>(false);
    const [includePtr, setIncludePtr] = useState<boolean>(false);
    const [allPolicy, setAllPolicy] = useState<string>("-all");

    // Dynamic Lists
    const [ip4List, setIp4List] = useState<string[]>(["198.51.100.24"]);
    const [ip6List, setIp6List] = useState<string[]>([]);
    const [includes, setIncludes] = useState<string[]>(["_spf.google.com"]);

    // Modifiers
    const [redirect, setRedirect] = useState<string>("");
    const [exp, setExp] = useState<string>("");

    // Custom Raw Inspector
    const [customRawInput, setCustomRawInput] = useState<string>("");
    const [isInspectorMode, setIsInspectorMode] = useState<boolean>(false);

    // Temp Inputs for Additions
    const [newIp4, setNewIp4] = useState<string>("");
    const [newIp6, setNewIp6] = useState<string>("");
    const [newInclude, setNewInclude] = useState<string>("");

    const [copied, setCopied] = useState<boolean>(false);

    const domainInputId = useId();
    const rawInspectorInputId = useId();

    // Reset to defaults
    const handleReset = () => {
        setDomain("companydomain.com");
        setIncludeMx(true);
        setIncludeA(false);
        setIncludePtr(false);
        setAllPolicy("-all");
        setIp4List(["198.51.100.24"]);
        setIp6List([]);
        setIncludes(["_spf.google.com"]);
        setRedirect("");
        setExp("");
        setIsInspectorMode(false);
        setCustomRawInput("");
    };

    // Load template
    const loadTemplate = (presetKey: keyof typeof PRESET_TEMPLATES) => {
        const t = PRESET_TEMPLATES[presetKey];
        setDomain(t.domain);
        setIncludeMx(t.includeMx);
        setIncludeA(t.includeA);
        setIncludePtr(t.includePtr);
        setIp4List([...t.ip4List]);
        setIp6List([...t.ip6List]);
        setIncludes([...t.includes]);
        setAllPolicy(t.allPolicy);
        setRedirect(t.redirect);
        setExp(t.exp);
        setIsInspectorMode(false);
    };

    // Preset Toggle Handler
    const toggleServicePreset = (includeValue: string) => {
        if (includes.includes(includeValue)) {
            setIncludes(includes.filter((item) => item !== includeValue));
        } else {
            setIncludes([...includes, includeValue]);
        }
    };

    // Add manual items
    const handleAddIp4 = () => {
        const val = newIp4.trim();
        if (val && !ip4List.includes(val)) {
            setIp4List([...ip4List, val]);
            setNewIp4("");
        }
    };

    const handleAddIp6 = () => {
        const val = newIp6.trim();
        if (val && !ip6List.includes(val)) {
            setIp6List([...ip6List, val]);
            setNewIp6("");
        }
    };

    const handleAddInclude = () => {
        const val = newInclude.trim();
        if (val && !includes.includes(val)) {
            setIncludes([...includes, val]);
            setNewInclude("");
        }
    };

    // Remove handlers
    const handleRemoveIp4 = (idx: number) => setIp4List(ip4List.filter((_, i) => i !== idx));
    const handleRemoveIp6 = (idx: number) => setIp6List(ip6List.filter((_, i) => i !== idx));
    const handleRemoveInclude = (idx: number) => setIncludes(includes.filter((_, i) => i !== idx));

    // Construct Generated Record
    const generatedRecord = useMemo(() => {
        if (isInspectorMode && customRawInput.trim()) {
            return customRawInput.trim();
        }

        const parts: string[] = ["v=spf1"];

        if (includeMx) parts.push("mx");
        if (includeA) parts.push("a");
        if (includePtr) parts.push("ptr");

        ip4List.forEach((ip) => {
            if (ip.trim()) parts.push(`ip4:${ip.trim()}`);
        });

        ip6List.forEach((ip) => {
            if (ip.trim()) parts.push(`ip6:${ip.trim()}`);
        });

        includes.forEach((inc) => {
            if (inc.trim()) parts.push(`include:${inc.trim()}`);
        });

        if (redirect.trim()) {
            parts.push(`redirect=${redirect.trim()}`);
        } else if (allPolicy) {
            parts.push(allPolicy);
        }

        if (exp.trim()) {
            parts.push(`exp=${exp.trim()}`);
        }

        return parts.join(" ");
    }, [isInspectorMode, customRawInput, includeMx, includeA, includePtr, ip4List, ip6List, includes, redirect, allPolicy, exp]);

    // DNS & SPF RFC7208 Validator Logic
    const auditAnalysis = useMemo(() => {
        const record = generatedRecord.trim();
        const tokens = record.split(/\s+/).filter(Boolean);

        let estimatedDnsLookups = 0;
        const issues: { type: "error" | "warning" | "security" | "success"; title: string; desc: string }[] = [];

        // Check Version
        if (!tokens[0] || tokens[0] !== "v=spf1") {
            issues.push({
                type: "error",
                title: "Missing or Invalid v=spf1 Header",
                desc: "RFC 7208 mandates that every valid SPF record string must begin precisely with 'v=spf1'."
            });
        }

        let hasAll = false;
        let hasRedirect = false;
        let hasDangerousPlusAll = false;
        let hasPassQualifierAll = false;
        let hasDeprecatedPtr = false;
        let redirectCount = 0;

        tokens.slice(1).forEach((t) => {
            const lower = t.toLowerCase();

            // Mechanism lookups
            if (lower === "a" || lower.startsWith("a:") || lower.startsWith("a/")) {
                estimatedDnsLookups += 1;
            } else if (lower === "mx" || lower.startsWith("mx:") || lower.startsWith("mx/")) {
                estimatedDnsLookups += 1;
            } else if (lower === "ptr" || lower.startsWith("ptr:")) {
                estimatedDnsLookups += 1;
                hasDeprecatedPtr = true;
            } else if (lower.startsWith("include:")) {
                estimatedDnsLookups += 1;
                const incHost = lower.substring(8);
                if (!incHost || incHost.includes("/") || incHost.includes(" ")) {
                    issues.push({
                        type: "error",
                        title: `Malformed Include Directive: ${t}`,
                        desc: "Include mechanisms require a fully qualified domain name (FQDN)."
                    });
                }
            } else if (lower.startsWith("exists:")) {
                estimatedDnsLookups += 1;
            } else if (lower.startsWith("redirect=")) {
                estimatedDnsLookups += 1;
                hasRedirect = true;
                redirectCount += 1;
            } else if (lower.startsWith("exp=")) {
                // Modifier only, evaluated after fail
            } else if (lower === "+all" || lower === "all") {
                hasAll = true;
                hasDangerousPlusAll = true;
                hasPassQualifierAll = true;
            } else if (lower === "~all" || lower === "-all" || lower === "?all") {
                hasAll = true;
            }
        });

        // 10 DNS Lookup Limit Check
        if (estimatedDnsLookups > 10) {
            issues.push({
                type: "error",
                title: `Critical RFC 7208 Lookup Overflow: ${estimatedDnsLookups}/10 DNS Mechanisms`,
                desc: "Spanning more than 10 DNS queries causes receiving mail servers (Google, Yahoo, Microsoft) to abort verification and return a Permerror. Legitimate outgoing emails will fail DMARC alignment."
            });
        } else if (estimatedDnsLookups >= 8) {
            issues.push({
                type: "warning",
                title: `DNS Lookup Near Threshold: ${estimatedDnsLookups}/10 Mechanisms Used`,
                desc: "You are approaching the strict 10 DNS lookup limit. Subordinate includes within Google, Zendesk, or SendGrid may trigger a Permerror."
            });
        } else {
            issues.push({
                type: "success",
                title: `Safe DNS Lookup Footprint (${estimatedDnsLookups}/10 Mechanisms)`,
                desc: "Your base record maintains a lean mechanism architecture well below the 10-query limit."
            });
        }

        // Permissive Policy Audits
        if (hasDangerousPlusAll || hasPassQualifierAll) {
            issues.push({
                type: "security",
                title: "Critical Security Flaw: '+all' Open Relay Permissive Authorization",
                desc: "A '+all' (or unqualified 'all') grants any IP address on the entire internet legal authorization to forge and deliver email using your domain identity."
            });
        } else if (record.includes("?all")) {
            issues.push({
                type: "warning",
                title: "Neutral Policy '?all' (Testing Only)",
                desc: "A neutral policy states no definitive verdict. Email gateways will not reject unauthorized senders."
            });
        } else if (record.includes("~all")) {
            issues.push({
                type: "warning",
                title: "SoftFail '~all' Permissive Mode Active",
                desc: "Non-matching senders receive a SoftFail. Mail may be marked as spam or quarantined instead of rejected outright. Ideal during DMARC rollout, but upgrade to '-all' when confident."
            });
        } else if (record.includes("-all")) {
            issues.push({
                type: "success",
                title: "HardFail '-all' Strict Enforcement Active",
                desc: "Optimal defense against spoofing. Unauthorized sending MTAs are instructed to drop and reject fake messages immediately."
            });
        }

        // Ptr Check
        if (hasDeprecatedPtr) {
            issues.push({
                type: "warning",
                title: "Deprecated 'ptr' Mechanism Detected",
                desc: "RFC 7208 Section 5.5 explicitly discourages 'ptr' usage due to severe DNS query load, slow resolution latency, and general unreliability."
            });
        }

        // Character limit check (RFC 4408 / 7208 255-character UDP limit per TXT chunk)
        const charLength = record.length;
        if (charLength > 450) {
            issues.push({
                type: "error",
                title: `Record Length (${charLength} chars) Exceeds Recommended MTU Payload`,
                desc: "TXT records that exceed 450 bytes risk packet fragmentation or truncated replies over legacy UDP DNS channels."
            });
        }

        if (hasRedirect && hasAll) {
            issues.push({
                type: "error",
                title: "Conflicting Directives: 'redirect' Modifier and 'all' Mechanism Combined",
                desc: "RFC 7208 states that if an 'all' mechanism is present, a 'redirect=' modifier will be ignored entirely. Remove 'all' or remove 'redirect='."
            });
        }

        if (redirectCount > 1) {
            issues.push({
                type: "error",
                title: "Multiple 'redirect' Modifiers Present",
                desc: "An SPF record must contain at most one 'redirect=' modifier. Multiple modifiers trigger a Permerror."
            });
        }

        return {
            estimatedDnsLookups,
            charLength,
            issues,
            hasSecurityAlert: hasDangerousPlusAll || estimatedDnsLookups > 10
        };
    }, [generatedRecord]);

    const handleCopyRecord = () => {
        if (!generatedRecord) return;
        navigator.clipboard.writeText(generatedRecord);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "DNS SPF Record Syntax Validator & Permissive Audit Checker",
        "url": "https://twistertools.com/tools/web-tools/spf-record-generator",
        "description": "Enterprise RFC 7208 SPF record generator, syntax validator, and permissive security auditor. Avoid the 10 DNS lookup limit, permerrors, and spoofing vulnerabilities.",
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
                "name": "What is an SPF record and why is it mandatory for email deliverability?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sender Policy Framework (SPF), formalized under RFC 7208, is a public DNS TXT record that declares which mail transfer agents (MTAs) and IP addresses are authorized to send outgoing email on behalf of a specific domain name. Modern receiving providers—including Google Workspace and Yahoo Mail—enforce mandatory SPF authentication to prevent domain spoofing, phishing, and direct spam injection."
                }
            },
            {
                "@type": "Question",
                "name": "What is the strict 10 DNS lookup limit in RFC 7208?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To prevent distributed denial-of-service (DDoS) reflection attacks and excessive recursion delays during MTA verification, RFC 7208 strictly limits the number of DNS lookups performed during SPF evaluation to 10. Mechanisms that require lookups include 'include', 'a', 'mx', 'ptr', 'exists', and 'redirect'. If an SPF evaluation traverses more than 10 lookups, receiving mail servers abort verification with an SPF Permerror (Permanent Error), breaking DMARC alignment."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between -all (HardFail) and ~all (SoftFail)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The qualifier prefix dictates enforcement strictness. The '~all' (SoftFail) mechanism instructs receiving servers that non-matching IP addresses should be accepted but flagged as suspicious or routed to junk folders. The '-all' (HardFail) mechanism firmly commands servers that any unauthorized server must be outright rejected at the SMTP connection handshake. Enterprise cybersecurity standards recommend -all paired with an enforcing DMARC policy (p=reject)."
                }
            },
            {
                "@type": "Question",
                "name": "Why does having multiple SPF TXT records on a single domain cause an instant Permerror?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "RFC 7208 Section 3.2 explicitly dictates that a domain name must not publish multiple SPF TXT records. If a receiving email server queries DNS and finds more than one TXT record starting with 'v=spf1', it immediately treats the result as an unresolvable syntax collision and returns a Permerror. All authorized services must be consolidated into one single, cohesive SPF TXT record string."
                }
            },
            {
                "@type": "Question",
                "name": "Why is the 'ptr' mechanism strongly discouraged?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 'ptr' mechanism instructs the receiving MTA to perform reverse DNS pointer queries for every sending IP, followed by forward DNS validations. This introduces severe server latency, high failure rates, and places unreasonable strain on nameservers. RFC 7208 formally cautions against using 'ptr', and many major mailbox providers ignore or down-rank it."
                }
            },
            {
                "@type": "Question",
                "name": "How does SPF work alongside DKIM and DMARC?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "SPF validates the sending server's IP address against the envelope sender (Return-Path). DKIM provides cryptographic signatures guaranteeing email integrity in transit. DMARC links both protocols together with the user-visible 'From' header, dictating domain policy enforcement (none, quarantine, or reject) and generating forensic delivery telemetry."
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
                {/* Left Panel: Configuration Controls & Presets (Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    {/* Header Controls */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            SPF Configuration Studio
                        </h2>
                    </div>

                    {/* Preset Templates Row (3 equal columns) */}
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <button
                            type="button"
                            onClick={() => loadTemplate("googleM365")}
                            className="w-full py-2 px-1.5 sm:px-3 text-xs font-semibold text-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer truncate"
                        >
                            Google + M365
                        </button>
                        <button
                            type="button"
                            onClick={() => loadTemplate("transactionalSES")}
                            className="w-full py-2 px-1.5 sm:px-3 text-xs font-semibold text-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer truncate"
                        >
                            Transactional
                        </button>
                        <button
                            type="button"
                            onClick={() => loadTemplate("defensiveParked")}
                            className="w-full py-2 px-1.5 sm:px-3 text-xs font-semibold text-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer truncate"
                        >
                            Parked Domain
                        </button>
                    </div>

                    {/* Mode Toggle: Builder vs Raw Inspector */}
                    <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setIsInspectorMode(false)}
                            className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${!isInspectorMode
                                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            <Sliders className="w-3.5 h-3.5" /> Interactive Builder
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsInspectorMode(true);
                                setCustomRawInput(generatedRecord);
                            }}
                            className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${isInspectorMode
                                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            <Search className="w-3.5 h-3.5" /> Raw Syntax Inspector
                        </button>
                    </div>

                    {isInspectorMode ? (
                        /* RAW INSPECTOR TEXTAREA */
                        <div className="space-y-3">
                            <label htmlFor={rawInspectorInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Paste an existing DNS TXT record to validate & audit:
                            </label>
                            <textarea
                                id={rawInspectorInputId}
                                rows={6}
                                aria-label="Raw SPF record for syntax analysis"
                                value={customRawInput}
                                onChange={(e) => setCustomRawInput(e.target.value)}
                                placeholder="v=spf1 include:_spf.google.com ip4:198.51.100.1 -all"
                                className="w-full p-3 font-mono text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Paste any current production TXT record above. The right-hand engine will immediately evaluate DNS query recursion depths and security postures.
                            </p>
                        </div>
                    ) : (
                        /* BUILDER CONTROLS */
                        <div className="space-y-5">
                            {/* Domain Name */}
                            <div className="space-y-1.5">
                                <label htmlFor={domainInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Target Domain Name (FQDN):
                                </label>
                                <div className="relative">
                                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                    <input
                                        id={domainInputId}
                                        type="text"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                                        aria-label="Target domain name"
                                        placeholder="example.com"
                                        className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Core Mechanism Toggles */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                    Standard DNS Mechanisms:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={includeMx}
                                            onChange={(e) => setIncludeMx(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                        />
                                        <div className="text-xs">
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">mx</span>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Authorize MX hosts</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={includeA}
                                            onChange={(e) => setIncludeA(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                        />
                                        <div className="text-xs">
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">a</span>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Authorize main A record</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={includePtr}
                                            onChange={(e) => setIncludePtr(e.target.checked)}
                                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                                        />
                                        <div className="text-xs">
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">ptr</span>
                                            <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold">Deprecated</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* 1-Click Trusted Cloud Providers */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                        Authorize Popular Cloud Relays (Includes):
                                    </label>
                                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                        {includes.length} Active
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {COMMON_SERVICES.map((srv) => {
                                        const isActive = includes.includes(srv.value);
                                        return (
                                            <button
                                                key={srv.id}
                                                type="button"
                                                onClick={() => toggleServicePreset(srv.value)}
                                                className={`p-2 rounded-xl border text-xs text-left transition cursor-pointer flex flex-col justify-between ${isActive
                                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                <div className="font-bold flex items-center justify-between">
                                                    <span className="truncate">{srv.label}</span>
                                                    {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-1">
                                                    {srv.value}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Authorized IPv4 Addresses */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                    Authorized IPv4 Addresses or CIDR Blocks:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newIp4}
                                        onChange={(e) => setNewIp4(e.target.value.trim())}
                                        placeholder="198.51.100.24 or 203.0.113.0/24"
                                        aria-label="New IPv4 address or CIDR range"
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddIp4())}
                                        className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddIp4}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer flex items-center gap-1 shrink-0"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add IP
                                    </button>
                                </div>

                                {ip4List.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {ip4List.map((ip, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                            >
                                                ip4:{ip}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveIp4(idx)}
                                                    aria-label={`Remove IPv4 ${ip}`}
                                                    className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Authorized IPv6 Addresses */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                    Authorized IPv6 Addresses or CIDR Blocks:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newIp6}
                                        onChange={(e) => setNewIp6(e.target.value.trim())}
                                        placeholder="2001:db8::1 or 2001:db8::/32"
                                        aria-label="New IPv6 address or CIDR range"
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddIp6())}
                                        className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddIp6}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer flex items-center gap-1 shrink-0"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add IPv6
                                    </button>
                                </div>

                                {ip6List.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {ip6List.map((ip, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                            >
                                                ip6:{ip}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveIp6(idx)}
                                                    aria-label={`Remove IPv6 ${ip}`}
                                                    className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Custom Includes */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                    Custom Domain Includes (FQDN):
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newInclude}
                                        onChange={(e) => setNewInclude(e.target.value.toLowerCase().trim())}
                                        placeholder="custom-mail.partnerdomain.com"
                                        aria-label="New Custom Domain Include"
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInclude())}
                                        className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddInclude}
                                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer flex items-center gap-1 shrink-0"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Include
                                    </button>
                                </div>

                                {includes.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {includes.map((inc, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                                            >
                                                include:{inc}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveInclude(idx)}
                                                    aria-label={`Remove Include ${inc}`}
                                                    className="text-indigo-400 hover:text-rose-500 transition cursor-pointer"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Policy Enforcement Mechanism (~all, -all, ?all, +all) */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                    Default Policy Enforcement (&apos;all&apos; Qualifier):
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAllPolicy("-all")}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 ${allPolicy === "-all"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="font-mono text-sm">-all (HardFail)</span>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Recommended</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAllPolicy("~all")}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 ${allPolicy === "~all"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="font-mono text-sm">~all (SoftFail)</span>
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Transitioning</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAllPolicy("?all")}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 ${allPolicy === "?all"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="font-mono text-sm">?all (Neutral)</span>
                                        <span className="text-[10px] text-slate-500 font-normal">Testing Only</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAllPolicy("+all")}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 ${allPolicy === "+all"
                                            ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-1 ring-rose-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="font-mono text-sm">+all (Pass All)</span>
                                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Unsafe / Open</span>
                                    </button>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Reset to Production Defaults
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Live DNS Record, RFC Audit & Real-Time Lookups (Span 6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    {/* Live Generated DNS TXT Record Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Validated DNS TXT Record
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> RFC 7208 Engine
                            </span>
                        </div>

                        {/* DNS Record Payload Display Box */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>Host / Subdomain: <strong className="text-slate-800 dark:text-slate-200 font-mono">@ or {domain || "example.com"}</strong></span>
                                <span>Record Type: <strong className="text-slate-800 dark:text-slate-200 font-mono">TXT</strong></span>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-sm leading-relaxed break-all select-all shadow-inner">
                                {generatedRecord}
                            </div>
                        </div>

                        {/* 4 Real-Time RFC Audit Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block leading-tight">
                                    DNS Lookups
                                </span>
                                <p className={`text-base font-bold font-mono ${auditAnalysis.estimatedDnsLookups > 10 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                                    {auditAnalysis.estimatedDnsLookups} <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">/ 10</span>
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block leading-tight">
                                    Total Length
                                </span>
                                <p className={`text-base font-bold font-mono ${auditAnalysis.charLength > 255 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                                    {auditAnalysis.charLength} <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">chars</span>
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block leading-tight">
                                    Policy Strictness
                                </span>
                                <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {allPolicy}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block leading-tight">
                                    Audit State
                                </span>
                                <p className={`text-xs font-bold uppercase tracking-wider ${auditAnalysis.hasSecurityAlert ? "text-rose-600" : "text-emerald-600"}`}>
                                    {auditAnalysis.hasSecurityAlert ? "Attention" : "Passed"}
                                </p>
                            </div>
                        </div>

                        {/* Copy TXT Record Button */}
                        <button
                            type="button"
                            onClick={handleCopyRecord}
                            disabled={!generatedRecord}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copied
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5 text-white" />
                                    <span>Copied to Clipboard! Ready for DNS Manager</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-white" />
                                    <span>Copy Formatted SPF TXT Value</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Live Permissive Audit & RFC Compliance Diagnostics Feed */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                RFC 7208 Permissive & Syntax Audit Log
                            </h3>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                {auditAnalysis.issues.length} Diagnostic Rules
                            </span>
                        </div>

                        <div className="space-y-3">
                            {auditAnalysis.issues.map((issue, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-xl border flex items-start gap-3 ${issue.type === "error"
                                        ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20"
                                        : issue.type === "security"
                                            ? "border-rose-300 dark:border-rose-800 bg-rose-100/50 dark:bg-rose-950/40"
                                            : issue.type === "warning"
                                                ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20"
                                                : "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20"
                                        }`}
                                >
                                    {issue.type === "error" || issue.type === "security" ? (
                                        <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                    ) : issue.type === "warning" ? (
                                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    )}

                                    <div className="space-y-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                            {issue.title}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {issue.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: The Mechanics of SPF & The RFC 7208 10-Lookup Wall */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Understanding Sender Policy Framework (SPF) & The RFC 7208 10-DNS Lookup Limit
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Sender Policy Framework (SPF) is the foundational authentication layer for enterprise email deliverability. By publishing an SPF TXT record at your domain root, you designate an explicit whitelist of authorized IP addresses and third-party mail transfer agents (MTAs) permitted to transmit mail bearing your domain in the SMTP envelope sender (the <code className="font-mono text-indigo-600 dark:text-indigo-400">Return-Path</code>). However, an SPF implementation without careful architectural planning frequently leads to broken delivery due to RFC limits:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> The 10-Lookup Safety Limit
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                RFC 7208 Section 4.6.4 dictates that evaluating an SPF record must not invoke more than 10 DNS queries. This prevents malicious actors from staging distributed denial-of-service (DDoS) amplification attacks using DNS MX and include recursions.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> The Dreaded &apos;Permerror&apos;
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The instant an 11th DNS query is triggered, major gateways (including Google Workspace, Microsoft 365, and Yahoo) abort verification immediately. The result evaluates to a permanent error (<code className="font-mono text-indigo-600 dark:text-indigo-400">Permerror</code>), immediately invalidating DMARC alignment.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Direct IP Whitelisting
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Direct <code className="font-mono text-indigo-600 dark:text-indigo-400">ip4:</code> and <code className="font-mono text-indigo-600 dark:text-indigo-400">ip6:</code> CIDR blocks consume zero DNS lookups. Converting static on-premise relays or transactional servers into explicit IP mechanisms eliminates lookups and keeps your record lightweight.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> DNS Lookup Allocation Breakdown
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Mechanisms that invoke active DNS resolutions count against your 10-query limit, whereas static address mechanisms do not:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`// Consumes 1 DNS Lookup Each:
include:_spf.google.com       -> +1 Lookup (plus nested sub-queries!)
mx                            -> +1 Lookup (resolves MX host A records)
a                             -> +1 Lookup (resolves domain A record)
exists:%{i}.spf.domain.com    -> +1 Lookup
redirect=_spf.partner.com     -> +1 Lookup

// Consumes ZERO DNS Lookups (Safe for Record Optimization):
ip4:198.51.100.24             -> 0 Lookups (Exact binary IP match)
ip6:2001:db8::/32             -> 0 Lookups (Exact binary IPv6 match)
-all, ~all, ?all              -> 0 Lookups (Terminal qualifier evaluation)`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Mechanism and Qualifier Comprehensive Reference Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comprehensive RFC 7208 Mechanism & Qualifier Specification
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Every token in an SPF TXT record consists of an optional qualifier prefix followed by an active mechanism. Review this detailed reference table to construct hardened, standards-compliant policies:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Mechanism / Qualifier</th>
                                    <th className="p-3">DNS Lookups</th>
                                    <th className="p-3">Enforcement Behavior</th>
                                    <th className="p-3">Cybersecurity Recommendation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">-all (HardFail)</td>
                                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">0</td>
                                    <td className="p-3">Explicit rejection: drops messages from non-matching senders.</td>
                                    <td className="p-3 text-emerald-600 font-bold">Standard for hardened domains</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">~all (SoftFail)</td>
                                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">0</td>
                                    <td className="p-3">Permits delivery but marks non-matching mail as spam/junk.</td>
                                    <td className="p-3 text-amber-600">Acceptable during staging only</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">+all (Pass All)</td>
                                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">0</td>
                                    <td className="p-3">Authorizes any computer on the global internet to forge your email.</td>
                                    <td className="p-3 text-rose-600 font-bold">Critical Vulnerability (Do not use)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">include:&lt;domain&gt;</td>
                                    <td className="p-3 font-mono text-amber-600 dark:text-amber-400">1+ (Recursive)</td>
                                    <td className="p-3">Recursively evaluates the SPF record of an external provider.</td>
                                    <td className="p-3 text-indigo-600">Essential for Google, SES, M365</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">ip4:&lt;address/cidr&gt;</td>
                                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">0</td>
                                    <td className="p-3">Authorizes a single IPv4 address or contiguous CIDR subnet.</td>
                                    <td className="p-3 text-emerald-600 font-bold">High performance, zero lookups</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">ptr (Deprecated)</td>
                                    <td className="p-3 font-mono text-rose-600 dark:text-rose-400">1+ (Reverse)</td>
                                    <td className="p-3">Triggers reverse pointer resolutions to compare hostnames.</td>
                                    <td className="p-3 text-rose-600 font-bold">Deprecated by RFC 7208 Sec 5.5</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Enterprise SPF Troubleshooting Guide */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            SPF Implementation Best Practices: Avoiding Deliverability Blackholes
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Even minor syntax errors in your DNS zone file will cause major receiving mailbox providers to discard legitimate corporate email. Follow these three critical deployment rules:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mandatory Production Guidelines
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Never Publish Multiple SPF Records:</strong> A domain can possess only one TXT record beginning with <code className="font-mono">v=spf1</code>. If multiple are detected, receiving servers immediately fail SPF evaluation with a Permerror.
                                </li>
                                <li>
                                    • <strong>Protect Parked Domains with Defensive SPF:</strong> Domains that do not transmit email should still publish <code className="font-mono">v=spf1 -all</code>. This stops cybercriminals from spoofing your inactive brand names.
                                </li>
                                <li>
                                    • <strong>Deploy DMARC alongside SPF:</strong> SPF validates the envelope sender (<code className="font-mono">Return-Path</code>), not the human-visible <code className="font-mono">From:</code> header. DMARC enforces strict identifier alignment between both.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Costly Implementation Mistakes
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Hidden Lookups inside Nested Includes:</strong> A single SaaS provider&apos;s include (such as Zendesk or Salesforce) may internally reference 3 or 4 child includes, silently pushing your domain past the 10-lookup threshold.
                                </li>
                                <li>
                                    • <strong>Leaving +all Active:</strong> Overly permissive wildcards permit anyone to spoof your domain with total cryptographic legitimacy, bypassing spam defenses.
                                </li>
                                <li>
                                    • <strong>Using Obsolete SPF Type DNS Records:</strong> The legacy DNS RRType 99 (SPF) was formally deprecated by RFC 7208 in 2014. Always publish your SPF record strictly as a standard TXT record (RRType 16).
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
                                What is an SPF record and why is it mandatory for email deliverability?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Sender Policy Framework (SPF), formalized under RFC 7208, is a public DNS TXT record that declares which mail transfer agents (MTAs) and IP addresses are authorized to send outgoing email on behalf of a specific domain name. Modern receiving providers—including Google Workspace and Yahoo Mail—enforce mandatory SPF authentication to prevent domain spoofing, phishing, and direct spam injection.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the strict 10 DNS lookup limit in RFC 7208?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                To prevent distributed denial-of-service (DDoS) reflection attacks and excessive recursion delays during MTA verification, RFC 7208 strictly limits the number of DNS lookups performed during SPF evaluation to 10. Mechanisms that require lookups include &apos;include&apos;, &apos;a&apos;, &apos;mx&apos;, &apos;ptr&apos;, &apos;exists&apos;, and &apos;redirect&apos;. If an SPF evaluation traverses more than 10 lookups, receiving mail servers abort verification with an SPF Permerror (Permanent Error), breaking DMARC alignment.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between -all (HardFail) and ~all (SoftFail)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The qualifier prefix dictates enforcement strictness. The &apos;~all&apos; (SoftFail) mechanism instructs receiving servers that non-matching IP addresses should be accepted but flagged as suspicious or routed to junk folders. The &apos;-all&apos; (HardFail) mechanism firmly commands servers that any unauthorized server must be outright rejected at the SMTP connection handshake. Enterprise cybersecurity standards recommend -all paired with an enforcing DMARC policy (p=reject).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why does having multiple SPF TXT records on a single domain cause an instant Permerror?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                RFC 7208 Section 3.2 explicitly dictates that a domain name must not publish multiple SPF TXT records. If a receiving email server queries DNS and finds more than one TXT record starting with &apos;v=spf1&apos;, it immediately treats the result as an unresolvable syntax collision and returns a Permerror. All authorized services must be consolidated into one single, cohesive SPF TXT record string.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why is the &apos;ptr&apos; mechanism strongly discouraged?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The &apos;ptr&apos; mechanism instructs the receiving MTA to perform reverse DNS pointer queries for every sending IP, followed by forward DNS validations. This introduces severe server latency, high failure rates, and places unreasonable strain on nameservers. RFC 7208 formally cautions against using &apos;ptr&apos;, and many major mailbox providers ignore or down-rank it.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does SPF work alongside DKIM and DMARC?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                SPF validates the sending server&apos;s IP address against the envelope sender (Return-Path). DKIM provides cryptographic signatures guaranteeing email integrity in transit. DMARC links both protocols together with the user-visible &apos;From&apos; header, dictating domain policy enforcement (none, quarantine, or reject) and generating forensic delivery telemetry.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}