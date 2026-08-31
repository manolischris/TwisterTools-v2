"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Columns,
    FileSpreadsheet,
    Scissors,
    Copy,
    Check,
    RotateCcw,
    Download,
    ArrowRightLeft,
    SlidersHorizontal,
    Table,
    FileText,
    Settings2,
    Layers,
    Sparkles,
    BookOpen,
    HelpCircle,
    Info,
    CheckCircle2,
    Split,
    Hash,
    Filter,
    ShieldCheck,
    Code2,
    Database,
    Binary
} from "lucide-react";

type DelimiterType = "comma" | "tab" | "semicolon" | "pipe" | "space" | "custom" | "regex";
type OutputFormatType = "text" | "csv" | "tsv" | "json_array" | "json_kv" | "sql_insert";

const SAMPLE_DATASETS = [
    {
        name: "E-Commerce Orders (CSV)",
        delimiter: "comma" as DelimiterType,
        customDelim: "",
        hasHeaders: true,
        data: `order_id,customer_name,email,item_sku,unit_price,quantity,status
1001,"Eleanor Vance",eleanor@hillhouse.org,SKU-884,49.99,2,Shipped
1002,"Theodora Crain",theodora@designco.io,SKU-102,129.50,1,Delivered
1003,"Luke Sanderson",luke@sanderson.net,SKU-340,15.00,4,Pending
1004,"Arthur Vance",arthur@vancelegal.com,SKU-912,240.00,1,Cancelled
1005,"Nell Crain",nell@twoboys.org,SKU-551,89.95,3,Shipped`
    },
    {
        name: "Server Access Logs (Pipe Delimited)",
        delimiter: "pipe" as DelimiterType,
        customDelim: "",
        hasHeaders: false,
        data: `2026-08-31 10:14:22 | 192.168.1.104 | GET | /api/v2/users | 200 | 45ms | Mozilla/5.0
2026-08-31 10:14:25 | 10.0.4.12 | POST | /auth/session | 201 | 120ms | PostmanRuntime/7.39
2026-08-31 10:14:29 | 172.16.0.44 | GET | /assets/app.css | 304 | 12ms | Chrome/128.0
2026-08-31 10:14:32 | 192.168.1.104 | PUT | /api/v2/users/91 | 403 | 32ms | Mozilla/5.0
2026-08-31 10:14:38 | 10.0.8.88 | DELETE | /cache/flush | 500 | 250ms | cURL/8.6.0`
    },
    {
        name: "Geographic Coordinates (Tab Separated)",
        delimiter: "tab" as DelimiterType,
        customDelim: "",
        hasHeaders: true,
        data: "city\tcountry_code\tlatitude\tlongitude\tpopulation\ttimezone\nAthens\tGR\t37.9838\t23.7275\t3153000\tEurope/Athens\nTokyo\tJP\t35.6762\t139.6503\t37400068\tAsia/Tokyo\nReykjavik\tIS\t64.1466\t-21.9426\t131136\tAtlantic/Reykjavik\nNew York\tUS\t40.7128\t-74.0060\t8336817\tAmerica/New_York\nSydney\tAU\t-33.8688\t151.2093\t5312163\tAustralia/Sydney"
    }
];

// Robust CSV Line Parser supporting RFC 4180 Quotes
function parseDelimitedLine(line: string, delimiter: string, isRegex: boolean): string[] {
    if (!line.trim()) return [];

    if (isRegex) {
        try {
            const rx = new RegExp(delimiter);
            return line.split(rx).map((s) => s.trim());
        } catch {
            return line.split(" ").map((s) => s.trim());
        }
    }

    if (delimiter !== ",") {
        return line.split(delimiter).map((c) => c.trim());
    }

    // RFC 4180 Comma Parser handling quotes and internal commas
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

export default function TextColumnExtractor() {
    // Input state
    const [inputText, setInputText] = useState<string>(SAMPLE_DATASETS[0].data);
    const [inputDelimiter, setInputDelimiter] = useState<DelimiterType>("comma");
    const [customInputDelim, setCustomInputDelim] = useState<string>("");
    const [inputRegexDelim, setInputRegexDelim] = useState<string>("\\s+");
    const [hasHeaders, setHasHeaders] = useState<boolean>(true);

    // Extraction & Selection state
    const [selectedColumns, setSelectedColumns] = useState<number[]>([1, 2, 4]); // 1-indexed
    const [columnRangeInput, setColumnRangeInput] = useState<string>("2, 3, 5");

    // Output formatting state
    const [outputFormat, setOutputFormat] = useState<OutputFormatType>("csv");
    const [outputDelimiter, setOutputDelimiter] = useState<DelimiterType>("comma");
    const [customOutputDelim, setCustomOutputDelim] = useState<string>(", ");
    const [includeHeadersInOutput, setIncludeHeadersInOutput] = useState<boolean>(true);
    const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
    const [removeEmptyLines, setRemoveEmptyLines] = useState<boolean>(true);
    const [deduplicateRows, setDeduplicateRows] = useState<boolean>(false);
    const [quoteOutputs, setQuoteOutputs] = useState<boolean>(false);

    // UI state
    const [copied, setCopied] = useState<boolean>(false);
    const [previewTab, setPreviewTab] = useState<"formatted" | "table">("formatted");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Active input delimiter string
    const activeInputDelim = useMemo(() => {
        switch (inputDelimiter) {
            case "comma": return ",";
            case "tab": return "\t";
            case "semicolon": return ";";
            case "pipe": return "|";
            case "space": return " ";
            case "custom": return customInputDelim || ",";
            case "regex": return inputRegexDelim || "\\s+";
            default: return ",";
        }
    }, [inputDelimiter, customInputDelim, inputRegexDelim]);

    // Active output delimiter string
    const activeOutputDelim = useMemo(() => {
        switch (outputDelimiter) {
            case "comma": return ",";
            case "tab": return "\t";
            case "semicolon": return ";";
            case "pipe": return " | ";
            case "space": return " ";
            case "custom": return customOutputDelim;
            default: return ", ";
        }
    }, [outputDelimiter, customOutputDelim]);

    // Parse matrix of data from raw input
    const parsedMatrix = useMemo(() => {
        if (!inputText.trim()) return [];
        const lines = inputText.split(/\r?\n/);
        const matrix: string[][] = [];

        for (const line of lines) {
            if (removeEmptyLines && !line.trim()) continue;
            const row = parseDelimitedLine(line, activeInputDelim, inputDelimiter === "regex");
            if (row.length > 0) {
                matrix.push(trimWhitespace ? row.map((c) => c.trim()) : row);
            }
        }
        return matrix;
    }, [inputText, activeInputDelim, inputDelimiter, removeEmptyLines, trimWhitespace]);

    // Detected columns metadata
    const maxColumns = useMemo(() => {
        return parsedMatrix.reduce((max, row) => Math.max(max, row.length), 0);
    }, [parsedMatrix]);

    const headerRow = useMemo(() => {
        if (hasHeaders && parsedMatrix.length > 0) {
            return parsedMatrix[0];
        }
        return [];
    }, [hasHeaders, parsedMatrix]);

    // Parse Column Range Input ("1, 3-5, 8")
    const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setColumnRangeInput(val);

        const cols = new Set<number>();
        const parts = val.split(",");

        for (const part of parts) {
            const clean = part.trim();
            if (clean.includes("-")) {
                const [startStr, endStr] = clean.split("-").map((s) => s.trim());
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
                    for (let c = start; c <= Math.min(end, maxColumns || 100); c++) {
                        cols.add(c - 1);
                    }
                }
            } else {
                const colNum = parseInt(clean, 10);
                if (!isNaN(colNum) && colNum > 0) {
                    cols.add(colNum - 1);
                }
            }
        }
        setSelectedColumns(Array.from(cols).sort((a, b) => a - b));
    };

    // Toggle single column checkbox
    const toggleColumn = (colIdx: number) => {
        let updated: number[];
        if (selectedColumns.includes(colIdx)) {
            updated = selectedColumns.filter((c) => c !== colIdx);
        } else {
            updated = [...selectedColumns, colIdx].sort((a, b) => a - b);
        }
        setSelectedColumns(updated);
        setColumnRangeInput(updated.map((c) => c + 1).join(", "));
    };

    // Select All / Clear columns
    const selectAllColumns = () => {
        const all = Array.from({ length: maxColumns }, (_, i) => i);
        setSelectedColumns(all);
        setColumnRangeInput(all.map((c) => c + 1).join(", "));
    };

    const clearAllColumns = () => {
        setSelectedColumns([]);
        setColumnRangeInput("");
    };

    // Generate Formatted Extracted Output
    const extractedOutput = useMemo(() => {
        if (parsedMatrix.length === 0 || selectedColumns.length === 0) {
            return "";
        }

        const dataRows = hasHeaders ? parsedMatrix.slice(1) : parsedMatrix;
        const headers = hasHeaders
            ? selectedColumns.map((colIdx) => headerRow[colIdx] || `Column_${colIdx + 1}`)
            : selectedColumns.map((colIdx) => `Column_${colIdx + 1}`);

        // Extracted matrix for data rows
        let processedRows = dataRows.map((row) =>
            selectedColumns.map((colIdx) => (row[colIdx] !== undefined ? row[colIdx] : ""))
        );

        if (deduplicateRows) {
            const seen = new Set<string>();
            processedRows = processedRows.filter((row) => {
                const key = row.join("||");
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        switch (outputFormat) {
            case "csv":
            case "tsv":
            case "text": {
                const d = outputFormat === "tsv" ? "\t" : activeOutputDelim;
                const lines: string[] = [];

                if (hasHeaders && includeHeadersInOutput) {
                    const hLine = headers
                        .map((h) => (quoteOutputs || h.includes(d) ? `"${h.replace(/"/g, '""')}"` : h))
                        .join(d);
                    lines.push(hLine);
                }

                for (const row of processedRows) {
                    const rowStr = row
                        .map((cell) => (quoteOutputs || cell.includes(d) ? `"${cell.replace(/"/g, '""')}"` : cell))
                        .join(d);
                    lines.push(rowStr);
                }
                return lines.join("\n");
            }

            case "json_array": {
                const objects = processedRows.map((row) => {
                    const obj: Record<string, string> = {};
                    selectedColumns.forEach((_, idx) => {
                        const key = headers[idx] || `col_${idx + 1}`;
                        obj[key] = row[idx];
                    });
                    return obj;
                });
                return JSON.stringify(objects, null, 2);
            }

            case "json_kv": {
                if (selectedColumns.length < 2) {
                    return JSON.stringify(
                        processedRows.map((r) => r[0] || ""),
                        null,
                        2
                    );
                }
                const dict: Record<string, string> = {};
                for (const row of processedRows) {
                    const key = row[0] || "";
                    if (key) {
                        dict[key] = row.slice(1).join(" ");
                    }
                }
                return JSON.stringify(dict, null, 2);
            }

            case "sql_insert": {
                const tableName = "extracted_data";
                const colNames = headers.map((h) => h.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()).join(", ");
                const insertStatements = processedRows.map((row) => {
                    const values = row.map((val) => `'${val.replace(/'/g, "''")}'`).join(", ");
                    return `INSERT INTO ${tableName} (${colNames}) VALUES (${values});`;
                });
                return insertStatements.join("\n");
            }

            default:
                return "";
        }
    }, [
        parsedMatrix,
        selectedColumns,
        hasHeaders,
        headerRow,
        deduplicateRows,
        outputFormat,
        activeOutputDelim,
        includeHeadersInOutput,
        quoteOutputs
    ]);

    // Extracted matrix for table preview tab
    const extractedTableData = useMemo(() => {
        if (parsedMatrix.length === 0 || selectedColumns.length === 0) return { headers: [], rows: [] };
        const headers = hasHeaders
            ? selectedColumns.map((c) => headerRow[c] || `Column ${c + 1}`)
            : selectedColumns.map((c) => `Column ${c + 1}`);
        const dataRows = hasHeaders ? parsedMatrix.slice(1) : parsedMatrix;
        const rows = dataRows.map((row) => selectedColumns.map((c) => (row[c] !== undefined ? row[c] : "")));
        return { headers, rows };
    }, [parsedMatrix, selectedColumns, hasHeaders, headerRow]);

    // Handle File Upload (.csv, .txt, .tsv, .log)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                setInputText(content);
                // Auto-detect tab or comma
                if (file.name.endsWith(".tsv")) {
                    setInputDelimiter("tab");
                } else if (file.name.endsWith(".csv")) {
                    setInputDelimiter("comma");
                }
            }
        };
        reader.readAsText(file);
    };

    const copyToClipboard = () => {
        if (!extractedOutput) return;
        navigator.clipboard.writeText(extractedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadFile = () => {
        if (!extractedOutput) return;
        let ext = "txt";
        let mime = "text/plain";
        if (outputFormat === "csv") {
            ext = "csv";
            mime = "text/csv";
        } else if (outputFormat === "tsv") {
            ext = "tsv";
            mime = "text/tab-separated-values";
        } else if (outputFormat === "json_array" || outputFormat === "json_kv") {
            ext = "json";
            mime = "application/json";
        } else if (outputFormat === "sql_insert") {
            ext = "sql";
            mime = "application/sql";
        }

        const blob = new Blob([extractedOutput], { type: `${mime};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `extracted_columns_${Date.now()}.${ext}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const loadSample = (sample: typeof SAMPLE_DATASETS[0]) => {
        setInputText(sample.data);
        setInputDelimiter(sample.delimiter);
        setCustomInputDelim(sample.customDelim);
        setHasHeaders(sample.hasHeaders);
        setSelectedColumns([0, 1]);
        setColumnRangeInput("1, 2");
    };

    const handleClear = () => {
        setInputText("");
        setSelectedColumns([]);
        setColumnRangeInput("");
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Text Column Extraction & CSV Delimiter Splitter",
        "url": "https://twistertools.com/tools/text-tools/text-column-extractor",
        "description": "High-performance browser-native text column extractor, CSV delimiter splitter, and TSV parser. Extract custom column indexes, reorder attributes, and convert delimited text into JSON, CSV, TSV, or SQL inserts directly in your browser.",
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
                "name": "What is Text Column Extraction and why is it necessary for data wrangling?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Text column extraction is the programmatic process of parsing multi-column raw files (such as CSV, TSV, Apache logs, and database dumps) to isolate specific positional fields or named headers while discarding unneeded data attributes. It drastically simplifies ETL operations, machine learning feature extraction, and spreadsheet data scrubbing."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool support standard RFC 4180 CSV quotation rules?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The parsing engine accurately handles quoted strings, escaped inner quotation marks, and comma values embedded directly within double-quoted cell strings without incorrectly splitting fields."
                }
            },
            {
                "@type": "Question",
                "name": "Can I extract columns using regular expressions and custom delimiters?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. In addition to standard separators (comma, tab, semicolon, pipe, and space), you can specify custom string delimiters or full regular expressions (e.g., \\s+ for arbitrary whitespace or \\|{2} for double pipes) to parse non-standard server logs and legacy files."
                }
            },
            {
                "@type": "Question",
                "name": "Is my uploaded or pasted CSV data transmitted to external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools executes all CSV parsing, string tokenization, column isolation, and file transformations 100% client-side in your local browser memory. Zero bytes of sensitive enterprise data ever touch a remote server."
                }
            },
            {
                "@type": "Question",
                "name": "How do column ranges work in the extraction selector?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can specify discrete 1-indexed column numbers (e.g., '1, 3, 5') or continuous range spans (e.g., '1-4, 7-9'). You can also click the interactive column badges to instantly toggle individual fields on or off."
                }
            },
            {
                "@type": "Question",
                "name": "What output export formats are supported?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can export the isolated columns as Delimited Text/CSV, Tab-Separated Values (TSV), structured JSON Arrays of objects, JSON Key-Value dictionaries, or ready-to-run SQL INSERT statements."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />


            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Data & Delimiter Engine */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">

                        {/* Input Control Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                                Input Delimited Source
                            </span>

                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".csv,.tsv,.txt,.log,.dat"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
                                >
                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Upload File</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                                    title="Clear Editor"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Clear</span>
                                </button>
                            </div>
                        </div>

                        {/* Input Delimiter Selection Bar */}
                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Scissors className="w-3.5 h-3.5 text-indigo-500" />
                                    Input Delimiter / Splitter:
                                </label>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasHeaders}
                                        onChange={(e) => setHasHeaders(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>First row contains headers</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 pt-1">
                                {(
                                    [
                                        { id: "comma", label: "Comma (,)" },
                                        { id: "tab", label: "Tab (\\t)" },
                                        { id: "pipe", label: "Pipe (|)" },
                                        { id: "semicolon", label: "Semi (;)" },
                                        { id: "space", label: "Space" },
                                        { id: "custom", label: "Custom" },
                                        { id: "regex", label: "Regex" }
                                    ] as { id: DelimiterType; label: string }[]
                                ).map((d) => (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => setInputDelimiter(d.id)}
                                        className={`py-1.5 px-1 rounded-lg text-xs font-bold transition text-center cursor-pointer border ${inputDelimiter === d.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>

                            {/* Conditional Custom / Regex inputs */}
                            {inputDelimiter === "custom" && (
                                <div className="pt-2 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600">Custom String:</span>
                                    <input
                                        type="text"
                                        value={customInputDelim}
                                        onChange={(e) => setCustomInputDelim(e.target.value)}
                                        placeholder="e.g. :: or ~"
                                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none flex-1 font-mono"
                                    />
                                </div>
                            )}

                            {inputDelimiter === "regex" && (
                                <div className="pt-2 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-600">Regex Pattern:</span>
                                    <input
                                        type="text"
                                        value={inputRegexDelim}
                                        onChange={(e) => setInputRegexDelim(e.target.value)}
                                        placeholder="e.g. \s+ or \t+"
                                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none flex-1 font-mono"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Raw Data Textarea */}
                        <div className="space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium text-slate-500">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span>Raw Delimited Content</span>
                                    <span className="text-slate-300 hidden sm:inline">|</span>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Load Sample:</span>
                                        {SAMPLE_DATASETS.map((sample) => (
                                            <button
                                                key={sample.name}
                                                type="button"
                                                onClick={() => loadSample(sample)}
                                                className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-indigo-400 text-[10px] font-bold transition border border-indigo-100/50 dark:border-slate-700 cursor-pointer"
                                            >
                                                {sample.name.split(" ")[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <span className="font-mono">{parsedMatrix.length} rows parsed &bull; {maxColumns} columns detected</span>
                            </div>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste CSV, TSV, log entries, or delimited data here..."
                                rows={12}
                                className="w-full p-3.5 font-mono text-xs text-slate-800 bg-slate-900/5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y transition shadow-inner leading-relaxed"
                                spellCheck={false}
                            />
                        </div>

                        {/* Interactive Column Selector Pills */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Filter className="w-3.5 h-3.5 text-indigo-600" />
                                    Select Columns to Extract:
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllColumns}
                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <button
                                        type="button"
                                        onClick={clearAllColumns}
                                        className="text-[11px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Column Range Input */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Indexes/Ranges:</span>
                                <input
                                    type="text"
                                    value={columnRangeInput}
                                    onChange={handleRangeInputChange}
                                    placeholder="e.g. 1, 2, 4-6"
                                    className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none flex-1"
                                />
                            </div>

                            {/* Interactive Badges Grid */}
                            <div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                                {maxColumns === 0 ? (
                                    <span className="text-xs text-slate-400 italic">No columns detected. Paste delimited text above.</span>
                                ) : (
                                    Array.from({ length: maxColumns }, (_, idx) => {
                                        const isSelected = selectedColumns.includes(idx);
                                        const colHeader = headerRow[idx] ? `"${headerRow[idx]}"` : `Col ${idx + 1}`;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleColumn(idx)}
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${isSelected
                                                    ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <span className="font-mono text-[10px] opacity-75">#{idx + 1}</span>
                                                <span className="max-w-[110px] truncate">{colHeader}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Left Footer Info */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Client-Side Processing Only
                        </span>
                        <span className="font-mono">{selectedColumns.length} of {maxColumns} columns active</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Formatter & Results */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">

                        {/* Output Settings Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Extraction Output & Format
                            </span>

                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab("formatted")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${previewTab === "formatted" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Code / Raw</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab("table")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${previewTab === "table" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Table className="w-3.5 h-3.5" />
                                    <span>Grid Preview</span>
                                </button>
                            </div>
                        </div>

                        {/* Format Selection Grid */}
                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                                Target Export Format:
                            </label>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {(
                                    [
                                        { id: "csv", label: "CSV / Delimited" },
                                        { id: "tsv", label: "TSV (Tabular)" },
                                        { id: "json_array", label: "JSON Array" },
                                        { id: "json_kv", label: "JSON Key-Value" },
                                        { id: "sql_insert", label: "SQL Inserts" },
                                        { id: "text", label: "Custom Delimited" }
                                    ] as { id: OutputFormatType; label: string }[]
                                ).map((fmt) => (
                                    <button
                                        key={fmt.id}
                                        type="button"
                                        onClick={() => setOutputFormat(fmt.id)}
                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer border ${outputFormat === fmt.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {fmt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Options Checkboxes */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-xs font-medium text-slate-700">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeHeadersInOutput}
                                        onChange={(e) => setIncludeHeadersInOutput(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>Include Headers</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={deduplicateRows}
                                        onChange={(e) => setDeduplicateRows(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>Deduplicate Rows</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={quoteOutputs}
                                        onChange={(e) => setQuoteOutputs(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>Wrap in &quot;Quotes&quot;</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={trimWhitespace}
                                        onChange={(e) => setTrimWhitespace(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>Trim Whitespace</span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={removeEmptyLines}
                                        onChange={(e) => setRemoveEmptyLines(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                    />
                                    <span>Strip Empty Rows</span>
                                </label>
                            </div>
                        </div>

                        {/* Main Output Content Container */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                                <span>Output Result</span>
                                <span className="font-mono">
                                    {extractedOutput ? `${extractedOutput.length} characters &bull; ${extractedOutput.split("\n").length} lines` : "0 lines"}
                                </span>
                            </div>

                            {previewTab === "formatted" ? (
                                <textarea
                                    readOnly
                                    value={extractedOutput}
                                    placeholder="Extracted columns will automatically render here..."
                                    rows={13}
                                    className="w-full p-3.5 font-mono text-xs text-slate-800 bg-slate-900/5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-y transition shadow-inner leading-relaxed"
                                    spellCheck={false}
                                />
                            ) : (
                                <div className="border border-slate-300 rounded-xl overflow-x-auto max-h-[300px] overflow-y-auto bg-slate-50">
                                    {extractedTableData.rows.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-slate-400 italic">
                                            No columns selected or data available for table preview.
                                        </div>
                                    ) : (
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead className="bg-slate-200 text-slate-900 sticky top-0 font-bold border-b border-slate-300">
                                                <tr>
                                                    <th className="p-2.5 font-mono text-slate-500 w-10 text-center">#</th>
                                                    {extractedTableData.headers.map((h, i) => (
                                                        <th key={i} className="p-2.5 border-l border-slate-300 whitespace-nowrap">
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 bg-white">
                                                {extractedTableData.rows.map((row, rIdx) => (
                                                    <tr key={rIdx} className="hover:bg-indigo-50/40">
                                                        <td className="p-2 font-mono text-[10px] text-slate-400 text-center">{rIdx + 1}</td>
                                                        {row.map((cell, cIdx) => (
                                                            <td key={cIdx} className="p-2 border-l border-slate-200 font-mono text-slate-800 whitespace-nowrap">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Action Execution Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
                        <button
                            type="button"
                            onClick={copyToClipboard}
                            disabled={!extractedOutput}
                            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? "Copied Extracted Text!" : "Copy Extracted Result"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={downloadFile}
                            disabled={!extractedOutput}
                            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download File</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Column Extraction Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is Text Column Extraction? Architecture, Algorithms, and Core Principles
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Text Column Extraction is the algorithmic decomposition of tabular character streams into positional tokens and dimensional subsets. Across enterprise data engineering, sysadmin triage, and data analysis pipelines, datasets frequently contain dozens of extraneous metrics, sensitive personal identifiers, or unneeded tracking telemetry. Column extraction isolates the exact attributes required for downstream ingestion while preserving record ordering.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unlike rudimentary split utilities that break when encountering quoted comma characters, our RFC 4180-compliant tokenizer tracks string enclosure state machines. This ensures multi-word names containing internal commas (e.g., <code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-mono">&quot;Sanderson, Luke&quot;</code>) remain unified in a single column rather than fragmenting subsequent data fields.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Feature I</span>
                            <h3 className="font-bold text-slate-900 text-sm">RFC 4180 Quotation Engine</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Preserves encapsulated quotes, escaped inner double quotes, and internal delimiter characters without structural data tearing.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Feature II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Regex & Custom Delimiters</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Parse unstructured Apache/Nginx logs, multi-character delimiters (<code className="font-mono text-[11px]">:::</code>), and irregular whitespace using dynamic regex splitters.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Feature III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Polyglot Code Export</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Export isolated columns instantly as Clean CSV, TSV, SQL INSERT batches, or structured JSON dictionaries ready for API consumption.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Delimiter Reference & Parsing Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Delimiter Comparison Matrix & Data Serialization Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct delimiter format ensures seamless compatibility across legacy mainframes, modern cloud databases, and statistical modeling tools:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Delimiter Type</th>
                                    <th className="p-3">Escape Code</th>
                                    <th className="p-3">Standard Standard / RFC</th>
                                    <th className="p-3">Primary Enterprise Use Case</th>
                                    <th className="p-3">Vulnerability / Gotcha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Comma Delimited (CSV)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">,</td>
                                    <td className="p-3 font-mono text-xs">RFC 4180 / MIME text/csv</td>
                                    <td className="p-3 text-xs">Spreadsheets (Excel, Google Sheets), CRM customer exports, financial ledgers</td>
                                    <td className="p-3 text-xs text-rose-600">Freeform text fields often contain natural prose commas, requiring strict quote wrapping.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Tab Separated (TSV)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">\t</td>
                                    <td className="p-3 font-mono text-xs">IANA MIME text/tab-separated-values</td>
                                    <td className="p-3 text-xs">Bioinformatics (FASTA, VCF files), clipboard copy-paste tables, PostgreSQL batch COPY</td>
                                    <td className="p-3 text-xs text-slate-600">Tab characters can be inadvertently flattened into spaces by generic text editors.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Pipe Delimited</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">|</td>
                                    <td className="p-3 font-mono text-xs">Healthcare HL7 / EDIFACT</td>
                                    <td className="p-3 text-xs">Electronic health records, mainframe billing exports, Apache log formatting</td>
                                    <td className="p-3 text-xs text-slate-600">Requires regex escaping (<code className="font-mono text-[11px]">\|</code>) in Unix command-line shell tools like <code className="font-mono text-[11px]">awk</code> and <code className="font-mono text-[11px]">cut</code>.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Semicolon</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">;</td>
                                    <td className="p-3 font-mono text-xs">European Regional Standard</td>
                                    <td className="p-3 text-xs">European financial software where comma (<code className="font-mono text-[11px]">,</code>) is the standard decimal separator</td>
                                    <td className="p-3 text-xs text-slate-600">Causes parse failures when US-configured CSV parsers expect standard comma separation.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Arbitrary Regex Whitespace</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">\s+</td>
                                    <td className="p-3 font-mono text-xs">POSIX Regular Expressions</td>
                                    <td className="p-3 text-xs">Command line utility output (<code className="font-mono text-[11px]">ps aux</code>, <code className="font-mono text-[11px]">netstat</code>, <code className="font-mono text-[11px]">df -h</code>)</td>
                                    <td className="p-3 text-xs text-slate-600">Splits space-separated names or sentences unless fixed column width parsing is configured.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Enterprise Use Cases & Developer Workflows */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Common Real-World Column Extraction Workflows
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Learn how software developers, database administrators, and security analysts leverage column extraction for everyday data workflows:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Security & Devops Logs</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Pipe / Space Delim</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Extract client IP addresses, HTTP response codes, and endpoint paths from web server logs. Transform messy text outputs into structured JSON metrics for incident response or SIEM ingestion.
                            </p>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                                <li>Isolate Column 2 (IP) & Column 5 (Status)</li>
                                <li>Deduplicate unique attacking IPs</li>
                                <li>Export as SQL INSERT statements</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Email Marketing & CRM</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">CSV Standard</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Strip proprietary billing metadata and internal customer IDs from massive CRM database dumps. Isolate only subscriber email addresses and first names for newsletter campaign imports.
                            </p>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                                <li>Select Column 2 (Name) & Column 3 (Email)</li>
                                <li>Enable deduplication to eliminate duplicates</li>
                                <li>Download clean, sanitized CSV</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">ETL & Database Migrations</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">TSV to SQL</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Convert spreadsheet columns and TSV exports into production-ready SQL statements. Map column indexes directly into target schema fields without writing custom Python migration scripts.
                            </p>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                                <li>Filter specific relational columns</li>
                                <li>Select &quot;SQL Inserts&quot; export format</li>
                                <li>Generate batch INSERT query strings</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Tutorial */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Guide: How to Extract Columns & Split Delimited Text
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Paste or Upload Delimited Text</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Paste your raw text into the input editor or click <strong>Upload File</strong> to load any <code className="font-mono text-xs">.csv</code>, <code className="font-mono text-xs">.tsv</code>, <code className="font-mono text-xs">.txt</code>, or <code className="font-mono text-xs">.log</code> file directly into local browser memory.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Select Input Delimiter & Header Mode</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Choose your input separator (Comma, Tab, Pipe, Semicolon, Space, Custom, or Regex). If your file includes column names on the first line, check <strong>&quot;First row contains headers&quot;</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Choose Columns to Extract</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Click the interactive column badges or type custom indexes and ranges into the range selector (e.g. <code className="font-mono text-xs">1, 3, 5-8</code>).
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Configure Transformation & Export Format</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Select your preferred output schema (CSV, TSV, JSON Array, JSON Key-Value, or SQL Inserts). Toggle row deduplication, quotation wrapping, and whitespace trimming as required.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                5
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Copy or Download</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Preview the transformed tabular result in real time via the <strong>Grid Preview</strong> tab, then copy to your clipboard or download the formatted file.
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
                                What is Text Column Extraction and why is it necessary for data wrangling?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Text column extraction is the programmatic process of parsing multi-column raw files (such as CSV, TSV, Apache logs, and database dumps) to isolate specific positional fields or named headers while discarding unneeded data attributes. It drastically simplifies ETL operations, machine learning feature extraction, and spreadsheet data scrubbing.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool support standard RFC 4180 CSV quotation rules?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The parsing engine accurately handles quoted strings, escaped inner quotation marks, and comma values embedded directly within double-quoted cell strings without incorrectly splitting fields.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I extract columns using regular expressions and custom delimiters?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. In addition to standard separators (comma, tab, semicolon, pipe, and space), you can specify custom string delimiters or full regular expressions (e.g., <code className="font-mono text-xs">\s+</code> for arbitrary whitespace or <code className="font-mono text-xs">\|&#123;2&#125;</code> for double pipes) to parse non-standard server logs and legacy files.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my uploaded or pasted CSV data transmitted to external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. TwisterTools executes all CSV parsing, string tokenization, column isolation, and file transformations 100% client-side in your local browser memory. Zero bytes of sensitive enterprise data ever touch a remote server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do column ranges work in the extraction selector?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can specify discrete 1-indexed column numbers (e.g., &apos;1, 3, 5&apos;) or continuous range spans (e.g., &apos;1-4, 7-9&apos;). You can also click the interactive column badges to instantly toggle individual fields on or off.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What output export formats are supported?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can export the isolated columns as Delimited Text/CSV, Tab-Separated Values (TSV), structured JSON Arrays of objects, JSON Key-Value dictionaries, or ready-to-run SQL INSERT statements.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}