"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Scale,
    DollarSign,
    HelpCircle,
    BookOpen,
    Calendar,
    RefreshCw,
    Download,
    Copy,
    Check,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Calculator,
    PieChart,
    Lightbulb,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Trash2,
    Building2,
    Home,
    Landmark,
    TrendingUp,
    Briefcase,
    CreditCard,
    Car,
    ShieldAlert,
    Target,
    Layers,
    CheckCircle2,
    Zap
} from "lucide-react";

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

interface AssetItem {
    id: string;
    name: string;
    amount: number;
    category: "liquid" | "investment" | "property" | "other";
}

interface LiabilityItem {
    id: string;
    name: string;
    amount: number;
    category: "short_term" | "long_term" | "mortgage" | "other";
}

interface Preset {
    id: string;
    label: string;
    tag: string;
    assets: Omit<AssetItem, "id">[];
    liabilities: Omit<LiabilityItem, "id">[];
}

const PRESETS: Preset[] = [
    {
        id: "early-career",
        label: "Young Professional",
        tag: "Career Start",
        assets: [
            { name: "Checking & Savings", amount: 12000, category: "liquid" },
            { name: "401(k) / Roth IRA", amount: 28000, category: "investment" },
            { name: "Brokerage Account", amount: 8500, category: "investment" },
            { name: "Used Vehicle", amount: 15000, category: "other" },
        ],
        liabilities: [
            { name: "Student Loans", amount: 22000, category: "long_term" },
            { name: "Auto Loan", amount: 9500, category: "short_term" },
            { name: "Credit Cards", amount: 1200, category: "short_term" },
        ],
    },
    {
        id: "mid-career-homeowner",
        label: "Mid-Career Homeowner",
        tag: "Family Baseline",
        assets: [
            { name: "Emergency Fund / Cash", amount: 35000, category: "liquid" },
            { name: "Retirement Accounts", amount: 240000, category: "investment" },
            { name: "Primary Residence", amount: 480000, category: "property" },
            { name: "Taxable Stock Portfolio", amount: 65000, category: "investment" },
            { name: "Vehicles Value", amount: 38000, category: "other" },
        ],
        liabilities: [
            { name: "Home Mortgage", amount: 310000, category: "mortgage" },
            { name: "Auto Loan", amount: 14000, category: "short_term" },
        ],
    },
    {
        id: "high-net-worth",
        label: "Established Investor",
        tag: "Wealth Preservation",
        assets: [
            { name: "High-Yield Cash / Money Market", amount: 120000, category: "liquid" },
            { name: "Retirement Portfolio (IRAs/401k)", amount: 780000, category: "investment" },
            { name: "Real Estate Equity & Properties", amount: 950000, category: "property" },
            { name: "Business Equity / Angel Stakes", amount: 250000, category: "investment" },
            { name: "Precious Metals & Valuables", amount: 45000, category: "other" },
        ],
        liabilities: [
            { name: "Investment Property Mortgages", amount: 420000, category: "mortgage" },
            { name: "Revolving Credit Line", amount: 15000, category: "short_term" },
        ],
    },
];

export default function NetWorthCalculator() {
    // Currency selection state
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const currencySymbol = currencySymbols[currency];

    // Dynamic Asset Items
    const [assets, setAssets] = useState<AssetItem[]>([
        { id: "a1", name: "Cash & Checking", amount: 15000, category: "liquid" },
        { id: "a2", name: "High-Yield Savings", amount: 25000, category: "liquid" },
        { id: "a3", name: "Stock & ETF Portfolio", amount: 85000, category: "investment" },
        { id: "a4", name: "Retirement Accounts (401k/IRA)", amount: 110000, category: "investment" },
        { id: "a5", name: "Primary Home Value", amount: 350000, category: "property" },
        { id: "a6", name: "Vehicles & Personal Assets", amount: 22000, category: "other" },
    ]);

    // Dynamic Liability Items
    const [liabilities, setLiabilities] = useState<LiabilityItem[]>([
        { id: "l1", name: "Home Mortgage", amount: 240000, category: "mortgage" },
        { id: "l2", name: "Auto Loan", amount: 12000, category: "short_term" },
        { id: "l3", name: "Credit Card Balances", amount: 2500, category: "short_term" },
        { id: "l4", name: "Student Loans", amount: 18000, category: "long_term" },
    ]);

    // Target tracking and UI states
    const [targetNetWorth, setTargetNetWorth] = useState<number>(500000);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"summary" | "breakdown">("summary");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Dynamic Item Handlers (Assets)
    const addAsset = () => {
        const newAsset: AssetItem = {
            id: `a-${Date.now()}`,
            name: "New Asset Item",
            amount: 5000,
            category: "investment",
        };
        setAssets([...assets, newAsset]);
        setActivePresetId(null);
    };

    const updateAsset = (id: string, field: keyof AssetItem, value: string | number) => {
        setAssets(
            assets.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
        setActivePresetId(null);
    };

    const removeAsset = (id: string) => {
        setAssets(assets.filter((item) => item.id !== id));
        setActivePresetId(null);
    };

    // Dynamic Item Handlers (Liabilities)
    const addLiability = () => {
        const newLiability: LiabilityItem = {
            id: `l-${Date.now()}`,
            name: "New Debt / Loan",
            amount: 2000,
            category: "short_term",
        };
        setLiabilities([...liabilities, newLiability]);
        setActivePresetId(null);
    };

    const updateLiability = (id: string, field: keyof LiabilityItem, value: string | number) => {
        setLiabilities(
            liabilities.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
        setActivePresetId(null);
    };

    const removeLiability = (id: string) => {
        setLiabilities(liabilities.filter((item) => item.id !== id));
        setActivePresetId(null);
    };

    // Main Calculations
    const calculations = useMemo(() => {
        const totalAssets = assets.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalLiabilities = liabilities.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const netWorth = totalAssets - totalLiabilities;

        const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
        const equityPercentage = totalAssets > 0 ? (netWorth / totalAssets) * 100 : 0;
        const progressToTarget = targetNetWorth > 0 ? (netWorth / targetNetWorth) * 100 : 0;

        // Categorical Asset Breakdown
        const assetBreakdown = {
            liquid: assets.filter(a => a.category === "liquid").reduce((sum, a) => sum + (Number(a.amount) || 0), 0),
            investment: assets.filter(a => a.category === "investment").reduce((sum, a) => sum + (Number(a.amount) || 0), 0),
            property: assets.filter(a => a.category === "property").reduce((sum, a) => sum + (Number(a.amount) || 0), 0),
            other: assets.filter(a => a.category === "other").reduce((sum, a) => sum + (Number(a.amount) || 0), 0),
        };

        // Categorical Liability Breakdown
        const liabilityBreakdown = {
            short_term: liabilities.filter(l => l.category === "short_term").reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
            long_term: liabilities.filter(l => l.category === "long_term").reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
            mortgage: liabilities.filter(l => l.category === "mortgage").reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
            other: liabilities.filter(l => l.category === "other").reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
        };

        return {
            totalAssets,
            totalLiabilities,
            netWorth,
            debtToAssetRatio,
            equityPercentage,
            progressToTarget,
            assetBreakdown,
            liabilityBreakdown,
            isPositive: netWorth >= 0,
        };
    }, [assets, liabilities, targetNetWorth]);

    // Apply Quick Presets
    const applyPreset = (preset: Preset) => {
        setAssets(preset.assets.map((a, idx) => ({ ...a, id: `preset-a-${idx}` })));
        setLiabilities(preset.liabilities.map((l, idx) => ({ ...l, id: `preset-l-${idx}` })));
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setAssets([
            { id: "a1", name: "Cash & Checking", amount: 15000, category: "liquid" },
            { id: "a2", name: "High-Yield Savings", amount: 25000, category: "liquid" },
            { id: "a3", name: "Stock & ETF Portfolio", amount: 85000, category: "investment" },
            { id: "a4", name: "Retirement Accounts", amount: 110000, category: "investment" },
            { id: "a5", name: "Primary Home Value", amount: 350000, category: "property" },
        ]);
        setLiabilities([
            { id: "l1", name: "Home Mortgage", amount: 240000, category: "mortgage" },
            { id: "l2", name: "Auto Loan", amount: 12000, category: "short_term" },
            { id: "l3", name: "Credit Cards", amount: 2500, category: "short_term" },
        ]);
        setTargetNetWorth(500000);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Net Worth Financial Statement (TwisterTools):
----------------------------------------
Currency: ${currency}
Total Assets: ${currencySymbol}${calculations.totalAssets.toLocaleString()}
Total Liabilities: ${currencySymbol}${calculations.totalLiabilities.toLocaleString()}
----------------------------------------
TOTAL NET WORTH: ${currencySymbol}${calculations.netWorth.toLocaleString()}
Equity Ratio: ${calculations.equityPercentage.toFixed(1)}%
Debt-to-Asset Ratio: ${calculations.debtToAssetRatio.toFixed(1)}%
Target Milestone: ${currencySymbol}${targetNetWorth.toLocaleString()} (${calculations.progressToTarget.toFixed(1)}% achieved)
----------------------------------------
Calculated at twistertools.com/tools/calculators/net-worth-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Type", "Category", "Item Name", `Value (${currencySymbol})`].join(",");
        const assetRows = assets.map(a => `Asset,${a.category},"${a.name}",${a.amount}`);
        const liabilityRows = liabilities.map(l => `Liability,${l.category},"${l.name}",${l.amount}`);
        const summaryRows = [
            `Summary,,Total Assets,${calculations.totalAssets}`,
            `Summary,,Total Liabilities,${calculations.totalLiabilities}`,
            `Summary,,NET WORTH,${calculations.netWorth}`,
        ];

        const csvContent = [headers, ...assetRows, ...liabilityRows, "", ...summaryRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `net_worth_statement_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured JSON-LD Data for SEO
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Net Worth & Personal Asset Calculator",
        "url": "https://twistertools.com/tools/calculators/net-worth-calculator",
        "description": "Calculate your true net worth in real-time. Organize liquid assets, real estate, investment portfolios, and debt liabilities with instant financial metrics.",
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
                "name": "What is Net Worth and how is it calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Net worth is the ultimate snapshot of your personal financial health. It is calculated by taking the total current fair market value of everything you own (Assets) and subtracting the sum total of everything you owe (Liabilities)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Liquid Assets and Non-Liquid Assets?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Liquid assets consist of cash, high-yield checking/savings accounts, and money market funds that can be converted to cash immediately without losing principal value. Non-liquid assets (like real estate properties, private business stakes, and physical collectibles) require significant transaction time and fees to convert into spendable cash."
                }
            },
            {
                "@type": "Question",
                "name": "Should I include my primary residence in my Net Worth calculation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Traditional personal finance accounting includes the estimated market value of your home under Assets and your remaining mortgage principal balance under Liabilities. The net difference represents your primary home equity."
                }
            },
            {
                "@type": "Question",
                "name": "What is a good Debt-to-Asset ratio for personal finance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A debt-to-asset ratio under 50% is generally considered healthy. Ratios below 30% indicate strong financial independence and low systemic leverage risk, whereas ratios above 70% signal high financial fragility."
                }
            },
            {
                "@type": "Question",
                "name": "How often should I audit and calculate my Net Worth?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Financial advisors recommend updating your net worth statement quarterly or semi-annually. Tracking long-term upward trajectories matters significantly more than tracking minor daily stock market fluctuations."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Asset & Liability Entry */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-600" />
                                Assets & Liabilities
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset Form
                            </button>
                        </div>

                        {/* Currency Selector */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Active Currency
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition bg-slate-50 cursor-pointer"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="CAD/AUD">CAD/AUD ($)</option>
                            </select>
                        </div>

                        {/* Assets Section */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Assets (What You Own)
                                </h3>
                                <button
                                    onClick={addAsset}
                                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition border border-indigo-100 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Asset
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                {assets.map((asset) => (
                                    <div key={asset.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <input
                                            type="text"
                                            value={asset.name}
                                            onChange={(e) => updateAsset(asset.id, "name", e.target.value)}
                                            placeholder="Asset Item Name"
                                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <div className="relative w-28 sm:w-32">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={asset.amount || ""}
                                                onChange={(e) => updateAsset(asset.id, "amount", Math.max(0, Number(e.target.value)))}
                                                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeAsset(asset.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                            title="Delete Asset"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Liabilities Section */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <CreditCard className="w-4 h-4 text-rose-600" /> Liabilities (What You Owe)
                                </h3>
                                <button
                                    onClick={addLiability}
                                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition border border-indigo-100 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Liability
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                {liabilities.map((liability) => (
                                    <div key={liability.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                        <input
                                            type="text"
                                            value={liability.name}
                                            onChange={(e) => updateLiability(liability.id, "name", e.target.value)}
                                            placeholder="Debt / Loan Name"
                                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <div className="relative w-28 sm:w-32">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={liability.amount || ""}
                                                onChange={(e) => updateLiability(liability.id, "amount", Math.max(0, Number(e.target.value)))}
                                                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeLiability(liability.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                            title="Delete Liability"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Milestone Target Entry */}
                        <div className="pt-3 border-t border-slate-100 mb-5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Net Worth Milestone Goal
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="10000"
                                    value={targetNetWorth || ""}
                                    onChange={(e) => setTargetNetWorth(Math.max(0, Number(e.target.value)))}
                                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Preset Quick Benchmarks */}
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Demo Profile Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Statement" : "Copy Statement"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results & Financial Health Dashboard */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Financial Position & Analysis
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("summary")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "summary" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Asset Ratios
                                </button>
                            </div>
                        </div>

                        {/* Primary Net Worth Display Card */}
                        <div className={`p-5 rounded-xl border ${calculations.isPositive ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"}`}>
                            <p className={`text-xs font-bold uppercase tracking-wider ${calculations.isPositive ? "text-emerald-800" : "text-rose-800"}`}>
                                Total Calculated Net Worth
                            </p>
                            <p className={`text-4xl font-extrabold mt-1 flex items-center gap-1.5 ${calculations.isPositive ? "text-emerald-700" : "text-rose-700"}`}>
                                {calculations.isPositive ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownRight className="w-8 h-8" />}
                                {currencySymbol}{Math.abs(calculations.netWorth).toLocaleString()}
                            </p>
                            <div className="flex items-center justify-between text-xs font-semibold mt-3 pt-2 border-t border-black/5">
                                <span className="text-slate-600">Assets: {currencySymbol}{calculations.totalAssets.toLocaleString()}</span>
                                <span className="text-slate-600">Liabilities: {currencySymbol}{calculations.totalLiabilities.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Financial Health Ratio Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Debt-to-Asset Ratio</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                                    {calculations.debtToAssetRatio.toFixed(1)}%
                                </p>
                                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                    {calculations.debtToAssetRatio <= 30 ? "🟢 Excellent Solvency" : calculations.debtToAssetRatio <= 60 ? "🟡 Moderate Leverage" : "🔴 High Risk Ratio"}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Goal Progress</p>
                                <p className="text-2xl font-extrabold text-indigo-900 mt-1">
                                    {Math.min(100, Math.max(0, calculations.progressToTarget)).toFixed(1)}%
                                </p>
                                <p className="text-[11px] font-semibold text-indigo-600 mt-1">
                                    Goal: {currencySymbol}{targetNetWorth.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {activeTab === "summary" ? (
                            <div className="space-y-5">
                                {/* Balance Bar Visualization */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Assets vs Liabilities Equity Share</span>
                                        <span>{calculations.equityPercentage.toFixed(1)}% Free Equity</span>
                                    </div>
                                    <div className="w-full h-4 rounded-full bg-rose-200 overflow-hidden flex shadow-inner">
                                        <div
                                            className="bg-emerald-500 h-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, Math.max(0, calculations.equityPercentage))}%` }}
                                        />
                                        <div
                                            className="bg-rose-500 h-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, Math.max(0, calculations.debtToAssetRatio))}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Asset Equity</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Total Debt</span>
                                    </div>
                                </div>

                                {/* Goal Progress Bar */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Progress to Target ({currencySymbol}{targetNetWorth.toLocaleString()})</span>
                                        <span>{calculations.progressToTarget.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, Math.max(0, calculations.progressToTarget))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Categorical Breakdown Tab */
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Asset Category Totals
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold">
                                        <span className="text-slate-700">Liquid Cash & Accounts</span>
                                        <span className="text-slate-900 font-bold">{currencySymbol}{calculations.assetBreakdown.liquid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold">
                                        <span className="text-slate-700">Stocks & Retirement Investments</span>
                                        <span className="text-slate-900 font-bold">{currencySymbol}{calculations.assetBreakdown.investment.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold">
                                        <span className="text-slate-700">Real Estate & Equity</span>
                                        <span className="text-slate-900 font-bold">{currencySymbol}{calculations.assetBreakdown.property.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold">
                                        <span className="text-slate-700">Other Vehicles & Property</span>
                                        <span className="text-slate-900 font-bold">{currencySymbol}{calculations.assetBreakdown.other.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Private Client-side Execution
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

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Financial Definitions & Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Net Worth & Personal Financial Health
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Your <strong>Net Worth</strong> is the definitive metric for evaluating personal financial stability, long-term solvency, and wealth accumulation progress. While annual salary or monthly gross income measures cash velocity, net worth evaluates long-term solvency by measuring total asset ownership minus outstanding financial obligations.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-600" /> Total Assets (Ownership)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Assets include liquid savings, stock market portfolios, retirement funds (401k/IRA), investment properties, primary home equity, business stakes, and tangible personal property.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-rose-600" /> Total Liabilities (Obligations)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Liabilities include primary and secondary mortgages, auto loans, student debt, revolving credit balances, personal lines of credit, and tax obligations.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The Net Worth Balance Sheet Formulas
                        </h3>
                        <p className="text-xs text-slate-300">
                            The core calculation subtracts liabilities from assets to arrive at net equity:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Total Net Worth:</strong> Net Worth = Σ (Total Assets) - Σ (Total Liabilities)</div>
                            <div><strong>2. Debt-to-Asset Ratio (%):</strong> Ratio = [ Σ (Total Liabilities) / Σ (Total Assets) ] × 100</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Asset Tiers & Liquidity Structure */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Categorizing Assets: Liquid vs. Non-Liquid Wealth
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Not all assets are created equal. A resilient portfolio balances quick liquidity for unforeseen emergencies with compounding investments and property holdings that build multi-generational capital over time.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">Tier 1: High Liquidity</span>
                            <h3 className="font-bold text-slate-900 text-sm">Cash & Reserves</h3>
                            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                <li>High-Yield Savings Accounts</li>
                                <li>Money Market Funds</li>
                                <li>Certificates of Deposit (CDs)</li>
                            </ul>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md inline-block">Tier 2: Growth Portfolios</span>
                            <h3 className="font-bold text-slate-900 text-sm">Investments & Securities</h3>
                            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                <li>Index Funds & Stocks</li>
                                <li>401(k), IRA, & Roth Accounts</li>
                                <li>Bonds & Treasuries</li>
                            </ul>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md inline-block">Tier 3: Fixed Capital</span>
                            <h3 className="font-bold text-slate-900 text-sm">Illiquid & Property</h3>
                            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                <li>Primary & Rental Real Estate</li>
                                <li>Private Business Equity</li>
                                <li>Vehicles & Equipment</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 3: Concrete Worked Mathematical Example */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Net Worth Comparison Case Study
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate how leverage and asset structure affect net financial worth, consider two households with the same gross assets:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Financial Parameter</th>
                                    <th className="p-3">Profile A: Highly Leveraged</th>
                                    <th className="p-3">Profile B: Debt-Free Growth</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Gross Assets Value</td>
                                    <td className="p-3">$600,000</td>
                                    <td className="p-3">$600,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Primary Debt / Mortgages</td>
                                    <td className="p-3 text-rose-600 font-semibold">$480,000</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$120,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Calculated Net Worth</td>
                                    <td className="p-3 font-bold text-slate-900">$120,000</td>
                                    <td className="p-3 font-bold text-emerald-600">$480,000</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Debt-to-Asset Ratio</td>
                                    <td className="p-3 font-extrabold text-rose-700">80.0% (High Leverage)</td>
                                    <td className="p-3 font-extrabold text-indigo-700">20.0% (Strong Solvency)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Key Takeaway:</strong> Profile B maintains 4x the actual equity and net wealth of Profile A, demonstrating that minimizing long-term liabilities is as vital to wealth building as acquiring gross assets.
                    </p>
                </section>

                {/* Card 4: Actionable Strategies to Boost Net Worth */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            4 Core Strategies to Accelerate Net Worth Growth
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> 1. Eliminate High-Interest Consumer Debt
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Revolving credit card debt carrying 18% to 28% interest destroys net worth faster than typical market investments can build it. Prioritize debt payoff via the Avalanche or Snowball methods.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> 2. Automate Index Fund Contributions
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Systematically investing in broad-market index funds (like S&P 500 or Total Stock Market index funds) harnesses compounding growth over long investment horizons without requiring active trading.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> 3. Build Equity in Real Assets
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Paying down mortgage principal transforms monthly housing expenses into tangible home equity, steadily shifting liabilities into net positive wealth.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> 4. Audit & Rebalance Semi-Annually
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Regularly calculating your net worth statement prevents lifestyle creep and ensures your asset allocation matches your target risk profile as your capital grows.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
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
                                What is Net Worth and how is it calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Net worth is the ultimate snapshot of your personal financial health. It is calculated by taking the total current fair market value of everything you own (Assets) and subtracting the sum total of everything you owe (Liabilities).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Liquid Assets and Non-Liquid Assets?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Liquid assets consist of cash, high-yield checking/savings accounts, and money market funds that can be converted to cash immediately without losing principal value. Non-liquid assets (like real estate properties, private business stakes, and physical collectibles) require significant transaction time and fees to convert into spendable cash.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should I include my primary residence in my Net Worth calculation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Traditional personal finance accounting includes the estimated market value of your home under Assets and your remaining mortgage principal balance under Liabilities. The net difference represents your primary home equity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a good Debt-to-Asset ratio for personal finance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A debt-to-asset ratio under 50% is generally considered healthy. Ratios below 30% indicate strong financial independence and low systemic leverage risk, whereas ratios above 70% signal high financial fragility.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How often should I audit and calculate my Net Worth?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Financial advisors recommend updating your net worth statement quarterly or semi-annually. Tracking long-term upward trajectories matters significantly more than tracking minor daily stock market fluctuations.
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