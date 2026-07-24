"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowRightLeft,
  Copy,
  Check,
  Shield,
  HelpCircle,
  Sparkles,
  Trash2,
  LayoutGrid,
  TableProperties,
  ShieldCheck,
  Terminal,
  Lock,
  FileText
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Transformation Constants & Mapping Data
// ─────────────────────────────────────────────────────────────

const REVERSAL_MODES = [
  {
    id: "reverse-chars",
    label: "Reverse Text",
    desc: "Invert every single character backward: abc -> cba"
  },
  {
    id: "reverse-words",
    label: "Reverse Word Order",
    desc: "Invert word sequences while keeping word letters forward"
  },
  {
    id: "flip-all",
    label: "Flip Wording & Letters",
    desc: "Simultaneously reverse character orders and word orders"
  },
  {
    id: "upside-down",
    label: "Upside Down Text",
    desc: "Flip standard Latin alphanumeric characters upside down using Unicode symbols"
  },
  {
    id: "mirror-lines",
    label: "Mirror Flip Text",
    desc: "Reverse lines horizontally while keeping line order intact"
  }
] as const;

type ReversalMode = (typeof REVERSAL_MODES)[number]["id"];

const UPSIDE_DOWN_MAP: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ",
  i: "ᴉ", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d",
  q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x",
  y: "ʎ", z: "z",
  A: "∀", B: "𐐒", C: "Ɔ", D: "◖", E: "Ǝ", F: "Ⅎ", G: "Ɔ", H: "H",
  I: "I", J: "ſ", K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ",
  Q: "Ό", R: "ᴚ", S: "S", T: "┴", U: "∩", V: "Λ", W: "M", X: "X",
  Y: "⅄", Z: "Z",
  "0": "0", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ",
  "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  ".": "˙", ",": "‘", "'": ",", "\"": ",,", "`": ",",
  "?": "¿", "!": "¡", "&": "⅋", "_": "‾",
  "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{"
};

const SAMPLE_TEXT =
  "The quick brown fox jumps over the lazy dog.\n" +
  "TwisterTools provides serverless browser utilities.\n" +
  "Reverse, flip, and mirror text in real-time.";

export default function ReverseTextGenerator() {
  const [text, setText] = useState("");
  const [activeMode, setActiveMode] = useState<ReversalMode>("reverse-chars");
  const [copied, setCopied] = useState(false);

  // ─────────────────────────────────────────────────────────────
  //  Reactive Transformation Logic
  // ─────────────────────────────────────────────────────────────
  const transformedText = useMemo(() => {
    if (!text) return "";

    switch (activeMode) {
      case "reverse-chars":
        // Invert every single character backward
        return text.split("").reverse().join("");

      case "reverse-words":
        // Invert individual word sequences while keeping word letters forward
        return text
          .split("\n")
          .map((line) => {
            const parts = line.split(/(\s+)/).filter((p) => p !== "");
            return parts.reverse().join("");
          })
          .join("\n");

      case "flip-all": {
        // Simultaneously reverse character orders and word orders
        const reversedChars = text.split("").reverse().join("");
        return reversedChars
          .split("\n")
          .map((line) => {
            const parts = line.split(/(\s+)/).filter((p) => p !== "");
            return parts.reverse().join("");
          })
          .join("\n");
      }

      case "upside-down":
        // Utilizing a localized mapping matrix to flip alphanumeric letters upside down
        return text
          .split("")
          .map((char) => UPSIDE_DOWN_MAP[char] || char)
          .reverse()
          .join("");

      case "mirror-lines":
        // Reverse lines horizontally (reverse each line's characters individually)
        return text
          .split("\n")
          .map((line) => line.split("").reverse().join(""))
          .join("\n");

      default:
        return text;
    }
  }, [text, activeMode]);

  // ─────────────────────────────────────────────────────────────
  //  Live Statistics & Density Metrics
  // ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const charCount = text.length;
    const trimmed = text.trim();
    const wordCount = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
    const lines = text === "" ? 0 : text.split("\n").length;

    // Average line length density (excluding trailing empty linebreaks)
    const activeLines = text.split("\n").filter(l => l.length > 0);
    const totalLineChars = activeLines.reduce((acc, l) => acc + l.length, 0);
    const avgLineLength = activeLines.length > 0 ? (totalLineChars / activeLines.length).toFixed(1) : "0.0";

    return { charCount, wordCount, lineCount: lines, avgLineLength };
  }, [text]);

  // ─────────────────────────────────────────────────────────────
  //  Clipboard Action Handler
  // ─────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!transformedText) return;
    try {
      await navigator.clipboard.writeText(transformedText);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div className="space-y-8">
      {/* Interactive Tool Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ══════════════════ LEFT PANEL: WORKSPACE ══════════════════ */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 md:p-6 space-y-5">

            {/* Header & Quick Action Row */}
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="workspace-input" className="text-sm font-semibold uppercase tracking-wider text-slate-505 dark:text-slate-400">
                Workspace Entry Input
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setText(SAMPLE_TEXT)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-250 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 transition-colors min-h-[40px]"
                >
                  Load Sample Text
                </button>
                {text && (
                  <button
                    type="button"
                    onClick={() => setText("")}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-650 dark:text-red-400 transition-colors flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Input
                  </button>
                )}
              </div>
            </div>

            {/* Main Interactive Textarea */}
            <textarea
              id="workspace-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your multi-line layout text here to transform..."
              rows={10}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all font-mono leading-relaxed"
            />

            {/* Character & Word Density Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-3 text-xs text-slate-650 dark:text-slate-400">
              <div>
                <span className="block text-slate-500 dark:text-slate-500">Characters</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{metrics.charCount}</span>
              </div>
              <div>
                <span className="block text-slate-500 dark:text-slate-500">Words</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{metrics.wordCount}</span>
              </div>
              <div>
                <span className="block text-slate-500 dark:text-slate-500">Lines</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{metrics.lineCount}</span>
              </div>
              <div>
                <span className="block text-slate-500 dark:text-slate-500">Avg. Line Length</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{metrics.avgLineLength} <span className="text-[10px] text-slate-550 font-normal">chars</span></span>
              </div>
            </div>

            {/* Transform Mode Modifiers Bar */}
            <div className="space-y-3 pt-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Choose Transformation Mode
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {REVERSAL_MODES.map((mode) => {
                  const isActive = activeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setActiveMode(mode.id)}
                      className={`flex flex-col items-start justify-center p-3 rounded-xl border text-left transition-all duration-200 min-h-[48px] select-none ${isActive
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-indigo-300"
                        }`}
                    >
                      <span className="text-sm font-semibold tracking-wide block truncate w-full">
                        {mode.label}
                      </span>
                      <span className={`text-[10px] leading-tight block mt-0.5 line-clamp-1 ${isActive ? "text-indigo-100" : "text-slate-500 dark:text-slate-500"
                        }`}>
                        {mode.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: FLOATING OUTPUT ══════════════════ */}
        <div className="lg:col-span-6">
          <div className="sticky top-6 space-y-6">

            {/* Output Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
              {/* Slate-to-Indigo Gradient Header Bar */}
              <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm font-semibold">Transformed Output</span>
                </div>
              </div>

              <div className="p-5 md:p-6 space-y-5">

                {/* Read-Only Output Window */}
                <div className="rounded-xl bg-slate-900 dark:bg-black border border-slate-800 p-4 min-h-[160px] max-h-[300px] overflow-y-auto flex items-start scrollbar-thin">
                  {transformedText ? (
                    <p className="text-slate-100 text-sm whitespace-pre-wrap break-words leading-relaxed w-full font-mono select-all">
                      {transformedText}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-sm italic w-full">
                      Transformed output will generate here in real-time as you enter text in the workspace...
                    </p>
                  )}
                </div>

                {/* Full-width Copy Result Utility */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!transformedText}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px] transition-all duration-200 border ${!transformedText
                        ? "bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        : copied
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                      }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Result
                      </>
                    )}
                  </button>

                  {/* 2-second success banner overlay */}
                  {copied && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3 flex items-start gap-2.5 transition-all">
                      <Check className="w-4 h-4 text-emerald-605 dark:text-emerald-450 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 leading-normal">
                        <strong className="block font-bold">Successfully Copied!</strong>
                        <span className="font-normal block mt-0.5">The inverted text payload has been transferred to your system clipboard.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Data Privacy & Serverless Isolation Disclaimer */}
                <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl p-3">
                  <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-normal text-slate-650 dark:text-slate-400">
                    <strong className="text-slate-850 dark:text-slate-300 block font-semibold mb-0.5">100% Serverless Processing</strong>
                    Your text inputs are mutated entirely within local browser RAM. No text data is transmitted over the network or stored in databases.
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO AUTHORITATIVE CONTENT BLOCK (BELOW THE FOLD)
      ───────────────────────────────────────────────────────────── */}
      <div className="pt-8">

        {/* Section 1: Comprehensive Technical Breakdown: What is Text Reversal? */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <LayoutGrid className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            Comprehensive Technical Breakdown: What is Text Reversal?
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-4">
            The mechanical architecture of string inversion involves manipulating structural array boundaries at the character, word, or line level. While an standard text processor views string characters as an unbroken linear timeline sequence, programmatic compilers and script parsers map individual string values to precise integer index offsets inside local memory caches.
          </p>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            A high-performance text manipulation tool does not merely read strings backward; it dynamically reorganizes indices or maps character data variants across localized arrays. This tool provides an advanced playground for structural string reversal across multiple processing modes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <strong className="text-slate-900 dark:text-slate-100 block mb-1">Binary Level Character Mirroring</strong>
              <p className="text-slate-750 dark:text-slate-400 text-sm leading-relaxed">
                Reversing every character backward step-by-step from index length down to zero.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <strong className="text-slate-900 dark:text-slate-100 block mb-1">Tokenized Word Boundary Reversal</strong>
              <p className="text-slate-750 dark:text-slate-400 text-sm leading-relaxed">
                Splitting string blocks into semantic arrays using space character indicators, reversing the word slots, and re-joining strings while maintaining local letter directions forward.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <strong className="text-slate-900 dark:text-slate-100 block mb-1">Vertical Line Order Sequences</strong>
              <p className="text-slate-750 dark:text-slate-400 text-sm leading-relaxed">
                Flipping multi-line document inputs upside down vertically so the bottom line sequence positions cleanly at the top of the workspace.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <strong className="text-slate-900 dark:text-slate-100 block mb-1">Unicode Matrix Transformations</strong>
              <p className="text-slate-755 dark:text-slate-400 text-sm leading-relaxed">
                Passing characters through localized translation maps to render inverted text styles like turning character orientations upside down.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Alphanumeric Mapping Table: How Inversion Engines Process Text */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <TableProperties className="w-6 h-6 text-indigo-650 dark:text-indigo-400 flex-shrink-0" />
            Alphanumeric Mapping Table: How Inversion Engines Process Text
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-4">
            To understand how Unicode mappings flip character outputs upside down, view our structural transformation matrix table below:
          </p>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 dark:bg-slate-950 text-white">
                <tr>
                  {["Original Character Type", "Standard Logic", "Upside Down Unicode Shift", "System Processing Array"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Lowercase Alphabet", "a, b, c, d, e, f, g", "ɐ, q, ɔ, p, ǝ, ɟ, b", "Char Map [0x0250 + index]"],
                  ["Uppercase Alphabet", "A, B, C, D, E, F, G", "∀, 𐐒, Ɔ, ◖, Ǝ, Ⅎ, ⅁", "Matrix Vector Map Index"],
                  ["Numeric Characters", "1, 2, 3, 4, 5, 6, 7", "Ɩ, ⇚, Ɛ, ߈, ϛ, 9, L", "Scalar Array Constant substitution"]
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-850/50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-mono ${j === 0
                            ? "font-semibold text-slate-700 dark:text-slate-300"
                            : j === 2
                              ? "text-indigo-700 dark:text-indigo-400 font-medium"
                              : j === 3
                                ? "text-slate-505 dark:text-slate-500 text-xs"
                                : "text-slate-650 dark:text-slate-400"
                          }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Step-by-Step Local Execution Workflow Matrix */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-indigo-650 dark:text-indigo-400 flex-shrink-0" />
            Step-by-Step Local Execution Workflow Matrix
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            To guarantee a 100% zero-data-leak pipeline, our text reverser executes conversions through a strict client-side architectural sequence:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-3">1</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Data Entry & Sanitization Layer</h3>
              <p className="text-slate-700 dark:text-slate-400 text-xs md:text-sm leading-relaxed mt-1">
                The user inputs raw textual content into the workspace textarea field. The DOM instantly counts array parameters without communicating with an external API node.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-3">2</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Tokenization & Structural Filtering</h3>
              <p className="text-slate-700 dark:text-slate-400 text-xs md:text-sm leading-relaxed mt-1">
                Depending on the selected transformation option, our client-side Javascript engine handles string segment parsing using fast regular expression logic rules.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-3">3</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Local Memory Mapping Execution</h3>
              <p className="text-slate-700 dark:text-slate-400 text-xs md:text-sm leading-relaxed mt-1">
                String characters are processed directly within your local device memory allocation. This ensures instantaneous rendering speeds with zero data overhead.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-3">4</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Clipboard API Injection</h3>
              <p className="text-slate-700 dark:text-slate-400 text-xs md:text-sm leading-relaxed mt-1">
                The converted string payload registers cleanly to your device's hardware memory clipboard using a secure single-action click.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Advanced Developer Use Cases & Code Stress Testing Scenarios */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <Terminal className="w-6 h-6 text-indigo-650 dark:text-indigo-400 flex-shrink-0" />
            Advanced Developer Use Cases & Code Stress Testing Scenarios
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            Our text flipper handles multiple technical workflows across various product verification pipelines:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow bg-slate-50/30 dark:bg-slate-900/40">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base mb-2">Algorithmic Boundary Testing</h3>
              <p className="text-slate-700 dark:text-slate-400 text-sm leading-relaxed">
                Software engineers use reversed and upside-down text blocks to stress-test system inputs, form validations, database string limits, and character encoding compatibility lines.
              </p>
            </div>
            <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow bg-slate-50/30 dark:bg-slate-900/40">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base mb-2">Data Obfuscation & Security Masking</h3>
              <p className="text-slate-700 dark:text-slate-400 text-sm leading-relaxed">
                System designers flip configuration string keys, log records, or temporary code signatures backward to quickly obscure visibility parameters before running encryption routines.
              </p>
            </div>
            <div className="p-5 border border-slate-100 dark:border-slate-805 rounded-xl hover:shadow-md transition-shadow bg-slate-50/30 dark:bg-slate-900/40">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base mb-2">Markdown & Layout Design</h3>
              <p className="text-slate-700 dark:text-slate-400 text-sm leading-relaxed">
                Front-end creators use flipped and mirror-image typography arrays to construct stylized website badges, unique headers, or custom watermarks.
              </p>
            </div>
            <div className="p-5 border border-slate-100 dark:border-slate-805 rounded-xl hover:shadow-md transition-shadow bg-slate-50/30 dark:bg-slate-900/40">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base mb-2">Registry & Database Cleaning</h3>
              <p className="text-slate-700 dark:text-slate-400 text-sm leading-relaxed">
                Database teams reverse mixed column datasets or raw user lists to identify hidden spacing errors, trailing character flaws, or encoding discrepancies.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: In-Depth Frequently Asked Questions (FAQ) */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <HelpCircle className="w-6 h-6 text-indigo-650 dark:text-indigo-400 flex-shrink-0" />
            In-Depth Frequently Asked Questions (FAQ)
          </h2>

          <div className="space-y-5 mt-4">
            {[
              {
                q: "Is my text transmitted to a cloud server or logging network?",
                a: "Absolutely not. TwisterTools is built entirely on a local browser execution architecture. 100% of your string conversions run within your browser's local sandbox memory. No external network data packets are sent, no server routes log your configurations, and your text data stays entirely isolated on your local hardware device."
              },
              {
                q: "Why do certain symbols look skewed when flipped upside down?",
                a: "Flipped text relies on selecting matching Unicode characters that represent standard alphabet letters rotated by 180 degrees. Since standard system fonts can render these custom Unicode characters with slight variations, minor styling differences can occur across older operating systems or alternative browser display engines."
              },
              {
                q: "What is the exact difference between Reversing Characters and Reversing Word Orders?",
                a: "Reversing characters mirrors the entire string block from back to front, reading every letter backward. Reversing word order tokenizes sentences by their space boundaries, changing the position of the words themselves while keeping each word's inner letter layout readable from left to right."
              }
            ].map(({ q, a }, index) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  Q{index + 1}: {q}
                </h3>
                <p className="text-slate-700 dark:text-slate-350 text-sm md:text-base leading-relaxed">
                  A{index + 1}: {a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Why Choose the TwisterTools Technical Workspace? */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg text-white mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose the TwisterTools Technical Workspace?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Shield,
                title: "Zero Server Overhead",
                body: "100% client-side processing executes transformations inside browser RAM, ensuring zero latency and zero data leaks."
              },
              {
                icon: ArrowRightLeft,
                title: "Multimode Inversion",
                body: "Access 5 distinct string transformation modes including letter reversing, word sequence flips, line mirroring, and upside down unicode rotations."
              },
              {
                icon: FileText,
                title: "Advanced Text Metrics",
                body: "Analyze text layouts instantly with reactive metrics showing word count, character count (with and without spaces), line count, and average line density."
              },
              {
                icon: Terminal,
                title: "Developer Stress Testing",
                body: "Generate flipped, reversed, and malformed Unicode strings to test forms, databases, input fields, and character encoding compatibility lines."
              },
              {
                icon: Sparkles,
                title: "Graphic & Styling Sandbox",
                body: "Quickly flip content backward or upside down to construct stylized hooks, watermarks, artistic layout layouts, or copy for social networks."
              },
              {
                icon: Lock,
                title: "Zero-Dependency Engine",
                body: "Built entirely using native client-side JavaScript APIs and static Unicode matrix lookups—lightweight, fast, and secure."
              }
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
      </div>

      {/* JSON-LD Structured Metadata */}
      <div className="hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Reverse Text Generator",
              "description": "Free online reverse text generator supporting standard string reversing, reversing word order, flipping letters, upside down alphanumeric conversion, and mirror flipping characters horizontally in the browser.",
              "url": "https://www.twistertools.com/tools/text-tools/reverse-text-generator",
              "applicationCategory": "UtilityApplication",
              "operatingSystem": "Any",
              "browserRequirements": "Requires JavaScript.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Reverse text character order backwards",
                "Reverse word order line-by-line while keeping letters forward",
                "Flip letters and wording simultaneously",
                "Generate upside-down text via static Unicode character mapping",
                "Mirror flip text lines horizontally",
                "Real-time character, word, and line count metrics",
                "100% serverless browser isolation for security and privacy"
              ],
              "author": {
                "@type": "Organization",
                "name": "TwisterTools"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Is my text transmitted to a cloud server or logging network?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely not. TwisterTools is built entirely on a local browser execution architecture. 100% of your string conversions run within your browser's local sandbox memory. No external network data packets are sent, no server routes log your configurations, and your text data stays entirely isolated on your local hardware device."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why do certain symbols look skewed when flipped upside down?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Flipped text relies on selecting matching Unicode characters that represent standard alphabet letters rotated by 180 degrees. Since standard system fonts can render these custom Unicode characters with slight variations, minor styling differences can occur across older operating systems or alternative browser display engines."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is the exact difference between Reversing Characters and Reversing Word Orders?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Reversing characters mirrors the entire string block from back to front, reading every letter backward. Reversing word order tokenizes sentences by their space boundaries, changing the position of the words themselves while keeping each word's inner letter layout readable from left to right."
                  }
                }
              ]
            })
          }}
        />
      </div>
    </div>
  );
}
