"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Table,
    Eye,
    EyeOff,
    Copy,
    Check,
    Trash2,
    Sparkles,
    Plus,
    Minus,
    AlignLeft,
    AlignCenter,
    AlignRight,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Terminal,
    Layers,
    Code,
    FileSpreadsheet,
    MessageSquare,
    RotateCcw
} from "lucide-react";

type ColumnAlignment = "left" | "center" | "right";

interface TableColumn {
    id: string;
    header: string;
    align: ColumnAlignment;
}

interface TableRow {
    id: string;
    cells: string[];
}

const SAMPLE_PRESETS = {
    specs: {
        title: "Hardware Comparison",
        spoilerText: "The newer model outperforms the predecessor by 42% in synthetic benchmark rendering passes.",
        columns: [
            { id: "col-1", header: "Component", align: "left" as ColumnAlignment },
            { id: "col-2", header: "Current Gen", align: "center" as ColumnAlignment },
            { id: "col-3", header: "Next Gen Flagship", align: "right" as ColumnAlignment }
        ],
        rows: [
            { id: "row-1", cells: ["Compute Architecture", "Octa-Core 3.4GHz", "16-Core 4.2GHz Turbo"] },
            { id: "row-2", cells: ["Unified Memory Bus", "32 GB LPDDR5", "64 GB LPDDR5X"] },
            { id: "row-3", cells: ["Thermal Envelope (TDP)", "65 Watts", "105 Watts Peak"] },
            { id: "row-4", cells: ["Target MSRP", "$399 USD", "$649 USD"] }
        ]
    },
    tierList: {
        title: "Gaming Tier Matrix",
        spoilerText: "Secret S-Tier unlock requirements will be revealed during the official World Championship finale stream.",
        columns: [
            { id: "col-1", header: "Rank Tier", align: "center" as ColumnAlignment },
            { id: "col-2", header: "Primary Character", align: "left" as ColumnAlignment },
            { id: "col-3", header: "Winrate Ratio", align: "right" as ColumnAlignment }
        ],
        rows: [
            { id: "row-1", cells: ["S-Tier", "Valkyrie Vanguard", "56.4%"] },
            { id: "row-2", cells: ["A-Tier", "Shadow Stalker", "52.1%"] },
            { id: "row-3", cells: ["B-Tier", "Iron Juggernaut", "49.8%"] },
            { id: "row-4", cells: ["C-Tier", "Arcane Scholar", "45.2%"] }
        ]
    },
    communityRules: {
        title: "Subreddit Rules & Guidance",
        spoilerText: "Repeated infractions will trigger automated 14-day posting cooldowns enforced by Automoderator bot rules.",
        columns: [
            { id: "col-1", header: "Policy Rule", align: "left" as ColumnAlignment },
            { id: "col-2", header: "Classification", align: "center" as ColumnAlignment },
            { id: "col-3", header: "Enforcement Action", align: "left" as ColumnAlignment }
        ],
        rows: [
            { id: "row-1", cells: ["Rule 1: Civility", "Strict", "Immediate comment removal and warning"] },
            { id: "row-2", cells: ["Rule 2: No Self-Promotion", "Standard", "Post removal; recurring links blacklisted"] },
            { id: "row-3", cells: ["Rule 3: Unmarked Spoilers", "Critical", "Automated thread lock + spoiler tag injection"] }
        ]
    }
};

export default function RedditMarkdownFormatter() {
    const [columns, setColumns] = useState<TableColumn[]>(SAMPLE_PRESETS.specs.columns);
    const [rows, setRows] = useState<TableRow[]>(SAMPLE_PRESETS.specs.rows);
    const [spoilerText, setSpoilerText] = useState<string>(SAMPLE_PRESETS.specs.spoilerText);
    const [includeSpoilerTag, setIncludeSpoilerTag] = useState<boolean>(true);
    const [spoilerRevealed, setSpoilerRevealed] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"builder" | "quickCsv">("builder");
    const [csvInput, setCsvInput] = useState<string>("");

    const rawSpoilerInputId = useId();
    const csvInputAreaId = useId();

    // Alignment helper for markdown syntax
    const getAlignmentIndicator = (align: ColumnAlignment): string => {
        switch (align) {
            case "left":
                return ":---";
            case "center":
                return ":---:";
            case "right":
                return "---:";
            default:
                return ":---";
        }
    };

    // Sanitize cell text for Reddit markdown tables (escape pipes)
    const sanitizeTableCell = (text: string): string => {
        return text.replace(/\|/g, "\\|").trim();
    };

    // Add Column
    const handleAddColumn = () => {
        const newColIndex = columns.length + 1;
        const newColId = `col-${Date.now()}`;
        setColumns([...columns, { id: newColId, header: `Header ${newColIndex}`, align: "left" }]);
        setRows(rows.map((row) => ({ ...row, cells: [...row.cells, `Cell ${newColIndex}`] })));
    };

    // Remove Column
    const handleRemoveColumn = (indexToRemove: number) => {
        if (columns.length <= 1) return;
        setColumns(columns.filter((_, idx) => idx !== indexToRemove));
        setRows(rows.map((row) => ({
            ...row,
            cells: row.cells.filter((_, idx) => idx !== indexToRemove)
        })));
    };

    // Add Row
    const handleAddRow = () => {
        const newRowId = `row-${Date.now()}`;
        const emptyCells = columns.map((_, idx) => `Data ${idx + 1}`);
        setRows([...rows, { id: newRowId, cells: emptyCells }]);
    };

    // Remove Row
    const handleRemoveRow = (indexToRemove: number) => {
        if (rows.length <= 1) return;
        setRows(rows.filter((_, idx) => idx !== indexToRemove));
    };

    // Update Column Header
    const handleHeaderChange = (index: number, value: string) => {
        const updated = [...columns];
        updated[index].header = value;
        setColumns(updated);
    };

    // Update Column Alignment
    const handleAlignmentChange = (index: number, align: ColumnAlignment) => {
        const updated = [...columns];
        updated[index].align = align;
        setColumns(updated);
    };

    // Update Cell Text
    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const updatedRows = [...rows];
        const updatedCells = [...updatedRows[rowIndex].cells];
        updatedCells[colIndex] = value;
        updatedRows[rowIndex].cells = updatedCells;
        setRows(updatedRows);
    };

    // Parse CSV / TSV into Table
    const handleConvertCsv = () => {
        if (!csvInput.trim()) return;

        const lines = csvInput.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) return;

        // Detect comma or tab
        const delimiter = lines[0].includes("\t") ? "\t" : ",";
        const parsedRows = lines.map((line) =>
            line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, "").trim())
        );

        const colCount = Math.max(...parsedRows.map((r) => r.length));
        if (colCount === 0) return;

        const firstLine = parsedRows[0];
        const newCols: TableColumn[] = Array.from({ length: colCount }).map((_, idx) => ({
            id: `col-${Date.now()}-${idx}`,
            header: firstLine[idx] || `Header ${idx + 1}`,
            align: "left"
        }));

        const newBodyRows: TableRow[] = parsedRows.slice(1).map((rowItems, rowIdx) => {
            const cells = Array.from({ length: colCount }).map((_, colIdx) => rowItems[colIdx] || "");
            return {
                id: `row-${Date.now()}-${rowIdx}`,
                cells
            };
        });

        setColumns(newCols);
        setRows(newBodyRows.length > 0 ? newBodyRows : [{ id: `row-${Date.now()}-empty`, cells: newCols.map(() => "") }]);
        setActiveTab("builder");
    };

    // Reset Table
    const handleReset = (presetKey: keyof typeof SAMPLE_PRESETS) => {
        const preset = SAMPLE_PRESETS[presetKey];
        setColumns(preset.columns);
        setRows(preset.rows);
        setSpoilerText(preset.spoilerText);
    };

    // Generated Reddit Markdown Payload
    const generatedMarkdown = useMemo(() => {
        if (columns.length === 0) return "";

        const headerLine = `| ${columns.map((c) => sanitizeTableCell(c.header || " ")).join(" | ")} |`;
        const alignLine = `| ${columns.map((c) => getAlignmentIndicator(c.align)).join(" | ")} |`;
        const bodyLines = rows.map((r) => {
            const rowContent = columns.map((_, colIdx) => sanitizeTableCell(r.cells[colIdx] || " ")).join(" | ");
            return `| ${rowContent} |`;
        });

        let output = `${headerLine}\n${alignLine}\n${bodyLines.join("\n")}`;

        if (includeSpoilerTag && spoilerText.trim()) {
            output += `\n\n>!${spoilerText.trim()}!<`;
        }

        return output;
    }, [columns, rows, spoilerText, includeSpoilerTag]);

    // Copy to Clipboard
    const handleCopy = () => {
        if (!generatedMarkdown) return;
        navigator.clipboard.writeText(generatedMarkdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Total table cells
    const totalCells = columns.length * rows.length;

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Reddit Table and Spoilers Markdown Formatter",
        "url": "https://twistertools.com/tools/social-tools/reddit-markdown-formatter",
        "description": "Visual grid generator and syntax formatter for Reddit markdown tables, column alignments, pipe escaping, and official >!spoiler!< tags.",
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
                "name": "How do you create a table in Reddit markdown syntax?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Reddit tables require a header row separated by vertical pipes (|), followed by a mandatory alignment delimiter row (such as |:---|:---:|---:|), and corresponding data rows. An empty newline before and after the table block is required for Reddit's parser to recognize and render the table."
                }
            },
            {
                "@type": "Question",
                "name": "What is the proper syntax for formatting Reddit spoiler tags?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Reddit spoilers require closing brackets and exclamation marks without inner whitespace: >!spoiler text goes here!<. If you accidentally leave spaces adjacent to the exclamation points (e.g. >! spoiler !<), the spoiler tag will fail to obscure text on older Reddit layouts, mobile web, and legacy applications."
                }
            },
            {
                "@type": "Question",
                "name": "How do I align table columns to the left, center, or right on Reddit?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Alignment is configured using colons on the second row delimiter. Use :--- for left alignment, :---: for centered text, and ---: for right alignment. Reddit's parser will format the entire column according to this specification."
                }
            },
            {
                "@type": "Question",
                "name": "Can you put spoiler tags or clickable links inside Reddit table cells?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Individual cells support standard Reddit inline markdown, including bold (**bold**), italics (*italic*), hyperlinks ([text](url)), and inline spoilers (>!hidden text!<). However, cell contents cannot contain unescaped vertical pipes (|); you must escape them with a backslash (\\|)."
                }
            },
            {
                "@type": "Question",
                "name": "Why does my Reddit markdown table show up as broken plain text?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The most common reasons are: missing the second delimiter row (|---|), omitting an empty line before the table begins, posting while in the 'Rich Text / Fancy Pants' editor instead of 'Markdown Mode', or forgetting to escape raw pipe characters inside the content."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool work with both Old Reddit and New Reddit (sh.reddit)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. This generator creates strict CommonMark and Reddit Flavored Markdown (RFM) compliant output tested for seamless rendering across new Reddit, old.reddit.com, official iOS and Android apps, and third-party mobile readers."
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
                {/* Left Panel: Table Builder & Controls (Col 7) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("builder")}
                                className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === "builder"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                            >
                                <Table className="w-4 h-4" /> Visual Grid
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("quickCsv")}
                                className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === "quickCsv"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                            >
                                <FileSpreadsheet className="w-4 h-4" /> Import CSV / TSV
                            </button>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Presets:</span>
                            <button
                                type="button"
                                onClick={() => handleReset("specs")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Specs
                            </button>
                            <button
                                type="button"
                                onClick={() => handleReset("tierList")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Tier List
                            </button>
                            <button
                                type="button"
                                onClick={() => handleReset("communityRules")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Rules
                            </button>
                        </div>
                    </div>

                    {activeTab === "builder" ? (
                        <div className="space-y-4">
                            {/* Grid Controls: Add/Remove Row & Column Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAddColumn}
                                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition cursor-pointer flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-indigo-600" /> Add Column
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddRow}
                                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition cursor-pointer flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-indigo-600" /> Add Row
                                    </button>
                                </div>
                                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                    {columns.length} Cols × {rows.length} Rows ({totalCells} Cells)
                                </span>
                            </div>

                            {/* Editable Interactive Table Grid */}
                            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-w-full">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                            <th className="p-2 w-10 text-center text-slate-600 dark:text-slate-300 font-mono">#</th>
                                            {columns.map((col, cIdx) => (
                                                <th key={col.id} className="p-2 min-w-[150px] space-y-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            value={col.header}
                                                            onChange={(e) => handleHeaderChange(cIdx, e.target.value)}
                                                            aria-label={`Column ${cIdx + 1} header title`}
                                                            placeholder={`Col ${cIdx + 1}`}
                                                            className="w-full px-2 py-1 font-bold text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        />
                                                        {columns.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveColumn(cIdx)}
                                                                title="Delete this column"
                                                                aria-label={`Delete column ${cIdx + 1}`}
                                                                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 justify-start">
                                                        <span className="text-[10px] text-slate-600 dark:text-slate-300">Align:</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAlignmentChange(cIdx, "left")}
                                                            title="Align Left"
                                                            aria-label={`Align column ${cIdx + 1} left`}
                                                            className={`p-1 rounded transition cursor-pointer ${col.align === "left"
                                                                    ? "bg-indigo-600 text-white"
                                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                                }`}
                                                        >
                                                            <AlignLeft className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAlignmentChange(cIdx, "center")}
                                                            title="Align Center"
                                                            aria-label={`Align column ${cIdx + 1} center`}
                                                            className={`p-1 rounded transition cursor-pointer ${col.align === "center"
                                                                    ? "bg-indigo-600 text-white"
                                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                                }`}
                                                        >
                                                            <AlignCenter className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAlignmentChange(cIdx, "right")}
                                                            title="Align Right"
                                                            aria-label={`Align column ${cIdx + 1} right`}
                                                            className={`p-1 rounded transition cursor-pointer ${col.align === "right"
                                                                    ? "bg-indigo-600 text-white"
                                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                                }`}
                                                        >
                                                            <AlignRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {rows.map((row, rIdx) => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="p-2 text-center text-slate-600 dark:text-slate-300 font-mono text-[11px] align-middle">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span>{rIdx + 1}</span>
                                                        {rows.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveRow(rIdx)}
                                                                title="Delete this row"
                                                                aria-label={`Delete row ${rIdx + 1}`}
                                                                className="text-slate-600 dark:text-slate-300 hover:text-rose-600 cursor-pointer p-0.5"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                {columns.map((_, cIdx) => (
                                                    <td key={`cell-${rIdx}-${cIdx}`} className="p-1.5">
                                                        <input
                                                            type="text"
                                                            value={row.cells[cIdx] || ""}
                                                            onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                                            aria-label={`Row ${rIdx + 1} Column ${cIdx + 1} value`}
                                                            placeholder="—"
                                                            className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* CSV/TSV Importer Tab */
                        <div className="space-y-3">
                            <label htmlFor={csvInputAreaId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Paste Comma-Separated (CSV) or Tab-Separated (TSV) Data:
                            </label>
                            <textarea
                                id={csvInputAreaId}
                                rows={8}
                                value={csvInput}
                                onChange={(e) => setCsvInput(e.target.value)}
                                aria-label="CSV or spreadsheet text input for conversion"
                                placeholder={`Item,Category,Price\nMechanical Keyboard,Peripherals,$129\nUltraWide Monitor,Displays,$449\nErgonomic Mouse,Peripherals,$79`}
                                className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed transition resize-y"
                            />
                            <button
                                type="button"
                                onClick={handleConvertCsv}
                                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" /> Convert to Interactive Grid
                            </button>
                        </div>
                    )}

                    {/* Spoiler Tag Configuration Card */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={includeSpoilerTag}
                                    onChange={(e) => setIncludeSpoilerTag(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Append Reddit Spoiler Tag (&gt;!spoiler!&lt;)</span>
                            </label>
                            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                Native RFM Syntax
                            </span>
                        </div>

                        {includeSpoilerTag && (
                            <div className="space-y-1.5">
                                <label htmlFor={rawSpoilerInputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Spoiler Content (Auto-wrapped in &gt;! and !&lt; without spaces):
                                </label>
                                <textarea
                                    id={rawSpoilerInputId}
                                    rows={2}
                                    value={spoilerText}
                                    onChange={(e) => setSpoilerText(e.target.value)}
                                    aria-label="Spoiler markdown text input"
                                    placeholder="Add spoiler context or hidden analysis here..."
                                    className="w-full p-2.5 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Reddit Preview & Markdown Output (Col 5 - Sticky) */}
                <div className="lg:col-span-5 lg:sticky lg:top-6 self-start space-y-6 min-w-0">
                    {/* Simulated Reddit Rendered Preview Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Reddit UI Preview
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Live Simulation
                            </span>
                        </div>

                        {/* Reddit Post Mockup Container */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                                    r/
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">r/technology</span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-300">• 2h ago</span>
                            </div>

                            {/* Rendered Table */}
                            <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800/80">
                                            {columns.map((c, idx) => (
                                                <th
                                                    key={`preview-head-${idx}`}
                                                    style={{ textAlign: c.align }}
                                                    className="p-2 font-bold text-slate-900 dark:text-white border-r last:border-r-0 border-slate-300 dark:border-slate-700"
                                                >
                                                    {c.header || `Col ${idx + 1}`}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {rows.map((r, rIdx) => (
                                            <tr key={`preview-row-${rIdx}`} className="even:bg-slate-100/50 dark:even:bg-slate-900/40">
                                                {columns.map((c, cIdx) => (
                                                    <td
                                                        key={`preview-cell-${rIdx}-${cIdx}`}
                                                        style={{ textAlign: c.align }}
                                                        className="p-2 text-slate-800 dark:text-slate-200 border-r last:border-r-0 border-slate-200 dark:border-slate-800"
                                                    >
                                                        {r.cells[cIdx] || " "}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Rendered Interactive Spoiler Box */}
                            {includeSpoilerTag && spoilerText.trim() && (
                                <div className="pt-2">
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                                        <span>Click spoiler block below to test reveal state:</span>
                                    </p>
                                    <div
                                        onClick={() => setSpoilerRevealed(!spoilerRevealed)}
                                        className={`p-2.5 rounded-lg text-xs cursor-pointer transition select-none flex items-center justify-between ${spoilerRevealed
                                                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                                                : "bg-slate-800 dark:bg-slate-700 text-transparent hover:bg-slate-700"
                                            }`}
                                    >
                                        <span className={spoilerRevealed ? "" : "blur-xs select-none"}>
                                            {spoilerRevealed ? spoilerText : "••••••••••••••••••••••••••••••••••••••••••••••••••"}
                                        </span>
                                        <div className="ml-2 text-slate-600 dark:text-slate-300 shrink-0">
                                            {spoilerRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-300" />}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Raw Reddit Markdown Output Container */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Code className="w-3.5 h-3.5 text-indigo-600" />
                                    Reddit Markdown Output:
                                </label>
                                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                    {generatedMarkdown.length} chars
                                </span>
                            </div>

                            <pre className="p-3 bg-slate-950 text-indigo-300 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 max-h-56 leading-relaxed whitespace-pre select-all">
                                {generatedMarkdown || "/* Markdown will appear here */"}
                            </pre>
                        </div>

                        {/* Primary Copy Action Button */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!generatedMarkdown}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-white" />
                                    <span>Copied! Ready to Paste on Reddit</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 text-white" />
                                    <span>Copy Reddit Markdown</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mandatory Platform Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Breakdown of Reddit Tables & Delimiters */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Mastering Reddit Markdown Tables: Architecture, Pipes, and Alignment Delimiters
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Reddit utilizes Reddit Flavored Markdown (RFM), a specialized variant of CommonMark combined with GitHub Flavored Markdown (GFM) extensions. While text formatting such as bolding and lists is straightforward, constructing multi-column tables requires adhering strictly to pipe-and-hyphen schema rules. A single missing delimiter or misplaced whitespace will break the table parser, displaying an unreadable wall of raw vertical lines to readers.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Table className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 1. Header Structure
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The first row determines your column names. Each cell must be separated by a vertical bar (<code className="font-mono text-indigo-600 dark:text-indigo-400">|</code>). Leading and trailing pipes are recommended to guarantee cross-client compatibility.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <AlignCenter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 2. Alignment Row
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The second row is non-negotiable. It defines text direction: <code className="font-mono text-indigo-600 dark:text-indigo-400">:---</code> for left-aligned, <code className="font-mono text-indigo-600 dark:text-indigo-400">:---:</code> for centered, and <code className="font-mono text-indigo-600 dark:text-indigo-400">---:</code> for right-aligned columns.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <EyeOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 3. Spoiler Tags
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Spoiler markup uses <code className="font-mono text-indigo-600 dark:text-indigo-400">&gt;!text!&lt;</code> syntax. Any whitespace between the exclamation mark and the letters causes parsing failure on Old Reddit and third-party mobile apps.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Valid Markdown vs Broken Markdown Comparison
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Observe how Reddit parses strict delimiter lines versus common syntax errors that cause entire table layouts to fail:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`// Clean, Functional Reddit Markdown Table:
| Rank | Feature Title | Status |
| :---: | :--- | ---: |
| 01 | Unified GPU Pipeline | Available |
| 02 | High Dynamic Range | Beta >!Protected!< |

// Broken Markdown (Missing blank lines and incorrect spoiler spacing):
Rank | Feature Title | Status
--- | --- | ---
01 | Unified GPU Pipeline | Available
>! Broken spoiler with outer spaces !<`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Matrix: Reddit Table Editors & Formatting Solutions
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Comparing different methods to generate, balance, and format structured tables and hidden spoiler segments on Reddit:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Methodology</th>
                                    <th className="p-3">Column Alignment Control</th>
                                    <th className="p-3">Cross-Platform (Old + New Reddit)</th>
                                    <th className="p-3">Spoiler Syntax Integration</th>
                                    <th className="p-3">Usability Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">TwisterTools Formatter</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Visual 1-Click Left/Center/Right</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">100% Guaranteed RFM Compliance</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Automated Zero-Space &gt;!tag!&lt;</td>
                                    <td className="p-3 text-emerald-600 font-bold">Instant & Error-Free</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Reddit Fancy Pants GUI</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Basic alignment only</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Occasionally breaks on Old Reddit</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Requires separate highlight toolbar</td>
                                    <td className="p-3 text-amber-600">Prone to unexpected backslash escapes</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Manual Pipe Typing</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Manual hyphen & colon typing</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">Fails if single delimiter missing</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Frequently broken by accidental spaces</td>
                                    <td className="p-3 text-rose-600">High friction & slow</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Spreadsheet Copy-Paste (Raw)</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">None (Pasted as raw tabs)</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">Renders as broken code block</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Not supported</td>
                                    <td className="p-3 text-rose-600">Incompatible without parser</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for High-Karma Reddit Formatting */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Subreddit Formatting Standards: 5 Guidelines for Maximum Upvotes
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        High-effort posts featuring structured tables, benchmark matrices, and properly obscured spoilers routinely earn community stickies, awards, and top upvotes. Follow these verified formatting principles:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Always Surround with Empty Lines:</strong> Always leave one full blank line before your header row and after your final table row to prevent parser collisions.
                                </li>
                                <li>
                                    • <strong>Numeric Columns Right-Aligned:</strong> Align numbers, percentages, and currencies to the right (<code className="font-mono text-indigo-600 dark:text-indigo-400">---:</code>) for immediate vertical comparison.
                                </li>
                                <li>
                                    • <strong>Keep Column Counts Mobile-Friendly:</strong> Avoid tables with more than 4-5 columns, as smartphone screens will require awkward horizontal scrolling.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Pitfalls to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Unescaped Pipes in Cells:</strong> If a cell contains a vertical pipe character, it will break table columns unless escaped as <code className="font-mono text-indigo-600 dark:text-indigo-400">\|</code>.
                                </li>
                                <li>
                                    • <strong>Spaces Adjacent to Spoiler Tags:</strong> Writing <code className="font-mono text-indigo-600 dark:text-indigo-400">&gt;! spoiler !&lt;</code> breaks on Old Reddit and will get your comment removed by moderators for visible spoilers.
                                </li>
                                <li>
                                    • <strong>Switching Modes in New Reddit:</strong> If you paste raw markdown while inside the &ldquo;Fancy Pants&rdquo; rich-text editor, Reddit escapes every pipe with backslashes. Always switch to &ldquo;Markdown Mode&rdquo; before pasting.
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
                                How do you create a table in Reddit markdown syntax?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Reddit tables require a header row separated by vertical pipes (|), followed by a mandatory alignment delimiter row (such as |:---|:---:|---:|), and corresponding data rows. An empty newline before and after the table block is required for Reddit&apos;s parser to recognize and render the table.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the proper syntax for formatting Reddit spoiler tags?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Reddit spoilers require closing brackets and exclamation marks without inner whitespace: &gt;!spoiler text goes here!&lt;. If you accidentally leave spaces adjacent to the exclamation points (e.g. &gt;! spoiler !&lt;), the spoiler tag will fail to obscure text on older Reddit layouts, mobile web, and legacy applications.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do I align table columns to the left, center, or right on Reddit?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Alignment is configured using colons on the second row delimiter. Use :--- for left alignment, :---: for centered text, and ---: for right alignment. Reddit&apos;s parser will format the entire column according to this specification.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can you put spoiler tags or clickable links inside Reddit table cells?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Individual cells support standard Reddit inline markdown, including bold (**bold**), italics (*italic*), hyperlinks ([text](url)), and inline spoilers (&gt;!hidden text!&lt;). However, cell contents cannot contain unescaped vertical pipes (|); you must escape them with a backslash (\\|).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why does my Reddit markdown table show up as broken plain text?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The most common reasons are: missing the second delimiter row (|---|), omitting an empty line before the table begins, posting while in the &ldquo;Rich Text / Fancy Pants&rdquo; editor instead of &ldquo;Markdown Mode&rdquo;, or forgetting to escape raw pipe characters inside the content.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this tool work with both Old Reddit and New Reddit (sh.reddit)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. This generator creates strict CommonMark and Reddit Flavored Markdown (RFM) compliant output tested for seamless rendering across new Reddit, old.reddit.com, official iOS and Android apps, and third-party mobile readers.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}