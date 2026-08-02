"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Copy,
  Check,
  Shield,
  FileText,
  Sparkles,
  Info,
  HelpCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Type,
  TrendingUp,
  Code2,
  BarChart3,
  Heading,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript Case Conversion Functions
// ─────────────────────────────────────────────────────────────
function toUpperCase(str: string): string {
  return str.toUpperCase();
}

function toLowerCase(str: string): string {
  return str.toLowerCase();
}

function toSentenceCase(str: string): string {
  if (!str) return "";
  // Keep rest lowercase, capitalize start of sentences
  const lower = str.toLowerCase();
  return lower.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, char) => {
    return separator + char.toUpperCase();
  });
}

function toTitleCase(str: string): string {
  if (!str) return "";
  const minorWords = new Set([
    "a", "an", "the", "and", "but", "for", "or", "nor",
    "at", "by", "to", "from", "in", "on", "with"
  ]);
  const lines = str.split("\n");
  return lines
    .map((line) => {
      const words = line.toLowerCase().split(/(\s+)/);
      let isFirstWord = true;
      return words
        .map((word) => {
          if (/^\s+$/.test(word)) return word;
          if (!word) return word;

          const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
          const isMinor = minorWords.has(cleanWord);

          if (isFirstWord || !isMinor) {
            isFirstWord = false;
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
          return word;
        })
        .join("");
    })
    .join("\n");
}

function toCapitalizedCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/(\s+)/)
    .map((word) => {
      if (/^\s+$/.test(word)) return word;
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

function toAlternatingCase(str: string): string {
  if (!str) return "";
  let result = "";
  let isLower = true;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (/[a-zA-Z]/.test(char)) {
      result += isLower ? char.toLowerCase() : char.toUpperCase();
      isLower = !isLower;
    } else {
      result += char;
    }
  }
  return result;
}

function toInverseCase(str: string): string {
  if (!str) return "";
  return str
    .split("")
    .map((char) => {
      const upper = char.toUpperCase();
      const lower = char.toLowerCase();
      if (char === upper) {
        return lower;
      } else {
        return upper;
      }
    })
    .join("");
}

type CasingMode =
  | "upper"
  | "lower"
  | "sentence"
  | "title"
  | "capitalized"
  | "alternating"
  | "inverse";

interface CasingAlgorithm {
  id: CasingMode;
  label: string;
  desc: string;
  func: (str: string) => string;
}

const CASING_ALGORITHMS: CasingAlgorithm[] = [
  {
    id: "upper",
    label: "UPPER CASE",
    desc: "Capitalize all letters.",
    func: toUpperCase,
  },
  {
    id: "lower",
    label: "lower case",
    desc: "Make all letters lowercase.",
    func: toLowerCase,
  },
  {
    id: "sentence",
    label: "Sentence case",
    desc: "Capitalize the first letter of each sentence.",
    func: toSentenceCase,
  },
  {
    id: "title",
    label: "Title Case",
    desc: "Capitalize principal words, ignoring prepositions/articles.",
    func: toTitleCase,
  },
  {
    id: "capitalized",
    label: "Capitalized Case",
    desc: "Capitalize the first letter of every word.",
    func: toCapitalizedCase,
  },
  {
    id: "alternating",
    label: "aLtErNaTiNg CaSe",
    desc: "Alternate letters between upper and lowercase.",
    func: toAlternatingCase,
  },
  {
    id: "inverse",
    label: "Inverse Case",
    desc: "Invert uppercase and lowercase states.",
    func: toInverseCase,
  },
];

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeMode, setActiveMode] = useState<CasingMode>("sentence");
  const [expandedFaq, setExpandedFaq] = useState<Record<number, boolean>>({});

  // ── Live Workspace Analytics ──
  const charCountWithSpaces = text.length;
  const charCountWithoutSpaces = useMemo(() => {
    return text.replace(/\s/g, "").length;
  }, [text]);
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (trimmed === "") return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  // ── Output Casing Transformation ──
  const transformedText = useMemo(() => {
    if (!text) return "";
    const algo = CASING_ALGORITHMS.find((a) => a.id === activeMode);
    return algo ? algo.func(text) : text;
  }, [text, activeMode]);

  // ── Clipboard Operations ──
  const handleCopy = async () => {
    if (!transformedText) return;
    try {
      await navigator.clipboard.writeText(transformedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback or silent exit
    }
  };

  const handleClear = () => {
    setText("");
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Pre-expand the first FAQ item
  useEffect(() => {
    setExpandedFaq({ 0: true });
  }, []);

  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Dashboard Grid ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* ══════════════════ LEFT PANEL — 6 columns ══════════════════ */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Header Banner */}
            <div className="bg-sky-50/70 dark:bg-sky-950/20 border-b border-sky-100 dark:border-sky-900/30 px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">Reactive Workspace Input</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="case-converter-input"
                  className="sr-only"
                >
                  Reactive Workspace Input
                </label>
                <textarea
                  id="case-converter-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type or paste your text here to transform its case format instantly..."
                  rows={8}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all"
                />
              </div>

              {/* Character & Word Counter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-wrap gap-4">
                  <span>
                    Words: <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong>
                  </span>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                  <span>
                    Characters (with spaces):{" "}
                    <strong className="text-slate-800 dark:text-slate-205">{charCountWithSpaces}</strong>
                  </span>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                  <span>
                    Characters (no spaces):{" "}
                    <strong className="text-slate-800 dark:text-slate-205">{charCountWithoutSpaces}</strong>
                  </span>
                </div>

                {text && (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors font-medium min-h-[40px] px-2"
                    aria-label="Clear text input"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Workspace
                  </button>
                )}
              </div>

              {/* Algorithm Selectors Indigo Grid */}
              <div className="space-y-2.5">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Conversion Mode
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CASING_ALGORITHMS.map((algo) => {
                    const isActive = activeMode === algo.id;
                    return (
                      <button
                        key={algo.id}
                        onClick={() => setActiveMode(algo.id)}
                        className={`flex flex-col items-start justify-center p-3 rounded-xl border text-left transition-all duration-200 min-h-[48px] select-none ${isActive
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-indigo-300"
                          }`}
                      >
                        <span className="text-sm font-semibold tracking-wide block truncate w-full">
                          {algo.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL — 6 columns, sticky ══════════════════ */}
        <div className="lg:col-span-6">
          <div className="sticky top-4 space-y-4">

            {/* Sticky Floating Output Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-205" />
                  <span className="text-sm font-semibold text-white">Transformed Output</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Read-Only Display Card */}
                <div className="rounded-xl bg-slate-900 dark:bg-black border border-slate-800 p-4 min-h-[180px] max-h-[260px] overflow-y-auto flex items-start scrollbar-thin">
                  {transformedText ? (
                    <p
                      id="case-converter-output"
                      className="text-slate-100 text-sm whitespace-pre-wrap break-words leading-relaxed w-full font-mono"
                    >
                      {transformedText}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-sm italic">
                      Transformed text will update here in real-time as you type in the workspace...
                    </p>
                  )}
                </div>

                {/* Inline Copy Utility Layout */}
                <button
                  id="case-copy-button"
                  onClick={handleCopy}
                  disabled={!transformedText}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${transformedText
                      ? copied
                        ? "bg-green-500 text-white shadow-md shadow-green-150"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-150 hover:shadow-lg hover:-translate-y-0.5"
                      : "bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-800"
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
                      Copy Cased Text
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                  <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                    <strong className="text-slate-850 dark:text-slate-200">100% Private.</strong> Execution occurs strictly inside your browser cache.
                  </p>
                </div>
              </div>
            </div>

            {/* Pro-Tips Card */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Privacy Pro-Tips</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <p>
                  Our Case Converter guarantees <strong>zero server-side transmission</strong>. All parsing processes execute immediately in client-side hardware memory, eliminating network latency or external exposure risk.
                </p>
                <p>
                  Use <strong>Inverse Case</strong> to sanitize mixed mixed variable definitions, or toggle <strong>Title Case</strong> to instantly configure standard marketing headlines.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT (MD5 MIRROR STANDARD)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">

        {/* Section 1: What is a Case Converter Tool? */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900/20 dark:to-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center">
              <Heading className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>What is a Case Converter Tool?</span>
          </h2>
          <div className="space-y-4">
            <p className="text-slate-750 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              An online text case converter transforms typography variables seamlessly across different structural casing schemas. Detail that while built-in text editors offer limited modifications, our advanced processing engine supports deep multi-layered parsing schemas like automated sentence logic detection and tokenized title structures.
            </p>
            <p className="text-slate-750 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              Highlight that the entire conversion runs 100% inside local device hardware memory, avoiding any connection calls, data leak windows, or latency penalties. Your content never passes through any network routing sockets.
            </p>
          </div>
        </div>

        {/* Section 2: Step-by-Step Guide to Text Transformation */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white dark:from-slate-900/40 dark:to-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Step-by-Step Guide to Text Transformation</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: "1",
                title: "Workspace Insertion",
                body: "Paste or type your target text dataset directly into our responsive workspace input panel.",
              },
              {
                step: "2",
                title: "Live Analysis Tracker",
                body: "Monitor live analytical updates including character densities and absolute word boundaries displayed natively under the content frame.",
              },
              {
                step: "3",
                title: "Casing Selection",
                body: "Select your desired conversion strategy from our primary interaction tier (including sentence case configurations, strict title rules, alternating string passes, or inverse mutations).",
              },
              {
                step: "4",
                title: "Secure Clipboard Copy",
                body: "Tap the unified copy interaction button to grab your newly reformatted content safely via the clipboard API with an immediate confirmation stamp.",
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">{title}</h3>
                    <p className="text-slate-705 dark:text-slate-350 text-sm md:text-base leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Professional Text Manipulation Use Cases */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900/20 dark:to-slate-950 border border-slate-200 dark:border-slate-855 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center">
              <Type className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Professional Text Manipulation Use Cases</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: TrendingUp,
                title: "Content Production & SEO Editing",
                body: "Swiftly sanitize headings into standard Title Case matrices, avoiding manual correction workflows across voluminous blog articles or digital copy items.",
              },
              {
                icon: Code2,
                title: "Coding & Software Engineering",
                body: "Transform variable descriptions, text mockups, string arrays, or markdown documentation assets into lower or upper constraints before code injections.",
              },
              {
                icon: Sparkles,
                title: "Marketing & Campaign Launching",
                body: "Optimize social media post hooks, advertisement copies, email subject lines, or call-to-actions instantly with high-impact Alternating or Capitalized patterns.",
              },
              {
                icon: BarChart3,
                title: "Data Scrubbing & Regularization",
                body: "Clean up chaotic formatting discrepancies across raw lists, customer logs, document inputs, or user surveys before migrating datasets to structured tracking grids.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-slate-850 dark:text-slate-200 text-sm">{title}</h3>
                </div>
                <p className="text-slate-700 dark:text-slate-350 text-sm md:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Frequently Asked Questions (FAQ) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900/20 dark:to-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Does this tool track or save the text I process here?",
                a: "Absolute privacy is guaranteed. Because our platform is engineered on a serverless client framework, 100% of the string manipulation executes straight inside your browser cache. No tracking modules, third-party listeners, database tables, or backend systems exist.",
              },
              {
                q: "What is the difference between Title Case and Capitalized Case?",
                a: "Capitalized Case forces every single white-space separated word to begin with an uppercase letter regardless of value. Title Case applies refined language logic, keeping small functional elements (prepositions, articles, and select conjunctions like 'and', 'the', 'with') lowercase unless they mark the absolute start of a line.",
              },
              {
                q: "How does the Sentence Case engine handle complex formatting?",
                a: "The sentence casing framework identifies punctuation breaks like periods, exclamation blocks, and question marks to locate individual sentence starting boundaries, capitalizing the matching character while neutralizing unexpected capitalization errors on the words that follow.",
              },
              {
                q: "Is there a character processing limit inside the text space?",
                a: "Because processing power scales on your device’s local memory architecture rather than congested server constraints, our module easily processes multi-megabyte string inputs, long articles, coding files, and high-volume lists with instantaneous conversion response rates.",
              },
            ].map(({ q, a }, idx) => {
              const isExpanded = !!expandedFaq[idx];
              return (
                <div
                  key={q}
                  className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-slate-900/50 dark:to-transparent rounded-r-xl shadow-sm transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors"
                  >
                    <h3 className="text-sm md:text-base pr-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                      {q}
                    </h3>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                  </button>
                  <div
                    className={`transition-all duration-200 overflow-hidden ${isExpanded ? "max-h-[500px] opacity-100 border-t border-slate-100 dark:border-slate-800/40 p-5" : "max-h-0 opacity-0"
                      }`}
                  >
                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                      {a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Why Choose TwisterTools for Text Processing? */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl md:p-10 shadow-lg text-white p-4 sm:p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-indigo-100" />
            </div>
            <span>Why Choose TwisterTools for Text Processing?</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Shield,
                title: "100% Offline-Safe Security",
                body: "Calculations run entirely in client hardware memory. Zero servers, zero transmission, zero data leak windows.",
              },
              {
                icon: Sparkles,
                title: "Distraction-Free Workspace",
                body: "No registration screens, no popups, no tracking cookies, and no operational restrictions.",
              },
              {
                icon: Type,
                title: "Sophisticated Grammatical Logic",
                body: "Title and sentence case systems are engineered to recognize prepositions and sentence boundaries, avoiding basic word-splitting bugs.",
              },
              {
                icon: Code2,
                title: "High Performance Limits",
                body: "Handles high-volume lists, code snippets, documentation structures, and multi-megabyte string inputs in milliseconds.",
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

      {/* JSON-LD WebApplication Schema */}
      <div className="hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Case Converter Tool",
              description:
                "Free online case converter tool supporting Sentence case, Title Case, UPPER CASE, lower case, Capitalized Case, alternating case, and inverse case conversions entirely in the browser.",
              url: "https://www.twistertools.com/tools/text-tools/case-converter",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Sentence Case conversion with smart punctuation parsing",
                "Title Case conversion ignoring minor words",
                "Capitalized Case, Upper Case, Lower Case, Alternating Case, and Inverse Case",
                "Real-time reactive character and word counter analytics",
                "Pure client-side offline execution for absolute privacy",
                "Zero data transmission or server logging",
                "One-click Copy to Clipboard and Clear Workspace functions",
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
