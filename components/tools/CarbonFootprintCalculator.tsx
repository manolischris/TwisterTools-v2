"use client";

import React, { useState, useMemo } from "react";
import {
    Plane,
    Car,
    Train,
    Bus,
    MapPin,
    RotateCcw,
    Copy,
    Check,
    CloudRain,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Gauge,
    Globe2,
    TreePine,
    Zap,
    Scale
} from "lucide-react";

type DistanceUnit = "mi" | "km";
type FlightClass = "economy" | "premium" | "business" | "first";
type CommuteMode = "petrol-car" | "diesel-car" | "hybrid-car" | "electric-car" | "motorcycle" | "bus" | "train" | "walking-cycling";

interface EmissionFactor {
    mode: CommuteMode;
    label: string;
    kgCo2ePerKm: number;
    icon: React.ComponentType<{ className?: string }>;
}

const COMMUTE_FACTORS: Record<CommuteMode, EmissionFactor> = {
    "petrol-car": { mode: "petrol-car", label: "Petrol Car (Average)", kgCo2ePerKm: 0.192, icon: Car },
    "diesel-car": { mode: "diesel-car", label: "Diesel Car (Average)", kgCo2ePerKm: 0.171, icon: Car },
    "hybrid-car": { mode: "hybrid-car", label: "Hybrid Car", kgCo2ePerKm: 0.115, icon: Car },
    "electric-car": { mode: "electric-car", label: "Electric Car (Grid Avg)", kgCo2ePerKm: 0.053, icon: Car },
    "motorcycle": { mode: "motorcycle", label: "Motorcycle / Scooter", kgCo2ePerKm: 0.103, icon: Car },
    "bus": { mode: "bus", label: "Public Bus (Local/Coach)", kgCo2ePerKm: 0.089, icon: Bus },
    "train": { mode: "train", label: "Commuter / Intercity Train", kgCo2ePerKm: 0.037, icon: Train },
    "walking-cycling": { mode: "walking-cycling", label: "Walking or Cycling", kgCo2ePerKm: 0.0, icon: TreePine },
};

// Flight emission multipliers (DEFRA / ICAO based per passenger-kilometer including radiative forcing index ~1.9 for flights)
const FLIGHT_CLASS_MULTIPLIERS: Record<FlightClass, { label: string; multiplier: number; desc: string }> = {
    economy: { label: "Economy Class", multiplier: 1.0, desc: "Standard density seating" },
    premium: { label: "Premium Economy", multiplier: 1.5, desc: "Extra legroom & wider pitch" },
    business: { label: "Business Class", multiplier: 2.9, desc: "Lie-flat pods & higher footprint" },
    first: { label: "First Class", multiplier: 4.0, desc: "Private suites & maximum space allocation" },
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

export default function CarbonFootprintCalculator() {
    // Mode tab: 'flight' or 'commute'
    const [activeTab, setActiveTab] = useState<"flight" | "commute">("flight");

    // Distance unit
    const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("mi");

    // Flight specific state
    const [flightDistance, setFlightDistance] = useState<number>(2500); // e.g. NY to LA approx 2450 mi
    const [flightClass, setFlightClass] = useState<FlightClass>("economy");
    const [isRoundTrip, setIsRoundTrip] = useState<boolean>(true);
    const [passengerCount, setPassengerCount] = useState<number>(1);

    // Commute specific state
    const [commuteDistanceOneWay, setCommuteDistanceOneWay] = useState<number>(15); // miles or km one way
    const [commuteMode, setCommuteMode] = useState<CommuteMode>("petrol-car");
    const [commuteDaysPerWeek, setCommuteDaysPerWeek] = useState<number>(5);
    const [weeksPerYear, setWeeksPerYear] = useState<number>(48);

    // Copy Notification State
    const [copied, setCopied] = useState<boolean>(false);

    // Calculations
    const results = useMemo(() => {
        // Convert distance to kilometers for standard metric emissions calculation
        const toKm = (val: number) => (distanceUnit === "mi" ? val * 1.60934 : val);

        // --- FLIGHT CALCULATIONS ---
        const singleFlightKm = toKm(flightDistance);
        const totalFlightKm = singleFlightKm * (isRoundTrip ? 2 : 1) * passengerCount;

        // Base EF for flights: Short-haul vs Long-haul approximation. 
        // DEFRA average passenger km for long haul ~0.15 kg CO2e/km (economy), short haul ~0.25 kg CO2e/km.
        // Let's use an adaptive baseline: < 1500 km is short haul (0.24), >= 1500 km is long haul (0.15), multiplied by radiative forcing & class.
        const isShortHaul = singleFlightKm < 1500;
        const baseKgPerKm = isShortHaul ? 0.245 : 0.152;
        const classMultiplier = FLIGHT_CLASS_MULTIPLIERS[flightClass].multiplier;

        // Radiative Forcing Index (RFI) factor of 1.9 is standardly embedded in IPCC/DEFRA air travel metrics for high-altitude greenhouse gas emissions.
        const totalFlightCo2Kg = totalFlightKm * baseKgPerKm * classMultiplier * 1.9;
        const totalFlightCo2Tonnes = totalFlightCo2Kg / 1000;

        // --- COMMUTE CALCULATIONS ---
        const oneWayKm = toKm(commuteDistanceOneWay);
        const annualCommuteKm = oneWayKm * 2 * commuteDaysPerWeek * weeksPerYear;
        const commuteFactor = COMMUTE_FACTORS[commuteMode].kgCo2ePerKm;
        const totalCommuteCo2Kg = annualCommuteKm * commuteFactor;
        const totalCommuteCo2Tonnes = totalCommuteCo2Kg / 1000;

        // Combined total for unified view
        const combinedCo2Tonnes = totalFlightCo2Tonnes + totalCommuteCo2Tonnes;

        // Offsetting equivalents
        // Mature tree absorbs ~21 kg CO2 per year
        const treesNeeded = Math.ceil((totalFlightCo2Kg + totalCommuteCo2Kg) / 21);
        // Average smartphone charge ~0.008 kg CO2
        const smartphoneCharges = Math.round((totalFlightCo2Kg + totalCommuteCo2Kg) / 0.008);
        // Equivalent driving miles in average car (0.192 kg/km)
        const equivalentCarKm = Math.round((totalFlightCo2Kg + totalCommuteCo2Kg) / 0.192);

        return {
            totalFlightKm: Math.round(totalFlightKm),
            totalFlightCo2Kg: Math.round(totalFlightCo2Kg),
            totalFlightCo2Tonnes: Number(totalFlightCo2Tonnes.toFixed(2)),
            annualCommuteKm: Math.round(annualCommuteKm),
            totalCommuteCo2Kg: Math.round(totalCommuteCo2Kg),
            totalCommuteCo2Tonnes: Number(totalCommuteCo2Tonnes.toFixed(2)),
            combinedCo2Tonnes: Number(combinedCo2Tonnes.toFixed(2)),
            treesNeeded,
            smartphoneCharges,
            equivalentCarKm,
        };
    }, [
        distanceUnit,
        flightDistance,
        flightClass,
        isRoundTrip,
        passengerCount,
        commuteDistanceOneWay,
        commuteMode,
        commuteDaysPerWeek,
        weeksPerYear,
    ]);

    const handleReset = () => {
        setDistanceUnit("mi");
        setFlightDistance(2500);
        setFlightClass("economy");
        setIsRoundTrip(true);
        setPassengerCount(1);
        setCommuteDistanceOneWay(15);
        setCommuteMode("petrol-car");
        setCommuteDaysPerWeek(5);
        setWeeksPerYear(48);
    };

    const handleCopyResults = () => {
        const text = `Carbon Footprint Estimation Summary:
----------------------------------------
Calculation Mode: ${activeTab === "flight" ? "Flight Travel" : "Daily Commute"}
Distance Unit: ${distanceUnit === "mi" ? "Miles" : "Kilometers"}
${activeTab === "flight" ? `Flight Route Distance: ${flightDistance} ${distanceUnit} (${isRoundTrip ? "Round Trip" : "One-Way"}, ${passengerCount} Passenger(s), ${FLIGHT_CLASS_MULTIPLIERS[flightClass].label})` : `Commute Distance: ${commuteDistanceOneWay} ${distanceUnit} one-way via ${COMMUTE_FACTORS[commuteMode].label} (${commuteDaysPerWeek} days/wk)`}
----------------------------------------
Total Estimated CO2e: ${activeTab === "flight" ? `${results.totalFlightCo2Tonnes} tonnes (${results.totalFlightCo2Kg} kg)` : `${results.totalCommuteCo2Tonnes} tonnes (${results.totalCommuteCo2Kg} kg)`}
Carbon Offset Equivalent: ~${results.treesNeeded} tree seedlings grown for 10 years
Calculated via twistertools.com/tools/home-tools/carbon-footprint-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Carbon Footprint Flight & Commute Emissions Estimator",
        "url": "https://twistertools.com/tools/home-tools/carbon-footprint-calculator",
        "description": "Calculate greenhouse gas emissions for airline flights and daily vehicle or public transit commutes with rigorous DEFRA and IPCC scientific factors.",
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
                "name": "How is aviation carbon footprint calculated, and what is Radiative Forcing?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Aviation emissions calculation goes beyond simple fuel burn. High-altitude emissions of water vapor, nitrogen oxides (NOx), and sulfur particles at cruise altitude trigger chemical reactions that form cirrus clouds, trapping additional atmospheric heat. The IPCC and DEFRA apply a Radiative Forcing Index (RFI) multiplier of approximately 1.9 to account for this total warming impact."
                }
            },
            {
                "@type": "Question",
                "name": "Why do Business and First Class seats have a significantly higher carbon footprint?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Premium cabins occupy considerably more physical space per passenger inside the aircraft fuselage. Because fewer lie-flat suites or large seats fit into the same cabin volume compared to high-density economy seating, a larger share of the aircraft's total fuel burn is allocated to each premium passenger."
                }
            },
            {
                "@type": "Question",
                "name": "What is CO2e (Carbon Dioxide Equivalent)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CO2e is a standard unit for measuring carbon footprints that bundles all major greenhouse gases—including methane (CH4) and nitrous oxide (N2O)—and expresses their global warming potential (GWP) relative to carbon dioxide over a 100-year timescale."
                }
            },
            {
                "@type": "Question",
                "name": "How accurate are commute emission estimates between petrol and electric vehicles?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Estimates use average tailpipe and well-to-wheel emission factors. While electric cars produce zero direct tailpipe emissions, their lifecycle footprint depends on the local power grid's energy mix (coal vs. renewables). Average grid emission factors account for this generation footprint."
                }
            },
            {
                "@type": "Question",
                "name": "How many trees does it take to offset one metric tonne of CO2?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "On average, a mature tree absorbs roughly 21 kilograms (46 lbs) of carbon dioxide per year. Therefore, absorbing one metric tonne (1,000 kg) of CO2 requires approximately 48 to 50 tree seedlings growing vigorously for a full year."
                }
            },
            {
                "@type": "Question",
                "name": "What are the most effective ways to reduce personal travel emissions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Key reduction strategies include replacing short-haul flights under 500 miles with high-speed rail, consolidating business trips, choosing economy class seating, transitioning to electric or hybrid commuter vehicles, carpooling, and adopting remote work days."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Mode Switcher Header Tabs */}
            <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-md mx-auto shadow-inner">
                <button
                    type="button"
                    onClick={() => setActiveTab("flight")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${activeTab === "flight" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <Plane className="w-4 h-4" />
                    Flight Emissions
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("commute")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${activeTab === "commute" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <Car className="w-4 h-4" />
                    Commute Emissions
                </button>
            </div>

            {/* 50/50 Workspace Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                {activeTab === "flight" ? (
                                    <>
                                        <Plane className="w-5 h-5 text-indigo-600" />
                                        Flight Itinerary Parameters
                                    </>
                                ) : (
                                    <>
                                        <Car className="w-5 h-5 text-indigo-600" />
                                        Daily Commute Parameters
                                    </>
                                )}
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Distance Unit Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Measurement Unit
                            </label>
                            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setDistanceUnit("mi")}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${distanceUnit === "mi" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Miles (mi)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDistanceUnit("km")}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${distanceUnit === "km" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Kilometers (km)
                                </button>
                            </div>
                        </div>

                        {activeTab === "flight" ? (
                            /* FLIGHT INPUTS */
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-indigo-600" />
                                            Flight Distance ({distanceUnit})
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={50}
                                                max={15000}
                                                value={flightDistance === 0 ? "" : flightDistance}
                                                onChange={(e) => handleNumberInput(e, setFlightDistance)}
                                                className="w-24 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-sm font-bold text-slate-600">{distanceUnit}</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={100}
                                        max={8000}
                                        step={50}
                                        value={flightDistance}
                                        onChange={(e) => setFlightDistance(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                        <span>500 {distanceUnit} (Short)</span>
                                        <span>3,500 {distanceUnit} (Transatlantic)</span>
                                        <span>8,000 {distanceUnit} (Intercontinental)</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Trip Type
                                        </label>
                                        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setIsRoundTrip(true)}
                                                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${isRoundTrip ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                                    }`}
                                            >
                                                Round Trip
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsRoundTrip(false)}
                                                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${!isRoundTrip ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                                    }`}
                                            >
                                                One-Way
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Passengers
                                        </label>
                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                                            <input
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={passengerCount === 0 ? "" : passengerCount}
                                                onChange={(e) => handleNumberInput(e, setPassengerCount)}
                                                className="w-full text-right font-bold text-slate-900 bg-transparent text-sm outline-none"
                                            />
                                            <span className="text-xs font-bold text-slate-600">Pax</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Cabin Class
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {(Object.keys(FLIGHT_CLASS_MULTIPLIERS) as FlightClass[]).map((cls) => (
                                            <button
                                                key={cls}
                                                type="button"
                                                onClick={() => setFlightClass(cls)}
                                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${flightClass === cls
                                                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs"
                                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <p className="font-bold text-xs capitalize">{cls}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{FLIGHT_CLASS_MULTIPLIERS[cls].multiplier}x multiplier</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* COMMUTE INPUTS */
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-indigo-600" />
                                            One-Way Commute Distance ({distanceUnit})
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={1}
                                                max={150}
                                                value={commuteDistanceOneWay === 0 ? "" : commuteDistanceOneWay}
                                                onChange={(e) => handleNumberInput(e, setCommuteDistanceOneWay)}
                                                className="w-20 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-sm font-bold text-slate-600">{distanceUnit}</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={60}
                                        step={1}
                                        value={commuteDistanceOneWay}
                                        onChange={(e) => setCommuteDistanceOneWay(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                        <span>5 {distanceUnit} (Short)</span>
                                        <span>25 {distanceUnit} (Suburban)</span>
                                        <span>50 {distanceUnit} (Long)</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Primary Transportation Mode
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {(Object.keys(COMMUTE_FACTORS) as CommuteMode[]).map((m) => {
                                            const item = COMMUTE_FACTORS[m];
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => setCommuteMode(m)}
                                                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${commuteMode === m
                                                            ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs"
                                                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    <p className="font-bold text-xs truncate">{item.label.split(" ")[0]}</p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">{item.kgCo2ePerKm} kg/km</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Days / Week
                                        </label>
                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                                            <input
                                                type="number"
                                                min={1}
                                                max={7}
                                                value={commuteDaysPerWeek === 0 ? "" : commuteDaysPerWeek}
                                                onChange={(e) => handleNumberInput(e, setCommuteDaysPerWeek)}
                                                className="w-full text-right font-bold text-slate-900 bg-transparent text-sm outline-none"
                                            />
                                            <span className="text-xs font-bold text-slate-600">days</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Weeks / Year
                                        </label>
                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                                            <input
                                                type="number"
                                                min={1}
                                                max={52}
                                                value={weeksPerYear === 0 ? "" : weeksPerYear}
                                                onChange={(e) => handleNumberInput(e, setWeeksPerYear)}
                                                className="w-full text-right font-bold text-slate-900 bg-transparent text-sm outline-none"
                                            />
                                            <span className="text-xs font-bold text-slate-600">wks</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Factors: DEFRA / IPCC 2025/2026 Guidelines
                        </span>
                        <span>Verified Protocols</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Results & Offsets */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Globe2 className="w-5 h-5 text-indigo-600" />
                                Carbon Emissions Output
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                {activeTab === "flight" ? "Flight Footprint" : "Annual Commute"}
                            </span>
                        </div>

                        {/* Hero Emissions Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Zap className="w-4 h-4 text-indigo-600" /> Metric Tonnes CO2e
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {activeTab === "flight" ? results.totalFlightCo2Tonnes : results.totalCommuteCo2Tonnes}
                                    <span className="text-lg font-bold text-slate-600 ml-1">t</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Total Equivalent CO₂ Impact
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Gauge className="w-4 h-4 text-indigo-600" /> Kilograms CO2e
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {activeTab === "flight" ? results.totalFlightCo2Kg.toLocaleString() : results.totalCommuteCo2Kg.toLocaleString()}
                                    <span className="text-lg font-bold text-slate-600 ml-1">kg</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    {activeTab === "flight" ? `${results.totalFlightKm.toLocaleString()} total passenger km` : `${results.annualCommuteKm.toLocaleString()} total annual km`}
                                </p>
                            </div>
                        </div>

                        {/* Offset Equivalency Banner */}
                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700">
                                <TreePine className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <p className="font-bold text-emerald-900 uppercase tracking-wider">
                                    Carbon Sequestration Equivalency: ~{results.treesNeeded.toLocaleString()} Tree Seedlings
                                </p>
                                <p className="text-emerald-800 leading-relaxed">
                                    To naturally absorb this quantity of greenhouse gas emissions, approximately {results.treesNeeded.toLocaleString()} tree seedlings must grow vigorously for a full decade.
                                </p>
                            </div>
                        </div>

                        {/* Analytical Comparison Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Smartphone Charges</span>
                                <span className="text-base sm:text-lg font-black text-indigo-600">{results.smartphoneCharges.toLocaleString()}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Equivalent Car Driving</span>
                                <span className="text-base sm:text-lg font-black text-slate-800">{results.equivalentCarKm.toLocaleString()} km</span>
                            </div>
                        </div>

                        {/* Professional Guidance Box */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Reduction Insights
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {activeTab === "flight"
                                    ? "Switching from Business to Economy class on long-haul flights reduces individual footprint allocation by nearly 65% due to higher passenger density per square meter."
                                    : "Transitioning your daily commute from a standard petrol car to an electric vehicle or commuter rail cuts annual tailpipe carbon output by over 70%."}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyResults}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Calculation Copied!" : "Copy Emissions Summary"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Emission Factors Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Global Transport Emission Factors Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The benchmark reference table below details carbon intensity ratings across common travel modes. These figures incorporate well-to-wheel (WTW) fuel production and direct operational combustion.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Transport Mode Category</th>
                                    <th className="p-3">Specific Vehicle / Class</th>
                                    <th className="p-3">Emission Factor ($kg CO_2e / km$)</th>
                                    <th className="p-3">Efficiency Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Aviation (Short-Haul)</td>
                                    <td className="p-3 text-slate-600">Economy Class (&lt; 1,500 km)</td>
                                    <td className="p-3 font-mono text-indigo-700">0.245 kg / pass-km</td>
                                    <td className="p-3 text-xs text-amber-600 font-bold">High Intensity</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Aviation (Long-Haul)</td>
                                    <td className="p-3 text-slate-600">Economy Class (&gt; 1,500 km)</td>
                                    <td className="p-3 font-mono text-indigo-700">0.152 kg / pass-km</td>
                                    <td className="p-3 text-xs text-indigo-600 font-bold">Moderate Intensity</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Road Transport</td>
                                    <td className="p-3 text-slate-600">Petrol Car (Average Passenger)</td>
                                    <td className="p-3 font-mono text-slate-900">0.192 kg / km</td>
                                    <td className="p-3 text-xs text-amber-600 font-bold">High Intensity</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Road Transport</td>
                                    <td className="p-3 text-slate-600">Battery Electric Vehicle (Grid Mix)</td>
                                    <td className="p-3 font-mono text-emerald-700">0.053 kg / km</td>
                                    <td className="p-3 text-xs text-emerald-600 font-bold">Low Intensity</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Public Transit</td>
                                    <td className="p-3 text-slate-600">Commuter / Intercity Rail</td>
                                    <td className="p-3 font-mono text-emerald-700">0.037 kg / km</td>
                                    <td className="p-3 text-xs text-emerald-600 font-bold">Highly Efficient</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Active Mobility</td>
                                    <td className="p-3 text-slate-600">Walking or Cycling</td>
                                    <td className="p-3 font-mono text-emerald-700">0.000 kg / km</td>
                                    <td className="p-3 text-xs text-emerald-600 font-bold">Zero Emission</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Scientific Principles & Radiative Forcing Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Aviation Radiative Forcing
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Aviation carbon accounting differs significantly from ground transport because airplanes emit pollutants directly into the upper troposphere and lower stratosphere (typically 30,000 to 40,000 feet altitude).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <CloudRain className="w-4 h-4 text-indigo-600" /> Contrails & Cirrus Formation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Water vapor emitted by jet engines at high altitude freezes onto soot particles, creating condensation trails (contrails). These contrails frequently expand into persistent cirrus cloud cover that traps outgoing longwave terrestrial radiation, compounding greenhouse warming.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-600" /> The 1.9 Multiplier Rule
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Scientific consensus quantified by the Intergovernmental Panel on Climate Change (IPCC) indicates that the total climate impact of aviation is roughly 1.9 times greater than the impact of $CO_2$ combustion alone. Our calculator incorporates this Radiative Forcing Index (RFI).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Commute Optimization & Sustainable Urban Mobility */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Car className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Strategies for Reducing Commuter Carbon Footprints
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Daily work commutes represent the single largest controllable portion of an individual&apos;s recurring carbon emissions. Implementing structural shift strategies yields immediate annualized reductions:
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Active Transport & Micro-Mobility</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Replacing short 3 to 5-mile car trips with e-bikes or walking eliminates cold-start catalytic emissions entirely while improving cardiovascular health.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Mass Transit Integration</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Commuter rail and electric bus networks distribute energy expenditure across hundreds of passengers, dropping per-kilometer emissions below 0.04 kg.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Hybrid Work Schedules</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Adopting a 3-day in-office, 2-day remote schedule instantly slashes annual commute mileage and associated greenhouse gas output by 40%.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
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
                                How is aviation carbon footprint calculated, and what is Radiative Forcing?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Aviation emissions calculation goes beyond simple fuel burn. High-altitude emissions of water vapor, nitrogen oxides (NOx), and sulfur particles at cruise altitude trigger chemical reactions that form cirrus clouds, trapping additional atmospheric heat. The IPCC and DEFRA apply a Radiative Forcing Index (RFI) multiplier of approximately 1.9 to account for this total warming impact.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do Business and First Class seats have a significantly higher carbon footprint?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Premium cabins occupy considerably more physical space per passenger inside the aircraft fuselage. Because fewer lie-flat suites or large seats fit into the same cabin volume compared to high-density economy seating, a larger share of the aircraft&apos;s total fuel burn is allocated to each premium passenger.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is CO2e (Carbon Dioxide Equivalent)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                CO2e is a standard unit for measuring carbon footprints that bundles all major greenhouse gases—including methane (CH4) and nitrous oxide (N2O)—and expresses their global warming potential (GWP) relative to carbon dioxide over a 100-year timescale.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How accurate are commute emission estimates between petrol and electric vehicles?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Estimates use average tailpipe and well-to-wheel emission factors. While electric cars produce zero direct tailpipe emissions, their lifecycle footprint depends on the local power grid&apos;s energy mix (coal vs. renewables). Average grid emission factors account for this generation footprint.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many trees does it take to offset one metric tonne of CO2?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                On average, a mature tree absorbs roughly 21 kilograms (46 lbs) of carbon dioxide per year. Therefore, absorbing one metric tonne (1,000 kg) of CO2 requires approximately 48 to 50 tree seedlings growing vigorously for a full year.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the most effective ways to reduce personal travel emissions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Key reduction strategies include replacing short-haul flights under 500 miles with high-speed rail, consolidating business trips, choosing economy class seating, transitioning to electric or hybrid commuter vehicles, carpooling, and adopting remote work days.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}