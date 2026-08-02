"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
    DollarSign,
    Eye,
    MousePointerClick,
    TrendingUp,
    Percent,
    RefreshCw,
    Copy,
    Check,
    Calculator,
    HelpCircle,
    Lightbulb,
    ShieldCheck,
    BarChart3,
    Globe,
    Award,
    BookOpen,
    PieChart,
    AlertCircle,
    Layers,
    ArrowRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  AdSense Calculations Engine
// ─────────────────────────────────────────────────────────────

interface CalculationInputs {
    pageViews: number;
    ctr: number;
    cpc: number;
}

interface CalculationOutputs {
    dailyEarnings: number;
    monthlyEarnings: number;
    annualEarnings: number;
    dailyClicks: number;
    monthlyClicks: number;
    rpm: number;
}

function calculateAdSense({
    pageViews,
    ctr,
    cpc,
}: CalculationInputs): CalculationOutputs {
    const views = Math.max(0, pageViews || 0);
    const clickThroughRate = Math.max(0, ctr || 0) / 100;
    const costPerClick = Math.max(0, cpc || 0);

    const dailyClicks = views * clickThroughRate;
    const dailyEarnings = dailyClicks * costPerClick;
    const monthlyEarnings = dailyEarnings * 30;
    const annualEarnings = dailyEarnings * 365;
    const monthlyClicks = dailyClicks * 30;
    const rpm = views > 0 ? (dailyEarnings / views) * 1000 : 0;

    return {
        dailyEarnings,
        monthlyEarnings,
        annualEarnings,
        dailyClicks,
        monthlyClicks,
        rpm,
    };
}

// ─────────────────────────────────────────────────────────────
//  Main Component
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

export default function AdSenseCalculator() {
    const [pageViewsInput, setPageViewsInput] = useState<string>("10000");
    const [ctrInput, setCtrInput] = useState<string>("1.5");
    const [cpcInput, setCpcInput] = useState<string>("0.25");
    const [copied, setCopied] = useState<boolean>(false);

    const parsedInputs = useMemo<CalculationInputs>(() => {
        return {
            pageViews: parseFloat(pageViewsInput) || 0,
            ctr: parseFloat(ctrInput) || 0,
            cpc: parseFloat(cpcInput) || 0,
        };
    }, [pageViewsInput, ctrInput, cpcInput]);

    const results = useMemo<CalculationOutputs>(() => {
        return calculateAdSense(parsedInputs);
    }, [parsedInputs]);

    const handleReset = useCallback(() => {
        setPageViewsInput("10000");
        setCtrInput("1.5");
        setCpcInput("0.25");
    }, []);

    const handleCopySummary = useCallback(async () => {
        const summaryText = `Google AdSense Earnings Estimate:
• Daily Page Views: ${parsedInputs.pageViews.toLocaleString()}
• Click-Through Rate (CTR): ${parsedInputs.ctr}%
• Cost Per Click (CPC): $${parsedInputs.cpc.toFixed(2)}
----------------------------------------
• Page RPM: $${results.rpm.toFixed(2)}
• Daily Revenue: $${results.dailyEarnings.toFixed(2)}
• Monthly Revenue: $${results.monthlyEarnings.toFixed(2)}
• Annual Revenue: $${results.annualEarnings.toFixed(2)}
• Monthly Estimated Clicks: ${Math.round(results.monthlyClicks).toLocaleString()}
Generated with TwisterTools AdSense Revenue Calculator`;

        try {
            await navigator.clipboard.writeText(summaryText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = summaryText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [parsedInputs, results]);

    return (
        <div className="w-full space-y-8">

            {/* ── Workspace Grid (50/50 Split) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Left Panel: Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <Calculator className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-800">
                                Traffic &amp; Monetization Variables
                            </h2>
                        </div>
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reset Inputs
                        </button>
                    </div>

                    {/* Input 1: Daily Page Views */}
                    <div className="space-y-2">
                        <label
                            htmlFor="page-views-input"
                            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        >
                            Daily Page Views
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                <Eye className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                id="page-views-input"
                                type="number"
                                min="0"
                                step="100"
                                value={pageViewsInput}
                                onChange={(e) => setPageViewsInput(e.target.value.replace(/^0+(?=\d)/, ""))}
                                placeholder="10000"
                                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            Total daily ad impression opportunities or total web page visits.
                        </p>
                    </div>

                    {/* Input 2: Click-Through Rate (CTR %) */}
                    <div className="space-y-2">
                        <label
                            htmlFor="ctr-input"
                            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        >
                            Click-Through Rate (CTR %)
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                <Percent className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                id="ctr-input"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={ctrInput}
                                onChange={(e) => setCtrInput(e.target.value.replace(/^0+(?=\d)/, ""))}
                                placeholder="1.5"
                                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            Percentage of total visitors clicking an advertisement (Industry Avg: 1% – 2.5%).
                        </p>
                    </div>

                    {/* Input 3: Cost Per Click (CPC $) */}
                    <div className="space-y-2">
                        <label
                            htmlFor="cpc-input"
                            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        >
                            Cost Per Click (CPC $)
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                <MousePointerClick className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                id="cpc-input"
                                type="number"
                                min="0"
                                step="0.05"
                                value={cpcInput}
                                onChange={(e) => setCpcInput(e.target.value.replace(/^0+(?=\d)/, ""))}
                                placeholder="0.25"
                                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            Average payout paid by advertisers for a single click in your niche.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleCopySummary}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 min-h-[44px]"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-green-300" />
                                    <span>Report Copied to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Financial Summary</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Live Projection Dashboards */}
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-800">
                                Revenue &amp; Metric Forecast
                            </h2>
                        </div>

                        {/* Calculated Hero: Page RPM */}
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-inner space-y-1">
                            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-widest">
                                Calculated Page RPM (Revenue Per 1,000 Views)
                            </span>
                            <div className="text-3xl font-extrabold font-mono text-white">
                                ${results.rpm.toFixed(2)}
                            </div>
                            <p className="text-xs text-slate-300 pt-1">
                                Your site generates roughly ${results.rpm.toFixed(2)} for every thousand page impressions.
                            </p>
                        </div>

                        {/* Projection Cards Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                    Daily Earnings
                                </span>
                                <p className="text-base font-extrabold text-slate-900 font-mono truncate">
                                    ${results.dailyEarnings.toFixed(2)}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    ~{Math.round(results.dailyClicks)} clicks
                                </p>
                            </div>

                            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 text-center">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                                    Monthly Revenue
                                </span>
                                <p className="text-base font-extrabold text-indigo-900 font-mono truncate">
                                    ${results.monthlyEarnings.toFixed(2)}
                                </p>
                                <p className="text-[10px] text-indigo-600 mt-1">
                                    ~{Math.round(results.monthlyClicks).toLocaleString()} clicks
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                    Annual Projection
                                </span>
                                <p className="text-base font-extrabold text-slate-900 font-mono truncate">
                                    ${results.annualEarnings.toFixed(2)}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">365-day run rate</p>
                            </div>
                        </div>

                        {/* Formula Breakdown Callout */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5 font-mono">
                            <div className="font-semibold text-slate-800 text-xs font-sans">
                                Active Financial Formulas Applied:
                            </div>
                            <p>• Daily Clicks = Page Views × (CTR / 100)</p>
                            <p>• Daily Revenue = Clicks × Cost Per Click (CPC)</p>
                            <p>• Page RPM = (Daily Earnings / Page Views) × 1,000</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Below-the-Fold Structured Content Cards ── */}
            <section className="space-y-6">
                {/* Card 1: Comprehensive Terminology & Technical Definitions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>AdSense Terminology &amp; Key Financial Metrics Defined</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            To accurately evaluate digital ad monetization, website publishers must master the fundamental performance indicators that govern display network auctions:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-5 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-indigo-600" />
                                    Page Views vs. Ad Impressions
                                </h3>
                                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                                    <strong>Page Views</strong> measure the total number of times a webpage is loaded by a user. <strong>Ad Impressions</strong> count the number of individual ad units requested and served. If a single page contains 3 ad slots, 1,000 page views equal 3,000 ad impressions.
                                </p>
                            </div>

                            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-5 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                                    <MousePointerClick className="w-4 h-4 text-indigo-600" />
                                    Click-Through Rate (CTR)
                                </h3>
                                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                                    The percentage of ad-exposed visitors who click an ad unit. Calculated as: <strong>CTR = (Total Clicks / Total Impressions) × 100</strong>. Standard web display CTRs typically range between 0.8% and 2.5%.
                                </p>
                            </div>

                            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-5 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-indigo-600" />
                                    Cost Per Click (CPC)
                                </h3>
                                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                                    The dollar amount an advertiser pays for a single user click. CPC fluctuates based on advertiser bidding competition, niche profitability, and keyword commercial intent.
                                </p>
                            </div>

                            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-5 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                                    Revenue Per Mille (RPM) &amp; eCPM
                                </h3>
                                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                                    <strong>Page RPM</strong> reflects estimated publisher revenue for every 1,000 page views. Calculated as: <strong>Page RPM = (Estimated Earnings / Page Views) × 1,000</strong>. It normalizes revenue tracking across varying traffic levels.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Strategic Industry Shift: The Move from CPC to CPM */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Google AdSense Monetization Dynamics: The Shift to Impression-Based (CPM) Pricing</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Google AdSense updated its revenue-sharing framework and shifted display advertising toward an <strong>impression-based (CPM) model</strong>, aligning with broader ad-tech standards. Under this structure, publishers earn revenue based on viewable impressions rather than relying exclusively on user clicks.
                        </p>
                        <p>
                            Despite this shift, click metrics (CTR and CPC) remain critical for modeling revenue potential. Advertisers continue to place higher CPM bids on placements with proven click performance and high viewability, meaning high CTR pages still command significantly higher Page RPMs in real-time auctions.
                        </p>
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-sm space-y-2">
                            <span className="font-bold text-indigo-900 block">
                                Publisher Revenue Split Structure:
                            </span>
                            <p className="text-indigo-950 text-xs md:text-sm">
                                For AdSense for Content, publishers receive an effective <strong>80% revenue share</strong> after advertiser platform fee deductions. When advertisers purchase inventory via Google Ads, publishers continue to keep roughly <strong>68% of the total spend</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 3: Detailed Practical Step-by-Step Calculation Example */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Step-by-Step Calculation Example: High-Traffic Tech Blog</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate how daily traffic converts into monthly revenue, consider a tech blog receiving <strong>25,000 page views per day</strong> with an average <strong>CTR of 2.0%</strong> and a <strong>CPC of $0.40</strong>:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                            <span className="text-xs text-slate-500 font-bold uppercase">Step 1: Daily Clicks</span>
                            <p className="font-mono text-sm font-semibold text-slate-900">25,000 × 0.02 = 500 Clicks/Day</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                            <span className="text-xs text-slate-500 font-bold uppercase">Step 2: Daily Revenue</span>
                            <p className="font-mono text-sm font-semibold text-slate-900">500 Clicks × $0.40 = $200.00/Day</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                            <span className="text-xs text-slate-500 font-bold uppercase">Step 3: Page RPM</span>
                            <p className="font-mono text-sm font-semibold text-slate-900">($200 / 25,000) × 1,000 = $8.00 RPM</p>
                        </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 text-sm font-medium">
                        Projected Monthly Earnings (30 Days): $200.00 × 30 = <strong>$6,000.00 per month</strong> (15,000 clicks).
                    </div>
                </div>

                {/* Card 4: Industry Benchmarks Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Industry Benchmarks: Estimated CPC &amp; Page RPM Across Content Niches</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        AdSense yields vary substantially based on audience geography, commercial intent, and advertiser budget density. Higher commercial niches command premium advertiser bids.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left text-xs md:text-sm">
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    <th className="px-4 py-3 font-semibold">Content Vertical / Niche</th>
                                    <th className="px-4 py-3 font-semibold">Avg. CPC Range</th>
                                    <th className="px-4 py-3 font-semibold">Avg. CTR Range</th>
                                    <th className="px-4 py-3 font-semibold">Estimated Page RPM Range</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="bg-white hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">Insurance, Legal &amp; Mortgages</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">$2.50 – $8.00+</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">1.2% – 3.0%</td>
                                    <td className="px-4 py-3 font-mono text-indigo-600 font-bold">$30.00 – $90.00+</td>
                                </tr>
                                <tr className="bg-slate-50/50 hover:bg-slate-100/50">
                                    <td className="px-4 py-3 font-medium text-slate-900">Personal Finance &amp; Crypto</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">$1.20 – $3.50</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">1.5% – 2.5%</td>
                                    <td className="px-4 py-3 font-mono text-indigo-600 font-bold">$18.00 – $45.00</td>
                                </tr>
                                <tr className="bg-white hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">B2B Software, Cloud &amp; SaaS</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">$0.80 – $2.20</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">1.0% – 2.0%</td>
                                    <td className="px-4 py-3 font-mono text-indigo-600 font-bold">$8.00 – $24.00</td>
                                </tr>
                                <tr className="bg-slate-50/50 hover:bg-slate-100/50">
                                    <td className="px-4 py-3 font-medium text-slate-900">Health, Fitness &amp; Medical</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">$0.45 – $1.30</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">1.2% – 2.8%</td>
                                    <td className="px-4 py-3 font-mono text-indigo-600 font-bold">$5.00 – $18.00</td>
                                </tr>
                                <tr className="bg-white hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">Gaming, News &amp; Entertainment</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">$0.05 – $0.25</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">0.8% – 1.8%</td>
                                    <td className="px-4 py-3 font-mono text-indigo-600 font-bold">$0.80 – $4.50</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 5: Optimization Strategies */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Proven Actionable Tactics to Increase Your Page RPM</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                            <h3 className="font-semibold text-slate-900 text-sm md:text-base flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-600" />
                                High Viewability Above-The-Fold Placements
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Position responsive leaderboards or sticky anchor ad units where viewability rates exceed 70%. High viewability directly increases programmatic CPM bids in ad exchanges.
                            </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                            <h3 className="font-semibold text-slate-900 text-sm md:text-base flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                Target Tier-1 Geographic Traffic
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Audience traffic from the United States, United Kingdom, Canada, and Australia yields significantly higher CPC and CPM rates due to higher purchasing power and advertiser demand.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 6: FAQ Section (Strict Non-Accordion Border Cards) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>AdSense Revenue Calculation Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-semibold text-slate-900 text-sm md:text-base mb-1">
                                What is the mathematical difference between RPM and CPM?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                CPM (Cost Per Mille) measures the cost an advertiser pays for 1,000 ad impressions. RPM (Revenue Per Mille) measures the total revenue a publisher earns across all ad units per 1,000 page views.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-semibold text-slate-900 text-sm md:text-base mb-1">
                                Why do actual AdSense payouts differ from projected calculations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Projections assume constant CTR and CPC averages. Real revenue fluctuates due to seasonality (Q4 ad spend spikes), user location, ad blockers, mobile vs. desktop ratios, and Google's invalid click deduction algorithms.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-semibold text-slate-900 text-sm md:text-base mb-1">
                                How many page views are required to earn $100 per day with Google AdSense?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                At an average Page RPM of $5.00, a website requires approximately 20,000 daily page views to earn $100 per day. High-CPC finance websites might achieve this with only 3,000 daily page views.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 7: Legal & Financial Disclaimer Callout Card */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
                    <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm md:text-base">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <span>Disclaimer &amp; Brand Reference Notice</span>
                    </div>
                    <p className="text-amber-900/90 text-xs md:text-sm leading-relaxed">
                        This earnings calculator is an independent planning and forecasting tool built solely for educational and estimation purposes. <strong>Google AdSense™</strong> is a trademark of Google LLC. This tool is not affiliated with, endorsed by, or sponsored by Google LLC. Actual advertising earnings are determined dynamically by Google's real-time auction system and vary significantly based on traffic quality, niche competition, user demographics, ad viewability, and macro-economic factors. No guarantee of future income is implied.
                    </p>
                </div>
            </section>

            {/* ── JSON-LD Structured Data Schemas ── */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "AdSense Revenue & CTR/RPM Earnings Calculator",
                        applicationCategory: "BusinessApplication",
                        operatingSystem: "All",
                        description:
                            "Estimate Google AdSense revenue, daily/monthly earnings, click-through rates (CTR), cost per click (CPC), and page RPM.",
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
                                name: "What is the mathematical difference between RPM and CPM?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "CPM measures advertiser costs per 1,000 impressions, while RPM measures publisher earnings per 1,000 total page views.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why do actual AdSense payouts differ from projected calculations?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Real earnings fluctuate based on seasonal ad budgets, ad blockers, visitor geography, and real-time auction bidding.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "How many page views are required to earn $100 per day with Google AdSense?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "At an average Page RPM of $5.00, roughly 20,000 daily page views are needed to generate $100 per day.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}