"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Download,
    FileCheck,
    Boxes,
    Settings2,
    Braces,
    FileCode2,
    HelpCircle,
    TerminalSquare
} from "lucide-react";

type DeclarationKind = "interface" | "type";
type ArrayStyle = "bracket" | "generic";
type OptionalityMode = "inferred" | "all-required" | "all-optional";

interface GeneratorOptions {
    rootName: string;
    declarationKind: DeclarationKind;
    arrayStyle: ArrayStyle;
    optionalityMode: OptionalityMode;
    exportKeywords: boolean;
    readonlyProps: boolean;
    inlineNested: boolean;
    detectDates: boolean;
    includeJsDoc: boolean;
}

const DEFAULT_OPTIONS: GeneratorOptions = {
    rootName: "RootObject",
    declarationKind: "interface",
    arrayStyle: "bracket",
    optionalityMode: "inferred",
    exportKeywords: true,
    readonlyProps: false,
    inlineNested: false,
    detectDates: true,
    includeJsDoc: true,
};

const SAMPLE_PAYLOADS: Record<string, string> = {
    "User Session": JSON.stringify(
        {
            userId: "usr_88203f1",
            username: "sarah_architect",
            email: "sarah.architect@cloudscale.io",
            isActive: true,
            roles: ["admin", "developer", "billing_manager"],
            avatarUrl: "https://cloudscale.io/avatars/sarah.png",
            registeredAt: "2026-03-15T08:30:00Z",
            profile: {
                firstName: "Sarah",
                lastName: "Chen",
                age: 32,
                timezone: "America/Los_Angeles",
                localePreference: "en-US",
                coordinates: {
                    latitude: 37.7749,
                    longitude: -122.4194
                }
            },
            permissions: {
                canDeploy: true,
                canDeleteCluster: false,
                maxAllowedNodes: 64
            }
        },
        null,
        2
    ),
    "E-Commerce Cart": JSON.stringify(
        {
            cartId: "cart_99184a",
            currency: "USD",
            subtotal: 349.97,
            taxEstimate: 28.87,
            total: 378.84,
            isGiftOrder: false,
            customerNotes: null,
            items: [
                {
                    sku: "SKU-NVME-4TB",
                    title: "PCIe 5.0 M.2 SSD 4TB",
                    unitPrice: 249.99,
                    quantity: 1,
                    inStock: true,
                    tags: ["hardware", "storage"]
                },
                {
                    sku: "SKU-USB-HUB-100W",
                    title: "10-in-1 Aluminum USB-C Hub",
                    unitPrice: 49.99,
                    quantity: 2,
                    inStock: true,
                    discountCode: "SPRING26",
                    tags: ["peripherals"]
                }
            ],
            shippingMethod: {
                carrier: "FedEx Express",
                estimatedDelivery: "2026-06-12",
                trackingCode: "TRK_8830114092"
            }
        },
        null,
        2
    ),
    "Paginated API Response": JSON.stringify(
        {
            status: "success",
            statusCode: 200,
            generatedAt: "2026-08-20T17:45:10Z",
            pagination: {
                page: 1,
                pageSize: 25,
                totalPages: 8,
                totalRecords: 184,
                hasNext: true,
                hasPrevious: false
            },
            data: [
                {
                    id: 1041,
                    serviceName: "auth-gateway",
                    status: "healthy",
                    uptimeSeconds: 981240,
                    errorRatePct: 0.002,
                    activePods: 12
                },
                {
                    id: 1042,
                    serviceName: "payment-router",
                    status: "degraded",
                    uptimeSeconds: 120400,
                    errorRatePct: 1.48,
                    activePods: 6,
                    maintenanceNotes: "Under investigation for redis connection pool timeouts"
                }
            ]
        },
        null,
        2
    ),
};

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

function toPascalCase(str: string): string {
    return str
        .replace(/[^a-zA-Z0-9]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("") || "NestedType";
}

function sanitizeIdentifier(name: string): string {
    const cleaned = name.replace(/^[^a-zA-Z_$]+/, "").replace(/[^a-zA-Z0-9_$]/g, "");
    return cleaned || "GeneratedType";
}

function sanitizePropertyKey(key: string): string {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
        return key;
    }
    return JSON.stringify(key);
}

interface ParsedTypeNode {
    typeString: string;
    auxiliaryDefinitions: string[];
}

function inferType(
    value: unknown,
    suggestedName: string,
    options: GeneratorOptions,
    indent: string = "  ",
    depth: number = 0
): ParsedTypeNode {
    if (value === null) {
        return { typeString: "null", auxiliaryDefinitions: [] };
    }

    if (value === undefined) {
        return { typeString: "undefined", auxiliaryDefinitions: [] };
    }

    if (typeof value === "string") {
        if (options.detectDates && ISO_DATE_REGEX.test(value) && value.length >= 10) {
            return { typeString: "Date | string", auxiliaryDefinitions: [] };
        }
        return { typeString: "string", auxiliaryDefinitions: [] };
    }

    if (typeof value === "number") {
        return { typeString: "number", auxiliaryDefinitions: [] };
    }

    if (typeof value === "boolean") {
        return { typeString: "boolean", auxiliaryDefinitions: [] };
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            const emptyType = options.arrayStyle === "bracket" ? "unknown[]" : "Array<unknown>";
            return { typeString: emptyType, auxiliaryDefinitions: [] };
        }

        const subItemName = suggestedName.endsWith("s")
            ? suggestedName.slice(0, -1)
            : `${suggestedName}Item`;

        const allObjects = value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item));

        if (allObjects && value.length >= 1) {
            const keyOccurrences = new Map<string, number>();
            const mergedObject: Record<string, unknown> = {};

            value.forEach((item) => {
                const itemObj = item as Record<string, unknown>;
                Object.keys(itemObj).forEach((k) => {
                    keyOccurrences.set(k, (keyOccurrences.get(k) || 0) + 1);
                    if (!(k in mergedObject)) {
                        mergedObject[k] = itemObj[k];
                    }
                });
            });

            const auxDefs: string[] = [];
            const fields: string[] = [];

            const keys = Object.keys(mergedObject);
            for (const key of keys) {
                const childVal = mergedObject[key];
                const childSuggestedName = `${subItemName}${toPascalCase(key)}`;
                const childResult = inferType(childVal, childSuggestedName, options, indent, depth + 1);
                auxDefs.push(...childResult.auxiliaryDefinitions);

                let isOptional = false;
                if (options.optionalityMode === "all-optional") {
                    isOptional = true;
                } else if (options.optionalityMode === "inferred") {
                    isOptional = (keyOccurrences.get(key) || 0) < value.length;
                }

                const prefix = options.readonlyProps ? "readonly " : "";
                const safeKey = sanitizePropertyKey(key);
                const optMark = isOptional ? "?" : "";
                fields.push(`${indent}  ${prefix}${safeKey}${optMark}: ${childResult.typeString};`);
            }

            const cleanTypeName = toPascalCase(subItemName);
            const exportPrefix = options.exportKeywords ? "export " : "";

            let def = "";
            if (options.declarationKind === "interface") {
                def = `${exportPrefix}interface ${cleanTypeName} {\n${fields.join("\n")}\n}`;
            } else {
                def = `${exportPrefix}type ${cleanTypeName} = {\n${fields.join("\n")}\n};`;
            }

            auxDefs.push(def);

            const resultType = options.arrayStyle === "bracket"
                ? `${cleanTypeName}[]`
                : `Array<${cleanTypeName}>`;

            return { typeString: resultType, auxiliaryDefinitions: auxDefs };
        }

        const auxDefs: string[] = [];
        const encounteredTypes = new Set<string>();

        value.forEach((element, idx) => {
            const childNode = inferType(
                element,
                `${subItemName}${idx === 0 ? "" : idx + 1}`,
                options,
                indent,
                depth + 1
            );
            auxDefs.push(...childNode.auxiliaryDefinitions);
            encounteredTypes.add(childNode.typeString);
        });

        const distinctTypes = Array.from(encounteredTypes);
        const unionType = distinctTypes.length === 1 ? distinctTypes[0] : `(${distinctTypes.join(" | ")})`;
        const formattedArray = options.arrayStyle === "bracket" ? `${unionType}[]` : `Array<${unionType}>`;

        return { typeString: formattedArray, auxiliaryDefinitions: auxDefs };
    }

    if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        const auxDefs: string[] = [];

        if (keys.length === 0) {
            if (depth === 0) {
                const cleanTypeName = toPascalCase(suggestedName);
                const exportPrefix = options.exportKeywords ? "export " : "";
                const emptyDef = options.declarationKind === "interface"
                    ? `${exportPrefix}interface ${cleanTypeName} {}`
                    : `${exportPrefix}type ${cleanTypeName} = {};`;
                return { typeString: cleanTypeName, auxiliaryDefinitions: [emptyDef] };
            }
            return { typeString: "Record<string, unknown>", auxiliaryDefinitions: [] };
        }

        const propertyLines: string[] = [];

        for (const key of keys) {
            const childVal = obj[key];
            const childSuggestedName = `${suggestedName}${toPascalCase(key)}`;
            const childNode = inferType(childVal, childSuggestedName, options, indent, depth + 1);

            auxDefs.push(...childNode.auxiliaryDefinitions);

            const isOptional = options.optionalityMode === "all-optional";
            const prefix = options.readonlyProps ? "readonly " : "";
            const safeKey = sanitizePropertyKey(key);
            const optMark = isOptional ? "?" : "";

            let jsDocComment = "";
            if (options.includeJsDoc && childVal !== null && typeof childVal !== "object") {
                const sampleStr = String(childVal).replace(/\*\//g, "* /").slice(0, 40);
                jsDocComment = `${indent}  /** @example ${sampleStr} */\n`;
            }

            propertyLines.push(`${jsDocComment}${indent}  ${prefix}${safeKey}${optMark}: ${childNode.typeString};`);
        }

        if (options.inlineNested && depth > 0) {
            const inlineObj = `{\n${propertyLines.join("\n")}\n${indent}}`;
            return { typeString: inlineObj, auxiliaryDefinitions: auxDefs };
        }

        const cleanTypeName = toPascalCase(suggestedName);
        const exportPrefix = options.exportKeywords ? "export " : "";

        let typeDefinition = "";
        if (options.declarationKind === "interface") {
            typeDefinition = `${exportPrefix}interface ${cleanTypeName} {\n${propertyLines.join("\n")}\n}`;
        } else {
            typeDefinition = `${exportPrefix}type ${cleanTypeName} = {\n${propertyLines.join("\n")}\n};`;
        }

        if (depth === 0) {
            return { typeString: cleanTypeName, auxiliaryDefinitions: [...auxDefs, typeDefinition] };
        }

        auxDefs.push(typeDefinition);
        return { typeString: cleanTypeName, auxiliaryDefinitions: auxDefs };
    }

    return { typeString: "unknown", auxiliaryDefinitions: [] };
}

export default function JsonToTypescriptConverter() {
    const [rawJson, setRawJson] = useState<string>(SAMPLE_PAYLOADS["User Session"]);
    const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);
    const [copied, setCopied] = useState<boolean>(false);

    const rootNameInputId = useId();
    const declarationKindSelectId = useId();
    const arrayStyleSelectId = useId();
    const optionalitySelectId = useId();

    const { generatedCode, stats, parseError } = useMemo(() => {
        if (!rawJson.trim()) {
            return {
                generatedCode: "",
                stats: { interfacesGenerated: 0, fieldsCount: 0, depth: 0 },
                parseError: null,
            };
        }

        try {
            const parsed = JSON.parse(rawJson);
            const cleanRoot = sanitizeIdentifier(options.rootName.trim()) || "RootObject";

            let initialResult: ParsedTypeNode;

            if (Array.isArray(parsed)) {
                initialResult = inferType(parsed, cleanRoot, options, "", 0);

                const exportPrefix = options.exportKeywords ? "export " : "";
                const rootAlias = `${exportPrefix}type ${cleanRoot} = ${initialResult.typeString};`;
                initialResult.auxiliaryDefinitions.push(rootAlias);
            } else if (typeof parsed === "object" && parsed !== null) {
                initialResult = inferType(parsed, cleanRoot, options, "", 0);
            } else {
                const primitiveResult = inferType(parsed, cleanRoot, options, "", 0);
                const exportPrefix = options.exportKeywords ? "export " : "";
                const singleType = `${exportPrefix}type ${cleanRoot} = ${primitiveResult.typeString};`;
                return {
                    generatedCode: singleType,
                    stats: { interfacesGenerated: 1, fieldsCount: 1, depth: 1 },
                    parseError: null,
                };
            }

            const uniqueDefinitions = Array.from(new Set(initialResult.auxiliaryDefinitions));
            const formattedOutput = uniqueDefinitions.join("\n\n");

            const countInterfaces = (formattedOutput.match(/(interface|type)\s+[a-zA-Z0-9_$]+/g) || []).length;
            const countFields = (formattedOutput.match(/:\s+[a-zA-Z0-9_$|[\]<>]/g) || []).length;

            const calculateMaxDepth = (val: unknown, current: number): number => {
                if (!val || typeof val !== "object") return current;
                let max = current;
                const items: unknown[] = Array.isArray(val)
                    ? val
                    : Object.values(val as Record<string, unknown>);

                for (const item of items) {
                    const depth = calculateMaxDepth(item, current + 1);
                    if (depth > max) {
                        max = depth;
                    }
                }
                return max;
            };

            const maxDepth = calculateMaxDepth(parsed, 1);

            return {
                generatedCode: formattedOutput,
                stats: {
                    interfacesGenerated: countInterfaces,
                    fieldsCount: countFields,
                    depth: maxDepth,
                },
                parseError: null,
            };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Malformed JSON syntax encountered";
            return {
                generatedCode: "",
                stats: { interfacesGenerated: 0, fieldsCount: 0, depth: 0 },
                parseError: msg,
            };
        }
    }, [rawJson, options]);

    const handleCopy = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!generatedCode) return;
        const blob = new Blob([generatedCode], { type: "text/typescript;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fileName = (options.rootName.trim().toLowerCase() || "types") + ".ts";
        a.download = fileName;
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
        setRawJson(SAMPLE_PAYLOADS["User Session"]);
        setOptions(DEFAULT_OPTIONS);
    };

    const handleFormatInput = () => {
        try {
            const obj = JSON.parse(rawJson);
            setRawJson(JSON.stringify(obj, null, 2));
        } catch {
            // Error is already indicated by parseError
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "JSON to TypeScript Interface & Type Generator",
        "url": "https://twistertools.com/tools/developer-tools/json-to-typescript-converter",
        "description": "Convert raw JSON sample objects into clean, production-ready TypeScript interfaces and type definitions instantly. Handles nested types, union arrays, optionality heuristics, and JSDoc annotations.",
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
                "name": "What is the difference between TypeScript interface and type alias?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An interface creates an extendable object shape capable of declaration merging, whereas a type alias allows modeling primitive unions, intersections, tuples, and mapped types directly. For raw object payload modeling, both work seamlessly, with interfaces generally providing faster TypeScript compiler type-checking in massive enterprise codebases."
                }
            },
            {
                "@type": "Question",
                "name": "How does the converter handle inconsistent object fields in JSON arrays?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The engine examines every item in the JSON array to construct a unified field union. If a property is present in some items but absent in others, the generator automatically marks that field as optional with a question mark (?) in the resulting TypeScript interface."
                }
            },
            {
                "@type": "Question",
                "name": "Can this tool parse Date strings into actual TypeScript Date types?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When the Detect Dates toggle is active, standard ISO 8601 timestamps and date strings are typed as 'Date | string'. This accounts for the fact that JSON.parse preserves raw strings unless explicitly converted via a client-side date reviver."
                }
            },
            {
                "@type": "Question",
                "name": "Is my sensitive JSON payload transmitted to external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The entire AST parser, tokenization, type inference, and code synthesis run 100% client-side inside your browser sandbox via local JavaScript execution. Zero telemetry, cookies, or API packets are dispatched."
                }
            },
            {
                "@type": "Question",
                "name": "How should I structure TypeScript definitions for large nested REST APIs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The recommended approach is to decompose nested JSON objects into individual named sub-interfaces rather than inline types. This modularity improves reusability, simplifies automated mock generation, and makes unit testing easier across React components and Next.js server actions."
                }
            },
            {
                "@type": "Question",
                "name": "How do I safely parse unknown incoming JSON into these generated TypeScript types?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use runtime validation libraries such as Zod, Valibot, or ArkType to validate unknown JSON strings at the runtime boundary, or pair generated TypeScript interfaces with type assertion functions like 'const data = (await res.json()) as UserSession;'."
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

            {/* Quick Presets & Options Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            TypeScript Compiler Preferences & Presets
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
                    {/* Root Identifier */}
                    <div className="space-y-1.5">
                        <label htmlFor={rootNameInputId} className="text-xs font-bold text-slate-700 block">
                            Root Type Name
                        </label>
                        <input
                            id={rootNameInputId}
                            type="text"
                            value={options.rootName}
                            onChange={(e) => setOptions((p) => ({ ...p, rootName: e.target.value }))}
                            placeholder="e.g. UserPayload"
                            className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 outline-none"
                        />
                    </div>

                    {/* Declaration Kind */}
                    <div className="space-y-1.5">
                        <label htmlFor={declarationKindSelectId} className="text-xs font-bold text-slate-700 block">
                            Declaration Kind
                        </label>
                        <select
                            id={declarationKindSelectId}
                            value={options.declarationKind}
                            onChange={(e) => setOptions((p) => ({ ...p, declarationKind: e.target.value as DeclarationKind }))}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium outline-none"
                        >
                            <option value="interface">interface Name &#123; &#125;</option>
                            <option value="type">type Name = &#123; &#125;</option>
                        </select>
                    </div>

                    {/* Array Style */}
                    <div className="space-y-1.5">
                        <label htmlFor={arrayStyleSelectId} className="text-xs font-bold text-slate-700 block">
                            Array Formatting
                        </label>
                        <select
                            id={arrayStyleSelectId}
                            value={options.arrayStyle}
                            onChange={(e) => setOptions((p) => ({ ...p, arrayStyle: e.target.value as ArrayStyle }))}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium outline-none"
                        >
                            <option value="bracket">Standard Bracket (T[])</option>
                            <option value="generic">Generic Style (Array&lt;T&gt;)</option>
                        </select>
                    </div>

                    {/* Optionality Mode */}
                    <div className="space-y-1.5">
                        <label htmlFor={optionalitySelectId} className="text-xs font-bold text-slate-700 block">
                            Field Optionality Mode
                        </label>
                        <select
                            id={optionalitySelectId}
                            value={options.optionalityMode}
                            onChange={(e) => setOptions((p) => ({ ...p, optionalityMode: e.target.value as OptionalityMode }))}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium outline-none"
                        >
                            <option value="inferred">Inferred (Optional if Missing)</option>
                            <option value="all-required">Strict (All Required)</option>
                            <option value="all-optional">Permissive (All Optional ?)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.exportKeywords}
                            onChange={(e) => setOptions((p) => ({ ...p, exportKeywords: e.target.checked }))}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        Prepend &apos;export&apos; Keyword
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.readonlyProps}
                            onChange={(e) => setOptions((p) => ({ ...p, readonlyProps: e.target.checked }))}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        Mark Properties &apos;readonly&apos;
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.detectDates}
                            onChange={(e) => setOptions((p) => ({ ...p, detectDates: e.target.checked }))}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        Detect Date Timestamps
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.includeJsDoc}
                            onChange={(e) => setOptions((p) => ({ ...p, includeJsDoc: e.target.checked }))}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        Generate @example JSDoc
                    </label>
                </div>
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Raw Input JSON */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Braces className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                    Input Raw JSON Payload
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
                                    <span className="font-bold">Invalid JSON Syntax:</span>
                                    <p className="font-mono">{parseError}</p>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <textarea
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                placeholder="Paste your raw JSON payload here..."
                                rows={17}
                                className="w-full p-4 rounded-xl font-mono text-xs leading-relaxed bg-slate-900 text-emerald-400 border border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[320px] max-h-[620px] overflow-auto"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <Boxes className="w-4 h-4 text-slate-400" />
                            Client-Side Native AST Engine
                        </span>
                        <span className="font-mono text-slate-600">
                            {rawJson.length.toLocaleString()} characters
                        </span>
                    </div>
                </div>

                {/* Right Panel: TypeScript Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <FileCode2 className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                    TypeScript Interfaces & Types
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    disabled={!generatedCode}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 disabled:opacity-50 cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                    .ts
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    disabled={!generatedCode}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                                    {copied ? "Copied" : "Copy TypeScript"}
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <pre className="p-4 rounded-xl font-mono text-xs leading-relaxed bg-slate-950 text-indigo-300 border border-slate-900 min-h-[320px] max-h-[620px] overflow-auto select-all">
                                {generatedCode || (parseError ? "// Fix JSON parse error above to inspect TypeScript interfaces." : "// TypeScript definitions will appear here.")}
                            </pre>
                        </div>

                        {/* Structural Diagnostics Bar */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium block">Types Generated</span>
                                <span className="font-mono text-xs font-bold text-slate-800">{stats.interfacesGenerated}</span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium block">Properties Typed</span>
                                <span className="font-mono text-xs font-bold text-indigo-600">{stats.fieldsCount}</span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium block">Object Depth</span>
                                <span className="font-mono text-xs font-bold text-emerald-600">{stats.depth} Levels</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            TypeScript 5.x Strict Mode Compatible
                        </span>
                        <span className="text-slate-400">Zero Server Roundtrips</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Overview */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Why Converting JSON to TypeScript Interfaces Accelerates Full-Stack Engineering
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern full-stack web applications interact continuously with third-party webhooks, microservices, and external REST APIs. However, unvalidated dynamic JSON data leaves web clients vulnerable to runtime exceptions such as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-xs">Cannot read properties of undefined (reading &apos;map&apos;)</code>. Manually typing hundreds of JSON attributes is tedious and error-prone. Converting real payload samples directly into robust TypeScript interfaces bridges rapid prototyping and enterprise type safety.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <FileCheck className="w-4 h-4 text-indigo-600" /> End-to-End Type Safety
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Provides static compile-time contracts that instantly surface typos, missing properties, and invalid data access across client components and backend workers.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Rich IDE Autocompletion
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Generates comprehensive IntelliSense with inline documentation and JSDoc @example tags so your engineering team can inspect API parameters directly in VS Code.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Decomposed Sub-Interfaces
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Automatically separates nested objects into modular, reusable types, eliminating messy inline declarations and simplifying unit test mock definitions.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Interface vs Type Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            TypeScript Interface vs Type Alias: When to Choose Which
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        TypeScript offers two primary primitives for structuring object definitions: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">interface</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">type</code>. Understanding their compiler mechanics ensures your project maintains scalable, idiomatic architecture:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Architectural Attribute</th>
                                    <th className="p-3">TypeScript Interface</th>
                                    <th className="p-3">TypeScript Type Alias</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Declaration Merging</td>
                                    <td className="p-3 text-emerald-600 font-bold">Supported (Native)</td>
                                    <td className="p-3 text-rose-600 font-semibold">Unsupported (Duplicate Identifier Error)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Union & Primitive Mapping</td>
                                    <td className="p-3 text-rose-600 font-semibold">Cannot model bare unions</td>
                                    <td className="p-3 text-emerald-600 font-bold">Supported (type Status = &apos;idle&apos; | &apos;loading&apos;)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Inheritance Syntax</td>
                                    <td className="p-3 font-mono text-indigo-600">interface Admin extends User</td>
                                    <td className="p-3 font-mono text-indigo-600">type Admin = User &amp; &#123; role: string &#125;</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Compiler Caching Performance</td>
                                    <td className="p-3 text-emerald-600 font-bold">Optimized (Flat object map caching)</td>
                                    <td className="p-3 text-slate-600">Slightly more intensive for deep intersections</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Best Practice Application</td>
                                    <td className="p-3 font-semibold text-slate-900">API Payloads, Component Props, SDK Contracts</td>
                                    <td className="p-3 font-semibold text-slate-900">Complex State Machines, Generics, Utility Types</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Enterprise Validation Patterns */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <TerminalSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Patterns: Bridging TypeScript Interfaces with Runtime Zod Schemas
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        TypeScript interfaces exist only at compile time and are completely erased during production JavaScript execution. When receiving dynamic data over the wire via <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">fetch()</code> or server actions, pair your static types with runtime assertion schemas to protect your backend services:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
                            <h3 className="text-xs font-bold text-indigo-400 font-mono uppercase">1. Type Assertion (Zero Runtime Overhead)</h3>
                            <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed">
                                {`import type { RootObject } from "./types";

export async function fetchUserSession(): Promise<RootObject> {
  const response = await fetch("https://api.domain.com/v1/session", {
    headers: { Authorization: "Bearer token" },
  });

  if (!response.ok) {
    throw new Error("Failed to load user session");
  }

  // Pure static casting (trusting upstream provider)
  return (await response.json()) as RootObject;
}`}
                            </pre>
                        </div>

                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
                            <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase">2. Runtime Zod Schema Guard</h3>
                            <pre className="text-[11px] font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                                {`import { z } from "zod";

export const UserSessionSchema = z.object({
  userId: z.string(),
  username: z.string(),
  email: z.string().email(),
  isActive: z.boolean(),
  roles: z.array(z.string()),
});

export type UserSession = z.infer<typeof UserSessionSchema>;

export async function getValidatedSession(rawPayload: unknown): Promise<UserSession> {
  // Throws ZodError if payload deviates from contract
  return UserSessionSchema.parse(rawPayload);
}`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 4: FAQ Section */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between TypeScript interface and type alias?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An interface creates an extendable object shape capable of declaration merging, whereas a type alias allows modeling primitive unions, intersections, tuples, and mapped types directly. For raw object payload modeling, both work seamlessly, with interfaces generally providing faster TypeScript compiler type-checking in massive enterprise codebases.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the converter handle inconsistent object fields in JSON arrays?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The engine examines every item in the JSON array to construct a unified field union. If a property is present in some items but absent in others, the generator automatically marks that field as optional with a question mark (?) in the resulting TypeScript interface.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can this tool parse Date strings into actual TypeScript Date types?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. When the Detect Dates toggle is active, standard ISO 8601 timestamps and date strings are typed as &apos;Date | string&apos;. This accounts for the fact that JSON.parse preserves raw strings unless explicitly converted via a client-side date reviver.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my sensitive JSON payload transmitted to external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The entire AST parser, tokenization, type inference, and code synthesis run 100% client-side inside your browser sandbox via local JavaScript execution. Zero telemetry, cookies, or API packets are dispatched.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How should I structure TypeScript definitions for large nested REST APIs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The recommended approach is to decompose nested JSON objects into individual named sub-interfaces rather than inline types. This modularity improves reusability, simplifies automated mock generation, and makes unit testing easier across React components and Next.js server actions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I safely parse unknown incoming JSON into these generated TypeScript types?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Use runtime validation libraries such as Zod, Valibot, or ArkType to validate unknown JSON strings at the runtime boundary, or pair generated TypeScript interfaces with type assertion functions like <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">const data = (await res.json()) as UserSession;</code>.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}