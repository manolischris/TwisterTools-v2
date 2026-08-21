"use client";

import React, { useState, useMemo } from "react";
import {
    DollarSign,
    Calendar,
    Plus,
    Trash2,
    Edit3,
    Copy,
    Check,
    Download,
    RefreshCw,
    PieChart,
    Layers,
    Sparkles,
    ShieldCheck,
    TrendingUp,
    AlertTriangle,
    HelpCircle,
    BookOpen,
    Scale,
    Tag,
    Filter,
    ArrowUpRight,
    Search,
    Wallet,
    Percent,
    Lightbulb,
    BarChart3
} from "lucide-react";

type BillingCycle = "weekly" | "monthly" | "quarterly" | "biannually" | "annually";
type SubscriptionCategory = "Streaming & Media" | "SaaS & Productivity" | "Cloud & Hosting" | "Fitness & Health" | "Gaming & Apps" | "Utilities & Security" | "Other";
type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

interface SubscriptionItem {
    id: string;
    name: string;
    cost: number;
    billingCycle: BillingCycle;
    category: SubscriptionCategory;
    autoRenews: boolean;
    cancellationUrl?: string;
}

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

const CATEGORIES: SubscriptionCategory[] = [
    "Streaming & Media",
    "SaaS & Productivity",
    "Cloud & Hosting",
    "Fitness & Health",
    "Gaming & Apps",
    "Utilities & Security",
    "Other",
];

const PRESETS: { id: string; label: string; tag: string; items: Omit<SubscriptionItem, "id">[] }[] = [
    {
        id: "streamer",
        label: "Digital Media Streamer",
        tag: "Media & Audio",
        items: [
            { name: "Netflix Premium", cost: 22.99, billingCycle: "monthly", category: "Streaming & Media", autoRenews: true },
            { name: "Spotify Individual", cost: 11.99, billingCycle: "monthly", category: "Streaming & Media", autoRenews: true },
            { name: "Disney+ & Hulu Bundle", cost: 19.99, billingCycle: "monthly", category: "Streaming & Media", autoRenews: true },
            { name: "YouTube Premium", cost: 13.99, billingCycle: "monthly", category: "Streaming & Media", autoRenews: true },
            { name: "Amazon Prime (Annual)", cost: 139.0, billingCycle: "annually", category: "Streaming & Media", autoRenews: true },
        ],
    },
    {
        id: "developer",
        label: "Remote Tech Professional",
        tag: "SaaS & Cloud",
        items: [
            { name: "GitHub Copilot", cost: 10.0, billingCycle: "monthly", category: "SaaS & Productivity", autoRenews: true },
            { name: "ChatGPT Plus", cost: 20.0, billingCycle: "monthly", category: "SaaS & Productivity", autoRenews: true },
            { name: "Vercel Pro", cost: 20.0, billingCycle: "monthly", category: "Cloud & Hosting", autoRenews: true },
            { name: "Notion Plus (Annual)", cost: 96.0, billingCycle: "annually", category: "SaaS & Productivity", autoRenews: true },
            { name: "1Password Family", cost: 59.88, billingCycle: "annually", category: "Utilities & Security", autoRenews: true },
            { name: "Figma Professional", cost: 15.0, billingCycle: "monthly", category: "SaaS & Productivity", autoRenews: true },
        ],
    },
    {
        id: "creator",
        label: "Solopreneur & Creator",
        tag: "All-in-One Stack",
        items: [
            { name: "Adobe Creative Cloud", cost: 59.99, billingCycle: "monthly", category: "SaaS & Productivity", autoRenews: true },
            { name: "Grammarly Premium", cost: 144.0, billingCycle: "annually", category: "SaaS & Productivity", autoRenews: true },
            { name: "Webflow Workspace", cost: 29.0, billingCycle: "monthly", category: "Cloud & Hosting", autoRenews: true },
            { name: "Google Workspace", cost: 14.4, billingCycle: "monthly", category: "SaaS & Productivity", autoRenews: true },
            { name: "Canva Pro", cost: 120.0, billingCycle: "annually", category: "SaaS & Productivity", autoRenews: true },
        ],
    },
];

const INITIAL_SUBSCRIPTIONS: SubscriptionItem[] = [
    { id: "sub-1", name: "Netflix Premium", cost: 22.99, billingCycle: "monthly", category: "Streaming & Media", autoRenews: true },
    { id: "sub-2", name: "Spotify Premium", cost: 11.99, billingCycle: "monthly", category: "Streaming & Media", autoRenews: true },
    { id: "sub-3", name: "ChatGPT Plus", cost: 20.0, billingCycle: "monthly", category: "SaaS & Productivity", autoRenews: true },
    { id: "sub-4", name: "Amazon Prime", cost: 139.0, billingCycle: "annually", category: "Streaming & Media", autoRenews: true },
    { id: "sub-5", name: "Gym Membership", cost: 45.0, billingCycle: "monthly", category: "Fitness & Health", autoRenews: true },
];

const sanitizeNumberInput = (
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

export default function SubscriptionCostCalculator() {
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(INITIAL_SUBSCRIPTIONS);
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"breakdown" | "opportunity">("breakdown");

    // Form states for new entry
    const [newName, setNewName] = useState<string>("");
    const [newCost, setNewCost] = useState<number>(14.99);
    const [newCycle, setNewCycle] = useState<BillingCycle>("monthly");
    const [newCategory, setNewCategory] = useState<SubscriptionCategory>("Streaming & Media");
    const [newAutoRenews, setNewAutoRenews] = useState<boolean>(true);

    const currencySymbol = currencySymbols[currency];

    // Conversion multiplier to annualized amount
    const getAnnualMultiplier = (cycle: BillingCycle): number => {
        switch (cycle) {
            case "weekly":
                return 52;
            case "monthly":
                return 12;
            case "quarterly":
                return 4;
            case "biannually":
                return 2;
            case "annually":
                return 1;
        }
    };

    // Calculate aggregated metrics
    const metrics = useMemo(() => {
        let totalAnnual = 0;
        const categoryTotals: Record<SubscriptionCategory, number> = {
            "Streaming & Media": 0,
            "SaaS & Productivity": 0,
            "Cloud & Hosting": 0,
            "Fitness & Health": 0,
            "Gaming & Apps": 0,
            "Utilities & Security": 0,
            "Other": 0,
        };

        subscriptions.forEach((sub) => {
            const annualCost = sub.cost * getAnnualMultiplier(sub.billingCycle);
            totalAnnual += annualCost;
            categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + annualCost;
        });

        const totalMonthly = totalAnnual / 12;
        const totalWeekly = totalAnnual / 52;
        const totalDaily = totalAnnual / 365;

        // Investment opportunity cost (7% ROI compounded over 5 & 10 years)
        const calculateFutureValue = (annualContribution: number, years: number, r = 0.07): number => {
            const mRate = r / 12;
            const months = years * 12;
            const monthlyContribution = annualContribution / 12;
            let balance = 0;
            for (let m = 1; m <= months; m++) {
                balance = (balance + monthlyContribution) * (1 + mRate);
            }
            return balance;
        };

        const opportunity5Years = calculateFutureValue(totalAnnual, 5);
        const opportunity10Years = calculateFutureValue(totalAnnual, 10);
        const opportunity20Years = calculateFutureValue(totalAnnual, 20);

        // Sorting categories by highest spend
        const sortedCategories = Object.entries(categoryTotals)
            .map(([cat, amount]) => ({
                category: cat as SubscriptionCategory,
                annualCost: amount,
                monthlyCost: amount / 12,
                percentage: totalAnnual > 0 ? (amount / totalAnnual) * 100 : 0,
            }))
            .filter((cat) => cat.annualCost > 0)
            .sort((a, b) => b.annualCost - a.annualCost);

        // Top recurring service
        const topService = [...subscriptions]
            .map((sub) => ({
                ...sub,
                annualCost: sub.cost * getAnnualMultiplier(sub.billingCycle),
            }))
            .sort((a, b) => b.annualCost - a.annualCost)[0] || null;

        return {
            totalAnnual,
            totalMonthly,
            totalWeekly,
            totalDaily,
            count: subscriptions.length,
            categoryTotals: sortedCategories,
            topService,
            opportunity5Years,
            opportunity10Years,
            opportunity20Years,
        };
    }, [subscriptions]);

    // Filtered subscription list
    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter((sub) => {
            const matchesCategory = filterCategory === "all" || sub.category === filterCategory;
            const matchesQuery = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesQuery;
        });
    }, [subscriptions, filterCategory, searchQuery]);

    const handleAddSubscription = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const newItem: SubscriptionItem = {
            id: `sub-${Date.now()}`,
            name: newName.trim(),
            cost: Math.max(0, newCost),
            billingCycle: newCycle,
            category: newCategory,
            autoRenews: newAutoRenews,
        };

        setSubscriptions((prev) => [newItem, ...prev]);
        setNewName("");
        setNewCost(9.99);
        setActivePresetId(null);
    };

    const handleDeleteSubscription = (id: string) => {
        setSubscriptions((prev) => prev.filter((item) => item.id !== id));
        setActivePresetId(null);
    };

    const applyPreset = (preset: (typeof PRESETS)[0]) => {
        const mappedItems = preset.items.map((item, idx) => ({
            ...item,
            id: `preset-${preset.id}-${idx}-${Date.now()}`,
        }));
        setSubscriptions(mappedItems);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setSubscriptions(INITIAL_SUBSCRIPTIONS);
        setCurrency("USD");
        setFilterCategory("all");
        setSearchQuery("");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const topName = metrics.topService ? `${metrics.topService.name} (${currencySymbol}${metrics.topService.annualCost.toFixed(2)}/yr)` : "None";
        const summaryText = `Subscription Portfolio & Annual Expense Audit (TwisterTools):
----------------------------------------
Active Recurring Services: ${metrics.count}
Total Monthly Outlay: ${currencySymbol}${metrics.totalMonthly.toFixed(2)}
Total Annual Outlay: ${currencySymbol}${metrics.totalAnnual.toFixed(2)}
Average Weekly Cost: ${currencySymbol}${metrics.totalWeekly.toFixed(2)}
Highest Expense: ${topName}
----------------------------------------
Category Distribution:
${metrics.categoryTotals.map((c) => `- ${c.category}: ${currencySymbol}${c.annualCost.toFixed(2)}/yr (${c.percentage.toFixed(1)}%)`).join("\n")}
----------------------------------------
10-Year Opportunity Cost (7% S&P Index): ${currencySymbol}${Math.round(metrics.opportunity10Years).toLocaleString()}
----------------------------------------
Calculated at twistertools.com/tools/calculators/subscription-cost-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Subscription Name", "Billing Cycle", "Billing Amount", "Monthly Cost", "Annualized Cost", "Category", "Auto-Renewal"];
        const csvRows = [
            headers.join(","),
            ...subscriptions.map((sub) => {
                const annual = sub.cost * getAnnualMultiplier(sub.billingCycle);
                const monthly = annual / 12;
                return [
                    `"${sub.name.replace(/"/g, '""')}"`,
                    sub.billingCycle,
                    sub.cost.toFixed(2),
                    monthly.toFixed(2),
                    annual.toFixed(2),
                    `"${sub.category}"`,
                    sub.autoRenews ? "Active" : "Paused",
                ].join(",");
            }),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `subscription_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // SEO Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Subscription Audit & Annual Expense Aggregator",
        "url": "https://twistertools.com/tools/calculators/subscription-cost-calculator",
        "description": "Audit recurring SaaS, streaming, and membership subscriptions. Calculate total annual cost leaks, category distributions, and compound investment opportunity costs.",
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
                "name": "What is subscription creep and why does it damage personal finances?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Subscription creep is the gradual, unnoticed accumulation of recurring charges for streaming platforms, digital memberships, and software apps. Because small recurring amounts ($9 to $20/mo) seem negligible individually, consumers routinely underestimate their cumulative annual outlay by 200% to 300%."
                }
            },
            {
                "@type": "Question",
                "name": "How is opportunity cost calculated on recurring subscription expenses?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Opportunity cost projects what recurring subscription dollars would be worth if invested into a broad-market index fund (e.g., historical 7% real annual return). A monthly recurring spend of $150 equates to $1,800 per year, which compounded over 10 years represents over $25,000 in lost wealth."
                }
            },
            {
                "@type": "Question",
                "name": "Is it financially advantageous to pay subscriptions annually instead of monthly?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, most SaaS providers and media services offer discounts ranging between 15% and 25% for upfront annual commitments. However, users should only choose annual billing for core, indispensable utilities to avoid paying for unutilized months."
                }
            },
            {
                "@type": "Question",
                "name": "How frequently should a household or solopreneur audit active subscriptions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Financial advisors recommend conducting a full subscription audit once every 90 days (quarterly). This frequency catches expiring free trials, price increases, zombie subscriptions, and duplicate software licenses before recurring fees compound."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* LEFT PANEL: Subscription Entry Form & Inventory Manager */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Add & Manage Services
                            </h2>
                            <div className="flex items-center gap-2">
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none cursor-pointer transition shadow-xs"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="CAD/AUD">CAD/AUD ($)</option>
                                </select>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Add Subscription Form */}
                        <form onSubmit={handleAddSubscription} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
                            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Plus className="w-4 h-4 text-indigo-600" /> Quick Add Recurring Expense
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 min-w-0">
                                <div className="sm:col-span-7">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Service Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Spotify, GitHub, Adobe"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-5">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cost ({currencySymbol})</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={newCost === 0 ? "" : newCost}
                                            onChange={(e) => sanitizeNumberInput(e, setNewCost)}
                                            className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Interval</label>
                                    <select
                                        value={newCycle}
                                        onChange={(e) => setNewCycle(e.target.value as BillingCycle)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="weekly">Weekly (52x/yr)</option>
                                        <option value="monthly">Monthly (12x/yr)</option>
                                        <option value="quarterly">Quarterly (4x/yr)</option>
                                        <option value="biannually">Bi-Annually (2x/yr)</option>
                                        <option value="annually">Annually (1x/yr)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as SubscriptionCategory)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-xs transition shadow-xs cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add to Portfolio
                            </button>
                        </form>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                            <div className="relative flex-1">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search active subscriptions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">All Categories ({subscriptions.length})</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subscription Item List Container */}
                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                            {filteredSubscriptions.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                                    No subscriptions found matching your query.
                                </div>
                            ) : (
                                filteredSubscriptions.map((sub) => {
                                    const annual = sub.cost * getAnnualMultiplier(sub.billingCycle);
                                    const monthly = annual / 12;
                                    return (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs transition group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-xs">
                                                    {sub.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                                        {sub.name}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        <span className="capitalize">{sub.billingCycle}</span> • {sub.category}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <span className="block text-xs font-extrabold text-slate-900">
                                                        {currencySymbol}{monthly.toFixed(2)}<span className="text-[10px] font-normal text-slate-500">/mo</span>
                                                    </span>
                                                    <span className="block text-[10px] text-slate-400 font-medium">
                                                        {currencySymbol}{annual.toFixed(2)}/yr
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSubscription(sub.id)}
                                                    className="opacity-60 group-hover:opacity-100 hover:text-rose-600 text-slate-400 p-1.5 rounded-md hover:bg-rose-50 transition cursor-pointer"
                                                    title="Delete Subscription"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Fast Persona Presets */}
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Fast Persona Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>
                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"}`}>
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
                            {copied ? "Copied Summary" : "Copy Audit Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: Financial Aggregation & Opportunity Cost Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Expense Aggregation & Analytics
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${viewMode === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Spend Breakdown
                                </button>
                                <button
                                    onClick={() => setViewMode("opportunity")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${viewMode === "opportunity" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Opportunity Cost
                                </button>
                            </div>
                        </div>

                        {/* Top Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Monthly Outlay</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{metrics.totalMonthly.toFixed(2)}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    {metrics.count} active recurring subscriptions
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white">
                                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Annualized Spend Leak</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                                    {currencySymbol}{metrics.totalAnnual.toFixed(2)}
                                </p>
                                <p className="text-[11px] text-slate-300 font-medium mt-1">
                                    ~{currencySymbol}{metrics.totalWeekly.toFixed(2)} per week / {currencySymbol}{metrics.totalDaily.toFixed(2)} per day
                                </p>
                            </div>
                        </div>

                        {/* Dynamic View Toggle */}
                        {viewMode === "breakdown" ? (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Category Spending Distribution
                                </h3>

                                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                    {metrics.categoryTotals.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-6">No spending data to categorize.</p>
                                    ) : (
                                        metrics.categoryTotals.map((cat) => (
                                            <div key={cat.category} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                                    <span>{cat.category}</span>
                                                    <span>
                                                        {currencySymbol}{cat.annualCost.toFixed(2)}/yr{" "}
                                                        <span className="text-slate-400 font-normal">({cat.percentage.toFixed(1)}%)</span>
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                                    <div
                                                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.max(2, cat.percentage)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {metrics.topService && (
                                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-amber-900 font-medium">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                            <span>Highest individual expense: <strong>{metrics.topService.name}</strong></span>
                                        </div>
                                        <span className="font-bold text-amber-900">
                                            {currencySymbol}{(metrics.topService.cost * getAnnualMultiplier(metrics.topService.billingCycle)).toFixed(2)}/yr
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 text-emerald-600" /> S&P 500 Index Opportunity Cost (7% Real Return)
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        If your full annual subscription outflow of <strong>{currencySymbol}{metrics.totalAnnual.toFixed(2)}</strong> were redirected into an index fund averaging 7% annual compounding:
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="block text-[11px] font-bold text-slate-400 uppercase">5 Years</span>
                                        <span className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 block">
                                            {currencySymbol}{Math.round(metrics.opportunity5Years).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="block text-[11px] font-bold text-indigo-600 uppercase">10 Years</span>
                                        <span className="text-base sm:text-lg font-extrabold text-indigo-600 mt-0.5 block">
                                            {currencySymbol}{Math.round(metrics.opportunity10Years).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="block text-[11px] font-bold text-emerald-600 uppercase">20 Years</span>
                                        <span className="text-base sm:text-lg font-extrabold text-emerald-700 mt-0.5 block">
                                            {currencySymbol}{Math.round(metrics.opportunity20Years).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                                    <strong>Rule of 300 Insight:</strong> Every $100/mo in eliminated recurring expenses frees up $1,200 annually, which converts to approximately $30,000 in retirement portfolio freedom according to the 4% Safe Withdrawal Rule.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            100% Private Client-Side Calculation
                        </span>
                        <span>Zero telemetry logging</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Audit Notice:</strong> This subscription cost aggregator is designed for budgeting, forecasting, and personal financial auditing purposes. It does not initiate automated cancellations or access bank account APIs.
                </p>
            </div>

            {/* BELOW-THE-FOLD DEEP CONTENT & SEO SCAFFOLDING */}
            <div className="space-y-6">
                {/* Card 1: The Economics of Subscription Creep */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Psychology & Math of Subscription Creep
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Subscription creep</strong> refers to the gradual accumulation of recurring micro-charges across entertainment, software tools, cloud storage, delivery passes, and gym memberships. Digital service business models intentionally leverage friction-free signups, auto-renewing credit card authorizations, and low nominal monthly price points (e.g., $9.99/mo or $14.99/mo) to minimize perceived financial impact.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Behavioral economic studies show that consumers routinely underestimate their aggregate recurring subscription commitments by <strong>2.5x to 3x</strong>. A household that estimates spending $80 monthly on digital services frequently discovers an actual audited total exceeding $240 to $320 per month once cloud hosting, app store recurring fees, and annual memberships are annualized.
                    </p>

                    {/* Math Breakdown Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-4 h-4" /> The Recurring Spend Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            To normalize disparate billing frequencies into a unified annualized outlay, financial auditors use the standard period aggregation formula:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            Annual Total = Σ ( Cost_i × FrequencyMultiplier_i )
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>Weekly:</strong> Cost × 52</div>
                            <div><strong>Monthly:</strong> Cost × 12</div>
                            <div><strong>Quarterly:</strong> Cost × 4</div>
                            <div><strong>Bi-Annually:</strong> Cost × 2</div>
                            <div><strong>Annually:</strong> Cost × 1</div>
                            <div><strong>Daily Run Rate:</strong> Annual Total / 365</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Step-by-Step Case Study */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Example: Auditing an Everyday Tech & Streaming Stack
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Consider a remote professional who signs up for several standard digital services over a two-year period without tracking their aggregate cost:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Service Name</th>
                                    <th className="p-3">Billed Price</th>
                                    <th className="p-3">Interval</th>
                                    <th className="p-3">Monthly Equivalent</th>
                                    <th className="p-3">Annualized Outlay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4K Video Streaming Service</td>
                                    <td className="p-3">$22.99</td>
                                    <td className="p-3">Monthly</td>
                                    <td className="p-3">$22.99</td>
                                    <td className="p-3 font-bold text-slate-900">$275.88</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">AI Coding Assistant & LLM</td>
                                    <td className="p-3">$40.00</td>
                                    <td className="p-3">Monthly</td>
                                    <td className="p-3">$40.00</td>
                                    <td className="p-3 font-bold text-slate-900">$480.00</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Cloud Storage & Backups</td>
                                    <td className="p-3">$9.99</td>
                                    <td className="p-3">Monthly</td>
                                    <td className="p-3">$9.99</td>
                                    <td className="p-3 font-bold text-slate-900">$119.88</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Express Delivery & Prime Pass</td>
                                    <td className="p-3">$139.00</td>
                                    <td className="p-3">Annually</td>
                                    <td className="p-3">$11.58</td>
                                    <td className="p-3 font-bold text-slate-900">$139.00</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Premium Audio Streaming</td>
                                    <td className="p-3">$11.99</td>
                                    <td className="p-3">Monthly</td>
                                    <td className="p-3">$11.99</td>
                                    <td className="p-3 font-bold text-slate-900">$143.88</td>
                                </tr>
                                <tr className="bg-indigo-50/60 font-bold text-indigo-900">
                                    <td className="p-3">Total Audited Portfolio</td>
                                    <td className="p-3">—</td>
                                    <td className="p-3">—</td>
                                    <td className="p-3 font-extrabold text-indigo-700">$96.55/mo</td>
                                    <td className="p-3 font-extrabold text-indigo-700">$1,158.64/yr</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Financial Impact:</strong> An assortment of seemingly modest individual fees generates over <strong>$1,150.00</strong> in automatic cash drain each year. Over five years, without factoring in price hikes, this simple portfolio removes over <strong>$5,790.00</strong> from discretionary savings.
                    </p>
                </section>

                {/* Card 3: Monthly vs. Annual Billing Optimization */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Tag className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Billing Interval Optimization: Monthly vs. Annual Plans
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Nearly all major SaaS platforms and media networks incentivize annual upfront commitments by offering 15% to 25% discounts compared to standard month-to-month billing. While paying annually reduces the effective monthly rate, it locks in capital upfront and increases waste if usage declines.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Billing Structure</th>
                                    <th className="p-3">Pros</th>
                                    <th className="p-3">Cons</th>
                                    <th className="p-3">Recommended Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Monthly Recurring</td>
                                    <td className="p-3 text-emerald-700">Zero long-term lock-in, easy cancellation at 30-day notice.</td>
                                    <td className="p-3 text-rose-700">15%–30% higher total cost over 12 consecutive billing periods.</td>
                                    <td className="p-3">Testing new tools, seasonal shows, short-term project needs.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Annual Upfront</td>
                                    <td className="p-3 text-emerald-700">Substantial price discount (often 2 months free equivalent).</td>
                                    <td className="p-3 text-rose-700">High initial capital outlay, non-refundable if you stop using it.</td>
                                    <td className="p-3">Indispensable daily drivers (Password managers, cloud backups, primary IDEs).</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Actionable 4-Step Subscription Audit Framework */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The 4-Step Quarterly Subscription Audit Playbook
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                            <h3 className="font-bold text-slate-900 text-sm">Download 90 Days of Statement CSVs</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Review credit card and PayPal transaction statements for recurring line items. Look for charges labeled with generic merchant IDs or small $2 to $10 renewals.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                            <h3 className="font-bold text-slate-900 text-sm">Categorize and Identify Redundancies</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Group items into functional buckets. Eliminate overlapping services (e.g., maintaining three separate cloud storage subscriptions or two music services).
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                            <h3 className="font-bold text-slate-900 text-sm">Execute the "Cancel First" Rule</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                For non-critical entertainment platforms, cancel the auto-renewal immediately. You can re-subscribe when a specific new season or feature is actually needed.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                            <h3 className="font-bold text-slate-900 text-sm">Automate Savings Transfer</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Redirect the monthly dollar amount recovered from canceled subscriptions into an automated index fund or high-yield savings transfer.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static FAQ Section */}
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
                                What is subscription creep and why does it damage personal finances?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Subscription creep is the gradual, unnoticed accumulation of recurring charges for streaming platforms, digital memberships, and software apps. Because small recurring amounts ($9 to $20/mo) seem negligible individually, consumers routinely underestimate their cumulative annual outlay by 200% to 300%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is opportunity cost calculated on recurring subscription expenses?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Opportunity cost projects what recurring subscription dollars would be worth if invested into a broad-market index fund (e.g., historical 7% real annual return). A monthly recurring spend of $150 equates to $1,800 per year, which compounded over 10 years represents over $25,000 in lost wealth.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is it financially advantageous to pay subscriptions annually instead of monthly?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, most SaaS providers and media services offer discounts ranging between 15% and 25% for upfront annual commitments. However, users should only choose annual billing for core, indispensable utilities to avoid paying for unutilized months.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How frequently should a household or solopreneur audit active subscriptions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Financial advisors recommend conducting a full subscription audit once every 90 days (quarterly). This frequency catches expiring free trials, price increases, zombie subscriptions, and duplicate software licenses before recurring fees compound.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Essential Financial Disclaimer */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Essential Financial Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This calculator and aggregator tool is provided for educational and personal financial planning purposes only. Calculations and opportunity cost projections are approximations based on user inputs and assumed constant interest rates. TwisterTools does not provide certified financial, legal, or investment advisory services.
                    </p>
                </section>
            </div>
        </div>
    );
}