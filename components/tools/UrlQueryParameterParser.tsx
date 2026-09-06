"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Copy,
    Check,
    RotateCcw,
    Plus,
    Trash2,
    Code2,
    Download,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Sliders,
    Layers,
    FileCode,
    Network,
    ExternalLink,
    RefreshCw
} from "lucide-react";

interface QueryParam {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

type OutputFormat = "json" | "ts" | "querystring" | "encoded-url";
type DuplicateHandling = "combine-array" | "keep-last" | "keep-first";

const SAMPLE_URLS: Record<string, string> = {
    "Analytics Tracking": "https://analytics.example.com/v2/collect?utm_source=newsletter&utm_medium=email&utm_campaign=spring_launch_2026&utm_content=cta_banner&ref_id=usr_8829&experiments=exp_cart_v2&experiments=exp_dark_mode",
    "API Pagination & Filter": "https://api.cloudservices.dev/v1/resources?category=infrastructure&status=active&tag=kubernetes&tag=production&page=1&limit=50&sort=created_at%3Adesc&include_metrics=true",
    "OAuth 2.0 Auth Request": "https://auth.enterprise.io/oauth/v2/authorize?response_type=code&client_id=client_90f23a&redirect_uri=https%3A%2F%2Fapp.enterprise.io%2Fcallback&scope=read%3Aprofile%20write%3Asettings%20offline_access&state=xyz_sec_token_991&code_challenge=E9Melhoa2OwvFrGMTJguCH5rtG8HAqudQKpqwd996Vg&code_challenge_method=S256",
};

export default function UrlQueryParameterParser() {
    const [rawInputUrl, setRawInputUrl] = useState<string>(SAMPLE_URLS["Analytics Tracking"]);
    const [paramsList, setParamsList] = useState<QueryParam[]>([
        { id: "1", key: "utm_source", value: "newsletter", enabled: true },
        { id: "2", key: "utm_medium", value: "email", enabled: true },
        { id: "3", key: "utm_campaign", value: "spring_launch_2026", enabled: true },
        { id: "4", key: "utm_content", value: "cta_banner", enabled: true },
        { id: "5", key: "ref_id", value: "usr_8829", enabled: true },
        { id: "6", key: "experiments", value: "exp_cart_v2", enabled: true },
        { id: "7", key: "experiments", value: "exp_dark_mode", enabled: true },
    ]);
    const [baseUrl, setBaseUrl] = useState<string>("https://analytics.example.com/v2/collect");
    const [hashFragment, setHashFragment] = useState<string>("");

    const [outputFormat, setOutputFormat] = useState<OutputFormat>("json");
    const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandling>("combine-array");
    const [autoTypeCasting, setAutoTypeCasting] = useState<boolean>(true);
    const [encodeSpecialChars, setEncodeSpecialChars] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const formatSelectId = useId();
    const duplicateHandlingSelectId = useId();

    const parseUrlString = (input: string) => {
        setParseError(null);
        const trimmed = input.trim();
        if (!trimmed) {
            setBaseUrl("");
            setHashFragment("");
            setParamsList([]);
            return;
        }

        try {
            let workingUrl = trimmed;
            let extractedHash = "";

            const hashIndex = workingUrl.indexOf("#");
            if (hashIndex !== -1) {
                extractedHash = workingUrl.slice(hashIndex + 1);
                workingUrl = workingUrl.slice(0, hashIndex);
            }
            setHashFragment(extractedHash);

            let extractedBase = "";
            let queryString = "";

            const questionIndex = workingUrl.indexOf("?");
            if (questionIndex !== -1) {
                extractedBase = workingUrl.slice(0, questionIndex);
                queryString = workingUrl.slice(questionIndex + 1);
            } else if (workingUrl.includes("=") || workingUrl.includes("&")) {
                extractedBase = "";
                queryString = workingUrl;
            } else {
                extractedBase = workingUrl;
                queryString = "";
            }

            setBaseUrl(extractedBase);

            if (!queryString) {
                setParamsList([]);
                return;
            }

            const searchParams = new URLSearchParams(queryString);
            const parsedEntries: QueryParam[] = [];
            let counter = 0;

            searchParams.forEach((val, key) => {
                counter += 1;
                parsedEntries.push({
                    id: `${Date.now()}_${counter}_${Math.random().toString(36).slice(2, 7)}`,
                    key,
                    value: val,
                    enabled: true,
                });
            });

            setParamsList(parsedEntries);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Malformed URI sequence encountered during parsing.";
            setParseError(msg);
        }
    };

    const handleRawUrlChange = (value: string) => {
        setRawInputUrl(value);
        parseUrlString(value);
    };

    const handleLoadSample = (sampleKey: string) => {
        const sample = SAMPLE_URLS[sampleKey];
        if (sample) {
            setRawInputUrl(sample);
            parseUrlString(sample);
        }
    };

    const handleReset = () => {
        setRawInputUrl("");
        setBaseUrl("");
        setHashFragment("");
        setParamsList([]);
        setParseError(null);
    };

    const handleParamChange = (id: string, field: "key" | "value" | "enabled", val: string | boolean) => {
        setParamsList((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    return { ...item, [field]: val };
                }
                return item;
            })
        );
    };

    const handleAddParam = () => {
        const newParam: QueryParam = {
            id: `param_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            key: "",
            value: "",
            enabled: true,
        };
        setParamsList((prev) => [...prev, newParam]);
    };

    const handleRemoveParam = (id: string) => {
        setParamsList((prev) => prev.filter((item) => item.id !== id));
    };

    const castValue = (raw: string): unknown => {
        if (!autoTypeCasting) return raw;
        const lower = raw.trim().toLowerCase();
        if (lower === "true") return true;
        if (lower === "false") return false;
        if (lower === "null") return null;
        if (lower === "undefined") return undefined;

        if (raw.trim() !== "" && !Number.isNaN(Number(raw))) {
            const num = Number(raw);
            if (Number.isSafeInteger(num) || raw.includes(".")) {
                return num;
            }
        }
        return raw;
    };

    const { structuredObject, reconstructedUrl, queryStringOutput, activeCount, duplicateKeysCount } = useMemo(() => {
        const activeParams = paramsList.filter((p) => p.enabled && p.key.trim().length > 0);
        const obj: Record<string, unknown> = {};
        const keyOccurrences: Record<string, number> = {};

        activeParams.forEach((p) => {
            keyOccurrences[p.key] = (keyOccurrences[p.key] || 0) + 1;
        });

        const duplicateCount = Object.values(keyOccurrences).filter((count) => count > 1).length;

        activeParams.forEach((p) => {
            const val = castValue(p.value);
            const k = p.key;

            if (duplicateHandling === "combine-array") {
                if (Object.prototype.hasOwnProperty.call(obj, k)) {
                    if (Array.isArray(obj[k])) {
                        (obj[k] as unknown[]).push(val);
                    } else {
                        obj[k] = [obj[k], val];
                    }
                } else {
                    obj[k] = val;
                }
            } else if (duplicateHandling === "keep-last") {
                obj[k] = val;
            } else if (duplicateHandling === "keep-first") {
                if (!Object.prototype.hasOwnProperty.call(obj, k)) {
                    obj[k] = val;
                }
            }
        });

        const usp = new URLSearchParams();
        activeParams.forEach((p) => {
            usp.append(p.key, p.value);
        });

        const qs = usp.toString();
        let fullUrl = baseUrl.trim();

        if (qs.length > 0) {
            fullUrl += (fullUrl.includes("?") ? "&" : "?") + qs;
        }

        if (hashFragment.trim().length > 0) {
            fullUrl += `#${hashFragment.trim()}`;
        }

        return {
            structuredObject: obj,
            reconstructedUrl: fullUrl,
            queryStringOutput: qs ? `?${qs}` : "",
            activeCount: activeParams.length,
            duplicateKeysCount: duplicateCount,
        };
    }, [paramsList, baseUrl, hashFragment, duplicateHandling, autoTypeCasting]);

    const generatedCodeOutput = useMemo(() => {
        if (outputFormat === "json") {
            return JSON.stringify(structuredObject, null, 2);
        }

        if (outputFormat === "ts") {
            const generateTypeSignature = (val: unknown): string => {
                if (val === null) return "null";
                if (val === undefined) return "undefined";
                if (Array.isArray(val)) {
                    const elemTypes = Array.from(new Set(val.map((item) => generateTypeSignature(item))));
                    return elemTypes.length > 1 ? `(${elemTypes.join(" | ")})[]` : `${elemTypes[0] || "unknown"}[]`;
                }
                const t = typeof val;
                if (t === "string") return "string";
                if (t === "number") return "number";
                if (t === "boolean") return "boolean";
                return "unknown";
            };

            const lines = Object.entries(structuredObject).map(([k, v]) => {
                const cleanKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
                return `  ${cleanKey}: ${generateTypeSignature(v)};`;
            });

            return `export interface ParsedQueryParams {\n${lines.join("\n")}\n}\n\nexport const queryParams: ParsedQueryParams = ${JSON.stringify(
                structuredObject,
                null,
                2
            )};`;
        }

        if (outputFormat === "querystring") {
            return queryStringOutput || "// No active query parameters enabled.";
        }

        if (outputFormat === "encoded-url") {
            return reconstructedUrl || "// Enter a base URL or parameters to generate the query string.";
        }

        return "";
    }, [outputFormat, structuredObject, queryStringOutput, reconstructedUrl]);

    const handleCopy = () => {
        if (!generatedCodeOutput) return;
        navigator.clipboard.writeText(generatedCodeOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!generatedCodeOutput) return;
        let filename = "query-params.json";
        let mimeType = "application/json";

        if (outputFormat === "ts") {
            filename = "query-params.ts";
            mimeType = "text/typescript";
        } else if (outputFormat === "querystring" || outputFormat === "encoded-url") {
            filename = "query-params.txt";
            mimeType = "text/plain";
        }

        const blob = new Blob([generatedCodeOutput], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "URL Query Parameter Parser & Object Builder",
        "url": "https://twistertools.com/tools/developer-tools/url-query-parameter-parser",
        "description": "Parse, edit, inspect, and convert URL query strings into JavaScript/JSON objects, TypeScript interfaces, and encoded REST URLs client-side.",
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
                "name": "How does the URL Query Parameter Parser handle duplicate parameter keys?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The parser gives you three configurable resolution strategies: Combine into Array (default, creating an array of values for repeated keys such as ?tag=api&tag=v2), Keep Last Occurrence (mirroring standard PHP/Node query string parsers), or Keep First Occurrence.",
                },
            },
            {
                "@type": "Question",
                "name": "What is the difference between decodeURI and decodeURIComponent in query strings?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "decodeURI is intended for full URLs and preserves reserved delimiters such as ?, &, =, and /. decodeURIComponent decodes individual key or value tokens, properly translating encoded characters such as %20 (spaces), %26 (&), and %3D (=) without breaking the overall URI syntax.",
                },
            },
            {
                "@type": "Question",
                "name": "Does this tool upload parsed URLs or authentication parameters to remote servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The entire query parsing, URL reconstruction, decoding, and JSON/TypeScript serialization occurs purely client-side inside your browser sandbox via native Web APIs (URL and URLSearchParams). No URL parameters or authorization tokens ever leave your machine.",
                },
            },
            {
                "@type": "Question",
                "name": "How are boolean and numeric query string values transformed?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When Auto Type Casting is toggled on, strings matching 'true', 'false', 'null', and valid safe integers or floating-point numbers are automatically converted to their native JavaScript/JSON primitives rather than remaining generic strings.",
                },
            },
            {
                "@type": "Question",
                "name": "Can I edit query parameters and reconstruct the full encoded URL in real time?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can add, toggle, edit, or delete individual keys and values in the interactive table. The tool updates the reconstructed URL, query string, and structured object export immediately.",
                },
            },
        ],
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />



            {/* Presets & Dialect Controls Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Parser Settings & Presets
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 font-medium">Load Preset:</span>
                        {Object.keys(SAMPLE_URLS).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleLoadSample(key)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer border border-slate-200/60"
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                    {/* Output Format */}
                    <div className="space-y-1.5">
                        <label htmlFor={formatSelectId} className="text-xs font-bold text-slate-700 block">
                            Target Serialization
                        </label>
                        <select
                            id={formatSelectId}
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium outline-none"
                        >
                            <option value="json">JSON Object (Structured)</option>
                            <option value="ts">TypeScript Interface & Const</option>
                            <option value="querystring">Raw Query String (?k=v)</option>
                            <option value="encoded-url">Full Reconstructed URL</option>
                        </select>
                    </div>

                    {/* Duplicate Key Resolution */}
                    <div className="space-y-1.5">
                        <label htmlFor={duplicateHandlingSelectId} className="text-xs font-bold text-slate-700 block">
                            Duplicate Keys Handling
                        </label>
                        <select
                            id={duplicateHandlingSelectId}
                            value={duplicateHandling}
                            onChange={(e) => setDuplicateHandling(e.target.value as DuplicateHandling)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium outline-none"
                        >
                            <option value="combine-array">Combine into Array</option>
                            <option value="keep-last">Keep Last Occurrence</option>
                            <option value="keep-first">Keep First Occurrence</option>
                        </select>
                    </div>

                    {/* Checkbox Toggles Group 1 */}
                    <div className="space-y-2 pt-1 sm:pt-0">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoTypeCasting}
                                onChange={(e) => setAutoTypeCasting(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            Auto Type Casting (Number, Bool)
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={encodeSpecialChars}
                                onChange={(e) => setEncodeSpecialChars(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            Strict RFC 3986 URL Encoding
                        </label>
                    </div>

                    {/* Quick Stats Diagnostic */}
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Active Params:</span>
                            <span className="font-mono font-bold text-indigo-600">{activeCount}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Duplicate Keys:</span>
                            <span className="font-mono font-bold text-amber-600">{duplicateKeysCount}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Has Hash (#):</span>
                            <span className="font-mono font-bold text-emerald-600">{hashFragment ? "Yes" : "No"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input URL Field */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                        <ExternalLink className="w-4 h-4 text-indigo-600" />
                        Raw Target URL or Query String Input
                    </label>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono">
                            {rawInputUrl.length} chars
                        </span>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer border border-rose-200/60"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={rawInputUrl}
                        onChange={(e) => handleRawUrlChange(e.target.value)}
                        placeholder="https://example.com/api?user=john&role=admin#section"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                {parseError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">URI Parse Error:</span> {parseError}
                        </div>
                    </div>
                )}
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Interactive Query Key-Value Editor */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Query Parameters Editor
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddParam}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition cursor-pointer border border-indigo-200/60"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Parameter
                        </button>
                    </div>

                    {/* Base URL breakdown indicator */}
                    {baseUrl && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                            <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">
                                Base Endpoint (Scheme + Path)
                            </span>
                            <span className="font-mono text-slate-800 break-all select-all font-semibold">
                                {baseUrl}
                            </span>
                        </div>
                    )}

                    {/* Parameters Itemized List */}
                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {paramsList.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                                No query parameters detected. Paste a valid URL above or click &quot;Add Parameter&quot;.
                            </div>
                        ) : (
                            paramsList.map((param, index) => (
                                <div
                                    key={param.id}
                                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${param.enabled
                                            ? "bg-white border-slate-200 shadow-xs"
                                            : "bg-slate-50/70 border-slate-200/60 opacity-60"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={param.enabled}
                                        onChange={(e) => handleParamChange(param.id, "enabled", e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 shrink-0"
                                        title="Toggle Parameter"
                                    />
                                    <span className="text-[11px] font-mono text-slate-400 w-5 text-right shrink-0">
                                        {index + 1}.
                                    </span>
                                    <input
                                        type="text"
                                        value={param.key}
                                        onChange={(e) => handleParamChange(param.id, "key", e.target.value)}
                                        placeholder="key"
                                        className="w-1/3 min-w-0 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-900 outline-none"
                                    />
                                    <span className="text-slate-400 font-bold text-xs">=</span>
                                    <input
                                        type="text"
                                        value={param.value}
                                        onChange={(e) => handleParamChange(param.id, "value", e.target.value)}
                                        placeholder="value"
                                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-900 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveParam(param.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 transition shrink-0 cursor-pointer"
                                        title="Delete Parameter"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {hashFragment && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                            <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">
                                URL Hash Anchor (#)
                            </span>
                            <span className="font-mono text-indigo-600 break-all select-all font-semibold">
                                #{hashFragment}
                            </span>
                        </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Client-Side SearchParams Engine
                        </span>
                        <span className="font-mono text-slate-600">
                            {paramsList.length} total entries
                        </span>
                    </div>
                </div>

                {/* Right Panel: Code Output / Reconstructed URL */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Serialized Object & Reconstructed URL
                            </h2>
                        </div>
                    </div>

                    <div className="relative">
                        <pre className="p-4 rounded-xl font-mono text-xs leading-relaxed bg-slate-950 text-indigo-300 border border-slate-900 min-h-[380px] max-h-[500px] overflow-auto select-all">
                            {generatedCodeOutput || "// Enter URL query parameters to generate output."}
                        </pre>
                    </div>

                    {/* Reconstructed URL Preview Bar */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                Live Reconstructed URL
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(reconstructedUrl);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="text-[11px] text-indigo-600 hover:underline font-medium cursor-pointer"
                            >
                                Copy Link
                            </button>
                        </div>
                        <div className="text-xs font-mono text-slate-800 break-all select-all">
                            {reconstructedUrl || "(no URL constructed)"}
                        </div>
                    </div>

                    {/* Export & Copy Output Buttons (50% / 50%) */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={!generatedCodeOutput}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 disabled:opacity-50 cursor-pointer"
                        >
                            <Download className="w-4 h-4 text-slate-500" />
                            Export
                        </button>
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!generatedCodeOutput}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                            {copied ? "Copied" : "Copy Output"}
                        </button>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Synchronized Bi-Directionally
                        </span>
                        <span className="text-slate-400">RFC 3986 & WHATWG URL Standard</span>
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
                            Anatomy of URL Query Strings: RFC 3986 & WHATWG Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Uniform Resource Identifiers (URIs) rely on query components to transfer non-hierarchical state across web clients and servers. Governed by RFC 3986 and modern WHATWG specifications, query strings begin with the question mark delimiter (?) and connect sequences of key-value pairs using ampersands (&).
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In modern single-page applications (SPAs) and REST APIs, query parameters govern pagination offsets, search filters, analytics tracking (UTM tags), state verification in OAuth 2.0 PKCE handshakes, and feature toggles. Properly isolating, sanitizing, and casting these parameters into type-safe data structures is critical to prevent injection vulnerabilities and state desynchronization.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Network className="w-4 h-4 text-indigo-600" /> Component Isolation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Separates protocol schemes, domain paths, query parameters, and anchor fragments (#) to avoid accidental string concatenation bugs.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <FileCode className="w-4 h-4 text-indigo-600" /> Type Preservation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Converts raw string literals like &quot;true&quot;, &quot;false&quot;, &quot;null&quot;, and numeric values into strict TypeScript and JSON primitive types.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sliders className="w-4 h-4 text-indigo-600" /> Collision Resolution
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Handles duplicate keys deterministically by aggregating repeated parameters into arrays or selecting explicit first/last overrides.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Encoding & Reserved Character Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Percent-Encoding & Reserved Character Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        URIs only allow specific US-ASCII characters. Any character outside the unreserved character set (alphanumerics, hyphen, underscore, period, and tilde) must be percent-encoded using its hexadecimal UTF-8 byte representation:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Character</th>
                                    <th className="p-3">Hex Encoding</th>
                                    <th className="p-3">RFC 3986 Role</th>
                                    <th className="p-3">Common Ingestion Risk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">Space (&apos; &apos;)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">%20 or +</td>
                                    <td className="p-3">Whitespace representation</td>
                                    <td className="p-3 text-slate-600">plus-space confusion in form encodings</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">&amp;</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">%26</td>
                                    <td className="p-3">Parameter separator delimiter</td>
                                    <td className="p-3 text-rose-600 font-semibold">Unencoded values split into unwanted parameters</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">=</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">%3D</td>
                                    <td className="p-3">Key-value assignment delimiter</td>
                                    <td className="p-3 text-rose-600 font-semibold">Truncates values containing Base64 padding (=)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">#</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">%23</td>
                                    <td className="p-3">URI fragment delimiter</td>
                                    <td className="p-3 text-rose-600 font-semibold">Cuts off parameters downstream from unencoded hash</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">/</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">%2F</td>
                                    <td className="p-3">Path segment separator</td>
                                    <td className="p-3 text-slate-600">Breaks reverse proxy path rewriting rules</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Security & Security Pitfalls */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Security Hardening: Query String Parameter Pollution (HPP)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        HTTP Parameter Pollution (HPP) occurs when an attacker injects duplicate parameter keys to bypass Web Application Firewall (WAF) filters or alter backend business logic. Different backend web frameworks parse repeated parameters in conflicting ways:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Framework Ingestion Behaviors
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Express.js / Node.js:</strong> Repeated keys default to an array (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">[&quot;val1&quot;, &quot;val2&quot;]</code>), which can trigger unexpected type errors if the code expects a string.
                                </li>
                                <li>
                                    • <strong>PHP &amp; Python (Flask):</strong> Keep the last parameter value (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">val2</code>), ignoring preceding occurrences.
                                </li>
                                <li>
                                    • <strong>ASP.NET:</strong> Concatenates duplicate values with a comma (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">val1,val2</code>).
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Parameter Hardening Rules
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Never expose credentials:</strong> Passwords, API tokens, and JWTs should never be transmitted in query parameters, as they are logged in plain text in browser histories, proxy logs, and referer headers.
                                </li>
                                <li>
                                    • <strong>Validate and cast explicitly:</strong> Use schema validation libraries (like Zod or Ajv) to verify that incoming query parameters conform strictly to expected data types.
                                </li>
                                <li>
                                    • <strong>Always sanitize redirects:</strong> Parameterized <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">redirect_uri</code> values must be validated against strict origin whitelists to prevent Open Redirect exploits.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Code Implementation Snippets */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Query Parsing in Modern TypeScript & Next.js
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Implement bulletproof query parameter deconstruction across client and server environments using native WHATWG URL APIs:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-indigo-400 font-mono uppercase">Next.js App Router (Server Component)</h3>
                            <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed">
                                {`interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';
  const page = Number(params.page) || 1;
  const tags = Array.isArray(params.tag) 
    ? params.tag 
    : params.tag ? [params.tag] : [];

  return <div>Search: {query} (Page {page})</div>;
}`}
                            </pre>
                        </div>

                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase">Client-Side Web API (URLSearchParams)</h3>
                            <pre className="text-[11px] font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                                {`export function parseQueryToObject(urlStr: string): Record<string, any> {
  const url = new URL(urlStr, "https://dummy.base");
  const result: Record<string, any> = {};

  url.searchParams.forEach((val, key) => {
    if (result[key] !== undefined) {
      result[key] = Array.isArray(result[key]) 
        ? [...result[key], val] 
        : [result[key], val];
    } else {
      result[key] = val;
    }
  });

  return result;
}`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static FAQ Section */}
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
                                How does the URL Query Parameter Parser handle duplicate parameter keys?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The parser gives you three configurable resolution strategies: Combine into Array (default, creating an array of values for repeated keys such as ?tag=api&amp;tag=v2), Keep Last Occurrence (mirroring standard PHP/Node query string parsers), or Keep First Occurrence.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between decodeURI and decodeURIComponent in query strings?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                decodeURI is intended for full URLs and preserves reserved delimiters such as ?, &amp;, =, and /. decodeURIComponent decodes individual key or value tokens, properly translating encoded characters such as %20 (spaces), %26 (&amp;), and %3D (=) without breaking the overall URI syntax.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool upload parsed URLs or authentication parameters to remote servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The entire query parsing, URL reconstruction, decoding, and JSON/TypeScript serialization occurs purely client-side inside your browser sandbox via native Web APIs (URL and URLSearchParams). No URL parameters or authorization tokens ever leave your machine.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are boolean and numeric query string values transformed?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When Auto Type Casting is toggled on, strings matching &apos;true&apos;, &apos;false&apos;, &apos;null&apos;, and valid safe integers or floating-point numbers are automatically converted to their native JavaScript/JSON primitives rather than remaining generic strings.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I edit query parameters and reconstruct the full encoded URL in real time?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can add, toggle, edit, or delete individual keys and values in the interactive table. The tool updates the reconstructed URL, query string, and structured object export immediately.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}