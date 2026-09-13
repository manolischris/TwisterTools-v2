"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Database,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Terminal,
    Code,
    Settings,
    FileText,
    ArrowRightLeft,
    ListFilter,
    ShieldCheck,
    Download,
    Play
} from "lucide-react";

type Dialect = "postgres" | "mysql" | "sqlite" | "mssql" | "oracle";
type ParamFormat = "auto" | "named_colon" | "named_at" | "positional_question" | "positional_numbered" | "spring_jpa";
type ParamInputMode = "key_value" | "json" | "comma_list";

interface KeyValuePair {
    id: string;
    key: string;
    value: string;
    type: "string" | "number" | "boolean" | "null" | "raw";
}

const SAMPLE_DATA = {
    named: {
        sql: `SELECT u.id, u.username, u.email, u.status, p.plan_name, p.expires_at\nFROM users u\nJOIN user_plans up ON up.user_id = u.id\nJOIN plans p ON p.id = up.plan_id\nWHERE u.status = :status\n  AND u.signup_date >= :startDate\n  AND up.is_active = :isActive\n  AND p.tier_level > :minTier\nORDER BY u.created_at DESC\nLIMIT :limit OFFSET :offset;`,
        json: `{\n  ":status": "ACTIVE",\n  ":startDate": "2024-01-01 00:00:00",\n  ":isActive": true,\n  ":minTier": 2,\n  ":limit": 50,\n  ":offset": 0\n}`,
        dialect: "postgres" as Dialect,
        paramFormat: "named_colon" as ParamFormat
    },
    postgres_numbered: {
        sql: `UPDATE customer_orders\nSET fulfillment_status = $1,\n    processed_by = $2,\n    shipped_at = $3,\n    notes = $4\nWHERE order_id = $5\n  AND tenant_id = $6\n  AND is_locked = $7\nRETURNING order_id, total_cents, fulfillment_status;`,
        json: `[\n  "DISPATCHED",\n  "admin_svc_09",\n  "2024-03-15T14:30:00Z",\n  "Express courier route B4",\n  94821,\n  "tenant_corp_global",\n  false\n]`,
        dialect: "postgres" as Dialect,
        paramFormat: "positional_numbered" as ParamFormat
    },
    spring_jpa: {
        sql: `SELECT e.id, e.employee_code, e.department, e.salary, e.hire_date\nFROM employees e\nWHERE e.department = ?1\n  AND e.salary BETWEEN ?2 AND ?3\n  AND e.is_terminated = ?4\nORDER BY e.salary DESC;`,
        json: `{\n  "?1": "Engineering",\n  "?2": 75000,\n  "?3": 160000,\n  "?4": false\n}`,
        dialect: "postgres" as Dialect,
        paramFormat: "spring_jpa" as ParamFormat
    },
    positional_question: {
        sql: `INSERT INTO audit_logs (event_type, user_id, ip_address, metadata, execution_ms, is_flagged)\nVALUES (?, ?, ?, ?, ?, ?);`,
        json: `[\n  "AUTH_LOGIN_SUCCESS",\n  10492,\n  "192.168.1.105",\n  "{\\"mfa_verified\\": true, \\"device\\": \\"macOS\\"}",\n  42.5,\n  false\n]`,
        dialect: "mysql" as Dialect,
        paramFormat: "positional_question" as ParamFormat
    }
};

export default function SqlQueryParameterReplacer() {
    const [rawSql, setRawSql] = useState<string>(SAMPLE_DATA.named.sql);
    const [paramInputMode, setParamInputMode] = useState<ParamInputMode>("json");
    const [jsonParams, setJsonParams] = useState<string>(SAMPLE_DATA.named.json);
    const [commaParams, setCommaParams] = useState<string>("'ACTIVE', '2024-01-01', true, 2, 50, 0");
    const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([
        { id: "1", key: ":status", value: "ACTIVE", type: "string" },
        { id: "2", key: ":startDate", value: "2024-01-01", type: "string" },
        { id: "3", key: ":isActive", value: "true", type: "boolean" },
        { id: "4", key: ":minTier", value: "2", type: "number" },
        { id: "5", key: ":limit", value: "50", type: "number" },
        { id: "6", key: ":offset", value: "0", type: "number" }
    ]);
    const [dialect, setDialect] = useState<Dialect>("postgres");
    const [paramFormat, setParamFormat] = useState<ParamFormat>("named_colon");
    const [nullLiteral, setNullLiteral] = useState<string>("NULL");
    const [booleanFormat, setBooleanFormat] = useState<"true_false" | "1_0">("true_false");
    const [dateFormat, setDateFormat] = useState<"iso_quotes" | "postgres_timestamp" | "oracle_to_date">("iso_quotes");
    const [copied, setCopied] = useState<boolean>(false);
    const [formatSqlOutput, setFormatSqlOutput] = useState<boolean>(true);

    const sqlInputId = useId();
    const jsonInputId = useId();
    const commaInputId = useId();
    const dialectSelectId = useId();
    const paramFormatSelectId = useId();

    // Helper: Escape SQL string based on dialect
    const escapeSqlString = (str: string, targetDialect: Dialect): string => {
        if (targetDialect === "mysql") {
            return "'" + str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
                switch (char) {
                    case "\0": return "\\0";
                    case "\x08": return "\\b";
                    case "\x09": return "\\t";
                    case "\x1a": return "\\z";
                    case "\n": return "\\n";
                    case "\r": return "\\r";
                    case "\"":
                    case "'":
                    case "\\":
                        return "\\" + char;
                    default: return char;
                }
            }) + "'";
        }
        // Standard SQL ANSI single quote doubling
        return "'" + str.replace(/'/g, "''") + "'";
    };

    // Helper: Format raw JavaScript value to SQL literal
    const formatValueToSql = (val: unknown, targetDialect: Dialect): string => {
        if (val === null || val === undefined) {
            return nullLiteral;
        }
        if (typeof val === "boolean") {
            if (booleanFormat === "1_0" || targetDialect === "oracle") {
                return val ? "1" : "0";
            }
            return val ? "TRUE" : "FALSE";
        }
        if (typeof val === "number") {
            return Number.isFinite(val) ? val.toString() : nullLiteral;
        }
        if (typeof val === "object") {
            // Nested JSON object or array: serialize to escaped string
            return escapeSqlString(JSON.stringify(val), targetDialect);
        }

        const stringVal = String(val);

        // Check if string is explicitly "null" case-insensitive
        if (stringVal.trim().toLowerCase() === "null") {
            return nullLiteral;
        }

        // Date heuristics
        if (/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(stringVal.trim())) {
            if (dateFormat === "postgres_timestamp") {
                return `TIMESTAMPTZ '${stringVal.trim()}'`;
            }
            if (dateFormat === "oracle_to_date") {
                return `TO_TIMESTAMP('${stringVal.trim()}', 'YYYY-MM-DD"T"HH24:MI:SS.FFTZH:TZM')`;
            }
            return escapeSqlString(stringVal, targetDialect);
        }

        return escapeSqlString(stringVal, targetDialect);
    };

    // Parse parameters depending on input mode
    const parsedParameters = useMemo<{
        isObject: boolean;
        dictionary: Record<string, unknown>;
        array: unknown[];
        parseError: string | null;
    }>(() => {
        if (paramInputMode === "json") {
            try {
                const parsed = JSON.parse(jsonParams);
                if (Array.isArray(parsed)) {
                    return { isObject: false, dictionary: {}, array: parsed, parseError: null };
                } else if (parsed && typeof parsed === "object") {
                    return { isObject: true, dictionary: parsed as Record<string, unknown>, array: [], parseError: null };
                } else {
                    return { isObject: false, dictionary: {}, array: [parsed], parseError: null };
                }
            } catch (err: unknown) {
                return {
                    isObject: false,
                    dictionary: {},
                    array: [],
                    parseError: err instanceof Error ? err.message : "Invalid JSON syntax"
                };
            }
        }

        if (paramInputMode === "comma_list") {
            try {
                // Parse CSV-like input, handling strings, numbers, booleans
                const tokens: unknown[] = [];
                const regex = /(?:'((?:[^']|'')*)'|"((?:[^"\\]|\\.)*)"|([^,]+))(?:,|$)/g;
                let match: RegExpExecArray | null;
                const trimmed = commaParams.trim();
                if (!trimmed) {
                    return { isObject: false, dictionary: {}, array: [], parseError: null };
                }

                while ((match = regex.exec(trimmed)) !== null) {
                    if (match[1] !== undefined) {
                        // Single quoted string
                        tokens.push(match[1].replace(/''/g, "'"));
                    } else if (match[2] !== undefined) {
                        // Double quoted string
                        tokens.push(match[2].replace(/\\"/g, '"'));
                    } else if (match[3] !== undefined) {
                        const rawToken = match[3].trim();
                        if (rawToken.toLowerCase() === "null") tokens.push(null);
                        else if (rawToken.toLowerCase() === "true") tokens.push(true);
                        else if (rawToken.toLowerCase() === "false") tokens.push(false);
                        else if (!isNaN(Number(rawToken)) && rawToken !== "") tokens.push(Number(rawToken));
                        else tokens.push(rawToken);
                    }
                    if (regex.lastIndex === 0) break; // Avoid infinite loop
                }

                return { isObject: false, dictionary: {}, array: tokens, parseError: null };
            } catch (err: unknown) {
                return {
                    isObject: false,
                    dictionary: {},
                    array: [],
                    parseError: err instanceof Error ? err.message : "Failed to parse comma list"
                };
            }
        }

        // Key Value Pairs Mode
        const dict: Record<string, unknown> = {};
        for (const pair of keyValuePairs) {
            if (!pair.key.trim()) continue;
            let val: unknown = pair.value;
            if (pair.type === "number") {
                val = isNaN(Number(pair.value)) ? 0 : Number(pair.value);
            } else if (pair.type === "boolean") {
                val = pair.value.trim().toLowerCase() === "true";
            } else if (pair.type === "null") {
                val = null;
            } else if (pair.type === "raw") {
                val = pair.value;
            }
            dict[pair.key.trim()] = val;
        }

        return { isObject: true, dictionary: dict, array: Object.values(dict), parseError: null };
    }, [paramInputMode, jsonParams, commaParams, keyValuePairs]);

    // SQL Replacer Logic
    const { interpolatedSql, replacementStats, warnings } = useMemo(() => {
        const warningsList: string[] = [];
        let replacedCount = 0;
        let output = rawSql;

        if (!rawSql.trim()) {
            return { interpolatedSql: "", replacementStats: { total: 0, matched: 0, unmatched: 0 }, warnings: [] };
        }

        if (parsedParameters.parseError) {
            return {
                interpolatedSql: rawSql,
                replacementStats: { total: 0, matched: 0, unmatched: 0 },
                warnings: [`Parameter error: ${parsedParameters.parseError}`]
            };
        }

        // 1. Array-based substitution (Positional)
        if (!parsedParameters.isObject) {
            const arr = parsedParameters.array;

            if (paramFormat === "positional_numbered") {
                // Matches $1, $2, or :1, :2
                output = output.replace(/([$:]\d+)/g, (match) => {
                    const idx = parseInt(match.substring(1), 10) - 1; // 1-based indexing
                    if (idx >= 0 && idx < arr.length) {
                        replacedCount++;
                        return formatValueToSql(arr[idx], dialect);
                    }
                    warningsList.push(`Unmatched parameter placeholder: ${match}`);
                    return match;
                });
            } else if (paramFormat === "spring_jpa") {
                // Matches ?1, ?2, ?3
                output = output.replace(/(\?\d+)/g, (match) => {
                    const idx = parseInt(match.substring(1), 10) - 1;
                    if (idx >= 0 && idx < arr.length) {
                        replacedCount++;
                        return formatValueToSql(arr[idx], dialect);
                    }
                    warningsList.push(`Unmatched parameter placeholder: ${match}`);
                    return match;
                });
            } else {
                // Standard anonymous question mark substitution: ?
                let questionIndex = 0;
                // Avoid matching inside literal strings
                let inString = false;
                let stringChar = "";
                let result = "";

                for (let i = 0; i < output.length; i++) {
                    const char = output[i];
                    if ((char === "'" || char === '"') && (i === 0 || output[i - 1] !== "\\")) {
                        if (!inString) {
                            inString = true;
                            stringChar = char;
                        } else if (stringChar === char) {
                            // Check for doubled quote escape
                            if (output[i + 1] === char) {
                                result += char;
                                i++;
                            } else {
                                inString = false;
                            }
                        }
                        result += char;
                    } else if (char === "?" && !inString) {
                        // Ensure it's not part of a numbered placeholder like ?1
                        const nextChar = output[i + 1];
                        if (nextChar && /\d/.test(nextChar)) {
                            result += char;
                        } else {
                            if (questionIndex < arr.length) {
                                result += formatValueToSql(arr[questionIndex], dialect);
                                replacedCount++;
                            } else {
                                result += "?";
                                warningsList.push(`Positional placeholder ? at index ${questionIndex + 1} has no corresponding value.`);
                            }
                            questionIndex++;
                        }
                    } else {
                        result += char;
                    }
                }
                output = result;
            }
        } else {
            // 2. Named dictionary-based substitution
            const dict = parsedParameters.dictionary;
            // Sort keys by descending length to prevent sub-string collision (e.g. :userId vs :user)
            const keys = Object.keys(dict).sort((a, b) => b.length - a.length);

            for (const key of keys) {
                const val = dict[key];
                const cleanKey = key.replace(/^[:@$]/, "");
                // Regex matches :key, @key, or $key with word boundary
                const escapedKey = cleanKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const pattern = new RegExp(`(?<![a-zA-Z0-9_])([:@$]?${escapedKey})(?![a-zA-Z0-9_])`, "g");

                let keyMatches = 0;
                output = output.replace(pattern, (match) => {
                    // Check if match resembles parameter
                    if (match.startsWith(":") || match.startsWith("@") || match.startsWith("$") || key.startsWith(":") || key.startsWith("@") || key.startsWith("$")) {
                        keyMatches++;
                        replacedCount++;
                        return formatValueToSql(val, dialect);
                    }
                    return match;
                });

                if (keyMatches === 0 && (key.startsWith(":") || key.startsWith("@") || key.startsWith("$"))) {
                    // Informative, not breaking
                }
            }

            // Secondary check: detect leftover placeholders like :name or @name
            const leftoverRegex = /(?<![a-zA-Z0-9_])([:@][a-zA-Z_][a-zA-Z0-9_]*)(?![a-zA-Z0-9_])/g;
            let leftoverMatch: RegExpExecArray | null;
            while ((leftoverMatch = leftoverRegex.exec(output)) !== null) {
                if (leftoverMatch[1] && !leftoverMatch[1].startsWith("::")) { // avoid pg double colon cast
                    warningsList.push(`Unbound named parameter remaining in query: ${leftoverMatch[1]}`);
                }
            }
        }

        // Basic SQL cleanup indentation if active
        if (formatSqlOutput) {
            output = output.trim();
        }

        return {
            interpolatedSql: output,
            replacementStats: {
                total: parsedParameters.isObject ? Object.keys(parsedParameters.dictionary).length : parsedParameters.array.length,
                matched: replacedCount,
                unmatched: warningsList.length
            },
            warnings: warningsList
        };
    }, [rawSql, parsedParameters, dialect, paramFormat, nullLiteral, booleanFormat, dateFormat, formatSqlOutput]);

    const handleCopy = () => {
        if (!interpolatedSql) return;
        navigator.clipboard.writeText(interpolatedSql);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setRawSql("");
        setJsonParams("");
        setCommaParams("");
        setKeyValuePairs([]);
    };

    const loadSample = (type: "named" | "postgres_numbered" | "spring_jpa" | "positional_question") => {
        const sample = SAMPLE_DATA[type];
        setRawSql(sample.sql);
        setJsonParams(sample.json);
        setDialect(sample.dialect);
        setParamFormat(sample.paramFormat);
        setParamInputMode("json");
    };

    const handleAddKeyValuePair = () => {
        setKeyValuePairs((prev) => [
            ...prev,
            { id: Date.now().toString(), key: ":newParam", value: "", type: "string" }
        ]);
    };

    const handleRemoveKeyValuePair = (id: string) => {
        setKeyValuePairs((prev) => prev.filter((p) => p.id !== id));
    };

    const handleUpdateKeyValuePair = (id: string, field: keyof KeyValuePair, value: string) => {
        setKeyValuePairs((prev) =>
            prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
        );
    };

    const handleDownloadSql = () => {
        const blob = new Blob([interpolatedSql], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interpolated_query_${dialect}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "SQL Query Parameter Placeholder to Inline Value Binder",
        "url": "https://twistertools.com/tools/developer-tools/sql-parameter-replacer",
        "description": "Convert parameterized SQL queries with question marks, $1, :name, and @param into executable inline statements. Supports PostgreSQL, MySQL, SQLite, Oracle, and MS SQL.",
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
                "name": "What does the SQL Parameter Replacer do?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The SQL Query Parameter Binder safely substitutes prepared statement placeholders (such as ?, $1, :namedParam, or @param) with their actual variable values. This produces a raw, copy-pasteable SQL string ready to execute directly inside database clients like DBeaver, pgAdmin, DataGrip, or MySQL Workbench for debugging and query plan analysis."
                }
            },
            {
                "@type": "Question",
                "name": "Why do ORMs and database drivers output SQL with placeholders instead of raw values?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ORMs (like Prisma, Hibernate, Entity Framework, Drizzle, and TypeORM) send parameterized queries over database wire protocols to prevent SQL injection vulnerabilities and allow database engines to pre-compile execution plans. When inspecting query logs, ORMs output the template query with separate argument arrays."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool expose my sensitive database query data to external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools executes all parameter replacement, string escaping, and formatting 100% client-side inside your browser via local JavaScript. No SQL text, parameters, credentials, or proprietary schema info is ever sent to or stored on any server."
                }
            },
            {
                "@type": "Question",
                "name": "How does dialect-specific escaping work for quotes and booleans?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard ANSI SQL (Postgres, SQLite) escapes single quotes by doubling them ('John''s Car'). MySQL allows backslash escaping (\\' or \\\"). For booleans, PostgreSQL natively supports TRUE/FALSE, whereas Oracle and older MySQL schemas frequently require numeric 1 and 0 representation. You can toggle these options in the configuration panel."
                }
            },
            {
                "@type": "Question",
                "name": "Can this tool handle Spring Data JPA (?1) and Hibernate named parameters (:param)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The tool features built-in presets for Spring Data JPA positional parameters (?1, ?2), Hibernate/JPA colon-prefixed named parameters (:param), Microsoft SQL Server @param syntax, and PostgreSQL numbered tokens ($1, $2)."
                }
            },
            {
                "@type": "Question",
                "name": "Can I paste raw JSON parameter payloads directly from logs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Switch the parameter input mode to JSON. You can paste JSON objects (for named parameters) or JSON arrays (for positional ? or $1 parameters) copied directly from Morgan, Logback, Winston, Datadog, or terminal application consoles."
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
                {/* Left Panel: Query Input & Parameter Configuration (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            SQL & Parameters Input
                        </h2>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                                type="button"
                                onClick={() => loadSample("named")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Named (:param)
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("postgres_numbered")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Postgres ($1)
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("positional_question")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Standard (?)
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("spring_jpa")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                JPA (?1)
                            </button>
                        </div>
                    </div>

                    {/* SQL Input Area */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor={sqlInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Prepared SQL Statement:
                            </label>
                            <span className="text-[11px] text-slate-500 font-mono">
                                {rawSql.length} characters
                            </span>
                        </div>
                        <textarea
                            id={sqlInputId}
                            rows={8}
                            aria-label="Parameterized SQL query input"
                            value={rawSql}
                            onChange={(e) => setRawSql(e.target.value)}
                            placeholder="Paste SQL with ?, $1, :name, or @param placeholders..."
                            className="w-full p-3.5 sm:p-4 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[160px]"
                        />
                    </div>

                    {/* Dialect and Placeholder Format Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1.5">
                            <label htmlFor={dialectSelectId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Target SQL Dialect:
                            </label>
                            <select
                                id={dialectSelectId}
                                aria-label="Target SQL dialect selection"
                                value={dialect}
                                onChange={(e) => setDialect(e.target.value as Dialect)}
                                className="w-full p-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="postgres">PostgreSQL (ANSI Quotes, Timestamps)</option>
                                <option value="mysql">MySQL / MariaDB (Backslash / Quotes)</option>
                                <option value="sqlite">SQLite (ANSI Doubled Quotes)</option>
                                <option value="mssql">Microsoft SQL Server (T-SQL)</option>
                                <option value="oracle">Oracle PL/SQL (1/0 Booleans)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor={paramFormatSelectId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Placeholder Pattern:
                            </label>
                            <select
                                id={paramFormatSelectId}
                                aria-label="SQL parameter placeholder format"
                                value={paramFormat}
                                onChange={(e) => setParamFormat(e.target.value as ParamFormat)}
                                className="w-full p-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="named_colon">Colon Named (:param, :id)</option>
                                <option value="named_at">At-Sign Named (@param, @userId)</option>
                                <option value="positional_numbered">Postgres Numbered ($1, $2, $3)</option>
                                <option value="spring_jpa">Spring JPA Positional (?1, ?2)</option>
                                <option value="positional_question">Anonymous Question Mark (?)</option>
                            </select>
                        </div>
                    </div>

                    {/* Parameter Input Mode Selector */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                Parameter Input Mode:
                            </label>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setParamInputMode("json")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${paramInputMode === "json"
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    JSON Payload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setParamInputMode("key_value")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${paramInputMode === "key_value"
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    Key-Value Grid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setParamInputMode("comma_list")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${paramInputMode === "comma_list"
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    CSV Array
                                </button>
                            </div>
                        </div>

                        {/* Mode 1: JSON Input */}
                        {paramInputMode === "json" && (
                            <div className="space-y-2">
                                <textarea
                                    id={jsonInputId}
                                    rows={7}
                                    aria-label="JSON parameters payload"
                                    value={jsonParams}
                                    onChange={(e) => setJsonParams(e.target.value)}
                                    placeholder={`{\n  ":status": "ACTIVE",\n  ":limit": 25\n}`}
                                    className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[140px]"
                                />
                                {parsedParameters.parseError && (
                                    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        JSON Parsing Syntax Error: {parsedParameters.parseError}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Mode 2: Key-Value Form Rows */}
                        {paramInputMode === "key_value" && (
                            <div className="space-y-2">
                                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                                    {keyValuePairs.map((pair) => (
                                        <div key={pair.id} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                aria-label="Parameter key"
                                                value={pair.key}
                                                onChange={(e) => handleUpdateKeyValuePair(pair.id, "key", e.target.value)}
                                                placeholder=":param"
                                                className="w-1/3 p-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <input
                                                type="text"
                                                aria-label="Parameter value"
                                                value={pair.value}
                                                onChange={(e) => handleUpdateKeyValuePair(pair.id, "value", e.target.value)}
                                                placeholder="Value..."
                                                className="flex-1 p-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <select
                                                aria-label="Parameter data type"
                                                value={pair.type}
                                                onChange={(e) => handleUpdateKeyValuePair(pair.id, "type", e.target.value)}
                                                className="w-24 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="null">NULL</option>
                                                <option value="raw">Raw SQL</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveKeyValuePair(pair.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                title="Remove parameter"
                                                aria-label="Remove parameter row"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddKeyValuePair}
                                    className="w-full py-2 text-xs font-semibold rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                >
                                    + Add Parameter Row
                                </button>
                            </div>
                        )}

                        {/* Mode 3: CSV Comma Separated List */}
                        {paramInputMode === "comma_list" && (
                            <div className="space-y-2">
                                <label htmlFor={commaInputId} className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    Ordered values for positional placeholders (?, $1, $2):
                                </label>
                                <textarea
                                    id={commaInputId}
                                    rows={4}
                                    aria-label="Comma-separated positional values"
                                    value={commaParams}
                                    onChange={(e) => setCommaParams(e.target.value)}
                                    placeholder="'Order Pending', 1042, true, '2024-05-01', NULL"
                                    className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed transition resize-y min-h-[90px]"
                                />
                            </div>
                        )}
                    </div>

                    {/* Advanced Literal Formatting Toggles */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Value Formatting Settings:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Booleans:
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setBooleanFormat("true_false")}
                                        className={`px-2.5 py-1 text-xs rounded-md border flex-1 transition cursor-pointer font-mono ${booleanFormat === "true_false"
                                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                            }`}
                                    >
                                        TRUE/FALSE
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBooleanFormat("1_0")}
                                        className={`px-2.5 py-1 text-xs rounded-md border flex-1 transition cursor-pointer font-mono ${booleanFormat === "1_0"
                                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                            }`}
                                    >
                                        1 / 0
                                    </button>
                                </div>
                            </div>

                            <div>
                                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    NULL Representation:
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setNullLiteral("NULL")}
                                        className={`px-2.5 py-1 text-xs rounded-md border flex-1 transition cursor-pointer font-mono ${nullLiteral === "NULL"
                                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                            }`}
                                    >
                                        NULL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNullLiteral("null")}
                                        className={`px-2.5 py-1 text-xs rounded-md border flex-1 transition cursor-pointer font-mono ${nullLiteral === "null"
                                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                            }`}
                                    >
                                        null
                                    </button>
                                </div>
                            </div>

                            <div>
                                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Timestamps:
                                </span>
                                <select
                                    aria-label="Timestamp casting preference"
                                    value={dateFormat}
                                    onChange={(e) => setDateFormat(e.target.value as "iso_quotes" | "postgres_timestamp" | "oracle_to_date")}
                                    className="w-full p-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
                                >
                                    <option value="iso_quotes">&apos;YYYY-MM-DD&apos;</option>
                                    <option value="postgres_timestamp">TIMESTAMPTZ &apos;...&apos;</option>
                                    <option value="oracle_to_date">TO_TIMESTAMP(&apos;...&apos;)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset All Fields
                        </button>
                    </div>
                </div>

                {/* Right Panel: Bound Executable SQL Output & Debug Logs (Column Span 6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Bound Executable SQL
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadSql}
                                    disabled={!interpolatedSql}
                                    className="p-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1 disabled:opacity-40"
                                    title="Download as .sql file"
                                >
                                    <Download className="w-3.5 h-3.5" /> .SQL
                                </button>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    Ready to Run
                                </span>
                            </div>
                        </div>

                        {/* Rendered SQL Box */}
                        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                                <span className="flex items-center gap-2">
                                    <Terminal className="w-3.5 h-3.5 text-indigo-400" /> {dialect.toUpperCase()} Syntax
                                </span>
                                <span>{interpolatedSql.length} chars</span>
                            </div>
                            <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-300 dark:text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text break-words max-h-[380px] min-h-[220px]">
                                {interpolatedSql || "-- Output query with inline values will appear here..."}
                            </pre>
                        </div>

                        {/* Diagnostics & Warning Alerts */}
                        {warnings.length > 0 && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    Parameter Matching Notice:
                                </p>
                                <ul className="text-xs text-amber-800 dark:text-amber-300 list-disc list-inside space-y-0.5">
                                    {warnings.map((warn, i) => (
                                        <li key={i}>{warn}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Replacement Statistics */}
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Input Values
                                </span>
                                <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                    {replacementStats.total}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Substituted
                                </span>
                                <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    {replacementStats.matched}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Unmatched
                                </span>
                                <p className={`text-base font-bold font-mono ${replacementStats.unmatched > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                                    {replacementStats.unmatched}
                                </p>
                            </div>
                        </div>

                        {/* Primary Copy Action */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!interpolatedSql}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copied
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5 text-white" />
                                    <span>Copied Executable SQL to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-white" />
                                    <span>Copy Executable SQL Query</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Deep Dive */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Science of SQL Parameter Binding: Why Debugging ORM Queries Requires Inlining
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Modern enterprise software architectures almost exclusively utilize Object-Relational Mapping (ORM) frameworks like Prisma, Hibernate, Entity Framework Core, Drizzle, and TypeORM. While these tools protect applications against devastating SQL injection vulnerabilities, they create massive hurdles when diagnosing slow production queries or testing performance indexes:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Separation of Query and Data
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Database drivers transmit the query template with question marks or numbered indices across the wire separately from the serialized data packets, preventing accidental string concatenation exploit attempts.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Explain Plan Misdiagnoses
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Running an <code className="font-mono text-indigo-600 dark:text-indigo-400">EXPLAIN ANALYZE</code> on a query template with placeholders fails because query optimizers rely on concrete cardinalities, histogram statistics, and boundary values to pick indexes.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Safe Local Inlining
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                This browser-native replacer injects your exact debug parameters back into the SQL string with rigorous dialect-specific quote escaping, enabling immediate copy-pasting into DBeaver, DataGrip, or pgAdmin.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Real-World Transformation Workflow
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Observe how parameterized ORM logs containing detached arguments are harmonized into an executable database query:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div>
                                <span className="text-slate-500">// 1. Raw Node.js / Python / Java ORM Log Output:</span>
                                <div className="text-slate-300">{`query: SELECT * FROM transactions WHERE account_id = $1 AND amount > $2 AND status = $3`}</div>
                                <div className="text-slate-400">{`params: ["acc_9831a", 500.00, "SETTLED"]`}</div>
                            </div>
                            <div className="pt-2 border-t border-slate-800">
                                <span className="text-emerald-400">// 2. Inlined Executable Statement via TwisterTools:</span>
                                <div className="text-emerald-300">{`SELECT * FROM transactions WHERE account_id = 'acc_9831a' AND amount > 500 AND status = 'SETTLED';`}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Dialect Syntax Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            RDBMS Dialect Parameter Standards & Escaping Rules
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Different database engines enforce divergent syntax conventions for bind parameters and string literal escaping. The table below details how TwisterTools manages each dialect:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Database Engine</th>
                                    <th className="p-3">Primary Parameter Syntax</th>
                                    <th className="p-3">String Escaping Format</th>
                                    <th className="p-3">Boolean Literal Type</th>
                                    <th className="p-3">Frameworks Commonly Used</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">PostgreSQL</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">$1, $2, $3</td>
                                    <td className="p-3">Standard ANSI Doubled Quotes (&apos;&apos;)</td>
                                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">TRUE / FALSE</td>
                                    <td className="p-3">Prisma, pg-node, psycopg2, Ecto</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">MySQL / MariaDB</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">? or :name</td>
                                    <td className="p-3">Backslash (\&apos;) or ANSI Doubled</td>
                                    <td className="p-3 font-mono text-indigo-600">1 / 0 (TINYINT)</td>
                                    <td className="p-3">TypeORM, Sequelize, PyMySQL, Go GORM</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Microsoft SQL Server</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">@param1, @param2</td>
                                    <td className="p-3">ANSI Doubled Quotes (&apos;&apos;)</td>
                                    <td className="p-3 font-mono text-indigo-600">1 / 0 (BIT)</td>
                                    <td className="p-3">Entity Framework Core, Dapper, mssql</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">SQLite</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">? or :param</td>
                                    <td className="p-3">ANSI Doubled Quotes (&apos;&apos;)</td>
                                    <td className="p-3 font-mono text-indigo-600">1 / 0 (INTEGER)</td>
                                    <td className="p-3">better-sqlite3, SQLite3, CoreData</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Oracle Database</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">:1, :2 or :name</td>
                                    <td className="p-3">ANSI Doubled Quotes (&apos;&apos;)</td>
                                    <td className="p-3 font-mono text-indigo-600">1 / 0 (NUMBER)</td>
                                    <td className="p-3">Hibernate JPA, cx_Oracle, node-oracledb</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for Debugging Database Queries */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Developer Workflow: 4 Best Practices for Troubleshooting ORM Statements
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Inlining parameters is essential for profiling slow database operations. Follow these four professional steps to troubleshoot problematic queries safely without impacting production uptime:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Proven Debugging Protocols
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Always Run EXPLAIN on Read Replicas:</strong> Take the inlined query output and prefix it with <code className="font-mono text-indigo-600 dark:text-indigo-400">EXPLAIN (ANALYZE, BUFFERS)</code> on a staging database or dedicated read replica to inspect sequential scans without locking live tables.
                                </li>
                                <li>
                                    • <strong>Validate Actual Timestamp Timezones:</strong> Ensure UTC offsets in your application logs match your database server&apos;s session configuration (<code className="font-mono text-indigo-600 dark:text-indigo-400">SET TIME ZONE &apos;UTC&apos;</code>) to avoid mismatched partition pruning.
                                </li>
                                <li>
                                    • <strong>Test Edge Case Nulls:</strong> Check whether replacing an optional filter with an explicit <code className="font-mono text-indigo-600 dark:text-indigo-400">IS NULL</code> vs <code className="font-mono text-indigo-600 dark:text-indigo-400">= NULL</code> causes the query planner to revert to a full table scan.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Pitfalls to Avoid in Production
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Never Ship Inlined Queries into App Code:</strong> Parameter inlining is strictly a developer debugging technique. Always retain parameterized queries in your production source code to prevent SQL injection vulnerabilities.
                                </li>
                                <li>
                                    • <strong>Watch for Over-Quoted Numerics:</strong> Passing integer IDs as quoted strings (e.g. <code className="font-mono text-indigo-600 dark:text-indigo-400">&apos;1042&apos;</code> instead of <code className="font-mono text-indigo-600 dark:text-indigo-400">1042</code>) may trigger implicit casting in PostgreSQL, disabling B-tree index lookups.
                                </li>
                                <li>
                                    • <strong>Beware of Large IN (...) Lists:</strong> Injecting arrays with thousands of elements can exceed the query parser&apos;s maximum memory threshold. Use temporary tables or <code className="font-mono text-indigo-600 dark:text-indigo-400">UNNEST</code> for bulk sets.
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
                                What does the SQL Parameter Replacer do?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The SQL Query Parameter Binder safely substitutes prepared statement placeholders (such as ?, $1, :namedParam, or @param) with their actual variable values. This produces a raw, copy-pasteable SQL string ready to execute directly inside database clients like DBeaver, pgAdmin, DataGrip, or MySQL Workbench for debugging and query plan analysis.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why do ORMs and database drivers output SQL with placeholders instead of raw values?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                ORMs (like Prisma, Hibernate, Entity Framework, Drizzle, and TypeORM) send parameterized queries over database wire protocols to prevent SQL injection vulnerabilities and allow database engines to pre-compile execution plans. When inspecting query logs, ORMs output the template query with separate argument arrays.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this tool expose my sensitive database query data to external servers?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. TwisterTools executes all parameter replacement, string escaping, and formatting 100% client-side inside your browser via local JavaScript. No SQL text, parameters, credentials, or proprietary schema info is ever sent to or stored on any server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does dialect-specific escaping work for quotes and booleans?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Standard ANSI SQL (Postgres, SQLite) escapes single quotes by doubling them (&apos;John&apos;&apos;s Car&apos;). MySQL allows backslash escaping (\&apos; or \&quot;). For booleans, PostgreSQL natively supports TRUE/FALSE, whereas Oracle and older MySQL schemas frequently require numeric 1 and 0 representation. You can toggle these options in the configuration panel.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can this tool handle Spring Data JPA (?1) and Hibernate named parameters (:param)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. The tool features built-in presets for Spring Data JPA positional parameters (?1, ?2), Hibernate/JPA colon-prefixed named parameters (:param), Microsoft SQL Server @param syntax, and PostgreSQL numbered tokens ($1, $2).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I paste raw JSON parameter payloads directly from logs?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Switch the parameter input mode to JSON. You can paste JSON objects (for named parameters) or JSON arrays (for positional ? or $1 parameters) copied directly from Morgan, Logback, Winston, Datadog, or terminal application consoles.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}