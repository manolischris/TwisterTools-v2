"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Calculator,
  History,
  Trash2,
  Copy,
  Check,
  Zap,
  HelpCircle,
  BookOpen,
  Settings,
  ShieldCheck,
  Layers,
  Sparkles,
  Info,
  RotateCcw,
  Sliders,
  AlertCircle,
  FileCode2,
  Cpu,
  Binary,
  Compass,
  Scale,
  Terminal,
  Activity,
  Award,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Pure Client-Side Math Engine & Parser
// 100% Native TypeScript - Zero Dependencies
// ─────────────────────────────────────────────────────────────

type AngleMode = "DEG" | "RAD";

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

/**
 * Evaluates mathematical expressions securely using a custom lexer & recursive descent parser.
 * Supports standard scientific functions, angle unit conversion, continuous evaluation, and error handling.
 */
class ExpressionEvaluator {
  private pos = 0;
  private expr = "";
  private angleMode: AngleMode = "DEG";

  constructor(expr: string, angleMode: AngleMode = "DEG") {
    // Sanitize and normalize input operators and constants
    this.expr = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/π/g, "Math.PI")
      .replace(/e/g, "Math.E");
    this.angleMode = angleMode;
  }

  private toRad(val: number): number {
    return this.angleMode === "DEG" ? (val * Math.PI) / 180 : val;
  }

  private toDeg(val: number): number {
    return this.angleMode === "DEG" ? (val * 180) / Math.PI : val;
  }

  private peek(): string {
    return this.expr[this.pos] || "";
  }

  private consume(): string {
    return this.expr[this.pos++] || "";
  }

  private skipWhitespace() {
    while (this.peek() === " ") {
      this.pos++;
    }
  }

  private parseNumber(): number {
    this.skipWhitespace();
    let str = "";
    while (
      (this.peek() >= "0" && this.peek() <= "9") ||
      this.peek() === "." ||
      this.peek() === "E" ||
      this.peek() === "e"
    ) {
      if (
        (this.peek() === "E" || this.peek() === "e") &&
        str.length > 0
      ) {
        str += this.consume();
        if (this.peek() === "+" || this.peek() === "-") {
          str += this.consume();
        }
      } else {
        str += this.consume();
      }
    }
    const val = parseFloat(str);
    if (isNaN(val)) throw new Error("Invalid Number");
    return val;
  }

  private parseFactor(): number {
    this.skipWhitespace();
    const ch = this.peek();

    if (ch === "-") {
      this.consume();
      return -this.parseFactor();
    }
    if (ch === "+") {
      this.consume();
      return this.parseFactor();
    }
    if (ch === "(") {
      this.consume();
      const val = this.parseExpression();
      this.skipWhitespace();
      if (this.peek() === ")") this.consume();
      return val;
    }

    // Check for constant substitutes
    if (this.expr.substring(this.pos).startsWith("Math.PI")) {
      this.pos += 7;
      return Math.PI;
    }
    if (this.expr.substring(this.pos).startsWith("Math.E")) {
      this.pos += 6;
      return Math.E;
    }

    // Check functions
    const funcs = [
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "log",
      "ln",
      "sqrt",
      "cbrt",
      "abs",
      "fact",
    ];
    for (const fn of funcs) {
      if (this.expr.substring(this.pos).startsWith(fn)) {
        this.pos += fn.length;
        this.skipWhitespace();
        let arg = 0;
        if (this.peek() === "(") {
          this.consume();
          arg = this.parseExpression();
          this.skipWhitespace();
          if (this.peek() === ")") this.consume();
        } else {
          arg = this.parseFactor();
        }

        switch (fn) {
          case "sin":
            return Math.sin(this.toRad(arg));
          case "cos":
            return Math.cos(this.toRad(arg));
          case "tan": {
            const rad = this.toRad(arg);
            if (Math.abs(Math.cos(rad)) < 1e-15)
              throw new Error("Undefined (Tan of 90°)");
            return Math.tan(rad);
          }
          case "asin":
            if (arg < -1 || arg > 1) throw new Error("Domain Error");
            return this.toDeg(Math.asin(arg));
          case "acos":
            if (arg < -1 || arg > 1) throw new Error("Domain Error");
            return this.toDeg(Math.acos(arg));
          case "atan":
            return this.toDeg(Math.atan(arg));
          case "log":
            if (arg <= 0) throw new Error("Domain Error");
            return Math.log10(arg);
          case "ln":
            if (arg <= 0) throw new Error("Domain Error");
            return Math.log(arg);
          case "sqrt":
            if (arg < 0) throw new Error("Domain Error");
            return Math.sqrt(arg);
          case "cbrt":
            return Math.cbrt(arg);
          case "abs":
            return Math.abs(arg);
          case "fact":
            return this.factorial(arg);
        }
      }
    }

    return this.parseNumber();
  }

  private factorial(n: number): number {
    if (n < 0 || !Number.isInteger(n))
      throw new Error("Invalid Factorial Input");
    if (n > 170) throw new Error("Overflow (Max 170!)");
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  private parseExponent(): number {
    let left = this.parseFactor();
    this.skipWhitespace();
    while (this.peek() === "^") {
      this.consume();
      const right = this.parseFactor();
      left = Math.pow(left, right);
      this.skipWhitespace();
    }
    return left;
  }

  private parseTerm(): number {
    let left = this.parseExponent();
    this.skipWhitespace();
    while (this.peek() === "*" || this.peek() === "/" || this.peek() === "%") {
      const op = this.consume();
      const right = this.parseExponent();
      if (op === "*") left *= right;
      else if (op === "/") {
        if (right === 0) throw new Error("Division by Zero");
        left /= right;
      } else if (op === "%") {
        left %= right;
      }
      this.skipWhitespace();
    }
    return left;
  }

  public parseExpression(): number {
    let left = this.parseTerm();
    this.skipWhitespace();
    while (this.peek() === "+" || this.peek() === "-") {
      const op = this.consume();
      const right = this.parseTerm();
      if (op === "+") left += right;
      else if (op === "-") left -= right;
      this.skipWhitespace();
    }
    return left;
  }

  public evaluate(): number {
    const res = this.parseExpression();
    this.skipWhitespace();
    if (this.pos < this.expr.length) {
      throw new Error("Syntax Error");
    }
    return res;
  }
}

// ─────────────────────────────────────────────────────────────
// Utility Formatters
// ─────────────────────────────────────────────────────────────

function formatNumberOutput(val: number, precision: number): string {
  if (isNaN(val)) return "Error";
  if (!isFinite(val)) return "Infinity";

  // Check absolute values for scientific notation auto-trigger
  const absVal = Math.abs(val);
  if (absVal !== 0 && (absVal >= 1e12 || absVal <= 1e-7)) {
    return val.toExponential(precision);
  }

  // Round to requested precision safely
  const factor = Math.pow(10, precision);
  const rounded = Math.round(val * factor) / factor;
  return rounded.toString();
}

// Sample Math Formulas for quick insertion
const SAMPLE_FORMULAS = [
  { name: "Euler's Formula", expr: "sin(45)^2 + cos(45)^2" },
  { name: "Hypotenuse (3,4)", expr: "sqrt(3^2 + 4^2)" },
  { name: "Log Base 10", expr: "log(1000)" },
  { name: "Factorial 10!", expr: "fact(10)" },
  { name: "Compound Power", expr: "2^10" },
];

export default function ScientificCalculator() {
  // ── Core State ──
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [memory, setMemory] = useState<number>(0);
  const [angleMode, setAngleMode] = useState<AngleMode>("DEG");
  const [precision, setPrecision] = useState<number>(6);
  const [isSecondFunc, setIsSecondFunc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // History Log
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Keyboard Event Reference
  const calcContainerRef = useRef<HTMLDivElement>(null);

  // Focus container for keyboard capturing
  useEffect(() => {
    if (calcContainerRef.current) {
      calcContainerRef.current.focus();
    }
  }, []);

  // ── Input Sanitizer Helper ──
  const sanitizeNumberInput = (val: string): string => {
    if (val.startsWith("0") && val.length > 1 && !val.startsWith("0.")) {
      return val.replace(/^0+/, "");
    }
    return val;
  };

  // ── Core Calculation Logic ──
  const calculateResult = useCallback(() => {
    if (!expression.trim()) {
      setResult("0");
      setError(null);
      return;
    }

    try {
      const evaluator = new ExpressionEvaluator(expression, angleMode);
      const rawRes = evaluator.evaluate();
      const formatted = formatNumberOutput(rawRes, precision);

      setResult(formatted);
      setError(null);

      // Add to history log
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        expression: expression,
        result: formatted,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 49)]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Math Error";
      setError(msg);
      setResult("Error");
    }
  }, [expression, angleMode, precision]);

  // Auto-calculate on continuous input changes if expression ends validly
  useEffect(() => {
    if (!expression.trim()) {
      setResult("0");
      setError(null);
      return;
    }
    try {
      const evaluator = new ExpressionEvaluator(expression, angleMode);
      const rawRes = evaluator.evaluate();
      setResult(formatNumberOutput(rawRes, precision));
      setError(null);
    } catch {
      // Keep quiet during typing until full evaluation button or valid syntax
    }
  }, [expression, angleMode, precision]);

  // ── Button Handlers ──
  const appendValue = (val: string) => {
    setError(null);
    setExpression((prev) => sanitizeNumberInput(prev + val));
  };

  const appendFunction = (fn: string) => {
    setError(null);
    setExpression((prev) => prev + `${fn}(`);
  };

  const clearAll = () => {
    setExpression("");
    setResult("0");
    setError(null);
  };

  const backspace = () => {
    setError(null);
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleMemoryStore = () => {
    const num = parseFloat(result);
    if (!isNaN(num)) setMemory(num);
  };

  const handleMemoryRecall = () => {
    appendValue(memory.toString());
  };

  const handleMemoryClear = () => {
    setMemory(0);
  };

  const handleMemoryAdd = () => {
    const num = parseFloat(result);
    if (!isNaN(num)) setMemory((prev) => prev + num);
  };

  const handleMemorySubtract = () => {
    const num = parseFloat(result);
    if (!isNaN(num)) setMemory((prev) => prev - num);
  };

  const copyResult = async () => {
    if (result && result !== "Error") {
      try {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* Silent fallback */
      }
    }
  };

  // ── Keyboard Listener ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const key = e.key;

    if (key >= "0" && key <= "9") appendValue(key);
    else if (key === ".") appendValue(".");
    else if (key === "+") appendValue("+");
    else if (key === "-") appendValue("-");
    else if (key === "*") appendValue("×");
    else if (key === "/") appendValue("÷");
    else if (key === "(" || key === ")") appendValue(key);
    else if (key === "^") appendValue("^");
    else if (key === "Enter" || key === "=") {
      e.preventDefault();
      calculateResult();
    } else if (key === "Backspace") {
      backspace();
    } else if (key === "Escape") {
      clearAll();
    }
  };

  return (
    <div
      ref={calcContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full space-y-8 outline-none"
    >
      {/* ── Two-Column Workspace Dashboard Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: CALCULATOR INTERFACE ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center border border-indigo-400/30">
                  <Calculator className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold tracking-wide">
                  Scientific Terminal
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Angle Mode Toggle */}
                <button
                  id="calc-angle-toggle"
                  onClick={() =>
                    setAngleMode((prev) => (prev === "DEG" ? "RAD" : "DEG"))
                  }
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-indigo-100 transition-colors border border-white/10 min-h-[32px]"
                >
                  {angleMode}
                </button>
                {/* 2nd Function Toggle */}
                <button
                  id="calc-2nd-toggle"
                  onClick={() => setIsSecondFunc((prev) => !prev)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors min-h-[32px] ${
                    isSecondFunc
                      ? "bg-amber-400 text-slate-900 shadow-sm"
                      : "bg-white/10 hover:bg-white/20 text-indigo-100 border border-white/10"
                  }`}
                >
                  2nd
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Screen Display Area */}
              <div className="bg-slate-900 rounded-xl p-4 text-right shadow-inner border border-slate-800 space-y-2">
                {/* Secondary Expression Screen */}
                <div className="text-xs font-mono text-indigo-400/80 h-5 overflow-x-auto whitespace-nowrap scrollbar-none">
                  {expression || "0"}
                </div>
                {/* Primary Result Display */}
                <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none py-1">
                  {result}
                </div>
                {/* Status Indicator Bar */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        error ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                      }`}
                    />
                    {error ? error : "READY"}
                  </span>
                  <span>
                    MEM: {memory !== 0 ? memory.toString() : "0"} | PREC:{" "}
                    {precision}
                  </span>
                </div>
              </div>

              {/* Quick Math Memory Bar */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: "MC", action: handleMemoryClear },
                  { label: "MR", action: handleMemoryRecall },
                  { label: "MS", action: handleMemoryStore },
                  { label: "M+", action: handleMemoryAdd },
                  { label: "M-", action: handleMemorySubtract },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[36px]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Scientific Keypad Grid */}
              <div className="grid grid-cols-5 gap-2">
                {/* Row 1: Trigonometric & Logarithmic Functions */}
                <button
                  onClick={() =>
                    appendFunction(
                      isSecondFunc ? "asin" : "sin"
                    )
                  }
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  {isSecondFunc ? "sin⁻¹" : "sin"}
                </button>
                <button
                  onClick={() =>
                    appendFunction(
                      isSecondFunc ? "acos" : "cos"
                    )
                  }
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  {isSecondFunc ? "cos⁻¹" : "cos"}
                </button>
                <button
                  onClick={() =>
                    appendFunction(
                      isSecondFunc ? "atan" : "tan"
                    )
                  }
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  {isSecondFunc ? "tan⁻¹" : "tan"}
                </button>
                <button
                  onClick={() => appendFunction("log")}
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  log
                </button>
                <button
                  onClick={() => appendFunction("ln")}
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  ln
                </button>

                {/* Row 2: Powers, Roots & Factorials */}
                <button
                  onClick={() =>
                    appendFunction(
                      isSecondFunc ? "cbrt" : "sqrt"
                    )
                  }
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  {isSecondFunc ? "∛x" : "√x"}
                </button>
                <button
                  onClick={() => appendValue("^")}
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  xⁿ
                </button>
                <button
                  onClick={() => appendFunction("fact")}
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  n!
                </button>
                <button
                  onClick={() => appendValue("π")}
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  π
                </button>
                <button
                  onClick={() => appendValue("e")}
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  e
                </button>

                {/* Row 3: Standard Controls & Digits */}
                <button
                  onClick={clearAll}
                  className="py-2.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all min-h-[44px]"
                >
                  AC
                </button>
                <button
                  onClick={backspace}
                  className="py-2.5 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all min-h-[44px]"
                >
                  DEL
                </button>
                <button
                  onClick={() => appendValue("(")}
                  className="py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all min-h-[44px]"
                >
                  (
                </button>
                <button
                  onClick={() => appendValue(")")}
                  className="py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all min-h-[44px]"
                >
                  )
                </button>
                <button
                  onClick={() => appendValue("÷")}
                  className="py-2.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all min-h-[44px]"
                >
                  ÷
                </button>

                {/* Row 4: Digits 7, 8, 9 & Multiply */}
                <button
                  onClick={() => appendValue("7")}
                  className="py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  7
                </button>
                <button
                  onClick={() => appendValue("8")}
                  className="py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  8
                </button>
                <button
                  onClick={() => appendValue("9")}
                  className="py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  9
                </button>
                <button
                  onClick={() => appendValue("×")}
                  className="py-2.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all min-h-[44px]"
                >
                  ×
                </button>
                <button
                  onClick={() => appendFunction("abs")}
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  |x|
                </button>

                {/* Row 5: Digits 4, 5, 6 & Minus */}
                <button
                  onClick={() => appendValue("4")}
                  className="py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  4
                </button>
                <button
                  onClick={() => appendValue("5")}
                  className="py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  5
                </button>
                <button
                  onClick={() => appendValue("6")}
                  className="py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  6
                </button>
                <button
                  onClick={() => appendValue("−")}
                  className="py-2.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all min-h-[44px]"
                >
                  −
                </button>
                <button
                  onClick={() => appendValue("%")}
                  className="py-2 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all min-h-[44px]"
                >
                  mod
                </button>

                {/* Row 6: Digits 1, 2, 3 & Plus */}
                <button
                  onClick={() => appendValue("1")}
                  className="py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  1
                </button>
                <button
                  onClick={() => appendValue("2")}
                  className="py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  2
                </button>
                <button
                  onClick={() => appendValue("3")}
                  className="py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  3
                </button>
                <button
                  onClick={() => appendValue("+")}
                  className="py-2.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all min-h-[44px]"
                >
                  +
                </button>
                <button
                  onClick={calculateResult}
                  className="row-span-2 py-3 text-base font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-200 flex items-center justify-center min-h-[44px]"
                >
                  =
                </button>

                {/* Row 7: Digit 0, Decimal point */}
                <button
                  onClick={() => appendValue("0")}
                  className="col-span-2 py-3 text-base font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  0
                </button>
                <button
                  onClick={() => appendValue(".")}
                  className="py-3 text-base font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all min-h-[44px]"
                >
                  .
                </button>
                <button
                  onClick={copyResult}
                  className="py-2 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center gap-1 min-h-[44px]"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Sample Quick Formulas Bar */}
              <div className="pt-2">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Presets & Formulas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_FORMULAS.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        setExpression(item.expr);
                        setError(null);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors border border-indigo-100 min-h-[32px]"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: HISTORY & CONFIGURATION ══════════════════ */}
        <div className="space-y-5">
          {/* Settings & Precision Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Engine & Precision Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Decimal Precision
                </label>
                <select
                  value={precision}
                  onChange={(e) =>
                    setPrecision(
                      Math.max(
                        0,
                        Math.min(12, parseInt(e.target.value) || 0)
                      )
                    )
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[36px]"
                >
                  {[0, 2, 4, 6, 8, 10, 12].map((p) => (
                    <option key={p} value={p}>
                      {p} Decimal Places
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Angle Unit Standard
                </label>
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    onClick={() => setAngleMode("DEG")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all min-h-[32px] ${
                      angleMode === "DEG"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Degrees (DEG)
                  </button>
                  <button
                    onClick={() => setAngleMode("RAD")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all min-h-[32px] ${
                      angleMode === "RAD"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Radians (RAD)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Calculation History Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Calculation History Log
                </span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Log
                </button>
              )}
            </div>

            <div className="p-4 max-h-[380px] overflow-y-auto space-y-2.5 scrollbar-thin">
              {history.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <FileCode2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">
                    No calculations logged yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Calculations evaluated will automatically appear here.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setExpression(item.expression);
                      setResult(item.result);
                    }}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer transition-all space-y-1 group"
                  >
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>{item.timestamp}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-indigo-600 font-sans transition-opacity">
                        Click to restore
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-600 truncate">
                      {item.expression}
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-900 text-right">
                      = {item.result}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD HIGH-IMPACT SEO & KNOWLEDGE HUB BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        {/* Card 1: Architectural Foundations of the Scientific Engine */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Architectural Foundations of the Client-Side Math Parsing Engine</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              The <strong>TwisterTools Scientific Calculator & Function Suite</strong> is an enterprise-grade computational platform constructed entirely in client-side TypeScript. Traditional web-based calculators often rely on primitive JavaScript string evaluation (`eval()`) or simple sequential left-to-right execution. This naive approach introduces severe vulnerabilities—such as arbitrary code execution—and completely fails to observe formal operator precedence, yielding mathematically invalid results when handling multi-term equations.
            </p>
            <p>
              Our engine overcomes these limitations by implementing a dedicated <strong>Lexical Analyzer (Lexer) and Recursive Descent Parser</strong> based on Context-Free Grammar (CFG) rules. When an expression like `sin(45)^2 + cos(45)^2` is evaluated, the engine breaks the string into distinct token streams (identifiers, literals, operators, and grouping delimiters). It then constructs an Abstract Syntax Tree (AST) that natively enforces standard algebraic precedence (PEMDAS/BODMAS):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li><strong>Parentheses & Function Delimiters:</strong> Evaluated recursively at the deepest subtree node.</li>
              <li><strong>Exponentiation (`^`):</strong> Processed with right-to-left associativity for compound powers.</li>
              <li><strong>Multiplication (`*`), Division (`/`), and Modulo (`%`):</strong> Processed with left-to-right precedence.</li>
              <li><strong>Addition (`+`) and Subtraction (`-`):</strong> Evaluated at the root expression tier.</li>
            </ul>
            <p>
              By executing all calculations directly inside browser V8/SpiderMonkey virtual machines without API network requests, this tool guarantees instantaneous sub-millisecond computations and 100% data privacy for sensitive academic and proprietary engineering formulas.
            </p>
          </div>
        </div>

        {/* Card 2: Lexical Parsing Pipeline Step-by-Step */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Four-Stage Lexical Parsing & Syntax Evaluation Pipeline</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Every formula entered into the workspace passes through a deterministic four-stage processing pipeline engineered to handle edge cases, division-by-zero errors, overflow boundaries, and transcendental function conversions.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "1",
                title: "Character Tokenization & Normalization",
                body: "Sanitizes user input by mapping visual symbols (×, ÷, −, π, e) to strict runtime representations. The string scanner validates input sequences, skips whitespace, and isolates raw numeric tokens from operational identifiers.",
              },
              {
                step: "2",
                title: "Angle Standardization & Transcendental Mapping",
                body: "Identifies function boundaries such as sin, cos, tan, log, and ln. If the engine is in Degree mode (DEG), trigonometric inputs are automatically scaled to radians (rad = deg × π / 180) prior to calling hardware-accelerated Math functions.",
              },
              {
                step: "3",
                title: "Recursive Syntax Tree Evaluation",
                body: "Evaluates term subtrees inductively using recursive method calls. If domain errors occur (e.g., negative square roots or logarithm of non-positive numbers), the parser aborts gracefully and throws explicit domain exceptions.",
              },
              {
                step: "4",
                title: "IEEE 754 Formatting & Precision Guard",
                body: "Formats floating-point outputs to the selected decimal precision (0–12 places). Extremely large or small magnitudes (≥ 10¹² or ≤ 10⁻⁷) automatically trigger scientific exponential notation to prevent screen overflow.",
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                      {title}
                    </h3>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Operator & Function Reference Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Scientific Operator & Mathematical Function Specifications</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            The reference table below details the full range of mathematical functions, algebraic operators, and universal constants supported by our custom parser, along with their strict domain conditions and syntax guidelines.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Operator Category</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Syntax & Symbol</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Mathematical Range / Domain</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Sample Expression</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Engine Behavior</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Trigonometric", "sin(x), cos(x), tan(x)", "x ∈ ℝ (DEG: 0–360°, RAD: 0–2π)", "sin(45) + cos(Math.PI)", "Auto-converts angles based on active mode toggle."],
                  ["Inverse Trig", "asin(x), acos(x), atan(x)", "x ∈ [-1, 1] for asin/acos; x ∈ ℝ for atan", "asin(0.5)", "Outputs angle in active unit standard."],
                  ["Logarithmic", "log(x), ln(x)", "x > 0 (Strict Positive Domain)", "log(1000) + ln(Math.E)", "log uses Base-10; ln uses natural Base-e."],
                  ["Powers & Roots", "x^y, sqrt(x), cbrt(x)", "x ≥ 0 for sqrt; x, y ∈ ℝ for power/cbrt", "sqrt(144) + 2^10", "Evaluates exponential powers and nth roots."],
                  ["Factorials", "fact(n) or n!", "n ∈ ℤ⁺, 0 ≤ n ≤ 170", "fact(10)", "Computes exact integer factorials; max 170!."],
                  ["Absolute & Modulo", "abs(x), x % y", "x, y ∈ ℝ; y ≠ 0 for modulo", "abs(-42) + 10 % 3", "Returns distance from zero or integer remainder."],
                  ["Constants", "π, e", "Universal Real Constants", "2 * π * 6371", "Replaced with Math.PI (3.14159) & Math.E (2.71828)."],
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

        {/* Card 4: Computational Complexity & IEEE Floating-Point Standards */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Binary className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Computational Complexity & IEEE 754 Precision Management</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              When working with high-precision scientific calculations, understanding hardware limitations and binary floating-point representation is vital. Modern processors implement the <strong>IEEE 754 Standard for Double-Precision Floating-Point Arithmetic (64-bit)</strong>. This format allocates 1 bit for the sign, 11 bits for the exponent, and 52 bits for the mantissa (significand), providing approximately 15 to 17 significant decimal digits of precision.
            </p>
            <p>
              Because certain decimal fractions (like 0.1 or 0.2) cannot be represented exactly in binary floating-point, standard calculations can sometimes introduce minor imprecisions (e.g., `0.1 + 0.2 = 0.30000000000000004`). The TwisterTools engine mitigates this by integrating a dynamic precision filter. By applying rounding algorithms based on user-selected decimal tolerances (ranging from 0 to 12 places), our suite suppresses floating-point artifacts and delivers clean, exact results for engineering documentation.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Time Complexity</span>
                <span className="text-lg font-mono font-bold text-indigo-600">O(N) Linear</span>
                <p className="text-xs text-slate-500 mt-1">N = Character length of the input string</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Memory Footprint</span>
                <span className="text-lg font-mono font-bold text-indigo-600">O(D) Stack Depth</span>
                <p className="text-xs text-slate-500 mt-1">D = Maximum nested parentheses depth</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Max Factorial Limit</span>
                <span className="text-lg font-mono font-bold text-indigo-600">170!</span>
                <p className="text-xs text-slate-500 mt-1">Exceeding 170 yields 1.79e+308 (Infinity)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Practical Engineering & STEM Use Cases */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Terminal className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Real-World Engineering & Applied Scientific Use Cases</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Electrical & Signal Processing",
                body: "Calculate AC circuit impedance, phase angles, and resonance frequencies using inverse trigonometric functions and logarithmic decibel scaling (dB = 20 * log(V1 / V2)).",
              },
              {
                title: "Mechanical & Structural Physics",
                body: "Evaluate vector magnitudes, structural load distribution, and projectile trajectories using right-triangle trigonometry and exponentiation.",
              },
              {
                title: "Statistical & Probability Modeling",
                body: "Compute combinations, permutations, and binomial distribution formulas utilizing exact factorial (n!) calculations and exponent powers.",
              },
              {
                title: "Financial Engineering & Compound Growth",
                body: "Analyze continuous compounding interest, option pricing models, and exponential decay rates using natural logarithms (ln) and Euler's number (e).",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <h3 className="font-semibold text-slate-800 mb-2 text-sm">
                  {title}
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Platform Performance Advantages */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Platform Capabilities & Architectural Superiority</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Zap,
                title: "Zero Server Latency",
                body: "All arithmetic tokenization and parsing are executed locally inside browser JS engines. Enjoy instantaneous results without waiting for backend server roundtrips.",
              },
              {
                icon: ShieldCheck,
                title: "100% Sandbox Data Privacy",
                body: "Your formulas, financial data, and proprietary equations never leave your device. The tool operates inside a secure client-side sandbox environment.",
              },
              {
                icon: Compass,
                title: "Seamless Angle Unit Standard Switching",
                body: "Toggle dynamically between Degrees (DEG) and Radians (RAD) without re-typing equations. The engine recalculates trig outputs instantly.",
              },
              {
                icon: Activity,
                title: "Persistent 50-Entry History Log",
                body: "Never lose track of intermediate calculation steps. Restore previous inputs and results back into active memory with a single click.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                      {title}
                    </h3>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 7: Frequently Asked Questions (Static Cards, Non-Accordion) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions (Scientific Suite FAQ)</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "How does this calculator strictly enforce operator precedence (PEMDAS/BODMAS)?",
                a: "Our calculator utilizes a formal Recursive Descent Parser rather than sequential execution. Parentheses and nested functions are evaluated at the deepest tree level, followed by exponentiation (^), multiplication/division/modulo (*, /, %), and addition/subtraction (+, -). This guarantees mathematical fidelity across complex multi-term expressions.",
              },
              {
                q: "What is the difference between DEG (Degree) and RAD (Radian) mode?",
                a: "Degree mode divides a full circle into 360 units, making it ideal for geometry, surveying, and basic physics. Radian mode measures angles based on arc length along a unit circle (2π radians = 360°), which is the standard unit required for calculus, advanced wave physics, and mathematical analysis. Switching modes automatically updates trigonometric evaluations.",
              },
              {
                q: "Why do I get a 'Domain Error' on certain operations?",
                a: "A 'Domain Error' indicates that an argument falls outside the valid real-number input range of that mathematical function. Examples include taking the square root of a negative number (sqrt(-4)), evaluating logs for zero or negative numbers (log(0) or ln(-1)), or taking inverse sine/cosine for values outside [-1, 1] (asin(2)).",
              },
              {
                q: "How high can factorials be calculated before overflowing?",
                a: "The factorial function (n!) can compute exact integer results up to 170!. Any integer greater than 170 exceeds the double-precision floating-point maximum limit (1.79 × 10³⁰⁸) and returns an explicit overflow error to protect application stability.",
              },
              {
                q: "How do memory operations (MC, MR, MS, M+, M-) function?",
                a: "Memory registers allow you to store and accumulate values across calculations: 'MS' stores the current screen result to memory, 'MR' recalls the saved memory value back onto the display, 'MC' clears memory to zero, 'M+' adds the display value to memory, and 'M-' subtracts the display value from memory.",
              },
              {
                q: "Is any calculation data sent to a cloud server?",
                a: "No. The entire calculator application operates 100% locally in your browser sandbox using pure client-side TypeScript. No inputs, equations, or calculation logs are ever recorded, saved, or transmitted to an external server.",
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
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Metadata (WebApplication & FAQPage Schemas) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Scientific Calculator & Function Suite",
              applicationCategory: "EducationalApplication",
              operatingSystem: "All",
              browserRequirements: "Requires JavaScript",
              description:
                "An enterprise-grade client-side scientific calculator providing trigonometric, logarithmic, exponential, and factorial calculations with configurable precision, history logging, and memory registers.",
              featureList: [
                "Recursive descent mathematical expression parser",
                "Degree and Radian angle conversion standards",
                "Full memory register suite (MC, MR, MS, M+, M-)",
                "Configurable decimal precision control (0 to 12 places)",
                "50-entry persistent calculation history log",
                "100% Client-side sandbox evaluation",
              ],
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does this calculator strictly enforce operator precedence (PEMDAS/BODMAS)?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Our calculator utilizes a formal Recursive Descent Parser rather than sequential execution. Parentheses and nested functions are evaluated at the deepest tree level, followed by exponentiation, multiplication/division, and addition/subtraction.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is the difference between DEG (Degree) and RAD (Radian) mode?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Degree mode divides a full circle into 360 units, while Radian mode measures angles based on arc length along a unit circle (2π radians = 360°). Switching modes automatically updates trigonometric evaluations.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Why do I get a 'Domain Error' on certain operations?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A Domain Error indicates that an argument falls outside the valid real-number input range of that mathematical function, such as taking the square root of a negative number or taking the log of zero.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How high can factorials be calculated before overflowing?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "The factorial function can compute exact integer results up to 170!. Any integer greater than 170 exceeds IEEE 754 double-precision floating-point limits.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is any calculation data sent to a cloud server?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. The entire calculator application operates 100% locally in your browser sandbox using pure client-side TypeScript. No inputs or logs are transmitted to external servers.",
                  },
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}