"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Calendar,
  Heart,
  Clock,
  Sparkles,
  Info,
  HelpCircle,
  BookOpen,
  Download,
  Copy,
  Check,
  BarChart3,
  ShieldCheck,
  Calculator,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
  Baby,
  Activity,
  CheckCircle2,
  Stethoscope,
  TrendingUp,
  Sun,
  Moon,
  Zap,
  Layers
} from "lucide-react";

interface Preset {
  id: string;
  label: string;
  cycleLength: number;
  lutealLength: number;
  lastPeriodDaysAgo: number;
  tag: string;
}

const PRESETS: Preset[] = [
  { id: "std-28", label: "Standard 28-Day Cycle", cycleLength: 28, lutealLength: 14, lastPeriodDaysAgo: 10, tag: "28d / 14d Luteal" },
  { id: "short-24", label: "Short Cycle (24 Days)", cycleLength: 24, lutealLength: 12, lastPeriodDaysAgo: 7, tag: "24d / 12d Luteal" },
  { id: "long-32", label: "Long Cycle (32 Days)", cycleLength: 32, lutealLength: 14, lastPeriodDaysAgo: 14, tag: "32d / 14d Luteal" },
];

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
  const num = parseInt(cleaned, 10);
  setter(isNaN(num) ? 0 : num);
};

export default function OvulationCalculator() {
  // Input States
  const [lastPeriodDate, setLastPeriodDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    return d.toISOString().split("T")[0];
  });
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [lutealLength, setLutealLength] = useState<number>(14);

  // UI States
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "timeline">("summary");
  const [activePresetId, setActivePresetId] = useState<string | null>("std-28");

  const exportRef = useRef<HTMLDivElement>(null);

  // Core Fertility Math Engine
  const calculations = useMemo(() => {
    if (!lastPeriodDate || cycleLength < 20 || cycleLength > 45 || lutealLength < 9 || lutealLength > 18) {
      return null;
    }

    const lastPeriod = new Date(lastPeriodDate + "T00:00:00");
    if (isNaN(lastPeriod.getTime())) return null;

    // 1. Ovulation Date = Last Period + (Cycle Length - Luteal Phase Length)
    const daysUntilOvulation = cycleLength - lutealLength;
    const estimatedOvulation = new Date(lastPeriod);
    estimatedOvulation.setDate(lastPeriod.getDate() + daysUntilOvulation);

    // 2. Fertile Window Start = Ovulation Date - 5 Days
    const fertileStart = new Date(estimatedOvulation);
    fertileStart.setDate(estimatedOvulation.getDate() - 5);

    // 3. Fertile Window End = Ovulation Date + 1 Day
    const fertileEnd = new Date(estimatedOvulation);
    fertileEnd.setDate(estimatedOvulation.getDate() + 1);

    // 4. Peak Fertility Window = Ovulation Date - 2 Days to Ovulation Date
    const peakStart = new Date(estimatedOvulation);
    peakStart.setDate(estimatedOvulation.getDate() - 2);

    // 5. Next Period Date = Last Period + Cycle Length
    const nextPeriod = new Date(lastPeriod);
    nextPeriod.setDate(lastPeriod.getDate() + cycleLength);

    // 6. Next Cycle Ovulation Date
    const nextOvulation = new Date(nextPeriod);
    nextOvulation.setDate(nextPeriod.getDate() + daysUntilOvulation);

    // 7. Next Cycle Fertile Window Start
    const nextFertileStart = new Date(nextOvulation);
    nextFertileStart.setDate(nextOvulation.getDate() - 5);

    // 8. Next Cycle Fertile Window End
    const nextFertileEnd = new Date(nextOvulation);
    nextFertileEnd.setDate(nextOvulation.getDate() + 1);

    // 9. Conception Test Date = Ovulation Date + 14 Days
    const testDate = new Date(estimatedOvulation);
    testDate.setDate(estimatedOvulation.getDate() + 14);

    // 10. Estimated Due Date = Ovulation Date + 266 Days (or Last Period + 280 Days)
    const estimatedDueDate = new Date(estimatedOvulation);
    estimatedDueDate.setDate(estimatedOvulation.getDate() + 266);

    // Current Status Calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentPhase = "Follicular Phase";
    let statusText = "Low Chance of Conception";
    let statusBadgeColor = "bg-slate-100 text-slate-700 border-slate-200";

    if (today >= fertileStart && today <= fertileEnd) {
      if (today.getTime() === estimatedOvulation.getTime()) {
        currentPhase = "Ovulation Day";
        statusText = "Peak Fertility (Ovulation Day)";
        statusBadgeColor = "bg-rose-100 text-rose-700 border-rose-300";
      } else if (today >= peakStart && today < estimatedOvulation) {
        currentPhase = "Peak Fertile Window";
        statusText = "High Chance of Conception";
        statusBadgeColor = "bg-emerald-100 text-emerald-700 border-emerald-300";
      } else {
        currentPhase = "Fertile Window";
        statusText = "Moderate Chance of Conception";
        statusBadgeColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
      }
    } else if (today > estimatedOvulation && today < nextPeriod) {
      currentPhase = "Luteal Phase";
      statusText = "Low Chance of Conception";
    } else if (today < fertileStart) {
      currentPhase = "Early Follicular Phase";
      statusText = "Low Chance of Conception";
    }

    return {
      lastPeriod,
      estimatedOvulation,
      fertileStart,
      fertileEnd,
      peakStart,
      nextPeriod,
      nextOvulation,
      nextFertileStart,
      nextFertileEnd,
      testDate,
      estimatedDueDate,
      currentPhase,
      statusText,
      statusBadgeColor,
    };
  }, [lastPeriodDate, cycleLength, lutealLength]);

  const formatDate = (date: Date | null) => {
    if (!date) return "--";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const applyPreset = (preset: Preset) => {
    const d = new Date();
    d.setDate(d.getDate() - preset.lastPeriodDaysAgo);
    setLastPeriodDate(d.toISOString().split("T")[0]);
    setCycleLength(preset.cycleLength);
    setLutealLength(preset.lutealLength);
    setActivePresetId(preset.id);
  };

  const handleReset = () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    setLastPeriodDate(d.toISOString().split("T")[0]);
    setCycleLength(28);
    setLutealLength(14);
    setActivePresetId(null);
  };

  const handleCopySummary = () => {
    if (!calculations) return;

    const summaryText = `Fertility & Ovulation Schedule Summary (TwisterTools):
----------------------------------------
Last Period Start: ${formatDate(calculations.lastPeriod)}
Average Cycle Length: ${cycleLength} days
Luteal Phase Length: ${lutealLength} days
----------------------------------------
ESTIMATED OVULATION DATE: ${formatDate(calculations.estimatedOvulation)}
FERTILE WINDOW: ${formatDate(calculations.fertileStart)} – ${formatDate(calculations.fertileEnd)}
PEAK CONCEPTION WINDOW: ${formatDate(calculations.peakStart)} – ${formatDate(calculations.estimatedOvulation)}
EXPECTED NEXT PERIOD: ${formatDate(calculations.nextPeriod)}
EARLIEST PREGNANCY TEST DATE: ${formatDate(calculations.testDate)}
ESTIMATED DUE DATE (IF CONCEIVED): ${formatDate(calculations.estimatedDueDate)}
----------------------------------------
NEXT CYCLE FERTILITY FORECAST:
Next Ovulation: ${formatDate(calculations.nextOvulation)}
Next Fertile Window: ${formatDate(calculations.nextFertileStart)} – ${formatDate(calculations.nextFertileEnd)}
----------------------------------------
Calculated at twistertools.com/tools/calculators/ovulation-calculator`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (!calculations) return;

    const headers = ["Metric / Event", "Estimated Date / Schedule", "Clinical Context"];
    const rows = [
      ["Last Period Start", formatDate(calculations.lastPeriod), "First day of menses"],
      ["Estimated Ovulation Day", formatDate(calculations.estimatedOvulation), "Egg release (24h viability)"],
      ["Fertile Window Start", formatDate(calculations.fertileStart), "Sperm survival window start"],
      ["Fertile Window End", formatDate(calculations.fertileEnd), "Post-ovulation closure"],
      ["Peak Conception Dates", `${formatDate(calculations.peakStart)} to ${formatDate(calculations.estimatedOvulation)}`, "Highest probability window"],
      ["Expected Next Period", formatDate(calculations.nextPeriod), "Cycle completion"],
      ["Earliest Test Date", formatDate(calculations.testDate), "hCG sensitivity threshold"],
      ["Estimated Due Date", formatDate(calculations.estimatedDueDate), "Conception + 266 days"],
      ["Next Cycle Ovulation", formatDate(calculations.nextOvulation), "Following cycle estimate"],
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ovulation_fertile_window_schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Structured Data Schemas
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Ovulation & Fertile Window Calculator",
    "url": "https://twistertools.com/tools/calculators/ovulation-calculator",
    "description": "Calculate your exact ovulation day, fertile window, peak conception dates, and expected period for current and upcoming menstrual cycles.",
    "applicationCategory": "HealthApplication",
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
        "name": "How is the ovulation date calculated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ovulation is estimated by subtracting the luteal phase length (typically 14 days) from the total length of your menstrual cycle, starting from the first day of your last menstrual period."
        }
      },
      {
        "@type": "Question",
        "name": "What is the fertile window?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The fertile window includes the 5 days prior to ovulation and ovulation day itself (a 6-day total window). This accounts for sperm viability (up to 5 days inside the female reproductive tract) and egg viability (12-24 hours)."
        }
      },
      {
        "@type": "Question",
        "name": "How long is a normal luteal phase?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A typical luteal phase lasts 12 to 14 days. It is the period between ovulation and the first day of the next menstrual period. Unlike the follicular phase, the luteal phase remains relatively constant for an individual."
        }
      },
      {
        "@type": "Question",
        "name": "When is the best time to take a pregnancy test?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The most accurate time to take a home pregnancy test is 14 days after ovulation, which typically corresponds to the first day of a missed period when hCG levels are detectable."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use an ovulation calculator as natural birth control?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Standard calendar calculations should not be relied upon as a primary contraceptive method because natural cycle variations, stress, illness, and travel can shift ovulation unpredictably."
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
        {/* Left Workspace Panel: Inputs & Cycle Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Menstrual Cycle Inputs
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-5">
              {/* Last Period Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> First Day of Last Period
                </label>
                <input
                  type="date"
                  value={lastPeriodDate}
                  onChange={(e) => {
                    setLastPeriodDate(e.target.value);
                    setActivePresetId(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Select day 1 of your most recent menstrual flow.
                </p>
              </div>

              {/* Cycle Length Slider & Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" /> Average Cycle Length (Days)
                  </label>
                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {cycleLength} Days
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="45"
                  value={cycleLength}
                  onChange={(e) => {
                    setCycleLength(parseInt(e.target.value, 10));
                    setActivePresetId(null);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="number"
                    min="20"
                    max="45"
                    value={cycleLength === 0 ? "" : cycleLength}
                    onChange={(e) => {
                      handleNumberInput(e, (val) => setCycleLength(Math.max(20, Math.min(45, val))));
                      setActivePresetId(null);
                    }}
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50 text-center"
                  />
                  <span className="text-xs text-slate-500">Normal range: 21 to 35 days</span>
                </div>
              </div>

              {/* Luteal Phase Length */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> Luteal Phase Length (Days)
                  </label>
                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {lutealLength} Days
                  </span>
                </div>
                <input
                  type="range"
                  min="9"
                  max="18"
                  value={lutealLength}
                  onChange={(e) => {
                    setLutealLength(parseInt(e.target.value, 10));
                    setActivePresetId(null);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="number"
                    min="9"
                    max="18"
                    value={lutealLength === 0 ? "" : lutealLength}
                    onChange={(e) => {
                      handleNumberInput(e, (val) => setLutealLength(Math.max(9, Math.min(18, val))));
                      setActivePresetId(null);
                    }}
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50 text-center"
                  />
                  <span className="text-xs text-slate-500">Standard clinical default: 14 days</span>
                </div>
              </div>
            </div>

            {/* PRESETS COMPONENT */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Reference Presets
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
                      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy Schedule"}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Right Workspace Panel: Results, Visual Fertile Window & Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Fertility & Ovulation Schedule
              </h2>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    activeTab === "summary" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Current Cycle
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                    activeTab === "timeline" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Next Cycle
                </button>
              </div>
            </div>

            {calculations ? (
              <>
                {/* Primary Hero Output Box */}
                <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-300 fill-rose-300" /> Estimated Ovulation Day
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      {calculations.statusText}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-black text-white pt-3 pb-3">
                      {formatDate(calculations.estimatedOvulation)}
                    </span>
                    <span className="text-sm font-semibold text-indigo-200">estimated date</span>
                  </div>

                  <p className="mt-3 text-xs text-indigo-200/90 leading-relaxed border-t border-indigo-800/80 pt-3">
                    Estimated 6-Day Fertile Window: <strong className="text-white">{formatDate(calculations.fertileStart)}</strong> to <strong className="text-white">{formatDate(calculations.fertileEnd)}</strong>.
                  </p>
                </div>

                {/* Tab Views */}
                {activeTab === "summary" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pt-1">
                    {/* Peak Conception Window */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Peak Conception Window
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatDate(calculations.peakStart)} – {formatDate(calculations.estimatedOvulation)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Highest statistical chance of pregnancy
                      </p>
                    </div>

                    {/* Expected Next Period */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        Expected Next Period
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatDate(calculations.nextPeriod)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cycle length: {cycleLength} days
                      </p>
                    </div>

                    {/* Pregnancy Test Date */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        Earliest Pregnancy Test Date
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatDate(calculations.testDate)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        14 days post-ovulation (hCG threshold)
                      </p>
                    </div>

                    {/* Estimated Due Date */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Baby className="w-4 h-4 text-indigo-600" />
                        Estimated Due Date
                      </div>
                      <p className="text-sm font-extrabold text-indigo-600 mt-1">
                        {formatDate(calculations.estimatedDueDate)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Calculated at 266 days post-ovulation
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Next Cycle Forecast Tab */
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-600" /> Next Menstrual Cycle Forecast
                    </h3>
                    <div className="space-y-3 text-xs text-slate-700">
                      <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-600">Next Ovulation Date</span>
                        <span className="font-bold text-indigo-900">{formatDate(calculations.nextOvulation)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-600">Next Fertile Window</span>
                        <span className="font-bold text-emerald-700">
                          {formatDate(calculations.nextFertileStart)} – {formatDate(calculations.nextFertileEnd)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-600">Following Period Start</span>
                        <span className="font-bold text-slate-900">
                          {formatDate(new Date(calculations.nextPeriod.getTime() + cycleLength * 86400000))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                Please enter valid cycle dates and lengths to view your fertility schedule.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Client-side private processing
            </span>
            <span>Standard Clinical Luteal Engine</span>
          </div>
        </div>
      </div>

      {/* FIRST MANDATORY MEDICAL DISCLAIMER BANNER */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Medical Disclaimer:</strong> This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
        </p>
      </div>

      {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
      <div className="space-y-6">
        {/* Card 1: Comprehensive Medical Mechanics & Formulas */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Understanding Menstrual Cycle Physiology & Fertile Window Mechanics
            </h2>
          </div>

          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The female menstrual cycle is regulated by complex neuroendocrine interactions between the hypothalamus, anterior pituitary gland, and ovaries. Tracking your cycle length and estimating your <strong>fertile window</strong> provides key insights for family planning or cycle awareness.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sun className="w-4 h-4 text-indigo-600" /> The Follicular Phase & LH Surge
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Beginning on day 1 of menses, follicle-stimulating hormone (FSH) promotes ovarian follicle development. A rapid surge in luteinizing hormone (LH) triggers mature egg release approximately 24 to 36 hours later.
              </p>
            </div>
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-600" /> The Luteal Phase Stability
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Following ovulation, the corpus luteum secretes progesterone to prepare the endometrium. While the follicular phase varies in duration, the luteal phase remains consistently 12 to 14 days long for most individuals.
              </p>
            </div>
          </div>

          {/* Mathematical Formula Box */}
          <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Mathematical Calculations for Ovulation & Fertility
            </h3>
            <p className="text-xs text-slate-300">
              Equations utilized by this engine to calculate ovulation and conception dates:
            </p>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
              <div><strong>1. Estimated Ovulation Day:</strong> Ovulation Date = LMP + (Cycle Length - Luteal Phase Length)</div>
              <div><strong>2. Fertile Window Start:</strong> Fertile Start = Ovulation Date - 5 Days</div>
              <div><strong>3. Fertile Window End:</strong> Fertile End = Ovulation Date + 1 Day</div>
              <div><strong>4. Peak Conception Window:</strong> Peak Start = Ovulation Date - 2 Days through Ovulation Day</div>
              <div><strong>5. Estimated Due Date (Naegele's Rule Variant):</strong> Estimated Due Date = Ovulation Date + 266 Days</div>
            </div>
          </div>
        </section>

        {/* Card 2: Detailed Reference Tables & Classifications */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Clinical Conception Probability & Biological Viability Reference
            </h2>
          </div>

          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Conception probability varies significantly throughout the 6-day fertile window based on gamete longevity:
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Timing Relative to Ovulation</th>
                  <th className="p-3">Conception Probability</th>
                  <th className="p-3">Biological Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">5 Days Before Ovulation (O-5)</td>
                  <td className="p-3 text-amber-600 font-semibold">Low (~5%)</td>
                  <td className="p-3">Sperm entering cervical mucus at maximum lifespan limit.</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">3 to 4 Days Before (O-4 to O-3)</td>
                  <td className="p-3 text-indigo-600 font-semibold">Moderate (15% – 20%)</td>
                  <td className="p-3">Sperm capacitation occurs inside fallopian tubes.</td>
                </tr>
                <tr className="hover:bg-slate-50 bg-emerald-50/30">
                  <td className="p-3 font-bold text-emerald-700">1 to 2 Days Before (O-2 to O-1)</td>
                  <td className="p-3 font-bold text-emerald-600">Peak (30% – 35%)</td>
                  <td className="p-3 font-medium text-emerald-800">Optimal viability timing prior to oocyte release.</td>
                </tr>
                <tr className="hover:bg-slate-50 bg-rose-50/30">
                  <td className="p-3 font-bold text-rose-700">Ovulation Day (Day O)</td>
                  <td className="p-3 font-bold text-rose-600">High (~25% – 30%)</td>
                  <td className="p-3 font-medium text-rose-800">Fresh egg present in ampulla (viable for 12–24h).</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">1 Day After Ovulation (O+1)</td>
                  <td className="p-3 text-slate-500 font-semibold">Rapid Decline (&lt;5%)</td>
                  <td className="p-3">Oocyte degeneration and cervical mucus hardening.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Card 3: Worked Case Examples */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Worked Cycle Length Case Examples
            </h2>
          </div>

          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Cycle variance directly alters the ovulation day within the calendar month. Compare two sample cycle profiles:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900">Case A: Regular 28-Day Cycle</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Standard</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5">
                <li><strong>LMP:</strong> May 1st</li>
                <li><strong>Cycle Length:</strong> 28 Days (14-Day Luteal)</li>
                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Schedule:</li>
                <li>• <strong>Ovulation Day:</strong> May 15th (Day 15)</li>
                <li>• <strong>Fertile Window:</strong> May 10th – May 16th</li>
                <li>• <strong>Peak Window:</strong> May 13th – May 15th</li>
                <li>• <strong>Next Period:</strong> May 29th</li>
              </ul>
            </div>

            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900">Case B: Longer 34-Day Cycle</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Extended</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5">
                <li><strong>LMP:</strong> May 1st</li>
                <li><strong>Cycle Length:</strong> 34 Days (14-Day Luteal)</li>
                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Schedule:</li>
                <li>• <strong>Ovulation Day:</strong> May 21st (Day 21)</li>
                <li>• <strong>Fertile Window:</strong> May 16th – May 22nd</li>
                <li>• <strong>Peak Window:</strong> May 19th – May 21st</li>
                <li>• <strong>Next Period:</strong> June 4th</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Card 4: Clinical Indicators & Confirmation Methods */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Physical Ovulation Indicators & Confirmation Methods
            </h2>
          </div>

          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Calendar estimates are most effective when paired with physical fertility signs:
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Cervical Mucus Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                As estrogen peaks near ovulation, cervical mucus becomes clear, slippery, and stretchy (resembling raw egg whites), helping nourish sperm.
              </p>
            </div>
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Basal Body Temperature (BBT)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Progesterone causes a sustained thermal shift of 0.5°F to 1.0°F immediately after ovulation, confirming that ovulation has occurred.
              </p>
            </div>
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Ovulation Predictor Kits (OPKs)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Urine test strips detect the luteinizing hormone (LH) surge 24 to 36 hours before egg release to pinpoint your fertile window.
              </p>
            </div>
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
                How is the ovulation date calculated?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Ovulation is calculated by subtracting your luteal phase length (typically 14 days) from your total menstrual cycle length, counted from the first day of your last period.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-bold text-slate-900 text-base mb-2">
                What is the fertile window?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                The fertile window is the 6-day period during which pregnancy can occur: the 5 days before ovulation and ovulation day itself. This accounts for sperm survival inside the female body.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-bold text-slate-900 text-base mb-2">
                How long is a normal luteal phase?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                A normal luteal phase lasts 12 to 14 days. It covers the time between ovulation and the first day of your next period.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-bold text-slate-900 text-base mb-2">
                When is the best time to take a pregnancy test?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Home pregnancy tests are most accurate 14 days after ovulation, around the time of your expected period when hCG hormone levels become detectable.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Can I use an ovulation calculator as natural birth control?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                No. Standard calendar tracking should not be used as a primary birth control method because cycle lengths and ovulation timing can shift unexpectedly due to stress, illness, or hormonal changes.
              </p>
            </div>
          </div>
        </section>

        {/* SECOND MANDATORY MEDICAL DISCLAIMER CARD */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Health & Medical Disclaimer
          </h3>
          <p className="leading-relaxed">
            Medical Disclaimer: This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
          </p>
        </section>
      </div>
    </div>
  );
}