"use client";

import React, { useState, useMemo } from "react";
import {
    Sun,
    Zap,
    BatteryCharging,
    DollarSign,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    ShieldAlert,
    SlidersHorizontal,
    TrendingUp,
    MapPin,
    Layers,
    Compass,
    Activity,
    Calculator,
    ArrowUpRight
} from "lucide-react";

type SunlightRegion = "us-southwest" | "mediterranean" | "us-sunbelt" | "central-europe" | "us-northeast" | "uk-nordics" | "custom";
type SystemOrientation = "optimal-south" | "east-west" | "flat-roof" | "shaded-suboptimal";

interface RegionPreset {
    id: SunlightRegion;
    name: string;
    description: string;
    peakSunHours: number;
    avgCostPerKwh: number;
}

const REGION_PRESETS: RegionPreset[] = [
    { id: "us-southwest", name: "US Southwest / High Desert", description: "Arizona, Nevada, Southern California, New Mexico", peakSunHours: 6.2, avgCostPerKwh: 0.19 },
    { id: "mediterranean", name: "Mediterranean / Southern Europe", description: "Greece, Southern Spain, Italy, Cyprus", peakSunHours: 5.4, avgCostPerKwh: 0.22 },
    { id: "us-sunbelt", name: "US Sun Belt / Southeast", description: "Florida, Texas, Georgia, Carolinas", peakSunHours: 4.8, avgCostPerKwh: 0.15 },
    { id: "central-europe", name: "Central & Western Europe", description: "Germany, France, Poland, Austria", peakSunHours: 3.5, avgCostPerKwh: 0.38 },
    { id: "us-northeast", name: "US Northeast & Midwest", description: "New York, Massachusetts, Illinois, Ohio", peakSunHours: 3.8, avgCostPerKwh: 0.24 },
    { id: "uk-nordics", name: "UK, Ireland & Nordics", description: "United Kingdom, Scandinavia, Baltics", peakSunHours: 2.9, avgCostPerKwh: 0.34 },
];

const ORIENTATION_FACTORS: Record<SystemOrientation, { label: string; factor: number; tip: string }> = {
    "optimal-south": { label: "South Facing (30°-35° Tilt)", factor: 1.0, tip: "Maximum annual solar photon capture in the Northern Hemisphere" },
    "east-west": { label: "Split East / West Layout", factor: 0.88, tip: "Flattens peak generation curve, providing smooth morning & afternoon power" },
    "flat-roof": { label: "Flat Roof (10° Ballasted Racks)", factor: 0.92, tip: "Low-profile mounting; requires occasional rain-wash clearance" },
    "shaded-suboptimal": { label: "Partial Shade / North Offset", factor: 0.76, tip: "Micro-inverters or DC optimizers strongly advised to prevent string drops" },
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

export default function SolarPanelCalculator() {
    // Primary Input States
    const [panelWattage, setPanelWattage] = useState<number>(420);
    const [panelCount, setPanelCount] = useState<number>(18);
    const [selectedRegion, setSelectedRegion] = useState<SunlightRegion>("mediterranean");
    const [customPeakSunHours, setCustomPeakSunHours] = useState<number>(5.0);
    const [orientation, setOrientation] = useState<SystemOrientation>("optimal-south");

    // Financial & Loss Factor States
    const [electricityRate, setElectricityRate] = useState<number>(0.22);
    const [systemLossPct, setSystemLossPct] = useState<number>(14);
    const [installationCost, setInstallationCost] = useState<number>(11500);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);

    // Copy Notification State
    const [copied, setCopied] = useState<boolean>(false);

    // Synchronize Region Presets
    const effectivePeakSunHours = useMemo(() => {
        if (selectedRegion === "custom") return customPeakSunHours;
        const found = REGION_PRESETS.find((r) => r.id === selectedRegion);
        return found ? found.peakSunHours : 5.0;
    }, [selectedRegion, customPeakSunHours]);

    const handleRegionChange = (reg: SunlightRegion) => {
        setSelectedRegion(reg);
        if (reg !== "custom") {
            const found = REGION_PRESETS.find((r) => r.id === reg);
            if (found) {
                setElectricityRate(found.avgCostPerKwh);
            }
        }
    };

    // Core Solar Mathematical Yield Matrix
    const calculations = useMemo(() => {
        // Nameplate DC System Rating
        const systemCapacityWatts = panelCount * panelWattage;
        const systemCapacityKw = systemCapacityWatts / 1000;

        // Derating Factors: Inverter efficiency, wiring loss, soiling, temp coefficient
        const deratingFactor = (100 - systemLossPct) / 100;
        const orientationMultiplier = ORIENTATION_FACTORS[orientation].factor;

        // Daily Yield Formula: System kW * Peak Sun Hours * Total Derate Multipliers
        const dailyKwh = systemCapacityKw * effectivePeakSunHours * deratingFactor * orientationMultiplier;
        const monthlyKwh = dailyKwh * 30.416; // Average days per month
        const annualKwh = dailyKwh * 365.25;

        // Financial Yields
        const dailySavings = dailyKwh * electricityRate;
        const monthlySavings = monthlyKwh * electricityRate;
        const annualSavings = annualKwh * electricityRate;
        const twentyFiveYearSavings = annualSavings * 25 * 0.92; // Incorporates 0.5%/yr degradation

        // Payback Period (Simple ROI)
        const paybackYears = installationCost > 0 && annualSavings > 0
            ? (installationCost / annualSavings)
            : 0;

        // Environmental Metrics (EPA standard ~0.855 lbs CO2 / kWh -> ~0.388 kg CO2 / kWh)
        const annualCo2SavedKg = annualKwh * 0.388;
        const annualCo2SavedTons = annualCo2SavedKg / 1000;
        const equivalentTreesPlanted = Math.round(annualCo2SavedKg / 21.77); // ~48 lbs CO2 absorbed per mature tree/year

        // Array Footprint (Avg residential panel ~1.95 m² / 21 sq ft)
        const totalAreaSqMeters = panelCount * 1.95;
        const totalAreaSqFt = panelCount * 21;

        return {
            systemCapacityKw,
            dailyKwh,
            monthlyKwh,
            annualKwh,
            dailySavings,
            monthlySavings,
            annualSavings,
            twentyFiveYearSavings,
            paybackYears,
            annualCo2SavedTons,
            equivalentTreesPlanted,
            totalAreaSqMeters,
            totalAreaSqFt,
            deratingFactor: deratingFactor * orientationMultiplier
        };
    }, [panelCount, panelWattage, effectivePeakSunHours, systemLossPct, orientation, electricityRate, installationCost]);

    const handleReset = () => {
        setPanelWattage(420);
        setPanelCount(18);
        setSelectedRegion("mediterranean");
        setCustomPeakSunHours(5.0);
        setOrientation("optimal-south");
        setElectricityRate(0.22);
        setSystemLossPct(14);
        setInstallationCost(11500);
        setIsAdvancedOpen(false);
    };

    const handleCopyResults = () => {
        const text = `Solar Panel Array Yield Estimation:
------------------------------------------------
System Size: ${calculations.systemCapacityKw.toFixed(2)} kW DC (${panelCount}x ${panelWattage}W Panels)
Est. Roof Area Required: ${calculations.totalAreaSqMeters.toFixed(1)} m² (${calculations.totalAreaSqFt.toFixed(0)} sq ft)
Peak Sun Hours: ${effectivePeakSunHours.toFixed(1)} hrs/day (${selectedRegion})
Estimated Daily Yield: ${calculations.dailyKwh.toFixed(2)} kWh / day
Estimated Monthly Yield: ${calculations.monthlyKwh.toFixed(0)} kWh / month
Estimated Annual Yield: ${calculations.annualKwh.toFixed(0)} kWh / year
------------------------------------------------
Financial Projection (@ $${electricityRate.toFixed(2)}/kWh):
Annual Utility Savings: $${calculations.annualSavings.toFixed(2)}
Estimated Payback Period: ${calculations.paybackYears.toFixed(1)} Years
25-Year Cumulative Value: $${calculations.twentyFiveYearSavings.toFixed(0)}
------------------------------------------------
Carbon Offset: ${calculations.annualCo2SavedTons.toFixed(2)} Metric Tons CO2/year (~${calculations.equivalentTreesPlanted} Trees)
Generated via twistertools.com/tools/home-tools/solar-panel-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Solar Panel Array & Daily kWh Yield Estimator",
        "url": "https://twistertools.com/tools/home-tools/solar-panel-calculator",
        "description": "Calculate solar photovoltaic panel output, daily and annual kWh yields, roof surface area requirements, carbon offsets, and estimated utility bill savings.",
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
                "name": "How is daily solar photovoltaic kWh production calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Daily solar yield is computed by multiplying the total DC system nameplate capacity (in kW) by the regional peak sun hours (PSH), then adjusting for real-world derating factors: E_daily = P_dc × PSH × η_derate. Derating accounts for DC-to-AC inverter losses, cable resistance, thermal coefficient drops on hot days, and panel soiling."
                }
            },
            {
                "@type": "Question",
                "name": "What are Peak Sun Hours (PSH) and how do they differ from daylight hours?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Peak sun hours do not represent total daylight duration. One Peak Sun Hour is defined as one hour of raw solar irradiance reaching an intensity of 1,000 Watts per square meter (1 kW/m²). For example, 10 hours of variable morning, noon, and evening daylight typically consolidates to 4.5 to 5.5 Peak Sun Hours."
                }
            },
            {
                "@type": "Question",
                "name": "How much physical roof space does a standard residential solar array require?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modern residential monocrystalline solar modules (400W to 450W) measure approximately 1.72 to 1.95 square meters (18.5 to 21 square feet). A typical 6 kW array consisting of 14 to 15 panels requires approximately 28 to 30 square meters (300 to 325 square feet) of unshaded, contiguous roof surface."
                }
            },
            {
                "@type": "Question",
                "name": "What causes the typical 14% to 18% system derate loss in solar PV systems?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The primary sources of solar energy losses include string inverter conversion inefficiencies (2-4%), high temperature power degradation (5-9% on hot summer days), dust, pollen, and snow soiling (2-5%), DC/AC wiring resistance (1-2%), and manufacturing nameplate tolerance variances (1%)."
                }
            },
            {
                "@type": "Question",
                "name": "How does roof azimuth and tilt angle affect annual electricity output?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In the Northern Hemisphere, true south-facing panels tilted at an angle equal to the local latitude generate maximum annual energy. East- and west-facing arrays produce approximately 10% to 15% less total annual kWh, but distribute peak power generation more evenly into morning and late afternoon demand peaks."
                }
            },
            {
                "@type": "Question",
                "name": "How long does it take for a residential solar array to achieve full ROI payback?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Depending on local utility kilowatt-hour rates, available net-metering structures, and federal or municipal tax credits, average residential solar systems achieve full capital payback within 5 to 9 years. High-efficiency monocrystalline panels carry manufacturer performance warranties of 25 to 30 years."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Array Configuration & Geo-Sunlight Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sun className="w-5 h-5 text-indigo-600" />
                                Solar Array Configuration
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Panel Specification Matrix (Rating & Count) */}
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-indigo-600" />
                                        Single Panel Wattage Rating
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={200}
                                            max={700}
                                            step={5}
                                            value={panelWattage === 0 ? "" : panelWattage}
                                            onChange={(e) => handleNumberInput(e, setPanelWattage)}
                                            className="w-20 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-sm font-bold text-slate-600">W</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={300}
                                    max={600}
                                    step={5}
                                    value={panelWattage}
                                    onChange={(e) => setPanelWattage(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                    <span>330W (Standard)</span>
                                    <span>420W (High-Yield Mono)</span>
                                    <span>550W+ (Commercial Bifacial)</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Zap className="w-4 h-4 text-indigo-600" />
                                        Total Number of Panels
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={1}
                                            max={200}
                                            value={panelCount === 0 ? "" : panelCount}
                                            onChange={(e) => handleNumberInput(e, setPanelCount)}
                                            className="w-20 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-sm font-bold text-slate-600">units</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={4}
                                    max={60}
                                    step={1}
                                    value={panelCount}
                                    onChange={(e) => setPanelCount(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                    <span>6 Panels (~2.5 kW)</span>
                                    <span>18 Panels (~7.5 kW)</span>
                                    <span>36 Panels (~15 kW)</span>
                                </div>
                            </div>
                        </div>

                        {/* Geographic Sunlight & Climate Presets */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-indigo-600" />
                                Regional Solar Irradiance Zone
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {REGION_PRESETS.map((reg) => (
                                    <button
                                        key={reg.id}
                                        type="button"
                                        onClick={() => handleRegionChange(reg.id)}
                                        className={`p-2.5 text-left rounded-xl border transition text-xs cursor-pointer ${selectedRegion === reg.id
                                            ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500"
                                            : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/80"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900">{reg.name}</span>
                                            <span className="font-mono text-indigo-700 font-bold">{reg.peakSunHours} PSH</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{reg.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Roof Pitch & Azimuth Orientation */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-indigo-600" />
                                Roof Orientation & Shading Factor
                            </label>
                            <select
                                value={orientation}
                                onChange={(e) => setOrientation(e.target.value as SystemOrientation)}
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {Object.entries(ORIENTATION_FACTORS).map(([key, item]) => (
                                    <option key={key} value={key}>
                                        {item.label} (Efficiency: {(item.factor * 100).toFixed(0)}%)
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] text-slate-500 italic">
                                {ORIENTATION_FACTORS[orientation].tip}
                            </p>
                        </div>

                        {/* Advanced Financial & Derating Toggle */}
                        <div className="pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    {isAdvancedOpen ? "Financial & System Derate Modifiers (Active)" : "Customize Electricity Cost & System Losses"}
                                </span>
                                <span>{isAdvancedOpen ? "Hide" : "Show"}</span>
                            </button>

                            {isAdvancedOpen && (
                                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Electricity Rate ($/€ per kWh)</label>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min={0.01}
                                                    max={1.5}
                                                    step={0.01}
                                                    value={electricityRate === 0 ? "" : electricityRate}
                                                    onChange={(e) => handleNumberInput(e, setElectricityRate)}
                                                    className="w-full px-2 py-1 font-bold text-slate-800 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Estimated Turnkey Cost ($/€)</label>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min={500}
                                                    max={150000}
                                                    step={250}
                                                    value={installationCost === 0 ? "" : installationCost}
                                                    onChange={(e) => handleNumberInput(e, setInstallationCost)}
                                                    className="w-full px-2 py-1 font-bold text-slate-800 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-700">System Inefficiency / Loss Derate:</span>
                                            <span className="font-mono font-bold text-indigo-600">{systemLossPct}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={5}
                                            max={30}
                                            step={1}
                                            value={systemLossPct}
                                            onChange={(e) => setSystemLossPct(Number(e.target.value))}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Includes inverter efficiency, thermal coefficient, dust, cabling drop, and mismatch.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            DC Rating: {calculations.systemCapacityKw.toFixed(2)} kWp • Area: ~{calculations.totalAreaSqMeters.toFixed(1)} m²
                        </span>
                        <span>Standard Test Conditions (STC)</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Generation Yields & ROI Analysis */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Energy Yield Projections
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                                Active Model
                            </span>
                        </div>

                        {/* Highlight Hero Output Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Daily Yield Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Sun className="w-4 h-4 text-indigo-600" /> Daily Yield
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        {effectivePeakSunHours} PSH
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculations.dailyKwh.toFixed(1)}
                                    <span className="text-lg font-bold text-slate-600 ml-1">kWh/day</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Daily value: ~${calculations.dailySavings.toFixed(2)}
                                </p>
                            </div>

                            {/* Annual Production Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <BatteryCharging className="w-4 h-4 text-indigo-600" /> Annual Output
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        365 Days
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculations.annualKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    <span className="text-lg font-bold text-slate-600 ml-1">kWh/yr</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Monthly average: ~{calculations.monthlyKwh.toFixed(0)} kWh
                                </p>
                            </div>
                        </div>

                        {/* Financial ROI and Cost Offset Banner */}
                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <p className="font-bold text-emerald-900 uppercase tracking-wider">
                                    Estimated Annual Savings: ${calculations.annualSavings.toLocaleString(undefined, { maximumFractionDigits: 2 })} / year
                                </p>
                                <p className="text-emerald-800 leading-relaxed">
                                    Based on utility rates of ${electricityRate.toFixed(2)}/kWh, this array offsets grid purchases by approximately ${calculations.monthlySavings.toFixed(0)}/month. Estimated payback period is <strong>{calculations.paybackYears.toFixed(1)} years</strong>.
                                </p>
                            </div>
                        </div>

                        {/* Analytical Physical & Carbon Matrix */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Array Footprint</span>
                                <span className="text-base sm:text-lg font-black text-indigo-600">{calculations.totalAreaSqMeters.toFixed(0)} m²</span>
                                <span className="text-[10px] text-slate-400 block font-medium">({calculations.totalAreaSqFt.toFixed(0)} sq ft)</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Carbon Offset</span>
                                <span className="text-base sm:text-lg font-black text-emerald-600">{calculations.annualCo2SavedTons.toFixed(1)} t/yr</span>
                                <span className="text-[10px] text-slate-400 block font-medium">CO2 Avoided</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">25-Yr Value</span>
                                <span className="text-base sm:text-lg font-black text-slate-900">${(calculations.twentyFiveYearSavings / 1000).toFixed(1)}k</span>
                                <span className="text-[10px] text-slate-400 block font-medium">Net Lifetime Yield</span>
                            </div>
                        </div>

                        {/* Engineering PV Pro Directives */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Photovoltaic Performance Directives
                            </div>
                            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                                <li><strong>Temperature Coefficient:</strong> High roof heat (above 25°C cell temp) reduces panel efficiency by ~0.35%/°C.</li>
                                <li><strong>Microinverters vs String:</strong> Microinverters mitigate single-panel partial shading dropouts across complex roof profiles.</li>
                                <li><strong>Net Metering (NEM 3.0 / Export):</strong> Pairing with a 10–15 kWh battery captures excess mid-day generation for night use.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyResults}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Solar Yield Summary Copied!" : "Copy Solar Estimate Summary"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Regional Solar Irradiance & Yield Benchmarks */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sun className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Global Solar Irradiance & Annual Production Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Solar panel output is directly governed by geographic solar irradiance (measured in Peak Sun Hours per day) and local ambient temperature profiles. The table below outlines standard production metrics for a benchmark residential 6.0 kW DC array (15 modules × 400W) across global climates:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Geographic Region</th>
                                    <th className="p-3">Avg Peak Sun Hours</th>
                                    <th className="p-3">Daily Yield (6 kW System)</th>
                                    <th className="p-3">Annual Generation</th>
                                    <th className="p-3">Optimal Array Tilt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">US Southwest (Phoenix, Las Vegas)</td>
                                    <td className="p-3 font-mono text-indigo-600">6.0 – 6.5 PSH</td>
                                    <td className="p-3 font-bold text-emerald-700">31.0 – 33.5 kWh</td>
                                    <td className="p-3 font-mono">11,300 – 12,200 kWh</td>
                                    <td className="p-3 text-xs">28° – 32° South</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Mediterranean Basin (Athens, Seville, Rome)</td>
                                    <td className="p-3 font-mono text-indigo-600">5.2 – 5.6 PSH</td>
                                    <td className="p-3 font-bold text-emerald-700">26.8 – 28.8 kWh</td>
                                    <td className="p-3 font-mono">9,800 – 10,500 kWh</td>
                                    <td className="p-3 text-xs">30° – 35° South</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">US Sun Belt (Florida, Texas, Georgia)</td>
                                    <td className="p-3 font-mono text-indigo-600">4.6 – 5.0 PSH</td>
                                    <td className="p-3 font-bold text-emerald-700">23.7 – 25.8 kWh</td>
                                    <td className="p-3 font-mono">8,650 – 9,400 kWh</td>
                                    <td className="p-3 text-xs">25° – 30° South</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">US Northeast & Midwest (New York, Chicago)</td>
                                    <td className="p-3 font-mono text-indigo-600">3.6 – 4.0 PSH</td>
                                    <td className="p-3 font-bold text-emerald-700">18.5 – 20.6 kWh</td>
                                    <td className="p-3 font-mono">6,750 – 7,500 kWh</td>
                                    <td className="p-3 text-xs">35° – 40° South</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Central Europe (Munich, Paris, Warsaw)</td>
                                    <td className="p-3 font-mono text-indigo-600">3.3 – 3.7 PSH</td>
                                    <td className="p-3 font-bold text-emerald-700">17.0 – 19.1 kWh</td>
                                    <td className="p-3 font-mono">6,200 – 6,950 kWh</td>
                                    <td className="p-3 text-xs">32° – 38° South</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">UK, Ireland & Scandinavia</td>
                                    <td className="p-3 font-mono text-indigo-600">2.7 – 3.1 PSH</td>
                                    <td className="p-3 font-bold text-emerald-700">13.9 – 16.0 kWh</td>
                                    <td className="p-3 font-mono">5,050 – 5,850 kWh</td>
                                    <td className="p-3 text-xs">35° – 45° South</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Photovoltaic Physics & Engineering Equations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Solar Engineering Mechanics & Derating Mathematics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating realistic solar energy generation requires moving beyond theoretical nameplate lab ratings (Standard Test Conditions: 1,000 W/m², 25°C cell temperature, AM 1.5 spectrum) by applying empirical loss coefficients:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> {"Thermal Voltage Drop ($\\gamma_{P_{mp}}$)"}
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Silicon solar cells exhibit a negative temperature coefficient (typically -0.30% to -0.38% per °C above 25°C). In peak summer conditions with dark roof shingles reaching 65°C, real panel output decreases by 12% to 15% due to reduced semiconductor bandgap voltage.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> {"Inverter Conversion & Clipping ($\\eta_{inv}$)"}
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Modern string inverters and microinverters achieve 96.5% to 98.0% peak CEC efficiency. Choosing a DC-to-AC Inverter Loading Ratio (ILR) of 1.20 to 1.30 optimizes economic inverter utilization while causing minor midday energy clipping on the sunniest summer days.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The Standard Solar PV Yield Equation
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            The definitive industry formula used to model net AC energy generation injected into building subpanels:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Daily Yield Formula:</span>
                                <strong className="text-indigo-300 text-sm">{"$$E_{\\text{daily}} = P_{\\text{DC}} \\times \\text{PSH} \\times \\prod \\eta_{\\text{derate}}$$"}</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Total System Derate:</span>
                                <strong className="text-indigo-300 text-sm">{"$$\\prod \\eta = \\eta_{\\text{inv}} \\times \\eta_{\\text{therm}} \\times \\eta_{\\text{soil}} \\times \\eta_{\\text{wire}}$$"}</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 3: Roof Geometry, Shading & Technology Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Inverter Topologies: String vs Microinverters vs Optimizers
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct balance-of-system (BOS) electrical architecture determines how resilient your array is to localized tree shade, chimney obstructions, and variable roof pitches:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">System Architecture</th>
                                    <th className="p-3">Shade Tolerance</th>
                                    <th className="p-3">Module-Level Monitoring</th>
                                    <th className="p-3">Initial Cost</th>
                                    <th className="p-3">Best Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Central String Inverter</td>
                                    <td className="p-3 text-rose-600 font-semibold">Poor (Worst panel bottlenecks string)</td>
                                    <td className="p-3 text-slate-500">Array Level Only</td>
                                    <td className="p-3 font-bold text-emerald-600">Lowest</td>
                                    <td className="p-3 text-xs">Unshaded single-plane south roofs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">String + DC Power Optimizers</td>
                                    <td className="p-3 text-emerald-600 font-semibold">High (MPPT per panel)</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Yes (Individual)</td>
                                    <td className="p-3 font-bold text-indigo-600">Moderate</td>
                                    <td className="p-3 text-xs">Complex roof planes & partial tree shading</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Microinverters (Enphase, etc.)</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Maximum (Independent AC unit)</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Yes (Individual)</td>
                                    <td className="p-3 font-bold text-slate-900">Highest</td>
                                    <td className="p-3 text-xs">Multi-pitch roofs, strict rapid shutdown compliance</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Sizing Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Residential Sizing Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review how specific household electrical demand curves translate into physical panel requirements and annual cost offsets:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Suburban All-Electric Home (with EV & Heat Pump)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">High Demand</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Annual Household Target:</strong> 11,500 kWh/year (approx 950 kWh/mo).</li>
                                <li><strong>Array Specifications:</strong> 24 panels × 415W = <strong>9.96 kW DC System</strong>.</li>
                                <li><strong>Location & Irradiance:</strong> Orlando, FL (4.8 Peak Sun Hours/day).</li>
                                <li><strong>Estimated Annual Generation:</strong> ~14,500 kWh AC (100% solar offset).</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Financial Result: ~$2,175/year electric utility bill offset.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Urban Townhouse / Small Roof Footprint</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Compact Array</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Annual Household Target:</strong> 4,800 kWh/year (approx 400 kWh/mo).</li>
                                <li><strong>Array Specifications:</strong> 10 panels × 430W = <strong>4.30 kW DC System</strong>.</li>
                                <li><strong>Location & Irradiance:</strong> Marseille, France (5.3 Peak Sun Hours/day).</li>
                                <li><strong>Estimated Annual Generation:</strong> ~6,950 kWh AC (100% net-zero offset).</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Financial Result: ~$1,530/year offset with a 5.8-year ROI payback.
                                </li>
                            </ul>
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
                                How is daily solar photovoltaic kWh production calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Daily solar yield is computed by multiplying the total DC system nameplate capacity (in kW) by the regional peak sun hours (PSH), then adjusting for real-world derating factors: $E_{\\text{daily}} = P_{\\text{dc}} \\times \\text{PSH} \\times \\eta_{\\text{derate}}$. Derating accounts for DC-to-AC inverter losses, cable resistance, thermal coefficient drops on hot days, and panel soiling."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are Peak Sun Hours (PSH) and how do they differ from daylight hours?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Peak sun hours do not represent total daylight duration. One Peak Sun Hour is defined as one hour of raw solar irradiance reaching an intensity of 1,000 Watts per square meter (1 kW/m²). For example, 10 hours of variable morning, noon, and evening daylight typically consolidates to 4.5 to 5.5 Peak Sun Hours.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much physical roof space does a standard residential solar array require?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Modern residential monocrystalline solar modules (400W to 450W) measure approximately 1.72 to 1.95 square meters (18.5 to 21 square feet). A typical 6 kW array consisting of 14 to 15 panels requires approximately 28 to 30 square meters (300 to 325 square feet) of unshaded, contiguous roof surface.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What causes the typical 14% to 18% system derate loss in solar PV systems?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The primary sources of solar energy losses include string inverter conversion inefficiencies (2-4%), high temperature power degradation (5-9% on hot summer days), dust, pollen, and snow soiling (2-5%), DC/AC wiring resistance (1-2%), and manufacturing nameplate tolerance variances (1%).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does roof azimuth and tilt angle affect annual electricity output?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In the Northern Hemisphere, true south-facing panels tilted at an angle equal to the local latitude generate maximum annual energy. East- and west-facing arrays produce approximately 10% to 15% less total annual kWh, but distribute peak power generation more evenly into morning and late afternoon demand peaks.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How long does it take for a residential solar array to achieve full ROI payback?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Depending on local utility kilowatt-hour rates, available net-metering structures, and federal or municipal tax credits, average residential solar systems achieve full capital payback within 5 to 9 years. High-efficiency monocrystalline panels carry manufacturer performance warranties of 25 to 30 years.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}