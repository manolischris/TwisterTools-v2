"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Calculator,
  Plus,
  Minus,
  X,
  Divide,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  PieChart,
  Table,
  HelpCircle,
  Sparkles,
  Sliders,
  Layers,
  CheckCircle2,
  Cpu,
  Zap,
  ShieldCheck,
  Compass,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// MATH & FRACTION ENGINE (PURE UTILITIES)
// ─────────────────────────────────────────────────────────────

/**
 * Calculates Greatest Common Divisor using Euclidean Algorithm
 */
function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x;
}

/**
 * Calculates Least Common Multiple
 */
function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / gcd(a, b));
}

export interface Fraction {
  n: number; // numerator
  d: number; // denominator
}

export interface StepDetail {
  title: string;
  expression: string;
  explanation: string;
}

export interface CalculationResult {
  rawNum: number;
  rawDen: number;
  simpNum: number;
  simpDen: number;
  whole: number;
  remNum: number;
  decimal: number;
  percentage: number;
  steps: StepDetail[];
  isError: boolean;
  errorMessage?: string;
}

/**
 * Normalizes fraction so denominator is always positive
 */
function normalizeFraction(n: number, d: number): Fraction {
  if (d < 0) {
    return { n: -n, d: -d };
  }
  return { n, d };
}

/**
 * Main Fraction Arithmetic & Step Generator Engine
 */
function computeFractionOperation(
  f1: Fraction,
  f2: Fraction,
  op: "+" | "-" | "*" | "/"
): CalculationResult {
  if (f1.d === 0 || f2.d === 0) {
    return {
      rawNum: 0,
      rawDen: 1,
      simpNum: 0,
      simpDen: 1,
      whole: 0,
      remNum: 0,
      decimal: 0,
      percentage: 0,
      steps: [],
      isError: true,
      errorMessage: "Denominator cannot be zero in any fraction.",
    };
  }

  const norm1 = normalizeFraction(f1.n, f1.d);
  const norm2 = normalizeFraction(f2.n, f2.d);

  let rawNum = 0;
  let rawDen = 1;
  const steps: StepDetail[] = [];

  if (op === "+" || op === "-") {
    const commonDen = lcm(norm1.d, norm2.d);
    const m1 = commonDen / norm1.d;
    const m2 = commonDen / norm2.d;
    const adjustedN1 = norm1.n * m1;
    const adjustedN2 = norm2.n * m2;

    rawDen = commonDen;
    rawNum = op === "+" ? adjustedN1 + adjustedN2 : adjustedN1 - adjustedN2;

    steps.push({
      title: "Find Common Denominator (LCD)",
      expression: `\\text{LCM}(${norm1.d}, ${norm2.d}) = ${commonDen}`,
      explanation: `Find the Least Common Multiple (LCM) of the denominators ${norm1.d} and ${norm2.d} to establish a common base.`,
    });

    steps.push({
      title: "Adjust Numerators to Equivalent Fractions",
      expression: `\\frac{${norm1.n} \\times ${m1}}{${commonDen}} ${op} \\frac{${norm2.n} \\times ${m2}}{${commonDen}} = \\frac{${adjustedN1}}{${commonDen}} ${op} \\frac{${adjustedN2}}{${commonDen}}`,
      explanation: `Convert both fractions to equivalent terms sharing the common denominator ${commonDen}.`,
    });

    steps.push({
      title: `Perform ${op === "+" ? "Addition" : "Subtraction"}`,
      expression: `\\frac{${adjustedN1} ${op} ${adjustedN2}}{${commonDen}} = \\frac{${rawNum}}{${rawDen}}`,
      explanation: `${op === "+" ? "Add" : "Subtract"} the scaled numerators while leaving the common denominator intact.`,
    });
  } else if (op === "*") {
    rawNum = norm1.n * norm2.n;
    rawDen = norm1.d * norm2.d;

    steps.push({
      title: "Multiply Numerators & Denominators Directly",
      expression: `\\frac{${norm1.n} \\times ${norm2.n}}{${norm1.d} \\times ${norm2.d}} = \\frac{${rawNum}}{${rawDen}}`,
      explanation: "Multiply top numbers straight across, and bottom numbers straight across.",
    });
  } else if (op === "/") {
    if (norm2.n === 0) {
      return {
        rawNum: 0,
        rawDen: 1,
        simpNum: 0,
        simpDen: 1,
        whole: 0,
        remNum: 0,
        decimal: 0,
        percentage: 0,
        steps: [],
        isError: true,
        errorMessage: "Cannot divide by a fraction with a numerator of 0.",
      };
    }

    rawNum = norm1.n * norm2.d;
    rawDen = norm1.d * norm2.n;
    const normalized = normalizeFraction(rawNum, rawDen);
    rawNum = normalized.n;
    rawDen = normalized.d;

    steps.push({
      title: "Invert Divisor and Multiply (Reciprocal Method)",
      expression: `\\frac{${norm1.n}}{${norm1.d}} \\times \\frac{${norm2.d}}{${norm2.n}} = \\frac{${norm1.n} \\times ${norm2.d}}{${norm1.d} \\times ${norm2.n}}`,
      explanation: `Invert the second fraction to its reciprocal (\\(\\frac{${norm2.d}}{${norm2.n}}\\)), then perform multiplication across numerators and denominators.`,
    });
  }

  // Reduction / Simplification
  const divisor = gcd(rawNum, rawDen);
  const simpNum = rawNum / divisor;
  const simpDen = rawDen / divisor;

  if (divisor > 1 || divisor < -1) {
    steps.push({
      title: "Simplify Result via Greatest Common Divisor (GCD)",
      expression: `\\text{GCD}(${Math.abs(rawNum)}, ${Math.abs(rawDen)}) = ${divisor} \\implies \\frac{${rawNum} \\div ${divisor}}{${rawDen} \\div ${divisor}} = \\frac{${simpNum}}{${simpDen}}`,
      explanation: `Divide both numerator and denominator by their Greatest Common Divisor (${divisor}) to reduce the fraction to lowest terms.`,
    });
  } else {
    steps.push({
      title: "Simplification Verification",
      expression: `\\text{GCD}(${Math.abs(rawNum)}, ${Math.abs(rawDen)}) = 1`,
      explanation: "The numerator and denominator are coprime; the fraction is already in fully reduced form.",
    });
  }

  // Mixed Number Extraction
  const whole = Math.trunc(simpNum / simpDen);
  const remNum = Math.abs(simpNum % simpDen);

  if (Math.abs(simpNum) >= simpDen && simpDen !== 1 && remNum !== 0) {
    steps.push({
      title: "Convert Improper Fraction to Mixed Number",
      expression: `\\frac{${simpNum}}{${simpDen}} = ${whole} \\; \\frac{${remNum}}{${simpDen}}`,
      explanation: `Divide the numerator by the denominator (${simpNum} ÷ ${simpDen}) to isolate the whole integer part and remaining fractional part.`,
    });
  }

  const decimal = simpNum / simpDen;
  const percentage = decimal * 100;

  return {
    rawNum,
    rawDen,
    simpNum,
    simpDen,
    whole,
    remNum,
    decimal,
    percentage,
    steps,
    isError: false,
  };
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function FractionCalculator() {
  // Inputs as strings for clean user interaction
  const [n1, setN1] = useState<string>("1");
  const [d1, setD1] = useState<string>("2");
  const [w1, setW1] = useState<string>("0");

  const [n2, setN2] = useState<string>("3");
  const [d2, setD2] = useState<string>("4");
  const [w2, setW2] = useState<string>("0");

  const [op, setOp] = useState<"+" | "-" | "*" | "/">("+");
  const [mode, setMode] = useState<"simple" | "mixed">("simple");
  const [copied, setCopied] = useState<boolean>(false);

  // Input Sanitizer
  const handleInputChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val === "" || val === "-") {
      setter(val);
      return;
    }
    val = val.replace(/(?!^-)[^0-9]/g, "");
    val = val.replace(/^(-?)0+(?=\d)/, "$1");
    setter(val);
  };

  // Convert inputs to numbers safely for computation
  const parsedValues = useMemo(() => {
    const parseNum = (val: string) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    let rawN1 = parseNum(n1);
    const rawD1 = parseNum(d1);
    const rawW1 = parseNum(w1);

    let rawN2 = parseNum(n2);
    const rawD2 = parseNum(d2);
    const rawW2 = parseNum(w2);

    if (mode === "mixed") {
      const sign1 = rawW1 < 0 || n1.startsWith("-") ? -1 : 1;
      rawN1 = sign1 * (Math.abs(rawW1) * Math.abs(rawD1) + Math.abs(rawN1));

      const sign2 = rawW2 < 0 || n2.startsWith("-") ? -1 : 1;
      rawN2 = sign2 * (Math.abs(rawW2) * Math.abs(rawD2) + Math.abs(rawN2));
    }

    return {
      f1: { n: rawN1, d: rawD1 },
      f2: { n: rawN2, d: rawD2 },
    };
  }, [n1, d1, w1, n2, d2, w2, mode]);

  // Execute Calculation Engine
  const result = useMemo(() => {
    return computeFractionOperation(parsedValues.f1, parsedValues.f2, op);
  }, [parsedValues, op]);

  // Reset helper
  const handleReset = () => {
    setN1("1");
    setD1("2");
    setW1("0");
    setN2("3");
    setD2("4");
    setW2("0");
    setOp("+");
    setMode("simple");
  };

  // Copy result string
  const handleCopyResult = useCallback(() => {
    if (result.isError) return;
    let resStr = `${result.simpNum}/${result.simpDen}`;
    if (result.whole !== 0 && result.remNum !== 0) {
      resStr += ` (${result.whole} ${result.remNum}/${result.simpDen})`;
    }
    resStr += ` = ${result.decimal}`;

    navigator.clipboard.writeText(resStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Workspace Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        
        {/* ══════════════════ LEFT PANEL: CONTROLS & INPUT ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center aspect-square flex-shrink-0">
                  <Calculator className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-tight">Fraction Workspace</h2>
                  <p className="text-xs text-indigo-100/80">Configure terms and operational mode</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Reset Workspace"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="p-5 space-y-6">
              
              {/* Mode Selector (Pill Style) */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode("simple")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all min-h-[40px] flex items-center justify-center gap-2 ${
                    mode === "simple"
                      ? "bg-white text-indigo-600 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  Simple Fractions
                </button>
                <button
                  type="button"
                  onClick={() => setMode("mixed")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all min-h-[40px] flex items-center justify-center gap-2 ${
                    mode === "mixed"
                      ? "bg-white text-indigo-600 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Mixed Numbers
                </button>
              </div>

              {/* Operator Selector Row */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Arithmetic Operator
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { symbol: "+", label: "Add", icon: Plus },
                    { symbol: "-", label: "Subtract", icon: Minus },
                    { symbol: "*", label: "Multiply", icon: X },
                    { symbol: "/", label: "Divide", icon: Divide },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = op === item.symbol;
                    return (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={() => setOp(item.symbol as "+" | "-" | "*" | "/")}
                        className={`py-2.5 px-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition-all border min-h-[52px] ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px] font-normal opacity-90">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fraction Inputs Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* First Fraction Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                    <span>First Term (Fraction A)</span>
                    <span className="text-indigo-600 font-mono">
                      {mode === "mixed" ? `${w1 || 0} ${n1 || 0}/${d1 || 1}` : `${n1 || 0}/${d1 || 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 justify-center py-2">
                    {mode === "mixed" && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-medium text-slate-500 mb-1">Whole</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={w1}
                          onChange={handleInputChange(setW1)}
                          className="w-16 h-12 text-center text-lg font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm text-slate-800"
                          placeholder="0"
                        />
                      </div>
                    )}

                    <div className="flex flex-col items-center space-y-1.5 flex-1 max-w-[120px]">
                      <span className="text-[10px] font-medium text-slate-500">Numerator</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={n1}
                        onChange={handleInputChange(setN1)}
                        className="w-full h-11 text-center text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm text-slate-800"
                        placeholder="1"
                      />
                      <div className="w-full h-0.5 bg-slate-400 rounded-full my-1"></div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={d1}
                        onChange={handleInputChange(setD1)}
                        className="w-full h-11 text-center text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm text-slate-800"
                        placeholder="2"
                      />
                      <span className="text-[10px] font-medium text-slate-500">Denominator</span>
                    </div>
                  </div>
                </div>

                {/* Second Fraction Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                    <span>Second Term (Fraction B)</span>
                    <span className="text-indigo-600 font-mono">
                      {mode === "mixed" ? `${w2 || 0} ${n2 || 0}/${d2 || 1}` : `${n2 || 0}/${d2 || 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 justify-center py-2">
                    {mode === "mixed" && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-medium text-slate-500 mb-1">Whole</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={w2}
                          onChange={handleInputChange(setW2)}
                          className="w-16 h-12 text-center text-lg font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm text-slate-800"
                          placeholder="0"
                        />
                      </div>
                    )}

                    <div className="flex flex-col items-center space-y-1.5 flex-1 max-w-[120px]">
                      <span className="text-[10px] font-medium text-slate-500">Numerator</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={n2}
                        onChange={handleInputChange(setN2)}
                        className="w-full h-11 text-center text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm text-slate-800"
                        placeholder="3"
                      />
                      <div className="w-full h-0.5 bg-slate-400 rounded-full my-1"></div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={d2}
                        onChange={handleInputChange(setD2)}
                        className="w-full h-11 text-center text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm text-slate-800"
                        placeholder="4"
                      />
                      <span className="text-[10px] font-medium text-slate-500">Denominator</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: RESULTS & STEPS ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            
            {/* Edge Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">Calculation Results & Solution</span>
              </div>
            </div>

            <div className="p-5 space-y-5">
              
              {result.isError ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 animate-ping"></div>
                  <span>{result.errorMessage}</span>
                </div>
              ) : (
                <>
                  {/* Result Showcase Card */}
                  <div className="bg-gradient-to-br from-indigo-50/80 via-slate-50 to-indigo-50/30 border border-indigo-100 rounded-2xl p-5 shadow-sm text-center relative">
                    <button
                      onClick={handleCopyResult}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                      title="Copy Full Result"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                      Simplified Reduced Result
                    </p>

                    <div className="flex items-center justify-center gap-4 py-2">
                      {/* Mixed representation if applicable */}
                      {result.whole !== 0 && result.remNum !== 0 && (
                        <div className="flex items-center gap-1.5 text-3xl font-extrabold text-slate-900">
                          <span>{result.whole}</span>
                          <div className="inline-flex flex-col items-center text-xl text-indigo-600">
                            <span>{result.remNum}</span>
                            <div className="w-full h-0.5 bg-indigo-500 my-0.5"></div>
                            <span>{result.simpDen}</span>
                          </div>
                          <span className="text-slate-400 text-xl font-normal mx-1">=</span>
                        </div>
                      )}

                      {/* Standard Improper / Proper Fraction Display */}
                      <div className="inline-flex flex-col items-center">
                        <span className="text-3xl md:text-4xl font-black text-indigo-600">{result.simpNum}</span>
                        <div className="w-16 h-1 bg-indigo-600 rounded-full my-1"></div>
                        <span className="text-3xl md:text-4xl font-black text-indigo-600">{result.simpDen}</span>
                      </div>
                    </div>

                    {/* Secondary Equivalents Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/80">
                      <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/60">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                          Decimal Equivalent
                        </span>
                        <span className="text-base font-bold text-slate-800 font-mono">
                          {Number.isInteger(result.decimal) ? result.decimal : result.decimal.toFixed(6).replace(/\.?0+$/, "")}
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/60">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                          Percentage
                        </span>
                        <span className="text-base font-bold text-slate-800 font-mono">
                          {result.percentage.toFixed(4).replace(/\.?0+$/, "")}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Step-by-Step Breakdown Accordion/Cards */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Step-by-Step Solution Breakdown
                    </h3>

                    <div className="space-y-2.5">
                      {result.steps.map((st, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 text-xs md:text-sm">{st.title}</span>
                          </div>
                          <div className="pl-7">
                            <p className="text-xs font-mono font-semibold text-indigo-900 bg-white border border-slate-200/80 inline-block px-2.5 py-1 rounded-md my-1">
                              {st.expression}
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{st.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK (RICH INFORMATIONAL MODULES)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        
        {/* Card 1: Fundamental Mathematical Definitions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <PieChart className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Comprehensive Foundations of Fractional Arithmetic</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              A fraction represents a numerical relationship expressing part of a whole, formally written in rational form as $a/b$, where $a$ is the <strong>numerator</strong> (representing the count of equal parts) and $b$ is the non-zero <strong>denominator</strong> (representing the total number of parts into which the whole is divided).
            </p>
            <p>
              Depending on the mathematical relationship between $a$ and $b$, fractions are categorized into distinct structural classes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Proper Fractions:</strong> Fractions where the numerator is strictly less than the denominator (|a| less than |b|), such as 3/5 or 7/12. These always evaluate to a decimal magnitude less than 1.
              </li>
              <li>
                <strong>Improper Fractions:</strong> Fractions where the numerator is greater than or equal to the denominator (|a| greater than or equal to |b|), such as 11/4 or 9/9. These evaluate to a magnitude greater than or equal to 1.
              </li>
              <li>
                <strong>Mixed Numbers:</strong> An alternate notation combining a non-zero integer whole number with a proper fraction, written as W + n/d. For instance, 2 3/4 is equivalent to 11/4.
              </li>
              <li>
                <strong>Equivalent Fractions:</strong> Distinct fractional representations that denote identical rational values, derived by multiplying or dividing both terms by a common non-zero scalar (a/b = (k*a)/(k*b)).
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2: Operational Mechanics & Worked Algebraic Examples */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Operational Mechanics & Worked Algebraic Examples</span>
          </h2>
          <div className="space-y-6 text-slate-700 text-sm md:text-base leading-relaxed">
            
            {/* Addition / Subtraction worked example */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                1. Addition & Subtraction (Least Common Denominator Method)
              </h3>
              <p>
                To add or subtract fractions with unequal denominators, terms must be mapped onto a shared base using the <strong>Least Common Multiple (LCM)</strong>.
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs md:text-sm text-indigo-950">
                <strong>Example:</strong> Evaluate 2/3 + 3/4<br />
                • Step 1: Find LCM(3, 4) = 12<br />
                • Step 2: Scale terms: (2*4)/(3*4) = 8/12 and (3*3)/(4*3) = 9/12<br />
                • Step 3: Combine numerators: (8 + 9)/12 = 17/12 = 1 5/12
              </div>
            </div>

            {/* Multiplication worked example */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <X className="w-4 h-4 text-indigo-600" />
                2. Multiplication (Linear Component Product)
              </h3>
              <p>
                Fraction multiplication requires no common denominator. Numerators multiply across directly, as do denominators: (a/b) * (c/d) = (a*c)/(b*d).
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs md:text-sm text-indigo-950">
                <strong>Example:</strong> Evaluate 5/6 * 3/8<br />
                • Step 1: Multiply components: (5*3)/(6*8) = 15/48<br />
                • Step 2: Reduce via GCD(15, 48) = 3: (15/3)/(48/3) = 5/16
              </div>
            </div>

            {/* Division worked example */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Divide className="w-4 h-4 text-indigo-600" />
                3. Division (Invert and Multiply Rule)
              </h3>
              <p>
                Dividing by a fraction is algebraically identical to multiplying by its reciprocal: (a/b) / (c/d) = (a/b) * (d/c).
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs md:text-sm text-indigo-950">
                <strong>Example:</strong> Evaluate 7/10 / 2/5<br />
                • Step 1: Invert divisor: 2/5 becomes 5/2<br />
                • Step 2: Multiply across: (7*5)/(10*2) = 35/20<br />
                • Step 3: Reduce via GCD(35, 20) = 5: 7/4 = 1 3/4
              </div>
            </div>

          </div>
        </div>

        {/* Card 3: Exact Algorithmic Reduction via Euclidean GCD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Step-by-Step Reduction & Euclidean GCD Simplification</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Simplifying a fraction to its lowest terms involves reducing the numerator a and denominator b by their <strong>Greatest Common Divisor (GCD)</strong>. The Euclidean Algorithm executes this in logarithmic time O(log(min(a,b))).
            </p>
            <div className="grid md:grid-cols-3 gap-4 my-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  1. Euclidean Modulo
                </h3>
                <p className="text-xs text-slate-600">
                  Compute r = a mod b. Reassign a to b, and b to r, iteratively until remainder r = 0.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  2. Coprime Reduction
                </h3>
                <p className="text-xs text-slate-600">
                  Divide original numerator and denominator by GCD(a, b). The resulting integers are fully reduced coprimes.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  3. Mixed Conversion
                </h3>
                <p className="text-xs text-slate-600">
                  If reduced a is greater than b, isolate whole quotient W = floor(a / b) and remainder R = a mod b for mixed notation W R/b.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Master Fraction Conversion Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Master Fraction Conversion Reference Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The reference table below displays standard fractional increments, simplified lowest forms, decimal equivalents, and exact percentage conversions across engineering, carpentry, and financial standards:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-xs uppercase tracking-wider font-bold">
                  <th className="p-3.5 border-b border-slate-200">Unreduced Term</th>
                  <th className="p-3.5 border-b border-slate-200">Irreducible Form</th>
                  <th className="p-3.5 border-b border-slate-200">Mixed Number</th>
                  <th className="p-3.5 border-b border-slate-200">Decimal Equivalent</th>
                  <th className="p-3.5 border-b border-slate-200">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs md:text-sm font-mono text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="p-3.5">2/4</td>
                  <td className="p-3.5 font-bold text-indigo-600">1/2</td>
                  <td className="p-3.5 text-slate-400">—</td>
                  <td className="p-3.5">0.50</td>
                  <td className="p-3.5">50.0%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3.5">4/12</td>
                  <td className="p-3.5 font-bold text-indigo-600">1/3</td>
                  <td className="p-3.5 text-slate-400">—</td>
                  <td className="p-3.5">0.333333...</td>
                  <td className="p-3.5">33.33%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3.5">6/8</td>
                  <td className="p-3.5 font-bold text-indigo-600">3/4</td>
                  <td className="p-3.5 text-slate-400">—</td>
                  <td className="p-3.5">0.75</td>
                  <td className="p-3.5">75.0%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3.5">10/8</td>
                  <td className="p-3.5 font-bold text-indigo-600">5/4</td>
                  <td className="p-3.5 font-bold text-slate-800">1 1/4</td>
                  <td className="p-3.5">1.25</td>
                  <td className="p-3.5">125.0%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3.5">18/12</td>
                  <td className="p-3.5 font-bold text-indigo-600">3/2</td>
                  <td className="p-3.5 font-bold text-slate-800">1 1/2</td>
                  <td className="p-3.5">1.50</td>
                  <td className="p-3.5">150.0%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3.5">16/5</td>
                  <td className="p-3.5 font-bold text-indigo-600">16/5</td>
                  <td className="p-3.5 font-bold text-slate-800">3 1/5</td>
                  <td className="p-3.5">3.20</td>
                  <td className="p-3.5">320.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 5: Real-World Applications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Compass className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Practical Real-World Applications of Fraction Calculations</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Carpentry & Imperial Architectural Measurements
              </h3>
              <p className="text-xs text-slate-600">
                Architectural blueprints and woodworking diagrams use fractional inch increments (1/16, 1/8, 1/4, 1/2). Calculating stock dimensions or adjusting cut lists requires adding and subtracting mixed fractional values with precision.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Culinary Recipe Scaling & Kitchen Conversions
              </h3>
              <p className="text-xs text-slate-600">
                Scaling batch yields up or down requires multiplying ingredient ratios (for example, multiplying 3/4 cup by a 2 1/2 batch factor), then converting improper outputs back to manageable mixed numbers.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Financial Portfolio Ratios & Equity Distribution
              </h3>
              <p className="text-xs text-slate-600">
                Asset allocation, dividend distribution models, and equity cap tables use rational fractions to represent proportional ownership slices before converting to percentage values.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Engineering Mechanics & Gear Ratios
              </h3>
              <p className="text-xs text-slate-600">
                Mechanical gear ratios (N1/N2) and electrical impedance matching rely on fully reduced coprime fractions to calculate torque multipliers and rotational frequency transforms.
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: Static FAQ Block (STRICT NO ACCORDION) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-bold text-slate-800 text-base mb-2">
                What is the difference between a proper, improper, and mixed fraction?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                A <strong>proper fraction</strong> has a numerator strictly smaller than its denominator (e.g., $3/4$). An <strong>improper fraction</strong> has a numerator equal to or larger than its denominator (e.g., $7/4$). A <strong>mixed number</strong> combines an integer whole number with a proper fraction (e.g., $1 \; 3/4$).
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-bold text-slate-800 text-base mb-2">
                How does this calculator simplify fractions automatically?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                The engine calculates the Greatest Common Divisor (GCD) of the calculated numerator and denominator using the Euclidean algorithm, then divides both terms by this factor to output the irreducible lowest form.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-bold text-slate-800 text-base mb-2">
                Can I perform calculations with negative fractions or mixed terms?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Yes. Negative signs are fully supported on numerators, whole integer inputs, and denominators. Selecting "Mixed Numbers" mode allows seamless computation across whole numbers and fractional terms.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-bold text-slate-800 text-base mb-2">
                Why can a fraction denominator never equal zero?
              </h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                In mathematical analysis, division by zero is undefined. The denominator specifies into how many parts a whole is split; dividing an object into zero parts is logically impossible and yields an indeterminate result.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* Structured JSON-LD Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Fraction Calculator & Simplifier",
            applicationCategory: "EducationalApplication",
            operatingSystem: "All",
            description:
              "Free online browser-native fraction calculator. Add, subtract, multiply, and divide fractions or mixed numbers with step-by-step mathematical solutions, GCD simplification, and decimal conversions.",
            url: "https://twistertools.com/tools/calculators/fraction-calculator",
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
                name: "What is the difference between a proper, improper, and mixed fraction?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A proper fraction has a numerator smaller than its denominator. An improper fraction has a numerator larger than or equal to its denominator. A mixed number combines a whole integer with a proper fraction.",
                },
              },
              {
                "@type": "Question",
                name: "How does this calculator simplify fractions automatically?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The engine finds the Greatest Common Divisor (GCD) using the Euclidean algorithm and divides numerator and denominator by that value.",
                },
              },
              {
                "@type": "Question",
                name: "Can I perform calculations with negative fractions or mixed terms?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, negative values are fully supported across all terms and modes.",
                },
              },
              {
                "@type": "Question",
                name: "Why can a fraction denominator never equal zero?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Division by zero is mathematically undefined because a whole cannot be divided into zero equal equal shares.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}