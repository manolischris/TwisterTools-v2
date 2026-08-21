"use client";

import React, { useState, useMemo } from "react";
import {
    Table,
    Plus,
    Trash2,
    Copy,
    Check,
    Download,
    Eye,
    Code,
    Sparkles,
    Settings,
    FileSpreadsheet,
    FileCode,
    Layers,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    ArrowLeftRight,
    AlignLeft,
    AlignCenter,
    AlignRight,
    RefreshCw,
    Maximize2,
    Palette,
    Sliders,
    Monitor,
    Tablet,
    Smartphone
} from "lucide-react";

type ExportFormat = "html-inline" | "html-tailwind" | "html-plain" | "css" | "markdown" | "tsx";
type Alignment = "left" | "center" | "right";

interface TableTheme {
    id: string;
    name: string;
    headerBg: string;
    headerText: string;
    stripeBg: string;
    borderColor: string;
    hoverBg: string;
}

const THEMES: TableTheme[] = [
    {
        id: "indigo",
        name: "Indigo Modern",
        headerBg: "#4f46e5",
        headerText: "#ffffff",
        stripeBg: "#f8fafc",
        borderColor: "#e2e8f0",
        hoverBg: "#eef2ff"
    },
    {
        id: "slate",
        name: "Slate Executive",
        headerBg: "#1e293b",
        headerText: "#ffffff",
        stripeBg: "#f8fafc",
        borderColor: "#cbd5e1",
        hoverBg: "#f1f5f9"
    },
    {
        id: "emerald",
        name: "Emerald Mint",
        headerBg: "#059669",
        headerText: "#ffffff",
        stripeBg: "#f0fdf4",
        borderColor: "#bbf7d0",
        hoverBg: "#dcfce7"
    },
    {
        id: "minimal",
        name: "Minimal Monochrome",
        headerBg: "#f1f5f9",
        headerText: "#0f172a",
        stripeBg: "#ffffff",
        borderColor: "#e2e8f0",
        hoverBg: "#f8fafc"
    }
];

const INITIAL_HEADERS = ["ID", "Full Name", "Role / Department", "Status", "Annual Budget"];
const INITIAL_ROWS = [
    ["101", "Alex Morgan", "Lead UI Architect", "Active", "$145,000"],
    ["102", "Elena Rostova", "Cloud Systems Engineer", "Active", "$162,000"],
    ["103", "Marcus Vance", "Data Science Specialist", "Pending", "$138,000"],
    ["104", "Sarah Jenkins", "Product Design Lead", "Active", "$129,000"]
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

export default function HtmlTableGenerator() {
    // Grid Data State
    const [headers, setHeaders] = useState<string[]>(INITIAL_HEADERS);
    const [rows, setRows] = useState<string[][]>(INITIAL_ROWS);
    const [alignments, setAlignments] = useState<Alignment[]>(["left", "left", "left", "center", "right"]);
    const [caption, setCaption] = useState<string>("Q4 Department Budget & Engineering Personnel Roster");

    // Table Options
    const [hasHeader, setHasHeader] = useState<boolean>(true);
    const [hasFooter, setHasFooter] = useState<boolean>(false);
    const [footerValues, setFooterValues] = useState<string[]>(["Total", "4 Members", "Engineering Team", "3 Active", "$574,000"]);
    const [isStriped, setIsStriped] = useState<boolean>(true);
    const [isBordered, setIsBordered] = useState<boolean>(true);
    const [isHoverable, setIsHoverable] = useState<boolean>(true);
    const [isResponsiveWrap, setIsResponsiveWrap] = useState<boolean>(true);
    const [includeAria, setIncludeAria] = useState<boolean>(true);
    const [cellPadding, setCellPadding] = useState<number>(12);
    const [borderWidth, setBorderWidth] = useState<number>(1);
    const [selectedTheme, setSelectedTheme] = useState<TableTheme>(THEMES[0]);

    // View & Export Controls
    const [activeTab, setActiveTab] = useState<"preview" | "code" | "import">("preview");
    const [exportFormat, setExportFormat] = useState<ExportFormat>("html-inline");
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
    const [importRawText, setImportRawText] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);

    // Row / Column Operations
    const addRow = () => {
        const newRow = new Array(headers.length).fill("");
        setRows([...rows, newRow]);
    };

    const removeRow = (rowIndex: number) => {
        if (rows.length <= 1) return;
        setRows(rows.filter((_, idx) => idx !== rowIndex));
    };

    const addColumn = () => {
        const colNum = headers.length + 1;
        setHeaders([...headers, `Column ${colNum}`]);
        setAlignments([...alignments, "left"]);
        setRows(rows.map((row) => [...row, ""]));
        setFooterValues([...footerValues, ""]);
    };

    const removeColumn = (colIndex: number) => {
        if (headers.length <= 1) return;
        setHeaders(headers.filter((_, idx) => idx !== colIndex));
        setAlignments(alignments.filter((_, idx) => idx !== colIndex));
        setRows(rows.map((row) => row.filter((_, idx) => idx !== colIndex)));
        setFooterValues(footerValues.filter((_, idx) => idx !== colIndex));
    };

    const updateHeader = (colIndex: number, value: string) => {
        const next = [...headers];
        next[colIndex] = value;
        setHeaders(next);
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const next = rows.map((r, rIdx) => {
            if (rIdx === rowIndex) {
                const newRow = [...r];
                newRow[colIndex] = value;
                return newRow;
            }
            return r;
        });
        setRows(next);
    };

    const updateFooter = (colIndex: number, value: string) => {
        const next = [...footerValues];
        next[colIndex] = value;
        setFooterValues(next);
    };

    const updateAlignment = (colIndex: number, align: Alignment) => {
        const next = [...alignments];
        next[colIndex] = align;
        setAlignments(next);
    };

    const handleReset = () => {
        setHeaders(INITIAL_HEADERS);
        setRows(INITIAL_ROWS);
        setAlignments(["left", "left", "left", "center", "right"]);
        setCaption("Q4 Department Budget & Engineering Personnel Roster");
        setHasHeader(true);
        setHasFooter(false);
        setIsStriped(true);
        setIsBordered(true);
        setIsHoverable(true);
        setCellPadding(12);
        setBorderWidth(1);
        setSelectedTheme(THEMES[0]);
    };

    // CSV / TSV / Markdown Importer
    const handleImport = () => {
        if (!importRawText.trim()) return;

        const lines = importRawText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) return;

        // Check if markdown table format (starts or contains pipes)
        const isMarkdown = lines[0].includes("|");

        let parsedGrid: string[][] = [];

        if (isMarkdown) {
            const cleanLines = lines.filter((l) => !l.replace(/\|/g, "").trim().startsWith("---"));
            parsedGrid = cleanLines.map((l) =>
                l.split("|").map((c) => c.trim()).filter((c, idx, arr) => {
                    // Filter empty edge tokens caused by leading/trailing pipes
                    if ((idx === 0 || idx === arr.length - 1) && c === "") return false;
                    return true;
                })
            );
        } else {
            // Determine delimiter: Tab or Comma
            const delimiter = lines[0].includes("\t") ? "\t" : ",";
            parsedGrid = lines.map((line) => {
                // Basic CSV / TSV split
                return line.split(delimiter).map((val) => val.trim().replace(/^["']|["']$/g, ""));
            });
        }

        if (parsedGrid.length > 0) {
            const maxCols = Math.max(...parsedGrid.map((r) => r.length));
            const normalized = parsedGrid.map((r) => {
                while (r.length < maxCols) r.push("");
                return r;
            });

            setHeaders(normalized[0]);
            setRows(normalized.slice(1).length > 0 ? normalized.slice(1) : [new Array(maxCols).fill("")]);
            setAlignments(new Array(maxCols).fill("left"));
            setFooterValues(new Array(maxCols).fill(""));
            setActiveTab("preview");
            setImportRawText("");
        }
    };

    // Generated Code Synthesizers
    const generatedHTML = useMemo(() => {
        const borderStyle = isBordered ? `border: ${borderWidth}px solid ${selectedTheme.borderColor};` : "border: none;";
        const collapseStyle = "border-collapse: collapse; width: 100%; font-family: system-ui, -apple-system, sans-serif; font-size: 14px;";
        const padStyle = `padding: ${cellPadding}px;`;

        let code = "";
        if (isResponsiveWrap) {
            code += `<div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">\n`;
        }

        code += `<table style="${collapseStyle} ${borderStyle}"${includeAria ? ` role="table" aria-label="${caption || "Data Table"}"` : ""}>\n`;

        if (caption.trim()) {
            code += `  <caption style="caption-side: top; text-align: left; font-weight: bold; margin-bottom: 8px; color: #334155;">\n    ${caption}\n  </caption>\n`;
        }

        if (hasHeader) {
            code += `  <thead>\n    <tr style="background-color: ${selectedTheme.headerBg}; color: ${selectedTheme.headerText}; text-align: left;">\n`;
            headers.forEach((h, i) => {
                const align = alignments[i] ? ` text-align: ${alignments[i]};` : "";
                const border = isBordered ? ` border: ${borderWidth}px solid ${selectedTheme.borderColor};` : "";
                code += `      <th scope="col" style="${padStyle}${border}${align}">${h}</th>\n`;
            });
            code += `    </tr>\n  </thead>\n`;
        }

        code += `  <tbody>\n`;
        rows.forEach((row, rIdx) => {
            const isStripe = isStriped && rIdx % 2 === 1;
            const bg = isStripe ? `background-color: ${selectedTheme.stripeBg};` : "background-color: #ffffff;";
            code += `    <tr style="${bg}">\n`;
            row.forEach((cell, cIdx) => {
                const align = alignments[cIdx] ? ` text-align: ${alignments[cIdx]};` : "";
                const border = isBordered ? ` border: ${borderWidth}px solid ${selectedTheme.borderColor};` : "";
                code += `      <td style="${padStyle}${border}${align}">${cell}</td>\n`;
            });
            code += `    </tr>\n`;
        });
        code += `  </tbody>\n`;

        if (hasFooter) {
            code += `  <tfoot>\n    <tr style="background-color: #f1f5f9; font-weight: bold; color: #0f172a;">\n`;
            footerValues.forEach((f, i) => {
                const align = alignments[i] ? ` text-align: ${alignments[i]};` : "";
                const border = isBordered ? ` border: ${borderWidth}px solid ${selectedTheme.borderColor};` : "";
                code += `      <td style="${padStyle}${border}${align}">${f}</td>\n`;
            });
            code += `    </tr>\n  </tfoot>\n`;
        }

        code += `</table>`;
        if (isResponsiveWrap) {
            code += `\n</div>`;
        }

        return code;
    }, [
        headers,
        rows,
        alignments,
        caption,
        hasHeader,
        hasFooter,
        footerValues,
        isStriped,
        isBordered,
        isResponsiveWrap,
        includeAria,
        cellPadding,
        borderWidth,
        selectedTheme
    ]);

    const generatedTailwindHTML = useMemo(() => {
        let code = "";
        if (isResponsiveWrap) {
            code += `<div class="overflow-x-auto w-full rounded-xl border border-slate-200 shadow-xs">\n`;
        }

        code += `  <table class="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700 font-sans"${includeAria ? ` aria-label="${caption || "Data Table"}"` : ""}>\n`;

        if (caption.trim()) {
            code += `    <caption class="text-left font-bold text-slate-900 px-4 py-2 bg-slate-50 border-b border-slate-200">\n      ${caption}\n    </caption>\n`;
        }

        if (hasHeader) {
            code += `    <thead class="bg-indigo-600 text-white font-semibold">\n      <tr>\n`;
            headers.forEach((h, i) => {
                const align = alignments[i] === "center" ? " text-center" : alignments[i] === "right" ? " text-right" : " text-left";
                code += `        <th scope="col" class="px-4 py-3${align}">${h}</th>\n`;
            });
            code += `      </tr>\n    </thead>\n`;
        }

        code += `    <tbody class="divide-y divide-slate-200 bg-white">\n`;
        rows.forEach((row, rIdx) => {
            const stripeClass = isStriped && rIdx % 2 === 1 ? " bg-slate-50/70" : "";
            const hoverClass = isHoverable ? " hover:bg-indigo-50/50 transition-colors" : "";
            code += `      <tr class="${stripeClass}${hoverClass}">\n`;
            row.forEach((cell, cIdx) => {
                const align = alignments[cIdx] === "center" ? " text-center" : alignments[cIdx] === "right" ? " text-right" : " text-left";
                code += `        <td class="px-4 py-3 text-slate-800${align}">${cell}</td>\n`;
            });
            code += `      </tr>\n`;
        });
        code += `    </tbody>\n`;

        if (hasFooter) {
            code += `    <tfoot class="bg-slate-100 font-bold text-slate-900">\n      <tr>\n`;
            footerValues.forEach((f, i) => {
                const align = alignments[i] === "center" ? " text-center" : alignments[i] === "right" ? " text-right" : " text-left";
                code += `        <td class="px-4 py-3${align}">${f}</td>\n`;
            });
            code += `      </tr>\n    </tfoot>\n`;
        }

        code += `  </table>`;
        if (isResponsiveWrap) {
            code += `\n</div>`;
        }

        return code;
    }, [
        headers,
        rows,
        alignments,
        caption,
        hasHeader,
        hasFooter,
        footerValues,
        isStriped,
        isHoverable,
        isResponsiveWrap,
        includeAria
    ]);

    const generatedPlainHTML = useMemo(() => {
        let code = `<table>\n`;
        if (caption.trim()) {
            code += `  <caption>${caption}</caption>\n`;
        }
        if (hasHeader) {
            code += `  <thead>\n    <tr>\n`;
            headers.forEach((h) => {
                code += `      <th>${h}</th>\n`;
            });
            code += `    </tr>\n  </thead>\n`;
        }
        code += `  <tbody>\n`;
        rows.forEach((row) => {
            code += `    <tr>\n`;
            row.forEach((c) => {
                code += `      <td>${c}</td>\n`;
            });
            code += `    </tr>\n`;
        });
        code += `  </tbody>\n`;
        if (hasFooter) {
            code += `  <tfoot>\n    <tr>\n`;
            footerValues.forEach((f) => {
                code += `      <td>${f}</td>\n`;
            });
            code += `    </tr>\n  </tfoot>\n`;
        }
        code += `</table>`;
        return code;
    }, [headers, rows, caption, hasHeader, hasFooter, footerValues]);

    const generatedPureCSS = useMemo(() => {
        return `/* Custom Modern Table Stylesheet */
.custom-table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1.5rem 0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #1e293b;
  border: ${borderWidth}px solid ${selectedTheme.borderColor};
}

.custom-table caption {
  caption-side: top;
  font-weight: 700;
  text-align: left;
  padding: 0.5rem 0;
  color: #334155;
}

.custom-table th,
.custom-table td {
  padding: ${cellPadding}px;
  border: ${borderWidth}px solid ${selectedTheme.borderColor};
}

.custom-table th {
  background-color: ${selectedTheme.headerBg};
  color: ${selectedTheme.headerText};
  font-weight: 600;
}

${isStriped ? `.custom-table tbody tr:nth-child(even) {
  background-color: ${selectedTheme.stripeBg};
}` : ""}

${isHoverable ? `.custom-table tbody tr:hover {
  background-color: ${selectedTheme.hoverBg};
  transition: background-color 0.15s ease-in-out;
}` : ""}

.custom-table tfoot {
  background-color: #f8fafc;
  font-weight: 700;
  color: #0f172a;
}`;
    }, [borderWidth, selectedTheme, cellPadding, isStriped, isHoverable]);

    const generatedMarkdown = useMemo(() => {
        let md = "";
        if (caption.trim()) {
            md += `### ${caption}\n\n`;
        }
        md += `| ${headers.join(" | ")} |\n`;
        const aligns = alignments.map((a) => {
            if (a === "center") return ":---:";
            if (a === "right") return "---:";
            return ":---";
        });
        md += `| ${aligns.join(" | ")} |\n`;

        rows.forEach((row) => {
            md += `| ${row.join(" | ")} |\n`;
        });

        if (hasFooter) {
            md += `| ${footerValues.join(" | ")} |\n`;
        }

        return md;
    }, [caption, headers, alignments, rows, hasFooter, footerValues]);

    const generatedTSX = useMemo(() => {
        return `import React from 'react';

export default function CustomDataTable() {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-sm border-collapse" aria-label="${caption || "Data Table"}">
        ${caption ? `<caption className="text-left font-bold text-slate-800 p-3 bg-slate-50 border-b border-slate-200">
          ${caption}
        </caption>` : ""}
        ${hasHeader ? `<thead className="bg-indigo-600 text-white font-semibold">
          <tr>
            ${headers.map((h, i) => `<th scope="col" className="p-3 text-${alignments[i]}">${h}</th>`).join("\n            ")}
          </tr>
        </thead>` : ""}
        <tbody className="divide-y divide-slate-200 bg-white">
          ${rows.map((r, rIdx) => `<tr className="${isStriped && rIdx % 2 === 1 ? "bg-slate-50" : ""} hover:bg-indigo-50/40">
            ${r.map((c, cIdx) => `<td className="p-3 text-${alignments[cIdx]} text-slate-700">${c}</td>`).join("\n            ")}
          </tr>`).join("\n          ")}
        </tbody>
        ${hasFooter ? `<tfoot className="bg-slate-100 font-bold text-slate-900">
          <tr>
            ${footerValues.map((f, i) => `<td className="p-3 text-${alignments[i]}">${f}</td>`).join("\n            ")}
          </tr>
        </tfoot>` : ""}
      </table>
    </div>
  );
}`;
    }, [caption, hasHeader, headers, alignments, rows, isStriped, hasFooter, footerValues]);

    const activeCodeOutput = useMemo(() => {
        switch (exportFormat) {
            case "html-inline":
                return generatedHTML;
            case "html-tailwind":
                return generatedTailwindHTML;
            case "html-plain":
                return generatedPlainHTML;
            case "css":
                return generatedPureCSS;
            case "markdown":
                return generatedMarkdown;
            case "tsx":
                return generatedTSX;
            default:
                return generatedHTML;
        }
    }, [exportFormat, generatedHTML, generatedTailwindHTML, generatedPlainHTML, generatedPureCSS, generatedMarkdown, generatedTSX]);

    const handleCopy = () => {
        navigator.clipboard.writeText(activeCodeOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        let extension = "html";
        let mimeType = "text/html";

        if (exportFormat === "css") {
            extension = "css";
            mimeType = "text/css";
        } else if (exportFormat === "markdown") {
            extension = "md";
            mimeType = "text/markdown";
        } else if (exportFormat === "tsx") {
            extension = "tsx";
            mimeType = "text/typescript";
        }

        const blob = new Blob([activeCodeOutput], { type: `${mimeType};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `table-code.${extension}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "HTML Table Code Generator",
        "url": "https://twistertools.com/tools/developer-tools/html-table-generator",
        "description": "Visual responsive HTML table generator and editor. Generate clean, accessible semantic HTML tables, Tailwind CSS classes, React TSX, Markdown, and CSS stylesheets with live preview.",
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
                "name": "What is the correct semantic structure of an HTML table?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A fully accessible, semantic HTML table consists of the <table> element, an optional <caption>, a <thead> element with <th> column headers (utilizing scope='col'), a <tbody> enclosing data rows (<tr>) and cells (<td>), and an optional <tfoot> for column summaries."
                }
            },
            {
                "@type": "Question",
                "name": "How do you make HTML tables responsive on mobile screens?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The industry gold-standard approach is wrapping the <table> in a container <div> with CSS properties: overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;. Alternatively, responsive CSS flexbox or CSS grid transforms can stack tabular data for mobile viewports."
                }
            },
            {
                "@type": "Question",
                "name": "Why is the scope attribute important in table header <th> tags?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The scope attribute (scope='col' or scope='row') provides essential structural context for screen readers and assistive technology (WCAG 2.1 AAA compliance), linking header cells to their corresponding data columns or rows."
                }
            },
            {
                "@type": "Question",
                "name": "Can I import existing CSV, TSV, or Markdown tables?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Simply paste your delimited CSV, TSV, or GitHub-flavored Markdown table into the Import tab to instantly convert and edit your data structure in real time."
                }
            },
            {
                "@type": "Question",
                "name": "What export formats does this table builder support?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This generator outputs Inline CSS HTML, Tailwind CSS markup, Pure HTML5, Modular CSS Stylesheets, Markdown Tables, and React JSX/TSX functional components."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Main Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Visual Table Grid Editor & Styling Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Header Controls */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Table Structure & Data
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={addRow}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Row
                                </button>
                                <button
                                    onClick={addColumn}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Col
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                                    title="Reset Defaults"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Reset
                                </button>
                            </div>
                        </div>

                        {/* Caption Input */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Table Caption & Title
                            </label>
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Enter table caption (e.g., Annual Sales Summary)"
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50"
                            />
                        </div>

                        {/* Interactive Data Grid Editor */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Interactive Grid ({rows.length} Rows × {headers.length} Cols)
                                </label>
                                <span className="text-[11px] text-slate-400">Directly edit cell contents</span>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[360px] bg-slate-50/30">
                                <table className="min-w-full divide-y divide-slate-200 text-xs border-collapse">
                                    <thead className="bg-slate-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-2 w-10 text-center text-slate-400 font-medium">#</th>
                                            {headers.map((h, colIdx) => (
                                                <th key={colIdx} className="p-2 min-w-[130px]">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <input
                                                                type="text"
                                                                value={h}
                                                                onChange={(e) => updateHeader(colIdx, e.target.value)}
                                                                className="w-full px-2 py-1 font-bold rounded border border-slate-300 bg-white text-slate-900 outline-none focus:border-indigo-500"
                                                                placeholder={`Col ${colIdx + 1}`}
                                                            />
                                                            <button
                                                                onClick={() => removeColumn(colIdx)}
                                                                disabled={headers.length <= 1}
                                                                className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                                                                title="Delete Column"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        {/* Alignment switchers */}
                                                        <div className="flex items-center justify-center gap-1 bg-white p-0.5 rounded border border-slate-200">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateAlignment(colIdx, "left")}
                                                                className={`p-0.5 rounded ${alignments[colIdx] === "left" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-700"}`}
                                                                title="Align Left"
                                                            >
                                                                <AlignLeft className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateAlignment(colIdx, "center")}
                                                                className={`p-0.5 rounded ${alignments[colIdx] === "center" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-700"}`}
                                                                title="Align Center"
                                                            >
                                                                <AlignCenter className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateAlignment(colIdx, "right")}
                                                                className={`p-0.5 rounded ${alignments[colIdx] === "right" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-700"}`}
                                                                title="Align Right"
                                                            >
                                                                <AlignRight className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="p-2 w-10 text-center text-slate-400">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {rows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-slate-50/80">
                                                <td className="p-2 text-center text-slate-400 font-mono text-[10px]">
                                                    {rIdx + 1}
                                                </td>
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx} className="p-1.5">
                                                        <input
                                                            type="text"
                                                            value={cell}
                                                            onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                                            className={`w-full px-2 py-1 rounded border border-slate-200 text-slate-800 outline-none focus:border-indigo-500 text-${alignments[cIdx]}`}
                                                            placeholder="Cell value"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => removeRow(rIdx)}
                                                        disabled={rows.length <= 1}
                                                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                                                        title="Delete Row"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {hasFooter && (
                                            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                                                <td className="p-2 text-center text-slate-500 font-mono text-[10px]">Foot</td>
                                                {footerValues.map((fVal, cIdx) => (
                                                    <td key={cIdx} className="p-1.5">
                                                        <input
                                                            type="text"
                                                            value={fVal}
                                                            onChange={(e) => updateFooter(cIdx, e.target.value)}
                                                            className={`w-full px-2 py-1 rounded border border-slate-300 bg-white font-bold text-slate-900 outline-none focus:border-indigo-500 text-${alignments[cIdx]}`}
                                                            placeholder="Footer summary"
                                                        />
                                                    </td>
                                                ))}
                                                <td />
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Theme & Styling Configurator */}
                        <div className="space-y-3 pt-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Palette className="w-4 h-4 text-indigo-600" />
                                Theme & Aesthetic Presets
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.id}
                                        type="button"
                                        onClick={() => setSelectedTheme(theme)}
                                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${selectedTheme.id === theme.id
                                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div
                                            className="w-full h-3 rounded-sm"
                                            style={{ backgroundColor: theme.headerBg }}
                                        />
                                        <span>{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toggle Switches */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasHeader}
                                    onChange={(e) => setHasHeader(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                Header (`&lt;thead&gt;`)
                            </label>

                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasFooter}
                                    onChange={(e) => setHasFooter(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                Footer (`&lt;tfoot&gt;`)
                            </label>

                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isStriped}
                                    onChange={(e) => setIsStriped(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                Striped Rows (Zebra)
                            </label>

                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isBordered}
                                    onChange={(e) => setIsBordered(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                Cell Borders
                            </label>

                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isHoverable}
                                    onChange={(e) => setIsHoverable(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                Hover Highlight
                            </label>

                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isResponsiveWrap}
                                    onChange={(e) => setIsResponsiveWrap(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                Responsive Wrapper
                            </label>
                        </div>

                        {/* Numeric Sliders for Spacing & Borders */}
                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>Cell Padding</span>
                                    <span>{cellPadding}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="4"
                                    max="24"
                                    value={cellPadding}
                                    onChange={(e) => setCellPadding(Number(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>Border Thickness</span>
                                    <span>{borderWidth}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="4"
                                    value={borderWidth}
                                    onChange={(e) => setBorderWidth(Number(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Semantic WCAG Accessible
                        </span>
                        <span>HTML5 & CSS3 Standard</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Live Preview, Export Code & Delimited Importer */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        {/* Top View Selector Tabs */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveTab("preview")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === "preview"
                                        ? "bg-white text-indigo-600 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Live Preview
                                </button>
                                <button
                                    onClick={() => setActiveTab("code")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === "code"
                                        ? "bg-white text-indigo-600 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Code className="w-3.5 h-3.5" />
                                    Generated Code
                                </button>
                                <button
                                    onClick={() => setActiveTab("import")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === "import"
                                        ? "bg-white text-indigo-600 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Import CSV / MD
                                </button>
                            </div>

                            {activeTab === "preview" && (
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setPreviewDevice("desktop")}
                                        className={`p-1.5 rounded ${previewDevice === "desktop" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
                                        title="Desktop View"
                                    >
                                        <Monitor className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setPreviewDevice("tablet")}
                                        className={`p-1.5 rounded ${previewDevice === "tablet" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
                                        title="Tablet View"
                                    >
                                        <Tablet className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setPreviewDevice("mobile")}
                                        className={`p-1.5 rounded ${previewDevice === "mobile" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
                                        title="Mobile View"
                                    >
                                        <Smartphone className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Format Switcher (Visible in Code Tab) */}
                        {activeTab === "code" && (
                            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
                                {[
                                    { id: "html-inline", label: "Inline HTML" },
                                    { id: "html-tailwind", label: "Tailwind CSS" },
                                    { id: "html-plain", label: "Plain HTML5" },
                                    { id: "css", label: "CSS Stylesheet" },
                                    { id: "markdown", label: "Markdown Table" },
                                    { id: "tsx", label: "React TSX" }
                                ].map((fmt) => (
                                    <button
                                        key={fmt.id}
                                        onClick={() => setExportFormat(fmt.id as ExportFormat)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${exportFormat === fmt.id
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900 bg-white/60"
                                            }`}
                                    >
                                        {fmt.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tab Content 1: Live Interactive Render Preview */}
                        {activeTab === "preview" && (
                            <div className="space-y-3">
                                <div
                                    className={`mx-auto transition-all duration-300 border border-slate-200 rounded-xl p-4 bg-slate-50/50 ${previewDevice === "mobile"
                                        ? "max-w-[340px]"
                                        : previewDevice === "tablet"
                                            ? "max-w-[540px]"
                                            : "w-full"
                                        }`}
                                >
                                    <div className="overflow-x-auto w-full">
                                        <table
                                            className="w-full border-collapse text-xs sm:text-sm font-sans"
                                            style={{
                                                border: isBordered ? `${borderWidth}px solid ${selectedTheme.borderColor}` : "none"
                                            }}
                                        >
                                            {caption.trim() && (
                                                <caption className="text-left font-bold text-slate-800 pb-2">
                                                    {caption}
                                                </caption>
                                            )}

                                            {hasHeader && (
                                                <thead>
                                                    <tr style={{ backgroundColor: selectedTheme.headerBg, color: selectedTheme.headerText }}>
                                                        {headers.map((h, i) => (
                                                            <th
                                                                key={i}
                                                                className={`font-semibold text-${alignments[i]}`}
                                                                style={{
                                                                    padding: `${cellPadding}px`,
                                                                    border: isBordered ? `${borderWidth}px solid ${selectedTheme.borderColor}` : "none"
                                                                }}
                                                            >
                                                                {h || `Column ${i + 1}`}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                            )}

                                            <tbody>
                                                {rows.map((row, rIdx) => {
                                                    const isStripe = isStriped && rIdx % 2 === 1;
                                                    return (
                                                        <tr
                                                            key={rIdx}
                                                            style={{
                                                                backgroundColor: isStripe ? selectedTheme.stripeBg : "#ffffff"
                                                            }}
                                                            className={isHoverable ? "hover:opacity-90 transition" : ""}
                                                        >
                                                            {row.map((cell, cIdx) => (
                                                                <td
                                                                    key={cIdx}
                                                                    className={`text-slate-800 text-${alignments[cIdx]}`}
                                                                    style={{
                                                                        padding: `${cellPadding}px`,
                                                                        border: isBordered ? `${borderWidth}px solid ${selectedTheme.borderColor}` : "none"
                                                                    }}
                                                                >
                                                                    {cell || "—"}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>

                                            {hasFooter && (
                                                <tfoot>
                                                    <tr className="bg-slate-100 font-bold text-slate-900">
                                                        {footerValues.map((f, i) => (
                                                            <td
                                                                key={i}
                                                                className={`text-${alignments[i]}`}
                                                                style={{
                                                                    padding: `${cellPadding}px`,
                                                                    border: isBordered ? `${borderWidth}px solid ${selectedTheme.borderColor}` : "none"
                                                                }}
                                                            >
                                                                {f}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </div>
                                <p className="text-center text-[11px] text-slate-400">
                                    Simulating {previewDevice.toUpperCase()} viewport dimensions. Scroll horizontally if needed.
                                </p>
                            </div>
                        )}

                        {/* Tab Content 2: Synthesized Code Output */}
                        {activeTab === "code" && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <pre className="bg-slate-950 text-indigo-300 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800">
                                        <code>{activeCodeOutput}</code>
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Tab Content 3: Raw Delimited Text Importer */}
                        {activeTab === "import" && (
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Paste CSV, TSV, or Markdown Table Data
                                </label>
                                <textarea
                                    value={importRawText}
                                    onChange={(e) => setImportRawText(e.target.value)}
                                    rows={8}
                                    placeholder={`Example CSV:\nName, Position, Office, Salary\nTiger Nixon, System Architect, Edinburgh, $320,800\nGarrett Winters, Accountant, Tokyo, $170,750\n\nOr Markdown Table:\n| Name | Position | Office |\n|---|---|---|\n| Tiger Nixon | System Architect | Edinburgh |`}
                                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 text-slate-900 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={handleImport}
                                    disabled={!importRawText.trim()}
                                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
                                >
                                    Parse & Populate Table Grid
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard!" : "Copy Code"}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export File
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Semantic HTML Table Structure & Accessibility Standards */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Semantic HTML5 Architecture & WCAG 2.1 Accessibility Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        HTML tables are engineered strictly for presenting <strong>two-dimensional tabular data</strong>—relational data organized across structured columns and rows. Modern web design standards dictate that tables should never be used for overall page layout, as this damages screen-reader navigation and search engine indexing.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-indigo-600" /> Semantic Hierarchy Tags
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>&lt;table&gt;:</strong> The master root wrapper defining tabular semantics.</li>
                                <li><strong>&lt;caption&gt;:</strong> Describes table intent for accessibility; always place immediately after &lt;table&gt;.</li>
                                <li><strong>&lt;thead&gt;:</strong> Groups header content across columns.</li>
                                <li><strong>&lt;tbody&gt;:</strong> Encapsulates primary body data records.</li>
                                <li><strong>&lt;tfoot&gt;:</strong> Houses summary calculations, totals, or notes.</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Screen Reader Scoping
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Assistive screen readers (like NVDA, JAWS, and VoiceOver) announce table cell values in tandem with their corresponding headers. Utilizing <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">scope="col"</code> and <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">scope="row"</code> ensures compliant WCAG 2.1 Level AAA navigation.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg font-mono text-xs">
                                &lt;th scope="col"&gt;Revenue&lt;/th&gt;
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Responsive HTML Table Engineering Techniques */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Engineering Responsive HTML Tables for Mobile Viewports
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Wide data matrices naturally conflict with mobile smartphone screen constraints. When tabular data exceeds viewport width, developers can choose between three architectural paradigms:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Technique</th>
                                    <th className="p-3">Implementation Method</th>
                                    <th className="p-3">Pros</th>
                                    <th className="p-3">Best Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Horizontal Scroll Wrapper</td>
                                    <td className="p-3 font-mono text-xs">overflow-x: auto;</td>
                                    <td className="p-3 text-emerald-700">Preserves original 2D layout perfectly</td>
                                    <td className="p-3">Financial records, spreadsheets, stats</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">CSS Pseudo-Attribute Stack</td>
                                    <td className="p-3 font-mono text-xs">td::before &#123; content: attr(data-label); &#125;</td>
                                    <td className="p-3 text-indigo-700">Converts rows into vertical cards</td>
                                    <td className="p-3">E-commerce specs, product rosters</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Column Toggle / Priority</td>
                                    <td className="p-3 font-mono text-xs">@media (max-width: 640px) &#123; .hide &#125;</td>
                                    <td className="p-3 text-amber-700">Hides secondary non-critical metrics</td>
                                    <td className="p-3">Admin dashboards, user directories</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Step-by-Step Practical Implementation Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Settings className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Code Walkthroughs: From Pure HTML to React Components
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example A: Clean Tailwind CSS Roster</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Utility CSS</span>
                            </div>
                            <pre className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                                {`<table class="w-full text-left text-sm">
  <thead class="bg-indigo-600 text-white font-semibold">
    <tr>
      <th class="p-3">Plan</th>
      <th class="p-3 text-right">Price</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-slate-200">
    <tr class="hover:bg-indigo-50/50">
      <td class="p-3 font-medium">Starter</td>
      <td class="p-3 text-right">$19/mo</td>
    </tr>
  </tbody>
</table>`}
                            </pre>
                            <p className="text-xs text-slate-600">
                                Tailwind utility classes allow rapid styling of border colors, cell typography, and dynamic hover states without writing external CSS stylesheets.
                            </p>
                        </div>

                        {/* Example 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example B: Accessible Markdown Table</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Documentation</span>
                            </div>
                            <pre className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                                {`| Feature Name | Free Tier | Enterprise |
|:-------------|:---------:|-----------:|
| API Access   |  1,000/d  |  Unlimited |
| SLA Uptime   |   99.5%   |     99.99% |
| Dedicated IP |     No    |        Yes |`}
                            </pre>
                            <p className="text-xs text-slate-600">
                                Markdown tables use colons (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">:---:</code>) within the delimiter row to define left, center, and right text alignment.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
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
                                What is the correct semantic structure of an HTML table?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A fully accessible, semantic HTML table consists of the <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;table&gt;</code> element, an optional <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;caption&gt;</code>, a <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;thead&gt;</code> element with <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;th&gt;</code> column headers (utilizing <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">scope="col"</code>), a <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;tbody&gt;</code> enclosing data rows (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;tr&gt;</code>) and cells (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;td&gt;</code>), and an optional <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;tfoot&gt;</code> for column summaries.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you make HTML tables responsive on mobile screens?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The industry gold-standard approach is wrapping the <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;table&gt;</code> in a container <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">&lt;div&gt;</code> with CSS properties: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;</code>. Alternatively, responsive CSS flexbox or CSS grid transforms can stack tabular data for mobile viewports.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is the scope attribute important in table header &lt;th&gt; tags?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The scope attribute (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">scope="col"</code> or <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">scope="row"</code>) provides essential structural context for screen readers and assistive technology (WCAG 2.1 AAA compliance), linking header cells to their corresponding data columns or rows.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I import existing CSV, TSV, or Markdown tables?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Simply paste your delimited CSV, TSV, or GitHub-flavored Markdown table into the Import tab to instantly convert and edit your data structure in real time.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What export formats does this table builder support?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This generator outputs Inline CSS HTML, Tailwind CSS markup, Pure HTML5, Modular CSS Stylesheets, Markdown Tables, and React JSX/TSX functional components.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}