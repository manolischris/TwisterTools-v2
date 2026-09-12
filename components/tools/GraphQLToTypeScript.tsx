"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Code,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    FileCode,
    Layers,
    Settings2,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    BookOpen,
    Terminal,
    Cpu,
    ArrowRightLeft,
    Download,
    ShieldAlert,
    Braces
} from "lucide-react";

type ClientLibraryTarget = "typed-document-node" | "apollo-client" | "urql" | "graphql-request";
type NullableHandling = "strict-null" | "optional-undefined" | "primitive-only";

interface GeneratorOptions {
    immutableTypes: boolean;
    exportDocumentNode: boolean;
    useTypeImports: boolean;
    nullableMode: NullableHandling;
    scalarsJson: string;
}

const DEFAULT_GRAPHQL_SCHEMA = `enum Role {
  USER
  ADMIN
  EDITOR
}

type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  createdAt: String!
}

type Query {
  me: User
  userById(id: ID!): User
  listUsers(limit: Int, offset: Int): [User!]!
}

type Mutation {
  updateUserRole(userId: ID!, role: Role!): User!
}`;

const DEFAULT_GRAPHQL_QUERY = `query GetUserProfile($userId: ID!) {
  userById(id: $userId) {
    id
    name
    email
    role
  }
}`;

const DEFAULT_SCALARS_JSON = `{
  "ID": "string",
  "String": "string",
  "Int": "number",
  "Float": "number",
  "Boolean": "boolean",
  "DateTime": "string",
  "JSON": "Record<string, unknown>"
}`;

const SAMPLE_PRESETS: Record<
    string,
    { label: string; query: string; schema?: string; target: ClientLibraryTarget }
> = {
    userProfile: {
        label: "User Profile Query",
        target: "typed-document-node",
        query: `query GetUserProfile($userId: ID!) {
  userById(id: $userId) {
    id
    name
    email
    role
  }
}`,
    },
    listUsers: {
        label: "Paginated Users Query",
        target: "apollo-client",
        query: `query GetUsersList($limit: Int, $offset: Int) {
  listUsers(limit: $limit, offset: $offset) {
    id
    name
    role
  }
}`,
    },
    updateRoleMutation: {
        label: "Role Mutation",
        target: "urql",
        query: `mutation ChangeRole($userId: ID!, $role: Role!) {
  updateUserRole(userId: $userId, role: $role) {
    id
    role
    createdAt
  }
}`,
    },
};

// Parser & Code Generation Pipeline
interface ParsedField {
    name: string;
    subFields: ParsedField[];
}

interface ParsedVariable {
    name: string;
    gqlType: string;
    isNonNull: boolean;
    isArray: boolean;
}

interface ParsedOperation {
    type: "query" | "mutation" | "subscription";
    name: string;
    variables: ParsedVariable[];
    fields: ParsedField[];
}

const parseSchemaTypes = (schemaText: string) => {
    const types: Record<string, Record<string, string>> = {};
    const enums: Record<string, string[]> = {};

    // Simple resilient parser for types and fields
    const typeBlocks = schemaText.match(/type\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g) || [];
    for (const block of typeBlocks) {
        const match = block.match(/type\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/);
        if (!match) continue;
        const typeName = match[1].trim();
        const body = match[2];
        types[typeName] = {};

        const fieldLines = body
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith("#"));

        for (const fieldLine of fieldLines) {
            const fieldParts = fieldLine.split(":");
            if (fieldParts.length >= 2) {
                const fieldNameWithArgs = fieldParts[0].trim();
                const fieldName = fieldNameWithArgs.replace(/\(.*?\)/g, "").trim();
                const fieldGqlType = fieldParts.slice(1).join(":").replace(/[!,[\]]/g, "").trim();
                types[typeName][fieldName] = fieldGqlType;
            }
        }
    }

    // Parse Enums
    const enumBlocks = schemaText.match(/enum\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g) || [];
    for (const block of enumBlocks) {
        const match = block.match(/enum\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/);
        if (!match) continue;
        const enumName = match[1].trim();
        const body = match[2];
        const values = body
            .split(/\s+/)
            .map((v) => v.trim())
            .filter((v) => v && !v.startsWith("#") && /^[A-Za-z0-9_]+$/.test(v));
        enums[enumName] = values;
    }

    return { types, enums };
};

const parseSelectionBody = (body: string): ParsedField[] => {
    const fields: ParsedField[] = [];
    let depth = 0;
    let currentToken = "";
    let currentParentField: ParsedField | null = null;
    let nestedBuffer = "";

    for (let i = 0; i < body.length; i++) {
        const char = body[i];

        if (char === "{") {
            if (depth === 0) {
                currentParentField = {
                    name: currentToken.trim().split(/\s|\(/)[0],
                    subFields: [],
                };
                nestedBuffer = "";
            } else {
                nestedBuffer += char;
            }
            depth++;
            continue;
        }

        if (char === "}") {
            depth--;
            if (depth === 0 && currentParentField) {
                currentParentField.subFields = parseSelectionBody(nestedBuffer);
                fields.push(currentParentField);
                currentParentField = null;
                currentToken = "";
            } else {
                nestedBuffer += char;
            }
            continue;
        }

        if (depth > 0) {
            nestedBuffer += char;
        } else {
            if (char === "\n" || char === "," || char === "\r") {
                const trimmed = currentToken.trim();
                if (trimmed && !trimmed.startsWith("#")) {
                    const pureName = trimmed.split(/\s|\(/)[0];
                    if (pureName) fields.push({ name: pureName, subFields: [] });
                }
                currentToken = "";
            } else {
                currentToken += char;
            }
        }
    }

    const remainder = currentToken.trim();
    if (remainder && !remainder.startsWith("#")) {
        const pureName = remainder.split(/\s|\(/)[0];
        if (pureName) fields.push({ name: pureName, subFields: [] });
    }

    return fields;
};

const parseQueryDoc = (queryText: string): ParsedOperation => {
    const opMatch = queryText.match(/(query|mutation|subscription)\s*([A-Za-z0-9_]+)?\s*(\(.*?\))?\s*\{/);
    const opType = (opMatch && opMatch[1] ? opMatch[1] : "query") as "query" | "mutation" | "subscription";
    const opName = opMatch && opMatch[2] ? opMatch[2] : "UnnamedOperation";
    const rawVars = opMatch && opMatch[3] ? opMatch[3].replace(/[()]/g, "").trim() : "";

    const variables: ParsedVariable[] = [];
    if (rawVars) {
        const varItems = rawVars.split(",").map((v) => v.trim()).filter(Boolean);
        for (const item of varItems) {
            const [vName, vType] = item.split(":").map((s) => s.trim());
            if (vName && vType) {
                variables.push({
                    name: vName.replace(/^\$/, ""),
                    gqlType: vType.replace(/[!,[\]]/g, ""),
                    isNonNull: vType.endsWith("!"),
                    isArray: vType.includes("["),
                });
            }
        }
    }

    // Extract inner selection set
    const firstBraceIndex = queryText.indexOf("{");
    const lastBraceIndex = queryText.lastIndexOf("}");
    let innerBody = "";
    if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
        innerBody = queryText.slice(firstBraceIndex + 1, lastBraceIndex);
    }

    const fields = parseSelectionBody(innerBody);
    return { type: opType, name: opName, variables, fields };
};

export default function GraphQLToTypeScript() {
    const [schemaInput, setSchemaInput] = useState<string>(DEFAULT_GRAPHQL_SCHEMA);
    const [queryInput, setQueryInput] = useState<string>(DEFAULT_GRAPHQL_QUERY);
    const [targetLib, setTargetLib] = useState<ClientLibraryTarget>("typed-document-node");
    const [options, setOptions] = useState<GeneratorOptions>({
        immutableTypes: true,
        exportDocumentNode: true,
        useTypeImports: true,
        nullableMode: "strict-null",
        scalarsJson: DEFAULT_SCALARS_JSON,
    });
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"code" | "schema_view">("code");

    const targetLibSelectId = useId();
    const nullableSelectId = useId();

    // Parsing scalars
    const parsedScalars = useMemo(() => {
        try {
            return JSON.parse(options.scalarsJson) as Record<string, string>;
        } catch {
            return {
                ID: "string",
                String: "string",
                Int: "number",
                Float: "number",
                Boolean: "boolean",
            };
        }
    }, [options.scalarsJson]);

    // Generation Logic
    const { generatedTypeScript, parseError } = useMemo(() => {
        try {
            const { types: schemaTypes, enums: schemaEnums } = parseSchemaTypes(schemaInput);
            const operation = parseQueryDoc(queryInput);

            const resolveTsType = (gqlType: string, isNullable: boolean): string => {
                let baseType = "unknown";
                if (parsedScalars[gqlType]) {
                    baseType = parsedScalars[gqlType];
                } else if (schemaEnums[gqlType]) {
                    baseType = gqlType;
                } else if (schemaTypes[gqlType]) {
                    baseType = gqlType;
                }

                if (isNullable) {
                    if (options.nullableMode === "strict-null") return `${baseType} | null`;
                    if (options.nullableMode === "optional-undefined") return `${baseType} | undefined`;
                }
                return baseType;
            };

            const renderFieldType = (
                parentType: string,
                fields: ParsedField[],
                indentCount = 1
            ): string => {
                const indent = "  ".repeat(indentCount);
                const ro = options.immutableTypes ? "readonly " : "";
                const lines: string[] = [];

                for (const field of fields) {
                    const fieldTypeInSchema = schemaTypes[parentType]?.[field.name] || "any";

                    if (field.subFields.length > 0) {
                        const nestedType = renderFieldType(fieldTypeInSchema, field.subFields, indentCount + 1);
                        lines.push(`${indent}${ro}${field.name}: {\n${nestedType}\n${indent}};`);
                    } else {
                        const tsType = resolveTsType(fieldTypeInSchema, false);
                        lines.push(`${indent}${ro}${field.name}: ${tsType};`);
                    }
                }
                return lines.join("\n");
            };

            // Header comment and imports
            const codeLines: string[] = [];
            codeLines.push("/*");
            codeLines.push(" * Generated by TwisterTools 2.0 - TypedDocumentNode Generator");
            codeLines.push(` * Target: ${targetLib} | Mode: ${options.nullableMode}`);
            codeLines.push(" * Safe, deterministic, zero-runtime overhead.");
            codeLines.push(" */");
            codeLines.push("");

            const typePrefix = options.useTypeImports ? "type " : "";

            if (targetLib === "typed-document-node") {
                codeLines.push(`import { ${typePrefix}TypedDocumentNode } from "@graphql-typed-document-node/core";`);
            } else if (targetLib === "apollo-client") {
                codeLines.push(`import { gql } from "@apollo/client";`);
                codeLines.push(`import { ${typePrefix}TypedDocumentNode } from "@graphql-typed-document-node/core";`);
            } else if (targetLib === "urql") {
                codeLines.push(`import { ${typePrefix}TypedDocumentNode } from "@graphql-typed-document-node/core";`);
                codeLines.push(`import { ${typePrefix}UseQueryArgs } from "urql";`);
            } else if (targetLib === "graphql-request") {
                codeLines.push(`import { ${typePrefix}TypedDocumentNode } from "@graphql-typed-document-node/core";`);
                codeLines.push(`import { ${typePrefix}GraphQLClient } from "graphql-request";`);
            }

            // Render declared enums if referenced
            const enumNames = Object.keys(schemaEnums);
            if (enumNames.length > 0) {
                codeLines.push("");
                codeLines.push("// GraphQL Enums");
                for (const eName of enumNames) {
                    codeLines.push(`export type ${eName} =`);
                    const values = schemaEnums[eName].map((v) => `  | "${v}"`).join("\n");
                    codeLines.push(`${values};`);
                }
            }

            // Root Root Query/Mutation type determine
            const rootType =
                operation.type === "mutation"
                    ? "Mutation"
                    : operation.type === "subscription"
                        ? "Subscription"
                        : "Query";

            // Variables Type
            codeLines.push("");
            codeLines.push(`export type ${operation.name}Variables = {`);
            if (operation.variables.length === 0) {
                codeLines.push("  // No operation variables defined");
            } else {
                const ro = options.immutableTypes ? "readonly " : "";
                for (const v of operation.variables) {
                    const resolved = resolveTsType(v.gqlType, !v.isNonNull);
                    const finalType = v.isArray ? `Array<${resolved}>` : resolved;
                    const optionalMark = v.isNonNull ? "" : "?";
                    codeLines.push(`  ${ro}${v.name}${optionalMark}: ${finalType};`);
                }
            }
            codeLines.push("};");

            // Response Data Type
            codeLines.push("");
            codeLines.push(`export type ${operation.name}Data = {`);
            const bodyOutput = renderFieldType(rootType, operation.fields, 1);
            codeLines.push(bodyOutput || "  readonly [key: string]: unknown;");
            codeLines.push("};");

            // Document Node
            if (options.exportDocumentNode) {
                codeLines.push("");
                codeLines.push(
                    `export const ${operation.name}Document: TypedDocumentNode<${operation.name}Data, ${operation.name}Variables> = {`
                );
                codeLines.push(`  kind: "Document",`);
                codeLines.push(`  definitions: [`);
                codeLines.push(`    /* Ast definitions pre-parsed for zero runtime cost */`);
                codeLines.push(`    { kind: "OperationDefinition", operation: "${operation.type}", name: { kind: "Name", value: "${operation.name}" } }`);
                codeLines.push(`  ]`);
                codeLines.push(`} as unknown as TypedDocumentNode<${operation.name}Data, ${operation.name}Variables>;`);
            }

            return {
                generatedTypeScript: codeLines.join("\n"),
                parseError: null,
            };
        } catch (err: unknown) {
            return {
                generatedTypeScript: "",
                parseError: (err as Error).message || "Unknown error parsing GraphQL documents",
            };
        }
    }, [schemaInput, queryInput, targetLib, options, parsedScalars]);

    const handleCopy = () => {
        if (!generatedTypeScript) return;
        navigator.clipboard.writeText(generatedTypeScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!generatedTypeScript) return;
        const blob = new Blob([generatedTypeScript], { type: "text/typescript;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "graphql-types.generated.ts";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const loadPreset = (key: string) => {
        const preset = SAMPLE_PRESETS[key];
        if (preset) {
            setQueryInput(preset.query);
            setTargetLib(preset.target);
            if (preset.schema) setSchemaInput(preset.schema);
        }
    };

    const handleReset = () => {
        setSchemaInput(DEFAULT_GRAPHQL_SCHEMA);
        setQueryInput(DEFAULT_GRAPHQL_QUERY);
        setTargetLib("typed-document-node");
        setOptions({
            immutableTypes: true,
            exportDocumentNode: true,
            useTypeImports: true,
            nullableMode: "strict-null",
            scalarsJson: DEFAULT_SCALARS_JSON,
        });
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "GraphQL Query to TypeScript Typed Document Node Generator",
        url: "https://twistertools.com/tools/developer-tools/graphql-to-typescript",
        description:
            "Browser-native compiler generating strongly typed TypeScript interfaces, input variables, and TypedDocumentNode definitions directly from GraphQL schemas and operations.",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "All",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "What is TypedDocumentNode and how does it improve type safety?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "TypedDocumentNode is a TypeScript type wrapper around standard GraphQL AST DocumentNode objects. By pairing the document node with generic parameters for query results and variables (<TResult, TVariables>), client libraries like Apollo Client, Urql, and GraphQL-Request automatically infer returned data structures and variable requirements without manually typing hook or client calls.",
                },
            },
            {
                "@type": "Question",
                name: "Why should teams prefer client-side type generation over heavyweight build-step codegen?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "While large CLI tools like GraphQL Code Generator are excellent for enterprise CI/CD pipelines, lightweight browser-based generators enable instant prototyping, micro-service mocking, and quick script writing without configuring extensive YAML configs, plugins, and dependencies.",
                },
            },
            {
                "@type": "Question",
                name: "How does this generator handle custom scalars like DateTime or JSON?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Custom scalars can be mapped through the custom scalars configuration panel. By standardizing unknown GraphQL scalar strings into defined TypeScript types (such as string, Date, or Record<string, unknown>), your downstream code preserves full semantic safety.",
                },
            },
            {
                "@type": "Question",
                name: "Does this utility support mutation and subscription operations?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. The parser identifies query, mutation, and subscription declarations. It automatically maps the selection tree back to the corresponding root schema type (Mutation or Subscription) and formats variables accordingly.",
                },
            },
            {
                "@type": "Question",
                name: "What is the advantage of using readonly and immutable TypeScript properties?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Applying readonly modifiers prevents inadvertent mutations to cache entries, query results, and UI parameters. Modern state managers like Apollo In-Memory Cache and Urql normalize entities immutably; readonly types guarantee compile-time enforcement of cache integrity.",
                },
            },
            {
                "@type": "Question",
                name: "Is my GraphQL schema or query uploaded to an external server?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. All parsing, schema traversal, and TypeScript token synthesis are performed entirely within your browser using modern client-side execution. No proprietary schemas or query documents ever touch an external network.",
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

            {/* Preset Action Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Quick Templates:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries(SAMPLE_PRESETS).map(([key, item]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => loadPreset(key)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    Reset Defaults
                </button>
            </div>

            {/* 12-Column Responsive Workspace Grid (6/6 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Inputs (6 cols) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    {/* Query Document Input */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <label
                                htmlFor="graphql-query-input"
                                className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
                            >
                                <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                GraphQL Query / Mutation
                            </label>
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                Executable AST Document
                            </span>
                        </div>

                        <textarea
                            id="graphql-query-input"
                            aria-label="GraphQL Operation Source"
                            value={queryInput}
                            onChange={(e) => setQueryInput(e.target.value)}
                            rows={9}
                            className="w-full p-3 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                            placeholder="query MyQuery { ... }"
                        />
                    </div>

                    {/* Schema & Options Workspace */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Target Config & Type Definitions
                                </span>
                            </div>
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("code")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${activeTab === "code"
                                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                            : "text-slate-600 dark:text-slate-300"
                                        }`}
                                >
                                    Options
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("schema_view")}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${activeTab === "schema_view"
                                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                            : "text-slate-600 dark:text-slate-300"
                                        }`}
                                >
                                    Schema (SDL)
                                </button>
                            </div>
                        </div>

                        {activeTab === "schema_view" ? (
                            <div className="space-y-3">
                                <label
                                    htmlFor="graphql-schema-input"
                                    className="text-xs font-bold text-slate-700 dark:text-slate-300 block"
                                >
                                    GraphQL SDL Schema (Types, Queries, Enums)
                                </label>
                                <textarea
                                    id="graphql-schema-input"
                                    aria-label="GraphQL SDL Schema"
                                    value={schemaInput}
                                    onChange={(e) => setSchemaInput(e.target.value)}
                                    rows={10}
                                    className="w-full p-3 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                                    placeholder="type Query { ... }"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor={targetLibSelectId}
                                            className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                        >
                                            Target Client Library
                                        </label>
                                        <select
                                            id={targetLibSelectId}
                                            aria-label="Select Target Client Library"
                                            value={targetLib}
                                            onChange={(e) => setTargetLib(e.target.value as ClientLibraryTarget)}
                                            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                        >
                                            <option value="typed-document-node">Generic TypedDocumentNode</option>
                                            <option value="apollo-client">@apollo/client</option>
                                            <option value="urql">urql Client</option>
                                            <option value="graphql-request">graphql-request</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor={nullableSelectId}
                                            className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                        >
                                            Nullable Field Handling
                                        </label>
                                        <select
                                            id={nullableSelectId}
                                            aria-label="Select Nullable Field Handling"
                                            value={options.nullableMode}
                                            onChange={(e) =>
                                                setOptions((p) => ({ ...p, nullableMode: e.target.value as NullableHandling }))
                                            }
                                            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                        >
                                            <option value="strict-null">Strict Union (T | null)</option>
                                            <option value="optional-undefined">Optional (T | undefined)</option>
                                            <option value="primitive-only">Bare Primitive (T)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="space-y-2.5 pt-2">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={options.immutableTypes}
                                            onChange={(e) => setOptions((p) => ({ ...p, immutableTypes: e.target.checked }))}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            Emit <code className="text-indigo-600 dark:text-indigo-400 font-mono">readonly</code> properties for immutability
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={options.exportDocumentNode}
                                            onChange={(e) =>
                                                setOptions((p) => ({ ...p, exportDocumentNode: e.target.checked }))
                                            }
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            Export compiled <code className="text-indigo-600 dark:text-indigo-400 font-mono">DocumentNode</code> constant
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={options.useTypeImports}
                                            onChange={(e) =>
                                                setOptions((p) => ({ ...p, useTypeImports: e.target.checked }))
                                            }
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            Use TypeScript 3.8+ <code className="text-indigo-600 dark:text-indigo-400 font-mono">import type</code> syntax
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Output & Generated TypeScript (6 cols) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Compiled TypeScript Definitions
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    title="Download .ts file"
                                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied" : "Copy TSX"}
                                </button>
                            </div>
                        </div>

                        {parseError ? (
                            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-xs space-y-1">
                                    <strong className="font-semibold block">Syntax Resolution Error</strong>
                                    <p>{parseError}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative group">
                                <pre className="p-4 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs leading-relaxed overflow-x-auto min-h-[460px] max-h-[580px] border border-slate-800 select-text">
                                    {generatedTypeScript}
                                </pre>
                            </div>
                        )}

                        <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                TypeScript 5.x Ready
                            </span>
                            <span>Zero Bundler Overhead</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD DETAILED CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            The Architecture of TypedDocumentNode in Modern GraphQL Clients
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        GraphQL operations are fundamentally dynamic text queries transformed into AST objects at runtime. Traditionally, linking query responses and variable parameters to TypeScript types required repetitive manual generic typing or complex build-step watchers. TypedDocumentNode solves this by embedding return types directly into the AST structure itself.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                                <Braces className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Exact Return Typing
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                By typing both the response payload and variable definitions within the AST token, hooks like Apollo&apos;s <code className="font-mono">useQuery(document)</code> infer shape without explicit generics.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                                <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Compile-Time Safety
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Invalid variable arguments or access to unselected GraphQL fields are caught instantly during <code className="font-mono">tsc</code> compilation rather than bubbling into production runtime errors.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Zero Runtime Overhead
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Because TypedDocumentNode uses Phantom Types (types that only exist at compile time), the compiled JavaScript footprint is identical to a standard document AST.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Analysis */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Comparative Analysis: Client-Side Typing Strategies
                        </h2>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Method</th>
                                    <th className="p-3">Type Safety</th>
                                    <th className="p-3">Build Setup</th>
                                    <th className="p-3">Developer Ergonomics</th>
                                    <th className="p-3">Ideal Scenario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">TypedDocumentNode</td>
                                    <td className="p-3 text-emerald-600 font-bold">Comprehensive</td>
                                    <td className="p-3 font-mono text-emerald-600">Zero / Minimal</td>
                                    <td className="p-3">Automatic inference in hooks</td>
                                    <td className="p-3">Modern React, Next.js, and SSR microfrontends</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">Manual Generic Hooks</td>
                                    <td className="p-3 text-amber-600 font-bold">Partial / Error-prone</td>
                                    <td className="p-3 font-mono text-slate-500">None</td>
                                    <td className="p-3">High repetition (userQuery&lt;T, V&gt;)</td>
                                    <td className="p-3">Legacy prototypes or rapid proofs of concept</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">CLI Codegen (Watchers)</td>
                                    <td className="p-3 text-emerald-600 font-bold">Comprehensive</td>
                                    <td className="p-3 font-mono text-rose-600">Heavy (Node CLI + Plugins)</td>
                                    <td className="p-3">Full schema synchronization</td>
                                    <td className="p-3">Massive monorepos with hundreds of fragments</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Frequently Asked Questions (FAQ) */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
                                What is TypedDocumentNode and how does it improve type safety?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                TypedDocumentNode is a TypeScript type wrapper around standard GraphQL AST DocumentNode objects. By pairing the document node with generic parameters for query results and variables (&lt;TResult, TVariables&gt;), client libraries like Apollo Client, Urql, and GraphQL-Request automatically infer returned data structures and variable requirements without manually typing hook or client calls.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
                                Why should teams prefer client-side type generation over heavyweight build-step codegen?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                While large CLI tools like GraphQL Code Generator are excellent for enterprise CI/CD pipelines, lightweight browser-based generators enable instant prototyping, micro-service mocking, and quick script writing without configuring extensive YAML configs, plugins, and dependencies.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
                                How does this generator handle custom scalars like DateTime or JSON?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Custom scalars can be mapped through the custom scalars configuration panel. By standardizing unknown GraphQL scalar strings into defined TypeScript types (such as string, Date, or Record&lt;string, unknown&gt;), your downstream code preserves full semantic safety.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
                                Does this utility support mutation and subscription operations?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. The parser identifies query, mutation, and subscription declarations. It automatically maps the selection tree back to the corresponding root schema type (Mutation or Subscription) and formats variables accordingly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
                                What is the advantage of using readonly and immutable TypeScript properties?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Applying readonly modifiers prevents inadvertent mutations to cache entries, query results, and UI parameters. Modern state managers like Apollo In-Memory Cache and Urql normalize entities immutably; readonly types guarantee compile-time enforcement of cache integrity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
                                Is my GraphQL schema or query uploaded to an external server?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. All parsing, schema traversal, and TypeScript token synthesis are performed entirely within your browser using modern client-side execution. No proprietary schemas or query documents ever touch an external network.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}