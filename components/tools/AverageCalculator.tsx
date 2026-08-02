"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  ListOrdered,
  Sigma,
  HelpCircle,
  CheckCircle,
  Copy,
  Check,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
  Info
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Precision Formatting Helper
// ─────────────────────────────────────────────────────────────
function formatResult(num: number): string {
  if (isNaN(num) || !isFinite(num)) return "-";
  // Check if it's an integer to avoid trailing decimals
  if (Number.isInteger(num)) return num.toString();
  // Otherwise, format up to 6 decimal places and remove trailing zeros
  return Number(num.toFixed(6)).toString();
}

// ─────────────────────────────────────────────────────────────
//  Data Models
// ─────────────────────────────────────────────────────────────
interface ParsedData {
  values: number[];
  weights: number[];
}

export default function AverageCalculator() {
  const [inputText, setInputText] = useState("");
  const [useWeights, setUseWeights] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [accordionOpen, setAccordionOpen] = useState(true);

  // ── Parse Data on the fly ──
  const parsedData = useMemo<ParsedData>(() => {
    const items = inputText.split(/[,\s;\n]+/);
    const values: number[] = [];
    const weights: number[] = [];

    for (const item of items) {
      const trimmed = item.trim();
      if (!trimmed) continue;

      if (useWeights) {
        const parts = trimmed.split(":");
        if (parts.length === 2) {
          const val = parseFloat(parts[0]);
          const weight = parseFloat(parts[1]);
          if (!isNaN(val) && !isNaN(weight) && weight >= 0) {
            values.push(val);
            weights.push(weight);
          }
        } else if (parts.length === 1) {
          const val = parseFloat(parts[0]);
          if (!isNaN(val)) {
            values.push(val);
            weights.push(1); // Default weight of 1
          }
        }
      } else {
        const val = parseFloat(trimmed);
        if (!isNaN(val)) {
          values.push(val);
          weights.push(1);
        }
      }
    }
    return { values, weights };
  }, [inputText, useWeights]);

  // ── Computations ──
  const calculations = useMemo(() => {
    const { values, weights } = parsedData;
    if (values.length === 0) {
      return {
        mean: NaN,
        median: NaN,
        modes: [] as number[],
        maxFreq: 0,
        isNoMode: true,
        range: NaN,
        geoMean: { value: NaN, hasWarning: false },
        harmonicMean: { value: NaN, hasWarning: false },
        populationSD: NaN,
        sampleSD: NaN,
        min: NaN,
        max: NaN,
      };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // 1. Mean
    let sum = 0;
    let totalWeight = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i] * weights[i];
      totalWeight += weights[i];
    }
    const mean = totalWeight > 0 ? sum / totalWeight : NaN;

    // 2. Median (Weighted)
    let median = NaN;
    if (totalWeight > 0) {
      // Sort combined array
      const combined = values.map((val, idx) => ({ val, weight: weights[idx] }));
      combined.sort((a, b) => a.val - b.val);

      const halfWeight = totalWeight / 2;
      let cumulativeWeight = 0;
      let found = false;

      for (let i = 0; i < combined.length; i++) {
        cumulativeWeight += combined[i].weight;
        if (cumulativeWeight > halfWeight) {
          median = combined[i].val;
          found = true;
          break;
        } else if (cumulativeWeight === halfWeight) {
          // Boundary case
          if (i + 1 < combined.length) {
            median = (combined[i].val + combined[i + 1].val) / 2;
          } else {
            median = combined[i].val;
          }
          found = true;
          break;
        }
      }
      if (!found && combined.length > 0) {
        median = combined[combined.length - 1].val;
      }
    }

    // 3. Mode (Weighted)
    const freqMap: { [key: number]: number } = {};
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      const w = weights[i];
      freqMap[val] = (freqMap[val] || 0) + w;
    }

    const uniqueValues = Object.keys(freqMap).map(Number);
    let maxFreq = 0;
    for (const val of uniqueValues) {
      if (freqMap[val] > maxFreq) {
        maxFreq = freqMap[val];
      }
    }

    const allEqualFreq = uniqueValues.every((val) => freqMap[val] === maxFreq);
    const isNoMode = (allEqualFreq && uniqueValues.length > 1) || (maxFreq === 1 && uniqueValues.length > 1);
    const modes = uniqueValues.filter((val) => freqMap[val] === maxFreq).sort((a, b) => a - b);

    // 4. Geometric Mean (avoid overflow using logs)
    let hasGeoWarning = false;
    let logSum = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] <= 0) {
        hasGeoWarning = true;
        break;
      }
      logSum += weights[i] * Math.log(values[i]);
    }
    const geoMeanVal = hasGeoWarning ? NaN : Math.exp(logSum / totalWeight);

    // 5. Harmonic Mean
    let hasHarmonicWarning = false;
    let reciprocalSum = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] === 0) {
        hasHarmonicWarning = true;
        break;
      }
      reciprocalSum += weights[i] / values[i];
    }
    const harmonicMeanVal = hasHarmonicWarning ? NaN : totalWeight / reciprocalSum;

    // 6. Standard Deviations
    let weightedSumSqDiff = 0;
    for (let i = 0; i < values.length; i++) {
      weightedSumSqDiff += weights[i] * Math.pow(values[i] - mean, 2);
    }
    const populationSD = Math.sqrt(weightedSumSqDiff / totalWeight);
    const sampleSD = totalWeight > 1 ? Math.sqrt(weightedSumSqDiff / (totalWeight - 1)) : NaN;

    return {
      mean,
      median,
      modes,
      maxFreq,
      isNoMode,
      range,
      geoMean: { value: geoMeanVal, hasWarning: hasGeoWarning },
      harmonicMean: { value: harmonicMeanVal, hasWarning: hasHarmonicWarning },
      populationSD,
      sampleSD,
      min,
      max,
    };
  }, [parsedData]);

  // ── Clipboard Copy Helper ──
  const copyValue = async (text: string, key: string) => {
    if (!text || text === "-") return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 1500);
    } catch {
      /* silent */
    }
  };

  // ── Sample Loader ──
  const handleLoadSample = () => {
    if (useWeights) {
      setInputText("10:1, 15:2, 15:1, 20:1, 25:1, 30:1, 40:1");
    } else {
      setInputText("10, 15, 15, 20, 25, 30, 40");
    }
  };

  // Distribution positions (percentages between min & max)
  const rangeSpan = calculations.max - calculations.min;
  const meanPct = rangeSpan > 0 ? Math.min(Math.max(((calculations.mean - calculations.min) / rangeSpan) * 100, 0), 100) : 50;
  const medianPct = rangeSpan > 0 ? Math.min(Math.max(((calculations.median - calculations.min) / rangeSpan) * 100, 0), 100) : 50;

  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* ══════════════════ LEFT PANEL — 8 columns ══════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Inputs Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <label
                htmlFor="dataset-input"
                className="text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Numeric Dataset Input
              </label>
              <div className="flex items-center gap-2 min-h-[40px]">
                <input
                  type="checkbox"
                  id="weight-toggle"
                  checked={useWeights}
                  onChange={(e) => {
                    setUseWeights(e.target.checked);
                    setInputText("");
                  }}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="weight-toggle"
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none"
                >
                  Weights / Frequencies
                </label>
              </div>
            </div>

            <textarea
              id="dataset-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                useWeights
                  ? "Enter data as Value:Weight, separated by commas, spaces, or newlines.\nExample: 10:2, 15:3, 20:1"
                  : "Enter numbers separated by commas, spaces, semicolons, or newlines.\nExample: 10, 15, 15, 20, 25, 30, 40"
              }
              rows={6}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all font-mono"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-900/60 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Sample Data
                </button>
                <button
                  type="button"
                  onClick={() => setInputText("")}
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              </div>

              {parsedData.values.length > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {parsedData.values.length} numbers parsed
                </span>
              )}
            </div>
          </div>

          {/* Data Distribution Visualizer Card */}
          {parsedData.values.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5">
                Data Distribution Visualizer
              </h3>
              <div className="relative pt-6 pb-8 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                {/* Min / Max Labels */}
                <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">
                  <span>Min: {formatResult(calculations.min)}</span>
                  <span>Max: {formatResult(calculations.max)}</span>
                </div>

                {/* Plot line bar */}
                <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full relative">
                  {/* Range fill bar */}
                  <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-indigo-200/50 to-emerald-200/50 dark:from-indigo-950/20 dark:to-emerald-950/20 rounded-full" />
                  
                  {/* Mean dashed indicator */}
                  {!isNaN(calculations.mean) && (
                    <div
                      className="absolute top-[-30px] bottom-[-30px] w-0.5 border-l-2 border-dashed border-indigo-500 pointer-events-none"
                      style={{ left: `${meanPct}%` }}
                    />
                  )}

                  {/* Median dashed indicator */}
                  {!isNaN(calculations.median) && (
                    <div
                      className="absolute top-[-30px] bottom-[-30px] w-0.5 border-l-2 border-dashed border-emerald-500 pointer-events-none"
                      style={{ left: `${medianPct}%` }}
                    />
                  )}

                  {/* Mean Marker */}
                  {!isNaN(calculations.mean) && (
                    <div
                      className="absolute -top-1 w-5.5 h-5.5 -ml-2.5 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-950 shadow-md flex items-center justify-center cursor-help group z-10"
                      style={{ left: `${meanPct}%` }}
                    >
                      <div className="absolute bottom-7 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">
                        Mean: {formatResult(calculations.mean)}
                      </div>
                    </div>
                  )}

                  {/* Median Marker */}
                  {!isNaN(calculations.median) && (
                    <div
                      className="absolute -top-1 w-5.5 h-5.5 -ml-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-md flex items-center justify-center cursor-help group z-10"
                      style={{ left: `${medianPct}%` }}
                    >
                      <div className="absolute top-7 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">
                        Median: {formatResult(calculations.median)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend and Labels */}
                <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-600 block" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Mean: <strong className="text-slate-900 dark:text-white">{formatResult(calculations.mean)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 block" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Median: <strong className="text-slate-900 dark:text-white">{formatResult(calculations.median)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════ RIGHT PANEL — 4 columns, sticky ══════════════════ */}
        <div className="lg:col-span-4">
          <div className="sticky top-4 space-y-4">
            
            {/* Primary Results Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Primary Results
                </span>
              </div>
              
              <div className="p-5 space-y-5">
                {/* Mean Display Block */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-5 text-center relative group">
                  <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                    Arithmetic Mean
                  </span>
                  <span className="text-3xl font-extrabold text-indigo-950 dark:text-indigo-300 block truncate px-4">
                    {formatResult(calculations.mean)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyValue(formatResult(calculations.mean), "mean")}
                    className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    aria-label="Copy Mean"
                  >
                    {copiedStates["mean"] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Median, Mode, Range Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      label: "Median",
                      value: formatResult(calculations.median),
                      key: "median",
                      desc: "The middle value of ordered numbers"
                    },
                    {
                      label: "Mode",
                      value: calculations.isNoMode
                        ? "No Mode"
                        : calculations.modes.map(formatResult).join(", "),
                      key: "mode",
                      desc: "Value with highest occurrence frequency"
                    },
                    {
                      label: "Range",
                      value: formatResult(calculations.range),
                      key: "range",
                      desc: "Difference between maximum and minimum"
                    }
                  ].map(({ label, value, key, desc }) => (
                    <div
                      key={key}
                      className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4 flex items-center justify-between relative group"
                    >
                      <div className="min-w-0 pr-6">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          {label}
                        </span>
                        <span className="text-base font-bold text-slate-850 dark:text-slate-200 mt-0.5 block truncate" title={value}>
                          {value}
                        </span>
                        <span className="text-[10px] text-slate-505 dark:text-slate-500 block truncate mt-0.5">
                          {desc}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyValue(value, key)}
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        aria-label={`Copy ${label}`}
                      >
                        {copiedStates[key] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Metrics Accordion Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setAccordionOpen(!accordionOpen)}
                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 transition-colors text-left min-h-[40px]"
              >
                <div className="flex items-center gap-2">
                  <Sigma className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Advanced Metrics
                  </span>
                </div>
                {accordionOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {accordionOpen && (
                <div className="p-5 space-y-4">
                  {/* Geometric Mean */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Geometric Mean</span>
                      <button
                        type="button"
                        onClick={() => copyValue(formatResult(calculations.geoMean.value), "geomean")}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600"
                      >
                        {copiedStates["geomean"] ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {calculations.geoMean.hasWarning ? (
                      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-2.5 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{"Undetermined (dataset contains zero or negative numbers)"}</span>
                      </div>
                    ) : (
                      <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                        {formatResult(calculations.geoMean.value)}
                      </div>
                    )}
                  </div>

                  {/* Harmonic Mean */}
                  <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-655 dark:text-slate-400">Harmonic Mean</span>
                      <button
                        type="button"
                        onClick={() => copyValue(formatResult(calculations.harmonicMean.value), "harmonic")}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600"
                      >
                        {copiedStates["harmonic"] ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {calculations.harmonicMean.hasWarning ? (
                      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-2.5 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{"Undetermined (dataset contains zero values)"}</span>
                      </div>
                    ) : (
                      <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                        {formatResult(calculations.harmonicMean.value)}
                      </div>
                    )}
                  </div>

                  {/* Population SD */}
                  <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-655 dark:text-slate-400">
                        {"Population Std Dev. ($\\sigma$)"}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyValue(formatResult(calculations.populationSD), "popsd")}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600"
                      >
                        {copiedStates["popsd"] ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {formatResult(calculations.populationSD)}
                    </div>
                  </div>

                  {/* Sample SD */}
                  <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-655 dark:text-slate-400">
                        {"Sample Std Dev. ($s$)"}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyValue(formatResult(calculations.sampleSD), "samplesd")}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600"
                      >
                        {copiedStates["samplesd"] ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {formatResult(calculations.sampleSD)}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        
        {/* Section 1 */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900/20 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>What is an Average and How is it Calculated?</span>
          </h2>
          <div className="space-y-6">
            <p className="text-slate-700 dark:text-slate-350 text-sm md:text-base leading-relaxed">
              An average is a representative value that summarizes a set of data. While most people refer to the "arithmetic mean" simply as the average, mathematical and statistical analysis recognizes several types of averages, each serving a distinct purpose depending on the data structure:
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  title: "Arithmetic Mean",
                  body: "The sum of all numerical values divided by the total count of numbers. It represents the central balance point of a dataset."
                },
                {
                  title: "Median",
                  body: "The middle value when a dataset is ordered from lowest to highest. It is highly resilient against skewed outliers."
                },
                {
                  title: "Mode",
                  body: "The value that appears most frequently in a dataset. A dataset can have one mode, multiple modes (multi-modal), or no mode at all if all values appear once."
                }
              ].map(({ title, body }) => (
                <div
                  key={title}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{title}</h3>
                  </div>
                  <p className="text-slate-750 dark:text-slate-400 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white dark:from-slate-900/30 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
              <ListOrdered className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Step-by-Step Practical Calculation Guide</span>
          </h2>
          <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
            <p>
              To compute these key statistical summaries by hand, follow these structural steps:
            </p>
            <ol className="list-decimal pl-5 space-y-2.5">
              <li>
                <strong>Sort the Dataset</strong>: {"Order all numbers from smallest to largest:"}
                <div className="my-2 text-slate-800 dark:text-slate-200 font-mono text-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-900">
                  {"$$x_1 \\le x_2 \\le \\dots \\le x_n$$"}
                </div>
              </li>
              <li>
                <strong>{"Calculate the Sum ($\\sum x_i$)"}</strong>: Add every element in the dataset together.
              </li>
              <li>
                <strong>Find the Mean</strong>: {"Divide the total sum by the count of elements ($n$):"}
                <div className="my-2 text-slate-800 dark:text-slate-200 font-mono text-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-900">
                  {"$$\\mu = \\frac{\\sum_{i=1}^n x_i}{n}$$"}
                </div>
              </li>
              <li>
                <strong>Determine the Median</strong>:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>{"If $n$ is odd, the median is the value at index $\\frac{n+1}{2}$."}</li>
                  <li>{"If $n$ is even, the median is the arithmetic mean of the values at indices $\\frac{n}{2}$ and $\\frac{n}{2} + 1$."}</li>
                </ul>
              </li>
              <li>
                <strong>Identify the Mode</strong>: Count the frequency of each unique value. Identify the value(s) with the maximum count greater than 1.
              </li>
            </ol>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900/20 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
              <Sigma className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Advanced Mathematical Averages</span>
          </h2>
          <div className="space-y-6">
            <p className="text-slate-700 dark:text-slate-350 text-sm md:text-base leading-relaxed">
              Beyond simple averages, specialized situations require alternative formulations:
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  title: "Geometric Mean",
                  body: "Crucial for evaluating compound rates, financial returns, and exponential growths."
                },
                {
                  title: "Harmonic Mean",
                  body: "Ideal for averages of rates, such as speed (distance over time) or price-to-earnings ratios."
                },
                {
                  title: "Standard Deviation",
                  body: "Measures dispersion. Sample standard deviation ($s$) is used when working with a subset of a population, employing Bessel's correction ($n-1$ denominator) to reduce bias."
                }
              ].map(({ title, body }) => (
                <div
                  key={title}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{title}</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-400 text-sm leading-relaxed">
                    {title === "Standard Deviation" ? (
                      <span>{"Measures dispersion. Sample standard deviation ($s$) is used when working with a subset of a population, employing Bessel's correction ($n-1$ denominator) to reduce bias."}</span>
                    ) : body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: FAQ */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white dark:from-slate-900/30 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Frequently Asked Questions (FAQ)</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "What is the difference between sample and population standard deviation?",
                a: "Population standard deviation (\\sigma) assumes you have collected data from every single member of a group. Sample standard deviation (s) uses n-1 to account for sample uncertainty and estimate the wider population parameters accurately."
              },
              {
                q: "Why does the geometric mean fail with negative numbers or zeros?",
                a: "The geometric mean involves multiplying all numbers together and taking the n-th root, or taking the natural logarithm of each number. Since the logarithm of zero or negative numbers is undefined in real numbers, geometric averages cannot be computed for datasets with these values."
              },
              {
                q: "When should I use the median instead of the mean?",
                a: "Use the median when your dataset contains extreme outliers (such as real estate values or household incomes) that would skew the mean upward or downward, misrepresenting the \"typical\" average."
              }
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 dark:border-indigo-600 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/10 dark:to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Why TwisterTools */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl md:p-10 shadow-lg p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Why Use the TwisterTools Average Calculator?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Calculator,
                title: "Instant Multi-Metric Returns",
                body: "Get Mean, Median, Mode, Standard Deviation, Geometric, and Harmonic calculations instantly without loading separate tools."
              },
              {
                icon: Copy,
                title: "Flexible Copy Engines",
                body: "Easily copy any metric to your clipboard with single-click actions."
              },
              {
                icon: Shield,
                title: "Secure and Offline-First",
                body: "All data is processed in your browser using local TypeScript execution. No data is sent to external servers."
              },
              {
                icon: Info,
                title: "Data Distribution Visualizer",
                body: "Interactively visualize where the mean and median sit relative to min and max boundaries."
              },
              {
                icon: Sigma,
                title: "Frequency & Weights Support",
                body: "Easily compute weighted averages and sample variances by enabling frequencies mode."
              },
              {
                icon: CheckCircle,
                title: "Zero Server Footprint",
                body: "100% client-side execution makes it lightning fast, lightweight, and respects user privacy."
              }
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                <Icon className="w-5 h-5 text-indigo-250 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-indigo-200 text-xs mt-1 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* JSON-LD WebApplication & FAQPage Schema */}
      <div className="hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Average Calculator",
              description:
                "Free online average calculator to compute Arithmetic Mean, Median, Mode, Range, Geometric Mean, Harmonic Mean, Population Standard Deviation, and Sample Standard Deviation. Zero data transmission, computed locally.",
              url: "https://www.twistertools.com/tools/calculators/average-calculator",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Real-time Arithmetic Mean computation",
                "Sorted Median calculation supporting odd and even datasets",
                "Multi-modal Mode and Range detection",
                "Advanced Geometric and Harmonic Mean algorithms",
                "Sample and Population Standard Deviation calculations",
                "Interactive Data Distribution Visualizer",
                "Offline availability and client-side processing",
              ],
              author: {
                "@type": "Organization",
                name: "TwisterTools",
                url: "https://www.twistertools.com",
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
                  name: "What is the difference between sample and population standard deviation?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Population standard deviation (\u03c3) assumes you have collected data from every single member of a group. Sample standard deviation (s) uses n-1 to account for sample uncertainty and estimate the wider population parameters accurately.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Why does the geometric mean fail with negative numbers or zeros?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "The geometric mean involves multiplying all numbers together and taking the n-th root, or taking the natural logarithm of each number. Since the logarithm of zero or negative numbers is undefined in real numbers, geometric averages cannot be computed for datasets with these values.",
                  },
                },
                {
                  "@type": "Question",
                  name: "When should I use the median instead of the mean?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Use the median when your dataset contains extreme outliers (such as real estate values or household incomes) that would skew the mean upward or downward, misrepresenting the \"typical\" average.",
                  },
                },
              ],
            }),
          }}
        />
      </div>

    </div>
  );
}
