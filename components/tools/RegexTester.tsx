"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  SearchCode,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Flag,
  Code,
  Cpu,
  Table,
  FileText,
  HelpCircle,
  CheckCircle,
  Shield,
  Zap,
  RefreshCw,
  Trash2,
  Hash,
  Braces,
  Split,
  Layers,
  Terminal,
  BookOpen,
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
interface MatchResult {
  fullMatch: string;
  groups: (string | undefined)[];
  index: number;
}

interface TokenExplanation {
  token: string;
  explanation: string;
}

// ─────────────────────────────────────────────────────────────
//  Utility: Token Explainer
// ─────────────────────────────────────────────────────────────
function explainRegexTokens(pattern: string): TokenExplanation[] {
  const explanations: TokenExplanation[] = [];
  const tokenDefs: [RegExp, string][] = [
    [/\\d/g, "Matches any digit character [0-9]"],
    [/\\D/g, "Matches any non-digit character"],
    [/\\w/g, "Matches any word character [a-zA-Z0-9_]"],
    [/\\W/g, "Matches any non-word character"],
    [/\\s/g, "Matches any whitespace character (space, tab, newline)"],
    [/\\S/g, "Matches any non-whitespace character"],
    [/\\b/g, "Asserts a word boundary position"],
    [/\\B/g, "Asserts a non-word boundary position"],
    [/\\t/g, "Matches a tab character (U+0009)"],
    [/\\n/g, "Matches a newline character (U+000A)"],
    [/\\r/g, "Matches a carriage return character (U+000D)"],
    [/\./g, "Wildcard: matches any single character except newline"],
    [/\^/g, "Anchors the match to the start of the string or line"],
    [/\$/g, "Anchors the match to the end of the string or line"],
    [/\+/g, "Greedy quantifier: matches one or more of the preceding element"],
    [/\*/g, "Kleene star: matches zero or more of the preceding element"],
    [/\?/g, "Makes the preceding element optional (zero or one match)"],
    [/\|/g, "Alternation operator: acts as logical OR between patterns"],
    [/\(/g, "Opens a capturing group for back-referencing"],
    [/\)/g, "Closes a capturing group"],
    [/\[/g, "Opens a character class set"],
    [/\]/g, "Closes a character class set"],
    [/\{/g, "Opens a quantifier range specification"],
    [/\}/g, "Closes a quantifier range specification"],
  ];

  for (const [regex, explanation] of tokenDefs) {
    regex.lastIndex = 0;
    const match = pattern.match(regex);
    if (match) {
      explanations.push({ token: match[0], explanation });
    }
  }

  return explanations;
}

// ─────────────────────────────────────────────────────────────
//  Utility: Sample Data
// ─────────────────────────────────────────────────────────────
const SAMPLE_PATTERN = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}";
const SAMPLE_TEXT = `Welcome to the Regex Tester!

Contact us at support@twistertools.com for assistance.
Our sales team can be reached at sales@twistertools.com.
For feedback, write to feedback@example.org.

Server IP addresses: 192.168.1.1, 10.0.0.255, 172.16.0.1
Phone numbers: +1-555-123-4567, +44-20-7946-0958
Dates: 2024-01-15, 2023-12-25, 2025-06-30

The quick brown fox jumps over the lazy dog.
Hello World! Testing 1-2-3.`;

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function RegexTester() {
  // ── State ──
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });
  const [testSubject, setTestSubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);

  // ── Compute Regex ──
  const flagString = useMemo(() => {
    return Object.entries(flags)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join("");
  }, [flags]);

  const regexResult = useMemo(() => {
    if (!pattern.trim()) {
      setError(null);
      setMatchResults([]);
      setTotalMatches(0);
      setExecutionTime(null);
      return null;
    }

    try {
      const start = performance.now();
      const regex = new RegExp(pattern, flagString);
      const results: MatchResult[] = [];
      let match: RegExpExecArray | null;
      let count = 0;

      // Reset lastIndex for global flag
      let lastIndex = 0;

      if (flags.g) {
        let execMatch: RegExpExecArray | null;
        const globalRegex = new RegExp(pattern, flagString);
        while ((execMatch = globalRegex.exec(testSubject)) !== null) {
          results.push({
            fullMatch: execMatch[0],
            groups: Array.from(execMatch).slice(1),
            index: execMatch.index,
          });
          count++;
          if (execMatch.index === globalRegex.lastIndex) globalRegex.lastIndex++;
          // Safety limit
          if (count > 10000) break;
        }
      } else {
        // Non-global: single match
        const execMatch = regex.exec(testSubject);
        if (execMatch) {
          results.push({
            fullMatch: execMatch[0],
            groups: Array.from(execMatch).slice(1),
            index: execMatch.index,
          });
          count = 1;
        }
      }

      const end = performance.now();
      setExecutionTime(end - start);
      setError(null);
      setMatchResults(results);
      setTotalMatches(count);
      return regex;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid regular expression";
      setError(msg);
      setMatchResults([]);
      setTotalMatches(0);
      setExecutionTime(null);
      return null;
    }
  }, [pattern, flagString, testSubject, flags.g]);

  // ── Token Explanations ──
  const tokenExplanations = useMemo(() => {
    if (!pattern.trim()) return [];
    return explainRegexTokens(pattern);
  }, [pattern]);

  // ── Group Captures ──
  const groupCaptures = useMemo(() => {
    if (matchResults.length === 0) return [];
    // Find max groups
    const maxGroups = Math.max(...matchResults.map((r) => r.groups.length));
    const captures: { groupIndex: number; values: string[] }[] = [];
    for (let i = 0; i < maxGroups; i++) {
      const values = matchResults
        .map((r) => r.groups[i])
        .filter((v): v is string => v !== undefined);
      if (values.length > 0) {
        captures.push({ groupIndex: i + 1, values });
      }
    }
    return captures;
  }, [matchResults]);

  // ── Highlighted Text ──
  const highlightedText = useMemo(() => {
    if (!pattern.trim() || matchResults.length === 0 || error) {
      return testSubject;
    }

    // Build segments
    const segments: { text: string; highlighted: boolean; index: number }[] = [];
    let lastEnd = 0;

    // Sort matches by index
    const sorted = [...matchResults].sort((a, b) => a.index - b.index);

    for (const match of sorted) {
      if (match.index > lastEnd) {
        segments.push({
          text: testSubject.slice(lastEnd, match.index),
          highlighted: false,
          index: -1,
        });
      }
      segments.push({
        text: match.fullMatch,
        highlighted: true,
        index: match.index,
      });
      lastEnd = match.index + match.fullMatch.length;
    }

    if (lastEnd < testSubject.length) {
      segments.push({
        text: testSubject.slice(lastEnd),
        highlighted: false,
        index: -1,
      });
    }

    return segments;
  }, [testSubject, matchResults, pattern, error]);

  // ── Copy Handler ──
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  }, []);

  // ── Load Sample ──
  const loadSample = useCallback(() => {
    setPattern(SAMPLE_PATTERN);
    setTestSubject(SAMPLE_TEXT);
    setFlags({ g: true, i: false, m: false, s: false, u: false });
    setError(null);
  }, []);

  // ── Clear Workspace ──
  const clearWorkspace = useCallback(() => {
    setPattern("");
    setTestSubject("");
    setFlags({ g: true, i: false, m: false, s: false, u: false });
    setError(null);
    setMatchResults([]);
    setTotalMatches(0);
    setExecutionTime(null);
  }, []);

  // ── Copy Match Results ──
  const copyMatchResults = useCallback(() => {
    if (matchResults.length === 0) return;
    const text = matchResults
      .map(
        (r, i) =>
          `[${i + 1}] Position ${r.index}: "${r.fullMatch}"${r.groups.some((g) => g !== undefined)
            ? ` Groups: [${r.groups
              .map((g, gi) => (g !== undefined ? `$${gi + 1}="${g}"` : ""))
              .filter(Boolean)
              .join(", ")}]`
            : ""
          }`
      )
      .join("\n");
    copyToClipboard(text);
  }, [matchResults, copyToClipboard]);

  // ── Flag Toggle ──
  const toggleFlag = useCallback((flag: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  }, []);

  // ─────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Dashboard Grid ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL (8/12) ══════════════════ */}
        <div className="lg:col-span-7 space-y-5">
          {/* Pattern Input */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label
                htmlFor="regex-pattern"
                className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"
              >
                <SearchCode className="w-4 h-4 text-indigo-600" />
                Regular Expression Pattern
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-slate-400 font-mono text-sm">/</span>
                </div>
                <input
                  id="regex-pattern"
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter your regex pattern (e.g., [a-z]+)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-4 py-3 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-slate-400 font-mono text-sm">/{flagString || "—"}</span>
                </div>
              </div>
            </div>

            {/* Flag Toggles */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" />
                Flags
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "g" as const, label: "Global", desc: "g" },
                  { key: "i" as const, label: "Case-Insensitive", desc: "i" },
                  { key: "m" as const, label: "Multi-line", desc: "m" },
                  { key: "s" as const, label: "Dot All", desc: "s" },
                  { key: "u" as const, label: "Unicode", desc: "u" },
                ].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    id={`regex-flag-${key}`}
                    onClick={() => toggleFlag(key)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border min-h-[44px] ${flags[key]
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                        : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    aria-pressed={flags[key]}
                  >
                    <span className="font-mono text-xs font-bold uppercase">{desc}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Subject */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label
                htmlFor="regex-test-subject"
                className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                Test Subject Text
              </label>
              <textarea
                id="regex-test-subject"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                placeholder="Paste or type the text you want to search through..."
                rows={12}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all font-mono"
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Syntax Error</p>
                  <p className="text-xs text-red-600 mt-0.5 font-mono">{error}</p>
                </div>
              </div>
            )}

            {/* Toolbar Controls */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                id="regex-load-sample"
                onClick={loadSample}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                Load Sample Data
              </button>
              <button
                id="regex-clear"
                onClick={clearWorkspace}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                Clear Workspace
              </button>
            </div>
          </div>

          {/* Match Visualization - Standalone Widget */}
          {pattern.trim() && testSubject && !error && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm font-semibold">Match Visualization</span>
                </div>
                {totalMatches > 0 && (
                  <span className="text-[10px] font-medium text-indigo-200 bg-white/15 px-2 py-0.5 rounded-full">
                    {totalMatches} match{totalMatches !== 1 ? "es" : ""}
                  </span>
                )}
              </div>
              <div
                className="p-4 max-h-[240px] overflow-y-auto text-xs font-mono leading-relaxed whitespace-pre-wrap break-all"
                style={{ scrollbarWidth: "thin" } as React.CSSProperties}
              >
                {typeof highlightedText === "string" ? (
                  <span className="text-slate-600">{highlightedText}</span>
                ) : (
                  (highlightedText as { text: string; highlighted: boolean; index: number }[]).map(
                    (seg, i) =>
                      seg.highlighted ? (
                        <mark
                          key={i}
                          className="bg-indigo-200 text-indigo-900 rounded-sm px-0.5"
                        >
                          {seg.text}
                        </mark>
                      ) : (
                        <span key={i} className="text-slate-600">
                          {seg.text}
                        </span>
                      )
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════ RIGHT PANEL (4/12) ══════════════════ */}
        <div className="lg:col-span-5">
          <div className="sticky top-4 space-y-4">
            {/* Diagnostics Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm font-semibold">Match Diagnostics</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium">Total Matches</p>
                    <p className="text-lg font-bold text-indigo-600 mt-1">
                      {totalMatches}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium">Execution</p>
                    <p className="text-lg font-bold text-indigo-600 mt-1">
                      {executionTime !== null
                        ? `${executionTime.toFixed(2)}ms`
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Match List */}
                {matchResults.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Match Positions
                    </p>
                    <div
                      className="border border-slate-200 rounded-xl overflow-hidden"
                      style={{ maxHeight: "200px", overflowY: "auto", scrollbarWidth: "thin" } as React.CSSProperties}
                    >
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-slate-600">#</th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-600">Position</th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-600">Match</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchResults.slice(0, 50).map((match, idx) => (
                            <tr
                              key={idx}
                              className={`border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                                }`}
                            >
                              <td className="px-3 py-2 text-slate-500 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 font-mono text-indigo-600">{match.index}</td>
                              <td className="px-3 py-2 font-mono text-slate-700 max-w-[120px] truncate">
                                {match.fullMatch}
                              </td>
                            </tr>
                          ))}
                          {matchResults.length > 50 && (
                            <tr className="bg-slate-50">
                              <td
                                colSpan={3}
                                className="px-3 py-2 text-center text-slate-500 text-[10px]"
                              >
                                + {matchResults.length - 50} more matches
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Copy Match Results */}
                {matchResults.length > 0 && (
                  <button
                    id="regex-copy-results"
                    onClick={copyMatchResults}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border min-h-[44px] ${copied
                        ? "bg-green-500 text-white border-green-500 shadow-md shadow-green-200"
                        : "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 hover:bg-indigo-700"
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
                        Copy Match Results
                      </>
                    )}
                  </button>
                )}

                {/* Group Captures */}
                {groupCaptures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Braces className="w-3.5 h-3.5" />
                      Group Captures
                    </p>
                    <div className="space-y-2">
                      {groupCaptures.map((group) => (
                        <div
                          key={group.groupIndex}
                          className="bg-slate-50 border border-slate-100 rounded-xl p-3"
                        >
                          <p className="text-xs font-semibold text-slate-700 mb-1">
                            Group ${group.groupIndex}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {group.values.slice(0, 5).map((val, vi) => (
                              <span
                                key={vi}
                                className="inline-block bg-indigo-100 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded-md"
                              >
                                {val.length > 30 ? val.slice(0, 30) + "..." : val}
                              </span>
                            ))}
                            {group.values.length > 5 && (
                              <span className="text-[10px] text-slate-500">
                                +{group.values.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Token Explainer */}
                {tokenExplanations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5" />
                      Syntax Structure
                    </p>
                    <div className="space-y-1.5">
                      {tokenExplanations.slice(0, 8).map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs bg-slate-50 rounded-lg px-3 py-2"
                        >
                          <code className="font-mono font-bold text-indigo-600 flex-shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                            {item.token}
                          </code>
                          <span className="text-slate-600 leading-snug">{item.explanation}</span>
                        </div>
                      ))}
                      {tokenExplanations.length > 8 && (
                        <p className="text-[10px] text-slate-500 text-center">
                          +{tokenExplanations.length - 8} more tokens detected
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!pattern.trim() && !error && (
                  <div className="text-center py-6">
                    <SearchCode className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      Enter a regex pattern and test subject to see diagnostics
                    </p>
                  </div>
                )}

                {/* Security Badge */}
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-snug">
                    <strong className="text-slate-800">100% Secure.</strong> All regex parsing is
                    executed entirely client-side in your browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">

        {/* Section 1: Definitive Technical Guide */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Code className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Definitive Technical Guide to Regular Expressions</span>
          </h2>
          <div className="space-y-4 text-slate-600">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Regular Expressions, commonly known as Regex, represent formal algebraic expressions that define specific token lookup sequences within textual datasets. Originating from regular language theory in theoretical computer science, modern implementations serve as deterministic finite automata (DFA) or non-deterministic finite automata (NFA) execution engines. They allow software systems to perform validation operations, substitution parsing, structural token extraction, and complex string manipulations instantly within terminal threads, web application layers, and enterprise workflows.
            </p>
          </div>
        </div>

        {/* Section 2: How the Client-Side Regex Parsing Engine Operates */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How the Client-Side Regex Parsing Engine Operates</span>
          </h2>
          <div className="space-y-4 text-slate-600">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              This diagnostic suite compiles regex expressions inside an isolated local execution sandbox. The processing sequence follows a distinct structural pipeline:
            </p>
            <div className="grid md:grid-cols-2 gap-5 mt-4">
              {[
                {
                  num: "1",
                  title: "Pattern Instantiation",
                  body: "The string pattern is dynamically tokenized and passed to the browser's native window compilation context along with its modifier flags.",
                },
                {
                  num: "2",
                  title: "Interception Safeguard",
                  body: "The engine filters the input string through error-catching parameters to isolate unbalanced parentheses, trailing backslashes, or unclosed character sets before execution.",
                },
                {
                  num: "3",
                  title: "Index Matrix Mapping",
                  body: "The compiled regular expression scans the text subject, generating global match indices, absolute string positions, and explicit array structures for capture groups.",
                },
                {
                  num: "4",
                  title: "Dynamic Output Generation",
                  body: "Match segments are isolated from the underlying data layer to display clean visual breakdowns, while preserving complete user data privacy.",
                },
              ].map(({ num, title, body }) => (
                <div
                  key={num}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                      {num}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                      <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Character Specification Matrix */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Regular Expression Character Specification Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            Use this high-density technical syntax reference table to construct accurate match configurations:
          </p>
          <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-900 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4">Syntax Token</th>
                  <th className="p-4">Classification</th>
                  <th className="p-4">Operational Matching Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-white">
                  <td className="p-4 font-mono font-bold text-indigo-600">.</td>
                  <td className="p-4 font-semibold">Wildcard Module</td>
                  <td className="p-4">Matches any solitary character symbol excluding explicit newline linebreaks.</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="p-4 font-mono font-bold text-indigo-600">\d</td>
                  <td className="p-4 font-semibold">Character Class</td>
                  <td className="p-4">Identifies numerical digits matching ranges between zero and nine [0-9].</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-4 font-mono font-bold text-indigo-600">\w</td>
                  <td className="p-4 font-semibold">Alphanumeric Set</td>
                  <td className="p-4">Matches word characters including upper/lower case letters, digits, and underscores.</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="p-4 font-mono font-bold text-indigo-600">+</td>
                  <td className="p-4 font-semibold">Greedy Quantifier</td>
                  <td className="p-4">Instructs the engine to evaluate one or more occurrences of the preceding element.</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-4 font-mono font-bold text-indigo-600">*</td>
                  <td className="p-4 font-semibold">Kleene Star</td>
                  <td className="p-4">Evaluates zero or more matching sequences across the document stream.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Production Syntax Reference Samples */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Production Syntax Reference Samples</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            Below are structural layout blueprints commonly utilized for operational string assertion testing:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Email Validation Sequence",
                code: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
              },
              {
                title: "Secure Password Strength Pattern",
                code: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
              },
              {
                title: "ISO 8601 Date Standard Matcher",
                code: "^\\d{4}-\\d{2}-\\d{2}$",
              },
              {
                title: "IPv4 Address Network Target",
                code: "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
              },
            ].map(({ title, code }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-slate-800 text-sm mb-2">{title}</h3>
                <code className="block bg-slate-900 text-indigo-300 text-xs font-mono p-3 rounded-lg break-all leading-relaxed">
                  {code}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Advanced FAQs */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Advanced Regular Expression FAQs</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Is text evaluated within this workspace transmitted to remote database logging endpoints?",
                a: "No. The parsing engine uses client-side JavaScript execution entirely within your browser window. No input strings, parameters, or test subjects are uploaded across external networks, ensuring strict local security compliance.",
              },
              {
                q: "What is the structural difference between Greedy and Lazy quantifiers?",
                a: "Greedy quantifiers expand the matching scope to engulf the longest matching string sequence possible. Adding a question mark tracking token (e.g., .*?) forces a lazy evaluation, matching the absolute shortest string snippet that satisfies the structural configuration.",
              },
              {
                q: "How does the application manage catastrophic backtracking flags?",
                a: "Because this tool runs natively within the browser engine, highly nested or ambiguous configurations can cause excessive processing delays. We recommend avoiding nested quantifiers like (a+)+ on large text inputs to ensure optimal execution performance.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Platform Architectural Advantages */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span>Why Choose TwisterTools for Regex Testing?</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Shield,
                title: "Total Privacy Safety",
                body: "100% client-side execution. Your patterns, test subjects, and match data never leave your browser tab.",
              },
              {
                icon: Zap,
                title: "Sub-Millisecond Processing",
                body: "Native JavaScript RegExp engine delivers instant match diagnostics with microsecond execution metrics.",
              },
              {
                icon: Flag,
                title: "Native Multi-Flag Integration",
                body: "Full support for Global, Case-Insensitive, Multi-line, DotAll, and Unicode flags with visual toggle controls.",
              },
              {
                icon: Code,
                title: "Structural Token Insights",
                body: "Automated syntax breakdown explains character classes, quantifiers, anchors, and group captures in real-time.",
              },
              {
                icon: Layers,
                title: "Visual Match Highlighting",
                body: "Color-coded match visualization with position indexing and group capture breakdown for rapid debugging.",
              },
              {
                icon: CheckCircle,
                title: "Zero-Ad Layout Interface",
                body: "Clean, distraction-free workspace with no advertisements, popups, or tracking scripts.",
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
              name: "Regex Tester, Explainer & Cheat Sheet",
              url: "https://www.twistertools.com/tools/developer-tools/regex-tester",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "All",
              browserRequirements: "Requires JavaScript. Requires HTML5.",
              featureList: [
                "Real-time evaluation of regular expressions",
                "Dynamic flag selection for global, multi-line, and case-insensitive matching",
                "Comprehensive syntax highlighting and structural error detection",
                "Capture group metrics calculation",
                "High-density regex syntax cheat sheet reference table",
                "100% secure offline client-side computation",
              ],
            }),
          }}
        />
      </div>
    </div>
  );
}
