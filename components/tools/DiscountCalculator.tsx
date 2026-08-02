"use client";

import React, { useState, useMemo } from "react";
import {
    Percent,
    DollarSign,
    Tag,
    Copy,
    Check,
    RotateCcw,
    BookOpen,
    Calculator,
    TrendingDown,
    Scale,
    ShieldCheck,
    Zap,
    HelpCircle,
    BarChart3,
    ListOrdered,
    Sparkles,
    PieChart,
    ArrowRight,
    Info,
    Table,
    Cpu,
    Layers,
    ShoppingBag,
    Receipt,
    FileText,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type CalculationMode = "single" | "double" | "tax-after" | "tax-before" | "reverse";

interface DiscountMetrics {
    originalPrice: number;
    discount1: number;
    discount2: number;
    taxRate: number;
    finalPrice: number;
    totalSaved: number;
    taxAmount: number;
    effectiveDiscountRate: number;
}

// ─────────────────────────────────────────────────────────────
// Calculation Engine
// ─────────────────────────────────────────────────────────────

function calculateDiscountMetrics(
    mode: CalculationMode,
    p1: number,
    p2: number,
    p3: number,
    targetFinal?: number
): DiscountMetrics {
    let originalPrice = Math.max(0, p1 || 0);
    let discount1 = Math.max(0, p2 || 0);
    let discount2 = 0;
    let taxRate = 0;
    let finalPrice = 0;
    let totalSaved = 0;
    let taxAmount = 0;

    if (mode === "single") {
        // Basic Discount: Original Price, Discount %
        const discountVal = (originalPrice * discount1) / 100;
        finalPrice = Math.max(0, originalPrice - discountVal);
        totalSaved = discountVal;
    } else if (mode === "double") {
        // Stacked/Double Discount: Original, Discount 1 %, Discount 2 %
        discount2 = Math.max(0, p3 || 0);
        const firstCut = originalPrice - (originalPrice * discount1) / 100;
        const secondCut = firstCut - (firstCut * discount2) / 100;
        finalPrice = Math.max(0, secondCut);
        totalSaved = originalPrice - finalPrice;
    } else if (mode === "tax-after") {
        // Discount + Sales Tax (Tax on discounted price)
        taxRate = Math.max(0, p3 || 0);
        const discounted = originalPrice - (originalPrice * discount1) / 100;
        taxAmount = (discounted * taxRate) / 100;
        finalPrice = discounted + taxAmount;
        totalSaved = originalPrice - discounted;
    } else if (mode === "tax-before") {
        // Discount + Sales Tax (Tax on original pre-discount price)
        taxRate = Math.max(0, p3 || 0);
        taxAmount = (originalPrice * taxRate) / 100;
        const discounted = originalPrice - (originalPrice * discount1) / 100;
        finalPrice = discounted + taxAmount;
        totalSaved = originalPrice - discounted;
    } else if (mode === "reverse") {
        // Reverse Calculator: Calculate original price or discount rate given final target
        // p1 = Sale Price, p2 = Discount % applied (if finding original)
        const salePrice = p1;
        const discPercent = p2;
        if (discPercent < 100 && discPercent > 0) {
            originalPrice = salePrice / (1 - discPercent / 100);
            totalSaved = originalPrice - salePrice;
            finalPrice = salePrice;
            discount1 = discPercent;
        } else {
            originalPrice = salePrice;
            finalPrice = salePrice;
            totalSaved = 0;
            discount1 = 0;
        }
    }

    const effectiveDiscountRate = originalPrice > 0 ? (totalSaved / originalPrice) * 100 : 0;

    return {
        originalPrice,
        discount1,
        discount2,
        taxRate,
        finalPrice,
        totalSaved,
        taxAmount,
        effectiveDiscountRate,
    };
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    // Parse string, stripping undesirable leading zeros like "0100" -> 100
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function DiscountCalculator() {
    const [mode, setMode] = useState<CalculationMode>("single");
    const [val1, setVal1] = useState<string>("100");
    const [val2, setVal2] = useState<string>("20");
    const [val3, setVal3] = useState<string>("10");
    const [copied, setCopied] = useState<boolean>(false);

    // Convert inputs to numbers safely
    const num1 = parseFloat(val1) || 0;
    const num2 = parseFloat(val2) || 0;
    const num3 = parseFloat(val3) || 0;

    const metrics = useMemo(() => {
        return calculateDiscountMetrics(mode, num1, num2, num3);
    }, [mode, num1, num2, num3]);

    const handleCopySummary = async () => {
        const text = `Discount Summary (${mode.toUpperCase()} MODE):
- Original Price: $${metrics.originalPrice.toFixed(2)}
- Total Discount Rate: ${metrics.effectiveDiscountRate.toFixed(2)}%
- Total Money Saved: $${metrics.totalSaved.toFixed(2)}
${metrics.taxAmount > 0 ? `- Sales Tax: $${metrics.taxAmount.toFixed(2)}\n` : ""}- Final Out-of-Pocket Price: $${metrics.finalPrice.toFixed(2)}`;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent catch */
        }
    };

    const handleReset = () => {
        setVal1("100");
        setVal2("20");
        setVal3("10");
    };

    const handleLoadSample = () => {
        if (mode === "single") {
            setVal1("149.99");
            setVal2("25");
        } else if (mode === "double") {
            setVal1("250.00");
            setVal2("30");
            setVal3("15");
        } else if (mode === "tax-after" || mode === "tax-before") {
            setVal1("89.95");
            setVal2("15");
            setVal3("8.25");
        } else if (mode === "reverse") {
            setVal1("45.00");
            setVal2("25");
        }
    };

    return (
        <div className="w-full space-y-8">
            {/* ── Workspace Grid (50/50 Split) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT CONTROLS ══════════════════ */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                    <div className="p-6 space-y-5">
                        {/* Mode Selection Pills */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Calculation Workflow
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                    { id: "single", label: "Standard Discount" },
                                    { id: "double", label: "Stacked (Double)" },
                                    { id: "tax-after", label: "Discount + Tax" },
                                    { id: "reverse", label: "Reverse Price" },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setMode(item.id as CalculationMode)}
                                        className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all text-center min-h-[40px] flex items-center justify-center ${mode === item.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Form Fields */}
                        <div className="space-y-4 pt-2">
                            {mode !== "reverse" ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Original Sticker Price ($)
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <DollarSign className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={val1}
                                                onChange={(e) => setVal1(e.target.value.replace(/^0+(?=\d)/, ""))}
                                                placeholder="100.00"
                                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Primary Discount (%)
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Percent className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="any"
                                                value={val2}
                                                onChange={(e) => setVal2(e.target.value.replace(/^0+(?=\d)/, ""))}
                                                placeholder="20"
                                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Final Sale Price Received ($)
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <DollarSign className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={val1}
                                                onChange={(e) => setVal1(e.target.value.replace(/^0+(?=\d)/, ""))}
                                                placeholder="45.00"
                                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Applied Discount Rate (%)
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <Percent className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                max="99.9"
                                                step="any"
                                                value={val2}
                                                onChange={(e) => setVal2(e.target.value.replace(/^0+(?=\d)/, ""))}
                                                placeholder="25"
                                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Conditional Field: Secondary Discount */}
                            {mode === "double" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Secondary Stacked Promo Rate (%)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="any"
                                            value={val3}
                                            onChange={(e) => setVal3(e.target.value.replace(/^0+(?=\d)/, ""))}
                                            placeholder="10"
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Conditional Field: Sales Tax */}
                            {(mode === "tax-after" || mode === "tax-before") && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        State / Regional Sales Tax (%)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <Percent className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={val3}
                                            onChange={(e) => setVal3(e.target.value.replace(/^0+(?=\d)/, ""))}
                                            placeholder="8.25"
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Presets */}
                        <div>
                            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Common Deal Presets
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {[10, 15, 20, 25, 30, 50, 70].map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => {
                                            if (mode === "reverse") setVal2(preset.toString());
                                            else setVal2(preset.toString());
                                        }}
                                        className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium hover:bg-indigo-100 transition-colors"
                                    >
                                        {preset}% Off
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                        <button
                            onClick={handleLoadSample}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
                        >
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            Load Sample
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4 text-slate-500" />
                            Reset Inputs
                        </button>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: CALCULATED OUTPUT ══════════════════ */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                        {/* Header */}
                        <div className="bg-slate-800 px-5 py-3.5 text-white flex items-center justify-between">
                            <span className="text-sm font-semibold flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-300" />
                                Live Calculation Breakdown
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                                100% Client-Side
                            </span>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Primary Output Hero Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                                        Final Out-of-Pocket
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900 font-mono">
                                        ${metrics.finalPrice.toFixed(2)}
                                    </span>
                                </div>

                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
                                    <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block mb-1">
                                        Total Money Saved
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-extrabold text-indigo-900 font-mono">
                                        ${metrics.totalSaved.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Data Metrics Table */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                                    <span className="text-slate-600">Original Sticker Price:</span>
                                    <span className="font-semibold text-slate-900 font-mono">
                                        ${metrics.originalPrice.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                                    <span className="text-slate-600">Effective Savings Rate:</span>
                                    <span className="font-semibold text-indigo-600 font-mono">
                                        {metrics.effectiveDiscountRate.toFixed(2)}%
                                    </span>
                                </div>

                                {mode === "double" && (
                                    <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                                        <span className="text-slate-600">Sequential Promos Applied:</span>
                                        <span className="font-semibold text-slate-800 font-mono">
                                            {val2}% then {val3}%
                                        </span>
                                    </div>
                                )}

                                {metrics.taxAmount > 0 && (
                                    <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                                        <span className="text-slate-600">Added Sales Tax ({metrics.taxRate}%):</span>
                                        <span className="font-semibold text-slate-800 font-mono">
                                            +${metrics.taxAmount.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm pt-1">
                                    <span className="text-slate-600 font-medium">You Pay Only:</span>
                                    <span className="font-bold text-slate-900 font-mono">
                                        {metrics.originalPrice > 0
                                            ? ((metrics.finalPrice / metrics.originalPrice) * 100).toFixed(1)
                                            : 0}
                                        % of Original
                                    </span>
                                </div>
                            </div>

                            {/* Visual Percentage Bar */}
                            <div>
                                <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                                    <span>Payable ({100 - Math.min(100, metrics.effectiveDiscountRate)}%)</span>
                                    <span>Savings ({Math.min(100, metrics.effectiveDiscountRate).toFixed(1)}%)</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                                    <div
                                        className="bg-emerald-500 transition-all duration-300"
                                        style={{ width: `${Math.max(0, 100 - metrics.effectiveDiscountRate)}%` }}
                                    />
                                    <div
                                        className="bg-indigo-600 transition-all duration-300"
                                        style={{ width: `${Math.min(100, metrics.effectiveDiscountRate)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Copy Summary Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <button
                            onClick={handleCopySummary}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-emerald-300" />
                                    <span>Breakdown Copied to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Financial Breakdown</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT (EXPLICIT SEO PROSE & CARDS)
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8">
                {/* Card 1: Technical Architecture of Commercial Discounting */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <span>Mathematical Foundations of Retail Discounts and Markdowns</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Calculating commercial discounts involves applying exact percentage reductions to standard list prices.
                            While simple percentage subtractions appear straightforward on surface inspection, modern retail strategies like
                            stacked promotional codes, regional value-added tax (VAT) additions, and reverse wholesale margins introduce mathematical
                            nuances that require deterministic financial logic. Understanding the exact mechanics of flat markdowns versus sequential
                            compounding reductions empowers consumers to make smarter purchasing decisions and enables merchant managers to maintain tight unit economics.
                        </p>
                        <p>
                            The core mathematical equation for a standard single-discount markdown reduces an original sticker price
                            $P_0$ by a percentage rate $d$:
                        </p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-800 text-center">
                            {"$$P_{\\text{final}} = P_0 \\times \\left(1 - \\frac{d}{100}\\right)$$"}
                        </div>
                        <p>
                            {"When state sales taxes or regional consumption taxes enter the calculation, the operational sequence depends on local commercial regulations. In almost all standardized sales environments, sales tax applies strictly to the net discounted subtotal ($P_{\\text{discounted}}$), ensuring buyers are not penalized by paying government levies on promotional savings."}
                        </p>
                    </div>
                </div>

                {/* Card 2: Stacked & Double Discount Logic Analysis */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <span>The Fallacy of Adding Stacked Discounts (20% + 10% ≠ 30%)</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            A universal point of confusion during promotional sales events is the mathematical treatment of double or stacked discounts.
                            When a retail outlet advertises an extra 10% off an item already marked down by 20%, buyers frequently assume a simple combined reduction of 30%.
                            However, accounting standards enforce sequential calculation rather than additive arithmetic.
                        </p>
                        <p>
                            The primary discount rate $d_1$ is first calculated against the full original price $P_0$.
                            The secondary discount $d_2$ is subsequently applied exclusively to the remaining reduced balance, not the initial sticker price.
                            The true compounding equation follows:
                        </p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-800 text-center">
                            {"$$P_{\\text{final}} = P_0 \\times \\left(1 - \\frac{d_1}{100}\\right) \\times \\left(1 - \\frac{d_2}{100}\\right)$$"}
                        </div>
                        <p>
                            For example, taking 20% off a $100 product lowers the intermediate subtotal to $80. Taking an additional 10% off reduces $80 by $8, yielding a final out-of-pocket price of $72.
                            The effective total savings rate is 28%, not 30%. Utilizing our Stacked Mode eliminates manual estimation errors and reveals true net savings instantly.
                        </p>
                    </div>
                </div>

                {/* Card 3: Reverse Pricing & List Reconstruction */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Scale className="w-5 h-5" />
                        </div>
                        <span>Reverse Pricing & List Price Reconstruction</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            {"Financial analysts, audit teams, and e-commerce merchants frequently operate in reverse: given a final checkout price $P_{\\text{final}}$ and a known promotional discount rate $d$, they must calculate what the original list price $P_0$ was prior to the offer."}
                        </p>
                        <p>
                            Reconstructing the original sticker price requires isolating $P_0$ in the standard markdown formula:
                        </p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-800 text-center">
                            {"$$P_0 = \\frac{P_{\\text{final}}}{1 - \\frac{d}{100}}$$"}
                        </div>
                        <p>
                            This reverse calculation is essential for verifying supplier invoices, confirming price reduction claims during holiday clearance events, or auditing competitor pricing strategies from final receipts.
                        </p>
                    </div>
                </div>

                {/* Card 4: Discount Workflow Matrix Table */}
                <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Discount Calculation Mode Comparison Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The reference matrix below outlines the inputs, mathematical logic, and primary applications across each mode supported by our calculation engine:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Workflow Mode</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Required Inputs</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Underlying Formula</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Standard Discount", "Price ($), Discount (%)", "P * (1 - d/100)", "Single clearance tags, coupon codes"],
                                    ["Stacked (Double)", "Price ($), Discount 1 (%), Discount 2 (%)", "P * (1 - d1/100) * (1 - d2/100)", "Storewide sales combined with loyalty rewards"],
                                    ["Discount + Tax", "Price ($), Discount (%), Sales Tax (%)", "(P * (1 - d/100)) * (1 + tax/100)", "Calculating final total out-of-pocket costs"],
                                    ["Reverse Pricing", "Sale Price ($), Discount (%)", "P_sale / (1 - d/100)", "Reconstructing original price tags from final receipts"],
                                ].map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                                    >
                                        {row.map((cell, cellIdx) => (
                                            <td
                                                key={cellIdx}
                                                className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono"
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 5: Real-World Use Cases & Applications */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span>Real-World Commercial Applications & Strategic Workflows</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            {
                                title: "In-Store & Online Clearance Shopping",
                                body: "Determine your exact out-of-pocket costs at checkout when clothing, electronics, or home goods feature promotional tags, avoiding surprise subtotals at the payment terminal.",
                            },
                            {
                                title: "E-Commerce Promotional Campaign Planning",
                                body: "Retail merchants can simulate tiered coupon codes and stacked loyalty promotions to forecast gross margins and prevent unintended margin erosion before launching sales.",
                            },
                            {
                                title: "B2B Wholesale & Quantity Tier Negotiations",
                                body: "Commercial buyers purchasing inventory in bulk can convert complex trade discount sequences (e.g., 20/10/5 terms) into net effective pricing per unit.",
                            },
                            {
                                title: "Expense Auditing & Receipt Verification",
                                body: "Accounting personnel can easily verify that vendor invoices correctly applied agreed-upon contract discounts and proper tax rates before issuing payments.",
                            },
                        ].map(({ title, body }) => (
                            <div
                                key={title}
                                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <h3 className="font-semibold text-slate-800 mb-2 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                    {title}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 6: Step-by-Step Practical Calculation Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <ListOrdered className="w-5 h-5" />
                        </div>
                        <span>How to Calculate Discount Savings Step-by-Step</span>
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            {
                                step: "1",
                                title: "Select Your Mode",
                                body: "Choose between Standard, Stacked, Tax-Adjusted, or Reverse mode based on your pricing scenario.",
                            },
                            {
                                step: "2",
                                title: "Enter Price & Rates",
                                body: "Input the sticker price, primary discount percentage, and any secondary promo or tax rates.",
                            },
                            {
                                step: "3",
                                title: "Analyze & Copy Results",
                                body: "Instantly review total money saved, final out-of-pocket cost, and effective savings percentage.",
                            },
                        ].map(({ step, title, body }) => (
                            <div key={step} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                                        {step}
                                    </span>
                                    {title}
                                </h3>
                                <p className="text-slate-700 text-xs md:text-sm leading-relaxed">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 7: Static FAQ Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Is sales tax calculated before or after applying a discount?",
                                a: "In almost all retail environments and online checkouts, sales tax is calculated after subtracting promotional discounts. You are legally taxed only on the actual cash amount paid for the item, not the original pre-discount price.",
                            },
                            {
                                q: "How does a double discount differ from a single combined discount?",
                                a: "A double discount applies sequentially: the second discount reduces the balance remaining after the first discount is deducted. A single combined discount reduces the full original price directly. Consequently, two 20% discounts yield 36% total savings, not 40%.",
                            },
                            {
                                q: "Can I calculate negative discounts or price markups?",
                                a: "Yes. Entering a negative percentage into the discount field acts as a price markup or gross margin increase, increasing the final subtotal above the original price.",
                            },
                            {
                                q: "What is an effective discount rate?",
                                a: "The effective discount rate represents the actual total percentage saved relative to the original list price when multiple discounts or taxes are combined into a single final sum.",
                            },
                        ].map(({ q, a }) => (
                            <div
                                key={q}
                                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5"
                            >
                                <h3 className="font-semibold text-slate-900 text-sm md:text-base mb-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                    {q}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-3">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 8: Platform Performance & Security Advantages */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span>Platform Advantages & Client-Side Privacy Guarantee</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            {
                                icon: Zap,
                                title: "Zero Latency Execution",
                                body: "Calculations run locally in your browser with zero network round-trips. Results update instantly as you type.",
                            },
                            {
                                icon: ShieldCheck,
                                title: "100% Client-Side Privacy",
                                body: "Your input prices, margins, and financial figures never leave your device. Zero server logging or data storage.",
                            },
                            {
                                icon: Cpu,
                                title: "Precision Floating Point Math",
                                body: "Custom mathematical functions prevent floating-point rounding errors common in standard web calculators.",
                            },
                            {
                                icon: Layers,
                                title: "Multi-Mode Flexibility",
                                body: "Seamlessly switch between single markdown, stacked promo, sales tax, and reverse price reconstruction workflows.",
                            },
                        ].map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                                            {title}
                                        </h3>
                                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                            {body}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────
           JSON-LD STRUCTURED DATA SCHEMAS
      ───────────────────────────────────────────────────────────── */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Discount Calculator & Savings Percentage Suite",
                        url: "https://www.twistertools.com/tools/calculators/discount-calculator",
                        applicationCategory: "FinanceApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript",
                        description:
                            "Free online discount calculator to calculate final sales prices, stacked double discounts, sales tax subtotals, and reverse original list prices.",
                        featureList: [
                            "Single percentage discount calculation",
                            "Sequential stacked double discount compounding",
                            "Pre-tax and post-tax sales tax adjustments",
                            "Reverse original price tag reconstruction",
                            "Real-time effective savings rate visualization",
                            "100% client-side calculation with complete data privacy",
                        ],
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "USD",
                        },
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: [
                            {
                                "@type": "Question",
                                name: "Is sales tax calculated before or after applying a discount?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "In almost all retail environments, sales tax is applied after subtracting promotional discounts. You pay tax only on the net cash paid.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "How does a double discount differ from a single combined discount?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "A double discount applies sequentially to the reduced balance, yielding a slightly lower total discount than adding percentages directly.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Can I calculate negative discounts or price markups?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes. Entering a negative percentage into the discount field acts as a price markup or gross margin increase.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "What is an effective discount rate?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "The effective discount rate represents the actual total percentage saved relative to the original list price when multiple discounts or taxes are combined.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}