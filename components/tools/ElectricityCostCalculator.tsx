"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Zap,
    DollarSign,
    Clock,
    Flame,
    Tv,
    Wind,
    Laptop,
    HelpCircle,
    BookOpen,
    RefreshCw,
    Download,
    Copy,
    Check,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Calculator,
    AlertTriangle,
    Plus,
    Trash2,
    ListFilter,
    Layers,
    Lightbulb,
    Scale,
    TrendingDown,
    Activity
} from "lucide-react";

interface AppliancePreset {
    id: string;
    label: string;
    category: "Cooling & Heating" | "Kitchen" | "Entertainment & Computing" | "Lighting & Home";
    wattage: number;
    defaultHoursPerDay: number;
    icon: string;
}

const APPLIANCE_PRESETS: AppliancePreset[] = [
    { id: "central-ac", label: "Central AC (3-Ton / 12 SEER)", category: "Cooling & Heating", wattage: 3500, defaultHoursPerDay: 8, icon: "Wind" },
    { id: "window-ac", label: "Window Air Conditioner (10,000 BTU)", category: "Cooling & Heating", wattage: 1000, defaultHoursPerDay: 8, icon: "Wind" },
    { id: "space-heater", label: "Portable Electric Space Heater", category: "Cooling & Heating", wattage: 1500, defaultHoursPerDay: 6, icon: "Flame" },
    { id: "water-heater", label: "Electric Water Heater (50 Gal)", category: "Cooling & Heating", wattage: 4000, defaultHoursPerDay: 3, icon: "Flame" },
    { id: "refrigerator", label: "Standard Refrigerator / Freezer", category: "Kitchen", wattage: 150, defaultHoursPerDay: 24, icon: "Layers" },
    { id: "dishwasher", label: "Dishwasher (Heated Dry Cycle)", category: "Kitchen", wattage: 1800, defaultHoursPerDay: 1.5, icon: "Layers" },
    { id: "electric-oven", label: "Electric Range / Oven (350°F)", category: "Kitchen", wattage: 2400, defaultHoursPerDay: 1, icon: "Flame" },
    { id: "microwave", label: "Countertop Microwave Oven", category: "Kitchen", wattage: 1100, defaultHoursPerDay: 0.5, icon: "Layers" },
    { id: "gaming-pc", label: "Gaming Desktop PC + Dual Monitors", category: "Entertainment & Computing", wattage: 450, defaultHoursPerDay: 5, icon: "Laptop" },
    { id: "tv-oled", label: '65" 4K OLED Smart TV', category: "Entertainment & Computing", wattage: 120, defaultHoursPerDay: 6, icon: "Tv" },
    { id: "led-bulbs", label: "10x LED Bulbs (800 Lumens / 9W)", category: "Lighting & Home", wattage: 90, defaultHoursPerDay: 6, icon: "Lightbulb" },
    { id: "washing-machine", label: "Washing Machine (Warm Cycle)", category: "Lighting & Home", wattage: 500, defaultHoursPerDay: 1, icon: "Layers" },
    { id: "clothes-dryer", label: "Electric Clothes Dryer (240V)", category: "Lighting & Home", wattage: 3000, defaultHoursPerDay: 1, icon: "Flame" },
    { id: "ev-charger-l2", label: "Level 2 EV Home Charger (32A)", category: "Cooling & Heating", wattage: 7680, defaultHoursPerDay: 4, icon: "Zap" },
];

interface CustomApplianceItem {
    id: string;
    name: string;
    wattage: number;
    hoursPerDay: number;
    daysPerWeek: number;
}

type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "INR";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "$",
    AUD: "$",
    INR: "₹",
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

export default function ElectricityCostCalculator() {
    // Mode State
    const [calcMode, setCalcMode] = useState<"single" | "multi">("single");

    // Single Appliance Mode State
    const [applianceName, setApplianceName] = useState<string>("Central Air Conditioner");
    const [powerUnit, setPowerUnit] = useState<"watts" | "kilowatts">("watts");
    const [powerValue, setPowerValue] = useState<number>(3500);
    const [hoursPerDay, setHoursPerDay] = useState<number>(8);
    const [daysPerWeek, setDaysPerWeek] = useState<number>(7);
    const [kwhRate, setKwhRate] = useState<number>(0.16); // $0.16 / kWh (US avg benchmark)
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [activePresetId, setActivePresetId] = useState<string | null>("central-ac");

    // Multi-Appliance Audit Mode State
    const [auditItems, setAuditItems] = useState<CustomApplianceItem[]>([
        { id: "item-1", name: "Refrigerator", wattage: 150, hoursPerDay: 24, daysPerWeek: 7 },
        { id: "item-2", name: "Central AC", wattage: 3500, hoursPerDay: 7, daysPerWeek: 7 },
        { id: "item-3", name: "Water Heater", wattage: 4000, hoursPerDay: 3, daysPerWeek: 7 },
        { id: "item-4", name: "Gaming PC / Setup", wattage: 450, hoursPerDay: 5, daysPerWeek: 7 },
    ]);
    const [newAuditName, setNewAuditName] = useState<string>("");
    const [newAuditWatts, setNewAuditWatts] = useState<number>(500);
    const [newAuditHours, setNewAuditHours] = useState<number>(4);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeViewTab, setActiveViewTab] = useState<"metrics" | "breakdown">("metrics");

    const currencySymbol = currencySymbols[currency];

    // Single Appliance Math
    const singleCalculations = useMemo(() => {
        const effectiveWatts = powerUnit === "kilowatts" ? powerValue * 1000 : powerValue;
        const dailyKwh = (effectiveWatts * hoursPerDay * (daysPerWeek / 7)) / 1000;
        const monthlyKwh = dailyKwh * 30.4375; // exact average calendar month
        const yearlyKwh = dailyKwh * 365;

        const hourlyCost = (effectiveWatts / 1000) * kwhRate;
        const dailyCost = dailyKwh * kwhRate;
        const monthlyCost = monthlyKwh * kwhRate;
        const yearlyCost = yearlyKwh * kwhRate;

        return {
            effectiveWatts,
            dailyKwh,
            monthlyKwh,
            yearlyKwh,
            hourlyCost,
            dailyCost,
            monthlyCost,
            yearlyCost,
        };
    }, [powerValue, powerUnit, hoursPerDay, daysPerWeek, kwhRate]);

    // Multi-Appliance Audit Math
    const multiCalculations = useMemo(() => {
        let totalDailyKwh = 0;
        let totalMonthlyKwh = 0;
        let totalYearlyKwh = 0;

        const itemsBreakdown = auditItems.map((item) => {
            const dailyKwh = (item.wattage * item.hoursPerDay * (item.daysPerWeek / 7)) / 1000;
            const monthlyKwh = dailyKwh * 30.4375;
            const yearlyKwh = dailyKwh * 365;
            const monthlyCost = monthlyKwh * kwhRate;
            const yearlyCost = yearlyKwh * kwhRate;

            totalDailyKwh += dailyKwh;
            totalMonthlyKwh += monthlyKwh;
            totalYearlyKwh += yearlyKwh;

            return {
                ...item,
                dailyKwh,
                monthlyKwh,
                yearlyKwh,
                monthlyCost,
                yearlyCost,
            };
        });

        const totalMonthlyCost = totalMonthlyKwh * kwhRate;
        const totalYearlyCost = totalYearlyKwh * kwhRate;
        const totalDailyCost = totalDailyKwh * kwhRate;

        return {
            itemsBreakdown,
            totalDailyKwh,
            totalMonthlyKwh,
            totalYearlyKwh,
            totalDailyCost,
            totalMonthlyCost,
            totalYearlyCost,
        };
    }, [auditItems, kwhRate]);

    // Preset Selection
    const handleSelectPreset = (preset: AppliancePreset) => {
        setActivePresetId(preset.id);
        setApplianceName(preset.label);
        setPowerUnit("watts");
        setPowerValue(preset.wattage);
        setHoursPerDay(preset.defaultHoursPerDay);
        setDaysPerWeek(7);
    };

    const handleAddAuditItem = () => {
        if (!newAuditName.trim()) return;
        const newItem: CustomApplianceItem = {
            id: `audit-${Date.now()}`,
            name: newAuditName.trim(),
            wattage: Math.max(1, newAuditWatts),
            hoursPerDay: Math.min(24, Math.max(0.1, newAuditHours)),
            daysPerWeek: 7,
        };
        setAuditItems([...auditItems, newItem]);
        setNewAuditName("");
        setNewAuditWatts(500);
        setNewAuditHours(4);
    };

    const handleRemoveAuditItem = (id: string) => {
        setAuditItems(auditItems.filter((i) => i.id !== id));
    };

    const handleResetSingle = () => {
        setApplianceName("Central Air Conditioner");
        setPowerUnit("watts");
        setPowerValue(3500);
        setHoursPerDay(8);
        setDaysPerWeek(7);
        setKwhRate(0.16);
        setActivePresetId("central-ac");
        setCurrency("USD");
    };

    const handleCopySummary = () => {
        let summaryText = "";
        if (calcMode === "single") {
            summaryText = `Electricity Running Cost Breakdown (TwisterTools):
----------------------------------------
Appliance: ${applianceName}
Power Rating: ${singleCalculations.effectiveWatts} Watts
Usage Schedule: ${hoursPerDay} hrs/day, ${daysPerWeek} days/week
Electricity Rate: ${currencySymbol}${kwhRate.toFixed(3)} / kWh
----------------------------------------
Energy Consumption:
- Daily: ${singleCalculations.dailyKwh.toFixed(2)} kWh
- Monthly: ${singleCalculations.monthlyKwh.toFixed(1)} kWh
- Yearly: ${singleCalculations.yearlyKwh.toFixed(0)} kWh
----------------------------------------
Estimated Operating Costs:
- Per Hour: ${currencySymbol}${singleCalculations.hourlyCost.toFixed(3)}
- Per Day: ${currencySymbol}${singleCalculations.dailyCost.toFixed(2)}
- Per Month: ${currencySymbol}${singleCalculations.monthlyCost.toFixed(2)}
- Per Year: ${currencySymbol}${singleCalculations.yearlyCost.toFixed(2)}
----------------------------------------
Calculated at twistertools.com/tools/calculators/electricity-cost-calculator`;
        } else {
            summaryText = `Household Appliance Electricity Audit (TwisterTools):
----------------------------------------
Total Appliances Analyzed: ${auditItems.length}
Electricity Rate: ${currencySymbol}${kwhRate.toFixed(3)} / kWh
----------------------------------------
Total Monthly Energy: ${multiCalculations.totalMonthlyKwh.toFixed(1)} kWh
Total Monthly Cost: ${currencySymbol}${multiCalculations.totalMonthlyCost.toFixed(2)}
Total Annual Cost: ${currencySymbol}${multiCalculations.totalYearlyCost.toFixed(2)}
----------------------------------------
Calculated at twistertools.com/tools/calculators/electricity-cost-calculator`;
        }

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (calcMode === "single") {
            const headers = ["Timeframe", "Energy Usage (kWh)", `Cost (${currency})`];
            const rows = [
                ["Hourly", (singleCalculations.effectiveWatts / 1000).toFixed(3), singleCalculations.hourlyCost.toFixed(4)],
                ["Daily", singleCalculations.dailyKwh.toFixed(2), singleCalculations.dailyCost.toFixed(2)],
                ["Monthly", singleCalculations.monthlyKwh.toFixed(2), singleCalculations.monthlyCost.toFixed(2)],
                ["Yearly", singleCalculations.yearlyKwh.toFixed(2), singleCalculations.yearlyCost.toFixed(2)],
            ];
            const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `electricity_cost_${applianceName.toLowerCase().replace(/\s+/g, "_")}.csv`;
            link.click();
        } else {
            const headers = ["Appliance Name", "Wattage (W)", "Hours/Day", "Days/Wk", "Monthly kWh", `Monthly Cost (${currency})`, `Annual Cost (${currency})`];
            const rows = multiCalculations.itemsBreakdown.map((item) => [
                `"${item.name}"`,
                item.wattage,
                item.hoursPerDay,
                item.daysPerWeek,
                item.monthlyKwh.toFixed(2),
                item.monthlyCost.toFixed(2),
                item.yearlyCost.toFixed(2),
            ]);
            const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `household_energy_audit_${auditItems.length}_items.csv`;
            link.click();
        }
    };

    // SEO Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Electricity Appliance Running Cost & kWh Estimator",
        "url": "https://twistertools.com/tools/calculators/electricity-cost-calculator",
        "description": "Accurately calculate running costs, kilowatt-hour (kWh) electricity consumption, and utility bill impact for home appliances with customizable utility tariff rates.",
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
                "name": "How is electricity cost calculated from appliance wattage?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Electricity cost is calculated by multiplying the appliance power rating (in kilowatts) by the operating hours, and then multiplying by your utility rate per kWh: Cost = (Watts / 1000) × Hours of Use × Rate per kWh."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Watts (W) and Kilowatt-Hours (kWh)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Watts (W) measure instantaneous electrical power demand, whereas Kilowatt-hours (kWh) measure cumulative energy consumed over time. A 1,000-Watt device running continuously for 1 hour consumes exactly 1 kWh."
                }
            },
            {
                "@type": "Question",
                "name": "What household appliances consume the most electricity?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Central heating and air conditioning units, electric water heaters, electric clothes dryers, and EV chargers account for the largest proportion of residential electricity usage due to high wattage ratings and prolonged runtimes."
                }
            },
            {
                "@type": "Question",
                "name": "What is the average residential electricity cost per kWh?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In the United States, the national average residential electricity rate is approximately $0.16 to $0.17 per kWh, varying by regional utilities and seasonal tier structures."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Data Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Mode Switcher Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Calculation Mode</span>
                        <span className="text-sm font-bold text-slate-800">
                            {calcMode === "single" ? "Single Appliance Deep-Dive" : "Household Multi-Appliance Audit"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => setCalcMode("single")}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${calcMode === "single"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        <Zap className="w-3.5 h-3.5" /> Single Appliance
                    </button>
                    <button
                        onClick={() => setCalcMode("multi")}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${calcMode === "multi"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        <ListFilter className="w-3.5 h-3.5" /> Whole Home Audit ({auditItems.length})
                    </button>
                </div>
            </div>

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Controls & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        {/* Header & Global Settings */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                {calcMode === "single" ? "Appliance & Utility Inputs" : "Audit Items & Tariff"}
                            </h2>
                            {calcMode === "single" && (
                                <button
                                    onClick={handleResetSingle}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            )}
                        </div>

                        {/* Tariff & Currency Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Electricity Rate / kWh
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0.001"
                                        step="0.01"
                                        value={kwhRate === 0 ? "" : kwhRate}
                                        onChange={(e) => handleNumberInput(e, (val) => setKwhRate(Math.max(0.001, val)))}
                                        className="w-full pl-8 pr-16 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">/ kWh</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Currency Symbol
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition bg-slate-50"
                                >
                                    <option value="USD">USD ($ - US Dollar)</option>
                                    <option value="EUR">EUR (€ - Euro)</option>
                                    <option value="GBP">GBP (£ - British Pound)</option>
                                    <option value="CAD">CAD ($ - Canadian Dollar)</option>
                                    <option value="AUD">AUD ($ - Australian Dollar)</option>
                                    <option value="INR">INR (₹ - Indian Rupee)</option>
                                </select>
                            </div>
                        </div>

                        {/* SINGLE APPLIANCE MODE CONTROLS */}
                        {calcMode === "single" ? (
                            <div className="space-y-5">
                                {/* Appliance Label */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                        Appliance Name / Description
                                    </label>
                                    <input
                                        type="text"
                                        value={applianceName}
                                        onChange={(e) => {
                                            setApplianceName(e.target.value);
                                            setActivePresetId(null);
                                        }}
                                        placeholder="e.g., Space Heater, Gaming PC, Water Heater"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>

                                {/* Power Consumption (Watts / kW) */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                            <Zap className="w-4 h-4 text-indigo-600" /> Rated Power Demand
                                        </label>
                                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (powerUnit === "kilowatts") setPowerValue((prev) => prev * 1000);
                                                    setPowerUnit("watts");
                                                }}
                                                className={`px-2.5 py-1 rounded-md transition ${powerUnit === "watts" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                            >
                                                Watts (W)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (powerUnit === "watts") setPowerValue((prev) => prev / 1000);
                                                    setPowerUnit("kilowatts");
                                                }}
                                                className={`px-2.5 py-1 rounded-md transition ${powerUnit === "kilowatts" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                            >
                                                Kilowatts (kW)
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            step={powerUnit === "watts" ? "50" : "0.1"}
                                            value={powerValue === 0 ? "" : powerValue}
                                            onChange={(e) => handleNumberInput(e, (val) => {
                                                setPowerValue(Math.max(0, val));
                                                setActivePresetId(null);
                                            })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">
                                            {powerUnit}
                                        </span>
                                    </div>
                                </div>

                                {/* Usage Duration: Daily & Weekly */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                                                <Clock className="w-4 h-4 text-indigo-600" /> Daily Run Hours
                                            </label>
                                            <span className="text-xs font-bold text-indigo-600">{hoursPerDay} hrs/day</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0.1"
                                            max="24"
                                            step="0.5"
                                            value={hoursPerDay === 0 ? "" : hoursPerDay}
                                            onChange={(e) => handleNumberInput(e, (val) => setHoursPerDay(Math.min(24, Math.max(0.1, val))))}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                                                <Layers className="w-4 h-4 text-indigo-600" /> Days Per Week
                                            </label>
                                            <span className="text-xs font-bold text-indigo-600">{daysPerWeek} days</span>
                                        </div>
                                        <select
                                            value={daysPerWeek}
                                            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition bg-white"
                                        >
                                            <option value={7}>7 Days (Continuous / Daily)</option>
                                            <option value={6}>6 Days a Week</option>
                                            <option value={5}>5 Days (Weekdays Only)</option>
                                            <option value={4}>4 Days a Week</option>
                                            <option value={3}>3 Days a Week</option>
                                            <option value={2}>2 Days (Weekends Only)</option>
                                            <option value={1}>1 Day a Week</option>
                                        </select>
                                    </div>
                                </div>

                                {/* PRESETS SECTION */}
                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Instant Appliance Presets
                                        </span>
                                        {activePresetId && (
                                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                Preset Selected
                                            </span>
                                        )}
                                    </div>

                                    <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                        {APPLIANCE_PRESETS.map((preset) => {
                                            const isActive = activePresetId === preset.id;
                                            return (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => handleSelectPreset(preset)}
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
                                                        {preset.wattage >= 1000 ? `${preset.wattage / 1000} kW` : `${preset.wattage} W`}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* MULTI-APPLIANCE AUDIT MODE CONTROLS */
                            <div className="space-y-5">
                                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">
                                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Plus className="w-4 h-4 text-indigo-600" /> Add Appliance to Audit List
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <input
                                            type="text"
                                            value={newAuditName}
                                            onChange={(e) => setNewAuditName(e.target.value)}
                                            placeholder="Appliance name"
                                            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        />
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                value={newAuditWatts === 0 ? "" : newAuditWatts}
                                                onChange={(e) => handleNumberInput(e, setNewAuditWatts)}
                                                placeholder="Watts"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white pr-8"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">W</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0.1"
                                                max="24"
                                                step="0.5"
                                                value={newAuditHours === 0 ? "" : newAuditHours}
                                                onChange={(e) => handleNumberInput(e, setNewAuditHours)}
                                                placeholder="Hrs/day"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white pr-10"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">hrs</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddAuditItem}
                                        disabled={!newAuditName.trim()}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Include Appliance in Total Audit
                                    </button>
                                </div>

                                {/* Active Items List */}
                                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                    {auditItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition shadow-2xs"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{item.name}</p>
                                                <p className="text-[11px] text-slate-500">
                                                    {item.wattage}W • {item.hoursPerDay} hrs/day • {((item.wattage * item.hoursPerDay * 30.4375) / 1000).toFixed(1)} kWh/mo
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-indigo-600">
                                                    {currencySymbol}{(((item.wattage * item.hoursPerDay * 30.4375) / 1000) * kwhRate).toFixed(2)}/mo
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveAuditItem(item.id)}
                                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Breakdown" : "Copy Cost Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results & Cost Projections */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                {calcMode === "single" ? "Electricity Cost Projections" : "Total Household Audit Yield"}
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveViewTab("metrics")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeViewTab === "metrics" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Cost Matrix
                                </button>
                                <button
                                    onClick={() => setActiveViewTab("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeViewTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Energy (kWh)
                                </button>
                            </div>
                        </div>

                        {/* Top Primary Metric Cards */}
                        {calcMode === "single" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Estimated Monthly Cost</p>
                                    <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                        {currencySymbol}{singleCalculations.monthlyCost.toFixed(2)}
                                    </p>
                                    <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                        Consumes ~{singleCalculations.monthlyKwh.toFixed(1)} kWh per month
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Estimated Annual Cost</p>
                                    <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                        {currencySymbol}{singleCalculations.yearlyCost.toFixed(2)}
                                    </p>
                                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                                        Consumes ~{singleCalculations.yearlyKwh.toFixed(0)} kWh per year
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Monthly Bill Impact</p>
                                    <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                        {currencySymbol}{multiCalculations.totalMonthlyCost.toFixed(2)}
                                    </p>
                                    <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                        Across {auditItems.length} audited appliances
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Annual Electricity</p>
                                    <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                        {currencySymbol}{multiCalculations.totalYearlyCost.toFixed(2)}
                                    </p>
                                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                                        {multiCalculations.totalYearlyKwh.toFixed(0)} kWh cumulative consumption
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* View Tabs Content */}
                        {activeViewTab === "metrics" ? (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Comprehensive Financial Timeframes
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                        <span className="block text-[11px] text-slate-500 font-semibold uppercase">Hourly Cost</span>
                                        <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                                            {currencySymbol}{calcMode === "single" ? singleCalculations.hourlyCost.toFixed(3) : (multiCalculations.totalDailyCost / 24).toFixed(3)}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                        <span className="block text-[11px] text-slate-500 font-semibold uppercase">Daily Cost</span>
                                        <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                                            {currencySymbol}{calcMode === "single" ? singleCalculations.dailyCost.toFixed(2) : multiCalculations.totalDailyCost.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center">
                                        <span className="block text-[11px] text-indigo-700 font-semibold uppercase">Weekly Cost</span>
                                        <span className="text-base font-extrabold text-indigo-700 mt-0.5 block">
                                            {currencySymbol}{calcMode === "single" ? (singleCalculations.dailyCost * 7).toFixed(2) : (multiCalculations.totalDailyCost * 7).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                        <span className="block text-[11px] text-slate-500 font-semibold uppercase">10-Yr Cost</span>
                                        <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                                            {currencySymbol}{calcMode === "single" ? (singleCalculations.yearlyCost * 10).toLocaleString(undefined, { maximumFractionDigits: 0 }) : (multiCalculations.totalYearlyCost * 10).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>

                                {calcMode === "multi" && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                                        <span className="text-xs font-bold text-slate-600 block">Top Cost Contributors</span>
                                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                            {[...multiCalculations.itemsBreakdown]
                                                .sort((a, b) => b.monthlyCost - a.monthlyCost)
                                                .map((item) => {
                                                    const pct = multiCalculations.totalMonthlyCost > 0 ? (item.monthlyCost / multiCalculations.totalMonthlyCost) * 100 : 0;
                                                    return (
                                                        <div key={item.id} className="space-y-1 text-xs">
                                                            <div className="flex justify-between text-slate-700 font-medium">
                                                                <span>{item.name}</span>
                                                                <span>{currencySymbol}{item.monthlyCost.toFixed(2)}/mo ({pct.toFixed(0)}%)</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.max(2, pct)}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Energy Usage (kWh) Tab */
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Cumulative Energy Metrics
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-xs font-bold text-slate-700">Daily Power Ingestion</span>
                                        <span className="text-sm font-extrabold text-slate-900">
                                            {calcMode === "single" ? singleCalculations.dailyKwh.toFixed(3) : multiCalculations.totalDailyKwh.toFixed(3)} kWh / day
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-xs font-bold text-slate-700">Monthly Utility Consumption</span>
                                        <span className="text-sm font-extrabold text-slate-900">
                                            {calcMode === "single" ? singleCalculations.monthlyKwh.toFixed(2) : multiCalculations.totalMonthlyKwh.toFixed(2)} kWh / mo
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                                        <span className="text-xs font-bold text-indigo-900">Annual Grid Footprint</span>
                                        <span className="text-sm font-extrabold text-indigo-700">
                                            {calcMode === "single" ? singleCalculations.yearlyKwh.toFixed(1) : multiCalculations.totalYearlyKwh.toFixed(1)} kWh / yr
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Deterministic browser-side math
                        </span>
                        <span>Zero server transmission</span>
                    </div>
                </div>
            </div>

            {/* Practical Efficiency Tip Banner */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-950 leading-relaxed">
                    <strong>Energy Saving Tip:</strong> Heating and cooling thermal loads consume roughly 45% to 50% of residential energy. Adjusting your programmable thermostat by 1°F to 2°F can decrease your climate control operating expenses by 3% to 5% annually.
                </p>
            </div>

            {/* BELOW-THE-FOLD DETAILED CONTENT & GEO KNOWLEDGE BASE */}
            <div className="space-y-6">

                {/* Card 1: Core Physics & Calculation Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Electricity Running Costs Are Calculated: Formulas & Principles
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Electric utilities bill households for energy consumption based on <strong>kilowatt-hours (kWh)</strong>, which represent the cumulative volume of electrical power used over elapsed time. One kilowatt-hour is equivalent to 1,000 Watts of continuous electrical load maintained for exactly one hour.
                    </p>

                    {/* Mathematical Formula Display */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The 2-Step Appliance Cost Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            To determine the operating cost for any electronic device or household appliance, use the following standardized formulas:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-1">
                            <div>Energy Consumed (kWh) = [ Power Rating (Watts) × Hours of Operation ] / 1,000</div>
                            <div>Total Operating Cost ($) = Energy Consumed (kWh) × Utility Rate ($ / kWh)</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>Power Rating:</strong> Stated wattage nameplate rating.</div>
                            <div><strong>Hours of Operation:</strong> Daily duty cycle duration.</div>
                            <div><strong>Utility Rate:</strong> Electricity tariff per kWh.</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Household Appliance Consumption Benchmark Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Appliance Wattage & Estimated Cost Benchmark Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The matrix below highlights common residential electrical loads based on typical duty cycles evaluated at an average benchmark utility tariff of <strong>$0.16 per kWh</strong>:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Appliance Category</th>
                                    <th className="p-3">Average Wattage</th>
                                    <th className="p-3">Typical Daily Use</th>
                                    <th className="p-3">Monthly Energy</th>
                                    <th className="p-3">Est. Monthly Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Central AC (3-Ton)</td>
                                    <td className="p-3">3,500 Watts</td>
                                    <td className="p-3">8 Hours</td>
                                    <td className="p-3">852 kWh</td>
                                    <td className="p-3 font-bold text-indigo-600">$136.32</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Electric Water Heater</td>
                                    <td className="p-3">4,000 Watts</td>
                                    <td className="p-3">3 Hours</td>
                                    <td className="p-3">365 kWh</td>
                                    <td className="p-3 font-bold text-indigo-600">$58.40</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Electric Clothes Dryer</td>
                                    <td className="p-3">3,000 Watts</td>
                                    <td className="p-3">1 Hour</td>
                                    <td className="p-3">91 kWh</td>
                                    <td className="p-3 font-bold text-indigo-600">$14.56</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Modern Refrigerator</td>
                                    <td className="p-3">150 Watts</td>
                                    <td className="p-3">24 Hours (Duty-cycled)</td>
                                    <td className="p-3">109 kWh</td>
                                    <td className="p-3 font-bold text-indigo-600">$17.44</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Gaming PC & Monitor</td>
                                    <td className="p-3">450 Watts</td>
                                    <td className="p-3">5 Hours</td>
                                    <td className="p-3">68 kWh</td>
                                    <td className="p-3 font-bold text-indigo-600">$10.88</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">LED Lighting (10 Bulbs)</td>
                                    <td className="p-3">90 Watts</td>
                                    <td className="p-3">6 Hours</td>
                                    <td className="p-3">16 kWh</td>
                                    <td className="p-3 font-bold text-indigo-600">$2.56</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Understanding Phantom / Vampire Power Loads */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingDown className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Vampire Power & Standby Energy Loss
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Standby power</strong> (also known as phantom load or vampire draw) refers to the electrical power consumed by electronic devices while they are switched off or in sleep mode. Common culprits include microwave display clocks, smart TVs with instant-on listening modes, desktop computer peripherals, and cable converter boxes.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <span className="text-xs font-bold text-indigo-600 uppercase">Smart TVs & Consoles</span>
                            <p className="text-sm font-semibold text-slate-800">5W to 20W continuous standby</p>
                            <p className="text-xs text-slate-500">Adds $7 to $25 annually per device in unmonitored draw.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <span className="text-xs font-bold text-indigo-600 uppercase">Smart Power Strips</span>
                            <p className="text-sm font-semibold text-slate-800">Cuts load when idle</p>
                            <p className="text-xs text-slate-500">Automatically interrupts current to auxiliary peripherals.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <span className="text-xs font-bold text-indigo-600 uppercase">Total Household Impact</span>
                            <p className="text-sm font-semibold text-slate-800">Up to 10% of total electric bill</p>
                            <p className="text-xs text-slate-500">Averaging $100 to $165 in annual phantom costs per home.</p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                How is electricity cost calculated from appliance wattage?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Electricity cost is calculated by multiplying the appliance power rating (in kilowatts) by the operating hours, and then multiplying by your utility rate per kWh: Cost = (Watts / 1000) × Hours of Use × Rate per kWh.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Watts (W) and Kilowatt-Hours (kWh)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Watts (W) measure instantaneous electrical power demand, whereas Kilowatt-hours (kWh) measure cumulative energy consumed over time. A 1,000-Watt device running continuously for 1 hour consumes exactly 1 kWh.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What household appliances consume the most electricity?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Central heating and air conditioning units, electric water heaters, electric clothes dryers, and EV chargers account for the largest proportion of residential electricity usage due to high wattage ratings and prolonged runtimes.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the average residential electricity cost per kWh?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In the United States, the national average residential electricity rate is approximately $0.16 to $0.17 per kWh, varying by regional utilities and seasonal tier structures.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Disclaimer Section */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Utility Estimation Notice
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: Calculations generated by this tool are estimates based on user-provided parameters, standard nameplate wattages, and nominal tariff rates. Actual utility bills may vary due to tiered rate thresholds, time-of-use (TOU) surcharges, localized fuel adjustments, and ambient operating duty cycles.
                    </p>
                </section>

            </div>
        </div>
    );
}