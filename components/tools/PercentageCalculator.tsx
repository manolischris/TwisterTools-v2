"use client";

import { useState } from "react";
import {
  BookOpen,
  HelpCircle,
  Briefcase,
  ShieldCheck,
  Copy,
  Check,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from "lucide-react";
import { cn } from "@/components/utils";

// ─────────────────────────────────────────────────────────────
//  Numeric Input Helper Component
// ─────────────────────────────────────────────────────────────
interface NumericInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

function NumericInput({
  id,
  label,
  value,
  onChange,
  placeholder = "0",
  prefix,
  suffix,
  onFocus,
  onBlur,
}: NumericInputProps) {
  return (
    <div className="flex-1 min-w-[120px] space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider"
      >
        {label}
      </label>
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-indigo-600 focus-within:bg-white">
        {prefix && (
          <span className="text-sm font-semibold text-slate-500 select-none mr-2">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          step="any"
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            const cleaned = raw.replace(/^0+(?=\d)/, "");
            onChange(cleaned);
          }}
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          className="bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none w-full text-base font-semibold px-0 py-0"
        />
        {suffix && (
          <span className="text-sm font-semibold text-slate-500 select-none ml-2">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Precision Helper
// ─────────────────────────────────────────────────────────────
function formatResult(num: number): string {
  if (isNaN(num) || !isFinite(num)) return "-";
  // Format up to 6 decimal places and remove trailing zeros
  return Number(num.toFixed(6)).toString();
}

export default function PercentageCalculator() {
  // Master Card Focus States
  const [focusedCard, setFocusedCard] = useState<number | null>(null);

  // Per-calculator copy states
  const [copiedStates, setCopiedStates] = useState<{ [key: number]: boolean }>({});

  // ── States for Calculator 1 ──
  const [calc1X, setCalc1X] = useState("");
  const [calc1Y, setCalc1Y] = useState("");

  // ── States for Calculator 2 ──
  const [calc2X, setCalc2X] = useState("");
  const [calc2Y, setCalc2Y] = useState("");

  // ── States for Calculator 3 ──
  const [calc3X, setCalc3X] = useState("");
  const [calc3Y, setCalc3Y] = useState("");

  // ── States for Calculator 4 ──
  const [calc4X, setCalc4X] = useState("");
  const [calc4Y, setCalc4Y] = useState("");
  const [calc4Op, setCalc4Op] = useState<"add" | "subtract">("add");

  // ── States for Calculator 5 ──
  const [calc5X, setCalc5X] = useState("");
  const [calc5Y, setCalc5Y] = useState("");

  // ── Copy Helper ──
  const copyToClipboard = async (text: string, index: number) => {
    if (!text || text === "-") return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [index]: false }));
      }, 2000);
    } catch {
      /* silent */
    }
  };

  // ── Master Reset ──
  const handleResetAll = () => {
    setCalc1X("");
    setCalc1Y("");
    setCalc2X("");
    setCalc2Y("");
    setCalc3X("");
    setCalc3Y("");
    setCalc4X("");
    setCalc4Y("");
    setCalc4Op("add");
    setCalc5X("");
    setCalc5Y("");
  };

  // ─────────────────────────────────────────────────────────────
  //  Calculator Logic Computations
  // ─────────────────────────────────────────────────────────────

  // Calculator 1: What is X% of Y?
  const num1X = parseFloat(calc1X);
  const num1Y = parseFloat(calc1Y);
  const has1 = !isNaN(num1X) && !isNaN(num1Y) && calc1X !== "" && calc1Y !== "";
  const res1 = has1 ? (num1X / 100) * num1Y : null;
  const res1Formatted = res1 !== null ? formatResult(res1) : "-";
  const formula1 = has1
    ? `(${calc1X} / 100) × ${calc1Y} = ${res1Formatted}`
    : "Formula: (X / 100) × Y";

  // Calculator 2: X is what percentage of Y?
  const num2X = parseFloat(calc2X);
  const num2Y = parseFloat(calc2Y);
  const has2 = !isNaN(num2X) && !isNaN(num2Y) && calc2X !== "" && calc2Y !== "";
  const isDivZero2 = has2 && num2Y === 0;
  const res2 = has2 && !isDivZero2 ? (num2X / num2Y) * 100 : null;
  const res2Formatted = res2 !== null ? `${formatResult(res2)}%` : "-";
  const formula2 = has2
    ? isDivZero2
      ? "Cannot divide by zero (Y is 0)"
      : `(${calc2X} / ${calc2Y}) × 100 = ${res2Formatted}`
    : "Formula: (X / Y) × 100";

  // Calculator 3: Percent change from X to Y
  const num3X = parseFloat(calc3X);
  const num3Y = parseFloat(calc3Y);
  const has3 = !isNaN(num3X) && !isNaN(num3Y) && calc3X !== "" && calc3Y !== "";
  const isDivZero3 = has3 && num3X === 0;
  const res3 = has3 && !isDivZero3 ? ((num3Y - num3X) / num3X) * 100 : null;
  const res3Formatted = res3 !== null ? `${res3 > 0 ? "+" : ""}${formatResult(res3)}%` : "-";
  const formula3 = has3
    ? isDivZero3
      ? "Cannot divide by zero (Initial X is 0)"
      : `((${calc3Y} - ${calc3X}) / ${calc3X}) × 100 = ${res3Formatted}`
    : "Formula: ((Y - X) / X) × 100";

  // Calculator 4: Add or subtract X% to/from Y
  const num4X = parseFloat(calc4X);
  const num4Y = parseFloat(calc4Y);
  const has4 = !isNaN(num4X) && !isNaN(num4Y) && calc4X !== "" && calc4Y !== "";
  const res4 = has4
    ? calc4Op === "add"
      ? num4Y * (1 + num4X / 100)
      : num4Y * (1 - num4X / 100)
    : null;
  const res4Formatted = res4 !== null ? formatResult(res4) : "-";
  const opSymbol = calc4Op === "add" ? "+" : "-";
  const formula4 = has4
    ? `${calc4Y} × (1 ${opSymbol} (${calc4X} / 100)) = ${res4Formatted}`
    : `Formula: Y × (1 ${opSymbol} (X / 100))`;

  // Calculator 5: Fraction to Percentage Converter (X / Y)
  const num5X = parseFloat(calc5X);
  const num5Y = parseFloat(calc5Y);
  const has5 = !isNaN(num5X) && !isNaN(num5Y) && calc5X !== "" && calc5Y !== "";
  const isDivZero5 = has5 && num5Y === 0;
  const res5 = has5 && !isDivZero5 ? (num5X / num5Y) * 100 : null;
  const res5Formatted = res5 !== null ? `${formatResult(res5)}%` : "-";
  const formula5 = has5
    ? isDivZero5
      ? "Cannot divide by zero (Denominator Y is 0)"
      : `(${calc5X} / ${calc5Y}) × 100 = ${res5Formatted}`
    : "Formula: (X / Y) × 100";

  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Grid Dashboard ── */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* ══════════════════ LEFT PANEL — 8 columns ══════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Find the Percentage of a Value */}
          <div
            className={cn(
              "transition-all duration-300 rounded-2xl border p-6 shadow-sm bg-white",
              focusedCard === 1
                ? "border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-50"
                : "border-slate-200"
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold border border-indigo-100">
                01
              </span>
              <h3 className="text-base font-bold text-slate-800">
                Find the Percentage of a Value
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <NumericInput
                id="calc1-percentage"
                label="Percentage (X)"
                value={calc1X}
                onChange={setCalc1X}
                placeholder="15"
                suffix="%"
                onFocus={() => setFocusedCard(1)}
                onBlur={() => setFocusedCard(null)}
              />
              <NumericInput
                id="calc1-value"
                label="Base Value (Y)"
                value={calc1Y}
                onChange={setCalc1Y}
                placeholder="200"
                prefix="of"
                onFocus={() => setFocusedCard(1)}
                onBlur={() => setFocusedCard(null)}
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Result
                </span>
                <div className="text-2xl font-extrabold text-slate-900">
                  {res1Formatted}
                </div>
                <div className="text-xs text-slate-500 font-mono">{formula1}</div>
              </div>
              <button
                onClick={() => copyToClipboard(res1Formatted, 1)}
                disabled={!has1}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border w-full sm:w-auto",
                  has1
                    ? copiedStates[1]
                      ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                      : "bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    : "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed"
                )}
              >
                {copiedStates[1] ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600 animate-scaleIn" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Result
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Find the Percentage Proportion */}
          <div
            className={cn(
              "transition-all duration-300 rounded-2xl border p-6 shadow-sm bg-white",
              focusedCard === 2
                ? "border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-50"
                : "border-slate-200"
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold border border-indigo-100">
                02
              </span>
              <h3 className="text-base font-bold text-slate-800">
                Find the Percentage Proportion
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <NumericInput
                id="calc2-portion"
                label="Portion Value (X)"
                value={calc2X}
                onChange={setCalc2X}
                placeholder="30"
                onFocus={() => setFocusedCard(2)}
                onBlur={() => setFocusedCard(null)}
              />
              <NumericInput
                id="calc2-total"
                label="Total Value (Y)"
                value={calc2Y}
                onChange={setCalc2Y}
                placeholder="120"
                prefix="is what % of"
                onFocus={() => setFocusedCard(2)}
                onBlur={() => setFocusedCard(null)}
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Percentage Proportion
                </span>
                <div className="text-2xl font-extrabold text-indigo-600">
                  {res2Formatted}
                </div>
                <div className="text-xs text-slate-500 font-mono">{formula2}</div>
              </div>
              <button
                onClick={() => copyToClipboard(res2Formatted, 2)}
                disabled={!has2 || isDivZero2}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border w-full sm:w-auto",
                  has2 && !isDivZero2
                    ? copiedStates[2]
                      ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                      : "bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    : "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed"
                )}
              >
                {copiedStates[2] ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600 animate-scaleIn" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Result
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Percentage Increase / Decrease */}
          <div
            className={cn(
              "transition-all duration-300 rounded-2xl border p-6 shadow-sm bg-white",
              focusedCard === 3
                ? "border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-50"
                : "border-slate-200"
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold border border-indigo-100">
                03
              </span>
              <h3 className="text-base font-bold text-slate-800">
                Percentage Increase / Decrease
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <NumericInput
                id="calc3-initial"
                label="Initial Value (X)"
                value={calc3X}
                onChange={setCalc3X}
                placeholder="50"
                onFocus={() => setFocusedCard(3)}
                onBlur={() => setFocusedCard(null)}
              />
              <NumericInput
                id="calc3-final"
                label="Final Value (Y)"
                value={calc3Y}
                onChange={setCalc3Y}
                placeholder="75"
                prefix="change to"
                onFocus={() => setFocusedCard(3)}
                onBlur={() => setFocusedCard(null)}
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  Percentage Change
                  {has3 && !isDivZero3 && (
                    <>
                      {res3 !== null && res3 > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Increase
                        </span>
                      )}
                      {res3 !== null && res3 < 0 && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          Decrease
                        </span>
                      )}
                      {res3 === 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-800 border border-slate-300">
                          No Change
                        </span>
                      )}
                    </>
                  )}
                </span>
                <div
                  className={cn(
                    "text-2xl font-extrabold",
                    has3 && !isDivZero3
                      ? res3 !== null && res3 > 0
                        ? "text-emerald-600"
                        : res3 !== null && res3 < 0
                        ? "text-rose-600"
                        : "text-slate-800"
                      : "text-slate-900"
                  )}
                >
                  {res3Formatted}
                </div>
                <div className="text-xs text-slate-500 font-mono">{formula3}</div>
              </div>
              <button
                onClick={() => copyToClipboard(res3Formatted, 3)}
                disabled={!has3 || isDivZero3}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border w-full sm:w-auto",
                  has3 && !isDivZero3
                    ? copiedStates[3]
                      ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                      : "bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    : "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed"
                )}
              >
                {copiedStates[3] ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600 animate-scaleIn" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Result
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 4: Value Adjustment by Percentage */}
          <div
            className={cn(
              "transition-all duration-300 rounded-2xl border p-6 shadow-sm bg-white",
              focusedCard === 4
                ? "border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-50"
                : "border-slate-200"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold border border-indigo-100">
                  04
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  Value Adjustment by Percentage
                </h3>
              </div>

              {/* Add/Subtract Segmented Control */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/50 self-start sm:self-auto">
                <button
                  onClick={() => setCalc4Op("add")}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-xs font-bold transition-all",
                    calc4Op === "add"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-indigo-600"
                  )}
                >
                  Add (+)
                </button>
                <button
                  onClick={() => setCalc4Op("subtract")}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-xs font-bold transition-all",
                    calc4Op === "subtract"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-indigo-600"
                  )}
                >
                  Subtract (-)
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <NumericInput
                id="calc4-value"
                label="Base Value (Y)"
                value={calc4Y}
                onChange={setCalc4Y}
                placeholder="100"
                onFocus={() => setFocusedCard(4)}
                onBlur={() => setFocusedCard(null)}
              />
              <NumericInput
                id="calc4-percentage"
                label="Percentage to Adjust (X)"
                value={calc4X}
                onChange={setCalc4X}
                placeholder="10"
                suffix="%"
                onFocus={() => setFocusedCard(4)}
                onBlur={() => setFocusedCard(null)}
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Adjusted Value
                </span>
                <div className="text-2xl font-extrabold text-slate-900">
                  {res4Formatted}
                </div>
                <div className="text-xs text-slate-500 font-mono">{formula4}</div>
              </div>
              <button
                onClick={() => copyToClipboard(res4Formatted, 4)}
                disabled={!has4}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border w-full sm:w-auto",
                  has4
                    ? copiedStates[4]
                      ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                      : "bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    : "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed"
                )}
              >
                {copiedStates[4] ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600 animate-scaleIn" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Result
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 5: Fraction to Percentage Converter */}
          <div
            className={cn(
              "transition-all duration-300 rounded-2xl border p-6 shadow-sm bg-white",
              focusedCard === 5
                ? "border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-50"
                : "border-slate-200"
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold border border-indigo-100">
                05
              </span>
              <h3 className="text-base font-bold text-slate-800">
                Fraction to Percentage Converter
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <NumericInput
                id="calc5-numerator"
                label="Numerator (X)"
                value={calc5X}
                onChange={setCalc5X}
                placeholder="3"
                onFocus={() => setFocusedCard(5)}
                onBlur={() => setFocusedCard(null)}
              />
              <NumericInput
                id="calc5-denominator"
                label="Denominator (Y)"
                value={calc5Y}
                onChange={setCalc5Y}
                placeholder="4"
                prefix="divided by"
                onFocus={() => setFocusedCard(5)}
                onBlur={() => setFocusedCard(null)}
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Percentage Value
                </span>
                <div className="text-2xl font-extrabold text-slate-900">
                  {res5Formatted}
                </div>
                <div className="text-xs text-slate-500 font-mono">{formula5}</div>
              </div>
              <button
                onClick={() => copyToClipboard(res5Formatted, 5)}
                disabled={!has5 || isDivZero5}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border w-full sm:w-auto",
                  has5 && !isDivZero5
                    ? copiedStates[5]
                      ? "bg-green-50 text-green-700 border-green-200 shadow-sm"
                      : "bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    : "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed"
                )}
              >
                {copiedStates[5] ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600 animate-scaleIn" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Result
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL — 4 columns, sticky ══════════════════ */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          {/* Card: Master Reset and Cheat Sheet */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 flex items-center justify-between border-b border-slate-700">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-400" />
                Quick Reference
              </span>
              <button
                onClick={handleResetAll}
                className="flex items-center gap-1 px-3 py-2.5 bg-red-955/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-900/50 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-200"
                title="Reset all inputs across all modules"
              >
                <Trash2 className="w-3 h-3" />
                Reset All
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Percentages Cheat Sheet
                </h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Common fractional portions converted to percentages and decimals:
                </p>
                <div className="overflow-hidden border border-slate-200 rounded-xl mt-2">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-3.5 py-2 font-bold uppercase tracking-wider text-[9px] text-slate-500 w-1/3">
                          Fraction
                        </th>
                        <th className="px-3.5 py-2 font-bold uppercase tracking-wider text-[9px] text-slate-500 w-1/3">
                          Percent
                        </th>
                        <th className="px-3.5 py-2 font-bold uppercase tracking-wider text-[9px] text-slate-500 w-1/3">
                          Decimal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                      {[
                        { f: "1/10", p: "10%", d: "0.1" },
                        { f: "1/8", p: "12.5%", d: "0.125" },
                        { f: "1/5", p: "20%", d: "0.2" },
                        { f: "1/4", p: "25%", d: "0.25" },
                        { f: "1/3", p: "33.33%", d: "0.3333" },
                        { f: "1/2", p: "50%", d: "0.5" },
                        { f: "2/3", p: "66.67%", d: "0.6667" },
                        { f: "3/4", p: "75%", d: "0.75" },
                        { f: "1/1", p: "100%", d: "1.0" },
                      ].map((row, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                        >
                          <td className="px-3.5 py-1.5 font-bold text-slate-600">{row.f}</td>
                          <td className="px-3.5 py-1.5 text-indigo-600 font-bold">{row.p}</td>
                          <td className="px-3.5 py-1.5 text-slate-500">{row.d}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Algebraic Formulas Reference */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Formula Index
            </h3>
            <div className="space-y-3 text-xs leading-normal">
              {[
                { label: "1. Portion (Portion of Value)", formula: "P = (X / 100) × Y" },
                { label: "2. Ratio (Percentage Proportion)", formula: "P = (X / Y) × 100" },
                { label: "3. Change (Percent Incr/Decr)", formula: "P = ((Y - X) / X) × 100" },
                { label: "4. Adjust (Value adjustment)", formula: "V = Y × (1 ± X / 100)" },
                { label: "5. Convert (Fraction to %)", formula: "P = (X / Y) × 100" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1 py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-slate-600 font-medium text-[11px]">
                    {item.label}
                  </span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-150 self-start text-[10px]">
                    {item.formula}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCKS (MD5-STANDARD COPY PRESERVATION)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        {/* CARD 1: What Is a Percentage Calculator */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Understanding Percentages in Mathematics</span>
          </h2>
          <div className="space-y-4 text-slate-700">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              A percentage represents a fraction of 100. The term originates from the Latin &quot;per centum,&quot; meaning &quot;by the hundred.&quot; Mathematically, a percentage is a dimensionless ratio where the denominator is always fixed to 100. It provides a standardized framework for comparing ratios, growth rates, and proportion variations across unequal datasets.
            </p>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Our Percentage Calculator eliminates manual arithmetic errors by providing five specialized algebraic processors in a single workspace. By utilizing high-precision client-side floating-point execution, this tool delivers instant math transformations for financial analysts, researchers, students, and retail consumers alike.
            </p>
          </div>
        </div>

        {/* CARD 2: Detailed How-to-Use Guide */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Step-by-Step Practical Calculation Guide</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                step: "1",
                title: "Select Your Equation Type",
                body: "Identify whether you need to find a portion, calculate a percentage proportion, find a rate of change, add/subtract a mark-up, or convert a fraction.",
              },
              {
                step: "2",
                title: "Enter Your Values",
                body: "Input your primary values. Inputs accept integers and decimals. Negative numbers are fully supported for rate of change and growth analysis.",
              },
              {
                step: "3",
                title: "Observe Real-Time Outputs",
                body: "Results are updated instantly with each keystroke. Calculations are completed entirely inside your browser's V8 Javascript engine.",
              },
              {
                step: "4",
                title: "Examine Visual Explanations",
                body: "Each calculation module displays the explicit formula structure beneath it, showing how the final output was mathematically formulated.",
              },
              {
                step: "5",
                title: "Copy Results with One Click",
                body: "Utilize the integrated clipboard copy buttons to copy precise calculated values directly to your local clipboard instantly.",
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-normal">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 3: Real-World Business Use Cases */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Industry Use Cases &amp; Application</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Retail & E-Commerce Discounting",
                body: "Calculate final promotional prices during sales campaigns. Easily find original values from markdown percentages or calculate markups for product margins.",
              },
              {
                title: "Financial Investment & Portfolio Analysis",
                body: "Compute annualized growth rates, stock market gains, dividend yields, inflation effects, and portfolio rebalancing percentages.",
              },
              {
                title: "SaaS Metric Tracking",
                body: "Track key performance indicators (KPIs) like customer churn rate, subscription growth percentages, and monthly recurring revenue (MRR) expansion ratios.",
              },
              {
                title: "Academic Chemistry & Physics Lab Work",
                body: "Determine percentage yields, percent errors in experimental tests, solute-to-solvent concentrations, and mass-to-volume percentage ratios.",
              },
              {
                title: "Real Estate & Mortgage Planning",
                body: "Calculate interest rates, down payments, loan-to-value (LTV) ratios, property tax percentages, and real estate agent commission fee distributions.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  <h3 className="font-semibold text-slate-800 text-sm">
                    {title}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 4: Frequently Asked Questions */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Percentage Calculation FAQ</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "What is the difference between percentage change and percentage point?",
                a: "Percentage change represents the relative rate of change between two values over time (e.g., an increase from 10% to 15% is a 50% increase). A percentage point refers to the absolute arithmetic difference between the percentages themselves (an increase from 10% to 15% is a 5 percentage point increase).",
              },
              {
                q: "How does the calculator handle division by zero?",
                a: "The calculation engine checks all denominators and bases. If a value of zero is entered in an equation that requires division (such as proportion or rate of change), the tool safely bypasses the calculation, blocks the infinity error, and renders a clean placeholder string until a valid number is supplied.",
              },
              {
                q: "Are my numeric inputs secure?",
                a: "Yes. Because all computations are executed within your browser using local client-side memory, no data is sent to external servers or databases. Your proprietary financial, scientific, or mathematical variables remain entirely private.",
              },
              {
                q: "How do I convert a percentage back to a decimal or fraction?",
                a: "To convert a percentage back to a decimal, divide the percentage value by 100 (e.g., 75% becomes 0.75). To convert it to a fraction, place the percent value over a denominator of 100 and simplify (e.g., 75% becomes 75/100, which simplifies down to 3/4).",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 5: High-Performance Mathematical Engine */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span>High-Performance Mathematical Engine</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Instant client-side execution with zero-latency response times.",
              "Zero server dependency ensures complete offline functional availability.",
              "Dynamic error handling guards against division-by-zero math errors.",
              "Built-in algebraic formulas explicitly documented beneath every single card.",
              "Clean, advertisement-free layouts optimized for professional workstations.",
              "Fully compatible across desktop viewports, mobile screens, and tablet interfaces.",
            ].map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <p className="text-indigo-100 text-xs leading-relaxed">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD WebApplication Schema */}
      <div className="hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Percentage Calculator",
              description:
                "Free online percentage calculator with five specialized algebraic processors, offering dynamic real-time calculations entirely client-side. Zero latency, division-by-zero handling, and offline availability.",
              url: "https://www.twistertools.com/tools/calculators/percentage-calculator",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Find the percentage of a value",
                "Find percentage proportions (portion out of total)",
                "Calculate percentage increase or decrease over values",
                "Adjust base values upwards or downwards by percentage variables",
                "Convert generic fractions into standard percentages",
                "Mathematical safety handling division-by-zero errors gracefully",
                "One-click Copy Result options with visual success checkmarks",
                "Common fractions-to-percentages reference lookup cheat sheet",
                "Fully client-side browser performance with zero data transmission",
              ],
              author: {
                "@type": "Organization",
                name: "TwisterTools",
                url: "https://www.twistertools.com",
              },
            }),
          }}
        />
      </div>
    </div>
  );
}
