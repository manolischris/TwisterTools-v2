"use client";

import React, { useState, useMemo } from "react";
import {
    Scale,
    ShoppingCart,
    Plus,
    Trash2,
    RotateCcw,
    Copy,
    Check,
    Download,
    Trophy,
    Percent,
    DollarSign,
    Sparkles,
    BookOpen,
    HelpCircle,
    Lightbulb,
    AlertCircle,
    ArrowDownRight,
    TrendingDown,
    ShieldCheck,
    CheckCircle2
} from "lucide-react";

type UnitType = "oz" | "lb" | "g" | "kg" | "fl oz" | "gal" | "l" | "ml" | "count" | "sheets" | "pack";

interface ComparisonItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    unit: UnitType;
    packageCount: number;
    discountPercent: number;
}

interface UnitNormalization {
    standardUnit: "oz" | "g" | "fl oz" | "ml" | "count";
    factor: number;
    displayUnit: string;
}

const UNIT_CONVERSIONS: Record<UnitType, UnitNormalization> = {
    oz: { standardUnit: "oz", factor: 1, displayUnit: "oz" },
    lb: { standardUnit: "oz", factor: 16, displayUnit: "oz" },
    g: { standardUnit: "g", factor: 1, displayUnit: "g" },
    kg: { standardUnit: "g", factor: 1000, displayUnit: "g" },
    "fl oz": { standardUnit: "fl oz", factor: 1, displayUnit: "fl oz" },
    gal: { standardUnit: "fl oz", factor: 128, displayUnit: "fl oz" },
    l: { standardUnit: "ml", factor: 1000, displayUnit: "ml" },
    ml: { standardUnit: "ml", factor: 1, displayUnit: "ml" },
    count: { standardUnit: "count", factor: 1, displayUnit: "item" },
    sheets: { standardUnit: "count", factor: 1, displayUnit: "sheet" },
    pack: { standardUnit: "count", factor: 1, displayUnit: "unit" }
};

interface PresetScenario {
    id: string;
    label: string;
    tag: string;
    items: ComparisonItem[];
}

const PRESET_SCENARIOS: PresetScenario[] = [
    {
        id: "cereal",
        label: "Cereal Box Sizes",
        tag: "Weight (oz)",
        items: [
            { id: "1", name: "Standard Box", price: 4.29, quantity: 12, unit: "oz", packageCount: 1, discountPercent: 0 },
            { id: "2", name: "Family Size", price: 6.49, quantity: 19.5, unit: "oz", packageCount: 1, discountPercent: 0 },
            { id: "3", name: "Club Bulk Pack (2-Pack)", price: 9.99, quantity: 24, unit: "oz", packageCount: 2, discountPercent: 0 }
        ]
    },
    {
        id: "soda",
        label: "Soda & Beverages",
        tag: "Volume (fl oz)",
        items: [
            { id: "1", name: "Single 20oz Bottle", price: 2.29, quantity: 20, unit: "fl oz", packageCount: 1, discountPercent: 0 },
            { id: "2", name: "6-Pack (16.9 oz Bottles)", price: 4.99, quantity: 16.9, unit: "fl oz", packageCount: 6, discountPercent: 0 },
            { id: "3", name: "12-Pack (12 oz Cans)", price: 7.49, quantity: 12, unit: "fl oz", packageCount: 12, discountPercent: 0 },
            { id: "4", name: "2-Liter Bottle", price: 2.79, quantity: 67.6, unit: "fl oz", packageCount: 1, discountPercent: 0 }
        ]
    },
    {
        id: "paper-towels",
        label: "Paper Towels",
        tag: "Rolls / Sheets",
        items: [
            { id: "1", name: "Regular 6-Roll", price: 8.99, quantity: 96, unit: "sheets", packageCount: 6, discountPercent: 0 },
            { id: "2", name: "Mega 12-Roll", price: 17.49, quantity: 140, unit: "sheets", packageCount: 12, discountPercent: 10 }
        ]
    },
    {
        id: "detergent",
        label: "Laundry Detergent",
        tag: "Volume (fl oz)",
        items: [
            { id: "1", name: "Compact Bottle (64 Loads)", price: 12.99, quantity: 92, unit: "fl oz", packageCount: 1, discountPercent: 0 },
            { id: "2", name: "Club Dispenser (150 Loads)", price: 24.99, quantity: 210, unit: "fl oz", packageCount: 1, discountPercent: 5 }
        ]
    }
];

type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    "CAD/AUD": "$"
};

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
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function UnitPriceCalculator() {
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [activePresetId, setActivePresetId] = useState<string | null>("cereal");
    const [copied, setCopied] = useState(false);

    const [items, setItems] = useState<ComparisonItem[]>([
        { id: "1", name: "Standard Box", price: 4.29, quantity: 12, unit: "oz", packageCount: 1, discountPercent: 0 },
        { id: "2", name: "Family Size", price: 6.49, quantity: 19.5, unit: "oz", packageCount: 1, discountPercent: 0 },
        { id: "3", name: "Club Bulk Pack (2-Pack)", price: 9.99, quantity: 24, unit: "oz", packageCount: 2, discountPercent: 0 }
    ]);

    const currencySymbol = currencySymbols[currency];

    const processedItems = useMemo(() => {
        return items.map((item) => {
            const netPrice = item.price * (1 - (item.discountPercent || 0) / 100);
            const conversion = UNIT_CONVERSIONS[item.unit] || { standardUnit: "count", factor: 1, displayUnit: "unit" };
            const totalUnits = (item.quantity || 0) * (item.packageCount || 1);
            const totalStandardUnits = totalUnits * conversion.factor;

            const unitPrice = totalStandardUnits > 0 ? netPrice / totalStandardUnits : 0;
            const rawUnitPrice = totalUnits > 0 ? netPrice / totalUnits : 0;

            return {
                ...item,
                netPrice,
                totalUnits,
                totalStandardUnits,
                unitPrice,
                rawUnitPrice,
                displayUnit: conversion.displayUnit,
                standardUnit: conversion.standardUnit
            };
        });
    }, [items]);

    const validProcessedItems = useMemo(() => {
        return processedItems.filter((i) => i.netPrice > 0 && i.totalStandardUnits > 0);
    }, [processedItems]);

    const bestValueItem = useMemo(() => {
        if (validProcessedItems.length === 0) return null;
        return [...validProcessedItems].sort((a, b) => a.unitPrice - b.unitPrice)[0];
    }, [validProcessedItems]);

    const worstValueItem = useMemo(() => {
        if (validProcessedItems.length < 2) return null;
        return [...validProcessedItems].sort((a, b) => b.unitPrice - a.unitPrice)[0];
    }, [validProcessedItems]);

    const maxSavingsPercent = useMemo(() => {
        if (!bestValueItem || !worstValueItem || worstValueItem.unitPrice === 0) return 0;
        return ((worstValueItem.unitPrice - bestValueItem.unitPrice) / worstValueItem.unitPrice) * 100;
    }, [bestValueItem, worstValueItem]);

    const handleAddItem = () => {
        const nextNumber = items.length + 1;
        const fallbackUnit = items.length > 0 ? items[0].unit : "oz";
        const newItem: ComparisonItem = {
            id: Date.now().toString(),
            name: `Option ${nextNumber}`,
            price: 0,
            quantity: 0,
            unit: fallbackUnit,
            packageCount: 1,
            discountPercent: 0
        };
        setItems([...items, newItem]);
        setActivePresetId(null);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length <= 2) return;
        setItems(items.filter((item) => item.id !== id));
        setActivePresetId(null);
    };

    const handleUpdateItem = (id: string, field: keyof ComparisonItem, value: any) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    return { ...item, [field]: value };
                }
                return item;
            })
        );
        setActivePresetId(null);
    };

    const handleApplyPreset = (preset: PresetScenario) => {
        setItems(preset.items);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        handleApplyPreset(PRESET_SCENARIOS[0]);
    };

    const handleCopySummary = () => {
        if (!bestValueItem) return;
        const textLines = [
            `Grocery & Unit Price Comparison (TwisterTools):`,
            `------------------------------------------------`,
            ...validProcessedItems.map((item) => {
                const isBest = bestValueItem && item.id === bestValueItem.id ? " [BEST VALUE]" : "";
                return `${item.name}: ${currencySymbol}${item.unitPrice.toFixed(4)} / ${item.displayUnit} (${currencySymbol}${item.netPrice.toFixed(2)} total)${isBest}`;
            }),
            `------------------------------------------------`,
            `Winner: ${bestValueItem.name} saves you ${maxSavingsPercent.toFixed(1)}% compared to the highest-priced option.`,
            `Calculate free at: https://twistertools.com/tools/calculators/unit-price-calculator`
        ];

        navigator.clipboard.writeText(textLines.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Item Name", "Retail Price", "Discount %", "Net Price", "Quantity", "Unit", "Packages", "Total Units", "Unit Price", "Standard Unit", "Is Winner"];
        const rows = validProcessedItems.map((item) => [
            `"${item.name}"`,
            item.price.toFixed(2),
            item.discountPercent,
            item.netPrice.toFixed(2),
            item.quantity,
            item.unit,
            item.packageCount,
            item.totalUnits,
            item.unitPrice.toFixed(6),
            item.displayUnit,
            bestValueItem && item.id === bestValueItem.id ? "YES" : "NO"
        ]);

        const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `unit_price_comparison.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Unit Price & Grocery Bulk Savings Calculator",
        "url": "https://twistertools.com/tools/calculators/unit-price-calculator",
        "description": "Compare cost per ounce, gram, pound, liter, and count across multiple grocery sizes, multipacks, and bulk deals to identify authentic savings.",
        "applicationCategory": "FinanceApplication",
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
                "name": "How is unit price calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Unit price is calculated by dividing the total net price of an item by its total quantity or standardized unit of measure (Unit Price = Total Price / Total Units). Standardizing units like ounces or grams allows direct financial comparison."
                }
            },
            {
                "@type": "Question",
                "name": "Are bulk items always cheaper per unit?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Not always. Supermarkets frequently price family-size or bulk items at a premium because shoppers assume larger packages offer inherent savings. Comparing cost per ounce or count reveals whether bulk packaging truly saves money."
                }
            },
            {
                "@type": "Question",
                "name": "What is shrinkflation and how do I spot it?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Shrinkflation is when manufacturers reduce product package sizes while keeping retail shelf prices identical. Tracking unit price per ounce or gram highlights hidden price increases that occur without changes to package sticker prices."
                }
            },
            {
                "@type": "Question",
                "name": "How do multipack and multi-buy grocery sales impact unit prices?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Multipacks (e.g., 6-packs or 12-packs) multiply individual item sizes by the pack count. True unit price requires calculating total volume or weight across all containers combined before applying promotional discounts."
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

                {/* Left Workspace Panel: Products & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                                Product Comparison List
                            </h2>
                            <div className="flex items-center gap-2">
                                <select
                                    value={currency}
                                    aria-label="Currency"
                                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 outline-none transition cursor-pointer"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CAD/AUD">CAD / AUD ($)</option>
                                </select>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Presets Pill Bar */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Instant Grocery Scenarios
                            </span>
                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                                {PRESET_SCENARIOS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => handleApplyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Item Entry Cards */}
                        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                            {items.map((item, index) => {
                                const isWinner = bestValueItem && bestValueItem.id === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-xl border transition-all duration-200 space-y-3 ${isWinner
                                                ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs"
                                                : "bg-slate-50/70 border-slate-200"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                    {index + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    aria-label="Item name"
                                                    onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                                                    placeholder="Product / Size Label"
                                                    className="w-full px-2.5 py-1 text-sm font-semibold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            {items.length > 2 && (
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                                                    title="Delete item"
                                                    aria-label="Delete item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            {/* Price Input */}
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                    Price ({currencySymbol})
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                                        {currencySymbol}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        aria-label="Price"
                                                        value={item.price === 0 ? "" : item.price}
                                                        onChange={(e) => handleNumberInput(e, (val) => handleUpdateItem(item.id, "price", val))}
                                                        placeholder="0.00"
                                                        className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Net Quantity per Pack */}
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                    Quantity / Size
                                                </label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    aria-label="Quantity or size"
                                                    value={item.quantity === 0 ? "" : item.quantity}
                                                    onChange={(e) => handleNumberInput(e, (val) => handleUpdateItem(item.id, "quantity", val))}
                                                    placeholder="e.g. 16"
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>

                                            {/* Unit Selector */}
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                    Unit of Measure
                                                </label>
                                                <select
                                                    value={item.unit}
                                                    aria-label="Unit of measure"
                                                    onChange={(e) => handleUpdateItem(item.id, "unit", e.target.value as UnitType)}
                                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <optgroup label="Weight (US & Metric)">
                                                        <option value="oz">Ounces (oz)</option>
                                                        <option value="lb">Pounds (lb)</option>
                                                        <option value="g">Grams (g)</option>
                                                        <option value="kg">Kilograms (kg)</option>
                                                    </optgroup>
                                                    <optgroup label="Volume (Liquid)">
                                                        <option value="fl oz">Fluid Ounces (fl oz)</option>
                                                        <option value="gal">Gallons (gal)</option>
                                                        <option value="ml">Milliliters (ml)</option>
                                                        <option value="l">Liters (L)</option>
                                                    </optgroup>
                                                    <optgroup label="Counts & Rolls">
                                                        <option value="count">Count / Items</option>
                                                        <option value="sheets">Sheets / Rolls</option>
                                                        <option value="pack">Packs</option>
                                                    </optgroup>
                                                </select>
                                            </div>

                                            {/* Multipack Count */}
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                    Pack Multiplier
                                                </label>
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="1"
                                                    aria-label="Pack multiplier"
                                                    value={item.packageCount === 0 ? "" : item.packageCount}
                                                    onChange={(e) => handleNumberInput(e, (val) => handleUpdateItem(item.id, "packageCount", Math.max(1, val)))}
                                                    placeholder="1"
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Optional Coupon / Discount */}
                                        <div className="flex items-center gap-3 pt-1 text-xs">
                                            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                                <Percent className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>Coupon / Sale (% off):</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                aria-label="Discount percentage"
                                                value={item.discountPercent === 0 ? "" : item.discountPercent}
                                                onChange={(e) => handleNumberInput(e, (val) => handleUpdateItem(item.id, "discountPercent", Math.min(100, Math.max(0, val))))}
                                                placeholder="0"
                                                className="w-20 px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-900 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Comparison Option Button */}
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 text-slate-700 hover:text-indigo-600 font-semibold text-xs transition"
                        >
                            <Plus className="w-4 h-4" />
                            Add Another Product / Size to Compare
                        </button>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Breakdown" : "Copy Savings Report"}
                        </button>
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Rankings & Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Value Ranking & Analysis
                            </h2>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                                {validProcessedItems.length} Valid Options
                            </span>
                        </div>

                        {/* Top Winner Card Banner */}
                        {bestValueItem ? (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Trophy className="w-3 h-3 text-amber-300" /> Lowest Unit Price Winner
                                    </span>
                                    {maxSavingsPercent > 0 && (
                                        <span className="text-xs font-black bg-emerald-950/40 px-2.5 py-0.5 rounded-md text-emerald-200">
                                            Save up to {maxSavingsPercent.toFixed(1)}%
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-baseline justify-between pt-1">
                                    <h3 className="text-lg font-extrabold truncate max-w-[200px] sm:max-w-xs">{bestValueItem.name}</h3>
                                    <div className="text-right">
                                        <span className="text-2xl font-black">{currencySymbol}{bestValueItem.unitPrice.toFixed(3)}</span>
                                        <span className="text-xs text-emerald-100"> / {bestValueItem.displayUnit}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-emerald-100 font-medium">
                                    Total: {currencySymbol}{bestValueItem.netPrice.toFixed(2)} for {bestValueItem.totalUnits} {bestValueItem.unit}
                                    {bestValueItem.packageCount > 1 ? ` (${bestValueItem.packageCount} packs)` : ""}
                                </p>
                            </div>
                        ) : (
                            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 space-y-2">
                                <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
                                <p className="text-sm font-semibold">Enter prices and quantities on the left to calculate the best value.</p>
                            </div>
                        )}

                        {/* Comparison Breakdown Cards */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Detailed Product Comparison
                            </h3>

                            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                                {[...validProcessedItems]
                                    .sort((a, b) => a.unitPrice - b.unitPrice)
                                    .map((item, rank) => {
                                        const isWinner = rank === 0;
                                        const premiumPercent = bestValueItem && bestValueItem.unitPrice > 0
                                            ? ((item.unitPrice - bestValueItem.unitPrice) / bestValueItem.unitPrice) * 100
                                            : 0;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${isWinner
                                                        ? "bg-emerald-50/70 border-emerald-300"
                                                        : "bg-slate-50 border-slate-200"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 ${isWinner ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                                                        }`}>
                                                        #{rank + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                                                            {isWinner && (
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 truncate">
                                                            {currencySymbol}{item.netPrice.toFixed(2)} total ({item.totalUnits} {item.unit})
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm font-extrabold text-slate-900">
                                                        {currencySymbol}{item.unitPrice.toFixed(4)}
                                                        <span className="text-[10px] text-slate-500 font-normal"> / {item.displayUnit}</span>
                                                    </p>
                                                    {isWinner ? (
                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                                                            Best Price
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-semibold text-rose-600">
                                                            +{premiumPercent.toFixed(1)}% higher
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Savings Insight Metrics */}
                        {bestValueItem && worstValueItem && worstValueItem.id !== bestValueItem.id && (
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                                <TrendingDown className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-indigo-900 leading-relaxed">
                                    <strong>Smart Shopper Insight:</strong> Choosing <strong>{bestValueItem.name}</strong> over <strong>{worstValueItem.name}</strong> cuts your unit cost by <strong>{maxSavingsPercent.toFixed(1)}%</strong>. For every $100 spent on this item, you retain <strong>{currencySymbol}{maxSavingsPercent.toFixed(2)}</strong> in savings.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Unit Normalization
                        </span>
                        <span>100% Private</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Unit Price Calculation Mechanics & Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is Unit Pricing? Master Formula & Grocery Economics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A <strong>unit price</strong> is the cost of a single unit of weight, volume, or count of an item (such as price per ounce, gram, pound, liter, or sheet). While retail shelf tags highlight the overall sticker price, unit pricing levels the playing field, allowing consumers to compare packages with different physical sizes, counts, and packaging styles.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Retailers and grocery chains frequently package goods in non-standard quantities (such as 14.3 oz boxes vs. 19.8 oz family packs). Without normalizing these values into a single common baseline, determining the genuine lowest price is nearly impossible through casual mental math.
                    </p>

                    {/* Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> The Universal Unit Price Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            To find the exact cost per unit across any package format or multipack bundle:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            Unit Price = (Retail Price × (1 - Discount %)) / (Package Quantity × Pack Count × Unit Conversion Factor)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>Retail Price:</strong> Shelf sticker price before coupons</div>
                            <div><strong>Package Quantity:</strong> Stated volume or weight per container</div>
                            <div><strong>Pack Count:</strong> Number of containers in the multi-pack</div>
                            <div><strong>Conversion Factor:</strong> Multiplier to standardize units (e.g., 1 lb = 16 oz)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Worked Mathematical Example */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Example: Olive Oil Size Comparison
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Suppose you are purchasing extra virgin olive oil and evaluating three packaging configurations on the grocery store shelf:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Shelf Price & Quantity Breakdown:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Option A (Standard Glass Bottle):</strong> $8.99 for 16.9 fl oz (500 ml)</li>
                            <li><strong>Option B (Large Bottle):</strong> $14.49 for 33.8 fl oz (1 Liter)</li>
                            <li><strong>Option C (Bulk Tin):</strong> $32.99 for 101.4 fl oz (3 Liters)</li>
                        </ul>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Option</th>
                                    <th className="p-3">Total Cost</th>
                                    <th className="p-3">Total Volume</th>
                                    <th className="p-3">Cost Per Fluid Ounce</th>
                                    <th className="p-3">Cost Per 100ml</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Option A (Small)</td>
                                    <td className="p-3">$8.99</td>
                                    <td className="p-3">16.9 fl oz (500 ml)</td>
                                    <td className="p-3 text-rose-600 font-semibold">$0.532 / fl oz</td>
                                    <td className="p-3">$1.798 / 100ml</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Option B (Medium)</td>
                                    <td className="p-3">$14.49</td>
                                    <td className="p-3">33.8 fl oz (1,000 ml)</td>
                                    <td className="p-3 font-semibold">$0.428 / fl oz</td>
                                    <td className="p-3">$1.449 / 100ml</td>
                                </tr>
                                <tr className="bg-emerald-50/50 hover:bg-emerald-50">
                                    <td className="p-3 font-bold text-emerald-900">Option C (Bulk 3L Tin)</td>
                                    <td className="p-3 font-bold text-slate-900">$32.99</td>
                                    <td className="p-3 font-bold text-slate-900">101.4 fl oz (3,000 ml)</td>
                                    <td className="p-3 font-extrabold text-emerald-700">$0.325 / fl oz</td>
                                    <td className="p-3 font-extrabold text-emerald-700">$1.099 / 100ml</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>The Takeaway:</strong> Purchasing the bulk 3-Liter tin (Option C) yields a <strong>38.9% discount</strong> per ounce compared to buying the standard glass bottle (Option A).
                    </p>
                </section>

                {/* Card 3: The Bulk Buying Myth vs Reality */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The "Bulk Buying" Myth: When Larger Packages Cost More
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Consumers assume that buying in bulk guarantees lower unit costs. However, retail data shows that supermarkets exploit this cognitive bias through a pricing phenomenon known as <strong>quantity surcharging</strong>.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ArrowDownRight className="w-4 h-4 text-indigo-600" /> Promotional Bias
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Smaller containers are regularly discounted during weekly circular promotions, making two small cans significantly cheaper than one jumbo can.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ArrowDownRight className="w-4 h-4 text-indigo-600" /> Convenience Packaging
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Individually wrapped snack portions, single-serve pouches, or EZ-pour spouts carry manufacturing premiums that distort true price-per-ounce value.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ArrowDownRight className="w-4 h-4 text-indigo-600" /> Shrinkage & Spoilage
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Bulk savings only materialize if goods are consumed before expiration. Discarding 20% of a bulk perishables package completely wipes out a 15% unit cost discount.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Shrinkflation Detection Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Beating Shrinkflation: Spotting Hidden Grocery Price Hikes
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Shrinkflation</strong> occurs when consumer packaged goods (CPG) companies subtly reduce product dimensions or net weights while keeping retail prices stable. By altering box bevels, indenting jar bottoms, or thinning tissue paper, brands increase their profit margins without alerting casual shoppers.
                    </p>

                    <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                        <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                            Three Rules to Protect Your Grocery Budget:
                        </h3>
                        <ul className="list-disc list-inside text-xs md:text-sm text-indigo-800 space-y-1">
                            <li><strong>Ignore Front-of-Box Badges:</strong> Labels such as "Family Size" or "Mega Pack" have no legal definitions and can be resized arbitrarily.</li>
                            <li><strong>Always Check Net Weight:</strong> Read the printed net weight (e.g., 14.5 oz vs. 16.0 oz) rather than relying on box height.</li>
                            <li><strong>Log Your Target Staples:</strong> Record your benchmark price-per-ounce for coffee, pasta, and laundry detergent to instantly detect stealth increases.</li>
                        </ul>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
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
                                How is unit price calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Unit price is calculated by dividing the total net price of an item by its total quantity or standardized unit of measure (Unit Price = Total Price / Total Units). Standardizing units like ounces or grams allows direct financial comparison.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are bulk items always cheaper per unit?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Not always. Supermarkets frequently price family-size or bulk items at a premium because shoppers assume larger packages offer inherent savings. Comparing cost per ounce or count reveals whether bulk packaging truly saves money.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is shrinkflation and how do I spot it?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Shrinkflation is when manufacturers reduce product package sizes while keeping retail shelf prices identical. Tracking unit price per ounce or gram highlights hidden price increases that occur without changes to package sticker prices.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do multipack and multi-buy grocery sales impact unit prices?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Multipacks (e.g., 6-packs or 12-packs) multiply individual item sizes by the pack count. True unit price requires calculating total volume or weight across all containers combined before applying promotional discounts.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Disclaimer Section */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Unit Comparison Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This unit price calculator is provided for comparative consumer budgeting and educational purposes only. Always verify listed net weights, volume measures, and store promotional tags directly at checkout.
                    </p>
                </section>

            </div>
        </div>
    );
}