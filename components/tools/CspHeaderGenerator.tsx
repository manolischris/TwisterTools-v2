"use client";

import React, { useState, useMemo } from "react";
import {
    ShieldCheck,
    Copy,
    Check,
    RotateCcw,
    Sliders,
    Code2,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Download,
    Cpu,
    HelpCircle,
    Globe,
    Server,
    FileCode2,
    Info,
    Plus,
    Trash2
} from "lucide-react";

type ExportTarget = "header" | "meta" | "nginx" | "apache" | "caddy" | "vercel" | "netlify";

interface DirectiveConfig {
    enabled: boolean;
    self: boolean;
    unsafeInline: boolean;
    unsafeEval: boolean;
    none: boolean;
    strictDynamic: boolean;
    data: boolean;
    blob: boolean;
    httpsOnly: boolean;
    customSources: string;
}

interface GeneralOptions {
    upgradeInsecureRequests: boolean;
    blockAllMixedContent: boolean;
    reportOnly: boolean;
    reportUri: string;
    reportTo: string;
    frameAncestorsSelf: boolean;
    frameAncestorsNone: boolean;
    frameAncestorsCustom: string;
    baseUriSelf: boolean;
    baseUriNone: boolean;
    baseUriCustom: string;
    formActionSelf: boolean;
    formActionNone: boolean;
    formActionCustom: string;
}

const DEFAULT_DIRECTIVE: DirectiveConfig = {
    enabled: true,
    self: true,
    unsafeInline: false,
    unsafeEval: false,
    none: false,
    strictDynamic: false,
    data: false,
    blob: false,
    httpsOnly: false,
    customSources: "",
};

const DEFAULT_DIRECTIVES_STATE: Record<string, DirectiveConfig> = {
    "default-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
    "script-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
    "style-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, unsafeInline: true },
    "img-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, data: true, httpsOnly: true },
    "font-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, data: true },
    "connect-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
    "media-src": { ...DEFAULT_DIRECTIVE, enabled: false, self: true },
    "object-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: false, none: true },
    "worker-src": { ...DEFAULT_DIRECTIVE, enabled: false, self: true, blob: true },
    "manifest-src": { ...DEFAULT_DIRECTIVE, enabled: false, self: true },
};

const DEFAULT_GENERAL_OPTIONS: GeneralOptions = {
    upgradeInsecureRequests: true,
    blockAllMixedContent: false,
    reportOnly: false,
    reportUri: "",
    reportTo: "",
    frameAncestorsSelf: false,
    frameAncestorsNone: true,
    frameAncestorsCustom: "",
    baseUriSelf: true,
    baseUriNone: false,
    baseUriCustom: "",
    formActionSelf: true,
    formActionNone: false,
    formActionCustom: "",
};

interface PresetDefinition {
    name: string;
    description: string;
    directives: Record<string, DirectiveConfig>;
    general: GeneralOptions;
}

const PRESETS: Record<string, PresetDefinition> = {
    "Zero Trust (Strict)": {
        name: "Zero Trust (Strict)",
        description: "Hardened modern baseline. Disallows eval and object plugins, rejects clickjacking.",
        directives: {
            "default-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: false, none: true },
            "script-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "style-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "img-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, httpsOnly: true },
            "font-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "connect-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "media-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: false, none: true },
            "object-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: false, none: true },
            "worker-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "manifest-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
        },
        general: {
            ...DEFAULT_GENERAL_OPTIONS,
            upgradeInsecureRequests: true,
            frameAncestorsNone: true,
            frameAncestorsSelf: false,
            baseUriSelf: false,
            baseUriNone: true,
            formActionSelf: true,
        },
    },
    "Modern Web App (SPA/Next.js)": {
        name: "Modern Web App (SPA/Next.js)",
        description: "Permits inline styles for CSS-in-JS/Tailwind and common asset data URIs.",
        directives: {
            "default-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "script-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, unsafeInline: false, unsafeEval: false },
            "style-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, unsafeInline: true },
            "img-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, data: true, blob: true, httpsOnly: true },
            "font-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, data: true },
            "connect-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, httpsOnly: true },
            "media-src": { ...DEFAULT_DIRECTIVE, enabled: false, self: true },
            "object-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: false, none: true },
            "worker-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, blob: true },
            "manifest-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
        },
        general: {
            ...DEFAULT_GENERAL_OPTIONS,
            upgradeInsecureRequests: true,
            frameAncestorsSelf: true,
            frameAncestorsNone: false,
            baseUriSelf: true,
            formActionSelf: true,
        },
    },
    "WordPress & CMS": {
        name: "WordPress & CMS",
        description: "Accommodates dynamic plugin scripts, external CDNs, and inline stylesheet injections.",
        directives: {
            "default-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "script-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, unsafeInline: true, unsafeEval: true },
            "style-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, unsafeInline: true },
            "img-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, data: true, httpsOnly: true },
            "font-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, data: true },
            "connect-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "media-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "object-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: false, none: true },
            "worker-src": { ...DEFAULT_DIRECTIVE, enabled: false, self: true },
            "manifest-src": { ...DEFAULT_DIRECTIVE, enabled: false, self: true },
        },
        general: {
            ...DEFAULT_GENERAL_OPTIONS,
            upgradeInsecureRequests: true,
            frameAncestorsSelf: true,
            frameAncestorsNone: false,
            baseUriSelf: true,
            formActionSelf: true,
        },
    },
    "Google Analytics & Tag Manager": {
        name: "Google Analytics & Tag Manager",
        description: "Pre-configured allowances for googletagmanager.com and google-analytics.com telemetry.",
        directives: {
            "default-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
            "script-src": {
                ...DEFAULT_DIRECTIVE,
                enabled: true,
                self: true,
                unsafeInline: true,
                customSources: "https://www.googletagmanager.com https://www.google-analytics.com",
            },
            "style-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, unsafeInline: true },
            "img-src": {
                ...DEFAULT_DIRECTIVE,
                enabled: true,
                self: true,
                data: true,
                customSources: "https://www.google-analytics.com https://*.googletagmanager.com",
            },
            "font-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: true, data: true },
            "connect-src": {
                ...DEFAULT_DIRECTIVE,
                enabled: true,
                self: true,
                customSources: "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
            },
            "media-src": { ...DEFAULT_DIRECTIVE, enabled: false, self: true },
            "object-src": { ...DEFAULT_DIRECTIVE, enabled: true, self: false, none: true },
            "worker-src": { ...DEFAULT_DIRECTIVE, enabled: false, self: true },
            "manifest-src": { ...DEFAULT_DIRECTIVE, enabled: false, self: true },
        },
        general: {
            ...DEFAULT_GENERAL_OPTIONS,
            upgradeInsecureRequests: true,
            frameAncestorsNone: true,
            frameAncestorsSelf: false,
            baseUriSelf: true,
            formActionSelf: true,
        },
    },
};

export default function CspHeaderGenerator() {
    const [directives, setDirectives] = useState<Record<string, DirectiveConfig>>(DEFAULT_DIRECTIVES_STATE);
    const [general, setGeneral] = useState<GeneralOptions>(DEFAULT_GENERAL_OPTIONS);
    const [exportTarget, setExportTarget] = useState<ExportTarget>("header");
    const [copied, setCopied] = useState<boolean>(false);
    const [customDirectiveName, setCustomDirectiveName] = useState<string>("");

    const updateDirective = (name: string, patch: Partial<DirectiveConfig>) => {
        setDirectives((prev) => ({
            ...prev,
            [name]: { ...prev[name], ...patch },
        }));
    };

    const removeCustomDirective = (name: string) => {
        setDirectives((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    const handleAddCustomDirective = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = customDirectiveName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (!trimmed || directives[trimmed]) return;
        setDirectives((prev) => ({
            ...prev,
            [trimmed]: { ...DEFAULT_DIRECTIVE, enabled: true, self: true },
        }));
        setCustomDirectiveName("");
    };

    const handleApplyPreset = (presetKey: string) => {
        const p = PRESETS[presetKey];
        if (!p) return;
        setDirectives(p.directives);
        setGeneral(p.general);
    };

    const handleReset = () => {
        setDirectives(DEFAULT_DIRECTIVES_STATE);
        setGeneral(DEFAULT_GENERAL_OPTIONS);
    };

    const { rawCspString, warnings, totalDirectivesCount, headerKey } = useMemo(() => {
        const parts: string[] = [];
        const detectedWarnings: string[] = [];

        Object.entries(directives).forEach(([name, cfg]) => {
            if (!cfg.enabled) return;

            const tokens: string[] = [];

            if (cfg.none) {
                tokens.push("'none'");
            } else {
                if (cfg.self) tokens.push("'self'");
                if (cfg.unsafeInline) tokens.push("'unsafe-inline'");
                if (cfg.unsafeEval) tokens.push("'unsafe-eval'");
                if (cfg.strictDynamic) tokens.push("'strict-dynamic'");
                if (cfg.data) tokens.push("data:");
                if (cfg.blob) tokens.push("blob:");
                if (cfg.httpsOnly) tokens.push("https:");

                if (cfg.customSources.trim()) {
                    const customTokens = cfg.customSources
                        .split(/\s+/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                    tokens.push(...customTokens);
                }
            }

            if (tokens.length > 0) {
                parts.push(`${name} ${tokens.join(" ")}`);
            } else {
                parts.push(name);
            }

            if (name === "script-src" && cfg.unsafeInline) {
                detectedWarnings.push("`script-src 'unsafe-inline'` disables XSS protection for inline execution.");
            }
            if (name === "script-src" && cfg.unsafeEval) {
                detectedWarnings.push("`script-src 'unsafe-eval'` enables string-to-code execution (eval, Function constructor).");
            }
            if (name === "object-src" && !cfg.none) {
                detectedWarnings.push("`object-src` is not set to `'none'`. Plugin injection (Flash, Java) remains possible.");
            }
        });

        // Frame Ancestors
        if (general.frameAncestorsNone) {
            parts.push("frame-ancestors 'none'");
        } else {
            const frameTokens: string[] = [];
            if (general.frameAncestorsSelf) frameTokens.push("'self'");
            if (general.frameAncestorsCustom.trim()) {
                frameTokens.push(...general.frameAncestorsCustom.split(/\s+/).map((s) => s.trim()).filter(Boolean));
            }
            if (frameTokens.length > 0) {
                parts.push(`frame-ancestors ${frameTokens.join(" ")}`);
            }
        }

        // Base URI
        if (general.baseUriNone) {
            parts.push("base-uri 'none'");
        } else {
            const baseTokens: string[] = [];
            if (general.baseUriSelf) baseTokens.push("'self'");
            if (general.baseUriCustom.trim()) {
                baseTokens.push(...general.baseUriCustom.split(/\s+/).map((s) => s.trim()).filter(Boolean));
            }
            if (baseTokens.length > 0) {
                parts.push(`base-uri ${baseTokens.join(" ")}`);
            }
        }

        // Form Action
        if (general.formActionNone) {
            parts.push("form-action 'none'");
        } else {
            const formTokens: string[] = [];
            if (general.formActionSelf) formTokens.push("'self'");
            if (general.formActionCustom.trim()) {
                formTokens.push(...general.formActionCustom.split(/\s+/).map((s) => s.trim()).filter(Boolean));
            }
            if (formTokens.length > 0) {
                parts.push(`form-action ${formTokens.join(" ")}`);
            }
        }

        if (general.upgradeInsecureRequests) {
            parts.push("upgrade-insecure-requests");
        }
        if (general.blockAllMixedContent) {
            parts.push("block-all-mixed-content");
        }
        if (general.reportUri.trim()) {
            parts.push(`report-uri ${general.reportUri.trim()}`);
        }
        if (general.reportTo.trim()) {
            parts.push(`report-to ${general.reportTo.trim()}`);
        }

        const raw = parts.join("; ");
        const key = general.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";

        return {
            rawCspString: raw ? `${raw};` : "",
            warnings: detectedWarnings,
            totalDirectivesCount: parts.length,
            headerKey: key,
        };
    }, [directives, general]);

    const formattedCode = useMemo(() => {
        if (!rawCspString) return "// Enable directives to generate CSP policy.";

        switch (exportTarget) {
            case "header":
                return `${headerKey}: ${rawCspString}`;

            case "meta":
                if (general.reportOnly) {
                    return `<!-- Note: Report-Only mode cannot be enforced via HTML <meta> tags -->\n<meta http-equiv="Content-Security-Policy" content="${rawCspString}">`;
                }
                return `<meta http-equiv="Content-Security-Policy" content="${rawCspString}">`;

            case "nginx":
                return `# Add to server {} or location {} block\nadd_header ${headerKey} "${rawCspString}" always;`;

            case "apache":
                return `# Add to .htaccess or VirtualHost\nHeader set ${headerKey} "${rawCspString}"`;

            case "caddy":
                return `# Caddyfile directive\nheader ${headerKey} "${rawCspString}"`;

            case "vercel":
                return `// vercel.json\n{\n  "headers": [\n    {\n      "source": "/(.*)",\n      "headers": [\n        {\n          "key": "${headerKey}",\n          "value": "${rawCspString}"\n        }\n      ]\n    }\n  ]\n}`;

            case "netlify":
                return `# _headers or netlify.toml\n/*\n  ${headerKey}: ${rawCspString}`;

            default:
                return rawCspString;
        }
    }, [exportTarget, rawCspString, headerKey, general.reportOnly]);

    const handleCopy = () => {
        if (!formattedCode) return;
        navigator.clipboard.writeText(formattedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!formattedCode) return;
        const blob = new Blob([formattedCode], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `csp-policy-${exportTarget}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Content Security Policy (CSP) Header Generator",
        "url": "https://twistertools.com/tools/web-tools/csp-header-generator",
        "description": "Generate hardened Content Security Policy (CSP Level 3) HTTP headers instantly. Configurable source directives, nonce allowances, zero-trust presets, and server export configurations.",
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
                "name": "What is a Content Security Policy (CSP) and why is it essential?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Content Security Policy (CSP) is an HTTP response header that restricts the resources (JavaScript, CSS, Images, Frames, Fonts) the browser is allowed to load for a given document. It serves as an essential defense-in-depth security layer that drastically reduces the attack surface for Cross-Site Scripting (XSS), data injection, and clickjacking attacks."
                }
            },
            {
                "@type": "Question",
                "name": "Can I enforce a Content Security Policy via an HTML <meta> tag?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, standard CSP policies can be defined using &lt;meta http-equiv=\"Content-Security-Policy\" content=\"...\"&gt;. However, certain directives—specifically frame-ancestors, report-uri, and report-to—are strictly ignored inside meta tags by modern browsers and require direct HTTP response header injection."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Content-Security-Policy and Content-Security-Policy-Report-Only?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Content-Security-Policy actively blocks unauthorized resource requests from executing, whereas Content-Security-Policy-Report-Only allows resources to load normally while sending JSON telemetry violation reports to a designated URI endpoint, allowing teams to test strict policies without breaking live features."
                }
            },
            {
                "@type": "Question",
                "name": "Why is 'unsafe-inline' dangerous for script-src?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "'unsafe-inline' allows inline script tags (&lt;script&gt;alert(1)&lt;/script&gt;) and inline event handlers (onclick=...) to execute without validation, which negates the primary anti-XSS protection that CSP is engineered to provide. Nonce-based or cryptographic hash configurations should always be used instead."
                }
            },
            {
                "@type": "Question",
                "name": "What does object-src 'none' protect against?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Setting object-src 'none' blocks legacy browser plugins like Flash, Java Applets, and Silverlight embedded via &lt;object&gt;, &lt;embed&gt;, or &lt;applet&gt; tags. Because modern HTML5 applications do not require plugins, setting object-src 'none' eliminates plugin-based memory vulnerabilities completely."
                }
            },
            {
                "@type": "Question",
                "name": "How does frame-ancestors prevent Clickjacking attacks?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The frame-ancestors directive dictates whether an external website is permitted to embed your webpage inside an &lt;iframe&gt;, &lt;frame&gt;, or &lt;object&gt;. Setting it to 'none' or 'self' supersedes the legacy X-Frame-Options HTTP response header and defends against UI-redressing and clickjacking exploits."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd).replace(/</g, "\\u003c") }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
            />

            {/* Presets Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Security Baseline Presets
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition cursor-pointer border border-slate-200"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Defaults
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {Object.entries(PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handleApplyPreset(key)}
                            className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 transition group cursor-pointer"
                        >
                            <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 flex items-center justify-between">
                                <span>{preset.name}</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {preset.description}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Directives Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Policy Directives
                            </h2>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                            {totalDirectivesCount} active directives
                        </span>
                    </div>

                    {/* Standard Fetch Directives */}
                    <div className="space-y-4">
                        {Object.entries(directives).map(([dirName, cfg]) => (
                            <div
                                key={dirName}
                                className={`p-3.5 rounded-xl border transition ${cfg.enabled ? "bg-white border-slate-200 shadow-xs" : "bg-slate-50/70 border-slate-200/60 opacity-60"
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={cfg.enabled}
                                            onChange={(e) => updateDirective(dirName, { enabled: e.target.checked })}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <span className="font-mono text-xs font-bold text-slate-900">
                                            {dirName}
                                        </span>
                                    </label>
                                    {!DEFAULT_DIRECTIVES_STATE[dirName] && (
                                        <button
                                            type="button"
                                            onClick={() => removeCustomDirective(dirName)}
                                            className="text-rose-500 hover:text-rose-700 text-xs p-1"
                                            title="Remove custom directive"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {cfg.enabled && (
                                    <div className="space-y-2.5 pl-6">
                                        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-700">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={cfg.none}
                                                    onChange={(e) => updateDirective(dirName, { none: e.target.checked })}
                                                    className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                                />
                                                <span className="font-mono">'none'</span>
                                            </label>

                                            {!cfg.none && (
                                                <>
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={cfg.self}
                                                            onChange={(e) => updateDirective(dirName, { self: e.target.checked })}
                                                            className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                                        />
                                                        <span className="font-mono">'self'</span>
                                                    </label>
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={cfg.unsafeInline}
                                                            onChange={(e) => updateDirective(dirName, { unsafeInline: e.target.checked })}
                                                            className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                                        />
                                                        <span className="font-mono">'unsafe-inline'</span>
                                                    </label>
                                                    {(dirName === "script-src" || dirName === "default-src") && (
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={cfg.unsafeEval}
                                                                onChange={(e) => updateDirective(dirName, { unsafeEval: e.target.checked })}
                                                                className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                                            />
                                                            <span className="font-mono">'unsafe-eval'</span>
                                                        </label>
                                                    )}
                                                    {(dirName === "script-src") && (
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={cfg.strictDynamic}
                                                                onChange={(e) => updateDirective(dirName, { strictDynamic: e.target.checked })}
                                                                className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                                            />
                                                            <span className="font-mono">'strict-dynamic'</span>
                                                        </label>
                                                    )}
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={cfg.data}
                                                            onChange={(e) => updateDirective(dirName, { data: e.target.checked })}
                                                            className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                                        />
                                                        <span className="font-mono">data:</span>
                                                    </label>
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={cfg.blob}
                                                            onChange={(e) => updateDirective(dirName, { blob: e.target.checked })}
                                                            className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                                        />
                                                        <span className="font-mono">blob:</span>
                                                    </label>
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={cfg.httpsOnly}
                                                            onChange={(e) => updateDirective(dirName, { httpsOnly: e.target.checked })}
                                                            className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                                        />
                                                        <span className="font-mono">https:</span>
                                                    </label>
                                                </>
                                            )}
                                        </div>

                                        {!cfg.none && (
                                            <div>
                                                <input
                                                    type="text"
                                                    value={cfg.customSources}
                                                    onChange={(e) => updateDirective(dirName, { customSources: e.target.value })}
                                                    placeholder="Custom hosts (e.g., https://api.stripe.com cdn.jsdelivr.net)"
                                                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add Custom Directive Input */}
                    <form onSubmit={handleAddCustomDirective} className="flex gap-2 pt-2 border-t border-slate-100">
                        <input
                            type="text"
                            value={customDirectiveName}
                            onChange={(e) => setCustomDirectiveName(e.target.value)}
                            placeholder="Add directive (e.g. prefetch-src, child-src)"
                            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add
                        </button>
                    </form>

                    {/* General Navigation & Framing Directives */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Navigation, Sandboxing & Ingestion
                        </h3>

                        {/* Frame Ancestors */}
                        <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                            <span className="font-mono text-xs font-bold text-slate-900 block">
                                frame-ancestors (Clickjacking Guard)
                            </span>
                            <div className="flex flex-wrap gap-3 text-xs">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={general.frameAncestorsNone}
                                        onChange={(e) => setGeneral((p) => ({ ...p, frameAncestorsNone: e.target.checked }))}
                                        className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                    />
                                    <span className="font-mono">'none'</span>
                                </label>
                                {!general.frameAncestorsNone && (
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={general.frameAncestorsSelf}
                                            onChange={(e) => setGeneral((p) => ({ ...p, frameAncestorsSelf: e.target.checked }))}
                                            className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                        />
                                        <span className="font-mono">'self'</span>
                                    </label>
                                )}
                            </div>
                            {!general.frameAncestorsNone && (
                                <input
                                    type="text"
                                    value={general.frameAncestorsCustom}
                                    onChange={(e) => setGeneral((p) => ({ ...p, frameAncestorsCustom: e.target.value }))}
                                    placeholder="Allowed framing origins (e.g. https://trusted-partner.com)"
                                    className="w-full px-2.5 py-1 text-xs font-mono rounded border border-slate-200 bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            )}
                        </div>

                        {/* Base URI & Form Action */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                                <span className="font-mono text-xs font-bold text-slate-900 block">base-uri</span>
                                <div className="flex items-center gap-3 text-xs">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={general.baseUriNone}
                                            onChange={(e) => setGeneral((p) => ({ ...p, baseUriNone: e.target.checked }))}
                                            className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                        />
                                        <span className="font-mono">'none'</span>
                                    </label>
                                    {!general.baseUriNone && (
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={general.baseUriSelf}
                                                onChange={(e) => setGeneral((p) => ({ ...p, baseUriSelf: e.target.checked }))}
                                                className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                            />
                                            <span className="font-mono">'self'</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                                <span className="font-mono text-xs font-bold text-slate-900 block">form-action</span>
                                <div className="flex items-center gap-3 text-xs">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={general.formActionNone}
                                            onChange={(e) => setGeneral((p) => ({ ...p, formActionNone: e.target.checked }))}
                                            className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                        />
                                        <span className="font-mono">'none'</span>
                                    </label>
                                    {!general.formActionNone && (
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={general.formActionSelf}
                                                onChange={(e) => setGeneral((p) => ({ ...p, formActionSelf: e.target.checked }))}
                                                className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5"
                                            />
                                            <span className="font-mono">'self'</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Upgrade Insecure Requests & Report Only */}
                        <div className="space-y-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                                <input
                                    type="checkbox"
                                    checked={general.upgradeInsecureRequests}
                                    onChange={(e) => setGeneral((p) => ({ ...p, upgradeInsecureRequests: e.target.checked }))}
                                    className="rounded border-slate-300 text-indigo-600 w-4 h-4"
                                />
                                upgrade-insecure-requests (Rewrite HTTP assets to HTTPS)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-indigo-700 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                                <input
                                    type="checkbox"
                                    checked={general.reportOnly}
                                    onChange={(e) => setGeneral((p) => ({ ...p, reportOnly: e.target.checked }))}
                                    className="rounded border-slate-300 text-indigo-600 w-4 h-4"
                                />
                                Report-Only Mode (Content-Security-Policy-Report-Only)
                            </label>
                        </div>

                        {/* Reporting Endpoints */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                    report-uri Endpoint
                                </label>
                                <input
                                    type="text"
                                    value={general.reportUri}
                                    onChange={(e) => setGeneral((p) => ({ ...p, reportUri: e.target.value }))}
                                    placeholder="https://api.example.com/csp-report"
                                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                    report-to Group (CSP Level 3)
                                </label>
                                <input
                                    type="text"
                                    value={general.reportTo}
                                    onChange={(e) => setGeneral((p) => ({ ...p, reportTo: e.target.value }))}
                                    placeholder="csp-endpoint-group"
                                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Live Output & Export Presets */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6 sticky top-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Generated Output
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={!rawCspString}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 disabled:opacity-50 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                Export
                            </button>
                            <button
                                type="button"
                                onClick={handleCopy}
                                disabled={!rawCspString}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                                {copied ? "Copied" : "Copy Policy"}
                            </button>
                        </div>
                    </div>

                    {/* Target Format Selector Tabs */}
                    <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium">
                        {(
                            [
                                ["header", "Raw Header"],
                                ["meta", "HTML Meta"],
                                ["nginx", "Nginx"],
                                ["apache", "Apache"],
                                ["caddy", "Caddy"],
                                ["vercel", "Vercel"],
                                ["netlify", "Netlify"],
                            ] as [ExportTarget, string][]
                        ).map(([targetKey, label]) => (
                            <button
                                key={targetKey}
                                type="button"
                                onClick={() => setExportTarget(targetKey)}
                                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${exportTarget === targetKey
                                        ? "bg-white text-indigo-600 font-bold shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Warnings Display */}
                    {warnings.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
                            <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Security Recommendations ({warnings.length})</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1 text-[11px]">
                                {warnings.map((w, idx) => (
                                    <li key={idx}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Live Output Code Area */}
                    <div className="relative">
                        <pre className="p-4 rounded-xl font-mono text-xs leading-relaxed bg-slate-950 text-indigo-200 border border-slate-900 min-h-[380px] max-h-[560px] overflow-auto select-all whitespace-pre-wrap break-all">
                            {formattedCode}
                        </pre>
                    </div>

                    {/* Diagnostics Details */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <div>
                            <span className="text-[11px] text-slate-500 font-medium block">Policy Directives</span>
                            <span className="font-mono text-xs font-bold text-slate-800">{totalDirectivesCount}</span>
                        </div>
                        <div>
                            <span className="text-[11px] text-slate-500 font-medium block">Mode</span>
                            <span className={`font-mono text-xs font-bold ${general.reportOnly ? "text-amber-600" : "text-emerald-600"}`}>
                                {general.reportOnly ? "Report-Only" : "Enforce"}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] text-slate-500 font-medium block">Length</span>
                            <span className="font-mono text-xs font-bold text-indigo-600">
                                {rawCspString.length} chars
                            </span>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            CSP Level 3 Compliant
                        </span>
                        <span className="text-slate-400">Zero Server Telemetry</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architectural Foundations of Content Security Policy (Level 3)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Content Security Policy (CSP) is a W3C declarative standard engineered to restrict the execution privileges of dynamic web applications. In the modern threat landscape, vulnerabilities like Cross-Site Scripting (XSS) and clickjacking remain ubiquitous. By restricting where executable scripts, fonts, images, and embedded frames can be fetched from, CSP converts untrusted user input and third-party script vulnerabilities into inert errors inside the client runtime.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> XSS Execution Neutralization
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Stops reflected, stored, and DOM-based Cross-Site Scripting attacks by rejecting unauthorized inline script tags, dynamic `eval()` execution, and unvetted third-party JavaScript dependencies.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Clickjacking Defense
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The `frame-ancestors` directive supersedes legacy `X-Frame-Options` headers, giving engineers fine-grained control over which external domains are permitted to frame internal applications.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Automated Insecurity Upgrades
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Using `upgrade-insecure-requests`, user agents seamlessly rewrite legacy unencrypted HTTP resource URLs to HTTPS before sending network requests, eliminating mixed-content warnings.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Directive Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Core Directives & Fallback Hierarchy Reference
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        CSP enforces a hierarchical fallback structure. If a specialized fetch directive is omitted from the policy, modern user agents fall back to the rules configured in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">default-src</code>:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Directive</th>
                                    <th className="p-3">Governed Resources</th>
                                    <th className="p-3">Falls Back To default-src?</th>
                                    <th className="p-3">Recommended Strict Setting</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-semibold text-slate-900">default-src</td>
                                    <td className="p-3">Universal fallback for fetch directives</td>
                                    <td className="p-3 text-slate-500">N/A (Root Directive)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">'self' or 'none'</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-semibold text-slate-900">script-src</td>
                                    <td className="p-3">External scripts and inline executable logic</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">'self' + Nonce</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-semibold text-slate-900">style-src</td>
                                    <td className="p-3">External stylesheets and inline &lt;style&gt; blocks</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                    <td className="p-3 font-mono text-slate-800">'self' 'unsafe-inline'</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-semibold text-slate-900">object-src</td>
                                    <td className="p-3">Plugins (&lt;object&gt;, &lt;embed&gt;, &lt;applet&gt;)</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                    <td className="p-3 font-mono text-rose-600 font-bold">'none'</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-semibold text-slate-900">frame-ancestors</td>
                                    <td className="p-3">Embedding contexts (&lt;iframe&gt;, &lt;frame&gt;)</td>
                                    <td className="p-3 text-rose-600 font-semibold">No (Ignored by default-src)</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">'none' or 'self'</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-semibold text-slate-900">base-uri</td>
                                    <td className="p-3">Document base URL manipulated via &lt;base&gt; tag</td>
                                    <td className="p-3 text-rose-600 font-semibold">No (Ignored by default-src)</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">'self'</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Enterprise Web Server Configs */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Server className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Enterprise Web Server Configuration Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To enforce your policy across all connected clients, attach the header in your edge reverse proxy or web application gateway. Below are production configurations for Nginx and Apache:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-indigo-400 font-mono uppercase">Nginx Reverse Proxy</h3>
                            <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed">
                                {`# /etc/nginx/conf.d/security-headers.conf
server {
    listen 443 ssl http2;
    server_name example.com;

    # Add CSP Header to all HTTP responses
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;" always;
}`}
                            </pre>
                        </div>

                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase">Apache (.htaccess / VirtualHost)</h3>
                            <pre className="text-[11px] font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                                {`# Apache HTTP Server Configuration
<IfModule mod_headers.c>
    Header set Content-Security-Policy \\
    "default-src 'self'; \\
     script-src 'self'; \\
     style-src 'self' 'unsafe-inline'; \\
     object-src 'none'; \\
     frame-ancestors 'none'; \\
     upgrade-insecure-requests;"
</IfModule>`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 4: Migration Strategies & Pitfalls */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Safe Rollout: Utilizing Report-Only Mode Without Breaking Production
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Deploying an unvetted Content Security Policy directly into a live production system can inadvertently break third-party analytics, payment gateways, and CSS frameworks. A staged deployment strategy mitigates this risk:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Safe Rollout Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Start with Content-Security-Policy-Report-Only:</strong> Violations will be posted to your logging endpoint while all scripts, styles, and assets continue rendering normally for end users.
                                </li>
                                <li>
                                    • <strong>Aggregate Violation Logs:</strong> Ingest reports into your observability stack (e.g. Datadog, Sentry, or an internal collector) to identify missing CDN origins.
                                </li>
                                <li>
                                    • <strong>Transition to Nonces:</strong> Swap <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">'unsafe-inline'</code> with dynamically generated server-side cryptographic nonces for script tags.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> High-Risk Policy Antipatterns
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Wildcard Origins (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">*</code> or <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">https:</code>):</strong> Allows attackers to host and execute malicious scripts from arbitrary domains or cloud storage buckets.
                                </li>
                                <li>
                                    • <strong>Omitting object-src 'none':</strong> Leaves the browser vulnerable to plugins that do not respect script sandboxing.
                                </li>
                                <li>
                                    • <strong>Overreliance on HTML &lt;meta&gt; Tags:</strong> Certain critical security directives like <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">frame-ancestors</code> are silently discarded by browsers when parsed via HTML meta tags.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended FAQ */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a Content Security Policy (CSP) and why is it essential?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A Content Security Policy (CSP) is an HTTP response header that restricts the resources (JavaScript, CSS, Images, Frames, Fonts) the browser is allowed to load for a given document. It serves as an essential defense-in-depth security layer that drastically reduces the attack surface for Cross-Site Scripting (XSS), data injection, and clickjacking attacks.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I enforce a Content Security Policy via an HTML &lt;meta&gt; tag?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, standard CSP policies can be defined using &lt;meta http-equiv="Content-Security-Policy" content="..."&gt;. However, certain directives—specifically frame-ancestors, report-uri, and report-to—are strictly ignored inside meta tags by modern browsers and require direct HTTP response header injection.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Content-Security-Policy and Content-Security-Policy-Report-Only?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Content-Security-Policy actively blocks unauthorized resource requests from executing, whereas Content-Security-Policy-Report-Only allows resources to load normally while sending JSON telemetry violation reports to a designated URI endpoint, allowing teams to test strict policies without breaking live features.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is 'unsafe-inline' dangerous for script-src?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                'unsafe-inline' allows inline script tags (&lt;script&gt;alert(1)&lt;/script&gt;) and inline event handlers (onclick=...) to execute without validation, which negates the primary anti-XSS protection that CSP is engineered to provide. Nonce-based or cryptographic hash configurations should always be used instead.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What does object-src 'none' protect against?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Setting object-src 'none' blocks legacy browser plugins like Flash, Java Applets, and Silverlight embedded via &lt;object&gt;, &lt;embed&gt;, or &lt;applet&gt; tags. Because modern HTML5 applications do not require plugins, setting object-src 'none' eliminates plugin-based memory vulnerabilities completely.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does frame-ancestors prevent Clickjacking attacks?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The frame-ancestors directive dictates whether an external website is permitted to embed your webpage inside an &lt;iframe&gt;, &lt;frame&gt;, or &lt;object&gt;. Setting it to 'none' or 'self' supersedes the legacy X-Frame-Options HTTP response header and defends against UI-redressing and clickjacking exploits.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}