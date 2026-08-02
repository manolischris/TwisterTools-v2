"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Layers,
  Copy,
  Check,
  Trash2,
  Download,
  Shuffle,
  Settings,
  Sparkles,
  HelpCircle,
  Database,
  Cpu,
  Table,
  HardDrive,
  Zap,
  Info,
  FileText,
  List,
  CheckCircle2,
  Sliders,
  Filter,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type CombinationMode = "cross" | "sequential" | "all_permutations";
type SeparatorType = "space" | "hyphen" | "underscore" | "plus" | "custom" | "none";

interface ColumnState {
  id: string;
  label: string;
  text: string;
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function WordCombiner() {
  // ── Core Inputs State ──
  const [columns, setColumns] = useState<ColumnState[]>([
    { id: "col-1", label: "Prefix / List 1", text: "super\nultra\nmega\nhyper" },
    { id: "col-2", label: "Core / List 2", text: "tool\napp\nnode\nengine" },
    { id: "col-3", label: "Suffix / List 3", text: "pro\nlab\nhub\nsuite" },
  ]);

  // ── Configuration Settings ──
  const [mode, setMode] = useState<CombinationMode>("cross");
  const [separatorType, setSeparatorType] = useState<SeparatorType>("space");
  const [customSeparator, setCustomSeparator] = useState("");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [wrapInQuotes, setWrapInQuotes] = useState(false);
  const [casing, setCasing] = useState<"preserve" | "lower" | "upper" | "title">("preserve");
  
  // ── Filters & Formatting ──
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [minLength, setMinLength] = useState<number>(0);
  const [maxLength, setMaxLength] = useState<number>(100);

  // ── UI Controls State ──
  const [copied, setCopied] = useState(false);

  // ── Column Management Helpers ──
  const addColumn = () => {
    if (columns.length >= 5) return;
    const nextNum = columns.length + 1;
    setColumns((prev) => [
      ...prev,
      { id: `col-${Date.now()}`, label: `List ${nextNum}`, text: "" },
    ]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 2) return;
    setColumns((prev) => prev.filter((col) => col.id !== id));
  };

  const updateColumnText = (id: string, text: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, text } : col))
    );
  };

  const clearAllColumns = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, text: "" })));
  };

  // ── Combination Engine ──
  const combinedResults = useMemo(() => {
    // 1. Process and clean input lists
    const parsedLists = columns.map((col) => {
      let lines = col.text.split(/\r?\n/);
      if (trimWhitespace) {
        lines = lines.map((l) => l.trim());
      }
      return lines.filter((l) => l.length > 0);
    });

    // Handle empty columns gracefully
    const activeLists = parsedLists.filter((list) => list.length > 0);
    if (activeLists.length === 0) return [];

    // Determine actual delimiter string
    let sep = "";
    switch (separatorType) {
      case "space":
        sep = " ";
        break;
      case "hyphen":
        sep = "-";
        break;
      case "underscore":
        sep = "_";
        break;
      case "plus":
        sep = "+";
        break;
      case "custom":
        sep = customSeparator;
        break;
      case "none":
        sep = "";
        break;
    }

    let combinations: string[] = [];

    // 2. Combination algorithms
    if (mode === "cross") {
      // Cartesian Product across active lists
      const cartesian = (acc: string[], currList: string[]): string[] => {
        if (acc.length === 0) return currList;
        const res: string[] = [];
        for (const head of acc) {
          for (const tail of currList) {
            res.push(`${head}${sep}${tail}`);
          }
        }
        return res;
      };

      combinations = activeLists.reduce<string[]>(
        (acc, list) => cartesian(acc, list),
        []
      );
    } else if (mode === "sequential") {
      // Line-by-line index alignment (Zipper mode)
      const maxLines = Math.max(...activeLists.map((l) => l.length));
      for (let i = 0; i < maxLines; i++) {
        const parts: string[] = [];
        for (const list of activeLists) {
          if (i < list.length) {
            parts.push(list[i]);
          }
        }
        if (parts.length > 0) {
          combinations.push(parts.join(sep));
        }
      }
    } else if (mode === "all_permutations") {
      // Full permutations of non-empty words across active lists
      const flattened = activeLists.flat();
      
      const getPermutations = (arr: string[]): string[][] => {
        if (arr.length <= 1) return [arr];
        const perms: string[][] = [];
        for (let i = 0; i < arr.length; i++) {
          const current = arr[i];
          const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
          const subPerms = getPermutations(remaining);
          for (const sub of subPerms) {
            perms.push([current, ...sub]);
          }
        }
        return perms;
      };

      // Cap permutation pool size to safeguard browser CPU limits
      const limitedPool = flattened.slice(0, 7); 
      const rawPerms = getPermutations(limitedPool);
      combinations = rawPerms.map((p) => p.join(sep));
    }

    // 3. Post-processing: Case conversion, Length filtering, Quotes, Addons
    let processed = combinations.map((item) => {
      let str = item;

      // Casing adjustments
      if (casing === "lower") str = str.toLowerCase();
      else if (casing === "upper") str = str.toUpperCase();
      else if (casing === "title") {
        str = str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      }

      // Prefix and Suffix
      str = `${prefix}${str}${suffix}`;

      // Wrapping
      if (wrapInQuotes) str = `"${str}"`;

      return str;
    });

    // 4. Length Filtering
    processed = processed.filter(
      (item) => item.length >= minLength && (maxLength === 0 || item.length <= maxLength)
    );

    // 5. Deduplication
    if (removeDuplicates) {
      processed = Array.from(new Set(processed));
    }

    return processed;
  }, [
    columns,
    mode,
    separatorType,
    customSeparator,
    prefix,
    suffix,
    wrapInQuotes,
    casing,
    removeDuplicates,
    trimWhitespace,
    minLength,
    maxLength,
  ]);

  const outputText = useMemo(() => combinedResults.join("\n"), [combinedResults]);

  // ── Actions ──
  const copyToClipboard = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fallback */
    }
  };

  const downloadResults = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `combined-words-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shuffleColumns = () => {
    setColumns((prev) =>
      prev.map((col) => {
        const lines = col.text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        return { ...col, text: lines.join("\n") };
      })
    );
  };

  return (
    <div className="w-full space-y-8">

      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: Inputs & Multi-Lists ══════════════════ */}
        <div className="flex flex-col h-full space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Control Header */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <List className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Word List Inputs</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={shuffleColumns}
                  title="Randomize line order in input lists"
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Shuffle Lists</span>
                </button>
                <button
                  type="button"
                  onClick={clearAllColumns}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 hover:border-rose-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              {/* Dynamic Columns Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {columns.map((col, idx) => (
                  <div key={col.id} className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-xs font-bold text-slate-700 truncate">
                        {col.label}
                      </label>
                      {columns.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeColumn(col.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove list column"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={col.text}
                      onChange={(e) => updateColumnText(col.id, e.target.value)}
                      placeholder={`Enter words...\n(One per line)`}
                      className="w-full h-48 p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white resize-none text-slate-800 transition-all"
                    />
                    <span className="text-[10px] text-slate-400 text-right font-mono">
                      {col.text.split(/\r?\n/).filter((l) => l.trim().length > 0).length} items
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Column Action */}
              {columns.length < 5 && (
                <button
                  type="button"
                  onClick={addColumn}
                  className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Add Additional Word List Column (Max 5)</span>
                </button>
              )}

              {/* Combination Mode Options */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Combination Strategy
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cross", label: "Cross Product", desc: "A x B x C Matrix" },
                    { id: "sequential", label: "Sequential Zip", desc: "Line-by-Line Match" },
                    { id: "all_permutations", label: "Permutations", desc: "All Order Variations" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id as CombinationMode)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        mode === m.id
                          ? "bg-indigo-50/80 border-indigo-300 text-indigo-900"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-xs font-bold">{m.label}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delimiter & Formatting Controls */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Separator</label>
                  <select
                    value={separatorType}
                    onChange={(e) => setSeparatorType(e.target.value as SeparatorType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="space">Space (" ")</option>
                    <option value="hyphen">Hyphen ("-")</option>
                    <option value="underscore">Underscore ("_")</option>
                    <option value="plus">Plus ("+")</option>
                    <option value="none">None ("")</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {separatorType === "custom" ? (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Custom Symbol</label>
                    <input
                      type="text"
                      value={customSeparator}
                      onChange={(e) => setCustomSeparator(e.target.value)}
                      placeholder="e.g. ::"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Text Casing</label>
                    <select
                      value={casing}
                      onChange={(e) => setCasing(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="preserve">As Entered</option>
                      <option value="lower">lowercase</option>
                      <option value="upper">UPPERCASE</option>
                      <option value="title">Title Case</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Add Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. get-"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Add Suffix</label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. .com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Additional Toggle Filters */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeDuplicates}
                    onChange={(e) => setRemoveDuplicates(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Deduplicate Output</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wrapInQuotes}
                    onChange={(e) => setWrapInQuotes(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Wrap in Quotes ("")</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trimWhitespace}
                    onChange={(e) => setTrimWhitespace(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Trim Spaces</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: Output & Export ══════════════════ */}
        <div className="flex flex-col h-full space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Zap className="w-4 h-4 text-indigo-200" />
                </div>
                <span className="text-sm font-semibold">Generated Combinations</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadResults}
                  disabled={combinedResults.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export TXT</span>
                </button>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col space-y-4">
              {/* Output Preview Window */}
              <div className="relative flex-1">
                <textarea
                  readOnly
                  value={outputText}
                  placeholder="Generated combinations will appear here automatically..."
                  className="w-full h-80 p-4 font-mono text-xs bg-slate-900 text-indigo-200 border border-slate-800 rounded-xl resize-none focus:outline-none leading-relaxed"
                />
              </div>

              {/* Dynamic Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Total Output
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 font-mono">
                    {combinedResults.length.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Character Count
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 font-mono">
                    {outputText.length.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Active Lists
                  </span>
                  <span className="text-sm font-extrabold text-indigo-600 font-mono">
                    {columns.filter((c) => c.text.trim().length > 0).length} of {columns.length}
                  </span>
                </div>
              </div>

              {/* Main Copy Action Button */}
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={combinedResults.length === 0}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                  combinedResults.length > 0
                    ? copied
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied {combinedResults.length} Phrases!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy All Combined Words</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        {/* Card 1: Technical Architecture */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of Combinatorial Phrase Generation</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Combinatorial generation is a core computational task across search engine optimization (SEO), digital marketing, software domain strategy, and programmatic content engineering. At its core, combining multiple word lists relies on computing the Cartesian Product of discrete sets or executing set permutations under strict delimiter constraints.
            </p>
            <p>
              When merging $N$ independent word sets $S_1, S_2, \dots, S_N$, the absolute size of the resulting Cartesian Product $P$ is determined by the product of their individual cardinalities:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-mono text-sm text-indigo-900">
              |P| = |S_1| x |S_2| x ... x |S_N| = Product(i=1 to N) |S_i|
            </div>
            <p>
              This exponential multiplication scaling means that even modest list sizes (e.g., three lists of 50 terms each) yield $50 \times 50 \times 50 = 125,000$ unique phrase combinations. Managing these computations efficiently directly inside the browser client requires zero-dependency, linear-memory processing algorithms that prevent interface lag or memory exhaustion.
            </p>
          </div>
        </div>

        {/* Card 2: Permutation & Cross-Product Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Combinatorial Generation & Sanitization Pipeline</span>
          </h2>
          <div className="space-y-5">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Our word combination engine executes a strict multi-stage data processing pipeline designed to handle thousands of permutations in real time:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  step: "1",
                  title: "Tokenization & Line Sanitization",
                  body: "Raw inputs across all active list columns are split by line break boundaries, trimmed of leading/trailing spaces, and stripped of empty elements.",
                },
                {
                  step: "2",
                  title: "Cartesian & Permutation Assembly",
                  body: "The engine iteratively pairs items across sets using non-blocking reducer arrays or zipper alignments according to the selected mode.",
                },
                {
                  step: "3",
                  title: "Delimiter Injection & Casing",
                  body: "Configured separators (hyphens, spaces, custom characters) and casing rules (lowercase, UPPERCASE, Title Case) are applied systematically.",
                },
                {
                  step: "4",
                  title: "Deduplication & Length Filtering",
                  body: "Result set elements are evaluated against length parameters and deduplicated via ES6 Set structures to ensure 100% unique outputs.",
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
                      <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Comparison Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Combination Modes & Business Application Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            Selecting the optimal combination strategy depends on your specific digital workflow. The reference matrix below outlines common use cases and output behavior:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Mode Strategy</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Mathematical Behavior</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Primary Output Example</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Target Use Cases</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Cross Product (Matrix)", "S1 × S2 × S3", "super-tool-pro, ultra-app-hub", "SEO Keyword Research, Domain Name Hunting"],
                  ["Sequential Zipper", "S1[i] + S2[i] + S3[i]", "super-tool-pro, ultra-app-lab", "Paired Metadata Generation, Batch Renaming"],
                  ["Full Permutations", "P(S_flat)", "tool-super-pro, pro-tool-super", "Brand Naming, Trademark Availability Checks"],
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={`px-4 py-3 text-sm border-b border-slate-100 ${
                          cellIdx === 0 ? "font-mono font-bold text-indigo-700" : "text-slate-700"
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
        </div>

        {/* Card 4: Enterprise Use Cases */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Industry Workflows & Optimization Use Cases</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "PPC & Google Ads Campaign Structuring",
                body: "Build broad, match-type, and exact keyword lists by combining product categories with intent modifiers (e.g., 'buy', 'best', 'online') and geographic locations.",
              },
              {
                title: "Domain Name & SaaS Brand Discovery",
                body: "Merge prefixes, core brand concepts, and industry suffixes using empty or hyphenated delimiters to identify available brandable domain names.",
              },
              {
                title: "E-Commerce SKU & Tag Formatting",
                body: "Combine product attributes (color, size, material, model) into uniform product titles, database SKUs, and inventory tags.",
              },
              {
                title: "Security Testing & Seed Wordlists",
                body: "Generate custom candidate wordlists and phrase combinations for authorized password auditing and synthetic test data creation.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <h3 className="font-semibold text-slate-800 mb-2 text-sm">
                  {title}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Static FAQs */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions (FAQ)</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Is there a limit to how many words or combinations I can process?",
                a: "The tool executes entirely in your browser using local memory. You can process thousands of combinations instantly. For permutation mode, inputs are limited to prevent browser tab locking.",
              },
              {
                q: "How does the deduplication filter work?",
                a: "Deduplication uses an internal JavaScript Set data structure to filter out duplicate phrases after applying case conversions, prefixes, suffixes, and wrapping.",
              },
              {
                q: "Is my input word list private?",
                a: "Yes, 100%. All processing occurs locally on your device in real time. No word lists or generated outputs are ever transmitted to external servers.",
              },
              {
                q: "Can I use custom multi-character separators?",
                a: "Absolutely. Select the 'Custom' option in the separator dropdown to enter any character string, such as colons (::), slashes (/), or custom symbols.",
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
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Platform Advantages */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Platform Performance Advantages</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Zap,
                title: "Instant In-Memory Calculation",
                body: "Uses reactive state hooks to compute phrase cross-products instantly as you type.",
              },
              {
                icon: Cpu,
                title: "Multi-List Flexibility",
                body: "Supports up to 5 parallel input lists with customizable headers and line controls.",
              },
              {
                icon: HardDrive,
                title: "One-Click TXT Exporting",
                body: "Download your complete generated phrase matrix directly to your local file system.",
              },
              {
                icon: FileText,
                title: "Zero Server Dependencies",
                body: "Operates 100% client-side with full privacy and zero bandwidth consumption.",
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
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Word Combiner & Phrase Generator",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            description: "Combine multiple word lists, generate keyword permutations, domain ideas, and phrase matrices instantly.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
                name: "Is there a limit to how many words or combinations I can process?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The tool executes entirely in your browser using local memory. You can process thousands of combinations instantly.",
                },
              },
              {
                "@type": "Question",
                name: "How does the deduplication filter work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Deduplication uses a Set data structure to filter duplicate phrases after applying case and delimiter options.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}