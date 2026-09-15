"use client";

import React, { useState, useMemo, useId } from "react";
import {
    KeyRound,
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
    ExternalLink,
    Code2,
    Lock,
    Cpu,
    Search
} from "lucide-react";

type KeyType = "rsa" | "ed25519";
type ServicePreset = "custom" | "google" | "microsoft" | "sendgrid" | "mailchimp" | "postmark" | "amazonses";
type HashAlgorithm = "all" | "sha256";

interface PresetConfig {
    name: string;
    selector: string;
    keyType: KeyType;
    hash: HashAlgorithm;
    subdomainsAllowed: boolean;
    testingMode: boolean;
    sampleKey: string;
    notes: string;
}

const PRESET_CONFIGS: Record<ServicePreset, PresetConfig> = {
    custom: {
        name: "Custom / Generic",
        selector: "default",
        keyType: "rsa",
        hash: "all",
        subdomainsAllowed: false,
        testingMode: false,
        sampleKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Y3wZ91vX...",
        notes: "Standard RFC 6376 configuration compatible with any RFC-compliant MTA."
    },
    google: {
        name: "Google Workspace",
        selector: "google",
        keyType: "rsa",
        hash: "sha256",
        subdomainsAllowed: false,
        testingMode: false,
        sampleKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt6w1Q...",
        notes: "Google Workspace generates 2048-bit RSA keys with 'google' as the standard selector prefix."
    },
    microsoft: {
        name: "Microsoft 365 / Exchange",
        selector: "selector1",
        keyType: "rsa",
        hash: "sha256",
        subdomainsAllowed: false,
        testingMode: false,
        sampleKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuP7xK...",
        notes: "Microsoft 365 automatically rotates dual selectors (selector1 and selector2) using CNAME or TXT pointing."
    },
    sendgrid: {
        name: "Twilio SendGrid",
        selector: "s1",
        keyType: "rsa",
        hash: "sha256",
        subdomainsAllowed: true,
        testingMode: false,
        sampleKey: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3Q...",
        notes: "SendGrid typically employs automated CNAME delegators with selectors named s1 and s2."
    },
    mailchimp: {
        name: "Mailchimp / Mandrill",
        selector: "k1",
        keyType: "rsa",
        hash: "sha256",
        subdomainsAllowed: false,
        testingMode: false,
        sampleKey: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDn...",
        notes: "Mailchimp commonly issues selector k1 under the domain key hierarchy."
    },
    postmark: {
        name: "Postmark (ActiveCampaign)",
        selector: "202609pm",
        keyType: "rsa",
        hash: "sha256",
        subdomainsAllowed: false,
        testingMode: false,
        sampleKey: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv1...",
        notes: "Postmark generates high-entropy date-stamped RSA 2048-bit selectors for robust outbound deliverability."
    },
    amazonses: {
        name: "Amazon Simple Email Service (SES)",
        selector: "7wz4example",
        keyType: "rsa",
        hash: "sha256",
        subdomainsAllowed: false,
        testingMode: false,
        sampleKey: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...",
        notes: "Amazon SES utilizes Easy DKIM with three CNAME record tokens or manual TXT verification."
    }
};

export default function DkimRecordGenerator() {
    // Mode Switch: Generator vs Raw Inspector
    const [activeTab, setActiveTab] = useState<"generator" | "inspector">("generator");

    // Generator Form States
    const [domain, setDomain] = useState<string>("example.com");
    const [selector, setSelector] = useState<string>("default");
    const [keyType, setKeyType] = useState<KeyType>("rsa");
    const [hashAlgorithm, setHashAlgorithm] = useState<HashAlgorithm>("sha256");
    const [publicKey, setPublicKey] = useState<string>(
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Y3wZ91vX97Z8y0q4gWj7NlXbO3o1QfM+E6Z5V4vL7M3p7qW2sF9d3H4rG6tP8mY2uI0bK6v8h7j3w5e2Q6p5m1c9m0v5n1c7d2e4g9a8s7d6f5g4h3j2k1l0m9n8b7v6c5x4z3a2s1d0f9g8h7j6k5l4m3n2b1v0c9x8z7a6s5d4f3g2h1j0k9l8m7n6b5v4c3x2z1a0s9d8f7g6h5j4k3l2m1n0b9v8c7x6z5a4s3d2f1g0h9j8k7l6m5n4b3v2c1x0z"
    );
    const [subdomainsAllowed, setSubdomainsAllowed] = useState<boolean>(false);
    const [testingMode, setTestingMode] = useState<boolean>(false);
    const [serviceTypeMailOnly, setServiceTypeMailOnly] = useState<boolean>(true);
    const [copiedRecord, setCopiedRecord] = useState<boolean>(false);
    const [copiedHost, setCopiedHost] = useState<boolean>(false);
    const [chunkDnsStrings, setChunkDnsStrings] = useState<boolean>(false);

    // Inspector States
    const [rawRecordInput, setRawRecordInput] = useState<string>(
        "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Y3wZ91vX97Z8y0q4gWj7NlXbO3o1QfM+E6Z5V4vL7M3p7qW2sF9d3H4rG6tP8mY2uI0bK6v8h7j3w5e2Q6p5m1c9m0v5n1c7d2e4g9a8s7d6f5g4h3j2k1l0m9n8b7v6c5x4z3a2s1d0f9g8h7j6k5l4m3n2b1v0c9x8z7a6s5d4f3g2h1j0k9l8m7n6b5v4c3x2z1a0s9d8f7g6h5j4k3l2m1n0b9v8c7x6z5a4s3d2f1g0h9j8k7l6m5n4b3v2c1x0z; s=email; t=s"
    );

    // Form element IDs for WCAG accessibility
    const domainInputId = useId();
    const selectorInputId = useId();
    const keyTypeSelectId = useId();
    const hashSelectId = useId();
    const publicKeyTextareaId = useId();
    const inspectorTextareaId = useId();

    // Sanitize domain
    const cleanDomain = useMemo(() => {
        let cleaned = domain.trim().toLowerCase();
        cleaned = cleaned.replace(/^https?:\/\//, "");
        cleaned = cleaned.replace(/\/.*$/, "");
        return cleaned || "example.com";
    }, [domain]);

    // Sanitize selector
    const cleanSelector = useMemo(() => {
        const trimmed = selector.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
        return trimmed || "default";
    }, [selector]);

    // Format public key (stripping headers, whitespace, line breaks)
    const cleanedPublicKey = useMemo(() => {
        return publicKey
            .replace(/-----BEGIN (RSA )?PUBLIC KEY-----/gi, "")
            .replace(/-----END (RSA )?PUBLIC KEY-----/gi, "")
            .replace(/\s+/g, "");
    }, [publicKey]);

    // Public Key estimated bit length
    const keyBitDepthEstimate = useMemo(() => {
        if (!cleanedPublicKey) return 0;
        try {
            const rawLength = cleanedPublicKey.length;
            // Base64 represents 6 bits per char. RSA ASN.1 header overhead is roughly 24-38 bytes (~32 chars)
            const estimatedBytes = Math.max(0, Math.floor((rawLength * 3) / 4) - 32);
            const estimatedBits = estimatedBytes * 8;
            if (estimatedBits >= 3800) return 4096;
            if (estimatedBits >= 1900) return 2048;
            if (estimatedBits >= 900) return 1024;
            if (estimatedBits >= 450) return 512;
            return estimatedBits;
        } catch {
            return 0;
        }
    }, [cleanedPublicKey]);

    // DNS Host String
    const dkimHostString = useMemo(() => {
        return `${cleanSelector}._domainkey.${cleanDomain}`;
    }, [cleanSelector, cleanDomain]);

    // Construct Canonical DKIM Record
    const rawGeneratedRecord = useMemo(() => {
        const parts: string[] = ["v=DKIM1"];

        if (keyType !== "rsa") {
            parts.push(`k=${keyType}`);
        } else {
            parts.push("k=rsa");
        }

        if (hashAlgorithm === "sha256") {
            parts.push("h=sha256");
        }

        if (serviceTypeMailOnly) {
            parts.push("s=email");
        }

        const flags: string[] = [];
        if (testingMode) flags.push("y");
        if (subdomainsAllowed) flags.push("s");
        if (flags.length > 0) {
            parts.push(`t=${flags.join(":")}`);
        }

        parts.push(`p=${cleanedPublicKey}`);

        return parts.join("; ");
    }, [keyType, hashAlgorithm, serviceTypeMailOnly, testingMode, subdomainsAllowed, cleanedPublicKey]);

    // Split for BIND / DNS 255-character limits if requested
    const formattedDnsValue = useMemo(() => {
        if (!chunkDnsStrings) {
            return rawGeneratedRecord;
        }
        // Split string into 200-character segments quoted for BIND zone files
        const chunks = rawGeneratedRecord.match(/.{1,200}/g) || [rawGeneratedRecord];
        return chunks.map((c) => `"${c}"`).join(" ");
    }, [rawGeneratedRecord, chunkDnsStrings]);

    // Security & Configuration Warnings for Generator
    const generatorAudits = useMemo(() => {
        const issues: { type: "danger" | "warning" | "success" | "info"; message: string }[] = [];

        if (!cleanedPublicKey) {
            issues.push({
                type: "danger",
                message: "Public Key (p= tag) is empty. An empty p= tag revokes all previously signed keys under this selector."
            });
        } else if (keyType === "rsa") {
            if (keyBitDepthEstimate > 0 && keyBitDepthEstimate < 1024) {
                issues.push({
                    type: "danger",
                    message: "Key length is critically weak (<1024 bits). Major providers like Google and Yahoo will reject signatures signed with this key."
                });
            } else if (keyBitDepthEstimate === 1024) {
                issues.push({
                    type: "warning",
                    message: "1024-bit RSA key detected. Industry standards strongly mandate migrating to 2048-bit RSA keys for modern perimeter security."
                });
            } else if (keyBitDepthEstimate >= 2048) {
                issues.push({
                    type: "success",
                    message: `Enterprise-grade RSA key strength detected (~${keyBitDepthEstimate} bits). Fully compliant with modern bulk-sender standards.`
                });
            }
        } else if (keyType === "ed25519") {
            issues.push({
                type: "info",
                message: "Ed25519 modern elliptic curve selected. Offers compact keys with high security, though some legacy MTAs may still require RSA fallback."
            });
        }

        if (testingMode) {
            issues.push({
                type: "warning",
                message: "Testing flag (t=y) enabled. Receiving MTAs will evaluate signatures without penalizing or rejecting failures in production."
            });
        }

        if (subdomainsAllowed) {
            issues.push({
                type: "info",
                message: "Subdomain signing flag (t=s) enabled. This public key record will validate DKIM signatures emitted by delegated subdomains."
            });
        }

        return issues;
    }, [cleanedPublicKey, keyType, keyBitDepthEstimate, testingMode, subdomainsAllowed]);

    // Inspector Parser Logic
    const parsedInspectorData = useMemo(() => {
        const raw = rawRecordInput.trim().replace(/^"|"$/g, "");
        const tokens = raw.split(";").map((t) => t.trim()).filter(Boolean);
        const map: Record<string, string> = {};

        tokens.forEach((tok) => {
            const eqIndex = tok.indexOf("=");
            if (eqIndex !== -1) {
                const tag = tok.slice(0, eqIndex).trim();
                const val = tok.slice(eqIndex + 1).trim();
                map[tag] = val;
            }
        });

        const v = map["v"] || "Not explicitly specified (Defaults to DKIM1 if omitted, but RFC 6376 recommends v=DKIM1)";
        const k = map["k"] || "rsa (default)";
        const p = map["p"] || "";
        const h = map["h"] || "any / all (sha1, sha256)";
        const s = map["s"] || "* (all service types)";
        const t = map["t"] || "none";
        const n = map["n"] || "none (optional administrator note)";

        const isRevoked = p === "";
        const flags = t.split(":").map((f) => f.trim());
        const hasTestFlag = flags.includes("y");
        const hasStrictSubdomainFlag = flags.includes("s");

        let pBitEstimate = 0;
        if (p) {
            const cleanP = p.replace(/\s+/g, "");
            const bytes = Math.max(0, Math.floor((cleanP.length * 3) / 4) - 32);
            pBitEstimate = bytes * 8;
        }

        return {
            map,
            tokenCount: Object.keys(map).length,
            v,
            k,
            p,
            h,
            s,
            t,
            n,
            isRevoked,
            hasTestFlag,
            hasStrictSubdomainFlag,
            pBitEstimate: pBitEstimate >= 1800 ? 2048 : pBitEstimate >= 900 ? 1024 : pBitEstimate
        };
    }, [rawRecordInput]);

    // Handlers
    const handleCopyRecord = () => {
        navigator.clipboard.writeText(formattedDnsValue);
        setCopiedRecord(true);
        setTimeout(() => setCopiedRecord(false), 2000);
    };

    const handleCopyHost = () => {
        navigator.clipboard.writeText(dkimHostString);
        setCopiedHost(true);
        setTimeout(() => setCopiedHost(false), 2000);
    };

    const handleApplyPreset = (presetKey: ServicePreset) => {
        const config = PRESET_CONFIGS[presetKey];
        setSelector(config.selector);
        setKeyType(config.keyType);
        setHashAlgorithm(config.hash);
        setSubdomainsAllowed(config.subdomainsAllowed);
        setTestingMode(config.testingMode);
        if (config.sampleKey) {
            setPublicKey(config.sampleKey);
        }
    };

    const handleReset = () => {
        setDomain("example.com");
        setSelector("default");
        setKeyType("rsa");
        setHashAlgorithm("sha256");
        setPublicKey(
            "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Y3wZ91vX97Z8y0q4gWj7NlXbO3o1QfM+E6Z5V4vL7M3p7qW2sF9d3H4rG6tP8mY2uI0bK6v8h7j3w5e2Q6p5m1c9m0v5n1c7d2e4g9a8s7d6f5g4h3j2k1l0m9n8b7v6c5x4z3a2s1d0f9g8h7j6k5l4m3n2b1v0c9x8z7a6s5d4f3g2h1j0k9l8m7n6b5v4c3x2z1a0s9d8f7g6h5j4k3l2m1n0b9v8c7x6z5a4s3d2f1g0h9j8k7l6m5n4b3v2c1x0z"
        );
        setSubdomainsAllowed(false);
        setTestingMode(false);
        setServiceTypeMailOnly(true);
        setChunkDnsStrings(false);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "DKIM Selector Public Key Record Inspector & Generator",
        "url": "https://twistertools.com/tools/web-tools/dkim-record-generator",
        "description": "Enterprise RFC 6376 DKIM TXT record generator, cryptographic public key bit-depth validator, and syntax inspector for DNS email authentication.",
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
                "name": "What is a DKIM Selector and why is it required in DNS?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A DKIM selector is an arbitrary string assigned by an email sender that differentiates multiple public keys published under a single domain. It allows an organization to sign emails from multiple providers (e.g., Google Workspace, Zendesk, SendGrid) without key collisions, and enables periodic cryptographic key rotation without downtime."
                }
            },
            {
                "@type": "Question",
                "name": "Where should the DKIM record be published in DNS?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A DKIM record must be published as a DNS TXT or CNAME record at the subdomain location formatted as [selector]._domainkey.[yourdomain.com]. For example, if your selector is 'google' and your domain is 'example.com', the DNS host label is 'google._domainkey.example.com'."
                }
            },
            {
                "@type": "Question",
                "name": "Why are 2048-bit RSA keys recommended over 1024-bit RSA keys?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "1024-bit RSA keys can theoretically be factored using modern distributed computing clusters. Major email receivers including Google and Yahoo enforce 2048-bit RSA keys for high-volume outbound senders. Keys shorter than 1024 bits are treated as untrusted or invalid."
                }
            },
            {
                "@type": "Question",
                "name": "How does DNS handle DKIM records exceeding 255 characters?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "RFC 1035 limits an individual character-string within a DNS TXT record to 255 octets. Since a 2048-bit RSA key spans over 400 characters, DNS administrators must split the record into multiple double-quoted strings within a single resource record. Resolvers concatenate these strings automatically during verification."
                }
            },
            {
                "@type": "Question",
                "name": "What is the consequence of publishing an empty public key tag (p=)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Under RFC 6376 §3.6.1, an empty p= tag explicitly signals key revocation. Receiving mail transfer agents will treat any email signed by that specific selector as unauthenticated, failing DKIM verification."
                }
            },
            {
                "@type": "Question",
                "name": "What do the DKIM flags t=s and t=y signify?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 't' tag specifies operational flags. The 't=s' flag restricts key matching to the exact domain only, prohibiting subdomains from using the parent key. The 't=y' flag signals testing mode, requesting receiving MTAs to inspect the signature but avoid rejecting failing messages."
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

            {/* Top Mode Toggle Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("generator")}
                        className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${activeTab === "generator"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                    >
                        <Sliders className="w-4 h-4" />
                        Record Generator & Key Formatter
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("inspector")}
                        className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${activeTab === "inspector"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                    >
                        <Search className="w-4 h-4" />
                        Raw Record Tag Inspector
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>RFC 6376 / RFC 8301 Standard</span>
                </div>
            </div>

            {/* TAB 1: GENERATOR & FORMATTER */}
            {activeTab === "generator" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                    {/* Left Column: Generator Form (Span 6) */}
                    <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                DKIM Key & DNS Record Parameters
                            </h2>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Reset
                            </button>
                        </div>

                        {/* Presets Bar */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Provider Selector Preset:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                                {(["custom", "google", "microsoft", "sendgrid", "mailchimp", "postmark", "amazonses"] as ServicePreset[]).map((pr) => (
                                    <button
                                        key={pr}
                                        type="button"
                                        onClick={() => handleApplyPreset(pr)}
                                        className="py-1.5 px-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer truncate text-center"
                                    >
                                        {PRESET_CONFIGS[pr].name.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Domain and Selector Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor={domainInputId}
                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                >
                                    Base Domain:
                                </label>
                                <input
                                    id={domainInputId}
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="example.com"
                                    aria-label="Target domain name for DKIM key"
                                    className="w-full px-3 py-2 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor={selectorInputId}
                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                >
                                    DKIM Selector:
                                </label>
                                <input
                                    id={selectorInputId}
                                    type="text"
                                    value={selector}
                                    onChange={(e) => setSelector(e.target.value)}
                                    placeholder="e.g. google, k1, default"
                                    aria-label="DKIM Selector prefix name"
                                    className="w-full px-3 py-2 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Key Type & Hash Algorithm */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor={keyTypeSelectId}
                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                >
                                    Key Algorithm (k=):
                                </label>
                                <select
                                    id={keyTypeSelectId}
                                    value={keyType}
                                    onChange={(e) => setKeyType(e.target.value as KeyType)}
                                    aria-label="DKIM cryptographic key type"
                                    className="w-full px-3 py-2 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                >
                                    <option value="rsa">RSA (Universal compatibility, RFC 6376)</option>
                                    <option value="ed25519">Ed25519 (Modern elliptic curve, RFC 8463)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor={hashSelectId}
                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                >
                                    Hash Digest (h=):
                                </label>
                                <select
                                    id={hashSelectId}
                                    value={hashAlgorithm}
                                    onChange={(e) => setHashAlgorithm(e.target.value as HashAlgorithm)}
                                    aria-label="DKIM acceptable hash algorithms"
                                    className="w-full px-3 py-2 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                >
                                    <option value="sha256">sha256 (Enforced secure digest)</option>
                                    <option value="all">Allow all hashes (sha1, sha256)</option>
                                </select>
                            </div>
                        </div>

                        {/* Public Key String / Base64 Data Input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor={publicKeyTextareaId}
                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                >
                                    Public Key Base64 Payload (p= tag):
                                </label>
                                {keyBitDepthEstimate > 0 && (
                                    <span
                                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${keyBitDepthEstimate >= 2048
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                                            }`}
                                    >
                                        ~{keyBitDepthEstimate}-bit Key
                                    </span>
                                )}
                            </div>
                            <textarea
                                id={publicKeyTextareaId}
                                rows={5}
                                value={publicKey}
                                onChange={(e) => setPublicKey(e.target.value)}
                                placeholder="Paste your Base64 public key or PEM block (-----BEGIN PUBLIC KEY-----)"
                                aria-label="Base64 public key data"
                                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                            />
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                PEM headers (-----BEGIN PUBLIC KEY-----) and line wraps are stripped automatically for DNS TXT compatibility.
                            </p>
                        </div>

                        {/* Optional RFC Flags */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                RFC Flags & Constraints:
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={serviceTypeMailOnly}
                                        onChange={(e) => setServiceTypeMailOnly(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>
                                        <strong>Service Tag (s=email):</strong> Restrict this cryptographic key strictly to email delivery.
                                    </span>
                                </label>

                                <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={subdomainsAllowed}
                                        onChange={(e) => setSubdomainsAllowed(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>
                                        <strong>Subdomain Flag (t=s):</strong> Allow delegated subdomains to sign with this parent key.
                                    </span>
                                </label>

                                <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={testingMode}
                                        onChange={(e) => setTestingMode(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>
                                        <strong>Testing Mode (t=y):</strong> Inform MTAs that verification is experimental.
                                    </span>
                                </label>

                                <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={chunkDnsStrings}
                                        onChange={(e) => setChunkDnsStrings(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>
                                        <strong>Split 255-Char Chunks:</strong> Format into quoted strings for BIND zone files.
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Output & Diagnostic Panel (Span 6) */}
                    <div className="lg:col-span-6 space-y-6 min-w-0">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    DNS Resource Record Entry
                                </h2>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                    RFC 6376 Format
                                </span>
                            </div>

                            {/* Host / Name Field */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        DNS Host / Name:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyHost}
                                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedHost ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedHost ? "Copied" : "Copy Name"}
                                    </button>
                                </div>
                                <p className="font-mono text-xs font-bold text-slate-900 dark:text-white select-all break-all">
                                    {dkimHostString}
                                </p>
                            </div>

                            {/* Record Type and TTL */}
                            <div className="grid grid-cols-2 gap-3">
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
                                        Recommended TTL:
                                    </span>
                                    <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                        3600 (1 Hour) / Auto
                                    </p>
                                </div>
                            </div>

                            {/* Formatted TXT Value Output */}
                            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                                        TXT Record Value / Data:
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {formattedDnsValue.length} characters
                                    </span>
                                </div>
                                <div className="font-mono text-xs text-indigo-300 break-all select-all leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-48 overflow-y-auto">
                                    {formattedDnsValue}
                                </div>
                            </div>

                            {/* Copy Full Record Action */}
                            <button
                                type="button"
                                onClick={handleCopyRecord}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copiedRecord
                                        ? "bg-emerald-600 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                            >
                                {copiedRecord ? (
                                    <>
                                        <Check className="w-5 h-5 text-white" />
                                        <span>Copied TXT Value to Clipboard!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-5 h-5 text-white" />
                                        <span>Copy DKIM TXT Record Value</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Cryptographic Key Health & Configuration Diagnostics */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Key Health & Security Diagnostics
                            </h3>
                            <div className="space-y-2">
                                {generatorAudits.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${item.type === "danger"
                                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                                                : item.type === "warning"
                                                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50"
                                                    : item.type === "success"
                                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                                                        : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50"
                                            }`}
                                    >
                                        {item.type === "danger" && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />}
                                        {item.type === "warning" && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />}
                                        {item.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />}
                                        {item.type === "info" && <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />}
                                        <span className="leading-relaxed">{item.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: RAW RECORD TAG INSPECTOR */}
            {activeTab === "inspector" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                    {/* Left Column: Raw Input (Span 6) */}
                    <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 min-w-0">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Inspect Existing DKIM DNS TXT Record
                            </h2>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Paste an existing DKIM TXT record retrieved via <code className="font-mono text-indigo-600 dark:text-indigo-400">dig TXT [selector]._domainkey.domain.com</code> or your DNS host dashboard to deconstruct its cryptographic tags and detect syntax flaws.
                        </p>

                        <div className="space-y-1.5">
                            <label
                                htmlFor={inspectorTextareaId}
                                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Raw DKIM TXT Record String:
                            </label>
                            <textarea
                                id={inspectorTextareaId}
                                rows={6}
                                value={rawRecordInput}
                                onChange={(e) => setRawRecordInput(e.target.value)}
                                placeholder="v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
                                aria-label="Raw DKIM string for inspection"
                                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setRawRecordInput(
                                        "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Y3wZ91vX97Z8y0q4gWj7NlXbO3o1QfM+E6Z5V4vL7M3p7qW2sF9d3H4rG6tP8mY2uI0bK6v8h7j3w5e2Q6p5m1c9m0v5n1c7d2e4g9a8s7d6f5g4h3j2k1l0m9n8b7v6c5x4z3a2s1d0f9g8h7j6k5l4m3n2b1v0c9x8z7a6s5d4f3g2h1j0k9l8m7n6b5v4c3x2z1a0s9d8f7g6h5j4k3l2m1n0b9v8c7x6z5a4s3d2f1g0h9j8k7l6m5n4b3v2c1x0z"
                                    )
                                }
                                className="text-xs py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-medium transition"
                            >
                                Standard 2048-bit Sample
                            </button>
                            <button
                                type="button"
                                onClick={() => setRawRecordInput("v=DKIM1; p=")}
                                className="text-xs py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-medium transition"
                            >
                                Revoked Key Sample (p=)
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setRawRecordInput(
                                        "v=DKIM1; k=rsa; t=y:s; h=sha256; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3Q5..."
                                    )
                                }
                                className="text-xs py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-medium transition"
                            >
                                Testing & Subdomain Sample
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Deconstructed Tag Breakdown (Span 6) */}
                    <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Deconstructed Tag Analysis
                            </h2>
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {parsedInspectorData.tokenCount} Recognized Tags
                            </span>
                        </div>

                        {/* Status Banners */}
                        {parsedInspectorData.isRevoked && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2 font-semibold">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                <span>REVOCATION ALERT: Key data is blank (p=). This record revokes key authorization.</span>
                            </div>
                        )}

                        {parsedInspectorData.hasTestFlag && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span>TESTING MODE: Flag &lsquo;t=y&rsquo; is present. MTAs will disregard verification failures.</span>
                            </div>
                        )}

                        {/* Tag Data Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                        <th className="py-2 pr-3">Tag</th>
                                        <th className="py-2 pr-3">Parsed Value</th>
                                        <th className="py-2">RFC Interpretation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                    <tr>
                                        <td className="py-2.5 pr-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">v</td>
                                        <td className="py-2.5 pr-3 font-mono">{parsedInspectorData.v}</td>
                                        <td className="py-2.5">Protocol Version Standard</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">k</td>
                                        <td className="py-2.5 pr-3 font-mono">{parsedInspectorData.k}</td>
                                        <td className="py-2.5">Cryptographic Key Algorithm</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">h</td>
                                        <td className="py-2.5 pr-3 font-mono">{parsedInspectorData.h}</td>
                                        <td className="py-2.5">Acceptable Hash Algorithms</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">s</td>
                                        <td className="py-2.5 pr-3 font-mono">{parsedInspectorData.s}</td>
                                        <td className="py-2.5">Service Type Scope</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">t</td>
                                        <td className="py-2.5 pr-3 font-mono">{parsedInspectorData.t}</td>
                                        <td className="py-2.5">Flags (s=strict subdomain, y=testing)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 pr-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">p</td>
                                        <td className="py-2.5 pr-3 font-mono truncate max-w-[140px]">
                                            {parsedInspectorData.p ? `${parsedInspectorData.p.slice(0, 16)}...` : "(Empty)"}
                                        </td>
                                        <td className="py-2.5">
                                            {parsedInspectorData.p ? (
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                    ~{parsedInspectorData.pBitEstimate}-bit Public Key
                                                </span>
                                            ) : (
                                                <span className="text-rose-600 dark:text-rose-400 font-bold">Key Revoked</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* BELOW-THE-FOLD HIGH-VALUE SEO & EDUCATIONAL CARDS */}
            <div className="space-y-6">
                {/* Card 1: RFC 6376 Cryptographic Architecture */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Cryptographic Foundation of DKIM: RFC 6376 and RFC 8301
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        DomainKeys Identified Mail (DKIM) provides a digital signature mechanism for email verification. When an outbound Mail Transfer Agent (MTA) dispatches an email, it calculates a cryptographic hash over selected headers (such as From, Subject, and Date) along with the message body. This hash is encrypted using the domain owner&rsquo;s private key and attached to the email header as <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">DKIM-Signature</code>.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Selector DNS Delegation
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The selector tag (<code className="font-mono text-indigo-600 dark:text-indigo-400">s=</code>) isolates different signing keys under one domain. A company can host Google Workspace on <code className="font-mono text-xs">google._domainkey</code> while hosting SendGrid on <code className="font-mono text-xs">s1._domainkey</code> without key collision.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Tamper-Proof Integrity
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Receiving MTAs independently fetch the public key via DNS TXT lookup and decrypt the signature. If a single byte in the signed headers or message body was altered in transit, signature verification fails outright.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> DMARC Alignment Anchor
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Under RFC 7489, DMARC passes if the domain declared in the DKIM <code className="font-mono text-indigo-600 dark:text-indigo-400">d=</code> tag matches or aligns with the RFC 5322 From header, surviving message forwarding where SPF typically breaks.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> DKIM TXT Record Tag Specification
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono text-slate-300">
                                <thead>
                                    <tr className="border-b border-slate-800 text-indigo-300">
                                        <th className="py-2 pr-4 font-bold">Tag</th>
                                        <th className="py-2 pr-4 font-bold">Status</th>
                                        <th className="py-2 pr-4 font-bold">Default</th>
                                        <th className="py-2 font-bold">Functional Purpose</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">v=DKIM1</td>
                                        <td className="py-2 pr-4 text-emerald-400">Mandatory</td>
                                        <td className="py-2 pr-4">DKIM1</td>
                                        <td className="py-2">Identifies the DNS record as a DKIM public key record.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">k=</td>
                                        <td className="py-2 pr-4 text-slate-400">Optional</td>
                                        <td className="py-2 pr-4">rsa</td>
                                        <td className="py-2">Specifies key algorithm: rsa or ed25519 (RFC 8463).</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">p=</td>
                                        <td className="py-2 pr-4 text-emerald-400">Mandatory</td>
                                        <td className="py-2 pr-4">None</td>
                                        <td className="py-2">Base64-encoded public key data. An empty value explicitly revokes the key.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">h=</td>
                                        <td className="py-2 pr-4 text-slate-400">Optional</td>
                                        <td className="py-2 pr-4">sha1, sha256</td>
                                        <td className="py-2">Colon-separated acceptable hash algorithms. SHA-1 is deprecated by RFC 8301.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">s=</td>
                                        <td className="py-2 pr-4 text-slate-400">Optional</td>
                                        <td className="py-2 pr-4">*</td>
                                        <td className="py-2">Permitted service types. Setting &lsquo;s=email&rsquo; prevents other services using this key.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">t=</td>
                                        <td className="py-2 pr-4 text-slate-400">Optional</td>
                                        <td className="py-2 pr-4">None</td>
                                        <td className="py-2">Operational flags: &lsquo;y&rsquo; enables testing mode, &lsquo;s&rsquo; allows subdomain inheritance.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 2: 1024-bit vs 2048-bit vs Ed25519 Architecture */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Cryptographic Key Comparison: RSA 1024 vs RSA 2048 vs Ed25519
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Industry security mandates from major mailbox providers require retirement of obsolete key lengths. Compare the security parameters, DNS overhead, and compatibility profiles across modern standards:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Algorithm & Strength</th>
                                    <th className="p-3">Character Length</th>
                                    <th className="p-3">DNS Packet Size (&lt;512 UDP)</th>
                                    <th className="p-3">Mailbox Provider Support</th>
                                    <th className="p-3">Security Assessment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-rose-600 dark:text-rose-400">RSA 1024-bit</td>
                                    <td className="p-3 font-mono text-xs">~216 chars</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Fits in single 512B UDP</td>
                                    <td className="p-3">Legacy Support; Flagged by Google/Yahoo</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">Insecure; Deprecated</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">RSA 2048-bit</td>
                                    <td className="p-3 font-mono text-xs">~392-420 chars</td>
                                    <td className="p-3 text-amber-600 font-semibold">Requires EDNS0 or 255-char splitting</td>
                                    <td className="p-3 font-bold text-slate-900 dark:text-white">Universal Gold Standard (100%)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Enterprise Grade</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">Ed25519 (Curve25519)</td>
                                    <td className="p-3 font-mono text-xs">~44 chars</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Extremely compact (&lt;100 bytes)</td>
                                    <td className="p-3">Modern MTAs (RFC 8463); Some legacy gaps</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Future Proof</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: DNS String Splitting & Setup Playbook */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            DNS Administration: The 255-Octet String Limit and Key Rotation
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Setting up enterprise 2048-bit RSA keys often triggers DNS errors due to legacy protocol limits. Understand how DNS resolvers reconstruct long TXT records and how to execute seamless key rotations:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Resolving the 255-Character DNS Limit
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                <li>
                                    • <strong>RFC 1035 Constraints:</strong> Individual strings inside a DNS TXT record cannot exceed 255 bytes. A 2048-bit public key spans ~400 characters.
                                </li>
                                <li>
                                    • <strong>Quoted Chunking in BIND:</strong> In BIND and raw zone files, wrap the record into two consecutive double-quoted strings within parentheses: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">(&quot;v=DKIM1; ...&quot; &quot;...p=second_half&quot;)</code>.
                                </li>
                                <li>
                                    • <strong>Automatic DNS Management:</strong> Cloudflare, AWS Route 53, and Google Cloud DNS automatically fragment long TXT strings behind the scenes; paste the continuous unquoted string in their UI.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-emerald-600" /> Seamless Dual-Selector Key Rotation
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                                <li>
                                    • <strong>Step 1: Publish New Selector:</strong> Generate a new keypair and publish selector <code className="font-mono">selector2._domainkey</code> in DNS while keeping <code className="font-mono">selector1</code> active.
                                </li>
                                <li>
                                    • <strong>Step 2: Allow DNS TTL Propagation:</strong> Wait 24 to 48 hours to guarantee global resolver synchronization across recursive caches.
                                </li>
                                <li>
                                    • <strong>Step 3: Switch Outbound MTA:</strong> Update your email sending server to sign outbound messages using <code className="font-mono">selector2</code>.
                                </li>
                                <li>
                                    • <strong>Step 4: Retire or Revoke Old Key:</strong> After 7 days of verified traffic, delete the obsolete selector record or set its public key to <code className="font-mono font-bold">p=</code> to formally revoke it.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions */}
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
                                What is a DKIM Selector and why is it required in DNS?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A DKIM selector is an arbitrary string assigned by an email sender that differentiates multiple public keys published under a single domain. It allows an organization to sign emails from multiple providers (e.g., Google Workspace, Zendesk, SendGrid) without key collisions, and enables periodic cryptographic key rotation without downtime.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Where should the DKIM record be published in DNS?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A DKIM record must be published as a DNS TXT or CNAME record at the subdomain location formatted as <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">[selector]._domainkey.[yourdomain.com]</code>. For example, if your selector is &lsquo;google&rsquo; and your domain is &lsquo;example.com&rsquo;, the DNS host label is &lsquo;google._domainkey.example.com&rsquo;.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why are 2048-bit RSA keys recommended over 1024-bit RSA keys?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                1024-bit RSA keys can theoretically be factored using modern distributed computing clusters. Major email receivers including Google and Yahoo enforce 2048-bit RSA keys for high-volume outbound senders. Keys shorter than 1024 bits are treated as untrusted or invalid.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does DNS handle DKIM records exceeding 255 characters?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                RFC 1035 limits an individual character-string within a DNS TXT record to 255 octets. Since a 2048-bit RSA key spans over 400 characters, DNS administrators must split the record into multiple double-quoted strings within a single resource record. Resolvers concatenate these strings automatically during verification.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the consequence of publishing an empty public key tag (p=)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Under RFC 6376 §3.6.1, an empty <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">p=</code> tag explicitly signals key revocation. Receiving mail transfer agents will treat any email signed by that specific selector as unauthenticated, failing DKIM verification.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What do the DKIM flags t=s and t=y signify?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The &lsquo;t&rsquo; tag specifies operational flags. The &lsquo;t=s&rsquo; flag restricts key matching to the exact domain only, prohibiting subdomains from using the parent key. The &lsquo;t=y&rsquo; flag signals testing mode, requesting receiving MTAs to inspect the signature but avoid rejecting failing messages.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}