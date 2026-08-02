"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Binary,
  FileText,
  Copy,
  Check,
  Trash2,
  Settings,
  HelpCircle,
  Info,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface StringHexConverterProps {
  initialSlug?: string;
}

// Pre-defined high-density multilingual validation strings
const STRING_SAMPLE = "TwisterTools | Latin text • Русский текст (Cyrillic) • 繁體中文 (Chinese) • 日本語 (Japanese) • 12345!@#$%\nUTF-8 Multilingual Validation Sequence.";
const HEX_SAMPLE = "54 77 69 73 74 65 72 54 6f 6f 6c 73 20 63 6c 69 65 6e 74 2d 73 69 64 65 20 74 72 61 6e 73 66 6f 72 6d 61 74 69 6f 6e 20 f0 9f 9a 80 20 e2 9c 85"; // "TwisterTools client-side transformation (Rocket) (Check)"

export default function StringHexConverter({ initialSlug }: StringHexConverterProps) {
  const [activeTab, setActiveTab] = useState<"string-to-hex" | "hex-to-string">("string-to-hex");
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Configuration settings (only used for string-to-hex)
  const [delimiter, setDelimiter] = useState<string>(" ");
  const [customDelimiter, setCustomDelimiter] = useState<string>("");
  const [prefix, setPrefix] = useState<boolean>(false);
  const [casing, setCasing] = useState<"lower" | "upper">("lower");

  // Metrics
  const [byteSize, setByteSize] = useState<number>(0);
  const [overheadRatio, setOverheadRatio] = useState<string>("0.00x");
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // Set initial tab from page router slug if appropriate
  useEffect(() => {
    if (initialSlug === "hex-to-string") {
      setActiveTab("hex-to-string");
    } else {
      setActiveTab("string-to-hex");
    }
  }, [initialSlug]);

  // Main translation runner
  useEffect(() => {
    setIsConverting(true);
    setValidationError(null);

    const runConversion = () => {
      if (!input) {
        setOutput("");
        setByteSize(0);
        setOverheadRatio("0.00x");
        return;
      }

      // Calculate input byte size
      const inputBlob = new Blob([input]);
      setByteSize(inputBlob.size);

      if (activeTab === "string-to-hex") {
        // --- String to Hex ---
        try {
          const encoder = new TextEncoder();
          const bytes = encoder.encode(input);

          const hexParts = Array.from(bytes).map((b) => {
            let hex = b.toString(16).padStart(2, "0");
            if (casing === "upper") {
              hex = hex.toUpperCase();
            } else {
              hex = hex.toLowerCase();
            }
            return prefix ? `0x${hex}` : hex;
          });

          const sep = delimiter === "custom" ? customDelimiter : delimiter;
          const result = hexParts.join(sep);
          setOutput(result);

          // Expansion ratio = output byte size / input byte size
          const outputBlob = new Blob([result]);
          const ratio = inputBlob.size > 0 ? (outputBlob.size / inputBlob.size).toFixed(2) : "0.00x";
          setOverheadRatio(`${ratio}x`);
        } catch (err: any) {
          setValidationError(`Unexpected transformation error: ${err.message || err}`);
          setOutput("");
          setOverheadRatio("0.00x");
        }
      } else {
        // --- Hex to String ---
        // Validate input character content
        const cleanStrForValidation = input.replace(/0[xX]/g, "");
        if (/[^0-9a-fA-F\s,;:|]/i.test(cleanStrForValidation)) {
          setValidationError("Malformed Hexadecimal Sequence: Input contains invalid non-hexadecimal characters (only 0-9, a-f, A-F, spaces, commas, colons, semicolons, and 0x/0X prefixes are allowed).");
          setOutput("");
          setOverheadRatio("0.00x");
          return;
        }

        const denseHex = cleanStrForValidation.replace(/[^0-9a-fA-F]/g, "");
        if (denseHex.length === 0) {
          setOutput("");
          setOverheadRatio("0.00x");
          return;
        }

        if (denseHex.length % 2 !== 0) {
          setValidationError("Malformed Hexadecimal Sequence: Odd number of hex characters detected (unaligned byte boundaries).");
          setOutput("");
          setOverheadRatio("0.00x");
          return;
        }

        try {
          const bytes: number[] = [];
          for (let i = 0; i < denseHex.length; i += 2) {
            const byteStr = denseHex.substring(i, i + 2);
            const byteVal = parseInt(byteStr, 16);
            if (isNaN(byteVal)) {
              throw new Error("Invalid hex byte representation");
            }
            bytes.push(byteVal);
          }

          const decoder = new TextDecoder("utf-8", { fatal: true });
          const decodedStr = decoder.decode(new Uint8Array(bytes));
          setOutput(decodedStr);

          // Compression ratio = output byte size / input byte size
          const outputBlob = new Blob([decodedStr]);
          const ratio = inputBlob.size > 0 ? (outputBlob.size / inputBlob.size).toFixed(2) : "0.00x";
          setOverheadRatio(`${ratio}x`);
        } catch (err: any) {
          setValidationError(`Malformed Hexadecimal Sequence: Failed to decode byte array as valid UTF-8 text. Error: ${err.message || "Invalid byte sequence"}`);
          setOutput("");
          setOverheadRatio("0.00x");
        }
      }
    };

    // Run synchronous logic with visual micro-state feedback
    const timer = setTimeout(() => {
      runConversion();
      setIsConverting(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [input, activeTab, delimiter, customDelimiter, prefix, casing]);

  // Actions
  const handleLoadSample = useCallback(() => {
    if (activeTab === "string-to-hex") {
      setInput(STRING_SAMPLE);
    } else {
      setInput(HEX_SAMPLE);
    }
  }, [activeTab]);

  const handleClearAll = useCallback(() => {
    setInput("");
    setOutput("");
    setValidationError(null);
  }, []);

  const handleCopy = async () => {
    if (!output || !!validationError) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="w-full pb-0">

      {/* Symmetrical 2-column distribution layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* LEFT COLUMN: Interactive Input Space */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col justify-between p-4 sm:p-6">
          <div>
            {/* Multi-mode tab control bar */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("string-to-hex");
                  if (output && !validationError && activeTab === "hex-to-string") {
                    setInput(output);
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "string-to-hex"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                style={{ minHeight: "40px" }}
              >
                <Binary className="w-4 h-4" />
                <span>String to Hex</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("hex-to-string");
                  if (output && !validationError && activeTab === "string-to-hex") {
                    setInput(output);
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "hex-to-string"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                style={{ minHeight: "40px" }}
              >
                <FileText className="w-4 h-4" />
                <span>Hex to String</span>
              </button>
            </div>

            {/* Input Label and TextArea */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                {activeTab === "string-to-hex" ? "Plain Text String Input" : "Hexadecimal String Input"}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeTab === "string-to-hex"
                    ? "Enter text string here (e.g., Hello World!)..."
                    : "Enter hex string here (e.g., 48 65 6c 6c 6f 20 57 6f 72 6c 64 21 or 0x48 0x65)..."
                }
                className="w-full min-h-[220px] p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-y"
              />
            </div>
          </div>

          {/* Engineering Options Toolbar */}
          <div className="border-t border-slate-100 pt-5 mt-6 space-y-5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Engineering Configuration</h4>

            {activeTab === "hex-to-string" ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-xs text-slate-600">
                <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div className="leading-relaxed">
                  <strong>Note:</strong> Separators, formatting prefixes (like <code>0x</code>), and layout spacing are parsed and stripped automatically. You do not need to configure delimiters or casing.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delimiter selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Delimiter / Separator Type
                  </label>
                  <select
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">None (Dense strings)</option>
                    <option value=" ">Space ( )</option>
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value=":">Colon (:)</option>
                    <option value="custom">Custom Character...</option>
                  </select>

                  {/* Custom delimiter text box */}
                  {delimiter === "custom" && (
                    <input
                      type="text"
                      maxLength={10}
                      value={customDelimiter}
                      onChange={(e) => setCustomDelimiter(e.target.value)}
                      placeholder="e.g., - or \x"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  )}
                </div>

                {/* Casing selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Character Casing
                  </label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-11 items-center">
                    <button
                      type="button"
                      onClick={() => setCasing("lower")}
                      className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all h-full ${casing === "lower"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      lower case
                    </button>
                    <button
                      type="button"
                      onClick={() => setCasing("upper")}
                      className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all h-full ${casing === "upper"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      UPPER CASE
                    </button>
                  </div>
                </div>

                {/* Hex prefixing */}
                <div className="flex flex-col justify-end pb-1 md:col-span-2">
                  <div className="flex items-center gap-3 h-11">
                    <input
                      type="checkbox"
                      id="hex-prefix"
                      checked={prefix}
                      onChange={(e) => setPrefix(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label
                      htmlFor="hex-prefix"
                      className="text-xs font-semibold text-slate-600 cursor-pointer select-none"
                    >
                      Hex Prefix Formatting (0x)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Character Encoding Schema */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                Character Encoding Schema
              </label>
              <div className="flex items-center justify-between h-11 px-4 rounded-xl border border-slate-100 bg-slate-50/50 select-none">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">UTF-8</span>
                <span className="text-xs text-slate-500 font-medium">Universal Multilingual Unicode Support</span>
                <Info className="w-4 h-4 text-indigo-500/60" />
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex gap-3 pt-5 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600 text-xs font-semibold transition-all focus:outline-none"
                style={{ minHeight: "40px" }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Sample</span>
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-xs font-semibold transition-all focus:outline-none"
                style={{ minHeight: "40px" }}
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Floating Sticky Output Display Panel */}
        <div className="bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden flex flex-col justify-between h-full min-h-[460px]">
          {/* Slate-to-Indigo Gradient Header Bar */}
          <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-200" />
              <span className="text-sm font-semibold">Converted Output</span>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Rose-colored malformed input warning banner */}
              {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex gap-3 text-sm font-medium animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <div className="flex-1 leading-relaxed">
                    {validationError}
                  </div>
                </div>
              )}

              <textarea
                readOnly
                value={output}
                placeholder="Output will appear here..."
                className={`w-full flex-1 min-h-[200px] p-4 rounded-xl border font-mono text-sm focus:outline-none transition-all resize-y ${validationError
                    ? "border-rose-200 bg-rose-50/20 text-rose-900/40"
                    : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
              />
            </div>

            {/* Quantitative Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-150 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Input Size</div>
                  <div className="text-xs font-bold text-slate-800 font-mono mt-1">
                    {input.length} <span className="text-[10px] font-normal text-slate-500">chars</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-150 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Binary className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">Byte Size</div>
                  <div className="text-xs font-bold text-slate-800 font-mono mt-1">
                    {byteSize} <span className="text-[10px] font-normal text-slate-500">bytes</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <RefreshCw className={`w-4 h-4 ${isConverting ? "animate-spin" : ""}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide leading-none">
                    {activeTab === "string-to-hex" ? "Expansion" : "Compression"}
                  </div>
                  <div className="text-xs font-bold text-indigo-600 font-mono mt-1">
                    {overheadRatio}
                  </div>
                </div>
              </div>
            </div>

            {/* Copy Button (Full Width) */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!output || !!validationError}
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm focus:outline-none ${copied
                    ? "bg-emerald-600 text-white shadow-emerald-100"
                    : !output || !!validationError
                      ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-100"
                  }`}
                style={{ minHeight: "44px" }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied Securely!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Result</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BELOW-THE-FOLD PROSE CONTENT */}
      <div className="space-y-8 mt-12 text-slate-800">
        {/* SECTION 1: SYSTEM GUIDE */}
        <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Definitive Guide to String and Hexadecimal Number Conversions</span>
          </h2>
          <p className="text-slate-750 text-sm md:text-base leading-relaxed mb-4">
            Computers operate fundamentally on binary data streams composed entirely of ones and zeros. While raw binary systems are optimal for electronic architectures, human developers find tracking massive, unreadable binary arrays highly impractical. To bridge this communication gap efficiently, technical workflows rely on the hexadecimal numbering system. Hexadecimal is a base-16 positional numeral system that represents sets of four binary bits utilizing sixteen distinct alphanumeric symbols.
          </p>
          <p className="text-slate-750 text-sm md:text-base leading-relaxed mb-6">
            Converting common text strings into hexadecimal strings allows engineers, network specialists, and database architects to systematically inspect underlying data representations, analyze network data packets, patch application variables, and ensure cross-platform communication profiles operate flawlessly. The TwisterTools String to Hex converter executes this transformation entirely inside your browser sandbox, evaluating character boundaries safely across multi-byte character encoding parameters.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mb-4">Understanding the Structural Mechanics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</span>
                String to Hexadecimal Ingestion
              </h4>
              <p className="text-slate-650 text-sm leading-relaxed">
                Every typographic glyph entered into the editor workspace maps directly to a standardized numeric identifier defined by the modern UTF-8 specification framework. The tool steps sequentially through the string payload, extracts the accurate unicode index sequence, and outputs the base-16 numerical equivalent.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
                Hexadecimal to String Extraction
              </h4>
              <p className="text-slate-650 text-sm leading-relaxed">
                When recovering data patterns from raw hex data strings, the system parses code chunks based on user-defined configurations, isolates standard base-16 components, converts the numeric values back into base-10 indices, and applies standard character table reconstruction to output the original legible string text.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: CONVERSION WORKFLOWS */}
        <section className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How the Hex Transformation Engine Works Step-by-Step</span>
          </h2>
          <p className="text-slate-750 text-sm md:text-base leading-relaxed mb-6">
            The mathematical transition from typographic layout elements to hexadecimal code segments operates systematically across standardized translation matrices. Below is an explicit architectural breakdown highlighting how an ordinary, readable text sequence converts into an enterprise-ready hexadecimal array:
          </p>

          <div className="space-y-4">
            {[
              { step: "Step 1: Character Extraction", desc: "The transformation logic isolates every structural character block in the user-supplied string input container, mapping individual entities via character position loops." },
              { step: "Step 2: Unicode Value Resolution", desc: "The software resolves the internal byte pattern mapping to the specific character layout. Traditional standard characters generate single-byte ASCII sequences, while complex multilingual glyphs or emojis map to multi-byte array models." },
              { step: "Step 3: Radix Base Shift", desc: "The core system recalculates the resolved decimal index positions into the base-16 numbering grid. Numeric values ranging from 0 to 9 stay intact, while indices stretching from 10 to 15 convert systematically into alphanumeric representations spanning letters A through F." },
              { step: "Step 4: Separator Packaging & Output Formats", desc: "The final processor applies custom formatting hooks, injecting prefix flags (such as 0x symbols) or user-specified delimiter variables (commas, spaces, colons) based on your custom active configuration parameters." }
            ].map((item, index) => (
              <div key={index} className="flex gap-4 items-start p-4 bg-slate-50/50 rounded-xl border border-slate-200/60">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{item.step}</h4>
                  <p className="text-slate-650 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: MAPPING MATRIX */}
        <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Reference: Character to Hexadecimal Mapping Matrix</span>
          </h2>
          <p className="text-slate-750 text-sm md:text-base leading-relaxed mb-4">
            To assist with debugging, tracking data flows, or inspecting manual byte sequences, check this reference conversion comparison mapping data configurations across plain text characters, base-10 decimal systems, binary code patterns, and lower/uppercase base-16 hexadecimal layouts:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Character Component</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Decimal Position (Base 10)</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Binary Bit Sequence (Base 2)</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Lowercase Hex (Base 16)</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Uppercase Hex (Base 16)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { c: "A", d: "65", b: "01000001", l: "41", u: "41" },
                  { c: "a", d: "97", b: "01100001", l: "61", u: "61" },
                  { c: "T", d: "84", b: "01010100", l: "54", u: "54" },
                  { c: "t", d: "116", b: "01110100", l: "74", u: "74" },
                  { c: "!", d: "33", b: "00100001", l: "21", u: "21" },
                  { c: "7", d: "55", b: "00110111", l: "37", u: "37" },
                  { c: "[Space]", d: "32", b: "00100000", l: "20", u: "20" },
                  { c: "&", d: "38", b: "00100110", l: "26", u: "26" }
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono font-semibold text-slate-700">{row.c}</td>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono text-slate-600">{row.d}</td>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono text-xs text-slate-650">{row.b}</td>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono text-indigo-700 font-medium">{row.l}</td>
                    <td className="px-4 py-3 border-b border-slate-100 font-mono text-indigo-700 font-bold">{row.u}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4: USE CASES */}
        <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Practical Professional Use Cases for Hexadecimal Data Arrays</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: "Network Diagnostics", text: "Network engineers analyze raw data payloads traversing physical pipelines by intercepting packet configurations in hex formats. Converting string values to hexadecimal speeds up diagnostic processes in network sniffers or packet analysis software." },
              { title: "Database Integrity", text: "Database supervisors utilize hex conversion frameworks to capture binary blobs, prevent SQL character escaping bugs during data transfers, store hash footprints safely, and check raw text blobs without causing character mapping corruption." },
              { title: "Embedded Firmware Engineering", text: "Software running on tiny hardware devices interfaces directly with address registries via base-16 hexadecimal codes. Converting configurations or test string arrays to hex format helps system engineers read and patch device memories easily." }
            ].map((card, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  <h3 className="font-semibold text-slate-800 text-sm">{card.title}</h3>
                </div>
                <p className="text-slate-650 text-xs md:text-sm leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: FAQS */}
        <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions (FAQ)</span>
          </h2>
          <div className="space-y-5">
            {[
              { q: "Is any data sent to an external server when converting text blocks?", a: "Absolutely not. The TwisterTools operational structure is 100% client-side. All processing calculations, conversion sequences, formatting injections, and validation steps run inside your local web browser engine. No character blocks, text variables, or keys are ever monitored, recorded, or transmitted over network interfaces." },
              { q: "How does the conversion software handle multilingual text or emojis?", a: "Our conversion architecture utilizes the standard UTF-8 character encoding format. When translating multi-byte characters like emojis, international language symbols, or special layout characters, the encoder generates accurate multi-byte hex string series matching standard international development guidelines." },
              { q: "Why do some hex outputs show prefix values like 0x?", a: "The '0x' prefix is an architectural programming syntax standard across languages like C, C++, Java, and JavaScript to indicate that the following numbers are base-16 hexadecimal characters. It helps computer compilation layers distinguish standard base-10 numbers from base-16 strings." },
              { q: "What causes a 'Malformed Hexadecimal Sequence' error message?", a: "This error pops up when the tool processes a string containing invalid non-hex symbols (characters outside numbers 0-9 or letters A-F). It also triggers if the hex array has uneven spacing or is missing a character in a byte segment, making it impossible to map back to text." }
            ].map((faq, i) => (
              <div key={i} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed pl-3.5">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: WHY US */}
        <section className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl md:p-10 shadow-xl p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
            High-Performance Client-Side Hex Encoding Environment
          </h2>
          <p className="text-indigo-200 text-sm md:text-base leading-relaxed mb-6">
            TwisterTools provides engineers with an agile, high-precision data utility platform that bypasses unnecessary advertising bloat and latency. Convert massive source structures, extract binary strings, format output configurations dynamically, and debug raw text elements securely with ironclad client-side performance.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { metric: "100% Local", label: "Zero Server Tracking" },
              { metric: "UTF-8 Ready", label: "Unicode Compatible" },
              { metric: "Zero Lag", label: "Instant Conversion" },
              { metric: "Format Options", label: "Custom Spacing Profiles" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                <div className="text-base md:text-lg font-bold text-indigo-300">{stat.metric}</div>
                <div className="text-[11px] text-indigo-100/70 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
