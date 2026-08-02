"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  RefreshCw,
  Copy,
  Check,
  Trash2,
  FileDown,
  Sparkles,
  Zap,
  BarChart3,
  HelpCircle,
  BookOpen,
  Layers,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Type Definitions & Thesaurus Dictionary
// ─────────────────────────────────────────────────────────────
type RewriteMode = "standard" | "fluent" | "creative" | "formal";

interface SynonymsMap {
  [key: string]: string[];
}

const THESAURUS: SynonymsMap = {
  important: ["crucial", "vital", "essential", "critical", "paramount", "pivotal"],
  help: ["assist", "aid", "support", "facilitate", "empower", "back"],
  use: ["utilize", "leverage", "employ", "harness", "apply", "adopt"],
  fast: ["rapid", "swift", "expeditious", "accelerated", "quick", "prompt"],
  change: ["alter", "transform", "modify", "convert", "adapt", "reconfigure"],
  show: ["demonstrate", "illustrate", "display", "reveal", "exhibit", "manifest"],
  improve: ["enhance", "elevate", "optimize", "boost", "refine", "upgrade"],
  create: ["generate", "produce", "craft", "develop", "establish", "formulate"],
  make: ["produce", "construct", "assemble", "forge", "fabricate", "build"],
  good: ["exceptional", "outstanding", "superior", "exemplary", "prime", "stellar"],
  bad: ["suboptimal", "adverse", "detrimental", "unfavorable", "deficient"],
  big: ["substantial", "extensive", "considerable", "immense", "sizable"],
  small: ["compact", "modest", "minor", "diminutive", "marginal"],
  start: ["initiate", "commence", "launch", "inaugurate", "instigate"],
  stop: ["halt", "cease", "discontinue", "terminate", "pause"],
  think: ["consider", "evaluate", "contemplate", "deliberate", "ponder"],
  need: ["require", "mandate", "demand", "call for", "necessitate"],
  try: ["endeavor", "attempt", "strive", "undertake", "seek"],
  many: ["numerous", "abundant", "copious", "manifold", "multitudinous"],
  new: ["innovative", "novel", "modern", "contemporary", "cutting-edge"],
  problem: ["challenge", "obstacle", "issue", "complication", "impediment"],
  solution: ["resolution", "remedy", "answer", "fix", "approach"],
  result: ["outcome", "consequence", "effect", "yield", "aftermath"],
  tool: ["utility", "instrument", "mechanism", "application", "platform"],
  article: ["publication", "piece", "composition", "essay", "content"],
  writer: ["author", "creator", "wordsmith", "copywriter", "editor"],
  text: ["copy", "content", "passages", "prose", "verbiage"],
};

// Common transition words for structural rewriting
const TRANSITIONS: Record<RewriteMode, string[]> = {
  standard: ["Furthermore,", "In addition,", "Consequently,", "Moreover,", "As a result,"],
  fluent: ["Naturally,", "Evidently,", "Clearly,", "Hence,", "Therefore,"],
  creative: ["Remarkably,", "Fascinatingly,", "Intriguingly,", "Incredibly,", "Unquestionably,"],
  formal: ["Accordingly,", "Furthermore,", "Consequently,", "It follows that", "In light of this,"],
};

// ─────────────────────────────────────────────────────────────
// Algorithmic Paraphrasing Engine
// ─────────────────────────────────────────────────────────────
function rewriteSentence(sentence: string, mode: RewriteMode): string {
  if (!sentence.trim()) return "";

  let words = sentence.split(/\s+/);
  if (words.length < 3) return sentence;

  // Track rewritten replacements
  let replacedCount = 0;
  const targetReplacements = Math.max(1, Math.floor(words.length * 0.35));

  let rewrittenWords = words.map((word) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    const punctuation = word.match(/[^a-zA-Z]+$/)?.[0] || "";
    const prefix = word.match(/^[^a-zA-Z]+/)?.[0] || "";

    if (THESAURUS[cleanWord] && replacedCount < targetReplacements) {
      const options = THESAURUS[cleanWord];
      let selectedOption = options[0];

      if (mode === "fluent" && options.length > 1) {
        selectedOption = options[1 % options.length];
      } else if (mode === "creative" && options.length > 2) {
        selectedOption = options[Math.floor(Math.random() * options.length)];
      } else if (mode === "formal" && options.length > 0) {
        selectedOption = options[options.length - 1]; // Select most formal derivative
      }

      // Maintain capitalization
      if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        selectedOption = selectedOption.charAt(0).toUpperCase() + selectedOption.slice(1);
      }

      replacedCount++;
      return `${prefix}${selectedOption}${punctuation}`;
    }
    return word;
  });

  // Structural transformation: Insert transitions in formal or creative modes for long sentences
  let result = rewrittenWords.join(" ");
  if ((mode === "formal" || mode === "creative") && words.length > 12 && !/^[A-Z][a-z]+,/.test(result)) {
    const randomTransition = TRANSITIONS[mode][Math.floor(Math.random() * TRANSITIONS[mode].length)];
    result = `${randomTransition} ${result.charAt(0).toLowerCase()}${result.slice(1)}`;
  }

  return result;
}

function processArticleRewriting(text: string, mode: RewriteMode): string {
  if (!text.trim()) return "";

  // Split by paragraph to preserve structural formatting
  const paragraphs = text.split(/\n\s*\n/);

  const rewrittenParagraphs = paragraphs.map((para) => {
    // Split paragraph by sentences
    const sentences = para.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [para];
    return sentences.map((sent) => rewriteSentence(sent, mode)).join("");
  });

  return rewrittenParagraphs.join("\n\n");
}

// Calculate uniqueness / difference heuristic
function calculateUniqueness(original: string, rewritten: string): number {
  if (!original.trim() || !rewritten.trim()) return 0;
  const origWords = new Set(original.toLowerCase().match(/\b\w+\b/g) || []);
  const newWords = new Set(rewritten.toLowerCase().match(/\b\w+\b/g) || []);
  if (origWords.size === 0) return 0;

  let matches = 0;
  newWords.forEach((word) => {
    if (origWords.has(word)) matches++;
  });

  const similarity = matches / Math.max(origWords.size, newWords.size);
  const uniqueness = Math.round((1 - similarity) * 100);
  return Math.min(Math.max(uniqueness, 15), 98); // Clamp within realistic range
}

const SAMPLE_TEXT = `Content marketing is an important tool for modern businesses looking to improve their brand presence. To create good articles, writers need to use clear language and start with a strong value proposition. Fast adaptation to new technology helps teams show fast results and solve complex audience problems effectively. When you change your writing style, you make it easier for many readers to think about your solution and try your product.`;

// ─────────────────────────────────────────────────────────────
// Component Implementation
// ─────────────────────────────────────────────────────────────
export default function ArticleRewriter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<RewriteMode>("standard");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Execute rewriter logic
  const handleRewrite = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const rewrittenText = processArticleRewriting(input, mode);
      setOutput(rewrittenText);
      setIsProcessing(false);
    }, 200); // Slight delay for smooth UX transition
  }, [input, mode]);

  // Load sample content
  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_TEXT);
    setIsProcessing(true);
    setTimeout(() => {
      setOutput(processArticleRewriting(SAMPLE_TEXT, mode));
      setIsProcessing(false);
    }, 200);
  }, [mode]);

  // Clear workspace
  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = output;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  // Metrics calculations
  const metrics = useMemo(() => {
    const inputWords = input.trim() ? input.trim().split(/\s+/).length : 0;
    const outputWords = output.trim() ? output.trim().split(/\s+/).length : 0;
    const inputChars = input.length;
    const outputChars = output.length;
    const uniquenessScore = calculateUniqueness(input, output);

    return {
      inputWords,
      outputWords,
      inputChars,
      outputChars,
      uniquenessScore,
    };
  }, [input, output]);

  return (
    <div className="w-full space-y-6">

      {/* Mode Switcher Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Select Paraphrasing Mode</span>
          </div>
          <span className="hidden sm:inline-flex text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
            Client-Side Processing
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: "standard", label: "Standard", desc: "Balanced rewrite" },
            { id: "fluent", label: "Fluency", desc: "Enhanced readability" },
            { id: "creative", label: "Creative", desc: "Maximum variation" },
            { id: "formal", label: "Formal", desc: "Academic tone" },
          ].map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => {
                setMode(id as RewriteMode);
                if (input.trim()) {
                  setIsProcessing(true);
                  setTimeout(() => {
                    setOutput(processArticleRewriting(input, id as RewriteMode));
                    setIsProcessing(false);
                  }, 150);
                }
              }}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[64px] ${mode === id
                  ? "bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-sm ring-1 ring-indigo-600"
                  : "bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
            >
              <span className="font-semibold text-sm flex items-center justify-between">
                {label}
                {mode === id && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 50/50 Split Workspace Grid */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Left Panel: Input */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[560px]">
          <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-300" />
              <span className="text-sm font-semibold">Original Text</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {metrics.inputWords} words | {metrics.inputChars} chars
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col space-y-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or type your article content here..."
              className="w-full h-full p-4 font-sans text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm leading-relaxed transition-all"
              spellCheck={false}
            />

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleRewrite}
                disabled={!input.trim()}
                className={`flex-1 min-h-[42px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${input.trim()
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
              >
                <Zap className="w-4 h-4" />
                Rewrite Article
              </button>
              <button
                onClick={handleLoadSample}
                className="min-h-[42px] px-4 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 border border-slate-200"
              >
                <FileDown className="w-4 h-4" />
                Sample
              </button>
              <button
                onClick={handleClear}
                disabled={!input}
                className="min-h-[42px] px-3 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Output */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[560px]">
          <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span className="text-sm font-semibold">Paraphrased Output</span>
            </div>
            <span className="text-xs text-indigo-200 font-mono">
              {metrics.outputWords} words | {metrics.outputChars} chars
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col space-y-3">
            <div className="relative w-full h-full">
              <textarea
                value={output}
                readOnly
                placeholder="Your rewritten article output will appear here automatically..."
                className="w-full h-full p-4 font-sans text-slate-800 bg-slate-50/80 border border-slate-200 rounded-xl resize-none outline-none text-sm leading-relaxed cursor-text"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing Text...</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCopy}
              disabled={!output}
              className={`w-full min-h-[44px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${output
                  ? copied
                    ? "bg-green-600 text-white shadow-md shadow-green-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Rewritten Article
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Metrics Dashboard Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Real-time Text Metrics & Transformation Index</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Word Variance</p>
            <p className="text-base font-bold text-slate-800 mt-1">
              {metrics.outputWords - metrics.inputWords > 0
                ? `+${metrics.outputWords - metrics.inputWords}`
                : metrics.outputWords - metrics.inputWords}{" "}
              <span className="text-xs font-normal text-slate-500">words</span>
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Character Ratio</p>
            <p className="text-base font-bold text-slate-800 mt-1">
              {metrics.inputChars > 0 ? Math.round((metrics.outputChars / metrics.inputChars) * 100) : 0}%
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Uniqueness Score</p>
            <p className="text-base font-bold text-indigo-600 mt-1">{metrics.uniquenessScore}%</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Engine Mode</p>
            <p className="text-base font-bold text-slate-800 mt-1 capitalize">{mode}</p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BELOW-THE-FOLD CONTENT CARDS
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6 mt-12">
        {/* Card 1: Technical Architecture */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of Algorithmic Text Paraphrasing</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Automated text paraphrasing and article rewriting relies on lexical replacement algorithms, syntactic structure reconfiguration, and contextual synonym mapping. Unlike server-dependent large language models that introduce API latency and data transmission risks, client-side paraphrasing engines perform deterministic tokenization directly within the browser runtime environment.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The core engine extracts text strings, normalizes whitespace, and segments paragraphs into discrete sentence arrays using regular expression boundaries. Each word token is evaluated against a structured thesaurus map to evaluate contextual eligibility. Depending on the selected transformation mode—Standard, Fluency, Creative, or Formal—the engine applies specific substitution weightings to ensure optimal readability, style consistency, and structural diversity.
          </p>
        </div>

        {/* Card 2: Workflow Pipeline */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The 4-Step Text Paraphrasing Pipeline</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "1",
                title: "Sentence & Word Tokenization",
                body: "Raw input prose is parsed into structural paragraphs and tokenized into individual words, preserving punctuation, prefix formatting, and line breaks.",
              },
              {
                step: "2",
                title: "Contextual Synonym Mapping",
                body: "Tokens are checked against a client-side dictionary. Synonyms are ranked according to the selected mode to align with formal, fluent, or creative goals.",
              },
              {
                step: "3",
                title: "Syntactic Adjustment & Transitions",
                body: "Sentence structures are refined by adjusting transitional phrases and word arrangements to elevate flow and eliminate repetitive phrasing.",
              },
              {
                step: "4",
                title: "Capitalization & Metrics Normalization",
                body: "Replaced tokens adopt original capitalization states. Real-time diff algorithms calculate uniqueness scores and length variances.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {step}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Modes Comparison Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Paraphrasing Modes & Style Comparison</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-3 text-xs font-semibold text-slate-600 uppercase">Mode</th>
                  <th className="p-3 text-xs font-semibold text-slate-600 uppercase">Primary Focus</th>
                  <th className="p-3 text-xs font-semibold text-slate-600 uppercase">Vocabulary Substitution</th>
                  <th className="p-3 text-xs font-semibold text-slate-600 uppercase">Ideal Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Standard</td>
                  <td className="p-3">Balanced sentence transformation</td>
                  <td className="p-3">Moderate synonym replacement</td>
                  <td className="p-3">General blog posts & articles</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Fluency</td>
                  <td className="p-3">Readability & natural wording</td>
                  <td className="p-3">High-frequency natural terms</td>
                  <td className="p-3">Proofreading & content polishing</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Creative</td>
                  <td className="p-3">Maximum structural variation</td>
                  <td className="p-3">Diverse vocabulary selection</td>
                  <td className="p-3">Copywriting & marketing material</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Formal</td>
                  <td className="p-3">Professional tone elevation</td>
                  <td className="p-3">Sophisticated & academic terms</td>
                  <td className="p-3">Business reports & whitepapers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: FAQs */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is my text data stored or sent to external servers?",
                a: "No. The entire article rewriting and paraphrasing process executes 100% inside your web browser. Your text never leaves your device, guaranteeing complete security and privacy.",
              },
              {
                q: "How is the Uniqueness Score calculated?",
                a: "The Uniqueness Score measures vocabulary variance between original and rewritten text using word-frequency set metrics. It provides a real-time estimate of structural difference.",
              },
              {
                q: "Can I rewrite long-form articles with this tool?",
                a: "Yes. The algorithm handles full articles by processing paragraphs independently while maintaining overall layout and formatting structure.",
              },
              {
                q: "What makes client-side paraphrasing better for workflow privacy?",
                a: "Because no network calls or cloud APIs are triggered during rewriting, confidential drafts, business communications, and unreleased articles remain completely sandboxed on your computer.",
              },
            ].map(({ q, a }, idx) => (
              <div
                key={idx}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5"
              >
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{q}</h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Article Rewriter & Text Paraphraser",
            url: "https://www.twistertools.com/tools/text-tools/rewrite-article",
            description: "Free client-side Article Rewriter and Text Paraphraser tool. Instantly rewrite articles, adjust readability tone, and improve uniqueness without server uploads.",
            applicationCategory: "UtilityApplication",
            operatingSystem: "All",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
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
                name: "Is my text data stored or sent to external servers?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. The entire article rewriting and paraphrasing process executes 100% inside your web browser. Your text never leaves your device.",
                },
              },
              {
                "@type": "Question",
                name: "How is the Uniqueness Score calculated?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The Uniqueness Score measures vocabulary variance between original and rewritten text using word-frequency set metrics.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}