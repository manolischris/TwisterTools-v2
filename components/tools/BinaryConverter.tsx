"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Binary,
  Cpu,
  ShieldCheck,
  Copy,
  Check,
  Trash2,
  Sparkles,
  AlertCircle,
  ArrowRightLeft,
  HelpCircle,
  Activity,
  Code,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript Base Conversion Engine (BigInt-backed)
// ─────────────────────────────────────────────────────────────

interface ConversionResult {
  output: string;
  error?: string;
}

// Helper to sanitize/filter input according to selected mode
function sanitizeInput(value: string, filterType: "binary" | "decimal" | "hex" | "ascii" | "none"): string {
  if (filterType === "binary") {
    return value.replace(/[^01\s]/g, "");
  }
  if (filterType === "decimal") {
    return value.replace(/[^0-9]/g, ""); // Allow only clean continuous decimals
  }
  if (filterType === "hex") {
    return value.replace(/[^0-9a-fA-F\s]/g, "");
  }
  if (filterType === "ascii") {
    return value.replace(/[^0-9\s]/g, ""); // ASCII codes are space-separated integers
  }
  return value; // No filtering for generic text
}

// Core calculation matrix
function performConversion(
  input: string,
  mode: "text-ascii" | "decimal" | "hexadecimal",
  direction: string
): ConversionResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: "" };
  }

  try {
    // ── TEXT & ASCII MODE ──
    if (mode === "text-ascii") {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      if (direction === "text-to-binary") {
        const bytes = encoder.encode(input);
        const binary = Array.from(bytes)
          .map((b) => b.toString(2).padStart(8, "0"))
          .join(" ");
        return { output: binary };
      }

      if (direction === "binary-to-text") {
        const cleanBin = input.replace(/[^01\s]/g, "");
        let chunks: string[] = [];
        if (cleanBin.includes(" ") || cleanBin.includes("\n")) {
          chunks = cleanBin.split(/\s+/).filter((c) => c.length > 0);
        } else {
          // dense block
          for (let i = 0; i < cleanBin.length; i += 8) {
            chunks.push(cleanBin.substring(i, i + 8));
          }
        }
        const bytes = chunks
          .map((c) => parseInt(c, 2))
          .filter((val) => !isNaN(val) && val >= 0 && val <= 255);

        return { output: decoder.decode(new Uint8Array(bytes)) };
      }

      if (direction === "text-to-ascii") {
        const bytes = encoder.encode(input);
        const ascii = Array.from(bytes)
          .map((b) => b.toString(10))
          .join(" ");
        return { output: ascii };
      }

      if (direction === "ascii-to-text") {
        const cleanAsc = input.replace(/[^0-9\s]/g, "");
        const codes = cleanAsc
          .split(/\s+/)
          .map((x) => parseInt(x, 10))
          .filter((n) => !isNaN(n) && n >= 0 && n <= 255);
        return { output: decoder.decode(new Uint8Array(codes)) };
      }

      if (direction === "ascii-to-binary") {
        const cleanAsc = input.replace(/[^0-9\s]/g, "");
        const codes = cleanAsc
          .split(/\s+/)
          .map((x) => parseInt(x, 10))
          .filter((n) => !isNaN(n) && n >= 0 && n <= 255);
        const binary = codes
          .map((n) => n.toString(2).padStart(8, "0"))
          .join(" ");
        return { output: binary };
      }

      if (direction === "binary-to-ascii") {
        const cleanBin = input.replace(/[^01\s]/g, "");
        let chunks: string[] = [];
        if (cleanBin.includes(" ") || cleanBin.includes("\n")) {
          chunks = cleanBin.split(/\s+/).filter((c) => c.length > 0);
        } else {
          for (let i = 0; i < cleanBin.length; i += 8) {
            chunks.push(cleanBin.substring(i, i + 8));
          }
        }
        const ascii = chunks
          .map((c) => parseInt(c, 2))
          .filter((val) => !isNaN(val) && val >= 0 && val <= 255)
          .map((v) => v.toString(10))
          .join(" ");
        return { output: ascii };
      }
    }

    // ── NUMERIC MODES (DECIMAL & HEXADECIMAL) ──
    const denseInput = trimmed.replace(/\s+/g, "");
    if (!denseInput) return { output: "" };

    let numericVal: bigint;

    if (direction.startsWith("binary-")) {
      if (!/^[01]+$/.test(denseInput)) {
        return { output: "", error: "Input contains invalid characters. Binary only accepts 0 and 1." };
      }
      numericVal = BigInt("0b" + denseInput);
    } else if (direction.startsWith("decimal-")) {
      if (!/^[0-9]+$/.test(denseInput)) {
        return { output: "", error: "Input contains invalid characters. Decimal only accepts 0-9." };
      }
      numericVal = BigInt(denseInput);
    } else if (direction.startsWith("hex-")) {
      if (!/^[0-9a-fA-F]+$/.test(denseInput)) {
        return { output: "", error: "Input contains invalid characters. Hexadecimal only accepts 0-9 and A-F." };
      }
      numericVal = BigInt("0x" + denseInput);
    } else {
      return { output: "" };
    }

    // Output formatting based on target base
    if (direction.endsWith("-to-binary") || direction.endsWith("-binary")) {
      return { output: numericVal.toString(2) };
    }
    if (direction.endsWith("-to-decimal") || direction.endsWith("-decimal")) {
      return { output: numericVal.toString(10) };
    }
    if (direction.endsWith("-to-hex") || direction.endsWith("-hex")) {
      return { output: numericVal.toString(16).toUpperCase() };
    }

    return { output: "" };
  } catch (e) {
    return { output: "", error: "Conversion calculation error. Check your number format." };
  }
}

// ─────────────────────────────────────────────────────────────
//  Props & Types
// ─────────────────────────────────────────────────────────────
interface BinaryConverterProps {
  initialSlug?: string;
}

export default function BinaryConverter({ initialSlug }: BinaryConverterProps) {
  // 1. Primary Operational Modes
  const [activeMode, setActiveMode] = useState<"text-ascii" | "decimal" | "hexadecimal">("text-ascii");

  // 2. Sub-Modes and Directions
  const [textSubMode, setTextSubMode] = useState<"text-binary" | "text-ascii" | "ascii-binary">("text-binary");
  const [hexSubMode, setHexSubMode] = useState<"hex-decimal" | "hex-binary">("hex-decimal");

  // Forward means left-to-right (e.g. Text -> Binary), Reverse means right-to-left (e.g. Binary -> Text)
  const [isReverse, setIsReverse] = useState(false);

  // 3. Text inputs and states
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 4. Metrics Matrix values for Decimal & Hex modes
  const [metricsGrid, setMetricsGrid] = useState<{
    binary: string;
    decimal: string;
    hex: string;
    octal: string;
  } | null>(null);

  // ── Auto sync parameters from landing URLs ──
  useEffect(() => {
    if (!initialSlug) return;

    if (initialSlug === "text-to-binary") {
      setActiveMode("text-ascii");
      setTextSubMode("text-binary");
      setIsReverse(false);
    } else if (initialSlug === "binary-to-text") {
      setActiveMode("text-ascii");
      setTextSubMode("text-binary");
      setIsReverse(true);
    } else if (initialSlug === "text-to-ascii") {
      setActiveMode("text-ascii");
      setTextSubMode("text-ascii");
      setIsReverse(false);
    } else if (initialSlug === "ascii-to-text") {
      setActiveMode("text-ascii");
      setTextSubMode("text-ascii");
      setIsReverse(true);
    } else if (initialSlug === "ascii-to-binary") {
      setActiveMode("text-ascii");
      setTextSubMode("ascii-binary");
      setIsReverse(false);
    } else if (initialSlug === "binary-to-ascii") {
      setActiveMode("text-ascii");
      setTextSubMode("ascii-binary");
      setIsReverse(true);
    } else if (initialSlug === "decimal-to-binary") {
      setActiveMode("decimal");
      setIsReverse(false);
    } else if (initialSlug === "binary-to-decimal") {
      setActiveMode("decimal");
      setIsReverse(true);
    } else if (initialSlug === "decimal-to-hex") {
      setActiveMode("hexadecimal");
      setHexSubMode("hex-decimal");
      setIsReverse(true); // Decimal -> Hex
    } else if (initialSlug === "hex-to-binary") {
      setActiveMode("hexadecimal");
      setHexSubMode("hex-binary");
      setIsReverse(false); // Hex -> Binary
    } else if (initialSlug === "binary-to-hex") {
      setActiveMode("hexadecimal");
      setHexSubMode("hex-binary");
      setIsReverse(true); // Binary -> Hex
    }
  }, [initialSlug]);

  // Determine current active translation key/direction
  const getActiveDirection = useCallback((): string => {
    if (activeMode === "text-ascii") {
      if (textSubMode === "text-binary") {
        return isReverse ? "binary-to-text" : "text-to-binary";
      } else if (textSubMode === "text-ascii") {
        return isReverse ? "ascii-to-text" : "text-to-ascii";
      } else {
        return isReverse ? "binary-to-ascii" : "ascii-to-binary";
      }
    } else if (activeMode === "decimal") {
      return isReverse ? "binary-to-decimal" : "decimal-to-binary";
    } else {
      // hexadecimal
      if (hexSubMode === "hex-decimal") {
        return isReverse ? "decimal-to-hex" : "hex-to-decimal";
      } else {
        return isReverse ? "binary-to-hex" : "hex-to-binary";
      }
    }
  }, [activeMode, textSubMode, hexSubMode, isReverse]);

  // Resolve what raw character checks/warnings are needed
  const validateInputContent = useCallback((val: string) => {
    if (!val) {
      setValidationError(null);
      return;
    }
    const direction = getActiveDirection();

    if (direction.startsWith("binary-") || direction === "binary-to-ascii") {
      if (/[^01\s]/.test(val)) {
        setValidationError("Validation Mismatch: Non-binary character detected. Valid digits are 0 and 1 only.");
        return;
      }
    }
    if (direction.startsWith("decimal-") || direction === "ascii-to-text" || direction === "ascii-to-binary") {
      if (/[^0-9\s]/.test(val)) {
        setValidationError("Validation Mismatch: Non-numeric characters detected. Valid base-10 digits are 0-9.");
        return;
      }
    }
    if (direction.startsWith("hex-")) {
      if (/[^0-9a-fA-F\s]/.test(val)) {
        setValidationError("Validation Mismatch: Non-hexadecimal values detected. Valid characters are 0-9 and A-F.");
        return;
      }
    }
    setValidationError(null);
  }, [getActiveDirection]);

  // Calculate conversions on input change
  useEffect(() => {
    const direction = getActiveDirection();
    validateInputContent(input);

    // Compute active translation
    const result = performConversion(input, activeMode, direction);

    if (result.error) {
      setOutput("");
    } else {
      setOutput(result.output);
    }

    // ── Generate real-time Multi-Base Metrics Grid for numeric conversions ──
    if (activeMode === "decimal" || activeMode === "hexadecimal") {
      const dense = input.trim().replace(/\s+/g, "");
      if (!dense) {
        setMetricsGrid(null);
        return;
      }

      try {
        let value: bigint | null = null;
        if (direction.startsWith("binary-")) {
          if (/^[0-1]+$/.test(dense)) value = BigInt("0b" + dense);
        } else if (direction.startsWith("decimal-")) {
          if (/^[0-9]+$/.test(dense)) value = BigInt(dense);
        } else if (direction.startsWith("hex-")) {
          if (/^[0-9a-fA-F]+$/.test(dense)) value = BigInt("0x" + dense);
        }

        if (value !== null) {
          setMetricsGrid({
            binary: value.toString(2),
            decimal: value.toString(10),
            hex: value.toString(16).toUpperCase(),
            octal: value.toString(8),
          });
        } else {
          setMetricsGrid(null);
        }
      } catch (e) {
        setMetricsGrid(null);
      }
    } else {
      setMetricsGrid(null);
    }
  }, [input, activeMode, getActiveDirection, validateInputContent]);

  // Handle manual input updates, applying filter-on-the-fly where necessary
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    const direction = getActiveDirection();

    // Determine target clean format
    let filterType: "binary" | "decimal" | "hex" | "ascii" | "none" = "none";
    if (direction.startsWith("binary-") || direction === "binary-to-ascii") {
      filterType = "binary";
    } else if (direction.startsWith("decimal-")) {
      filterType = "decimal";
    } else if (direction.startsWith("hex-")) {
      filterType = "hex";
    } else if (direction === "ascii-to-text" || direction === "ascii-to-binary") {
      filterType = "ascii";
    }

    // Clean inputs for numerical systems to avoid crashing. For binary, dec, hex
    // we let them type but show warning if they copy-paste wrong data. 
    // We clean only strict decimals in decimal mode to avoid breaks.
    let cleaned = rawVal;
    if (filterType === "decimal") {
      cleaned = sanitizeInput(rawVal, "decimal");
    }

    setInput(cleaned);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setMetricsGrid(null);
    setValidationError(null);
  };

  const handleLoadSample = () => {
    const direction = getActiveDirection();
    if (activeMode === "text-ascii") {
      if (direction === "text-to-binary" || direction === "text-to-ascii") {
        setInput("Hello, World! Welcome to TwisterTools.");
      } else if (direction === "binary-to-text" || direction === "binary-to-ascii") {
        setInput("01001000 01100101 01101100 01101100 01101111 00100000 01010111 01101111 01110010 01101100 01100100 00100001");
      } else if (direction === "ascii-to-text" || direction === "ascii-to-binary") {
        setInput("72 101 108 108 111 32 87 111 114 108 100 33");
      }
    } else if (activeMode === "decimal") {
      if (direction === "decimal-to-binary") {
        setInput("12345678901234567890"); // Arbitrary big integer
      } else {
        setInput("10101010101010101010101010101010101010101010101010101010");
      }
    } else {
      // Hexadecimal
      if (direction === "hex-to-decimal" || direction === "hex-to-binary") {
        setInput("DEADBEEFCAFE1234567890");
      } else if (direction === "binary-to-hex") {
        setInput("1100111101001110010101101");
      } else {
        setInput("98765432109876543210");
      }
    }
  };

  // UI display helpers for modes
  const getDirectionLabels = () => {
    if (activeMode === "text-ascii") {
      if (textSubMode === "text-binary") {
        return { from: "Text", to: "Binary" };
      } else if (textSubMode === "text-ascii") {
        return { from: "Text", to: "ASCII (Codes)" };
      } else {
        return { from: "ASCII (Codes)", to: "Binary" };
      }
    } else if (activeMode === "decimal") {
      return { from: "Decimal", to: "Binary" };
    } else {
      if (hexSubMode === "hex-decimal") {
        return { from: "Hexadecimal", to: "Decimal" };
      } else {
        return { from: "Binary", to: "Hexadecimal" };
      }
    }
  };

  const { from, to } = getDirectionLabels();
  const displayFrom = isReverse ? to : from;
  const displayTo = isReverse ? from : to;

  return (
    <div className="space-y-10">
      {/* ─────────────────────────────────────────────────────────────
          INTERACTIVE WORKSPACE
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* LEFT PANEL: Workspace inputs & options (Equal 50% Column) */}
        <div className="space-y-6">

          {/* Section: Main Workspace Text Input Area */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

            {/* Header bar of input */}
            <div className="bg-slate-50/50 dark:bg-slate-800/50 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Input: {displayFrom} Source
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-550 dark:text-slate-400 font-medium">
                <span>Characters: {input.length}</span>
                {activeMode === "text-ascii" && (
                  <span>Words: {input.trim() === "" ? 0 : input.trim().split(/\s+/).length}</span>
                )}
                {displayFrom === "Binary" && (
                  <span>Bits: {input.replace(/[^01]/g, "").length}</span>
                )}
              </div>
            </div>

            {/* Input Textarea */}
            <div className="p-5 space-y-4">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder={`Paste or type your ${displayFrom.toLowerCase()} code here...`}
                className="w-full h-48 bg-slate-50/50 focus:bg-white dark:bg-slate-950/50 dark:focus:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl p-4 m-0 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-y outline-none leading-relaxed"
                spellCheck="false"
              />

              {/* Validation Feedback Warning Card */}
              {validationError && (
                <div className="flex items-start gap-3 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 text-amber-800 dark:text-amber-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{validationError}</span>
                    <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1">
                      Characters violating active base constraints will be skipped by the base conversion calculator to prevent calculation crashes.
                    </p>
                  </div>
                </div>
              )}

              {/* Local Workspace Toolbar */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleLoadSample}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/85 transition-all font-semibold text-xs tracking-wide min-h-[44px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Load Sample Data
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 bg-white hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all font-semibold text-xs tracking-wide min-h-[44px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Input
                </button>
              </div>
            </div>
          </div>

          {/* Section: Controls & Mode Switcher */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">

            {/* Primary Mode Selector: Scrollable Row */}
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Operational Conversion Mode
              </span>
              <div className="flex items-center gap-2 overflow-x-auto select-none scrollbar-thin pb-1">
                {[
                  { id: "text-ascii", label: "Text / ASCII" },
                  { id: "decimal", label: "Decimal (Base-10)" },
                  { id: "hexadecimal", label: "Hexadecimal (Base-16)" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setActiveMode(mode.id as any);
                      setIsReverse(false);
                      setValidationError(null);
                    }}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 min-h-[44px] flex items-center justify-center border ${activeMode === mode.id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-modes for Text and Hex Mode */}
            {activeMode === "text-ascii" && (
              <div className="flex flex-col space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Conversion Pair
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "text-binary", label: "Text ⇄ Binary" },
                    { id: "text-ascii", label: "Text ⇄ ASCII Codes" },
                    { id: "ascii-binary", label: "ASCII Codes ⇄ Binary" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setTextSubMode(sub.id as any);
                        setValidationError(null);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center border ${textSubMode === sub.id
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-755 dark:text-indigo-400"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMode === "hexadecimal" && (
              <div className="flex flex-col space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Conversion Pair
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "hex-decimal", label: "Hexadecimal ⇄ Decimal" },
                    { id: "hex-binary", label: "Hexadecimal ⇄ Binary" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setHexSubMode(sub.id as any);
                        setValidationError(null);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center border ${hexSubMode === sub.id
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-755 dark:text-indigo-400"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Direction Switcher Toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Conversion Direction
              </span>
              <button
                onClick={() => {
                  setIsReverse(!isReverse);
                  setValidationError(null);
                }}
                className="flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all font-medium text-sm text-indigo-600 dark:text-indigo-400 min-h-[44px]"
              >
                <span>{displayFrom}</span>
                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                <span>{displayTo}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Outputs & Sticky Preview (Equal 50% Column) */}
        <div className="lg:sticky lg:top-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">

            {/* Header Title Bar with blue background */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3.5 border-b border-indigo-700 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-200"></span>
                <span className="font-semibold text-sm text-white">
                  Conversion Output
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-indigo-100 font-medium">
                <span>Characters: {output.length}</span>
                {activeMode === "text-ascii" && (
                  <span>Words: {output.trim() === "" ? 0 : output.trim().split(/\s+/).length}</span>
                )}
                {displayTo === "Binary" && (
                  <span>Bits: {output.replace(/[^01]/g, "").length}</span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-5">

            {/* Read-Only Output Textarea */}
            <div className="space-y-2">
              <textarea
                readOnly
                value={output}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                placeholder="Calculation output will generate automatically..."
                className="w-full h-48 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 rounded-xl p-3 border border-slate-200 dark:border-slate-800 font-mono text-sm leading-relaxed cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                Click once anywhere inside the output box to select all text.
              </p>
            </div>

            {/* Main Action Button */}
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-sm min-h-[44px] ${!output
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                : copied
                  ? "bg-green-600 text-white shadow-md shadow-green-100 dark:shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white hover:-translate-y-0.5 shadow-md shadow-indigo-100 dark:shadow-none"
                }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied Securely!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Output Result
                </>
              )}
            </button>

            {/* Multi-Base Metrics Matrix */}
            {metricsGrid && (
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Parallel Base Representation
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Binary (Base 2)", val: metricsGrid.binary },
                    { label: "Decimal (Base 10)", val: metricsGrid.decimal },
                    { label: "Hexadecimal (Base 16)", val: metricsGrid.hex },
                    { label: "Octal (Base 8)", val: metricsGrid.octal },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex flex-col justify-between space-y-1 overflow-hidden"
                    >
                      <span className="text-[9px] font-semibold text-slate-500 uppercase">
                        {metric.label}
                      </span>
                      <div className="flex items-center justify-between gap-1 overflow-hidden">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
                          {metric.val}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(metric.val)}
                          className="p-1 rounded bg-white hover:bg-indigo-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Copy Base value"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pro-Tips Callout (Privacy-First Badge) */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl p-4 flex gap-3 text-xs text-indigo-800 dark:text-indigo-300">
              <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[11px] text-indigo-900 dark:text-indigo-300">
                  100% Client-Side Privacy
                </p>
                <p className="mt-1 text-slate-500 dark:text-slate-450 leading-relaxed">
                  All translations and calculations run directly inside your web browser. No inputs or resulting codes are ever transmitted to external servers.
                </p>
              </div>
            </div>

          </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          BELOW-THE-FOLD DEEP SEO GUIDE CONTENT
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6 pt-6">
        
        {/* Card 1: The Ultimate Guide */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 p-8 md:p-10 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
            <Binary className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>The Ultimate Guide to Binary and Computer Base Number Systems</span>
          </h2>
          <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
            <p>
              Modern computing infrastructure relies entirely on the binary numeral system to execute calculations, route network packets, and preserve file integrity. While humans naturally converse and perform mathematics in the base-10 decimal system, silicon transistors operate dynamically using binary logic. A transistor acts as a miniature physical switch that can exist in only one of two electrical states: off (represented by the number 0) or on (represented by the number 1).
            </p>
            <p>
              By stringing together sequences of these simple dual states, digital computing frameworks construct highly complex programmatic architectures. This comprehensive guide details the mathematical principles underlying base transformations, offers transparent structural examples of text-to-binary and decimal-to-hexadecimal equations, and outlines the practical everyday applications of binary conversion utilities within modern software development environments.
            </p>
          </div>
        </div>

        {/* Card 2: Defining Core Bases */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 p-8 md:p-10 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>Defining the Core Base Number Systems</span>
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            To master data conversion, developers must navigate four critical number bases that appear constantly across hardware and software systems:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "1",
                title: "Binary (Base-2)",
                body: "Binary uses a radix of 2 and relies exclusively on two numeric digits: 0 and 1. Each digit position in a binary string represents an exponential value or power of 2, starting from the rightmost bit ($2^0, 2^1, 2^2, 2^3$). It is the foundational language of central processing units (CPUs), random-access memory (RAM), and storage mediums.",
              },
              {
                step: "2",
                title: "Decimal (Base-10)",
                body: "Decimal is the universally recognized human counting system. It possesses a radix of 10 and utilizes digits ranging from 0 through 9. Each positional value moving from right to left increases by a factor of 10 ($10^0, 10^1, 10^2$).",
              },
              {
                step: "3",
                title: "Hexadecimal (Base-16)",
                body: "Hexadecimal is a compact positional notation system using a radix of 16. To represent values between 10 and 15 with single characters, it introduces alphabetical letters: A (10), B (11), C (12), D (13), E (14), and F (15). Hexadecimal is widely leveraged in development to condense long, unwieldy binary strings into clean, human-readable instructions, such as color hex codes and memory address tracking blocks.",
              },
              {
                step: "4",
                title: "ASCII (American Standard Code for Information Interchange)",
                body: "ASCII is a character encoding standard established to standardize data transmission between digital electronic communication devices. Utilizing a strict 7-bit framework, it maps exactly 128 unique values to a dedicated index of English alphabet letters, numerical values (0–9), standard punctuation marks, and structural device control operators (such as carriage returns and line feeds). Modern systems encapsulate ASCII values within standard 8-bit bytes, paving the way for variable-width encodings like UTF-8. Translating raw text to its ASCII integer arrays or direct binary notation remains standard practice for low-level application protocol development and byte-stream debugging.",
              },
              {
                step: "5",
                title: "Octal (Base-8)",
                body: "Octal employs a radix of 8 and digits spanning 0 through 7. While less common in modern high-level software development than hexadecimal, octal remains crucial for setting UNIX file permissions and handling legacy telecommunication computing systems.",
              },
            ].map(({ step, title, body }) => (
              <div key={title} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1.5">{title}</h3>
                    <p className="text-slate-700 dark:text-slate-350 text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Math Walkthroughs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 p-8 md:p-10 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>Concrete Mathematical Walkthroughs &amp; Examples</span>
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-5">
            To visualize exactly how the underlying JavaScript conversion engine processes text, decimal strings, and hexadecimal values, review these explicit step-by-step structural workflows.
          </p>
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-2">
                Concrete Example 1: Converting the Character 'A' to an 8-Bit Binary String
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                <li>Look up the underlying character integer code point using the standard UTF-8/ASCII index table. The uppercase letter 'A' corresponds directly to the decimal value 65.</li>
                <li>Deconstruct the decimal integer 65 by identifying the highest powers of 2 that can fit inside it:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>$2^6 = 64$ fits inside 65 ($65 - 64 = 1$ remaining)</li>
                    <li>$2^5 = 32$ does not fit (value is 0)</li>
                    <li>$2^4 = 16$ does not fit (value is 0)</li>
                    <li>$2^3 = 8$ does not fit (value is 0)</li>
                    <li>$2^2 = 4$ does not fit (value is 0)</li>
                    <li>$2^1 = 2$ does not fit (value is 0)</li>
                    <li>$2^0 = 1$ fits exactly ($1 - 1 = 0$ remaining)</li>
                  </ul>
                </li>
                <li>Arrange the tracking flags in positional order from left to right: $64 + 0 + 0 + 0 + 0 + 0 + 1$.</li>
                <li>This results in the raw binary output sequence: 1000001.</li>
                <li>Pad the left side with a zero to fulfill standard 8-bit byte formatting conventions: 01000001.</li>
              </ol>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-2">
                Concrete Example 2: Converting Decimal 156 to Binary Using Successive Euclidean Division
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-2">
                An alternative programmatic method relies on dividing the target integer by 2 repeatedly and capturing the mathematical remainders in reverse order:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                <li>$156 \div 2 = 78$ with a remainder of 0 (Least Significant Bit)</li>
                <li>$78 \div 2 = 39$ with a remainder of 0</li>
                <li>$39 \div 2 = 19$ with a remainder of 1</li>
                <li>$19 \div 2 = 9$ with a remainder of 1</li>
                <li>$9 \div 2 = 4$ with a remainder of 1</li>
                <li>$4 \div 2 = 2$ with a remainder of 0</li>
                <li>$2 \div 2 = 1$ with a remainder of 0</li>
                <li>$1 \div 2 = 0$ with a remainder of 1 (Most Significant Bit)</li>
              </ul>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mt-2">
                Reading the collected remainders starting from the bottom operation upward generates the complete binary string: 10011100.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-2">
                Concrete Example 3: Converting Hexadecimal "3F" to Binary and Decimal
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-2">
                Hexadecimal values translate rapidly to binary by parsing each hex character into its individual 4-bit binary group (nibble):
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                <li>Take the character "3": In base-10, this equals 3. Wrapped into a 4-bit binary sequence, it produces 0011.</li>
                <li>Take the character "F": In base-10, this equals 15. Wrapped into a 4-bit binary sequence, it produces 1111.</li>
                <li>Combine the two distinct nibbles together to form the unified binary result: 00111111.</li>
                <li>To establish the final base-10 decimal value, sum the positional values of the active bits:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>$(0 \times 128) + (0 \times 64) + (1 \times 32) + (1 \times 16) + (1 \times 8) + (1 \times 4) + (1 \times 2) + (1 \times 1)$</li>
                    <li>$32 + 16 + 8 + 4 + 2 + 1 = 63$. Therefore, Hex "3F" matches Decimal 63.</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Card 4: Use Cases */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 p-8 md:p-10 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
            <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>Practical Use Cases for Technical Professionals</span>
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            A multi-directional base converter is a versatile addition to any developer's toolkit, serving various everyday diagnostic operations:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Network Subnet Calculations",
                body: "Network operations rely heavily on binary string evaluation. System engineers utilize bitwise masking and binary conversions to calculate IPv4 CIDR blocks, establish precise subnet scopes, and parse raw packet headers during live traffic analysis.",
              },
              {
                title: "Embedded Engineering & Hardware Debugging",
                body: "Microcontrollers, Arduino arrays, and IoT hardware handle instructions directly through registry states. Converting base values manually ensures pins are turned high or low accurately.",
              },
              {
                title: "Parsing Low-Level File Headers",
                body: "File signatures (magic bytes) at the start of images, compiled documents, or executables are frequently analyzed in hexadecimal or binary to classify file formatting types and spot structural corruptions.",
              },
              {
                title: "Web Application Security Analysis",
                body: "Security analysts inspect raw binary data structures and multi-base representations to audit cryptography patterns, check encoding consistency, and uncover buffer overflow risks inside web interfaces.",
              },
              {
                title: "Educational Concepts",
                body: "Computer science educators and students use interactive base-shifting components to check their pen-and-paper mathematical translations quickly, reinforcing binary principles without delay.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1.5">{title}</h3>
                <p className="text-slate-700 dark:text-slate-350 text-xs md:text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: FAQs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 p-8 md:p-10 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>Advanced Frequently Asked Questions (FAQ)</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Does this conversion tool expose my proprietary text inputs over the web?",
                a: "No. Your data privacy is structurally protected. The entirety of the text translation, byte parsing, and base conversions occurs directly inside your local web browser's memory. No string data, inputs, or resulting bitstreams are ever transmitted across networks or saved to remote databases.",
              },
              {
                q: "What is the explicit technical difference between ASCII and UTF-8 encoding?",
                a: "ASCII is a historical character encoding standard restricted to 7 bits, capping its capacity at 128 distinct characters, primarily covering English letters, punctuation marks, and structural control blocks. Conversely, UTF-8 is a modern, variable-width character encoding standard backward-compatible with ASCII that can scale up to 4 bytes per character. This enables it to represent millions of diverse global characters, mathematical symbols, and distinct international writing systems safely.",
              },
              {
                q: "Why do some converted binary outputs look clustered with single blank space divisions?",
                a: "Standard character conversions map letters to bytes. Because a conventional byte consists of 8 bits, spacing out the binary sequences into 8-digit groups ensures optimal human readability, allowing developers to count data sizes and identify individual character boundaries easily.",
              },
              {
                q: "Can this calculation tool handle exceedingly large numbers without failing?",
                a: "Yes. The mathematical logic underlying this workspace uses modern JavaScript numeric architectures to prevent overflow errors. When switching to Decimal or Hexadecimal processing configurations, it handles immense strings cleanly, rendering matching outputs across alternative bases concurrently.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/25 dark:to-transparent rounded-r-xl p-5 shadow-sm space-y-2"
              >
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 dark:text-slate-400 text-xs md:text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose TwisterTools for Binary Conversion? */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-200 flex-shrink-0" />
            <span>Why Choose TwisterTools for Binary Conversion?</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "All-in-One Multi-Base Fluidity",
                body: "Shift seamlessly across text, ASCII blocks, binary structures, integers, and hexadecimal expressions within a single interactive dashboard without fracturing your analytical workflow across ten distinct tool URLs.",
              },
              {
                icon: Cpu,
                title: "Immediate Input Reflection",
                body: "The custom client-side processing engine computes array mapping and base conversions dynamically on every key stroke, serving up real-time diagnostics with zero computation lag.",
              },
              {
                icon: Sparkles,
                title: "Zero Configuration Friction",
                body: "Instantly clean workspace views or populate test models using custom one-click \"Clear Input\" and \"Load Sample Data\" utilities integrated directly within the native panel grid.",
              },
              {
                icon: Binary,
                title: "Print-Grade Technical Precision",
                body: "Experience stable, mathematical transformations optimized to safely ingest immense decimal and hexadecimal inputs while cleanly bypassing typical floating-point precision overflow limitations.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                <Icon className="w-5 h-5 text-indigo-200 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-indigo-200 text-xs mt-1 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}
