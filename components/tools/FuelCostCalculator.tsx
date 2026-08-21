"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Fuel,
    DollarSign,
    Car,
    Route,
    Users,
    Receipt,
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
    PieChart,
    Lightbulb,
    AlertTriangle,
    Navigation,
    Coins,
    Sliders,
    Milestone,
    Scale
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "INR";

interface VehiclePreset {
    id: string;
    label: string;
    efficiencyImperial: number; // MPG
    efficiencyMetric: number;   // L/100km
    tag: string;
}

const VEHICLE_PRESETS: VehiclePreset[] = [
    { id: "compact_hybrid", label: "Hybrid / Compact Sedan", efficiencyImperial: 52, efficiencyMetric: 4.5, tag: "52 MPG / 4.5L" },
    { id: "midsize_sedan", label: "Midsize Sedan", efficiencyImperial: 32, efficiencyMetric: 7.3, tag: "32 MPG / 7.3L" },
    { id: "crossover_suv", label: "Compact / Crossover SUV", efficiencyImperial: 26, efficiencyMetric: 9.0, tag: "26 MPG / 9.0L" },
    { id: "large_truck", label: "Full-Size SUV / Truck", efficiencyImperial: 18, efficiencyMetric: 13.0, tag: "18 MPG / 13.0L" },
    { id: "cargo_van", label: "Heavy Duty / Cargo Van", efficiencyImperial: 14, efficiencyMetric: 16.8, tag: "14 MPG / 16.8L" },
];

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
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

export default function FuelCostCalculator() {
    // Unit System & Currency
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [currency, setCurrency] = useState<CurrencyCode>("USD");

    // Trip & Fuel Inputs
    const [distance, setDistance] = useState<number>(350);
    const [fuelEfficiency, setFuelEfficiency] = useState<number>(28); // MPG or L/100km
    const [fuelPrice, setFuelPrice] = useState<number>(3.65); // Price per Gallon or Liter
    const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);

    // Extra Trip Expenses
    const [tollFees, setTollFees] = useState<number>(15);
    const [parkingFees, setParkingFees] = useState<number>(20);
    const [otherExpenses, setOtherExpenses] = useState<number>(0);

    // Group Travel & Business Mileage
    const [passengers, setPassengers] = useState<number>(1);
    const [irsStandardRate, setIrsStandardRate] = useState<number>(0.67); // IRS mileage rate per mile / standard reimbursement

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>("midsize_sedan");
    const [activeTab, setActiveTab] = useState<"breakdown" | "mileage">("breakdown");

    const exportRef = useRef<HTMLDivElement>(null);
    const currSym = CURRENCY_SYMBOLS[currency];

    // Conversion helper when switching units
    const handleUnitChange = (newUnit: UnitSystem) => {
        if (newUnit === unitSystem) return;
        if (newUnit === "metric") {
            // Imperial -> Metric: Miles to KM, MPG to L/100km, Price/gal to Price/liter
            setDistance((prev) => Math.round(prev * 1.60934));
            setFuelEfficiency((prev) => (prev > 0 ? parseFloat((235.215 / prev).toFixed(1)) : 8.4));
            setFuelPrice((prev) => parseFloat((prev / 3.78541).toFixed(2)));
            setIrsStandardRate((prev) => parseFloat((prev / 1.60934).toFixed(3)));
        } else {
            // Metric -> Imperial: KM to Miles, L/100km to MPG, Price/liter to Price/gal
            setDistance((prev) => Math.round(prev / 1.60934));
            setFuelEfficiency((prev) => (prev > 0 ? parseFloat((235.215 / prev).toFixed(1)) : 28));
            setFuelPrice((prev) => parseFloat((prev * 3.78541).toFixed(2)));
            setIrsStandardRate((prev) => parseFloat((prev * 1.60934).toFixed(2)));
        }
        setUnitSystem(newUnit);
        setActivePresetId(null);
    };

    // Calculate core metrics
    const results = useMemo(() => {
        const effectiveDistance = isRoundTrip ? distance * 2 : distance;
        let fuelNeeded = 0;

        if (unitSystem === "imperial") {
            // MPG: Fuel Needed = Distance / MPG
            fuelNeeded = fuelEfficiency > 0 ? effectiveDistance / fuelEfficiency : 0;
        } else {
            // L/100km: Fuel Needed = (Distance / 100) * (L/100km)
            fuelNeeded = (effectiveDistance / 100) * fuelEfficiency;
        }

        const totalFuelCost = fuelNeeded * fuelPrice;
        const totalIncidentalCost = tollFees + parkingFees + otherExpenses;
        const grandTotalTripCost = totalFuelCost + totalIncidentalCost;

        const costPerUnitDistance = effectiveDistance > 0 ? grandTotalTripCost / effectiveDistance : 0;
        const costPerPerson = passengers > 0 ? grandTotalTripCost / passengers : grandTotalTripCost;
        const fuelCostPerPerson = passengers > 0 ? totalFuelCost / passengers : totalFuelCost;

        // Business Mileage Comparison (IRS standard rate / general tax reimbursement allowance)
        const businessReimbursementValue = effectiveDistance * irsStandardRate;
        const netDeductionVariance = businessReimbursementValue - grandTotalTripCost;

        const fuelPercentage = grandTotalTripCost > 0 ? (totalFuelCost / grandTotalTripCost) * 100 : 100;
        const incidentalPercentage = grandTotalTripCost > 0 ? (totalIncidentalCost / grandTotalTripCost) * 100 : 0;

        return {
            effectiveDistance,
            fuelNeeded,
            totalFuelCost,
            totalIncidentalCost,
            grandTotalTripCost,
            costPerUnitDistance,
            costPerPerson,
            fuelCostPerPerson,
            businessReimbursementValue,
            netDeductionVariance,
            fuelPercentage,
            incidentalPercentage,
        };
    }, [
        distance,
        fuelEfficiency,
        fuelPrice,
        isRoundTrip,
        tollFees,
        parkingFees,
        otherExpenses,
        passengers,
        unitSystem,
        irsStandardRate
    ]);

    const applyPreset = (preset: VehiclePreset) => {
        if (unitSystem === "imperial") {
            setFuelEfficiency(preset.efficiencyImperial);
        } else {
            setFuelEfficiency(preset.efficiencyMetric);
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setUnitSystem("imperial");
        setCurrency("USD");
        setDistance(350);
        setFuelEfficiency(28);
        setFuelPrice(3.65);
        setIsRoundTrip(false);
        setTollFees(15);
        setParkingFees(20);
        setOtherExpenses(0);
        setPassengers(1);
        setIrsStandardRate(0.67);
        setActivePresetId("midsize_sedan");
        setActiveTab("breakdown");
    };

    const handleCopySummary = () => {
        const distUnit = unitSystem === "imperial" ? "miles" : "km";
        const volUnit = unitSystem === "imperial" ? "gallons" : "liters";

        const text = `TwisterTools Fuel & Trip Cost Summary:
----------------------------------------
Route: ${results.effectiveDistance.toLocaleString()} ${distUnit} (${isRoundTrip ? "Round Trip" : "One-Way"})
Fuel Efficiency: ${fuelEfficiency} ${unitSystem === "imperial" ? "MPG" : "L/100km"}
Fuel Price: ${currSym}${fuelPrice.toFixed(2)} / ${unitSystem === "imperial" ? "gal" : "L"}
Total Fuel Required: ${results.fuelNeeded.toFixed(2)} ${volUnit}
----------------------------------------
Estimated Fuel Expense: ${currSym}${results.totalFuelCost.toFixed(2)}
Tolls & Incidental Fees: ${currSym}${results.totalIncidentalCost.toFixed(2)}
TOTAL TRIP ESTIMATE: ${currSym}${results.grandTotalTripCost.toFixed(2)}
Cost Per Passenger (${passengers} total): ${currSym}${results.costPerPerson.toFixed(2)}
Cost Per ${unitSystem === "imperial" ? "Mile" : "KM"}: ${currSym}${results.costPerUnitDistance.toFixed(2)}
----------------------------------------
Business Reimbursement @ ${currSym}${irsStandardRate}/${unitSystem === "imperial" ? "mi" : "km"}: ${currSym}${results.businessReimbursementValue.toFixed(2)}
Calculated at twistertools.com/tools/calculators/fuel-cost-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const distUnit = unitSystem === "imperial" ? "Miles" : "KM";
        const volUnit = unitSystem === "imperial" ? "Gallons" : "Liters";

        const headers = ["Metric", "Value", "Unit"];
        const rows = [
            ["Total Trip Distance", results.effectiveDistance, distUnit],
            ["Trip Type", isRoundTrip ? "Round Trip" : "One-Way", ""],
            ["Vehicle Efficiency", fuelEfficiency, unitSystem === "imperial" ? "MPG" : "L/100km"],
            ["Fuel Price", `${currSym}${fuelPrice.toFixed(2)}`, unitSystem === "imperial" ? "per Gallon" : "per Liter"],
            ["Fuel Volume Needed", results.fuelNeeded.toFixed(2), volUnit],
            ["Total Fuel Cost", `${currSym}${results.totalFuelCost.toFixed(2)}`, currency],
            ["Toll Fees", `${currSym}${tollFees.toFixed(2)}`, currency],
            ["Parking Fees", `${currSym}${parkingFees.toFixed(2)}`, currency],
            ["Other Expenses", `${currSym}${otherExpenses.toFixed(2)}`, currency],
            ["Total Incidentals", `${currSym}${results.totalIncidentalCost.toFixed(2)}`, currency],
            ["Grand Total Trip Cost", `${currSym}${results.grandTotalTripCost.toFixed(2)}`, currency],
            ["Passengers Count", passengers, "People"],
            ["Split Cost Per Person", `${currSym}${results.costPerPerson.toFixed(2)}`, currency],
            ["Cost per Unit Distance", `${currSym}${results.costPerUnitDistance.toFixed(2)}`, `per ${distUnit}`],
            ["Tax/Business Mileage Value", `${currSym}${results.businessReimbursementValue.toFixed(2)}`, currency],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `fuel_trip_expense_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Fuel Trip Cost & Mileage Expense Estimator",
        "url": "https://twistertools.com/tools/calculators/fuel-cost-calculator",
        "description": "Accurately compute total driving cost, gas expenses, road trip splits, toll budgets, and standard business mileage reimbursements with live currency and unit conversions.",
        "applicationCategory": "UtilityApplication",
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
                "name": "How is fuel cost calculated for a road trip?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For US Imperial units (MPG), fuel cost is calculated by dividing total distance by vehicle MPG to get gallons required, then multiplying by gas price per gallon. For Metric units (L/100km), divide total distance by 100, multiply by the L/100km rating, and multiply by the fuel price per liter."
                }
            },
            {
                "@type": "Question",
                "name": "How do round trips and multi-passenger splits work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When round trip is selected, distance is automatically doubled. Total expenses—including fuel, highway tolls, and parking—are combined and then evenly divided by the number of passengers in the vehicle to determine individual payment shares."
                }
            },
            {
                "@type": "Question",
                "name": "What is the standard IRS mileage rate and what does it cover?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The IRS standard mileage rate covers fuel plus vehicle depreciation, routine maintenance, insurance, oil changes, and tire wear. Using the standard mileage allowance provides a holistic baseline of actual driving wear and tax-deductible value beyond raw fuel alone."
                }
            },
            {
                "@type": "Question",
                "name": "How do speed and driving habits affect real-world fuel economy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Aerodynamic drag increases exponentially above 50 mph (80 km/h). Aggressive acceleration, heavy air conditioning usage, carrying roof cargo boxes, and driving under-inflated tires can reduce real-world fuel economy by 15% to 30% relative to EPA laboratory ratings."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Route className="w-5 h-5 text-indigo-600" />
                                Route & Vehicle Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Top Dual Selectors: Unit System & Currency */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 min-w-0">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Measurement System
                                </label>
                                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => handleUnitChange("imperial")}
                                        className={`py-1.5 text-xs font-bold rounded-lg transition ${unitSystem === "imperial"
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        US (Miles / Gal)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUnitChange("metric")}
                                        className={`py-1.5 text-xs font-bold rounded-lg transition ${unitSystem === "metric"
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Metric (KM / L)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Currency Symbol
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs transition bg-slate-50"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CAD">CAD ($)</option>
                                    <option value="AUD">AUD ($)</option>
                                    <option value="INR">INR (₹)</option>
                                </select>
                            </div>
                        </div>

                        {/* Core Parameters */}
                        <div className="space-y-4">
                            {/* Trip Distance & Round Trip Toggle */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Navigation className="w-4 h-4 text-indigo-600" /> Trip Distance ({unitSystem === "imperial" ? "Miles" : "Kilometers"})
                                    </label>
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-indigo-600">
                                        <input
                                            type="checkbox"
                                            checked={isRoundTrip}
                                            onChange={(e) => setIsRoundTrip(e.target.checked)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 accent-indigo-600"
                                        />
                                        Round Trip (2x)
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        step="10"
                                        value={distance === 0 ? "" : distance}
                                        onChange={(e) => handleNumberInput(e, (val) => setDistance(Math.max(0, val)))}
                                        className="w-full pl-3 pr-16 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                                        {unitSystem === "imperial" ? "mi" : "km"} {isRoundTrip && "(One Way)"}
                                    </span>
                                </div>
                            </div>

                            {/* Fuel Efficiency & Fuel Price */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Car className="w-4 h-4 text-indigo-600" /> Fuel Economy
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.5"
                                            value={fuelEfficiency === 0 ? "" : fuelEfficiency}
                                            onChange={(e) => {
                                                handleNumberInput(e, (val) => setFuelEfficiency(Math.max(0.1, val)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                                            {unitSystem === "imperial" ? "MPG" : "L/100km"}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Fuel className="w-4 h-4 text-indigo-600" /> Gas / Fuel Price
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currSym}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.05"
                                            value={fuelPrice === 0 ? "" : fuelPrice}
                                            onChange={(e) => handleNumberInput(e, (val) => setFuelPrice(Math.max(0, val)))}
                                            className="w-full pl-7 pr-16 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                                            /{unitSystem === "imperial" ? "gal" : "L"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Expenses Accordion / Block */}
                            <div className="pt-3 border-t border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5 text-indigo-600" /> Tolls & Incidental Expenses
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Highway Tolls</label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currSym}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="5"
                                                value={tollFees === 0 ? "" : tollFees}
                                                onChange={(e) => handleNumberInput(e, (val) => setTollFees(Math.max(0, val)))}
                                                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Parking Fees</label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currSym}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="5"
                                                value={parkingFees === 0 ? "" : parkingFees}
                                                onChange={(e) => handleNumberInput(e, (val) => setParkingFees(Math.max(0, val)))}
                                                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Other Costs</label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currSym}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="5"
                                                value={otherExpenses === 0 ? "" : otherExpenses}
                                                onChange={(e) => handleNumberInput(e, (val) => setOtherExpenses(Math.max(0, val)))}
                                                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Split Passengers & Tax Reimbursement Rate */}
                            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5 text-indigo-600" /> Vehicle Occupants (Split)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={passengers === 0 ? "" : passengers}
                                        onChange={(e) => handleNumberInput(e, (val) => setPassengers(Math.max(1, Math.min(60, val))))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                        <Coins className="w-3.5 h-3.5 text-indigo-600" /> Standard Mileage Rate
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currSym}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={irsStandardRate === 0 ? "" : irsStandardRate}
                                            onChange={(e) => handleNumberInput(e, (val) => setIrsStandardRate(Math.max(0, val)))}
                                            className="w-full pl-6 pr-14 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-semibold">
                                            /{unitSystem === "imperial" ? "mi" : "km"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Quick-Fill Presets */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Vehicle Fuel Economy Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {VEHICLE_PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {unitSystem === "imperial"
                                                    ? `${preset.efficiencyImperial} MPG`
                                                    : `${preset.efficiencyMetric} L/100km`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Report" : "Copy Expense Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Calculations & Expense Analysis */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Trip Cost Breakdown
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Cost Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("mileage")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "mileage" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Tax & Mileage
                                </button>
                            </div>
                        </div>

                        {/* Primary Key Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Trip Budget</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currSym}{results.grandTotalTripCost.toFixed(2)}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    {results.effectiveDistance.toLocaleString()} {unitSystem === "imperial" ? "miles" : "km"} ({isRoundTrip ? "Round Trip" : "One-Way"})
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                    {passengers > 1 ? `Per Person (${passengers} Way Split)` : `Cost Per ${unitSystem === "imperial" ? "Mile" : "KM"}`}
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currSym}{passengers > 1 ? results.costPerPerson.toFixed(2) : results.costPerUnitDistance.toFixed(2)}
                                </p>
                                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                                    {passengers > 1
                                        ? `Fuel: ${currSym}${results.fuelCostPerPerson.toFixed(2)} / person`
                                        : `Fuel: ${currSym}${(results.totalFuelCost / (results.effectiveDistance || 1)).toFixed(2)}/${unitSystem === "imperial" ? "mi" : "km"}`}
                                </p>
                            </div>
                        </div>

                        {/* View Tabs Content */}
                        {activeTab === "breakdown" ? (
                            <div className="space-y-5">
                                {/* Visual Proportion Bar */}
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                                            Fuel: {currSym}{results.totalFuelCost.toFixed(2)} ({results.fuelPercentage.toFixed(0)}%)
                                        </span>
                                        <span className="flex items-center gap-1.5 text-amber-600">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                                            Incidentals: {currSym}{results.totalIncidentalCost.toFixed(2)} ({results.incidentalPercentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-3.5 rounded-full bg-slate-200 overflow-hidden flex">
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-500"
                                            style={{ width: `${results.fuelPercentage}%` }}
                                        />
                                        <div
                                            className="bg-amber-500 h-full transition-all duration-500"
                                            style={{ width: `${results.incidentalPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Detailed Itemized Table */}
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="p-2.5">Expense Item</th>
                                                <th className="p-2.5">Calculation Base</th>
                                                <th className="p-2.5 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                            <tr className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                                                    <Fuel className="w-3.5 h-3.5 text-indigo-600" /> Fuel Consumption
                                                </td>
                                                <td className="p-2.5">
                                                    {results.fuelNeeded.toFixed(1)} {unitSystem === "imperial" ? "gal" : "L"} @ {currSym}{fuelPrice.toFixed(2)}
                                                </td>
                                                <td className="p-2.5 text-right font-bold text-slate-900">
                                                    {currSym}{results.totalFuelCost.toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-semibold text-slate-800">Highway Tolls</td>
                                                <td className="p-2.5">Direct Route Tolls</td>
                                                <td className="p-2.5 text-right font-semibold text-slate-800">
                                                    {currSym}{tollFees.toFixed(2)}
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-semibold text-slate-800">Destination Parking</td>
                                                <td className="p-2.5">Parking Passes / Garages</td>
                                                <td className="p-2.5 text-right font-semibold text-slate-800">
                                                    {currSym}{parkingFees.toFixed(2)}
                                                </td>
                                            </tr>
                                            {otherExpenses > 0 && (
                                                <tr className="hover:bg-slate-50/80 transition">
                                                    <td className="p-2.5 font-semibold text-slate-800">Other Trip Costs</td>
                                                    <td className="p-2.5">Incidentals / Permits</td>
                                                    <td className="p-2.5 text-right font-semibold text-slate-800">
                                                        {currSym}{otherExpenses.toFixed(2)}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="bg-indigo-50/50 font-bold text-slate-900">
                                                <td className="p-2.5 text-indigo-900">Total Out-of-Pocket</td>
                                                <td className="p-2.5 text-slate-600">All Expenses Combined</td>
                                                <td className="p-2.5 text-right text-indigo-600 font-extrabold text-sm">
                                                    {currSym}{results.grandTotalTripCost.toFixed(2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            /* Mileage & Business Reimbursement Tab */
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Standard Mileage Reimbursement Value
                                        </span>
                                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                            {currSym}{irsStandardRate}/{unitSystem === "imperial" ? "mi" : "km"}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-extrabold text-slate-900">
                                        {currSym}{results.businessReimbursementValue.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        The standard allowance factors overall wear-and-tear, depreciation, repairs, and insurance in addition to gas.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 rounded-lg border border-slate-200 bg-white">
                                        <span className="text-slate-500 block mb-1">Direct Out-of-Pocket:</span>
                                        <span className="text-sm font-bold text-slate-900">{currSym}{results.grandTotalTripCost.toFixed(2)}</span>
                                    </div>
                                    <div className="p-3 rounded-lg border border-slate-200 bg-white">
                                        <span className="text-slate-500 block mb-1">Vehicle Wear Allowance:</span>
                                        <span className="text-sm font-bold text-emerald-600">
                                            +{currSym}{Math.max(0, results.netDeductionVariance).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Accurate dual-unit computation
                        </span>
                        <span>Client-side privacy guaranteed</span>
                    </div>
                </div>
            </div>

            {/* Practical Driving Disclaimer */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Notice:</strong> Real-world fuel economy fluctuates based on terrain, traffic congestion, cruising speed, vehicle cargo weight, and climate control usage. This tool provides an estimate for budgeting and expense planning purposes.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Fuel Expense Fundamentals */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Trip Fuel Calculations & Mileage Physics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating exact vehicle travel expenses requires bridging distance, engine thermal efficiency, driving style, and regional fuel price variances. Whether embarking on a cross-country family road trip, managing a commercial delivery route, or calculating billable client travel reimbursements, budgeting for both direct gas consumption and incidental transit costs is essential.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Fuel efficiency is reported in two global standards: <strong>Miles Per Gallon (MPG)</strong> in the United States and the UK, and <strong>Liters per 100 Kilometers (L/100km)</strong> across Europe, Canada, and Australia. In MPG, higher numbers represent greater efficiency; in L/100km, lower numbers indicate a more economical vehicle.
                    </p>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Core Fuel Calculation Formulas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
                                <p className="text-indigo-400 font-bold mb-1">US Imperial Formula (MPG):</p>
                                <p>Fuel Used (gal) = Distance (mi) / MPG</p>
                                <p>Total Cost = (Fuel Used × Price/gal) + Tolls</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono">
                                <p className="text-indigo-400 font-bold mb-1">Metric Formula (L/100km):</p>
                                <p>Fuel Used (L) = (Distance / 100) × (L/100km)</p>
                                <p>Total Cost = (Fuel Used × Price/L) + Tolls</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Step-by-Step Road Trip Example */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Example: 600-Mile Weekend Road Trip for 4 Friends
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To understand how group splits and incidental costs interact, consider a round-trip road trip from Los Angeles to the Grand Canyon involving four passengers sharing a crossover SUV:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Trip Scenario Parameters:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Total Round-Trip Distance:</strong> 600 Miles</li>
                            <li><strong>Vehicle Fuel Economy:</strong> 25 MPG</li>
                            <li><strong>Average Gas Price:</strong> $4.20 per Gallon</li>
                            <li><strong>Tolls & National Park Entry Pass:</strong> $40.00</li>
                            <li><strong>Total Traveling Passengers:</strong> 4 Individuals</li>
                        </ul>
                    </div>

                    {/* Step-by-Step Breakdown Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Calculation Step</th>
                                    <th className="p-3">Mathematical Operation</th>
                                    <th className="p-3">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1. Fuel Consumption</td>
                                    <td className="p-3">600 miles / 25 MPG</td>
                                    <td className="p-3 font-bold text-slate-900">24.0 Gallons</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2. Gross Fuel Expense</td>
                                    <td className="p-3">24.0 Gallons × $4.20 / gal</td>
                                    <td className="p-3 font-bold text-indigo-600">$100.80</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3. Combined Trip Total</td>
                                    <td className="p-3">$100.80 (Fuel) + $40.00 (Passes/Tolls)</td>
                                    <td className="p-3 font-bold text-indigo-600">$140.80</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">4. Equal 4-Way Passenger Split</td>
                                    <td className="p-3 font-bold text-slate-900">$140.80 / 4 Passengers</td>
                                    <td className="p-3 font-extrabold text-emerald-600">$35.20 / Person</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Key Takeaway:</strong> Carpooling significantly lowers transportation expenses. At <strong>$35.20 per person</strong>, driving proves significantly cheaper than individual commercial airline tickets or train passes for medium-range journeys.
                    </p>
                </section>

                {/* Card 3: Vehicle Class Fuel Economy Reference */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Vehicle Class Fuel Economy & Cost Comparison Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Vehicle weight, engine displacement, and aerodynamics determine operational costs. The table below compares the estimated fuel cost for a <strong>1,000-mile trip</strong> across major vehicle classes assuming an average fuel price of <strong>$3.75 per gallon</strong>:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Vehicle Category</th>
                                    <th className="p-3">Avg Fuel Economy</th>
                                    <th className="p-3">Gallons for 1,000 Mi</th>
                                    <th className="p-3">Estimated Fuel Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                    <td className="p-3 font-bold text-emerald-900">Plug-in / Hybrid Sedan</td>
                                    <td className="p-3 font-semibold">50 MPG (4.7 L/100km)</td>
                                    <td className="p-3 font-medium">20.0 Gal</td>
                                    <td className="p-3 font-extrabold text-emerald-700">$75.00</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Compact / Midsize Sedan</td>
                                    <td className="p-3">32 MPG (7.3 L/100km)</td>
                                    <td className="p-3">31.25 Gal</td>
                                    <td className="p-3 font-bold text-slate-900">$117.19</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Compact / Crossover SUV</td>
                                    <td className="p-3">26 MPG (9.0 L/100km)</td>
                                    <td className="p-3">38.46 Gal</td>
                                    <td className="p-3 font-bold text-slate-900">$144.23</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Full-Size SUV / Pickup</td>
                                    <td className="p-3">18 MPG (13.0 L/100km)</td>
                                    <td className="p-3">55.55 Gal</td>
                                    <td className="p-3 font-bold text-slate-900">$208.31</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-rose-50/40">
                                    <td className="p-3 font-bold text-rose-900">Commercial Heavy-Duty Van</td>
                                    <td className="p-3 font-semibold">14 MPG (16.8 L/100km)</td>
                                    <td className="p-3 font-medium">71.43 Gal</td>
                                    <td className="p-3 font-extrabold text-rose-700">$267.86</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Driving an efficient hybrid compared to a full-size pickup saves approximately <strong>$133.31 per 1,000 miles driven</strong>, cutting overall fuel outlay by over 60%.
                    </p>
                </section>

                {/* Card 4: Actionable Fuel Conservation Strategies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Proven Strategies to Maximize Real-World Highway MPG
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Milestone className="w-4 h-4 text-indigo-600" /> Maintain Optimal Cruising Speed
                            </h3>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                                Most internal combustion engines achieve peak fuel efficiency between 45 and 60 mph. Cruising at 75 mph consumes up to 20% more fuel than maintaining 65 mph due to exponential increases in aerodynamic drag.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Coins className="w-4 h-4 text-indigo-600" /> Inspect Tire Pressure (PSI)
                            </h3>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                                Under-inflated tires increase rolling resistance against the asphalt. Maintaining manufacturer-recommended PSI levels on all four tires can boost gas mileage by 0.6% to 3% while extending tire tread life.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Car className="w-4 h-4 text-indigo-600" /> Minimize Roof Cargo & Excess Weight
                            </h3>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                                External cargo boxes and roof bicycle racks disturb vehicle aerodynamics, lowering highway fuel economy by 10% to 25%. Remove unused roof accessories and clear heavy gear from the trunk before departing.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-indigo-600" /> Smooth Throttle Modulation
                            </h3>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                                Rapid acceleration and frequent harsh braking consume excessive fuel. Utilizing cruise control on level highways maintains steady engine RPMs and maximizes fuel efficiency.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions */}
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
                                How is fuel cost calculated for a road trip?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For US Imperial units (MPG), fuel cost is calculated by dividing total distance by vehicle MPG to get gallons required, then multiplying by gas price per gallon. For Metric units (L/100km), divide total distance by 100, multiply by the L/100km rating, and multiply by the fuel price per liter.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do round trips and multi-passenger splits work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When round trip is selected, distance is automatically doubled. Total expenses—including fuel, highway tolls, and parking—are combined and then evenly divided by the number of passengers in the vehicle to determine individual payment shares.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the standard IRS mileage rate and what does it cover?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The IRS standard mileage rate covers fuel plus vehicle depreciation, routine maintenance, insurance, oil changes, and tire wear. Using the standard mileage allowance provides a holistic baseline of actual driving wear and tax-deductible value beyond raw fuel alone.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do speed and driving habits affect real-world fuel economy?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Aerodynamic drag increases exponentially above 50 mph (80 km/h). Aggressive acceleration, heavy air conditioning usage, carrying roof cargo boxes, and driving under-inflated tires can reduce real-world fuel economy by 15% to 30% relative to EPA laboratory ratings.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Educational & Compliance Notice */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Operational & Tax Expense Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: Fuel prices, highway toll rates, and standard mileage deductions are subject to regional variations and governmental rate updates. Always refer to official local revenue bodies (such as the IRS or HMRC) for certified business deduction filings.
                    </p>
                </section>

            </div>
        </div>
    );
}