"use client";

import React, { useState, useMemo } from "react";
import {
    LayoutGrid,
    Copy,
    Check,
    RotateCcw,
    Plus,
    Trash2,
    Sliders,
    Code2,
    Eye,
    Settings2,
    HelpCircle,
    BookOpen,
    Layers,
    Boxes,
    Maximize2,
    Sparkles,
    CheckCircle2,
    Lightbulb,
    FileCode,
    Cpu
} from "lucide-react";

type UnitType = "fr" | "px" | "%" | "auto" | "minmax";

interface TrackDefinition {
    id: string;
    unit: UnitType;
    value: string;
    min?: string;
    max?: string;
}

interface GridChildItem {
    id: string;
    name: string;
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
    bgHex: string;
}

const PRESET_COLORS = [
    "#4f46e5", // Indigo 600
    "#0284c7", // Sky 600
    "#0d9488", // Teal 600
    "#16a34a", // Green 600
    "#d97706", // Amber 600
    "#dc2626", // Red 600
    "#7c3aed", // Violet 600
    "#db2777", // Pink 600
];

const PRESETS = [
    {
        name: "Holy Grail Layout",
        rows: [
            { id: "r1", unit: "auto" as UnitType, value: "auto" },
            { id: "r2", unit: "fr" as UnitType, value: "1" },
            { id: "r3", unit: "auto" as UnitType, value: "auto" },
        ],
        cols: [
            { id: "c1", unit: "px" as UnitType, value: "100" },
            { id: "c2", unit: "fr" as UnitType, value: "1" },
            { id: "c3", unit: "px" as UnitType, value: "100" },
        ],
        gapX: 16,
        gapY: 16,
        items: [
            { id: "item-1", name: "Header", colStart: 1, colEnd: 4, rowStart: 1, rowEnd: 2, bgHex: "#4f46e5" },
            { id: "item-2", name: "Sidebar L", colStart: 1, colEnd: 2, rowStart: 2, rowEnd: 3, bgHex: "#0284c7" },
            { id: "item-3", name: "Main Content", colStart: 2, colEnd: 3, rowStart: 2, rowEnd: 3, bgHex: "#0d9488" },
            { id: "item-4", name: "Sidebar R", colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3, bgHex: "#7c3aed" },
            { id: "item-5", name: "Footer", colStart: 1, colEnd: 4, rowStart: 3, rowEnd: 4, bgHex: "#d97706" },
        ],
    },
    {
        name: "Responsive Dashboard",
        rows: [
            { id: "r1", unit: "auto" as UnitType, value: "auto" },
            { id: "r2", unit: "fr" as UnitType, value: "1" },
            { id: "r3", unit: "fr" as UnitType, value: "1" },
        ],
        cols: [
            { id: "c1", unit: "fr" as UnitType, value: "1" },
            { id: "c2", unit: "fr" as UnitType, value: "1" },
            { id: "c3", unit: "fr" as UnitType, value: "1" },
            { id: "c4", unit: "fr" as UnitType, value: "1" },
        ],
        gapX: 16,
        gapY: 16,
        items: [
            { id: "item-1", name: "Top Metrics Bar", colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 2, bgHex: "#4f46e5" },
            { id: "item-2", name: "Main Chart", colStart: 1, colEnd: 4, rowStart: 2, rowEnd: 4, bgHex: "#0284c7" },
            { id: "item-3", name: "Activity Feed", colStart: 4, colEnd: 5, rowStart: 2, rowEnd: 4, bgHex: "#d97706" },
        ],
    },
    {
        name: "3x3 Photo Gallery Grid",
        rows: [
            { id: "r1", unit: "fr" as UnitType, value: "1" },
            { id: "r2", unit: "fr" as UnitType, value: "1" },
            { id: "r3", unit: "fr" as UnitType, value: "1" },
        ],
        cols: [
            { id: "c1", unit: "fr" as UnitType, value: "1" },
            { id: "c2", unit: "fr" as UnitType, value: "1" },
            { id: "c3", unit: "fr" as UnitType, value: "1" },
        ],
        gapX: 12,
        gapY: 12,
        items: [
            { id: "item-1", name: "Hero Photo", colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 3, bgHex: "#4f46e5" },
            { id: "item-2", name: "Tile 2", colStart: 3, colEnd: 4, rowStart: 1, rowEnd: 2, bgHex: "#0284c7" },
            { id: "item-3", name: "Tile 3", colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3, bgHex: "#0d9488" },
            { id: "item-4", name: "Wide Tile", colStart: 1, colEnd: 4, rowStart: 3, rowEnd: 4, bgHex: "#7c3aed" },
        ],
    },
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

export default function CssGridGenerator() {
    // Grid Container Tracks
    const [cols, setCols] = useState<TrackDefinition[]>([
        { id: "col-1", unit: "fr", value: "1" },
        { id: "col-2", unit: "fr", value: "1" },
        { id: "col-3", unit: "fr", value: "1" },
    ]);
    const [rows, setRows] = useState<TrackDefinition[]>([
        { id: "row-1", unit: "fr", value: "1" },
        { id: "row-2", unit: "fr", value: "1" },
        { id: "row-3", unit: "fr", value: "1" },
    ]);

    // Gap settings
    const [gapX, setGapX] = useState<number>(16);
    const [gapY, setGapY] = useState<number>(16);

    // Alignment settings
    const [justifyItems, setJustifyItems] = useState<"stretch" | "start" | "center" | "end">("stretch");
    const [alignItems, setAlignItems] = useState<"stretch" | "start" | "center" | "end">("stretch");

    // Children Area Placements
    const [items, setItems] = useState<GridChildItem[]>([
        { id: "item-1", name: "Header", colStart: 1, colEnd: 4, rowStart: 1, rowEnd: 2, bgHex: "#4f46e5" },
        { id: "item-2", name: "Sidebar", colStart: 1, colEnd: 2, rowStart: 2, rowEnd: 4, bgHex: "#0284c7" },
        { id: "item-3", name: "Main Content", colStart: 2, colEnd: 4, rowStart: 2, rowEnd: 3, bgHex: "#0d9488" },
        { id: "item-4", name: "Footer Panel", colStart: 2, colEnd: 4, rowStart: 3, rowEnd: 4, bgHex: "#7c3aed" },
    ]);

    const [selectedItemId, setSelectedItemId] = useState<string>("item-1");
    const [codeTab, setCodeTab] = useState<"css" | "html" | "tailwind">("css");
    const [copied, setCopied] = useState<boolean>(false);

    // Helper functions to format track string
    const formatTrack = (track: TrackDefinition): string => {
        if (track.unit === "auto") return "auto";
        if (track.unit === "minmax") {
            const min = track.min || "100px";
            const max = track.max || "1fr";
            return `minmax(${min}, ${max})`;
        }
        return `${track.value || "1"}${track.unit}`;
    };

    const colTrackString = useMemo(() => cols.map(formatTrack).join(" "), [cols]);
    const rowTrackString = useMemo(() => rows.map(formatTrack).join(" "), [rows]);

    // Active selected item reference
    const selectedItem = useMemo(() => {
        return items.find((i) => i.id === selectedItemId) || items[0] || null;
    }, [items, selectedItemId]);

    // Track Mutators
    const addColumn = () => {
        if (cols.length >= 12) return;
        const newId = `col-${Date.now()}`;
        setCols([...cols, { id: newId, unit: "fr", value: "1" }]);
    };

    const removeColumn = (index: number) => {
        if (cols.length <= 1) return;
        const targetCols = cols.filter((_, idx) => idx !== index);
        setCols(targetCols);
        // Clamp item col ends
        setItems((prev) =>
            prev.map((it) => ({
                ...it,
                colStart: Math.min(it.colStart, targetCols.length),
                colEnd: Math.min(it.colEnd, targetCols.length + 1),
            }))
        );
    };

    const addRow = () => {
        if (rows.length >= 12) return;
        const newId = `row-${Date.now()}`;
        setRows([...rows, { id: newId, unit: "fr", value: "1" }]);
    };

    const removeRow = (index: number) => {
        if (rows.length <= 1) return;
        const targetRows = rows.filter((_, idx) => idx !== index);
        setRows(targetRows);
        // Clamp item row ends
        setItems((prev) =>
            prev.map((it) => ({
                ...it,
                rowStart: Math.min(it.rowStart, targetRows.length),
                rowEnd: Math.min(it.rowEnd, targetRows.length + 1),
            }))
        );
    };

    // Item Mutators
    const addItem = () => {
        const nextIdx = items.length + 1;
        const color = PRESET_COLORS[(nextIdx - 1) % PRESET_COLORS.length];
        const newItem: GridChildItem = {
            id: `item-${Date.now()}`,
            name: `Area ${nextIdx}`,
            colStart: 1,
            colEnd: Math.min(2, cols.length + 1),
            rowStart: 1,
            rowEnd: Math.min(2, rows.length + 1),
            bgHex: color,
        };
        setItems([...items, newItem]);
        setSelectedItemId(newItem.id);
    };

    const removeItem = (id: string) => {
        if (items.length <= 1) return;
        const nextItems = items.filter((it) => it.id !== id);
        setItems(nextItems);
        if (selectedItemId === id) {
            setSelectedItemId(nextItems[0].id);
        }
    };

    const updateSelectedItem = (updates: Partial<GridChildItem>) => {
        if (!selectedItem) return;
        setItems((prev) =>
            prev.map((item) => (item.id === selectedItem.id ? { ...item, ...updates } : item))
        );
    };

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setCols(preset.cols.map((c) => ({ ...c, id: `c-${Math.random()}` })));
        setRows(preset.rows.map((r) => ({ ...r, id: `r-${Math.random()}` })));
        setGapX(preset.gapX);
        setGapY(preset.gapY);
        setItems(preset.items.map((i) => ({ ...i, id: `it-${Math.random()}` })));
        setSelectedItemId(preset.items[0]?.id || "");
    };

    const handleReset = () => {
        setCols([
            { id: "col-1", unit: "fr", value: "1" },
            { id: "col-2", unit: "fr", value: "1" },
            { id: "col-3", unit: "fr", value: "1" },
        ]);
        setRows([
            { id: "row-1", unit: "fr", value: "1" },
            { id: "row-2", unit: "fr", value: "1" },
            { id: "row-3", unit: "fr", value: "1" },
        ]);
        setGapX(16);
        setGapY(16);
        setJustifyItems("stretch");
        setAlignItems("stretch");
        setItems([
            { id: "item-1", name: "Header", colStart: 1, colEnd: 4, rowStart: 1, rowEnd: 2, bgHex: "#4f46e5" },
            { id: "item-2", name: "Sidebar", colStart: 1, colEnd: 2, rowStart: 2, rowEnd: 4, bgHex: "#0284c7" },
            { id: "item-3", name: "Main Content", colStart: 2, colEnd: 4, rowStart: 2, rowEnd: 3, bgHex: "#0d9488" },
            { id: "item-4", name: "Footer Panel", colStart: 2, colEnd: 4, rowStart: 3, rowEnd: 4, bgHex: "#7c3aed" },
        ]);
        setSelectedItemId("item-1");
    };

    // Code Generators
    const generatedCSS = useMemo(() => {
        let code = `.parent-grid {\n`;
        code += `  display: grid;\n`;
        code += `  grid-template-columns: ${colTrackString};\n`;
        code += `  grid-template-rows: ${rowTrackString};\n`;
        if (gapX === gapY) {
            code += `  gap: ${gapX}px;\n`;
        } else {
            code += `  row-gap: ${gapY}px;\n`;
            code += `  column-gap: ${gapX}px;\n`;
        }
        if (justifyItems !== "stretch") code += `  justify-items: ${justifyItems};\n`;
        if (alignItems !== "stretch") code += `  align-items: ${alignItems};\n`;
        code += `}\n\n`;

        items.forEach((item, idx) => {
            const className = item.name.toLowerCase().replace(/\s+/g, "-") || `grid-item-${idx + 1}`;
            code += `.${className} {\n`;
            code += `  grid-column: ${item.colStart} / ${item.colEnd};\n`;
            code += `  grid-row: ${item.rowStart} / ${item.rowEnd};\n`;
            code += `}\n`;
        });

        return code;
    }, [colTrackString, rowTrackString, gapX, gapY, justifyItems, alignItems, items]);

    const generatedHTML = useMemo(() => {
        let code = `<div class="parent-grid">\n`;
        items.forEach((item, idx) => {
            const className = item.name.toLowerCase().replace(/\s+/g, "-") || `grid-item-${idx + 1}`;
            code += `  <div class="${className}">${item.name}</div>\n`;
        });
        code += `</div>`;
        return code;
    }, [items]);

    const generatedTailwind = useMemo(() => {
        let containerClasses = `grid gap-x-[${gapX}px] gap-y-[${gapY}px]`;
        const colCustom = `grid-cols-[${colTrackString.replace(/\s+/g, "_")}]`;
        const rowCustom = `grid-rows-[${rowTrackString.replace(/\s+/g, "_")}]`;
        containerClasses += ` ${colCustom} ${rowCustom}`;

        let code = `<div className="${containerClasses}">\n`;
        items.forEach((item) => {
            const colSpan = `col-start-${item.colStart} col-end-${item.colEnd}`;
            const rowSpan = `row-start-${item.rowStart} row-end-${item.rowEnd}`;
            code += `  <div className="${colSpan} ${rowSpan} p-4 text-white rounded-lg">\n    ${item.name}\n  </div>\n`;
        });
        code += `</div>`;
        return code;
    }, [colTrackString, rowTrackString, gapX, gapY, items]);

    const currentOutputCode = useMemo(() => {
        switch (codeTab) {
            case "html":
                return generatedHTML;
            case "tailwind":
                return generatedTailwind;
            case "css":
            default:
                return generatedCSS;
        }
    }, [codeTab, generatedCSS, generatedHTML, generatedTailwind]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(currentOutputCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Grid Generator & Interactive Builder",
        "url": "https://twistertools.com/tools/developer-tools/css-grid-generator",
        "description": "Visual CSS Grid layout builder and code generator. Create custom two-dimensional grid layouts with fractional tracks, minmax boundaries, dynamic spans, and instant export to CSS, HTML, and Tailwind CSS.",
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
                "name": "What is the difference between CSS Grid and CSS Flexbox?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CSS Flexbox is primarily designed for one-dimensional layouts (either in a row or a column), making it ideal for navigation bars, item lists, and micro-alignments. CSS Grid is a two-dimensional system capable of aligning items simultaneously across rows and columns, making it superior for overarching page structures and magazine-style dashboards."
                }
            },
            {
                "@type": "Question",
                "name": "What does the 'fr' unit represent in CSS Grid?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 'fr' (fractional) unit represents a fraction of the available free space within the grid container. A grid defined with '1fr 2fr' splits remaining space into three parts: the first track receives 1/3 and the second track receives 2/3 after fixed pixel or percentage tracks are deducted."
                }
            },
            {
                "@type": "Question",
                "name": "How does the minmax() function work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The minmax(min, max) functional notation sets a track size range between a defined minimum and maximum value. For instance, 'minmax(200px, 1fr)' ensures a track never shrinks below 200 pixels but expands to take up equal remaining fractional space on wider viewports."
                }
            },
            {
                "@type": "Question",
                "name": "How are grid line indices calculated for grid-column and grid-row?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CSS Grid lines are 1-based index numbers positioned on either side of tracks. A grid with 3 columns has 4 vertical grid lines. An element spanning from the first column through the second column uses 'grid-column: 1 / 3', where 1 is the starting line and 3 is the terminating line."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use generated Tailwind CSS arbitrary grid classes in production?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Tailwind CSS supports arbitrary track values like 'grid-cols-[1fr_2fr_1fr]' using its JIT compiler. Simply replace whitespace with underscores inside the square brackets as generated by this tool."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Data Scripts */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Quick Presets Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-800">Quick Layout Presets:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition cursor-pointer"
                        >
                            {preset.name}
                        </button>
                    ))}
                    <button
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Default
                    </button>
                </div>
            </div>

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Visual Grid Canvas & Item Config */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Visual Grid Canvas
                            </h2>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                {cols.length} Cols × {rows.length} Rows
                            </span>
                        </div>

                        {/* Interactive Canvas Stage */}
                        <div className="bg-slate-900/5 p-4 sm:p-6 rounded-2xl border border-slate-200/80 mb-6 overflow-x-auto">
                            <div
                                className="w-full min-h-[300px] h-[320px] bg-slate-900 rounded-xl p-3 border border-slate-700 shadow-inner relative transition-all"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: colTrackString,
                                    gridTemplateRows: rowTrackString,
                                    columnGap: `${gapX}px`,
                                    rowGap: `${gapY}px`,
                                    justifyItems: justifyItems,
                                    alignItems: alignItems,
                                }}
                            >
                                {items.map((item) => {
                                    const isSelected = selectedItemId === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedItemId(item.id)}
                                            style={{
                                                gridColumnStart: item.colStart,
                                                gridColumnEnd: item.colEnd,
                                                gridRowStart: item.rowStart,
                                                gridRowEnd: item.rowEnd,
                                                backgroundColor: item.bgHex,
                                            }}
                                            className={`rounded-lg p-2.5 flex flex-col justify-between text-white cursor-pointer transition-all duration-150 select-none shadow-md ${isSelected
                                                    ? "ring-4 ring-white ring-offset-2 ring-offset-indigo-600 scale-[0.99] z-10"
                                                    : "opacity-90 hover:opacity-100"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold truncate pr-1">{item.name}</span>
                                                <span className="text-[10px] font-mono opacity-80 shrink-0">
                                                    c{item.colStart}-{item.colEnd} / r{item.rowStart}-{item.rowEnd}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] opacity-75">
                                                <span>{isSelected ? "Selected" : "Click to edit"}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Child Area Editor */}
                        {selectedItem && (
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3.5 h-3.5 rounded-full"
                                            style={{ backgroundColor: selectedItem.bgHex }}
                                        />
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Edit Area: {selectedItem.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeItem(selectedItem.id)}
                                        disabled={items.length <= 1}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Remove
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Area Label
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedItem.name}
                                            onChange={(e) => updateSelectedItem({ name: e.target.value })}
                                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Accent Color
                                        </label>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            {PRESET_COLORS.map((hex) => (
                                                <button
                                                    key={hex}
                                                    type="button"
                                                    onClick={() => updateSelectedItem({ bgHex: hex })}
                                                    style={{ backgroundColor: hex }}
                                                    className={`w-6 h-6 rounded-md transition cursor-pointer ${selectedItem.bgHex === hex ? "ring-2 ring-offset-1 ring-slate-900" : ""
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                                            Col Start
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={cols.length}
                                            value={selectedItem.colStart === 0 ? "" : selectedItem.colStart}
                                            onChange={(e) =>
                                                handleNumberInput(e, (v) =>
                                                    updateSelectedItem({
                                                        colStart: Math.min(v, selectedItem.colEnd - 1),
                                                    })
                                                )
                                            }
                                            className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                                            Col End
                                        </label>
                                        <input
                                            type="number"
                                            min={selectedItem.colStart + 1}
                                            max={cols.length + 1}
                                            value={selectedItem.colEnd === 0 ? "" : selectedItem.colEnd}
                                            onChange={(e) =>
                                                handleNumberInput(e, (v) =>
                                                    updateSelectedItem({
                                                        colEnd: Math.max(v, selectedItem.colStart + 1),
                                                    })
                                                )
                                            }
                                            className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                                            Row Start
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={rows.length}
                                            value={selectedItem.rowStart === 0 ? "" : selectedItem.rowStart}
                                            onChange={(e) =>
                                                handleNumberInput(e, (v) =>
                                                    updateSelectedItem({
                                                        rowStart: Math.min(v, selectedItem.rowEnd - 1),
                                                    })
                                                )
                                            }
                                            className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase">
                                            Row End
                                        </label>
                                        <input
                                            type="number"
                                            min={selectedItem.rowStart + 1}
                                            max={rows.length + 1}
                                            value={selectedItem.rowEnd === 0 ? "" : selectedItem.rowEnd}
                                            onChange={(e) =>
                                                handleNumberInput(e, (v) =>
                                                    updateSelectedItem({
                                                        rowEnd: Math.max(v, selectedItem.rowStart + 1),
                                                    })
                                                )
                                            }
                                            className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                            onClick={addItem}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Add Grid Child Area
                        </button>
                        <span className="text-xs text-slate-500 font-medium">
                            {items.length} active child elements
                        </span>
                    </div>
                </div>

                {/* Right Workspace Panel: Track Dimensions, Gaps & Code Export */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Track Dimensions & Alignment
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setCodeTab("css")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${codeTab === "css" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    CSS
                                </button>
                                <button
                                    onClick={() => setCodeTab("html")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${codeTab === "html" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    HTML
                                </button>
                                <button
                                    onClick={() => setCodeTab("tailwind")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${codeTab === "tailwind" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Tailwind
                                </button>
                            </div>
                        </div>

                        {/* Column Tracks Controller */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Boxes className="w-4 h-4 text-indigo-600" />
                                    Columns ({cols.length})
                                </label>
                                <button
                                    onClick={addColumn}
                                    disabled={cols.length >= 12}
                                    className="text-indigo-600 hover:text-indigo-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Column
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                {cols.map((col, idx) => (
                                    <div
                                        key={col.id}
                                        className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80"
                                    >
                                        <span className="text-xs font-bold text-slate-500 w-6">Col {idx + 1}</span>
                                        <select
                                            value={col.unit}
                                            onChange={(e) => {
                                                const u = e.target.value as UnitType;
                                                setCols(
                                                    cols.map((c, i) =>
                                                        i === idx
                                                            ? { ...c, unit: u, value: u === "auto" ? "auto" : c.value || "1" }
                                                            : c
                                                    )
                                                );
                                            }}
                                            className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                        >
                                            <option value="fr">fr (Fraction)</option>
                                            <option value="px">px (Pixels)</option>
                                            <option value="%">% (Percent)</option>
                                            <option value="auto">auto</option>
                                            <option value="minmax">minmax()</option>
                                        </select>
                                        {col.unit !== "auto" && col.unit !== "minmax" && (
                                            <input
                                                type="text"
                                                value={col.value}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCols(cols.map((c, i) => (i === idx ? { ...c, value: val } : c)));
                                                }}
                                                className="w-16 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                            />
                                        )}
                                        {col.unit === "minmax" && (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    placeholder="min (100px)"
                                                    value={col.min || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCols(cols.map((c, i) => (i === idx ? { ...c, min: val } : c)));
                                                    }}
                                                    className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="max (1fr)"
                                                    value={col.max || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCols(cols.map((c, i) => (i === idx ? { ...c, max: val } : c)));
                                                    }}
                                                    className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                                />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeColumn(idx)}
                                            disabled={cols.length <= 1}
                                            className="ml-auto text-slate-400 hover:text-red-600 disabled:opacity-20 cursor-pointer p-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Row Tracks Controller */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Rows ({rows.length})
                                </label>
                                <button
                                    onClick={addRow}
                                    disabled={rows.length >= 12}
                                    className="text-indigo-600 hover:text-indigo-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Row
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                {rows.map((row, idx) => (
                                    <div
                                        key={row.id}
                                        className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80"
                                    >
                                        <span className="text-xs font-bold text-slate-500 w-6">Row {idx + 1}</span>
                                        <select
                                            value={row.unit}
                                            onChange={(e) => {
                                                const u = e.target.value as UnitType;
                                                setRows(
                                                    rows.map((r, i) =>
                                                        i === idx
                                                            ? { ...r, unit: u, value: u === "auto" ? "auto" : r.value || "1" }
                                                            : r
                                                    )
                                                );
                                            }}
                                            className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                        >
                                            <option value="fr">fr (Fraction)</option>
                                            <option value="px">px (Pixels)</option>
                                            <option value="%">% (Percent)</option>
                                            <option value="auto">auto</option>
                                            <option value="minmax">minmax()</option>
                                        </select>
                                        {row.unit !== "auto" && row.unit !== "minmax" && (
                                            <input
                                                type="text"
                                                value={row.value}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setRows(rows.map((r, i) => (i === idx ? { ...r, value: val } : r)));
                                                }}
                                                className="w-16 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                            />
                                        )}
                                        {row.unit === "minmax" && (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    placeholder="min (100px)"
                                                    value={row.min || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setRows(rows.map((r, i) => (i === idx ? { ...r, min: val } : r)));
                                                    }}
                                                    className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="max (1fr)"
                                                    value={row.max || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setRows(rows.map((r, i) => (i === idx ? { ...r, max: val } : r)));
                                                    }}
                                                    className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                                />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeRow(idx)}
                                            disabled={rows.length <= 1}
                                            className="ml-auto text-slate-400 hover:text-red-600 disabled:opacity-20 cursor-pointer p-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gap and Alignment Controls */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Column Gap
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={gapX === 0 ? "" : gapX}
                                    onChange={(e) => handleNumberInput(e, setGapX)}
                                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Row Gap
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={gapY === 0 ? "" : gapY}
                                    onChange={(e) => handleNumberInput(e, setGapY)}
                                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Justify Items
                                </label>
                                <select
                                    value={justifyItems}
                                    onChange={(e) => setJustifyItems(e.target.value as any)}
                                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                >
                                    <option value="stretch">stretch</option>
                                    <option value="start">start</option>
                                    <option value="center">center</option>
                                    <option value="end">end</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Align Items
                                </label>
                                <select
                                    value={alignItems}
                                    onChange={(e) => setAlignItems(e.target.value as any)}
                                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                                >
                                    <option value="stretch">stretch</option>
                                    <option value="start">start</option>
                                    <option value="center">center</option>
                                    <option value="end">end</option>
                                </select>
                            </div>
                        </div>

                        {/* Generated Code Area */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Code2 className="w-4 h-4 text-indigo-600" />
                                    Generated {codeTab.toUpperCase()} Output
                                </label>
                            </div>
                            <pre className="bg-slate-900 text-indigo-300 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[170px] border border-slate-800">
                                {currentOutputCode}
                            </pre>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyCode}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard!" : `Copy ${codeTab.toUpperCase()} Code`}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations & Syntax */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architectural Foundations: Two-Dimensional CSS Grid Layouts
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        CSS Grid Layout (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">display: grid</code>) is the standard CSS native layout module engineered specifically for two-dimensional content positioning. Unlike CSS Flexbox, which is inherently one-dimensional (operating on either a horizontal row or vertical column axis), Grid enables simultaneous coordinate alignment across both intersecting horizontal and vertical tracks.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> The Fractional Unit (fr)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">fr</code> unit allocates fractional segments of available container space after deducting static units like pixels or percentages. A layout of <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">1fr 3fr</code> partitions the remaining room into a 25% and 75% distribution dynamically.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                grid-template-columns: 200px 1fr 2fr;
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Maximize2 className="w-4 h-4 text-indigo-600" /> Minmax Dynamic Sizing
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">minmax(min, max)</code> function establishes boundary constraints. It guarantees a track never compresses below a critical dimension while allowing fluid expansion up to an unrestricted fractional limit.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Core Grid Terminology Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Core CSS Grid Terminology & Syntax Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Mastering CSS Grid requires understanding its anatomical constructs, ranging from container boundary lines to individual cell assignment syntax:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Concept</th>
                                    <th className="p-3">CSS Syntax</th>
                                    <th className="p-3">Description & Architectural Scope</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Grid Container</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">display: grid;</td>
                                    <td className="p-3">The direct parent element establishing the block formatting context for child items.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Grid Tracks</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">grid-template-columns / rows</td>
                                    <td className="p-3">The generic space between any two adjacent grid lines, forming individual columns and rows.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Grid Lines</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">grid-column: 1 / 3;</td>
                                    <td className="p-3">The numbered dividing lines that define the boundaries of the grid tracks (1-indexed).</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Grid Gap / Gutter</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">gap: 1.5rem; (row-gap, col-gap)</td>
                                    <td className="p-3">The empty separation gutter between adjacent rows and columns without adding external margin.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Grid Area</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">grid-area: header;</td>
                                    <td className="p-3">The total rectangular space bounded by four grid lines that one or more child cells occupy.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: CSS Grid vs Flexbox Deep Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Boxes className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            CSS Grid vs. CSS Flexbox: Engineering Decision Guide
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Choosing between Grid and Flexbox is not an either-or proposition; modern frontend architectures combine both paradigms. Use this comparative criteria to determine optimal layout implementation:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-indigo-100 bg-indigo-50/40 rounded-xl space-y-3">
                            <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Optimal Scenarios for CSS Grid
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4">
                                <li>Overall page structural layouts (Headers, Asides, Content, Footers).</li>
                                <li>Complex responsive dashboards where widgets must align vertically and horizontally.</li>
                                <li>Media galleries requiring distinct cell overlapping or asymmetrical item spans.</li>
                                <li>Strict column alignments without wrapping items unpredictably to next lines.</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 bg-slate-50 rounded-xl space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-slate-600" /> Optimal Scenarios for CSS Flexbox
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4">
                                <li>Navigation bars and horizontal list alignments with dynamic spacing.</li>
                                <li>Centering micro-components (buttons, icon badges, modal popups).</li>
                                <li>Linear forms where inputs and submit buttons adjust horizontally.</li>
                                <li>Content-driven distribution where item size dictates layout rather than rigid coordinates.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Production Layout Patterns */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileCode className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Layout Implementation Patterns
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Implement these production-proven grid architectures directly in modern web applications:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Pattern A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Pattern 1: Auto-Fit Responsive Card Grid</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Zero Media Queries</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Automatically rearranges items from 1 to N columns based on device screen width without writing a single breakpoint query:
                            </p>
                            <pre className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}`}
                            </pre>
                        </div>

                        {/* Pattern B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Pattern 2: Sticky Header & Footer Frame</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">App Shell</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Enforces full-height browser rendering where the main content scrolls independently while header and footer stay pinned:
                            </p>
                            <pre className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`.app-shell {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
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
                                What is the difference between CSS Grid and CSS Flexbox?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                CSS Flexbox is primarily designed for one-dimensional layouts (either in a row or a column), making it ideal for navigation bars, item lists, and micro-alignments. CSS Grid is a two-dimensional system capable of aligning items simultaneously across rows and columns, making it superior for overarching page structures and magazine-style dashboards.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What does the &apos;fr&apos; unit represent in CSS Grid?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The &apos;fr&apos; (fractional) unit represents a fraction of the available free space within the grid container. A grid defined with &apos;1fr 2fr&apos; splits remaining space into three parts: the first track receives 1/3 and the second track receives 2/3 after fixed pixel or percentage tracks are deducted.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the minmax() function work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The minmax(min, max) functional notation sets a track size range between a defined minimum and maximum value. For instance, &apos;minmax(200px, 1fr)&apos; ensures a track never shrinks below 200 pixels but expands to take up equal remaining fractional space on wider viewports.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are grid line indices calculated for grid-column and grid-row?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                CSS Grid lines are 1-based index numbers positioned on either side of tracks. A grid with 3 columns has 4 vertical grid lines. An element spanning from the first column through the second column uses &apos;grid-column: 1 / 3&apos;, where 1 is the starting line and 3 is the terminating line.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I use generated Tailwind CSS arbitrary grid classes in production?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Tailwind CSS supports arbitrary track values like &apos;grid-cols-[1fr_2fr_1fr]&apos; using its JIT compiler. Simply replace whitespace with underscores inside the square brackets as generated by this tool.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}