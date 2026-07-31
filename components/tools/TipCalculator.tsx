// components/tools/TipCalculator.tsx
"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Calculator,
    DollarSign,
    Users,
    Percent,
    Receipt,
    Plus,
    Trash2,
    RefreshCw,
    Copy,
    Check,
    Download,
    BarChart3,
    HelpCircle,
    BookOpen,
    Lightbulb,
    AlertTriangle,
    ShieldCheck,
    Sparkles,
    User,
    PieChart,
    CreditCard,
    ArrowUpRight,
    Split,
    Info,
    CheckCircle2
} from "lucide-react";

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

interface CustomItem {
    id: string;
    name: string;
    amount: number;
    assignedTo: string; // "all" or specific person name
}

interface QuickTipPreset {
    label: string;
    value: number;
}

const TIP_PRESETS: QuickTipPreset[] = [
    { label: "10%", value: 10 },
    { label: "15%", value: 15 },
    { label: "18%", value: 18 },
    { label: "20%", value: 20 },
    { label: "25%", value: 25 },
];

export default function TipCalculator() {
    // Basic State
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const currencySymbol = currencySymbols[currency];

    const [billAmount, setBillAmount] = useState<number>(120);
    const [tipPercentage, setTipPercentage] = useState<number>(18);
    const [numberOfPeople, setNumberOfPeople] = useState<number>(4);
    const [taxPercentage, setTaxPercentage] = useState<number>(8.5);
    const [tipCalculatedOnTax, setTipCalculatedOnTax] = useState<boolean>(false);

    // Advanced Itemized Split State
    const [enableItemizedSplit, setEnableItemizedSplit] = useState<boolean>(false);
    const [peopleNames, setPeopleNames] = useState<string[]>(["Alice", "Bob", "Charlie", "David"]);
    const [customItems, setCustomItems] = useState<CustomItem[]>([
        { id: "i1", name: "Appetizers", amount: 25, assignedTo: "all" },
        { id: "i2", name: "Steak Dinner", amount: 45, assignedTo: "Alice" },
        { id: "i3", name: "Pasta Special", amount: 28, assignedTo: "Bob" },
        { id: "i4", name: "Dessert Platter", amount: 22, assignedTo: "all" },
    ]);

    // UI state
    const [copied, setCopied] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    // Keep people list synced with group count
    const handlePeopleCountChange = (count: number) => {
        const validCount = Math.max(1, Math.min(50, count));
        setNumberOfPeople(validCount);

        if (validCount > peopleNames.length) {
            const newNames = [...peopleNames];
            for (let i = peopleNames.length; i < validCount; i++) {
                newNames.push(`Person ${i + 1}`);
            }
            setPeopleNames(newNames);
        } else if (validCount < peopleNames.length) {
            setPeopleNames(peopleNames.slice(0, validCount));
        }
    };

    const handlePersonNameChange = (index: number, name: string) => {
        const updated = [...peopleNames];
        updated[index] = name || `Person ${index + 1}`;
        setPeopleNames(updated);
    };

    // Itemized list handlers
    const addCustomItem = () => {
        setCustomItems([
            ...customItems,
            {
                id: `item-${Date.now()}`,
                name: "New Shared Item",
                amount: 15,
                assignedTo: "all",
            },
        ]);
    };

    const updateCustomItem = (id: string, field: keyof CustomItem, value: string | number) => {
        setCustomItems(
            customItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const removeCustomItem = (id: string) => {
        setCustomItems(customItems.filter((item) => item.id !== id));
    };

    // Main Computations
    const calculations = useMemo(() => {
        let effectiveBillAmount = billAmount;

        // If itemized calculation is toggled, compute total from custom items
        if (enableItemizedSplit) {
            effectiveBillAmount = customItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        }

        const taxAmount = (effectiveBillAmount * taxPercentage) / 100;
        const tipBase = tipCalculatedOnTax ? effectiveBillAmount + taxAmount : effectiveBillAmount;
        const tipAmount = (tipBase * tipPercentage) / 100;
        const grandTotal = effectiveBillAmount + taxAmount + tipAmount;

        const totalPerPerson = numberOfPeople > 0 ? grandTotal / numberOfPeople : 0;
        const billPerPerson = numberOfPeople > 0 ? effectiveBillAmount / numberOfPeople : 0;
        const tipPerPerson = numberOfPeople > 0 ? tipAmount / numberOfPeople : 0;
        const taxPerPerson = numberOfPeople > 0 ? taxAmount / numberOfPeople : 0;

        // Calculate individual breakdowns for itemized mode
        const individualBreakdowns = peopleNames.slice(0, numberOfPeople).map((name) => {
            let individualSubtotal = 0;

            if (enableItemizedSplit) {
                customItems.forEach((item) => {
                    const amt = Number(item.amount) || 0;
                    if (item.assignedTo === "all") {
                        individualSubtotal += amt / numberOfPeople;
                    } else if (item.assignedTo === name) {
                        individualSubtotal += amt;
                    }
                });
            } else {
                individualSubtotal = effectiveBillAmount / numberOfPeople;
            }

            const shareRatio = effectiveBillAmount > 0 ? individualSubtotal / effectiveBillAmount : 1 / numberOfPeople;
            const indTax = taxAmount * shareRatio;
            const indTip = tipAmount * shareRatio;
            const indTotal = individualSubtotal + indTax + indTip;

            return {
                name,
                subtotal: individualSubtotal,
                tax: indTax,
                tip: indTip,
                total: indTotal,
            };
        });

        return {
            effectiveBillAmount,
            taxAmount,
            tipAmount,
            grandTotal,
            totalPerPerson,
            billPerPerson,
            tipPerPerson,
            taxPerPerson,
            individualBreakdowns,
        };
    }, [
        billAmount,
        tipPercentage,
        numberOfPeople,
        taxPercentage,
        tipCalculatedOnTax,
        enableItemizedSplit,
        customItems,
        peopleNames,
    ]);

    const handleReset = () => {
        setCurrency("USD");
        setBillAmount(120);
        setTipPercentage(18);
        setNumberOfPeople(4);
        setTaxPercentage(8.5);
        setTipCalculatedOnTax(false);
        setEnableItemizedSplit(false);
        setPeopleNames(["Alice", "Bob", "Charlie", "David"]);
        setCustomItems([
            { id: "i1", name: "Appetizers", amount: 25, assignedTo: "all" },
            { id: "i2", name: "Steak Dinner", amount: 45, assignedTo: "Alice" },
            { id: "i3", name: "Pasta Special", amount: 28, assignedTo: "Bob" },
            { id: "i4", name: "Dessert Platter", amount: 22, assignedTo: "all" },
        ]);
    };

    const handleCopySummary = () => {
        let summaryText = `Tip & Bill Split Summary (TwisterTools):\n`;
        summaryText += `----------------------------------------\n`;
        summaryText += `Base Bill: ${currencySymbol}${calculations.effectiveBillAmount.toFixed(2)}\n`;
        summaryText += `Tax (${taxPercentage}%): ${currencySymbol}${calculations.taxAmount.toFixed(2)}\n`;
        summaryText += `Tip (${tipPercentage}%): ${currencySymbol}${calculations.tipAmount.toFixed(2)}\n`;
        summaryText += `GRAND TOTAL: ${currencySymbol}${calculations.grandTotal.toFixed(2)}\n`;
        summaryText += `Split (${numberOfPeople} People): ${currencySymbol}${calculations.totalPerPerson.toFixed(2)} per person\n`;
        summaryText += `----------------------------------------\n`;

        if (enableItemizedSplit) {
            summaryText += `Individual Breakdown:\n`;
            calculations.individualBreakdowns.forEach((person) => {
                summaryText += `- ${person.name}: ${currencySymbol}${person.total.toFixed(2)} (Sub: ${currencySymbol}${person.subtotal.toFixed(2)}, Tip: ${currencySymbol}${person.tip.toFixed(2)})\n`;
            });
            summaryText += `----------------------------------------\n`;
        }

        summaryText += `Calculated at twistertools.com/tools/calculators/tip-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Person / Category", "Subtotal", "Tax Share", "Tip Share", `Total Owed (${currencySymbol})`].join(",");
        const rows = calculations.individualBreakdowns.map(
            (p) => `"${p.name}",${p.subtotal.toFixed(2)},${p.tax.toFixed(2)},${p.tip.toFixed(2)},${p.total.toFixed(2)}`
        );
        const summaryRows = [
            "",
            `"Bill Subtotal",${calculations.effectiveBillAmount.toFixed(2)},,,`,
            `"Total Tax",,${calculations.taxAmount.toFixed(2)},,`,
            `"Total Tip",,,${calculations.tipAmount.toFixed(2)},`,
            `"GRAND TOTAL",,,,${calculations.grandTotal.toFixed(2)}`,
        ];

        const csvContent = [headers, ...rows, ...summaryRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `bill_split_statement_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured WebApp & FAQ Schema
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Tip & Bill Splitter Calculator",
        "url": "https://twistertools.com/tools/calculators/tip-calculator",
        "description": "Calculate restaurant tips, sales tax, and group bill splits instantly. Supports custom percentage presets, pre/post-tax calculations, and itemized individual breakdowns.",
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
                "name": "Should you calculate tip before or after sales tax?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard tipping etiquette dictates calculating tips on the pre-tax bill total. Tax goes directly to local government authorities, so tipping on sales tax means you are tipping on a government surcharge rather than the dining service provided."
                }
            },
            {
                "@type": "Question",
                "name": "What is the standard tip percentage for restaurant dining?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In North America, standard sit-down restaurant tipping ranges from 15% to 20% of the pre-tax subtotal. Exceptional service typically earns 20% to 25%, while 10% to 12% is common for minimal service or buffets."
                }
            },
            {
                "@type": "Question",
                "name": "How does itemized bill splitting work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Itemized bill splitting assigns specific menu items directly to the person who ordered them, while evenly dividing shared appetizers or drinks. Sales tax and gratuity are then calculated proportionally based on each person's subtotal ratio."
                }
            },
            {
                "@type": "Question",
                "name": "What is a automatic gratuity or service charge?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Many restaurants automatically add a mandatory service fee (usually 18% to 20%) to parties of 6 or more. Always verify your receipt to ensure you don't accidentally double-tip if automatic gratuity is already added."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Left Workspace Panel: Input Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px]">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-indigo-600" />
                                Bill & Group Inputs
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Currency & Calculation Mode Toggle */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Currency
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50 cursor-pointer"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="CAD/AUD">CAD/AUD ($)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Split Mode
                                </label>
                                <button
                                    onClick={() => setEnableItemizedSplit(!enableItemizedSplit)}
                                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${enableItemizedSplit
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                >
                                    <Split className="w-3.5 h-3.5" />
                                    {enableItemizedSplit ? "Itemized Mode" : "Equal Split"}
                                </button>
                            </div>
                        </div>

                        {/* Even Split Mode Base Inputs */}
                        {!enableItemizedSplit ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Total Bill Subtotal (Pre-Tax)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                                            {currencySymbol}
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={billAmount || ""}
                                            onChange={(e) => setBillAmount(Math.max(0, Number(e.target.value)))}
                                            className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Itemized Custom Items Entry Mode */
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                        Itemized Menu Items
                                    </label>
                                    <button
                                        onClick={addCustomItem}
                                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition border border-indigo-100 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Item
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                    {customItems.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateCustomItem(item.id, "name", e.target.value)}
                                                placeholder="Item Name"
                                                className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <div className="relative w-24">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                                                    {currencySymbol}
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.amount || ""}
                                                    onChange={(e) => updateCustomItem(item.id, "amount", Math.max(0, Number(e.target.value)))}
                                                    className="w-full pl-5 pr-1.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <select
                                                value={item.assignedTo}
                                                onChange={(e) => updateCustomItem(item.id, "assignedTo", e.target.value)}
                                                className="w-28 px-1.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                            >
                                                <option value="all">Split All</option>
                                                {peopleNames.slice(0, numberOfPeople).map((pName) => (
                                                    <option key={pName} value={pName}>
                                                        {pName}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => removeCustomItem(item.id)}
                                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tip Percentage Selection */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Tip Percentage
                                </label>
                                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                    {tipPercentage}%
                                </span>
                            </div>

                            <div className="grid grid-cols-5 gap-1.5">
                                {TIP_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => setTipPercentage(preset.value)}
                                        className={`py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${tipPercentage === preset.value
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={tipPercentage}
                                onChange={(e) => setTipPercentage(Number(e.target.value))}
                                className="w-full accent-indigo-600 cursor-pointer mt-1"
                            />
                        </div>

                        {/* Group Size and Tax Rate Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Number of People
                                </label>
                                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                                    <button
                                        onClick={() => handlePeopleCountChange(numberOfPeople - 1)}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={numberOfPeople}
                                        onChange={(e) => handlePeopleCountChange(Number(e.target.value))}
                                        className="w-full text-center py-2 bg-transparent text-xs font-bold text-slate-900 outline-none"
                                    />
                                    <button
                                        onClick={() => handlePeopleCountChange(numberOfPeople + 1)}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Sales Tax (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={taxPercentage || ""}
                                        onChange={(e) => setTaxPercentage(Math.max(0, Number(e.target.value)))}
                                        className="w-full pr-7 pl-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Person Name Input Fields if itemized or customizable */}
                        {enableItemizedSplit && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Customize Person Names
                                </label>
                                <div className="grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                    {peopleNames.slice(0, numberOfPeople).map((name, idx) => (
                                        <input
                                            key={idx}
                                            type="text"
                                            value={name}
                                            onChange={(e) => handlePersonNameChange(idx, e.target.value)}
                                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder={`Person ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Post-Tax Tip Calculation Toggle */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <input
                                type="checkbox"
                                id="tipOnTaxToggle"
                                checked={tipCalculatedOnTax}
                                onChange={(e) => setTipCalculatedOnTax(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                            />
                            <label htmlFor="tipOnTaxToggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                                Calculate tip on post-tax total (default is pre-tax subtotal)
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Summary" : "Copy Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Dynamic Results & Split Analysis */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px]" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Payment Split Breakdown
                            </h2>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                {numberOfPeople} {numberOfPeople === 1 ? "Person" : "People"}
                            </span>
                        </div>

                        {/* Highlight Card: Amount Per Person */}
                        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                                Amount Owed Per Person (Equal Share)
                            </p>
                            <p className="text-4xl font-extrabold text-indigo-900 mt-1 flex items-center gap-1">
                                <span>{currencySymbol}</span>
                                <span>{calculations.totalPerPerson.toFixed(2)}</span>
                            </p>
                            <div className="flex items-center justify-between text-xs font-semibold mt-3 pt-2 border-t border-indigo-200/60 text-slate-600">
                                <span>Bill: {currencySymbol}{calculations.billPerPerson.toFixed(2)}</span>
                                <span>Tax: {currencySymbol}{calculations.taxPerPerson.toFixed(2)}</span>
                                <span>Tip: {currencySymbol}{calculations.tipPerPerson.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Overall Bill Totals Metric Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="text-[11px] font-bold text-slate-500 uppercase">Subtotal</p>
                                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                                    {currencySymbol}{calculations.effectiveBillAmount.toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="text-[11px] font-bold text-slate-500 uppercase">Total Tax</p>
                                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                                    {currencySymbol}{calculations.taxAmount.toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                <p className="text-[11px] font-bold text-emerald-800 uppercase">Total Tip</p>
                                <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                                    {currencySymbol}{calculations.tipAmount.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Grand Total Summary Box */}
                        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Grand Total Bill</p>
                                <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">
                                    {currencySymbol}{calculations.grandTotal.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right text-xs text-slate-400 font-medium">
                                <p>{tipPercentage}% Tip Included</p>
                                <p>{taxPercentage}% Sales Tax</p>
                            </div>
                        </div>

                        {/* Itemized Individual Breakdown List */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                <span>Individual Owed Shares</span>
                                {enableItemizedSplit && <span className="text-indigo-600 font-semibold">(Custom Itemized)</span>}
                            </h3>

                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                {calculations.individualBreakdowns.map((person, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                                                {person.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-slate-800">{person.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-extrabold text-slate-900">
                                                {currencySymbol}{person.total.toFixed(2)}
                                            </span>
                                            <div className="text-[10px] text-slate-400">
                                                Sub: {currencySymbol}{person.subtotal.toFixed(2)} + Tip/Tax
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side Local Calculation
                        </span>
                        <span className="font-semibold text-slate-700">TwisterTools Financial Engine</span>
                    </div>
                </div>
            </div>

            {/* Financial Disclaimer Banner Alert */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> This calculator is provided for informational and educational purposes only and does not constitute financial, legal, or investment advice. Results are estimates based on user inputs and assumed parameters.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Dining & Tipping Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mastering Restaurant Tipping Etiquette & Bill Splitting
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating gratuity and splitting group dining bills can quickly turn awkward without clear guidelines. Modern tipping standards vary widely by venue type, party size, and country. Using a structured tip calculator ensures service workers are compensated fairly while preventing billing overcharges or miscalculated shares among dining companions.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-indigo-600" /> Standard Sit-Down (15% - 20%)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Standard gratuity for full table service at sit-down dining establishments. 18% is widely accepted as the benchmark for good service across North America.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Exceptional Service (20% - 25%)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Reserved for fine dining, sommelier recommendations, or servers going above and beyond to accommodate complex dietary requests or large party logistics.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-indigo-600" /> Auto-Gratuity & Parties (18%+)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Most restaurants apply mandatory 18% to 20% service fees for parties of 6 or more. Always check itemized receipts before calculating additional tips.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Pre-Tax vs Post-Tax Math & Formula Breakdown */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Breakdown: Pre-Tax vs. Post-Tax Tip Math
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A common question when calculating tips is whether gratuity should be applied to the bill subtotal before or after local sales taxes are added. The standard consensus among etiquette experts and accounting standards is to calculate tips on the <strong>pre-tax subtotal</strong>.
                    </p>

                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Info className="w-4 h-4" /> Core Gratuity & Bill Split Formulas
                        </h3>
                        <p className="text-xs text-slate-300">
                            Our engine uses the following precise mathematical calculations for equal and itemized splits:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Gratuity Amount:</strong> Tip = Bill Subtotal × (Tip % / 100)</div>
                            <div><strong>2. Sales Tax Amount:</strong> Tax = Bill Subtotal × (Tax % / 100)</div>
                            <div><strong>3. Grand Total:</strong> Grand Total = Bill Subtotal + Tax + Tip</div>
                            <div><strong>4. Equal Per-Person Share:</strong> Individual Share = Grand Total / Number of People</div>
                        </div>
                    </div>
                </section>

                {/* Card 3: Worked Case Study Example */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Step-by-Step Example: Dinner Split for 4 People
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Consider a group dinner with a base bill subtotal of <strong>$160.00</strong>, a local sales tax rate of <strong>8.0%</strong>, and a requested gratuity rate of <strong>20.0%</strong> split equally among <strong>4 diners</strong>:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Calculation Stage</th>
                                    <th className="p-3">Formula / Step</th>
                                    <th className="p-3">Calculated Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1. Pre-Tax Subtotal</td>
                                    <td className="p-3">Base Bill Input</td>
                                    <td className="p-3">$160.00</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2. Sales Tax (8.0%)</td>
                                    <td className="p-3">$160.00 × 0.08</td>
                                    <td className="p-3 text-slate-700">$12.80</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3. Gratuity (20.0%)</td>
                                    <td className="p-3">$160.00 × 0.20</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$32.00</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4. Grand Total</td>
                                    <td className="p-3">$160.00 + $12.80 + $32.00</td>
                                    <td className="p-3 font-bold text-slate-900">$204.80</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">5. Individual Share (4 People)</td>
                                    <td className="p-3 font-medium text-indigo-800">$204.80 / 4</td>
                                    <td className="p-3 font-extrabold text-indigo-700">$51.20 / person</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Best Practices & Common Pitfalls */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Group Dining Best Practices & Pitfalls to Avoid
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">1. Check for Automatic Gratuity First</h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Always review receipt line items for mandatory service fees or group charges before computing gratuity to avoid unintended double-tipping.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">2. Account for Alcohol Separately if Needed</h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Expensive bottles of wine or cocktails can skew equal splits significantly. Use itemized mode to keep alcohol costs assigned fairly to those consuming it.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">3. Factor In Digital Payment App Fees</h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                When sending money transfers via Venmo, Zelle, or PayPal, ensure the primary bill payer receives exact calculated totals to avoid micro-shortages.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">4. Communicate Bill Preferences Early</h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Asking servers for separate checks at the beginning of the meal saves hassle and time at the end of dining.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static FAQ Section */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
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
                                Should you calculate tip before or after sales tax?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Standard tipping etiquette dictates calculating tips on the pre-tax bill total. Tax goes directly to local government authorities, so tipping on sales tax means you are tipping on a government surcharge rather than the dining service provided.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the standard tip percentage for restaurant dining?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In North America, standard sit-down restaurant tipping ranges from 15% to 20% of the pre-tax subtotal. Exceptional service typically earns 20% to 25%, while 10% to 12% is common for minimal service or buffets.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does itemized bill splitting work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Itemized bill splitting assigns specific menu items directly to the person who ordered them, while evenly dividing shared appetizers or drinks. Sales tax and gratuity are then calculated proportionally based on each person's subtotal ratio.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is an automatic gratuity or service charge?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Many restaurants automatically add a mandatory service fee (usually 18% to 20%) to parties of 6 or more. Always verify your receipt to ensure you don't accidentally double-tip if automatic gratuity is already added.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Financial Disclaimer Section */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 text-xs text-slate-500">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Essential Financial Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This calculator is provided for informational and educational purposes only and does not constitute financial, legal, or investment advice. Results are estimates based on user inputs and assumed parameters.
                    </p>
                </section>

            </div>
        </div>
    );
}