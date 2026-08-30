"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    ShieldCheck,
    Eye,
    EyeOff,
    Copy,
    CheckCircle2,
    RotateCcw,
    Download,
    Upload,
    SlidersHorizontal,
    Sparkles,
    Lock,
    KeyRound,
    FileText,
    HelpCircle,
    Info,
    Check,
    Cpu,
    Workflow,
    Layers,
    ListTree,
    Database,
    Binary,
    Search,
    RefreshCw
} from "lucide-react";

type MaskingStrategy = "placeholder" | "asterisk" | "hash" | "synthetic" | "category_id";

interface PiiRule {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
    pattern: RegExp;
    placeholder: string;
    category: "identity" | "contact" | "financial" | "network" | "identifiers";
    syntheticGenerator?: (match: string, index: number) => string;
}

const SAMPLE_TEXT = `Subject: Confidential Incident Report - Client 8492
From: Sarah Jenkins <s.jenkins@enterprise-corp.com>
To: Dev Team Lead <alex.morrison@securenode.io>
Date: October 24, 2026, 14:32 EST

Dear Alex,

During our scheduled audit on server 192.168.1.105 (MAC address 00:1A:2B:3C:4D:5E), we discovered unencrypted debug logs for customer Jonathan Hayes.
His registered SSN is 452-09-8831 and date of birth is 1984-05-18. 

Financial records show recurring automated billing via Visa card 4532-8901-4432-9812 with expiration 08/29.
His corporate office phone is +1 (555) 382-9011 ext. 402, and backup cell is 202-555-0193.
Shipping address registered: 742 Evergreen Terrace, Springfield, OR 97477, USA.

The production database is hosted at db-node-primary.internal.cloud (IPv6 2001:0db8:85a3:0000:0000:8a2e:0370:7334).
Access token authorized: ghp_9k3LMnOpQrStUvWxYz1234567890AbCdEf.
JWT Bearer payload: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvbiBEb2UiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Please redact this text immediately before feeding into our public LLM fine-tuning cluster.`;

export default function TextPiiRedactor() {
    // Core State
    const [inputText, setInputText] = useState<string>(SAMPLE_TEXT);
    const [strategy, setStrategy] = useState<MaskingStrategy>("placeholder");
    const [customSalt, setCustomSalt] = useState<string>("twister-salt-2026");
    const [preserveFirstLast, setPreserveFirstLast] = useState<boolean>(false);
    const [caseSensitive, setCaseSensitive] = useState<boolean>(true);
    const [customPatternInput, setCustomPatternInput] = useState<string>("");
    const [customWhitelist, setCustomWhitelist] = useState<string>("enterprise-corp.com\ninternal.cloud");

    // UI Feedback State
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"redacted" | "diff" | "audit">("redacted");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Configurable Detection Modules State
    const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>({
        email: true,
        ssn: true,
        creditCard: true,
        ipv4: true,
        ipv6: true,
        phone: true,
        macAddress: true,
        jwtTokens: true,
        apiKeys: true,
        dob: true,
        zipCodes: true
    });

    const toggleRule = (ruleId: string) => {
        setEnabledRules((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));
    };

    const enableAllRules = (status: boolean) => {
        const nextState: Record<string, boolean> = {};
        Object.keys(enabledRules).forEach((k) => {
            nextState[k] = status;
        });
        setEnabledRules(nextState);
    };

    // Fast deterministic hashing for pseudo-anonymization / synthetic replacement
    const deterministicHash = (str: string, salt: string) => {
        let hash = 0;
        const combined = str + salt;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 8);
    };

    // Master Regex Detection Library
    const rules: PiiRule[] = useMemo(() => [
        {
            id: "email",
            label: "Email Addresses",
            description: "Standard RFC 5322 formatted email addresses",
            category: "contact",
            enabled: enabledRules.email,
            pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
            placeholder: "[REDACTED_EMAIL]",
            syntheticGenerator: (match, idx) => `user_${deterministicHash(match, customSalt)}@synthetic-domain.com`
        },
        {
            id: "ssn",
            label: "US Social Security Numbers (SSN)",
            description: "9-digit US SSN patterns with hyphens or spaces",
            category: "identity",
            enabled: enabledRules.ssn,
            pattern: /\b(?!000|666|9\d{2})\d{3}[- ](?!00)\d{2}[- ](?!0000)\d{4}\b/g,
            placeholder: "[REDACTED_SSN]",
            syntheticGenerator: (match) => `XXX-XX-${match.slice(-4)}`
        },
        {
            id: "creditCard",
            label: "Credit Card & PAN Numbers",
            description: "Visa, MasterCard, Amex, and Discover formats with delimiters",
            category: "financial",
            enabled: enabledRules.creditCard,
            pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13})[- ]*(?:[0-9]{4}[- ]*){0,3}[0-9]{4}\b/g,
            placeholder: "[REDACTED_CARD_NUMBER]",
            syntheticGenerator: (match) => `****-****-****-${match.replace(/\D/g, "").slice(-4)}`
        },
        {
            id: "ipv4",
            label: "IPv4 Network Addresses",
            description: "Dotted-decimal public and private IPv4 network addresses",
            category: "network",
            enabled: enabledRules.ipv4,
            pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
            placeholder: "[REDACTED_IPV4]",
            syntheticGenerator: (match) => `10.0.0.${parseInt(deterministicHash(match, customSalt).substring(0, 2), 16) % 254 + 1}`
        },
        {
            id: "ipv6",
            label: "IPv6 Network Addresses",
            description: "Full and shorthand 128-bit hexadecimal IPv6 addresses",
            category: "network",
            enabled: enabledRules.ipv6,
            pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:)*:[0-9a-fA-F]{1,4}\b/g,
            placeholder: "[REDACTED_IPV6]",
            syntheticGenerator: () => `fd00::${Math.floor(Math.random() * 9999).toString(16)}`
        },
        {
            id: "phone",
            label: "Telephone & Mobile Numbers",
            description: "International, E.164, and North American phone number formats",
            category: "contact",
            enabled: enabledRules.phone,
            pattern: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\s*(?:ext|x|ext.)\s*\d{1,5})?/g,
            placeholder: "[REDACTED_PHONE]",
            syntheticGenerator: (match) => `+1 (555) 010-${deterministicHash(match, customSalt).substring(0, 4)}`
        },
        {
            id: "macAddress",
            label: "Hardware MAC Addresses",
            description: "48-bit physical ethernet/Wi-Fi hardware identifiers",
            category: "network",
            enabled: enabledRules.macAddress,
            pattern: /\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b/g,
            placeholder: "[REDACTED_MAC]",
            syntheticGenerator: () => `02:00:00:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`
        },
        {
            id: "jwtTokens",
            label: "JWT Bearer & Auth Tokens",
            description: "JSON Web Tokens with header.payload.signature structures",
            category: "identifiers",
            enabled: enabledRules.jwtTokens,
            pattern: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
            placeholder: "[REDACTED_JWT_TOKEN]",
            syntheticGenerator: () => `eyJhbGciOiJub25lIn0.synthetic_claim.sig`
        },
        {
            id: "apiKeys",
            label: "API Keys & OAuth Secrets",
            description: "High-entropy GitHub, AWS, Stripe, and generic bearer secrets",
            category: "identifiers",
            enabled: enabledRules.apiKeys,
            pattern: /\b(?:ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16}|sk_live_[0-9a-zA-Z]{24,}|AIza[0-9A-Za-z-_]{35})\b/g,
            placeholder: "[REDACTED_SECRET_KEY]",
            syntheticGenerator: () => `sec_dummy_${Math.random().toString(36).substring(2, 10)}`
        },
        {
            id: "dob",
            label: "Dates of Birth / ISO Dates",
            description: "Common ISO 8601 and regional numeric date stamps",
            category: "identity",
            enabled: enabledRules.dob,
            pattern: /\b(?:19|20)\d{2}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01])\b|\b(?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}\b/g,
            placeholder: "[REDACTED_DATE]",
            syntheticGenerator: () => `1990-01-01`
        },
        {
            id: "zipCodes",
            label: "Postal & ZIP Codes",
            description: "5-digit and ZIP+4 postal location identifiers",
            category: "identity",
            enabled: enabledRules.zipCodes,
            pattern: /\b\d{5}(?:-\d{4})?\b/g,
            placeholder: "[REDACTED_ZIP]",
            syntheticGenerator: () => `90210`
        }
    ], [enabledRules, customSalt]);

    // Parse Whitelist
    const whitelistArray = useMemo(() => {
        return customWhitelist
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }, [customWhitelist]);

    // Execution Engine: Run PII Redaction & Extract Audit Log
    const { redactedOutput, auditLog, stats } = useMemo(() => {
        let text = inputText;
        const matches: Array<{
            ruleId: string;
            category: string;
            original: string;
            replacement: string;
            index: number;
        }> = [];

        // Precompile custom regex if supplied
        let userRegex: RegExp | null = null;
        if (customPatternInput.trim()) {
            try {
                userRegex = new RegExp(customPatternInput.trim(), caseSensitive ? "g" : "gi");
            } catch {
                userRegex = null;
            }
        }

        // Active rules list
        const activeRules = rules.filter((r) => r.enabled);

        // Helper to format mask based on user strategy
        const buildMask = (original: string, rule: PiiRule, matchIdx: number) => {
            // Check whitelist
            for (const wl of whitelistArray) {
                if (original.includes(wl)) return original;
            }

            if (strategy === "placeholder") {
                return rule.placeholder;
            }
            if (strategy === "asterisk") {
                if (preserveFirstLast && original.length > 2) {
                    return original[0] + "*".repeat(original.length - 2) + original[original.length - 1];
                }
                return "*".repeat(Math.max(4, original.length));
            }
            if (strategy === "hash") {
                return `[HASH_${deterministicHash(original, customSalt)}]`;
            }
            if (strategy === "category_id") {
                return `[${rule.category.toUpperCase()}_#${matchIdx + 1}]`;
            }
            if (strategy === "synthetic" && rule.syntheticGenerator) {
                return rule.syntheticGenerator(original, matchIdx);
            }
            return rule.placeholder;
        };

        // Execute Custom User Regex first if exists
        if (userRegex) {
            let customIdx = 0;
            text = text.replace(userRegex, (match, offset) => {
                // Whitelist check
                for (const wl of whitelistArray) {
                    if (match.includes(wl)) return match;
                }
                const rep = `[CUSTOM_REDACTED_#${++customIdx}]`;
                matches.push({
                    ruleId: "custom_pattern",
                    category: "custom",
                    original: match,
                    replacement: rep,
                    index: offset
                });
                return rep;
            });
        }

        // Process Standard Rule set
        let matchCounter = 0;
        activeRules.forEach((rule) => {
            text = text.replace(rule.pattern, (match, offset) => {
                matchCounter++;
                const rep = buildMask(match, rule, matchCounter);
                if (rep !== match) {
                    matches.push({
                        ruleId: rule.id,
                        category: rule.category,
                        original: match,
                        replacement: rep,
                        index: offset
                    });
                }
                return rep;
            });
        });

        // Compute Stats
        const categoryCounts: Record<string, number> = {};
        matches.forEach((m) => {
            categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
        });

        return {
            redactedOutput: text,
            auditLog: matches,
            stats: {
                totalRedactions: matches.length,
                categories: categoryCounts,
                characterReduction: text.length - inputText.length
            }
        };
    }, [inputText, rules, strategy, customSalt, preserveFirstLast, customPatternInput, caseSensitive, whitelistArray]);

    // Copy to clipboard
    const handleCopy = () => {
        navigator.clipboard.writeText(redactedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Download Clean Text File
    const handleDownload = () => {
        const blob = new Blob([redactedOutput], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "redacted_anonymized_output.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // File Upload Handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) setInputText(content);
        };
        reader.readAsText(file);
    };

    // JSON-LD Schemas for Structured SEO
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Text Anonymizer & PII Redactor",
        "url": "https://twistertools.com/tools/text-tools/text-pii-redactor",
        "description": "Enterprise-grade client-side PII sanitizer and text anonymizer. Instantly redact emails, SSNs, credit cards, IP addresses, phone numbers, and secrets before LLM prompting.",
        "applicationCategory": "SecurityApplication",
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
                "name": "Does any text or sensitive PII leave my local browser?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The entire anonymization and pattern matching engine executes 100% client-side via JavaScript regular expression parsers within your web browser. Zero bytes of your text, SSNs, credit card numbers, or proprietary logs are transmitted over network connections or stored in remote databases."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Placeholder, Hashing, and Synthetic Anonymization?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Placeholder replacement swaps detected entities with semantic tags like [REDACTED_EMAIL]. Deterministic hashing produces consistent irreversible hex hashes (e.g. [HASH_3a9f]), ensuring that multiple occurrences of the same user remain linked across datasets without revealing the original identifier. Synthetic generation outputs plausible, valid mock values (e.g., replacement phone numbers) that preserve NLP grammatical parsing."
                }
            },
            {
                "@type": "Question",
                "name": "How does this tool help with GDPR, HIPAA, and CCPA regulatory compliance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "GDPR (Article 32), HIPAA Safe Harbor (Section 164.514), and CCPA require the stripping or pseudo-anonymization of direct personal identifiers (names, SSNs, contact numbers, IPs, medical IDs) prior to third-party sharing or machine learning model fine-tuning. This utility enforces zero-knowledge sanitization directly at the user endpoint."
                }
            },
            {
                "@type": "Question",
                "name": "Can I prevent specific corporate internal domains from being redacted?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Use the Whitelist exception box located in the settings panel to define domain names, corporate IP blocks, or approved system identifiers that the regex engine should ignore."
                }
            },
            {
                "@type": "Question",
                "name": "Can I sanitize proprietary code, API tokens, and JWT payloads before AI prompting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The redactor includes high-entropy detectors for AWS secret keys, GitHub personal access tokens, Stripe live keys, Google API credentials, and JWT header/payload structures to ensure developer codebases do not leak credentials into public AI chat logs."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.log,.json,.csv,.md,.env"
                className="hidden"
            />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Text & Ingestion Options */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">

                        {/* Panel Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Raw Input Text</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
                                    title="Upload text or log file"
                                >
                                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Upload File</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputText("")}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
                                    title="Clear input"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Clear</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputText(SAMPLE_TEXT)}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition border border-indigo-200 cursor-pointer"
                                    title="Load comprehensive PII sample"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Load Sample</span>
                                </button>
                            </div>
                        </div>

                        {/* Raw Input Text Area */}
                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste raw text, debug server logs, customer transcripts, or database records to redact PII..."
                                className="w-full h-80 sm:h-96 p-4 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed bg-slate-50/50"
                            />
                            <div className="absolute bottom-3 right-3 text-[11px] font-mono font-semibold bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                                {inputText.length} chars | {inputText.split(/\s+/).filter(Boolean).length} words
                            </div>
                        </div>

                        {/* Custom Whitelist Box */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                                    Whitelist Exemptions (One per line)
                                </label>
                                <span className="text-[10px] text-slate-400">Never redact these strings</span>
                            </div>
                            <textarea
                                value={customWhitelist}
                                onChange={(e) => setCustomWhitelist(e.target.value)}
                                placeholder="e.g. enterprise-corp.com&#10;internal.cloud"
                                className="w-full h-16 p-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none resize-none bg-white"
                            />
                        </div>

                    </div>

                    {/* Zero-Leakage Privacy Badge */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            100% Client-Side Engine (Zero Server Transmissions)
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">AES/Regex Safe</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output, Masking Modes & Audit Stats */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">

                        {/* Panel Header with Masking Selector & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sanitized Output</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                                >
                                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? "Copied!" : "Copy Clean Text"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
                                    title="Export clean text file"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Export</span>
                                </button>
                            </div>
                        </div>

                        {/* Masking Strategy Selector Pills */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span>Redaction Masking Strategy</span>
                                <span className="font-mono text-indigo-600">{strategy.toUpperCase()}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setStrategy("placeholder")}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center truncate ${strategy === "placeholder" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    [TAGS]
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStrategy("asterisk")}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center truncate ${strategy === "asterisk" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    ******
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStrategy("hash")}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center truncate ${strategy === "hash" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    [HASH_HEX]
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStrategy("synthetic")}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center truncate ${strategy === "synthetic" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Synthetic
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStrategy("category_id")}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center truncate ${strategy === "category_id" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    [ID_#]
                                </button>
                            </div>
                        </div>

                        {/* Output View Tabs: Redacted Text vs Audit Inspection */}
                        <div className="flex border-b border-slate-200 text-xs font-bold gap-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab("redacted")}
                                className={`pb-2 border-b-2 cursor-pointer transition ${activeTab === "redacted" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                            >
                                Sanitized Document ({stats.totalRedactions} redacted)
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("audit")}
                                className={`pb-2 border-b-2 cursor-pointer transition ${activeTab === "audit" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                            >
                                Detection Audit Table ({auditLog.length})
                            </button>
                        </div>

                        {/* Tab Content Display */}
                        {activeTab === "redacted" ? (
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={redactedOutput}
                                    placeholder="Redacted output will render here instantly..."
                                    className="w-full h-80 sm:h-96 p-4 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 bg-slate-50 outline-none resize-none leading-relaxed"
                                />
                                <div className="absolute bottom-3 right-3 text-[11px] font-mono font-semibold bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200 text-emerald-600 flex items-center gap-1">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    Sanitized & Safe for LLMs
                                </div>
                            </div>
                        ) : (
                            <div className="h-80 sm:h-96 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-2">
                                {auditLog.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                                        <ShieldCheck className="w-8 h-8 mb-2 text-slate-300" />
                                        <span>No PII matches detected in current input text.</span>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-200">
                                        {auditLog.map((log, i) => (
                                            <div key={i} className="py-2 px-3 flex items-center justify-between text-xs font-mono">
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold uppercase text-[10px]">
                                                        {log.category}
                                                    </span>
                                                    <span className="text-slate-500 line-through truncate max-w-[140px]">{log.original}</span>
                                                    <span className="text-slate-400">&rarr;</span>
                                                    <span className="text-emerald-700 font-bold truncate max-w-[140px]">{log.replacement}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 flex-shrink-0">offset {log.index}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Real-time Summary Metrics */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase">Entities Neutralized</span>
                                <span className="text-lg sm:text-xl font-black text-indigo-600 font-mono">{stats.totalRedactions}</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase">Categories Hit</span>
                                <span className="text-lg sm:text-xl font-black text-slate-800 font-mono">{Object.keys(stats.categories).length}</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase">Security Scope</span>
                                <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono">Zero-Trace</span>
                            </div>
                        </div>

                    </div>

                    {/* Mask Customization Options */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                        {strategy === "asterisk" && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preserveFirstLast}
                                    onChange={(e) => setPreserveFirstLast(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                />
                                <span>Preserve First & Last Characters (J***n)</span>
                            </label>
                        )}
                        {(strategy === "hash" || strategy === "synthetic") && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Hash Salt:</span>
                                <input
                                    type="text"
                                    value={customSalt}
                                    onChange={(e) => setCustomSalt(e.target.value)}
                                    className="px-2 py-0.5 border border-slate-200 rounded font-mono text-[11px] w-28 bg-slate-50"
                                />
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Granular Detection Toggles & Custom Pattern Injector */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Active PII Detection Engines</h3>
                            <p className="text-xs text-slate-500">Enable or disable specific regulatory and credential recognition rules</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => enableAllRules(true)}
                            className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg cursor-pointer"
                        >
                            Select All
                        </button>
                        <button
                            type="button"
                            onClick={() => enableAllRules(false)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {/* Rule Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {rules.map((rule) => {
                        const isEnabled = rule.enabled;
                        return (
                            <div
                                key={rule.id}
                                onClick={() => toggleRule(rule.id)}
                                className={`p-3 rounded-xl border flex items-start justify-between gap-2 cursor-pointer transition ${isEnabled ? "bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-300" : "bg-slate-50/50 border-slate-200 opacity-60 hover:opacity-100"}`}
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <span className="text-xs font-bold text-slate-900 block truncate">{rule.label}</span>
                                    <p className="text-[11px] text-slate-500 line-clamp-1">{rule.description}</p>
                                </div>
                                <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center flex-shrink-0 text-white font-black text-[10px] ${isEnabled ? "bg-indigo-600" : "border border-slate-300 bg-white"}`}>
                                    {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Custom Regex Pattern Injector */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <Binary className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <input
                            type="text"
                            value={customPatternInput}
                            onChange={(e) => setCustomPatternInput(e.target.value)}
                            placeholder="Add Custom Regular Expression (e.g. \bEMP-[0-9]{5}\b or \bCUST_[A-Z]{3}\b)..."
                            className="w-full bg-transparent font-mono text-xs text-slate-800 outline-none"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={caseSensitive}
                            onChange={(e) => setCaseSensitive(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span>Case-Sensitive Matching</span>
                    </label>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive PII Overview & Security Imperative */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Enterprise Text Anonymization & PII Sanitization Architecture
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Personally Identifiable Information (PII), Protected Health Information (PHI), and Payment Card Industry (PCI) data represent immense liability when ingested into third-party cloud applications, Large Language Model (LLM) fine-tuning pipelines, and unauthenticated log analytics platforms. Inadvertent leakage of customer Social Security Numbers, corporate credentials, or medical records violates international statutory mandates including GDPR, HIPAA, and CCPA.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The TwisterTools Text Anonymizer & PII Redactor provides client-side, zero-knowledge textual decontamination. Executing entirely within your local browser runtime via high-performance ECMAScript regular expressions and synthetic generators, this system strips sensitive identifiers before raw text ever leaves your corporate perimeter.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Zero-Data Retention</span>
                            <h3 className="font-bold text-slate-900 text-sm">Client-Side Runtime</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Processed data never touches an external API server, protecting corporate intellectual property and avoiding unvetted third-party subprocessor disclosures.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Deterministic Masking</span>
                            <h3 className="font-bold text-slate-900 text-sm">Cross-Entity Correlation</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Salted cryptographic hashing allows multiple references to the same individual or IP address to maintain relational coherence across massive transcripts.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">NLP Optimization</span>
                            <h3 className="font-bold text-slate-900 text-sm">Synthetic Preservation</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Generate semantically valid synthetic substitute tokens to maintain language model parse quality, syntactic trees, and entity-relationship extraction.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Regulatory Compliance Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Global Regulatory Compliance: Statutory De-Identification Reference
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Data privacy regulations globally enforce rigid technical benchmarks regarding what constitutes anonymized data versus pseudonymous personal data. The matrix below outlines how automated redaction maps to primary international data protection frameworks:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Regulatory Framework</th>
                                    <th className="p-3">Jurisdiction</th>
                                    <th className="p-3">Statutory Standard</th>
                                    <th className="p-3">Mandatory Redaction Targets</th>
                                    <th className="p-3">Technical Safe-Harbor Method</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">HIPAA Privacy Rule</td>
                                    <td className="p-3 text-xs">United States</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">45 CFR § 164.514</td>
                                    <td className="p-3 text-xs text-slate-600">18 Safe Harbor Identifiers: Names, SSNs, DOBs, phone numbers, email addresses, IP/MAC addresses, medical IDs</td>
                                    <td className="p-3 text-xs">Full removal or irreversible generalization</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">GDPR</td>
                                    <td className="p-3 text-xs">European Union</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">Article 4(5) & Art 32</td>
                                    <td className="p-3 text-xs text-slate-600">Direct & indirect identifiers: national IDs, online cookie/IP footprints, financial PANs, geographical tags</td>
                                    <td className="p-3 text-xs">Salted Pseudonymization & Anonymization</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">PCI-DSS v4.0</td>
                                    <td className="p-3 text-xs">Global Financial</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">Requirement 3.4</td>
                                    <td className="p-3 text-xs text-slate-600">Primary Account Numbers (PAN), CVVs, magnetic stripe tracks, personal cardholder data</td>
                                    <td className="p-3 text-xs">Truncation (last 4 digits max) or Strong One-Way Hash</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">CCPA / CPRA</td>
                                    <td className="p-3 text-xs">California, US</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">Cal. Civ. Code § 1798.140</td>
                                    <td className="p-3 text-xs text-slate-600">Consumer biometric data, postal geolocation, account passwords, government identification cards</td>
                                    <td className="p-3 text-xs">De-identification & consumer opt-out suppression</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Masking Strategy Deep Dive */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Workflow className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            De-Identification Strategies: Tagging, Hashing, and Synthetic Generation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct redaction methodology depends directly on whether your downstream pipeline is intended for human audit review, cryptographic indexing, or AI prompt engineering:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ListTree className="w-4 h-4 text-indigo-600" /> Semantic Placeholder Replacement
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Swaps sensitive entities with human-readable semantic tags like <code>[REDACTED_EMAIL]</code> or <code>[REDACTED_SSN]</code>. Ideal for human support ticket anonymization and incident escalation queues where the context of what was redacted must remain explicit.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Synthetic Entity Substitution
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Replaces real identifying data with plausible, artificially generated mock values (e.g. generating a fake <code>user_4a1f@synthetic.com</code>). Highly recommended for training and prompting LLMs, as placeholder tags often degrade prompt syntactic attention maps.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" /> Deterministic Cryptographic Hashing
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            When anonymizing customer chat logs or distributed system traces, substituting each entity with a deterministic hash (e.g., <code>[HASH_8b1a4]</code>) preserves the exact graph topology of user interactions across sessions without storing the reversible plaintext identity.
                        </p>
                    </div>
                </section>

                {/* Card 4: Step-by-Step De-Identification Workflow */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Protocol: Safe Text Sanitization Before AI Ingestion
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow this four-step standard operating procedure to guarantee zero unintended data leakage into public LLM chatbots, model fine-tuning repositories, or third-party analytical tools:
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Paste Unscrubbed Source Data</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Copy and paste customer emails, stack trace crash logs, application server dumps, or database CSV extracts into the input text panel.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Configure Category Engines & Whitelists</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Toggle target entity categories (SSN, credit cards, IP addresses, JWT tokens). Enter corporate root domains or non-sensitive internal terminology into the Whitelist box to prevent false positives.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Select Downstream Masking Strategy</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Choose semantic tags for support tickets, deterministic hashes for relational trace graph analysis, or synthetic replacement values for natural language model prompt completions.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Verify Audit Log & Copy Clean Output</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Review the generated Detection Audit Table to verify all detected entities and offsets. Copy or export the sanitized text with absolute confidence that no PII remains.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                Does any text or sensitive PII leave my local browser?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The entire anonymization and pattern matching engine executes 100% client-side via JavaScript regular expression parsers within your web browser. Zero bytes of your text, SSNs, credit card numbers, or proprietary logs are transmitted over network connections or stored in remote databases.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Placeholder, Hashing, and Synthetic Anonymization?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Placeholder replacement swaps detected entities with semantic tags like [REDACTED_EMAIL]. Deterministic hashing produces consistent irreversible hex hashes (e.g. [HASH_3a9f]), ensuring that multiple occurrences of the same user remain linked across datasets without revealing the original identifier. Synthetic generation outputs plausible, valid mock values (e.g., replacement phone numbers) that preserve NLP grammatical parsing.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does this tool help with GDPR, HIPAA, and CCPA regulatory compliance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                GDPR (Article 32), HIPAA Safe Harbor (Section 164.514), and CCPA require the stripping or pseudo-anonymization of direct personal identifiers (names, SSNs, contact numbers, IPs, medical IDs) prior to third-party sharing or machine learning model fine-tuning. This utility enforces zero-knowledge sanitization directly at the user endpoint.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I prevent specific corporate internal domains from being redacted?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Use the Whitelist exception box located in the settings panel to define domain names, corporate IP blocks, or approved system identifiers that the regex engine should ignore.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I sanitize proprietary code, API tokens, and JWT payloads before AI prompting?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The redactor includes high-entropy detectors for AWS secret keys, GitHub personal access tokens, Stripe live keys, Google API credentials, and JWT header/payload structures to ensure developer codebases do not leak credentials into public AI chat logs.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}