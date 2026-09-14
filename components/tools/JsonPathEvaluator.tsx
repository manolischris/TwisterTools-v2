"use client";

import React, { useState, useMemo, useId, useEffect } from "react";
import { JSONPath } from "jsonpath-plus";
import {
    Code2,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Search,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    FileJson,
    Layers,
    Terminal,
    Filter,
    ListTree,
    Trash2,
    ExternalLink,
    Zap,
    Maximize2,
    Braces
} from "lucide-react";

type SampleKey = "store" | "users" | "nestedLogistics";

const SAMPLE_PAYLOADS: Record<SampleKey, { name: string; query: string; json: string }> = {
    store: {
        name: "Bookstore Catalog",
        query: "$.store.book[?(@.price < 10)].title",
        json: JSON.stringify(
            {
                store: {
                    book: [
                        {
                            category: "reference",
                            author: "Nigel Rees",
                            title: "Sayings of the Century",
                            price: 8.95,
                            inStock: true
                        },
                        {
                            category: "fiction",
                            author: "Evelyn Waugh",
                            title: "Sword of Honour",
                            price: 12.99,
                            inStock: false
                        },
                        {
                            category: "fiction",
                            author: "Herman Melville",
                            title: "Moby Dick",
                            isbn: "0-553-21311-3",
                            price: 8.99,
                            inStock: true
                        },
                        {
                            category: "fiction",
                            author: "J. R. R. Tolkien",
                            title: "The Lord of the Rings",
                            isbn: "0-395-19395-8",
                            price: 22.99,
                            inStock: true
                        }
                    ],
                    bicycle: {
                        color: "red",
                        price: 19.95
                    }
                }
            },
            null,
            2
        )
    },
    users: {
        name: "E-Commerce User Accounts",
        query: "$..users[?(@.membership == 'premium')].email",
        json: JSON.stringify(
            {
                status: "success",
                timestamp: "2026-09-14T10:00:00Z",
                users: [
                    {
                        id: 101,
                        name: "Alice Montgomery",
                        email: "alice@example.com",
                        membership: "premium",
                        roles: ["admin", "editor"],
                        orders: [
                            { orderId: "ORD-991", total: 142.5 },
                            { orderId: "ORD-998", total: 49.0 }
                        ]
                    },
                    {
                        id: 102,
                        name: "David Vance",
                        email: "david@example.com",
                        membership: "standard",
                        roles: ["viewer"],
                        orders: []
                    },
                    {
                        id: 103,
                        name: "Elena Rostova",
                        email: "elena@example.com",
                        membership: "premium",
                        roles: ["editor"],
                        orders: [{ orderId: "ORD-1014", total: 320.0 }]
                    }
                ]
            },
            null,
            2
        )
    },
    nestedLogistics: {
        name: "Cloud Infrastructure Nodes",
        query: "$..nodes[?(@.metrics.cpuUsage > 75)].id",
        json: JSON.stringify(
            {
                datacenter: "us-east-cluster-04",
                regions: [
                    {
                        name: "us-east-1a",
                        nodes: [
                            { id: "node-alpha", status: "active", metrics: { cpuUsage: 88.4, memMb: 16384 } },
                            { id: "node-bravo", status: "active", metrics: { cpuUsage: 42.1, memMb: 8192 } }
                        ]
                    },
                    {
                        name: "us-east-1b",
                        nodes: [
                            { id: "node-charlie", status: "degraded", metrics: { cpuUsage: 94.6, memMb: 32768 } },
                            { id: "node-delta", status: "active", metrics: { cpuUsage: 12.0, memMb: 4096 } }
                        ]
                    }
                ]
            },
            null,
            2
        )
    }
};

const CHEATSHEET_EXAMPLES = [
    { label: "Root Object", expr: "$", desc: "Selects the root JSON object or array." },
    { label: "Recursive Scan", expr: "$..author", desc: "Recursively searches all 'author' properties across all depths." },
    { label: "Array Slicing", expr: "$.store.book[0:2]", desc: "Extracts elements from index 0 up to (not including) 2." },
    { label: "Last Element", expr: "$.store.book[-1:]", desc: "Extracts the final element of an array." },
    { label: "Filter by Property", expr: "$..book[?(@.isbn)]", desc: "Selects all books that have an 'isbn' property." },
    { label: "Numeric Comparison", expr: "$..book[?(@.price < 10)]", desc: "Matches entities where the price field is under 10." },
    { label: "Wildcard Child", expr: "$.store.book[*].title", desc: "Returns the title property of every item in the book array." }
];

export default function JsonPathEvaluator() {
    const [jsonInput, setJsonInput] = useState<string>(SAMPLE_PAYLOADS.store.json);
    const [pathQuery, setPathQuery] = useState<string>(SAMPLE_PAYLOADS.store.query);
    const [evalMode, setEvalMode] = useState<"value" | "paths">("value");
    const [copiedResult, setCopiedResult] = useState<boolean>(false);
    const [copiedPath, setCopiedPath] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState<boolean>(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const jsonTextareaId = useId();
    const queryInputId = useId();

    // Parse and evaluate JSONPath client-side
    const queryEvaluation = useMemo(() => {
        if (!jsonInput.trim()) {
            return {
                validJson: false,
                parsedJson: null,
                jsonError: null,
                results: [],
                paths: [],
                count: 0,
                evalError: null,
                executionTimeMs: 0
            };
        }

        let parsedJson: any = null;
        try {
            parsedJson = JSON.parse(jsonInput);
        } catch (err: any) {
            return {
                validJson: false,
                parsedJson: null,
                jsonError: err.message || "Invalid JSON syntax",
                results: [],
                paths: [],
                count: 0,
                evalError: null,
                executionTimeMs: 0
            };
        }

        if (!pathQuery.trim()) {
            return {
                validJson: true,
                parsedJson,
                jsonError: null,
                results: [],
                paths: [],
                count: 0,
                evalError: null,
                executionTimeMs: 0
            };
        }

        const startTime = performance.now();
        try {
            const rawResults = JSONPath({ path: pathQuery.trim(), json: parsedJson, resultType: "value" });
            const rawPaths = JSONPath({ path: pathQuery.trim(), json: parsedJson, resultType: "path" });
            const endTime = performance.now();

            return {
                validJson: true,
                parsedJson,
                jsonError: null,
                results: rawResults,
                paths: rawPaths,
                count: rawResults.length,
                evalError: null,
                executionTimeMs: Math.round((endTime - startTime) * 100) / 100
            };
        } catch (err: any) {
            const endTime = performance.now();
            return {
                validJson: true,
                parsedJson,
                jsonError: null,
                results: [],
                paths: [],
                count: 0,
                evalError: err.message || "Invalid JSONPath syntax",
                executionTimeMs: Math.round((endTime - startTime) * 100) / 100
            };
        }
    }, [jsonInput, pathQuery]);

    // Format output result for display
    const formattedResultText = useMemo(() => {
        if (queryEvaluation.jsonError) {
            return `// JSON Syntax Error:\n${queryEvaluation.jsonError}`;
        }
        if (queryEvaluation.evalError) {
            return `// JSONPath Evaluation Error:\n${queryEvaluation.evalError}`;
        }
        if (!pathQuery.trim()) {
            return "// Please enter a valid JSONPath expression above (e.g. $.store.book[*].title)";
        }
        if (queryEvaluation.count === 0) {
            return "// Expression executed successfully, but matched 0 nodes.";
        }

        if (evalMode === "paths") {
            return JSON.stringify(queryEvaluation.paths, null, 2);
        }
        return JSON.stringify(queryEvaluation.results, null, 2);
    }, [queryEvaluation, evalMode, pathQuery]);

    const handleCopyResult = () => {
        if (!formattedResultText) return;
        navigator.clipboard.writeText(formattedResultText);
        setCopiedResult(true);
        setTimeout(() => setCopiedResult(false), 2000);
    };

    const handleCopySnippet = (expr: string) => {
        navigator.clipboard.writeText(expr);
        setCopiedPath(expr);
        setTimeout(() => setCopiedPath(null), 1500);
    };

    const handleLoadSample = (key: SampleKey) => {
        setJsonInput(SAMPLE_PAYLOADS[key].json);
        setPathQuery(SAMPLE_PAYLOADS[key].query);
    };

    const handleBeautifyJson = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setJsonInput(JSON.stringify(parsed, null, 2));
        } catch {
            // Keep unchanged if invalid
        }
    };

    const handleMinifyJson = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            setJsonInput(JSON.stringify(parsed));
        } catch {
            // Keep unchanged if invalid
        }
    };

    const handleClear = () => {
        setJsonInput("");
        setPathQuery("$");
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "JSONPath Expression Evaluator & Query Sandbox",
        "url": "https://twistertools.com/tools/developer-tools/jsonpath-evaluator",
        "description": "Interactive browser-native JSONPath evaluator, query debugger, and syntax tester. Filter deeply nested JSON payloads, slice arrays, evaluate boolean expressions, and export matches instantly.",
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
                "name": "What is JSONPath and how does it relate to XPath?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "JSONPath was designed by Stefan Goessner in 2007 as an equivalent to XPath for JSON structures. Just as XPath provides a declarative notation to query XML document trees, JSONPath enables developers to traverse, slice, and filter nodes, properties, and values across nested JSON hierarchies without writing procedural loops."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between dot notation and bracket notation in JSONPath?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Dot notation (such as $.store.book) provides clean readability for standard alphanumeric property keys. Bracket notation (such as $['store']['book'] or $[*]) is required when object property names contain special characters, hyphens, spaces, or dots, or when accessing dynamic indices and array filters."
                }
            },
            {
                "@type": "Question",
                "name": "How does array slicing work in JSONPath (e.g., [start:end:step])?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Array slicing adopts Python-style index boundaries [start:end:step]. For example, [0:2] selects elements at index 0 and 1, stopping before index 2. Negative numbers count from the end of the array, meaning [-1:] extracts the last element, and [::2] extracts every alternate item."
                }
            },
            {
                "@type": "Question",
                "name": "Is my proprietary or confidential JSON uploaded to your servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools operates completely client-side inside your browser sandbox. Your JSON payloads and query strings are never transmitted to any external backend, API, or third-party database, making it 100% compliant with enterprise data confidentiality and GDPR requirements."
                }
            },
            {
                "@type": "Question",
                "name": "What does the recursive descent operator (..) do?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The recursive descent operator (..) navigates through all descendant levels of a JSON tree regardless of nesting depth. For example, $..author inspects every object in the hierarchy and compiles an array of every author property discovered anywhere in the document."
                }
            },
            {
                "@type": "Question",
                "name": "How do filter expressions with the @ symbol work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Filter expressions use the syntax [?(@.condition)], where the @ symbol denotes the current node being evaluated in the array or object iteration. For instance, $[?(@.price < 20)] tests each item's price property and only yields elements meeting that Boolean predicate."
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

            {/* Top Interactive Query Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <label htmlFor={queryInputId} className="text-sm font-bold text-slate-900 dark:text-white">
                            JSONPath Query Expression
                        </label>
                    </div>

                    {/* Quick Samples Selector */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs text-slate-600 dark:text-slate-300 mr-1 hidden md:inline">
                            Presets:
                        </span>
                        <button
                            type="button"
                            onClick={() => handleLoadSample("store")}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer shrink-0"
                        >
                            Bookstore
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLoadSample("users")}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer shrink-0"
                        >
                            Accounts
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLoadSample("nestedLogistics")}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer shrink-0"
                        >
                            Cluster Nodes
                        </button>
                    </div>
                </div>

                {/* Input Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-600 dark:text-indigo-400 font-mono font-bold text-sm">
                        λ
                    </div>
                    <input
                        id={queryInputId}
                        type="text"
                        aria-label="JSONPath query expression string"
                        value={pathQuery}
                        onChange={(e) => setPathQuery(e.target.value)}
                        placeholder="e.g. $.store.book[?(@.price < 10)].title"
                        className="w-full pl-9 pr-24 py-2.5 sm:py-3 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                        {pathQuery && (
                            <button
                                type="button"
                                onClick={() => setPathQuery("$")}
                                aria-label="Reset JSONPath Query"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                title="Reset to root ($)"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Query Syntax Cheat Tags */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none text-xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0 uppercase tracking-wider">
                        Quick Syntax:
                    </span>
                    {CHEATSHEET_EXAMPLES.slice(0, 5).map((item) => (
                        <button
                            key={item.expr}
                            type="button"
                            onClick={() => setPathQuery(item.expr)}
                            className="px-2 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer shrink-0 text-[11px]"
                        >
                            {item.expr}
                        </button>
                    ))}
                </div>
            </div>

            {/* 12-Column Responsive Workspace Grid (6/6 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: JSON Input Source (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                JSON Source Document
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleBeautifyJson}
                                aria-label="Format and beautify JSON"
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                title="Prettify formatting"
                            >
                                Prettify
                            </button>
                            <button
                                type="button"
                                onClick={handleMinifyJson}
                                aria-label="Minify JSON document"
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                title="Compress JSON into single line"
                            >
                                Compact
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                aria-label="Clear document contents"
                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Clear Editor"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Source Textarea */}
                    <div className="space-y-2">
                        <label htmlFor={jsonTextareaId} className="sr-only">
                            Raw JSON document input
                        </label>
                        <textarea
                            id={jsonTextareaId}
                            rows={18}
                            aria-label="Raw JSON payload editor"
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder="Paste your JSON payload here..."
                            spellCheck={false}
                            className="w-full p-4 font-mono text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[420px] shadow-inner"
                        />
                    </div>

                    {/* Source Document Diagnostic Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <div className="flex items-center gap-2">
                            {queryEvaluation.jsonError ? (
                                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Malformed JSON Syntax
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid JSON Structure
                                </span>
                            )}
                        </div>
                        <span className="text-slate-600 dark:text-slate-300 font-mono">
                            {jsonInput.length.toLocaleString()} bytes
                        </span>
                    </div>
                </div>

                {/* Right Panel: Query Results Sandbox (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Evaluation Results
                            </h2>
                        </div>

                        {/* View Modes */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setEvalMode("value")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${evalMode === "value"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                    }`}
                            >
                                Value Output
                            </button>
                            <button
                                type="button"
                                onClick={() => setEvalMode("paths")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${evalMode === "paths"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                    }`}
                            >
                                Normalized Paths
                            </button>
                        </div>
                    </div>

                    {/* Result Metrics Bar */}
                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                Matches
                            </span>
                            <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                {queryEvaluation.count}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                Duration
                            </span>
                            <p suppressHydrationWarning className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                {isMounted ? queryEvaluation.executionTimeMs : 0} ms
                            </p>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                Status
                            </span>
                            <p
                                className={`text-base font-bold font-mono truncate ${queryEvaluation.evalError || queryEvaluation.jsonError
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                    }`}
                            >
                                {queryEvaluation.jsonError
                                    ? "JSON Error"
                                    : queryEvaluation.evalError
                                        ? "Expr Error"
                                        : "OK"}
                            </p>
                        </div>
                    </div>

                    {/* Output Code Container */}
                    <div className="relative">
                        <pre className="w-full p-4 font-mono text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-auto min-h-[420px] max-h-[420px] leading-relaxed select-text shadow-inner">
                            <code>{formattedResultText}</code>
                        </pre>
                    </div>

                    {/* Copy Result Action Button */}
                    <button
                        type="button"
                        onClick={handleCopyResult}
                        disabled={!queryEvaluation.validJson || Boolean(queryEvaluation.evalError)}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copiedResult
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                    >
                        {copiedResult ? (
                            <>
                                <Check className="w-4 h-4 text-white" />
                                <span>Copied Result to Clipboard!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 text-white" />
                                <span>Copy Matches ({queryEvaluation.count})</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Interactive Syntax Helper / Cheat Sheet Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Braces className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Standard JSONPath Expression Reference & Syntax Snippets
                    </h3>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CHEATSHEET_EXAMPLES.map((item) => (
                        <div
                            key={item.expr}
                            className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {item.label}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopySnippet(item.expr)}
                                        className="text-[11px] text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 font-semibold transition cursor-pointer flex items-center gap-1"
                                    >
                                        {copiedPath === item.expr ? (
                                            <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                        <span>Copy</span>
                                    </button>
                                </div>
                                <code className="block font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 px-2 py-1 rounded-md mt-1 break-all">
                                    {item.expr}
                                </code>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Comprehensive Mechanics & Theory */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Mastering JSONPath: Query Mechanics, Slicing, and Tree Navigation
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        JSONPath provides an expressive, declarative query language specifically engineered to traverse, filter, and extract attributes from hierarchical JavaScript Object Notation structures. While traditional document querying in languages like Python or JavaScript mandates error-prone manual traversals, boundary checks, and nested loop iterations, JSONPath compresses complex structural parsing into a single string expression.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <ListTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Deep Hierarchical Traversal
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                The recursive descent operator (<code className="font-mono text-indigo-600 dark:text-indigo-400">..</code>) allows developers to bypass intermediate parents. Searching <code className="font-mono text-indigo-600 dark:text-indigo-400">$..price</code> scans every nested dictionary regardless of depth to aggregate values uniformly.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Contextual Predicate Filters
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Filter expressions enclosed in <code className="font-mono text-indigo-600 dark:text-indigo-400">[?()]</code> evaluate logical operations on the fly. The <code className="font-mono text-indigo-600 dark:text-indigo-400">@</code> symbol targets the current contextual object to inspect numeric values, strings, or boolean flags.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Client-Side Sandboxing
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Modern engineering workflows demand guaranteed confidentiality. TwisterTools executes all queries directly inside client V8 memory buffers, preventing payloads from ever leaving the local user session.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Operator Reference Specification
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Evaluate the foundational tokens defined by RFC 9535 and standard implementations:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`$                 : The root object or element.
@                 : The current element being evaluated inside a predicate filter.
. or []           : Child member operators (e.g. $.store or $['store']).
..                : Recursive descent (scans all sub-levels and descendants).
*                 : Wildcard match (selects all children or array items).
[start:end:step]  : Array slice syntax based on zero-indexed offsets.
[?()]             : Filter expression evaluating a boolean condition.`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Analysis (JSONPath vs Alternatives) */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Architecture: JSONPath vs. jq vs. XPath vs. JMESPath
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the correct query specification depends on runtime requirements, data transport schemas, and language ecosystem integration. Below is an engineering comparison of industry query primitives:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Query Specification</th>
                                    <th className="p-3">Primary Target Format</th>
                                    <th className="p-3">Syntax Style</th>
                                    <th className="p-3">CLI & CI/CD Portability</th>
                                    <th className="p-3">Primary Ecosystem Adoption</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">JSONPath (RFC 9535)</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">JSON</td>
                                    <td className="p-3">XPath-inspired (Dot/Bracket)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Universal (Native Libraries)</td>
                                    <td className="p-3 text-slate-800 dark:text-slate-200">Kubernetes, API Gateways, Postman</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">jq</td>
                                    <td className="p-3">JSON Streams</td>
                                    <td className="p-3">Functional Pipeline (| map)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Industry Standard CLI</td>
                                    <td className="p-3 text-slate-800 dark:text-slate-200">Bash Scripts, DevOps, Linux Systems</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">JMESPath</td>
                                    <td className="p-3">JSON</td>
                                    <td className="p-3">Declarative Projection</td>
                                    <td className="p-3">High (AWS Native)</td>
                                    <td className="p-3 text-slate-800 dark:text-slate-200">AWS CLI, Boto3, Azure CLI</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">XPath 3.1</td>
                                    <td className="p-3">XML / JSON Hybrid</td>
                                    <td className="p-3">Path Segments (/node)</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Complex Setup</td>
                                    <td className="p-3 text-slate-800 dark:text-slate-200">Legacy Enterprise, XSLT, WSDL APIs</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for Writing Efficient JSONPath Queries */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Engineering Best Practices: Performance and Precision
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Poorly structured JSONPath expressions can lead to unexpected type coercions, unhandled exceptions in integration microservices, and CPU spikes when processing large multi-megabyte payloads. Follow these architectural recommendations:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> High-Performance Patterns
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Prefer Explicit Paths Over Recursive Descent:</strong> Using <code className="font-mono text-indigo-600 dark:text-indigo-400">$.store.book[*].author</code> evaluates exponentially faster than <code className="font-mono text-indigo-600 dark:text-indigo-400">$..author</code> because the engine avoids traversing unrelated trees.
                                </li>
                                <li>
                                    • <strong>Validate Attribute Presence First:</strong> When filtering on dynamic schemas, use existence checks like <code className="font-mono text-indigo-600 dark:text-indigo-400">[?(@.isbn)]</code> to bypass missing keys cleanly.
                                </li>
                                <li>
                                    • <strong>Always Use Quotes for Special Keys:</strong> If a key contains hyphens, spaces, or dots (e.g. <code className="font-mono text-indigo-600 dark:text-indigo-400">Content-Type</code>), wrap it inside bracket notation: <code className="font-mono text-indigo-600 dark:text-indigo-400">$['headers']['Content-Type']</code>.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Query Pitfalls
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Assuming a Single Return Value:</strong> JSONPath always yields an array of matches, even if only one match is found. Client applications must unpack index zero safely.
                                </li>
                                <li>
                                    • <strong>Type Confusion in Comparisons:</strong> In expressions like <code className="font-mono text-indigo-600 dark:text-indigo-400">[?(@.age &gt; &apos;21&apos;)]</code>, string comparisons can lead to unintended lexicographical sorting bugs instead of numeric inequality.
                                </li>
                                <li>
                                    • <strong>Overlooking Whitespace in Payloads:</strong> Verify whether properties contain leading or trailing spaces before writing strict key lookups.
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
                                What is JSONPath and how does it relate to XPath?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                JSONPath was designed by Stefan Goessner in 2007 as an equivalent to XPath for JSON structures. Just as XPath provides a declarative notation to query XML document trees, JSONPath enables developers to traverse, slice, and filter nodes, properties, and values across nested JSON hierarchies without writing procedural loops.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between dot notation and bracket notation in JSONPath?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Dot notation (such as <code className="font-mono text-indigo-600 dark:text-indigo-400">$.store.book</code>) provides clean readability for standard alphanumeric property keys. Bracket notation (such as <code className="font-mono text-indigo-600 dark:text-indigo-400">$[&apos;store&apos;][&apos;book&apos;]</code> or <code className="font-mono text-indigo-600 dark:text-indigo-400">$[*]</code>) is required when object property names contain special characters, hyphens, spaces, or dots, or when accessing dynamic indices and array filters.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does array slicing work in JSONPath (e.g., [start:end:step])?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Array slicing adopts Python-style index boundaries <code className="font-mono text-indigo-600 dark:text-indigo-400">[start:end:step]</code>. For example, <code className="font-mono text-indigo-600 dark:text-indigo-400">[0:2]</code> selects elements at index 0 and 1, stopping before index 2. Negative numbers count from the end of the array, meaning <code className="font-mono text-indigo-600 dark:text-indigo-400">[-1:]</code> extracts the last element, and <code className="font-mono text-indigo-600 dark:text-indigo-400">[::2]</code> extracts every alternate item.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Is my proprietary or confidential JSON uploaded to your servers?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. TwisterTools operates completely client-side inside your browser sandbox. Your JSON payloads and query strings are never transmitted to any external backend, API, or third-party database, making it 100% compliant with enterprise data confidentiality and GDPR requirements.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What does the recursive descent operator (..) do?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The recursive descent operator (<code className="font-mono text-indigo-600 dark:text-indigo-400">..</code>) navigates through all descendant levels of a JSON tree regardless of nesting depth. For example, <code className="font-mono text-indigo-600 dark:text-indigo-400">$..author</code> inspects every object in the hierarchy and compiles an array of every author property discovered anywhere in the document.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do filter expressions with the @ symbol work?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Filter expressions use the syntax <code className="font-mono text-indigo-600 dark:text-indigo-400">[?(@.condition)]</code>, where the <code className="font-mono text-indigo-600 dark:text-indigo-400">@</code> symbol denotes the current node being evaluated in the array or object iteration. For instance, <code className="font-mono text-indigo-600 dark:text-indigo-400">$[?(@.price &lt; 20)]</code> tests each item&apos;s price property and only yields elements meeting that Boolean predicate.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}