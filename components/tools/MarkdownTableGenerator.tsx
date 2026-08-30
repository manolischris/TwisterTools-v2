"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Table,
    Plus,
    Trash2,
    Copy,
    Check,
    Download,
    Upload,
    RotateCcw,
    FileSpreadsheet,
    Code2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    HelpCircle,
    BookOpen,
    Sparkles,
    FileText,
    ArrowUpDown,
    Columns,
    Rows,
    Eye,
    Settings2,
    CheckCircle2,
    AlertCircle,
    Zap,
    ShieldCheck,
    Terminal,
    Layers,
    Binary,
    Cpu,
    CheckSquare,
    Flame,
    FileCode,
    SlidersHorizontal,
    Compass
} from "lucide-react";

type Alignment = "left" | "center" | "right";
type ExportFormat = "markdown" | "csv" | "tsv" | "html" | "json";

interface TableCell {
    id: string;
    value: string;
}

interface ColumnMeta {
    id: string;
    name: string;
    align: Alignment;
}

const INITIAL_COLUMNS: ColumnMeta[] = [
    { id: "col-1", name: "Feature / Item", align: "left" },
    { id: "col-2", name: "Category", align: "left" },
    { id: "col-3", name: "Status", align: "center" },
    { id: "col-4", name: "Priority", align: "right" },
];

const INITIAL_ROWS: TableCell[][] = [
    [
        { id: "c-1-1", value: "Dark Mode Support" },
        { id: "c-1-2", value: "UI/UX" },
        { id: "c-1-3", value: "Completed" },
        { id: "c-1-4", value: "High" },
    ],
    [
        { id: "c-2-1", value: "CSV Importer Engine" },
        { id: "c-2-2", value: "Core Engine" },
        { id: "c-2-3", value: "In Progress" },
        { id: "c-2-4", value: "Critical" },
    ],
    [
        { id: "c-3-1", value: "JSON Schema Export" },
        { id: "c-3-2", value: "Data Pipeline" },
        { id: "c-3-3", value: "Planned" },
        { id: "c-3-4", value: "Medium" },
    ],
    [
        { id: "c-4-1", value: "Mobile Responsive Table" },
        { id: "c-4-2", value: "Layout" },
        { id: "c-4-3", value: "Completed" },
        { id: "c-4-4", value: "High" },
    ],
];

export default function MarkdownTableGenerator() {
    const [columns, setColumns] = useState<ColumnMeta[]>(INITIAL_COLUMNS);
    const [rows, setRows] = useState<TableCell[][]>(INITIAL_ROWS);
    const [activeTab, setActiveTab] = useState<ExportFormat>("markdown");
    const [isPrettyMarkdown, setIsPrettyMarkdown] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);
    const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
    const [importText, setImportText] = useState<string>("");
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Row & Column Operations
    const handleAddRow = () => {
        const newRow: TableCell[] = columns.map((col, idx) => ({
            id: `c-${Date.now()}-${idx}`,
            value: "",
        }));
        setRows([...rows, newRow]);
    };

    const handleRemoveRow = (rowIndex: number) => {
        if (rows.length <= 1) return;
        setRows(rows.filter((_, idx) => idx !== rowIndex));
    };

    const handleAddColumn = () => {
        const newColId = `col-${Date.now()}`;
        const newCol: ColumnMeta = {
            id: newColId,
            name: `Header ${columns.length + 1}`,
            align: "left",
        };
        setColumns([...columns, newCol]);
        setRows(
            rows.map((row) => [
                ...row,
                { id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, value: "" },
            ])
        );
    };

    const handleRemoveColumn = (colIndex: number) => {
        if (columns.length <= 1) return;
        setColumns(columns.filter((_, idx) => idx !== colIndex));
        setRows(rows.map((row) => row.filter((_, idx) => idx !== colIndex)));
    };

    const handleColumnNameChange = (colIndex: number, newName: string) => {
        const updated = [...columns];
        updated[colIndex].name = newName;
        setColumns(updated);
    };

    const handleColumnAlignChange = (colIndex: number, align: Alignment) => {
        const updated = [...columns];
        updated[colIndex].align = align;
        setColumns(updated);
    };

    const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
        const updated = rows.map((r, rIdx) => {
            if (rIdx !== rowIndex) return r;
            return r.map((c, cIdx) => {
                if (cIdx !== colIndex) return c;
                return { ...c, value: val };
            });
        });
        setRows(updated);
    };

    const handleReset = () => {
        setColumns(INITIAL_COLUMNS);
        setRows(INITIAL_ROWS);
        setIsPrettyMarkdown(true);
        setActiveTab("markdown");
    };

    const handleClearContent = () => {
        setRows(
            rows.map((row) =>
                row.map((cell) => ({
                    ...cell,
                    value: "",
                }))
            )
        );
    };

    // Formatter Generators
    const markdownOutput = useMemo(() => {
        if (columns.length === 0) return "";

        const escapePipe = (str: string) => str.replace(/\|/g, "\\|");

        if (!isPrettyMarkdown) {
            const headerLine = `| ${columns.map((c) => escapePipe(c.name || " ")).join(" | ")} |`;
            const delimiterLine = `| ${columns
                .map((c) => {
                    if (c.align === "center") return ":---:";
                    if (c.align === "right") return "---:";
                    return ":---";
                })
                .join(" | ")} |`;
            const bodyLines = rows.map(
                (row) => `| ${row.map((cell) => escapePipe(cell.value || " ")).join(" | ")} |`
            );
            return [headerLine, delimiterLine, ...bodyLines].join("\n");
        }

        // Calculate Column Widths for Pretty Formatting
        const colWidths = columns.map((col, cIdx) => {
            let maxLen = (col.name || "").length;
            rows.forEach((row) => {
                const cellLen = (row[cIdx]?.value || "").length;
                if (cellLen > maxLen) maxLen = cellLen;
            });
            return Math.max(maxLen, 3); // Minimum width 3 chars
        });

        const headerLine =
            "| " +
            columns
                .map((c, idx) => {
                    const val = escapePipe(c.name || "");
                    if (c.align === "right") return val.padStart(colWidths[idx]);
                    if (c.align === "center") {
                        const totalPad = colWidths[idx] - val.length;
                        const padL = Math.floor(totalPad / 2);
                        const padR = totalPad - padL;
                        return " ".repeat(padL) + val + " ".repeat(padR);
                    }
                    return val.padEnd(colWidths[idx]);
                })
                .join(" | ") +
            " |";

        const delimiterLine =
            "| " +
            columns
                .map((c, idx) => {
                    const width = colWidths[idx];
                    if (c.align === "center") return ":" + "-".repeat(Math.max(1, width - 2)) + ":";
                    if (c.align === "right") return "-".repeat(Math.max(1, width - 1)) + ":";
                    return ":" + "-".repeat(Math.max(1, width - 1));
                })
                .join(" | ") +
            " |";

        const bodyLines = rows.map((row) => {
            return (
                "| " +
                columns
                    .map((col, cIdx) => {
                        const val = escapePipe(row[cIdx]?.value || "");
                        if (col.align === "right") return val.padStart(colWidths[cIdx]);
                        if (col.align === "center") {
                            const totalPad = colWidths[cIdx] - val.length;
                            const padL = Math.floor(totalPad / 2);
                            const padR = totalPad - padL;
                            return " ".repeat(padL) + val + " ".repeat(padR);
                        }
                        return val.padEnd(colWidths[cIdx]);
                    })
                    .join(" | ") +
                " |"
            );
        });

        return [headerLine, delimiterLine, ...bodyLines].join("\n");
    }, [columns, rows, isPrettyMarkdown]);

    const csvOutput = useMemo(() => {
        const escapeCsv = (str: string) => {
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        const header = columns.map((c) => escapeCsv(c.name)).join(",");
        const body = rows.map((r) => r.map((c) => escapeCsv(c.value)).join(",")).join("\n");
        return `${header}\n${body}`;
    }, [columns, rows]);

    const tsvOutput = useMemo(() => {
        const header = columns.map((c) => c.name.replace(/\t/g, " ")).join("\t");
        const body = rows
            .map((r) => r.map((c) => c.value.replace(/\t/g, " ")).join("\t"))
            .join("\n");
        return `${header}\n${body}`;
    }, [columns, rows]);

    const htmlOutput = useMemo(() => {
        const thead = `  <thead>\n    <tr>\n${columns
            .map(
                (c) =>
                    `      <th style="text-align: ${c.align};">${c.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</th>`
            )
            .join("\n")}\n    </tr>\n  </thead>`;

        const tbody = `  <tbody>\n${rows
            .map(
                (r) =>
                    `    <tr>\n${r
                        .map(
                            (c, idx) =>
                                `      <td style="text-align: ${columns[idx]?.align || "left"};">${c.value.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`
                        )
                        .join("\n")}\n    </tr>`
            )
            .join("\n")}\n  </tbody>`;

        return `<table>\n${thead}\n${tbody}\n</table>`;
    }, [columns, rows]);

    const jsonOutput = useMemo(() => {
        const data = rows.map((r) => {
            const rowObj: Record<string, string> = {};
            columns.forEach((col, idx) => {
                rowObj[col.name || `col_${idx + 1}`] = r[idx]?.value || "";
            });
            return rowObj;
        });
        return JSON.stringify(data, null, 2);
    }, [columns, rows]);

    const currentExportContent = useMemo(() => {
        switch (activeTab) {
            case "markdown":
                return markdownOutput;
            case "csv":
                return csvOutput;
            case "tsv":
                return tsvOutput;
            case "html":
                return htmlOutput;
            case "json":
                return jsonOutput;
            default:
                return markdownOutput;
        }
    }, [activeTab, markdownOutput, csvOutput, tsvOutput, htmlOutput, jsonOutput]);

    const handleCopy = () => {
        navigator.clipboard.writeText(currentExportContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const extMap: Record<ExportFormat, { ext: string; type: string }> = {
            markdown: { ext: "md", type: "text/markdown" },
            csv: { ext: "csv", type: "text/csv" },
            tsv: { ext: "tsv", type: "text/tab-separated-values" },
            html: { ext: "html", type: "text/html" },
            json: { ext: "json", type: "application/json" },
        };
        const config = extMap[activeTab];
        const blob = new Blob([currentExportContent], { type: `${config.type};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table-export.${config.ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Parsing Importer Logic (Markdown, CSV, TSV)
    const parseImportData = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) {
            setImportError("Input cannot be empty.");
            return;
        }

        const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) {
            setImportError("No valid rows discovered.");
            return;
        }

        // Markdown Table Check
        if (lines[0].includes("|")) {
            const parseMdRow = (line: string) => {
                let cleaned = line.trim();
                if (cleaned.startsWith("|")) cleaned = cleaned.substring(1);
                if (cleaned.endsWith("|")) cleaned = cleaned.slice(0, -1);
                return cleaned.split("|").map((cell) => cell.trim());
            };

            const headerCells = parseMdRow(lines[0]);
            let startRowIdx = 1;
            const newAlignments: Alignment[] = headerCells.map(() => "left");

            if (lines.length > 1 && lines[1].includes("-")) {
                const alignRow = parseMdRow(lines[1]);
                alignRow.forEach((cell, idx) => {
                    const c = cell.trim();
                    if (c.startsWith(":") && c.endsWith(":")) newAlignments[idx] = "center";
                    else if (c.endsWith(":")) newAlignments[idx] = "right";
                    else newAlignments[idx] = "left";
                });
                startRowIdx = 2;
            }

            const parsedCols: ColumnMeta[] = headerCells.map((h, idx) => ({
                id: `col-imp-${idx}-${Date.now()}`,
                name: h || `Header ${idx + 1}`,
                align: newAlignments[idx] || "left",
            }));

            const parsedRows: TableCell[][] = [];
            for (let i = startRowIdx; i < lines.length; i++) {
                const cells = parseMdRow(lines[i]);
                const rowObj: TableCell[] = parsedCols.map((_, cIdx) => ({
                    id: `c-imp-${i}-${cIdx}`,
                    value: cells[cIdx] || "",
                }));
                parsedRows.push(rowObj);
            }

            if (parsedCols.length > 0) {
                setColumns(parsedCols);
                setRows(parsedRows.length > 0 ? parsedRows : [[{ id: "c-empty", value: "" }]]);
                setImportModalOpen(false);
                setImportText("");
                setImportError(null);
                return;
            }
        }

        // CSV / TSV fallback check
        const isTab = lines[0].includes("\t");
        const delimiter = isTab ? "\t" : ",";

        const parseDelimitedLine = (line: string) => {
            if (isTab) return line.split("\t");
            const result: string[] = [];
            let cur = "";
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        cur += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === delimiter && !inQuotes) {
                    result.push(cur.trim());
                    cur = "";
                } else {
                    cur += char;
                }
            }
            result.push(cur.trim());
            return result;
        };

        const headers = parseDelimitedLine(lines[0]);
        const parsedCols: ColumnMeta[] = headers.map((h, idx) => ({
            id: `col-imp-${idx}-${Date.now()}`,
            name: h || `Header ${idx + 1}`,
            align: "left",
        }));

        const parsedRows: TableCell[][] = [];
        for (let i = 1; i < lines.length; i++) {
            const cells = parseDelimitedLine(lines[i]);
            const rowObj: TableCell[] = parsedCols.map((_, cIdx) => ({
                id: `c-imp-${i}-${cIdx}`,
                value: cells[cIdx] || "",
            }));
            parsedRows.push(rowObj);
        }

        setColumns(parsedCols);
        setRows(parsedRows.length > 0 ? parsedRows : [[{ id: "c-empty", value: "" }]]);
        setImportModalOpen(false);
        setImportText("");
        setImportError(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                parseImportData(content);
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Markdown Table Generator & Visual Spreadsheet Exporter",
        "url": "https://twistertools.com/tools/text-tools/markdown-table-generator",
        "description": "Interactive GUI table editor to create, format, align, and export clean Markdown, CSV, TSV, HTML, and JSON tables directly in the browser.",
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
                "name": "How does cell text alignment work in Markdown tables?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Markdown tables use colon syntax within the delimiter divider row (the second row below headers). Colons on both sides (:---:) indicate centered alignment, a colon on the right (---:) denotes right alignment, and a colon on the left or no colon (:--- / ---) defaults to left alignment."
                }
            },
            {
                "@type": "Question",
                "name": "Can I import existing CSV, TSV, or Markdown tables into this generator?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can paste raw Markdown tables, comma-separated values (CSV), or tab-separated values (TSV) from Excel/Google Sheets into the importer modal, or upload a .csv/.md file to automatically populate the visual grid."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Pretty Compact and Standard Markdown tables?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Pretty Markdown dynamically adds padding spaces to columns so every vertical pipe (|) aligns visually in raw text editors. Compact Markdown excludes extra whitespace, generating smaller byte-size payloads while rendering identically in Markdown engines."
                }
            },
            {
                "@type": "Question",
                "name": "How do you handle special characters like pipe symbols (|) inside table cells?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To include a literal pipe character inside a cell without breaking the table structure, this tool automatically escapes it with a backslash (\\|). When rendered by GitHub or static site generators, it displays as a standard pipe."
                }
            },
            {
                "@type": "Question",
                "name": "Are my table contents and uploaded files sent to an external server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All spreadsheet editing, parsing, conversions, and export operations execute 100% locally in your web browser. No data ever leaves your device."
                }
            },
            {
                "@type": "Question",
                "name": "Can I format text inside Markdown table cells with bold, italics, or links?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. GFM specification supports inline markdown such as bold (**text**), italics (*text*), inline code (`code`), strikethrough (~~text~~), and hyperlinks ([title](url)) within table cells."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.tsv,.txt,.md"
                className="hidden"
            />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Interactive Visual Spreadsheet Grid */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        {/* Panel Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">Spreadsheet Matrix</h2>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                    {rows.length} × {columns.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddColumn}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-200"
                                >
                                    <Columns className="w-3.5 h-3.5" />
                                    Add Column
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddRow}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-200"
                                >
                                    <Rows className="w-3.5 h-3.5" />
                                    Add Row
                                </button>
                            </div>
                        </div>

                        {/* Interactive Data Grid Container */}
                        <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[460px] overflow-y-auto relative">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 shadow-xs">
                                    <tr>
                                        <th className="p-2 w-10 text-center text-slate-400 font-bold border-r border-slate-200 bg-slate-100">
                                            #
                                        </th>
                                        {columns.map((col, cIdx) => (
                                            <th key={col.id} className="p-2 min-w-[140px] border-r border-slate-200 bg-slate-100 last:border-r-0">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <input
                                                            type="text"
                                                            value={col.name}
                                                            onChange={(e) => handleColumnNameChange(cIdx, e.target.value)}
                                                            placeholder={`Header ${cIdx + 1}`}
                                                            className="w-full font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:bg-white px-1 py-0.5 rounded outline-none"
                                                        />
                                                        {columns.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveColumn(cIdx)}
                                                                title="Delete Column"
                                                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {/* Alignment Switchers */}
                                                    <div className="flex items-center gap-1 bg-white/70 border border-slate-200 rounded-md p-0.5 w-fit">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleColumnAlignChange(cIdx, "left")}
                                                            title="Align Left"
                                                            className={`p-1 rounded cursor-pointer ${col.align === "left" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                                                        >
                                                            <AlignLeft className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleColumnAlignChange(cIdx, "center")}
                                                            title="Align Center"
                                                            className={`p-1 rounded cursor-pointer ${col.align === "center" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                                                        >
                                                            <AlignCenter className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleColumnAlignChange(cIdx, "right")}
                                                            title="Align Right"
                                                            className={`p-1 rounded cursor-pointer ${col.align === "right" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                                                        >
                                                            <AlignRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {rows.map((row, rIdx) => (
                                        <tr key={`row-${rIdx}`} className="hover:bg-slate-50/70 group">
                                            <td className="p-2 text-center text-slate-400 font-mono font-bold border-r border-slate-200 bg-slate-50/50 group-hover:bg-slate-100">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span>{rIdx + 1}</span>
                                                    {rows.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRow(rIdx)}
                                                            title="Delete Row"
                                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            {row.map((cell, cIdx) => (
                                                <td key={cell.id || `c-${rIdx}-${cIdx}`} className="p-1 border-r border-slate-200 last:border-r-0">
                                                    <input
                                                        type="text"
                                                        value={cell.value}
                                                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                                        placeholder="..."
                                                        style={{ textAlign: columns[cIdx]?.align || "left" }}
                                                        className="w-full px-2 py-1 bg-transparent text-slate-800 rounded border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white outline-none"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Fast Table Utility Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleClearContent}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear Cell Values
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setImportModalOpen(true)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    Import Data
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-rose-200"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Click headers or cells to edit directly</span>
                        <span>Multi-format support</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-time Code Exporter & Previews */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        {/* Format Tabs & Pretty Markdown Switch */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
                                {(["markdown", "csv", "tsv", "html", "json"] as ExportFormat[]).map((fmt) => (
                                    <button
                                        key={fmt}
                                        type="button"
                                        onClick={() => setActiveTab(fmt)}
                                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${activeTab === fmt
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {activeTab === "markdown" && (
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isPrettyMarkdown}
                                        onChange={(e) => setIsPrettyMarkdown(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Aligned Pipes
                                </label>
                            )}
                        </div>

                        {/* Raw Code Preview Terminal */}
                        <div className="relative">
                            <textarea
                                readOnly
                                value={currentExportContent}
                                className="w-full h-[360px] p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 outline-none resize-none focus:ring-1 focus:ring-indigo-500 overflow-x-auto whitespace-pre leading-relaxed"
                            />
                        </div>

                        {/* Formatter Metadata Metric Bar */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Columns</span>
                                <span className="text-sm font-black text-slate-800">{columns.length}</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Rows</span>
                                <span className="text-sm font-black text-slate-800">{rows.length}</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Byte Size</span>
                                <span className="text-sm font-black text-indigo-600">
                                    {new Blob([currentExportContent]).size} B
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard!" : `Copy ${activeTab.toUpperCase()}`}
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>
                </div>
            </div>

            {/* Importer Modal */}
            {importModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-indigo-600" />
                                Import Table Data
                            </h3>
                            <button
                                type="button"
                                onClick={() => setImportModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                            >
                                Close
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                            <span>Paste raw Markdown, CSV, or TSV data:</span>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Or upload a file (.csv, .md, .tsv)
                            </button>
                        </div>

                        <textarea
                            value={importText}
                            onChange={(e) => {
                                setImportText(e.target.value);
                                setImportError(null);
                            }}
                            placeholder="| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |"
                            className="w-full h-40 p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        {importError && (
                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {importError}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setImportModalOpen(false)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => parseImportData(importText)}
                                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                            >
                                Parse & Populate Grid
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Markdown Table Syntax & Alignment Reference */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            GitHub Flavored Markdown (GFM) Table Syntax Guide
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Markdown tables require three structural tiers: a header row separated by vertical pipes, a delimiter alignment row using hyphens and colons, and subsequent data rows. Column alignment is strictly dictated by the position of colons within the delimiter row.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Alignment Type</th>
                                    <th className="p-3">Delimiter Syntax</th>
                                    <th className="p-3">Raw Markdown Example</th>
                                    <th className="p-3">Visual Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Left Aligned (Default)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">:--- or ---</td>
                                    <td className="p-3 font-mono text-xs">| Left |<br />| :--- |<br />| Alpha |</td>
                                    <td className="p-3 text-left">Alpha</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Center Aligned</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">:---:</td>
                                    <td className="p-3 font-mono text-xs">| Center |<br />| :---: |<br />| Beta |</td>
                                    <td className="p-3 text-center">Beta</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Right Aligned</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">---:</td>
                                    <td className="p-3 font-mono text-xs">| Right |<br />| ---: |<br />| $120.00 |</td>
                                    <td className="p-3 text-right font-mono">$120.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Multi-Format Transformation Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Supported Conversion Formats & Export Engines
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Seamlessly bridge documentation and software architectures. The generator synchronizes your matrix across multiple developer-friendly data serialization standards in real-time:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" /> Clean HTML Tables
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Produces semantic <code>&lt;table&gt;</code>, <code>&lt;thead&gt;</code>, and <code>&lt;tbody&gt;</code> tags with embedded inline CSS text alignments, ready for direct integration into static websites and email marketing templates.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-indigo-600" /> JSON Object Arrays
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Formats table columns into JSON keys and row items into strongly typed string dictionaries, making mock API responses and database seed payloads instant.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> RFC 4180 Compliant CSV
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Automatically wraps cell values containing commas, double quotes, or line breaks in standard escaped quote enclosures for flawless imports into Microsoft Excel and Google Sheets.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Pretty-Padded Markdown
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Automatically computes character widths per column to pad cell spaces symmetrically, delivering human-readable raw Markdown files inside GitHub repositories and text editors.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Advanced Inline Markdown Formatting within Table Cells */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Terminal className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Inline Markdown Styling in Table Cells
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Markdown table cells support the full range of standard inline typographic and formatting syntax. You can paste or type any of the following markdown patterns directly into any table cell:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Formatting Style</th>
                                    <th className="p-3">Markdown Syntax to Enter</th>
                                    <th className="p-3">Rendered Result</th>
                                    <th className="p-3">Best Practice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Bold Text</td>
                                    <td className="p-3 font-mono text-xs bg-slate-50">**Important Value**</td>
                                    <td className="p-3 font-bold text-slate-900">Important Value</td>
                                    <td className="p-3 text-xs text-slate-600">Highlight totals, key metrics, and headers</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Italic Emphasis</td>
                                    <td className="p-3 font-mono text-xs bg-slate-50">*Secondary Note*</td>
                                    <td className="p-3 italic text-slate-700">Secondary Note</td>
                                    <td className="p-3 text-xs text-slate-600">Optional flags, metadata notes, or hints</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Inline Code / Monospace</td>
                                    <td className="p-3 font-mono text-xs bg-slate-50">`npm run build`</td>
                                    <td className="p-3"><code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-xs">npm run build</code></td>
                                    <td className="p-3 text-xs text-slate-600">Commands, variable names, and file paths</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Strikethrough</td>
                                    <td className="p-3 font-mono text-xs bg-slate-50">~~Deprecated~~</td>
                                    <td className="p-3 line-through text-slate-400">Deprecated</td>
                                    <td className="p-3 text-xs text-slate-600">Changelogs, retired features, and old prices</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Hyperlink</td>
                                    <td className="p-3 font-mono text-xs bg-slate-50">[Docs](https://...)</td>
                                    <td className="p-3 text-indigo-600 underline">Docs</td>
                                    <td className="p-3 text-xs text-slate-600">API references, tickets, and external resources</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Escaped Pipe Character</td>
                                    <td className="p-3 font-mono text-xs bg-slate-50">\|</td>
                                    <td className="p-3 font-mono">|</td>
                                    <td className="p-3 text-xs text-slate-600">Prevents Markdown parsers from splitting cell columns</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Comparison Table: Markdown vs Other Table Formats */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Data Table Format Comparison & Tradeoffs
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate export format depends on where your data will live and who will consume it. The matrix below outlines the strengths and limitations of each representation:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Format</th>
                                    <th className="p-3">Human Readability</th>
                                    <th className="p-3">Text Alignment</th>
                                    <th className="p-3">Parser Compatibility</th>
                                    <th className="p-3">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Markdown (GFM)</td>
                                    <td className="p-3 text-emerald-700 font-bold">Very High</td>
                                    <td className="p-3 text-emerald-700 font-bold">Native (:---:)</td>
                                    <td className="p-3 text-slate-600">GitHub, GitLab, Obsidian, Static Site Generators</td>
                                    <td className="p-3 text-xs">README files, developer docs, wiki pages</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">CSV (RFC 4180)</td>
                                    <td className="p-3 text-amber-700 font-bold">Moderate</td>
                                    <td className="p-3 text-slate-400">None</td>
                                    <td className="p-3 text-slate-600">Excel, Google Sheets, Pandas, SQL Loaders</td>
                                    <td className="p-3 text-xs">Database migrations, tabular data exports</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">TSV (Tab-Separated)</td>
                                    <td className="p-3 text-amber-700 font-bold">Moderate</td>
                                    <td className="p-3 text-slate-400">None</td>
                                    <td className="p-3 text-slate-600">Bioinformatics, CLI pipelines, Unix cut/awk</td>
                                    <td className="p-3 text-xs">Clipboard pasting between Excel and terminal</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">HTML Table</td>
                                    <td className="p-3 text-slate-500 font-bold">Low (Verbose)</td>
                                    <td className="p-3 text-emerald-700 font-bold">Full CSS styling</td>
                                    <td className="p-3 text-slate-600">Web Browsers, Email Clients, CMS Editors</td>
                                    <td className="p-3 text-xs">HTML newsletters, complex customized web pages</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">JSON Objects</td>
                                    <td className="p-3 text-indigo-700 font-bold">High (for devs)</td>
                                    <td className="p-3 text-slate-400">Application logic</td>
                                    <td className="p-3 text-slate-600">REST APIs, GraphQL, NoSQL Databases, Node.js</td>
                                    <td className="p-3 text-xs">Mock data endpoints, frontend state fixtures</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 5: Step-by-Step Workflow & Best Practices */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Table Generation Workflow
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow this four-step pipeline to construct, refine, and integrate markdown tables into your codebases and documentation systems:
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">1</div>
                            <h3 className="font-bold text-slate-900 text-sm">Define Matrix Shape</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Use the "Add Column" and "Add Row" controls to construct the exact grid dimensions or click "Import Data" to paste an existing CSV/TSV table.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">2</div>
                            <h3 className="font-bold text-slate-900 text-sm">Set Alignments</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Click the Left, Center, or Right alignment toggle buttons underneath each header input to control text orientation across each column.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">3</div>
                            <h3 className="font-bold text-slate-900 text-sm">Input & Edit Cells</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Type values directly into cells. Format text using inline code (` `), bold (** **), italics (* *), or links without breaking table pipes.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">4</div>
                            <h3 className="font-bold text-slate-900 text-sm">Export & Copy</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Switch between Markdown, CSV, TSV, HTML, and JSON tabs in real-time, then click "Copy" or "Download" for instant project integration.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Frequently Asked Questions (FAQ) */}
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
                                How does cell text alignment work in Markdown tables?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Markdown tables use colon syntax within the delimiter divider row (the second row below headers). Colons on both sides (:---:) indicate centered alignment, a colon on the right (---:) denotes right alignment, and a colon on the left or no colon (:--- / ---) defaults to left alignment.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I import existing CSV, TSV, or Markdown tables into this generator?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can paste raw Markdown tables, comma-separated values (CSV), or tab-separated values (TSV) from Excel/Google Sheets into the importer modal, or upload a .csv/.md file to automatically populate the visual grid.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Pretty Compact and Standard Markdown tables?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Pretty Markdown dynamically adds padding spaces to columns so every vertical pipe (|) aligns visually in raw text editors. Compact Markdown excludes extra whitespace, generating smaller byte-size payloads while rendering identically in Markdown engines.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you handle special characters like pipe symbols (|) inside table cells?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To include a literal pipe character inside a cell without breaking the table structure, this tool automatically escapes it with a backslash (\|). When rendered by GitHub or static site generators, it displays as a standard pipe.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my table contents and uploaded files sent to an external server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All spreadsheet editing, parsing, conversions, and export operations execute 100% locally in your web browser. No data ever leaves your device.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I format text inside Markdown table cells with bold, italics, or links?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. GFM specification supports inline markdown such as bold (**text**), italics (*text*), inline code (`code`), strikethrough (~~text~~), and hyperlinks ([title](url)) within table cells.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}