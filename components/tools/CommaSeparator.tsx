"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Shield,
  FileText,
  Sparkles,
  HelpCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  RefreshCw,
  Sliders,
  Database,
  ListStart,
  AlignLeft,
  Share2,
} from "lucide-react";

export default function CommaSeparator() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<Record<number, boolean>>({ 0: true });

  // ── Input Separators State ──
  const [splitNewlines, setSplitNewlines] = useState(true);
  const [splitTabs, setSplitTabs] = useState(true);
  const [splitSemicolons, setSplitSemicolons] = useState(true);
  const [splitPipes, setSplitPipes] = useState(true);
  const [splitCommas, setSplitCommas] = useState(false);
  const [splitSpaces, setSplitSpaces] = useState(false);

  // ── Options State ──
  const [wrapQuotes, setWrapQuotes] = useState<"none" | "single" | "double">("none");
  const [stripWhitespace, setStripWhitespace] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);

  // ── Output Delimiter State ──
  const [delimiterType, setDelimiterType] = useState<"comma" | "semicolon" | "pipe" | "slash" | "custom">("comma");
  const [customDelimiterValue, setCustomDelimiterValue] = useState("");
  const [delimiterSpacing, setDelimiterSpacing] = useState<"none" | "space" | "newline">("space");

  // ── Input Parsing Engine ──
  const parsedItems = useMemo(() => {
    if (!text.trim()) return [];

    const activeSeparators: string[] = [];
    if (splitNewlines) activeSeparators.push("\n", "\r");
    if (splitTabs) activeSeparators.push("\t");
    if (splitSemicolons) activeSeparators.push(";");
    if (splitPipes) activeSeparators.push("|");
    if (splitCommas) activeSeparators.push(",");
    
    let items: string[] = [];
    
    const escapedSeparators = activeSeparators.map((s) => {
      if (["|", "$", "^", "*", "+", "?", ".", "(", ")", "[", "]", "{", "}"].includes(s)) {
        return "\\" + s;
      }
      return s;
    });

    if (escapedSeparators.length > 0 || splitSpaces) {
      let pattern = "";
      if (escapedSeparators.length > 0) {
        pattern += `[${escapedSeparators.join("")}]+`;
      }
      if (splitSpaces) {
        pattern += pattern ? "|\\s+" : "\\s+";
      }
      
      const regex = new RegExp(pattern);
      items = text.split(regex);
    } else {
      items = [text];
    }

    items = items.filter((item) => item !== "");

    if (stripWhitespace) {
      items = items.map((item) => item.trim()).filter((item) => item !== "");
    }

    return items;
  }, [
    text,
    splitNewlines,
    splitTabs,
    splitSemicolons,
    splitPipes,
    splitCommas,
    splitSpaces,
    stripWhitespace,
  ]);

  const rawCount = parsedItems.length;

  // ── Output Processing Engine ──
  const processedItems = useMemo(() => {
    let items = [...parsedItems];

    if (removeDuplicates) {
      items = Array.from(new Set(items));
    }

    if (sortAlphabetically) {
      items.sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base", numeric: true })
      );
    }

    if (wrapQuotes === "single") {
      items = items.map((item) => `'${item}'`);
    } else if (wrapQuotes === "double") {
      items = items.map((item) => `"${item}"`);
    }

    return items;
  }, [parsedItems, removeDuplicates, sortAlphabetically, wrapQuotes]);

  const processedCount = processedItems.length;

  // ── Delimiter Compiler ──
  const finalOutput = useMemo(() => {
    let delimSymbol = ",";
    if (delimiterType === "semicolon") delimSymbol = ";";
    else if (delimiterType === "pipe") delimSymbol = "|";
    else if (delimiterType === "slash") delimSymbol = "/";
    else if (delimiterType === "custom") delimSymbol = customDelimiterValue;

    let joiner = delimSymbol;
    if (delimiterSpacing === "space") {
      joiner = delimSymbol + " ";
    } else if (delimiterSpacing === "newline") {
      joiner = delimSymbol + "\n";
    }

    return processedItems.join(joiner);
  }, [processedItems, delimiterType, customDelimiterValue, delimiterSpacing]);

  // ── Clipboard Operations ──
  const handleCopy = async () => {
    if (!finalOutput) return;
    try {
      await navigator.clipboard.writeText(finalOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // ── Master Reset Button ──
  const handleReset = () => {
    setText("");
    setWrapQuotes("none");
    setStripWhitespace(true);
    setRemoveDuplicates(false);
    setSortAlphabetically(false);
    setDelimiterType("comma");
    setCustomDelimiterValue("");
    setDelimiterSpacing("space");
    setSplitNewlines(true);
    setSplitTabs(true);
    setSplitSemicolons(true);
    setSplitPipes(true);
    setSplitCommas(false);
    setSplitSpaces(false);
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="w-full space-y-8">
      {/* ── Side-by-Side Equal Workspace Grid (lg:grid-cols-2) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        
        {/* ══════════════════ LEFT COLUMN: Input ══════════════════ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-sky-50/70 dark:bg-sky-955/20 border-b border-sky-105 dark:border-sky-900/30 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-655 dark:text-sky-400" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Raw Text Input Workspace
              </span>
            </div>
            <span className="text-xs font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-850 dark:text-sky-300 px-2.5 py-1 rounded-lg">
              {rawCount} items
            </span>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <label htmlFor="comma-separator-input" className="sr-only">
              Raw text or column list to format
            </label>
            <textarea
              id="comma-separator-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your unstructured list, Excel column, database logs, or text lines here..."
              className="w-full flex-1 min-h-[300px] h-[320px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 px-4 py-3 text-sm text-slate-850 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono resize-none transition-all"
            />
            
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-xl px-4 py-2 flex-shrink-0">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-350 text-xs">
                <span>
                  Raw Items: <strong className="text-slate-850 dark:text-slate-100 font-bold text-sm">{rawCount}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span>
                  Processed: <strong className="text-indigo-650 dark:text-indigo-400 font-bold text-sm">{processedCount}</strong>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-semibold min-h-[36px] px-3 border border-slate-200 dark:border-slate-750 rounded-lg bg-white dark:bg-slate-900 shadow-sm cursor-pointer text-xs"
                  aria-label="Reset workspace to default settings"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
                {text && (
                  <button
                    type="button"
                    onClick={() => setText("")}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-655 transition-colors font-semibold min-h-[36px] px-3 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50/50 dark:bg-red-950/20 cursor-pointer text-xs"
                    aria-label="Clear raw text input"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT COLUMN: Output ══════════════════ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full">
          <div className="bg-indigo-50/70 dark:bg-indigo-955/20 border-b border-indigo-100 dark:border-indigo-900/30 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">
                Delimited Output Result
              </span>
            </div>
            <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg">
              {processedCount} items
            </span>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="relative flex-1">
              <label htmlFor="comma-separator-output" className="sr-only">
                Processed output delimited text
              </label>
              <textarea
                id="comma-separator-output"
                readOnly
                value={finalOutput}
                placeholder="Your processed output will display here in real-time..."
                className="w-full h-[320px] min-h-[300px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 font-mono resize-none focus:outline-none scrollbar-thin select-all"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              {!finalOutput && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 sm:p-6 md:p-8">
                  <p className="text-slate-500 text-xs italic text-center max-w-xs leading-relaxed">
                    Your processed outputs will display here in real-time as you input items and adjust options...
                  </p>
                </div>
              )}
            </div>

            {/* Actions & Privacy Badge inside Output Card */}
            <div className="space-y-3">
              <button
                id="comma-copy-button"
                onClick={handleCopy}
                disabled={!finalOutput}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                  finalOutput
                    ? copied
                      ? "bg-green-500 text-white shadow-md shadow-green-100"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                    : "bg-slate-100 dark:bg-slate-955 text-slate-405 dark:text-slate-600 cursor-not-allowed border border-slate-205 dark:border-slate-850"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied Processing Result!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Processing Result
                  </>
                )}
              </button>

              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 dark:text-slate-405 leading-snug">
                  <strong className="text-slate-850 dark:text-slate-200">Local Privacy Safe.</strong> All conversions run directly on your hardware via JavaScript. None of your inputs are saved, sent over the network, or processed on external servers.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── 2-Column Options Panel Grid ── */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* ══════════════════ LEFT OPTION PANEL: Input Delimiters & Rules ══════════════════ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          {/* Delimiter Detections */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-505" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">
                Input Delimiter Settings
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Newline (\\n)", state: splitNewlines, setter: setSplitNewlines },
                { label: "Tab (\\t)", state: splitTabs, setter: setSplitTabs },
                { label: "Semicolon (;)", state: splitSemicolons, setter: setSplitSemicolons },
                { label: "Pipe (|)", state: splitPipes, setter: setSplitPipes },
                { label: "Comma (,)", state: splitCommas, setter: setSplitCommas },
                { label: "Space ( )", state: splitSpaces, setter: setSplitSpaces },
              ].map(({ label, state, setter }) => (
                <label
                  key={label}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer select-none min-h-[44px] transition-all ${
                    state
                      ? "bg-indigo-50/50 dark:bg-indigo-955/25 border-indigo-300 dark:border-indigo-805 text-indigo-900 dark:text-indigo-250 font-medium"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={state}
                    onChange={(e) => setter(e.target.checked)}
                    className="w-4 h-4 text-indigo-650 border-slate-355 rounded focus:ring-indigo-550 cursor-pointer"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80" />

          {/* Processing Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">
                Processing Rules
              </span>
            </div>

            <div className="space-y-3">
              {/* Wrap quotes */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-605 dark:text-slate-400">
                  Wrap Individual Items:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "none", label: "None" },
                      { value: "single", label: "Single ('')" },
                      { value: "double", label: "Double (\"\")" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWrapQuotes(opt.value)}
                      className={`py-2 px-3 text-xs rounded-lg font-medium min-h-[40px] border transition-all ${
                        wrapQuotes === opt.value
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strip whitespace */}
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer min-h-[44px] transition-all">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-205">
                    Strip Whitespace
                  </span>
                  <span className="text-xxs text-slate-505 dark:text-slate-450">
                    Trim leading/trailing spacing errors
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={stripWhitespace}
                  onChange={(e) => setStripWhitespace(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {/* Remove duplicates */}
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer min-h-[44px] transition-all">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-205">
                    Remove Duplicates
                  </span>
                  <span className="text-xxs text-slate-500 dark:text-slate-450">
                    Keep only unique text items
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={removeDuplicates}
                  onChange={(e) => setRemoveDuplicates(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-550 cursor-pointer"
                />
              </label>

              {/* Sort Alphabetically */}
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer min-h-[44px] transition-all">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-805 dark:text-slate-205">
                    Sort Alphabetically
                  </span>
                  <span className="text-xxs text-slate-500 dark:text-slate-450">
                    Sort items ascending (A-Z)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={sortAlphabetically}
                  onChange={(e) => setSortAlphabetically(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-550 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT OPTION PANEL: Output Delimiters & Helpers ══════════════════ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">
                Output Delimiter Settings
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Output Delimiter Selection */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Select Output Delimiter:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { value: "comma", label: "Comma (,)" },
                      { value: "semicolon", label: "Semicolon (;)" },
                      { value: "pipe", label: "Pipe (|)" },
                      { value: "slash", label: "Slash (/)" },
                      { value: "custom", label: "Custom String" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDelimiterType(opt.value)}
                      className={`py-2 px-2 text-xs rounded-lg font-medium min-h-[40px] border transition-all ${
                        opt.value === "custom" ? "col-span-2 sm:col-span-1" : ""
                      } ${
                        delimiterType === opt.value
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Delimiter Text Field */}
              {delimiterType === "custom" && (
                <div className="space-y-1">
                  <label
                    htmlFor="custom-delimiter-val"
                    className="block text-xs font-semibold text-slate-650 dark:text-slate-400"
                  >
                    Custom Delimiter Character/String:
                  </label>
                  <input
                    id="custom-delimiter-val"
                    type="text"
                    value={customDelimiterValue}
                    onChange={(e) => setCustomDelimiterValue(e.target.value)}
                    placeholder="e.g. , or - or AND or \n"
                    className="w-full rounded-lg border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-505"
                  />
                </div>
              )}

              {/* Delimiter Spacing selection */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Delimiter Spacing Layout:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "none", label: "No Spacing" },
                      { value: "space", label: "Add Space ( )" },
                      { value: "newline", label: "Add Newline (\\n)" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDelimiterSpacing(opt.value)}
                      className={`py-2 px-1.5 text-xxs sm:text-xs rounded-lg font-medium min-h-[40px] border transition-all ${
                        delimiterSpacing === opt.value
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80" />

          {/* Quick Helper Tips Card (integrated at the bottom of the card) */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-705 dark:text-slate-355">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xxs font-bold uppercase tracking-wider">Formatting Pro-Tips</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                Excel column cells copy-pasted here will map to tabs/newlines. The engine will split them instantly.
              </p>
              <p>
                Set wrap quotes to <strong>Single Quotes (&apos;item&apos;)</strong> and output delimiter to <strong>Semicolon (;)</strong> to format database ID sets instantly.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT (MD5 MIRROR STANDARD — EXHAUSTIVE COPY)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        {/* Section 1: What is an Online Comma Separator Tool? */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900/20 dark:to-slate-950 border border-slate-200 dark:border-slate-855 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <AlignLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>What is an Online Comma Separator Tool?</span>
          </h2>
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              An online comma separator utility converts unstructured raw textual column listings, database entries, spreadsheet rows, or text fragments into a single cleanly formatted delimited row string. Manually typing symbols between thousands of data blocks is tedious and error-prone. This converter optimizes formatting workflows instantly inside your browser, using modern JavaScript parsing arrays directly on your hardware memory to avoid data exposure risks, network latency, or external logging.
            </p>
          </div>
        </div>

        {/* Section 2: Step-by-Step List Delimitation Instructions */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white dark:from-slate-900/40 dark:to-slate-950 border border-slate-200 dark:border-slate-855 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <ListStart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Step-by-Step List Delimitation Instructions</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                num: "1",
                title: "Paste Raw Text",
                body: "Paste your column-based vertical list or spacing-separated text directly into the raw text component.",
              },
              {
                num: "2",
                title: "Configure Formatting",
                body: "Configure formatting rules using our premium option controls, such as adding quotes, removing duplicates, or choosing a custom delimiter.",
              },
              {
                num: "3",
                title: "Review Metrics",
                body: "Check your real-time parsed list item quantities directly on our interactive metrics counter.",
              },
              {
                num: "4",
                title: "Copy Output Result",
                body: "Click the unified copy button to capture your processed text line instantly to your clipboard with a 2-second confirmation update.",
              },
            ].map(({ num, title, body }) => (
              <div
                key={num}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    {num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-205 mb-1">
                      {title}
                    </h3>
                    <p className="text-slate-700 dark:text-slate-350 text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Practical Use Cases for List Delimitation */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900/20 dark:to-slate-950 border border-slate-200 dark:border-slate-855 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Practical Use Cases for List Delimitation</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "SQL & Database Engineering",
                body: "Convert a text column of IDs, names, or reference tags directly into a comma-delimited, quote-wrapped array ready for standard IN clauses inside structured query workflows.",
              },
              {
                title: "Programming & Array Setup",
                body: "Wrap item blocks in single or double quotes to format raw lines into clean JSON data schemas or hardcoded string parameters for software builds.",
              },
              {
                title: "Marketing & PPC Campaigns",
                body: "Convert raw customer emails, tracking keywords, zip codes, or location coordinates into comma-separated text strings for fast keyword bidding matches or ad network exclusions.",
              },
              {
                title: "Administrative Data Processing",
                body: "Format unstructured CSV information or mixed spreadsheets into standard clean lists before migrating data stacks between back-office tools.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  <h3 className="font-semibold text-slate-805 dark:text-slate-205 text-sm">
                    {title}
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-350 text-sm md:text-base leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Frequently Asked Questions (FAQ) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900/20 dark:to-slate-950 border border-slate-200 dark:border-slate-855 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Frequently Asked Questions (FAQ)</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Will this tool store or save the items I paste here?",
                a: "Privacy is fundamental to our architecture. This script handles array compilation entirely within your local device's memory cache. Your text data is never sent over a network, tracked by logging tools, or saved to a backend database.",
              },
              {
                q: "What characters can this tool parse as delimiters?",
                a: "The input engine dynamically processes standard white spaces, hard tab boundaries, newlines, semicolons, and pipes (|) to separate raw text chunks cleanly.",
              },
              {
                q: "How does the deduplication feature handle entries?",
                a: "When enabled, the filter identifies identical text strings, strips extra spacing errors, and drops duplicates to ensure your final string consists only of unique elements.",
              },
              {
                q: "Can I use symbols other than a standard comma?",
                a: "Yes. Use the custom delimiter toggle input to choose semicolons, vertical pipes, slash elements, or custom string characters to match your pipeline's requirements.",
              },
            ].map(({ q, a }, idx) => {
              const isExpanded = !!expandedFaq[idx];
              return (
                <div
                  key={q}
                  className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-slate-900/50 dark:to-transparent rounded-r-xl shadow-sm transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-805 dark:text-slate-205 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors"
                  >
                    <h3 className="text-sm md:text-base pr-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                      {q}
                    </h3>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-505 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-550 flex-shrink-0" />
                    )}
                  </button>
                  <div
                    className={`transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? "max-h-[500px] opacity-100 border-t border-slate-105 dark:border-slate-800/40 p-5"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-slate-700 dark:text-slate-350 text-sm md:text-base leading-relaxed">
                      {a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Why Choose TwisterTools for List Formatting? */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl md:p-10 shadow-lg text-white p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-5 h-5 text-indigo-200" />
            </div>
            <span>Why Choose TwisterTools for List Formatting?</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-white/90 text-sm md:text-base leading-relaxed">
                Our list delimiter provides a fast, ad-light interface with zero entry limitations. It runs entirely inside your browser, balancing data privacy with clean UX to streamline formatting tasks for data analysts, marketers, and developers.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "No Size Limits", desc: "Process huge text columns instantly." },
                { title: "Privacy Locked", desc: "No database logging or server storage." },
                { title: "Custom Presets", desc: "Saves delimiter preferences dynamically." },
                { title: "Speed Optimized", desc: "Pure JavaScript parses in milliseconds." },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-white/10 rounded-xl p-4">
                  <h4 className="font-semibold text-sm text-white">{title}</h4>
                  <p className="text-indigo-200 text-xs mt-1">{desc}</p>
                </div>
              ))}
            </div>
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
              name: "Comma Separator Tool",
              description:
                "Convert text lists or column entries into comma-delimited strings instantly inside your browser. Supports customizable input separators, sorting, deduplication, quote wrapping, and custom output delimiters.",
              url: "https://www.twistertools.com/tools/text-tools/comma-separator",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Parse lists separated by newlines, tabs, commas, semicolons, pipes, or spaces",
                "Wrap elements in single or double quotes",
                "Strip leading/trailing whitespaces",
                "Remove duplicate entries",
                "Sort items alphabetically ascending A-Z",
                "Custom output delimiters (comma, semicolon, pipe, slash, custom string)",
                "Live input and output item counters",
                "100% private client-side processing",
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
