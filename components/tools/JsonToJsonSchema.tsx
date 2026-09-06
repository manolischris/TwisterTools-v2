"use client";

import React, { useState, useMemo, useId } from "react";
import {
    FileJson,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Code2,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Download,
    FileCheck,
    Cpu,
    Boxes,
    Settings2,
    Braces
} from "lucide-react";

type SchemaDraft = "draft-07" | "draft-2020-12" | "draft-04";

interface GeneratorOptions {
    schemaDraft: SchemaDraft;
    requireAllFields: boolean;
    includeDescriptions: boolean;
    includeExamples: boolean;
    detectFormats: boolean;
    allowAdditionalProperties: boolean;
    strictNumbers: boolean;
    title: string;
}

const DEFAULT_OPTIONS: GeneratorOptions = {
    schemaDraft: "draft-07",
    requireAllFields: true,
    includeDescriptions: true,
    includeExamples: false,
    detectFormats: true,
    allowAdditionalProperties: false,
    strictNumbers: true,
    title: "GeneratedSchema",
};

const SAMPLE_PAYLOADS: Record<string, string> = {
    "User Profile": JSON.stringify(
        {
            id: "usr_99a82f1b",
            name: "Alex Mercer",
            email: "alex.mercer@enterprise.io",
            isActive: true,
            role: "lead_architect",
            age: 34,
            rating: 4.85,
            lastLogin: "2026-04-12T14:22:00Z",
            website: "https://alexmercer.dev",
            address: {
                street: "452 Innovation Blvd",
                city: "Austin",
                postalCode: "78701",
                coordinates: {
                    latitude: 30.2672,
                    longitude: -97.7431
                }
            },
            skills: ["TypeScript", "Next.js", "Distributed Systems", "PostgreSQL"],
            settings: {
                notifications: {
                    email: true,
                    push: false,
                    smsFrequency: "daily"
                },
                theme: "system"
            }
        },
        null,
        2
    ),
    "E-Commerce Order": JSON.stringify(
        {
            orderId: "ord_2026_88910",
            createdAt: "2026-05-19T09:15:30Z",
            customerId: "cust_4512",
            currency: "USD",
            subtotal: 198.5,
            taxAmount: 16.38,
            shippingFee: 0.0,
            status: "fulfilled",
            shippingAddress: {
                fullName: "Sarah Jenkins",
                addressLine1: "100 Market St",
                city: "San Francisco",
                state: "CA",
                postalCode: "94105",
                country: "US"
            },
            lineItems: [
                {
                    sku: "SKU-PRO-KB",
                    productName: "Mechanical Wireless Keyboard",
                    quantity: 1,
                    unitPrice: 149.0,
                    tags: ["peripherals", "hardware"]
                },
                {
                    sku: "SKU-DESK-MAT",
                    productName: "Merino Wool Desk Mat",
                    quantity: 1,
                    unitPrice: 49.5,
                    tags: ["accessories"]
                }
            ],
            discountApplied: false
        },
        null,
        2
    ),
    "REST API Response": JSON.stringify(
        {
            success: true,
            status: 200,
            timestamp: "2026-08-30T22:00:10Z",
            metadata: {
                page: 1,
                pageSize: 20,
                totalCount: 140,
                hasNextPage: true
            },
            data: [
                {
                    id: "evt_101",
                    eventType: "deployment.succeeded",
                    cluster: "eu-central-prod-1",
                    healthyNodes: 8,
                    avgLatencyMs: 24.6,
                    tags: ["k8s", "production", "v2.1"]
                }
            ],
            error: null
        },
        null,
        2
    ),
};

const ISO_DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

function inferJsonSchema(value: unknown, options: GeneratorOptions, isRoot: boolean = false): Record<string, unknown> {
    const draftUris: Record<SchemaDraft, string> = {
        "draft-07": "http://json-schema.org/draft-07/schema#",
        "draft-2020-12": "https://json-schema.org/draft/2020-12/schema",
        "draft-04": "http://json-schema.org/draft-04/schema#",
    };

    if (value === null) {
        const schema: Record<string, unknown> = { type: "null" };
        if (options.includeDescriptions) schema.description = "Explicit null literal";
        return schema;
    }

    if (Array.isArray(value)) {
        const schema: Record<string, unknown> = { type: "array" };
        if (isRoot) {
            schema.$schema = draftUris[options.schemaDraft];
            if (options.title.trim()) schema.title = options.title.trim();
        }

        if (options.includeExamples && value.length > 0) {
            schema.examples = [value];
        }

        if (value.length === 0) {
            schema.items = {};
            if (options.includeDescriptions) {
                schema.description = "Homogeneous or dynamic array of items";
            }
        } else {
            const childSchemas = value.map((item) => inferJsonSchema(item, options, false));
            const firstChildType = childSchemas[0].type;
            const isHomogeneous = childSchemas.every((s) => s.type === firstChildType);

            if (isHomogeneous) {
                if (firstChildType === "object") {
                    const mergedProperties: Record<string, unknown> = {};
                    const propertyPresence: Record<string, number> = {};

                    value.forEach((item) => {
                        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
                            Object.keys(item).forEach((k) => {
                                propertyPresence[k] = (propertyPresence[k] || 0) + 1;
                            });
                        }
                    });

                    value.forEach((item) => {
                        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
                            Object.entries(item).forEach(([propKey, propVal]) => {
                                if (!mergedProperties[propKey]) {
                                    mergedProperties[propKey] = inferJsonSchema(propVal, options, false);
                                }
                            });
                        }
                    });

                    const requiredProps = Object.keys(propertyPresence).filter(
                        (k) => propertyPresence[k] === value.length
                    );

                    const itemSchema: Record<string, unknown> = {
                        type: "object",
                        properties: mergedProperties,
                        additionalProperties: options.allowAdditionalProperties,
                    };

                    if (options.requireAllFields && requiredProps.length > 0) {
                        itemSchema.required = requiredProps;
                    }

                    schema.items = itemSchema;
                } else {
                    schema.items = childSchemas[0];
                }
            } else {
                schema.items = {
                    anyOf: Array.from(new Set(childSchemas.map((s) => JSON.stringify(s)))).map((str) =>
                        JSON.parse(str)
                    ),
                };
            }
        }
        return schema;
    }

    if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        const properties: Record<string, unknown> = {};
        const required: string[] = [];

        Object.entries(obj).forEach(([k, v]) => {
            properties[k] = inferJsonSchema(v, options, false);
            if (options.includeDescriptions && !properties[k] && typeof properties[k] === "object") {
                (properties[k] as Record<string, unknown>).description = `Property ${k}`;
            }
            if (options.requireAllFields) {
                required.push(k);
            }
        });

        const schema: Record<string, unknown> = {
            type: "object",
            properties,
            additionalProperties: options.allowAdditionalProperties,
        };

        if (isRoot) {
            schema.$schema = draftUris[options.schemaDraft];
            if (options.title.trim()) schema.title = options.title.trim();
        }

        if (required.length > 0) {
            schema.required = required;
        }

        return schema;
    }

    if (typeof value === "string") {
        const schema: Record<string, unknown> = { type: "string" };

        if (options.detectFormats) {
            if (ISO_DATE_TIME_REGEX.test(value)) {
                schema.format = "date-time";
            } else if (ISO_DATE_REGEX.test(value)) {
                schema.format = "date";
            } else if (EMAIL_REGEX.test(value)) {
                schema.format = "email";
            } else if (URL_REGEX.test(value)) {
                schema.format = "uri";
            } else if (UUID_REGEX.test(value)) {
                schema.format = "uuid";
            } else if (IPV4_REGEX.test(value)) {
                schema.format = "ipv4";
            }
        }

        if (options.includeExamples) {
            schema.examples = [value];
        }

        return schema;
    }

    if (typeof value === "number") {
        const isInteger = Number.isInteger(value);
        const schema: Record<string, unknown> = {
            type: options.strictNumbers && isInteger ? "integer" : "number",
        };

        if (options.includeExamples) {
            schema.examples = [value];
        }

        return schema;
    }

    if (typeof value === "boolean") {
        const schema: Record<string, unknown> = { type: "boolean" };
        if (options.includeExamples) {
            schema.examples = [value];
        }
        return schema;
    }

    return { type: "string" };
}

export default function JsonToJsonSchema() {
    const [rawJson, setRawJson] = useState<string>(SAMPLE_PAYLOADS["User Profile"]);
    const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);
    const [copied, setCopied] = useState<boolean>(false);

    const draftSelectId = useId();
    const titleInputId = useId();

    const { generatedSchemaText, stats, parseError } = useMemo(() => {
        if (!rawJson.trim()) {
            return {
                generatedSchemaText: "",
                stats: { keysCount: 0, depth: 0, typesDetected: [] as string[] },
                parseError: null,
            };
        }

        try {
            const parsed = JSON.parse(rawJson);

            const schemaObj = inferJsonSchema(parsed, options, true);

            let keysCount = 0;
            let maxDepth = 0;
            const detectedTypesSet = new Set<string>();

            const traverse = (node: unknown, depth: number) => {
                maxDepth = Math.max(maxDepth, depth);
                if (node && typeof node === "object") {
                    if ("type" in (node as Record<string, unknown>)) {
                        const t = (node as Record<string, unknown>).type;
                        if (typeof t === "string") detectedTypesSet.add(t);
                    }
                    if ("properties" in (node as Record<string, unknown>)) {
                        const props = (node as Record<string, unknown>).properties as Record<string, unknown>;
                        const keys = Object.keys(props || {});
                        keysCount += keys.length;
                        Object.values(props || {}).forEach((sub) => traverse(sub, depth + 1));
                    }
                    if ("items" in (node as Record<string, unknown>)) {
                        traverse((node as Record<string, unknown>).items, depth + 1);
                    }
                }
            };

            traverse(schemaObj, 1);

            return {
                generatedSchemaText: JSON.stringify(schemaObj, null, 2),
                stats: {
                    keysCount,
                    depth: maxDepth,
                    typesDetected: Array.from(detectedTypesSet),
                },
                parseError: null,
            };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Malformed JSON syntax encountered";
            return {
                generatedSchemaText: "",
                stats: { keysCount: 0, depth: 0, typesDetected: [] as string[] },
                parseError: msg,
            };
        }
    }, [rawJson, options]);

    const handleCopy = () => {
        if (!generatedSchemaText) return;
        navigator.clipboard.writeText(generatedSchemaText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!generatedSchemaText) return;
        const blob = new Blob([generatedSchemaText], { type: "application/schema+json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${options.title.toLowerCase() || "schema"}.schema.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLoadSample = (key: string) => {
        if (SAMPLE_PAYLOADS[key]) {
            setRawJson(SAMPLE_PAYLOADS[key]);
        }
    };

    const handleReset = () => {
        setRawJson(SAMPLE_PAYLOADS["User Profile"]);
        setOptions(DEFAULT_OPTIONS);
    };

    const handleFormatInput = () => {
        try {
            const obj = JSON.parse(rawJson);
            setRawJson(JSON.stringify(obj, null, 2));
        } catch {
            // Keep error visible via standard flow
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "JSON Schema Generator from Mock JSON Data",
        "url": "https://twistertools.com/tools/developer-tools/json-to-json-schema",
        "description": "Convert raw JSON sample documents into production-grade JSON Schemas automatically. Supports Draft-07, Draft 2020-12, automatic format inference, array item extraction, and strict validation controls.",
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
                "name": "What is the difference between JSON Schema Draft-07 and Draft 2020-12?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Draft-07 is the most widely adopted legacy standard, supported by virtually every validation engine (such as Ajv v6-v8, python-jsonschema, and Newtonsoft.Json). Draft 2020-12 represents the modern unified specification, introducing prefixItems for tuple arrays, dynamic recursive anchors ($dynamicAnchor), and a redesigned dialect architecture ($vocabulary)."
                }
            },
            {
                "@type": "Question",
                "name": "How does the tool handle arrays containing heterogeneous objects?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When an array contains objects with varying fields, the engine inspects every item, extracts the mathematical union of all discovered properties, and marks a property as required only if it appears consistently across every single element in the array."
                }
            },
            {
                "@type": "Question",
                "name": "Why should additionalProperties: false be enforced in API contracts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Setting additionalProperties: false prevents payload pollution, unrecognized parameter injection, and parameter tampering attacks. It forces client API payloads to conform strictly to specified fields, eliminating unvetted keys before routing data downstream."
                }
            },
            {
                "@type": "Question",
                "name": "Which string formats are automatically detected by the parser?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The generator inspects string primitives against strict regular expressions to automatically inject format annotations including date-time (ISO 8601), date, email, uri (RFC 3986), uuid (v1-v5), and ipv4."
                }
            },
            {
                "@type": "Question",
                "name": "Does the JSON Schema generator upload any payload data to external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The entire JSON parsing, type deduction, schema traversal, and AST assembly runs purely client-side inside your browser sandbox via Web JavaScript runtime APIs. Zero network telemetry or raw data packets leave your machine."
                }
            },
            {
                "@type": "Question",
                "name": "How do I validate API payloads against this schema in Node.js or Python?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In Node.js, install Ajv (npm i ajv ajv-formats) and execute ajv.compile(schema)(data). In Python, install jsonschema (pip install jsonschema) and execute jsonschema.validate(instance=data, schema=schema)."
                }
            }
        ]
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

            {/* Quick Presets & Control Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Generator Dialects & Controls
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 font-medium">Load Template:</span>
                        {Object.keys(SAMPLE_PAYLOADS).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleLoadSample(key)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer border border-slate-200/60"
                            >
                                {key}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer border border-rose-200/60 ml-1"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                    {/* Draft Selection */}
                    <div className="space-y-1.5">
                        <label htmlFor={draftSelectId} className="text-xs font-bold text-slate-700 block">
                            Specification Dialect
                        </label>
                        <select
                            id={draftSelectId}
                            value={options.schemaDraft}
                            onChange={(e) => setOptions((p) => ({ ...p, schemaDraft: e.target.value as SchemaDraft }))}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium outline-none"
                        >
                            <option value="draft-07">Draft-07 (Most Compatible)</option>
                            <option value="draft-2020-12">Draft 2020-12 (Modern Core)</option>
                            <option value="draft-04">Draft-04 (Legacy API Gateways)</option>
                        </select>
                    </div>

                    {/* Schema Title */}
                    <div className="space-y-1.5">
                        <label htmlFor={titleInputId} className="text-xs font-bold text-slate-700 block">
                            Root Schema Title
                        </label>
                        <input
                            id={titleInputId}
                            type="text"
                            value={options.title}
                            onChange={(e) => setOptions((p) => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. UserPayload"
                            className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 outline-none"
                        />
                    </div>

                    {/* Checkbox Toggles Group 1 */}
                    <div className="space-y-2 pt-1 sm:pt-0">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.requireAllFields}
                                onChange={(e) => setOptions((p) => ({ ...p, requireAllFields: e.target.checked }))}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            Require Discovered Properties
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.detectFormats}
                                onChange={(e) => setOptions((p) => ({ ...p, detectFormats: e.target.checked }))}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            Detect Formats (date, email, uri)
                        </label>
                    </div>

                    {/* Checkbox Toggles Group 2 */}
                    <div className="space-y-2 pt-1 sm:pt-0">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.strictNumbers}
                                onChange={(e) => setOptions((p) => ({ ...p, strictNumbers: e.target.checked }))}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            Distinguish Integer vs Number
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.allowAdditionalProperties}
                                onChange={(e) => setOptions((p) => ({ ...p, allowAdditionalProperties: e.target.checked }))}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            Allow Additional Properties
                        </label>
                    </div>
                </div>
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Raw Mock JSON Input */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Braces className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                    Input Mock JSON Data
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleFormatInput}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition cursor-pointer"
                            >
                                Prettify JSON
                            </button>
                        </div>

                        {parseError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <span className="font-bold">Syntax Parsing Error:</span>
                                    <p className="font-mono">{parseError}</p>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <textarea
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                placeholder="Paste your raw JSON payload here..."
                                rows={16}
                                className="w-full p-4 rounded-xl font-mono text-xs leading-relaxed bg-slate-900 text-emerald-400 border border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[280px] max-h-[600px] overflow-auto"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <Boxes className="w-4 h-4 text-slate-400" />
                            Client-Side JSON Engine
                        </span>
                        <span className="font-mono text-slate-600">
                            {rawJson.length.toLocaleString()} characters
                        </span>
                    </div>
                </div>

                {/* Right Panel: Inferred JSON Schema Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                    Generated JSON Schema
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    disabled={!generatedSchemaText}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 disabled:opacity-50 cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                    Download
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    disabled={!generatedSchemaText}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                                    {copied ? "Copied" : "Copy Schema"}
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <pre className="p-4 rounded-xl font-mono text-xs leading-relaxed bg-slate-950 text-indigo-300 border border-slate-900 min-h-[380px] max-h-[600px] overflow-auto select-all">
                                {generatedSchemaText || (parseError ? "// Resolve JSON parse error to inspect schema." : "// Schema output ready.")}
                            </pre>
                        </div>

                        {/* Schema Structural Diagnostics Bar */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium block">Properties</span>
                                <span className="font-mono text-xs font-bold text-slate-800">{stats.keysCount}</span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium block">Max Depth</span>
                                <span className="font-mono text-xs font-bold text-indigo-600">{stats.depth} Levels</span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium block">Types Mapped</span>
                                <span className="font-mono text-xs font-bold text-emerald-600">
                                    {stats.typesDetected.length > 0 ? stats.typesDetected.join(", ") : "none"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Valid Schema Dialect: {options.schemaDraft}
                        </span>
                        <span className="text-slate-400">RFC 7159 & RFC 8259 Compliant</span>
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
                            Architectural Foundations of JSON Schema in Distributed Systems
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        JSON Schema is an open-standard declarative vocabulary for annotating, filtering, and validating JSON documents across distributed architectures. As modern software evolves into microservices, serverless workers, and external third-party API gateways, ensuring that unstructured JSON documents adhere strictly to well-defined type contracts is critical. Automated schema generation from sample payloads bridges the gap between ad-hoc experimentation and rigid contract-driven development.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <FileCheck className="w-4 h-4 text-indigo-600" /> Contract Invariance
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Formulates clear expectations for payload schemas, guarding microservice pipelines from missing required keys, corrupted data types, and invalid nested hierarchies.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Schema Evolution
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Provides explicit dialect declarations ($schema) and identifier scopes ($id), facilitating backward and forward compatibility checks during continuous deployment cycles.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Automated Code Generation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Feeds downstream CLI tooling to automatically generate TypeScript interfaces, Go structs, Python Pydantic models, and OpenAPI 3.1 request schemas directly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Dialect Matrix Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            JSON Schema Dialect Matrix: Draft-04 vs Draft-07 vs Draft 2020-12
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Choosing the right JSON Schema dialect depends directly on your runtime validation stack and API gateway dependencies. The table below outlines key structural differences across standards:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Feature / Keyword</th>
                                    <th className="p-3">Draft-04</th>
                                    <th className="p-3">Draft-07</th>
                                    <th className="p-3">Draft 2020-12</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Tuple Validation</td>
                                    <td className="p-3 font-mono">items: [array]</td>
                                    <td className="p-3 font-mono">items: [array]</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">prefixItems</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Dynamic References</td>
                                    <td className="p-3 text-rose-600 font-semibold">Unsupported</td>
                                    <td className="p-3 text-rose-600 font-semibold">Unsupported</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">$dynamicAnchor / $dynamicRef</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Conditional Logic</td>
                                    <td className="p-3 text-rose-600 font-semibold">Unsupported</td>
                                    <td className="p-3 font-mono text-emerald-600">if / then / else</td>
                                    <td className="p-3 font-mono text-emerald-600">if / then / else / dependentRequired</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">OpenAPI Compatibility</td>
                                    <td className="p-3">Swagger 2.0 (Superset)</td>
                                    <td className="p-3 font-semibold text-indigo-600">OpenAPI 3.0 (Modified)</td>
                                    <td className="p-3 font-semibold text-emerald-600">OpenAPI 3.1 (Full Alignment)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Ecosystem Adoption</td>
                                    <td className="p-3">Legacy Gateways (AWS API GW v1)</td>
                                    <td className="p-3 text-emerald-600 font-bold">Universal (Ajv, Python, Go)</td>
                                    <td className="p-3 text-indigo-600 font-bold">Modern Cloud Services & CLI tooling</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Security & Validation Hardening */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Security Hardening: Eliminating Injection & Pollution Vulnerabilities
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unchecked JSON payloads are a frequent gateway for Prototype Pollution and Mass Assignment vulnerabilities in JavaScript and Python backends. Automated schema enforcement stops these vectors dead at the reverse proxy boundary.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Contract Hardening Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Enforce Strict additionalProperties: false:</strong> Reject payloads carrying unauthorized keys to completely prevent mass assignment attacks on database models.
                                </li>
                                <li>
                                    • <strong>Separate Integer from Number:</strong> Force numeric keys representing IDs, page offsets, or counters to explicitly declare <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">type: "integer"</code> to avoid floating point precision injection.
                                </li>
                                <li>
                                    • <strong>Validate Formats at Ingestion:</strong> Use standardized format declarations like <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">date-time</code> and <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">uuid</code> to shield parsing logic from malformed inputs.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Ingestion Pitfalls
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Permissive AnyOf Nesting:</strong> Overly broad schema fallbacks allow invalid data structures to bypass validation layers unnoticed.
                                </li>
                                <li>
                                    • <strong>ReDoS in Custom Patterns:</strong> Poorly constructed regular expressions inside <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">pattern</code> properties can freeze backend event loops under malicious input.
                                </li>
                                <li>
                                    • <strong>Neglecting Array Bounds:</strong> Omitting <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">maxItems</code> allows Denial of Service (DoS) attacks via memory exhaustion from million-item arrays.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Enterprise Production Code Snippet */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Validation Integration (Node.js Ajv & Python)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Deploy your generated schema directly into production API microservices. Here is how to execute performant validation in Node.js (with Ajv v8) and Python (jsonschema):
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-indigo-400 font-mono uppercase">Node.js (TypeScript / Ajv)</h3>
                            <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed">
                                {`import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "./user.schema.json";

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const validate = ajv.compile(schema);
const valid = validate(requestPayload);

if (!valid) {
  console.error("Payload validation errors:", validate.errors);
  throw new Error("Invalid incoming API payload");
}`}
                            </pre>
                        </div>

                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase">Python 3 (jsonschema)</h3>
                            <pre className="text-[11px] font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                                {`import json
from jsonschema import validate, ValidationError

with open("user.schema.json") as f:
    schema = json.load(f)

try:
    validate(instance=payload, schema=schema)
    print("Payload conforms to contract")
except ValidationError as err:
    print(f"Schema violation: {err.message}")
    raise`}
                            </pre>
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
                                What is the difference between JSON Schema Draft-07 and Draft 2020-12?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Draft-07 is the most widely adopted legacy standard, supported by virtually every validation engine (such as Ajv v6-v8, python-jsonschema, and Newtonsoft.Json). Draft 2020-12 represents the modern unified specification, introducing prefixItems for tuple arrays, dynamic recursive anchors ($dynamicAnchor), and a redesigned dialect architecture ($vocabulary).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the tool handle arrays containing heterogeneous objects?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When an array contains objects with varying fields, the engine inspects every item, extracts the mathematical union of all discovered properties, and marks a property as required only if it appears consistently across every single element in the array.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why should additionalProperties: false be enforced in API contracts?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Setting additionalProperties: false prevents payload pollution, unrecognized parameter injection, and parameter tampering attacks. It forces client API payloads to conform strictly to specified fields, eliminating unvetted keys before routing data downstream.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Which string formats are automatically detected by the parser?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The generator inspects string primitives against strict regular expressions to automatically inject format annotations including date-time (ISO 8601), date, email, uri (RFC 3986), uuid (v1-v5), and ipv4.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does the JSON Schema generator upload any payload data to external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The entire JSON parsing, type deduction, schema traversal, and AST assembly runs purely client-side inside your browser sandbox via Web JavaScript runtime APIs. Zero network telemetry or raw data packets leave your machine.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I validate API payloads against this schema in Node.js or Python?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In Node.js, install Ajv (npm i ajv ajv-formats) and execute ajv.compile(schema)(data). In Python, install jsonschema (pip install jsonschema) and execute jsonschema.validate(instance=data, schema=schema).
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}