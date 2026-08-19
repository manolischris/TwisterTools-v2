"use client";

import React, { useState, useMemo } from "react";
import {
    Layout,
    Layers,
    Code2,
    Copy,
    Check,
    RotateCcw,
    Plus,
    Trash2,
    Sliders,
    Sparkles,
    HelpCircle,
    BookOpen,
    ArrowRightLeft,
    MoveVertical,
    Grid,
    FileCode,
    CheckCircle2,
    Boxes,
    Compass,
    Monitor
} from "lucide-react";

interface FlexItem {
    id: number;
    label: string;
    order: number;
    flexGrow: number;
    flexShrink: number;
    flexBasis: string;
    alignSelf: "auto" | "flex-start" | "flex-end" | "center" | "baseline" | "stretch";
    minWidth: string;
    minHeight: string;
}

type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
type JustifyContent =
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
type AlignItems = "stretch" | "flex-start" | "flex-end" | "center" | "baseline";
type AlignContent =
    | "stretch"
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";

const INITIAL_ITEMS: FlexItem[] = [
    { id: 1, label: "Item 1", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto", minWidth: "80px", minHeight: "60px" },
    { id: 2, label: "Item 2", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto", minWidth: "80px", minHeight: "60px" },
    { id: 3, label: "Item 3", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto", minWidth: "80px", minHeight: "60px" },
    { id: 4, label: "Item 4", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto", minWidth: "80px", minHeight: "60px" },
];

const PRESETS = [
    {
        name: "Navbar Layout",
        direction: "row" as FlexDirection,
        wrap: "nowrap" as FlexWrap,
        justify: "space-between" as JustifyContent,
        alignItems: "center" as AlignItems,
        alignContent: "stretch" as AlignContent,
        gap: 16,
        items: [
            { id: 1, label: "Logo", order: 0, flexGrow: 0, flexShrink: 0, flexBasis: "auto", alignSelf: "auto" as const, minWidth: "100px", minHeight: "44px" },
            { id: 2, label: "Nav Links", order: 0, flexGrow: 1, flexShrink: 1, flexBasis: "auto", alignSelf: "auto" as const, minWidth: "160px", minHeight: "44px" },
            { id: 3, label: "Actions / CTA", order: 0, flexGrow: 0, flexShrink: 0, flexBasis: "auto", alignSelf: "auto" as const, minWidth: "110px", minHeight: "44px" },
        ]
    },
    {
        name: "Responsive Card Grid",
        direction: "row" as FlexDirection,
        wrap: "wrap" as FlexWrap,
        justify: "center" as JustifyContent,
        alignItems: "stretch" as AlignItems,
        alignContent: "flex-start" as AlignContent,
        gap: 20,
        items: [
            { id: 1, label: "Card 1", order: 0, flexGrow: 1, flexShrink: 1, flexBasis: "180px", alignSelf: "auto" as const, minWidth: "140px", minHeight: "100px" },
            { id: 2, label: "Card 2", order: 0, flexGrow: 1, flexShrink: 1, flexBasis: "180px", alignSelf: "auto" as const, minWidth: "140px", minHeight: "100px" },
            { id: 3, label: "Card 3", order: 0, flexGrow: 1, flexShrink: 1, flexBasis: "180px", alignSelf: "auto" as const, minWidth: "140px", minHeight: "100px" },
        ]
    },
    {
        name: "Centered Modal / Hero",
        direction: "column" as FlexDirection,
        wrap: "nowrap" as FlexWrap,
        justify: "center" as JustifyContent,
        alignItems: "center" as AlignItems,
        alignContent: "stretch" as AlignContent,
        gap: 16,
        items: [
            { id: 1, label: "Hero Title", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto" as const, minWidth: "220px", minHeight: "50px" },
            { id: 2, label: "Subheading", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto" as const, minWidth: "180px", minHeight: "40px" },
            { id: 3, label: "Primary Button", order: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto", alignSelf: "auto" as const, minWidth: "130px", minHeight: "44px" },
        ]
    },
    {
        name: "Sidebar + Content",
        direction: "row" as FlexDirection,
        wrap: "nowrap" as FlexWrap,
        justify: "flex-start" as JustifyContent,
        alignItems: "stretch" as AlignItems,
        alignContent: "stretch" as AlignContent,
        gap: 16,
        items: [
            { id: 1, label: "Sidebar", order: 0, flexGrow: 0, flexShrink: 0, flexBasis: "140px", alignSelf: "auto" as const, minWidth: "120px", minHeight: "140px" },
            { id: 2, label: "Main Content", order: 0, flexGrow: 1, flexShrink: 1, flexBasis: "auto", alignSelf: "auto" as const, minWidth: "160px", minHeight: "140px" },
        ]
    }
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

export default function CssFlexboxPlayground() {
    // Container States
    const [flexDirection, setFlexDirection] = useState<FlexDirection>("row");
    const [flexWrap, setFlexWrap] = useState<FlexWrap>("nowrap");
    const [justifyContent, setJustifyContent] = useState<JustifyContent>("flex-start");
    const [alignItems, setAlignItems] = useState<AlignItems>("stretch");
    const [alignContent, setAlignContent] = useState<AlignContent>("stretch");
    const [gap, setGap] = useState<number>(16);
    const [containerHeight, setContainerHeight] = useState<number>(340);

    // Items State
    const [items, setItems] = useState<FlexItem[]>(INITIAL_ITEMS);
    const [selectedItemId, setSelectedItemId] = useState<number>(1);
    const [copiedType, setCopiedType] = useState<"css" | "tailwind" | "html" | null>(null);
    const [activeCodeTab, setActiveCodeTab] = useState<"css" | "tailwind" | "html">("css");

    const selectedItem = useMemo(() => {
        return items.find((it) => it.id === selectedItemId) || items[0] || null;
    }, [items, selectedItemId]);

    const handleAddItem = () => {
        if (items.length >= 12) return;
        const nextId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
        const newItem: FlexItem = {
            id: nextId,
            label: `Item ${nextId}`,
            order: 0,
            flexGrow: 0,
            flexShrink: 1,
            flexBasis: "auto",
            alignSelf: "auto",
            minWidth: "80px",
            minHeight: "60px",
        };
        setItems([...items, newItem]);
        setSelectedItemId(nextId);
    };

    const handleRemoveItem = (idToRemove: number) => {
        if (items.length <= 1) return;
        const filtered = items.filter((i) => i.id !== idToRemove);
        setItems(filtered);
        if (selectedItemId === idToRemove) {
            setSelectedItemId(filtered[0].id);
        }
    };

    const updateSelectedItem = (field: keyof FlexItem, value: any) => {
        if (!selectedItem) return;
        setItems(
            items.map((item) =>
                item.id === selectedItem.id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleReset = () => {
        setFlexDirection("row");
        setFlexWrap("nowrap");
        setJustifyContent("flex-start");
        setAlignItems("stretch");
        setAlignContent("stretch");
        setGap(16);
        setContainerHeight(340);
        setItems(INITIAL_ITEMS);
        setSelectedItemId(1);
    };

    const applyPreset = (preset: (typeof PRESETS)[0]) => {
        setFlexDirection(preset.direction);
        setFlexWrap(preset.wrap);
        setJustifyContent(preset.justify);
        setAlignItems(preset.alignItems);
        setAlignContent(preset.alignContent);
        setGap(preset.gap);
        setItems(preset.items);
        setSelectedItemId(preset.items[0].id);
    };

    // Pure CSS Output Generator
    const generatedCss = useMemo(() => {
        const lines: string[] = [
            `.flex-container {`,
            `  display: flex;`,
            `  flex-direction: ${flexDirection};`,
            `  flex-wrap: ${flexWrap};`,
            `  justify-content: ${justifyContent};`,
            `  align-items: ${alignItems};`,
            ...(flexWrap !== "nowrap" ? [`  align-content: ${alignContent};`] : []),
            `  gap: ${gap}px;`,
            `}`,
            ``,
        ];

        items.forEach((item, idx) => {
            const overrides: string[] = [];
            if (item.order !== 0) overrides.push(`  order: ${item.order};`);
            if (item.flexGrow !== 0) overrides.push(`  flex-grow: ${item.flexGrow};`);
            if (item.flexShrink !== 1) overrides.push(`  flex-shrink: ${item.flexShrink};`);
            if (item.flexBasis !== "auto") overrides.push(`  flex-basis: ${item.flexBasis};`);
            if (item.alignSelf !== "auto") overrides.push(`  align-self: ${item.alignSelf};`);

            if (overrides.length > 0) {
                lines.push(`.flex-item-${idx + 1} {`);
                lines.push(...overrides);
                lines.push(`}`);
                lines.push(``);
            }
        });

        return lines.join("\n").trim();
    }, [flexDirection, flexWrap, justifyContent, alignItems, alignContent, gap, items]);

    // Tailwind CSS Output Generator
    const generatedTailwind = useMemo(() => {
        const dirMap: Record<FlexDirection, string> = {
            row: "flex-row",
            "row-reverse": "flex-row-reverse",
            column: "flex-col",
            "column-reverse": "flex-col-reverse",
        };
        const wrapMap: Record<FlexWrap, string> = {
            nowrap: "flex-nowrap",
            wrap: "flex-wrap",
            "wrap-reverse": "flex-wrap-reverse",
        };
        const justifyMap: Record<JustifyContent, string> = {
            "flex-start": "justify-start",
            "flex-end": "justify-end",
            center: "justify-center",
            "space-between": "justify-between",
            "space-around": "justify-around",
            "space-evenly": "justify-evenly",
        };
        const alignMap: Record<AlignItems, string> = {
            stretch: "items-stretch",
            "flex-start": "items-start",
            "flex-end": "items-end",
            center: "items-center",
            baseline: "items-baseline",
        };
        const contentMap: Record<AlignContent, string> = {
            stretch: "content-stretch",
            "flex-start": "content-start",
            "flex-end": "content-end",
            center: "content-center",
            "space-between": "content-between",
            "space-around": "content-around",
            "space-evenly": "content-evenly",
        };

        const containerClasses = [
            "flex",
            dirMap[flexDirection],
            wrapMap[flexWrap],
            justifyMap[justifyContent],
            alignMap[alignItems],
            ...(flexWrap !== "nowrap" ? [contentMap[alignContent]] : []),
            `gap-[${gap}px]`,
        ].join(" ");

        let code = `<!-- Flex Container -->\n<div class="${containerClasses}">\n`;
        items.forEach((item, idx) => {
            const itemClasses: string[] = ["p-4", "rounded-lg", "bg-indigo-600", "text-white"];
            if (item.order !== 0) itemClasses.push(`order-[${item.order}]`);
            if (item.flexGrow === 1) itemClasses.push("grow");
            else if (item.flexGrow > 1) itemClasses.push(`grow-[${item.flexGrow}]`);
            if (item.flexShrink === 0) itemClasses.push("shrink-0");
            else if (item.flexShrink > 1) itemClasses.push(`shrink-[${item.flexShrink}]`);
            if (item.flexBasis !== "auto") itemClasses.push(`basis-[${item.flexBasis}]`);
            if (item.alignSelf !== "auto") itemClasses.push(`self-${item.alignSelf.replace("flex-", "")}`);

            code += `  <div class="${itemClasses.join(" ")}">${item.label}</div>\n`;
        });
        code += `</div>`;
        return code;
    }, [flexDirection, flexWrap, justifyContent, alignItems, alignContent, gap, items]);

    // Pure HTML Output
    const generatedHtml = useMemo(() => {
        let html = `<div class="flex-container">\n`;
        items.forEach((item, idx) => {
            html += `  <div class="flex-item flex-item-${idx + 1}">${item.label}</div>\n`;
        });
        html += `</div>`;
        return html;
    }, [items]);

    const handleCopy = (text: string, type: "css" | "tailwind" | "html") => {
        navigator.clipboard.writeText(text);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "CSS Flexbox Layout Sandbox & Code Generator",
        url: "https://twistertools.com/tools/developer-tools/css-flexbox-playground",
        description:
            "Interactive visual CSS Flexbox builder with live real-time canvas preview, individual flex item controls, presets, and instant clean CSS/Tailwind code output.",
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
                name: "What is CSS Flexbox and when should I use it?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "CSS Flexible Box Layout (Flexbox) is a one-dimensional layout model designed for distributing space and aligning items along a single axis (either horizontally in a row or vertically in a column). Use Flexbox for interface components like navigation bars, centered modals, input groups, card rows, and dynamic toolbars.",
                },
            },
            {
                "@type": "Question",
                name: "What is the difference between justify-content and align-items?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "justify-content aligns children along the Main Axis (horizontal when flex-direction is row; vertical when flex-direction is column). align-items controls child alignment along the Cross Axis (perpendicular to the main axis).",
                },
            },
            {
                "@type": "Question",
                name: "How does flex-grow, flex-shrink, and flex-basis work together?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "The flex shorthand combines grow, shrink, and basis: flex-basis establishes the initial ideal size of the element before free space is distributed; flex-grow determines the proportion of available leftover space the item should absorb; flex-shrink determines how aggressively the item compresses when available container space is constrained.",
                },
            },
            {
                "@type": "Question",
                name: "When should I use CSS Flexbox instead of CSS Grid?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Flexbox is designed for 1-dimensional layouts (content-driven, either a single row or single column flow). CSS Grid is a 2-dimensional system designed for rigid column-and-row layouts where items must align simultaneously across both horizontal and vertical axes.",
                },
            },
            {
                "@type": "Question",
                name: "Why does align-content have no effect on my single-row flex container?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "align-content only takes effect when there is extra space on the cross axis AND the container has multiple lines (i.e., flex-wrap is set to wrap or wrap-reverse). If flex-wrap is set to nowrap, align-content is ignored by browsers.",
                },
            },
        ],
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Preset Quick-Selector Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Quick Layout Presets:
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {PRESETS.map((p) => (
                            <button
                                key={p.name}
                                type="button"
                                onClick={() => applyPreset(p)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-700 transition cursor-pointer"
                            >
                                {p.name}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset All
                        </button>
                    </div>
                </div>
            </div>

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Flexbox Configurator */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Container Properties Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Flex Container Properties
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Parent Element
                            </span>
                        </div>

                        {/* Grid of Container Selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Flex Direction */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" /> flex-direction
                                </label>
                                <select
                                    value={flexDirection}
                                    onChange={(e) => setFlexDirection(e.target.value as FlexDirection)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="row">row (default)</option>
                                    <option value="row-reverse">row-reverse</option>
                                    <option value="column">column</option>
                                    <option value="column-reverse">column-reverse</option>
                                </select>
                            </div>

                            {/* Flex Wrap */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> flex-wrap
                                </label>
                                <select
                                    value={flexWrap}
                                    onChange={(e) => setFlexWrap(e.target.value as FlexWrap)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="nowrap">nowrap (default)</option>
                                    <option value="wrap">wrap</option>
                                    <option value="wrap-reverse">wrap-reverse</option>
                                </select>
                            </div>

                            {/* Justify Content */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Compass className="w-3.5 h-3.5 text-indigo-600" /> justify-content (Main Axis)
                                </label>
                                <select
                                    value={justifyContent}
                                    onChange={(e) => setJustifyContent(e.target.value as JustifyContent)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="flex-start">flex-start (start)</option>
                                    <option value="flex-end">flex-end (end)</option>
                                    <option value="center">center</option>
                                    <option value="space-between">space-between</option>
                                    <option value="space-around">space-around</option>
                                    <option value="space-evenly">space-evenly</option>
                                </select>
                            </div>

                            {/* Align Items */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <MoveVertical className="w-3.5 h-3.5 text-indigo-600" /> align-items (Cross Axis)
                                </label>
                                <select
                                    value={alignItems}
                                    onChange={(e) => setAlignItems(e.target.value as AlignItems)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="stretch">stretch (default)</option>
                                    <option value="flex-start">flex-start</option>
                                    <option value="flex-end">flex-end</option>
                                    <option value="center">center</option>
                                    <option value="baseline">baseline</option>
                                </select>
                            </div>

                            {/* Align Content (Multi-line) */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Grid className="w-3.5 h-3.5 text-indigo-600" /> align-content (Multi-line)
                                </label>
                                <select
                                    value={alignContent}
                                    disabled={flexWrap === "nowrap"}
                                    onChange={(e) => setAlignContent(e.target.value as AlignContent)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="stretch">stretch</option>
                                    <option value="flex-start">flex-start</option>
                                    <option value="flex-end">flex-end</option>
                                    <option value="center">center</option>
                                    <option value="space-between">space-between</option>
                                    <option value="space-around">space-around</option>
                                    <option value="space-evenly">space-evenly</option>
                                </select>
                            </div>

                            {/* Gap Slider */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        gap: {gap}px
                                    </label>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="64"
                                    step="2"
                                    value={gap}
                                    onChange={(e) => setGap(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                        </div>

                        {/* Individual Item Property Editor */}
                        <div className="pt-4 border-t border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Boxes className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        Item Overrides ({items.length})
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={items.length >= 12}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Item
                                </button>
                            </div>

                            {/* Item Selector Pills */}
                            <div className="flex flex-wrap gap-2">
                                {items.map((item) => {
                                    const isSelected = selectedItem?.id === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedItemId(item.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${isSelected
                                                    ? "bg-slate-900 text-white shadow-xs"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedItem && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Configuring: <span className="text-indigo-600">{selectedItem.label}</span>
                                        </span>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(selectedItem.id)}
                                                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {/* flex-grow */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-600 block">flex-grow</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                value={selectedItem.flexGrow === 0 ? "0" : selectedItem.flexGrow}
                                                onChange={(e) =>
                                                    handleNumberInput(e, (val) => updateSelectedItem("flexGrow", val))
                                                }
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                                            />
                                        </div>

                                        {/* flex-shrink */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-600 block">flex-shrink</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                value={selectedItem.flexShrink === 0 ? "0" : selectedItem.flexShrink}
                                                onChange={(e) =>
                                                    handleNumberInput(e, (val) => updateSelectedItem("flexShrink", val))
                                                }
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                                            />
                                        </div>

                                        {/* flex-basis */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-600 block">flex-basis</label>
                                            <select
                                                value={selectedItem.flexBasis}
                                                onChange={(e) => updateSelectedItem("flexBasis", e.target.value)}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                                            >
                                                <option value="auto">auto</option>
                                                <option value="0">0</option>
                                                <option value="80px">80px</option>
                                                <option value="120px">120px</option>
                                                <option value="180px">180px</option>
                                                <option value="25%">25%</option>
                                                <option value="50%">50%</option>
                                            </select>
                                        </div>

                                        {/* order */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-600 block">order</label>
                                            <input
                                                type="number"
                                                min="-5"
                                                max="10"
                                                value={selectedItem.order === 0 ? "0" : selectedItem.order}
                                                onChange={(e) =>
                                                    handleNumberInput(e, (val) => updateSelectedItem("order", val))
                                                }
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                                            />
                                        </div>
                                    </div>

                                    {/* align-self */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-600 block">align-self</label>
                                        <select
                                            value={selectedItem.alignSelf}
                                            onChange={(e) => updateSelectedItem("alignSelf", e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                                        >
                                            <option value="auto">auto (inherit align-items)</option>
                                            <option value="flex-start">flex-start</option>
                                            <option value="flex-end">flex-end</option>
                                            <option value="center">center</option>
                                            <option value="baseline">baseline</option>
                                            <option value="stretch">stretch</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Interactive Canvas & Generated Code */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-indigo-600" />
                                Live Visual Canvas
                            </h2>
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Height:</label>
                                <input
                                    type="range"
                                    min="240"
                                    max="500"
                                    step="20"
                                    value={containerHeight}
                                    onChange={(e) => setContainerHeight(parseInt(e.target.value, 10))}
                                    className="w-20 sm:w-28 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Visual Flex Container Box */}
                        <div
                            className="w-full rounded-xl border-2 border-dashed border-indigo-300 bg-slate-900 p-4 overflow-auto transition-all relative"
                            style={{
                                height: `${containerHeight}px`,
                                display: "flex",
                                flexDirection,
                                flexWrap,
                                justifyContent,
                                alignItems,
                                alignContent: flexWrap !== "nowrap" ? alignContent : undefined,
                                gap: `${gap}px`,
                            }}
                        >
                            {items.map((item, index) => {
                                const isSelected = selectedItem?.id === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItemId(item.id)}
                                        style={{
                                            order: item.order,
                                            flexGrow: item.flexGrow,
                                            flexShrink: item.flexShrink,
                                            flexBasis: item.flexBasis,
                                            alignSelf: item.alignSelf !== "auto" ? item.alignSelf : undefined,
                                            minWidth: item.minWidth,
                                            minHeight: item.minHeight,
                                        }}
                                        className={`rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer select-none text-white shadow-md ${isSelected
                                                ? "bg-indigo-600 ring-4 ring-indigo-400/50 scale-[1.02]"
                                                : "bg-slate-800 hover:bg-slate-700"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="text-xs font-bold tracking-wide">{item.label}</span>
                                            <span className="text-[10px] font-mono opacity-60">#{index + 1}</span>
                                        </div>

                                        <div className="text-[10px] font-mono text-slate-300 space-y-0.5">
                                            <div>g:{item.flexGrow} s:{item.flexShrink} b:{item.flexBasis}</div>
                                            {item.order !== 0 && <div>ord:{item.order}</div>}
                                            {item.alignSelf !== "auto" && <div>self:{item.alignSelf}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Code Output Segment */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setActiveCodeTab("css")}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeCodeTab === "css" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                            }`}
                                    >
                                        Pure CSS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveCodeTab("tailwind")}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeCodeTab === "tailwind" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                            }`}
                                    >
                                        Tailwind CSS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveCodeTab("html")}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeCodeTab === "html" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                            }`}
                                    >
                                        HTML
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const text =
                                            activeCodeTab === "css"
                                                ? generatedCss
                                                : activeCodeTab === "tailwind"
                                                    ? generatedTailwind
                                                    : generatedHtml;
                                        handleCopy(text, activeCodeTab);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    {copiedType === activeCodeTab ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy {activeCodeTab.toUpperCase()}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-48 border border-slate-800">
                                <pre>
                                    {activeCodeTab === "css" && generatedCss}
                                    {activeCodeTab === "tailwind" && generatedTailwind}
                                    {activeCodeTab === "html" && generatedHtml}
                                </pre>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            100% W3C Standard CSS3 Specification
                        </span>
                        <span>Real-time AST Generation</span>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Architectural Foundations & Axes */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architectural Foundations: The Flexbox Axis Mental Model
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The core breakthrough of the CSS Flexible Box Layout module (CSS3 Flexbox) lies in its axis-oriented positioning model. Unlike traditional CSS positioning (block vs. inline, floats, and tables), Flexbox calculates spatial geometry relative to two perpendicular vectors: the <strong>Main Axis</strong> and the <strong>Cross Axis</strong>.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> The Main Axis
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Determined directly by the <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">flex-direction</code> property. When set to <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">row</code> or <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">row-reverse</code>, the main axis runs horizontally. When configured as <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">column</code> or <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">column-reverse</code>, the main axis rotates 90 degrees to run vertically. Positioning along this axis is governed exclusively by <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">justify-content</code>.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <MoveVertical className="w-4 h-4 text-indigo-600" /> The Cross Axis
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The Cross Axis always runs perpendicular to the main axis. If the main axis is horizontal, the cross axis is vertical (and vice-versa). Single-line cross-axis alignment is controlled via <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">align-items</code> on the parent and <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">align-self</code> on individual children. Multi-line wrapped alignment is governed by <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">align-content</code>.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Code2 className="w-4 h-4" /> Comprehensive Axis Reference Matrix
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">flex-direction: row</span>
                                <strong className="text-indigo-300 text-sm">Main: X-Axis (L → R)<br />Cross: Y-Axis (T → B)</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">flex-direction: column</span>
                                <strong className="text-indigo-300 text-sm">Main: Y-Axis (T → B)<br />Cross: X-Axis (L → R)</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">flex-direction: row-rev</span>
                                <strong className="text-indigo-300 text-sm">Main: X-Axis (R → L)<br />Cross: Y-Axis (T → B)</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: The Flex Shorthand Formula & Space Distribution */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layout className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Flex Math: flex-grow, flex-shrink, & flex-basis Explained
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The power of Flexbox child resizing is captured in the shorthand property <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm font-semibold">flex: [flex-grow] [flex-shrink] [flex-basis]</code>. Understanding how browsers calculate pixel boundaries prevents unexpected overflow and layout breaks:
                    </p>

                    <div className="space-y-3">
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Shorthand Property</th>
                                        <th className="p-3">Default Value</th>
                                        <th className="p-3">Calculation Behavior</th>
                                        <th className="p-3">Common Production Use Case</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-mono font-bold text-indigo-600">flex-grow</td>
                                        <td className="p-3 font-mono">0</td>
                                        <td className="p-3">Allocates remaining positive free space in proportion to siblings.</td>
                                        <td className="p-3">Search bars expanding to fill navigation bars (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">flex-grow: 1</code>).</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-mono font-bold text-indigo-600">flex-shrink</td>
                                        <td className="p-3 font-mono">1</td>
                                        <td className="p-3">Determines how aggressively an element shrinks when container overflows.</td>
                                        <td className="p-3">Preventing icons from distorting (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">flex-shrink: 0</code>).</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-mono font-bold text-indigo-600">flex-basis</td>
                                        <td className="p-3 font-mono">auto</td>
                                        <td className="p-3">Defines the default hypothetic size before free space is distributed.</td>
                                        <td className="p-3">Setting fixed sidebar width bases (e.g. <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">240px</code>).</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                        <td className="p-3 font-mono font-bold text-indigo-900">flex: 1 1 0%</td>
                                        <td className="p-3 font-mono">--</td>
                                        <td className="p-3 font-semibold">Forces equal-width columns regardless of child content volume.</td>
                                        <td className="p-3">Equal 3-column pricing card tables.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Flexbox vs CSS Grid Decision Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Grid className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architecture Decision Matrix: CSS Flexbox vs. CSS Grid
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern CSS architecture employs Flexbox and CSS Grid in tandem. Flexbox handles micro-layouts and linear component hierarchies, while CSS Grid manages macroscopic 2D layout scaffolds:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Requirement</th>
                                    <th className="p-3">CSS Flexbox</th>
                                    <th className="p-3">CSS Grid</th>
                                    <th className="p-3">Optimal Tool Choice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Dimensionality</td>
                                    <td className="p-3">1-Dimensional (Row OR Column)</td>
                                    <td className="p-3">2-Dimensional (Row AND Column)</td>
                                    <td className="p-3 font-bold text-indigo-600">Flexbox for 1D, Grid for 2D</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Content Flow</td>
                                    <td className="p-3">Content-first (Size depends on content)</td>
                                    <td className="p-3">Layout-first (Content slots into cells)</td>
                                    <td className="p-3 font-bold text-indigo-600">Flexbox for dynamic badges</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Dead Center Alignment</td>
                                    <td className="p-3"><code className="text-xs bg-slate-100 p-1 rounded">justify-content: center; align-items: center;</code></td>
                                    <td className="p-3"><code className="text-xs bg-slate-100 p-1 rounded">place-items: center;</code></td>
                                    <td className="p-3 font-bold text-emerald-600">Both (Equally Efficient)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Full App Page Shell</td>
                                    <td className="p-3">Requires nested wrappers</td>
                                    <td className="p-3"><code className="text-xs bg-slate-100 p-1 rounded">grid-template-areas</code> (header, aside, main)</td>
                                    <td className="p-3 font-bold text-indigo-600">CSS Grid</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Production Best Practices & Common Gotchas */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileCode className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Flexbox Gotchas & Performance Tips
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">The min-width: 0 Bug</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                By default, flex items have <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">min-width: auto</code>, causing long strings or text-overflow ellipses to break out of containers. Always apply <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">min-w-0</code> on flex children.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Margin Auto Magic</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Applying <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">margin-left: auto</code> to a flex child pushes that item (and subsequent siblings) completely to the far right, eliminating the need for nested grouping divs in navbars.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Gap vs. Margins</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Modern browsers support the native <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">gap</code> property on flex containers. Avoid negative margin row hacks (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">-mx-2</code>) in favor of standard container gap spacing.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static Border-Highlighted FAQ */}
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
                                What is CSS Flexbox and when should I use it?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                CSS Flexible Box Layout (Flexbox) is a one-dimensional layout model designed for distributing space and aligning items along a single axis (either horizontally in a row or vertically in a column). Use Flexbox for interface components like navigation bars, centered modals, input groups, card rows, and dynamic toolbars.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between justify-content and align-items?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">justify-content</code> aligns children along the Main Axis (horizontal when flex-direction is row; vertical when flex-direction is column). <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">align-items</code> controls child alignment along the Cross Axis (perpendicular to the main axis).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does flex-grow, flex-shrink, and flex-basis work together?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The flex shorthand combines grow, shrink, and basis: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">flex-basis</code> establishes the initial ideal size of the element before free space is distributed; <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">flex-grow</code> determines the proportion of available leftover space the item should absorb; <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">flex-shrink</code> determines how aggressively the item compresses when available container space is constrained.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When should I use CSS Flexbox instead of CSS Grid?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Flexbox is designed for 1-dimensional layouts (content-driven, either a single row or single column flow). CSS Grid is a 2-dimensional system designed for rigid column-and-row layouts where items must align simultaneously across both horizontal and vertical axes.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does align-content have no effect on my single-row flex container?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">align-content</code> only takes effect when there is extra space on the cross axis AND the container has multiple lines (i.e., <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">flex-wrap</code> is set to <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">wrap</code> or <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm">wrap-reverse</code>). If flex-wrap is set to nowrap, align-content is ignored by browsers.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}