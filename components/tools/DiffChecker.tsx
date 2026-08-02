"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Columns,
  GitCompare,
  Copy,
  Check,
  Trash2,
  FileText,
  Code,
  Cpu,
  Binary,
  Layers,
  HelpCircle,
  Zap,
  Shield,
  Split,
  AlignLeft,
  Plus,
  Minus,
  Equal,
  Percent,
  RefreshCw,
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
type DiffMode = "lines" | "chars";
type ViewMode = "split" | "unified";

interface DiffSegment {
  type: "added" | "removed" | "unchanged";
  value: string;
  lineNumberOriginal?: number;
  lineNumberModified?: number;
}

interface DiffStats {
  totalLines: number;
  additions: number;
  deletions: number;
  unchanged: number;
  similarity: number;
}

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript Diff Engine (LCS-based Myers-like)
// ─────────────────────────────────────────────────────────────

/**
 * Compute the longest common subsequence (LCS) between two arrays.
 * Used for line-by-line and character-by-character diffing.
 */
function computeLCS<T>(a: T[], b: T[]): T[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const result: T[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return result;
}

/**
 * Generate diff segments from two arrays using LCS.
 */
function generateDiffSegments<T>(
  original: T[],
  modified: T[],
  areEqual: (a: T, b: T) => boolean = (a, b) => a === b
): { type: "added" | "removed" | "unchanged"; value: T; lineNumberOriginal?: number; lineNumberModified?: number }[] {
  const segments: { type: "added" | "removed" | "unchanged"; value: T; lineNumberOriginal?: number; lineNumberModified?: number }[] = [];

  // Build a simple LCS-based diff
  const lcs = computeLCS(original, modified);

  let oi = 0, mi = 0, li = 0;

  while (oi < original.length || mi < modified.length) {
    if (li < lcs.length) {
      // Check if current original matches LCS
      if (oi < original.length && areEqual(original[oi], lcs[li]) && mi < modified.length && areEqual(modified[mi], lcs[li])) {
        segments.push({ type: "unchanged", value: original[oi], lineNumberOriginal: oi, lineNumberModified: mi });
        oi++;
        mi++;
        li++;
      } else {
        // Check for deletion
        if (oi < original.length && !areEqual(original[oi], lcs[li])) {
          segments.push({ type: "removed", value: original[oi], lineNumberOriginal: oi });
          oi++;
        }
        // Check for insertion
        if (mi < modified.length && !areEqual(modified[mi], lcs[li])) {
          segments.push({ type: "added", value: modified[mi], lineNumberModified: mi });
          mi++;
        }
      }
    } else {
      // Remaining items
      if (oi < original.length) {
        segments.push({ type: "removed", value: original[oi], lineNumberOriginal: oi });
        oi++;
      }
      if (mi < modified.length) {
        segments.push({ type: "added", value: modified[mi], lineNumberModified: mi });
        mi++;
      }
    }
  }

  return segments;
}

/**
 * Line-by-line diff: split by newlines and compare.
 */
function diffLines(original: string, modified: string): DiffSegment[] {
  const origLines = original === "" ? [] : original.split("\n");
  const modLines = modified === "" ? [] : modified.split("\n");
  return generateDiffSegments(origLines, modLines);
}

/**
 * Character-by-character diff: compare individual characters.
 */
function diffChars(original: string, modified: string): DiffSegment[] {
  const origChars = original.split("");
  const modChars = modified.split("");
  return generateDiffSegments(origChars, modChars);
}

/**
 * Compute statistics from diff segments.
 */
function computeStats(segments: DiffSegment[], mode: DiffMode): DiffStats {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const seg of segments) {
    if (seg.type === "added") additions++;
    else if (seg.type === "removed") deletions++;
    else unchanged++;
  }

  const totalLines = segments.length;
  const similarity = totalLines > 0
    ? Math.round((unchanged / totalLines) * 100)
    : 100;

  return { totalLines, additions, deletions, unchanged, similarity };
}

// ─────────────────────────────────────────────────────────────
//  Sample Data
// ─────────────────────────────────────────────────────────────
const SAMPLE_ORIGINAL = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const config = {
  port: 3000,
  host: "localhost",
  debug: false
};

// Calculate total
function calculate(a, b) {
  return a + b;
}`;

const SAMPLE_MODIFIED = `function greet(name) {
  console.log("Hi, " + name);
  return true;
}

const config = {
  port: 8080,
  host: "localhost",
  debug: true,
  logLevel: "info"
};

// Calculate total
function calculate(a, b) {
  return a + b + c;
}

// New feature
function logout() {
  session.clear();
}`;

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function DiffChecker() {
  // ── State ──
  const [originalText, setOriginalText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [diffMode, setDiffMode] = useState<DiffMode>("lines");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);

  // ── Computed Diff ──
  const diffSegments = useMemo(() => {
    if (!originalText && !modifiedText) return [];
    return diffMode === "lines"
      ? diffLines(originalText, modifiedText)
      : diffChars(originalText, modifiedText);
  }, [originalText, modifiedText, diffMode]);

  const stats = useMemo(() => computeStats(diffSegments, diffMode), [diffSegments, diffMode]);

  // ── Split View Data ──
  const splitViewData = useMemo(() => {
    const origLines = originalText === "" ? [] : originalText.split("\n");
    const modLines = modifiedText === "" ? [] : modifiedText.split("\n");
    const maxLen = Math.max(origLines.length, modLines.length);

    const result: { lineNumber: number; original: { text: string; type: "added" | "removed" | "unchanged" } | null; modified: { text: string; type: "added" | "removed" | "unchanged" } | null }[] = [];

    // Build a map of line-level changes
    const lineChanges = new Map<number, { original?: "added" | "removed" | "unchanged"; modified?: "added" | "removed" | "unchanged" }>();

    for (const seg of diffSegments) {
      if (seg.type === "unchanged") {
        if (seg.lineNumberOriginal !== undefined) {
          lineChanges.set(seg.lineNumberOriginal, {
            ...lineChanges.get(seg.lineNumberOriginal),
            original: "unchanged",
          });
        }
        if (seg.lineNumberModified !== undefined) {
          lineChanges.set(seg.lineNumberModified, {
            ...lineChanges.get(seg.lineNumberModified),
            modified: "unchanged",
          });
        }
      } else if (seg.type === "removed" && seg.lineNumberOriginal !== undefined) {
        lineChanges.set(seg.lineNumberOriginal, {
          ...lineChanges.get(seg.lineNumberOriginal),
          original: "removed",
        });
      } else if (seg.type === "added" && seg.lineNumberModified !== undefined) {
        lineChanges.set(seg.lineNumberModified, {
          ...lineChanges.get(seg.lineNumberModified),
          modified: "added",
        });
      }
    }

    for (let i = 0; i < maxLen; i++) {
      const change = lineChanges.get(i);
      result.push({
        lineNumber: i + 1,
        original: i < origLines.length
          ? { text: origLines[i], type: change?.original || "unchanged" }
          : null,
        modified: i < modLines.length
          ? { text: modLines[i], type: change?.modified || "unchanged" }
          : null,
      });
    }

    return result;
  }, [originalText, modifiedText, diffSegments]);

  // ── Unified View Data ──
  const unifiedViewData = useMemo(() => {
    return diffSegments.map((seg, idx) => ({
      ...seg,
      key: idx,
    }));
  }, [diffSegments]);

  // ── Handlers ──
  const loadSample = useCallback(() => {
    setOriginalText(SAMPLE_ORIGINAL);
    setModifiedText(SAMPLE_MODIFIED);
  }, []);

  const clearAll = useCallback(() => {
    setOriginalText("");
    setModifiedText("");
  }, []);

  const copyDiff = useCallback(async () => {
    const text = diffSegments
      .map((seg) => {
        const prefix = seg.type === "added" ? "+ " : seg.type === "removed" ? "- " : "  ";
        return prefix + seg.value;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  }, [diffSegments]);

  // ── Render Helpers ──
  const getLineClass = (type: "added" | "removed" | "unchanged") => {
    switch (type) {
      case "added":
        return "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
      case "removed":
        return "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  const getLinePrefix = (type: "added" | "removed" | "unchanged") => {
    switch (type) {
      case "added": return "+";
      case "removed": return "-";
      default: return " ";
    }
  };

  // ─────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-8">

      {/* ── Symmetrical 50/50 Workspace ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Original Text */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-rose-300" />
              <span className="text-sm font-semibold text-white">Original Text</span>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              {originalText.length} chars
            </span>
          </div>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste original text here..."
            className="w-full h-64 font-mono text-sm font-normal text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white dark:bg-slate-900 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border-0"
            spellCheck={false}
          />
        </div>

        {/* Modified Text */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-semibold text-white">Modified Text</span>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              {modifiedText.length} chars
            </span>
          </div>
          <textarea
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            placeholder="Paste modified text here..."
            className="w-full h-64 font-mono text-sm font-normal text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-white dark:bg-slate-900 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border-0"
            spellCheck={false}
          />
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={loadSample}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all min-h-[44px]"
        >
          <FileText className="w-4 h-4" />
          Load Sample Data
        </button>
        <button
          onClick={clearAll}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all min-h-[44px]"
        >
          <Trash2 className="w-4 h-4" />
          Clear Workspace
        </button>

        <div className="flex-1" />

        {/* Diff Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setDiffMode("lines")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
              diffMode === "lines"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            Line by Line
          </button>
          <button
            onClick={() => setDiffMode("chars")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
              diffMode === "chars"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Character / Word
          </button>
        </div>
      </div>

      {/* ── Output Matrix & Comparison Panels ── */}
      {(originalText || modifiedText) && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Output Header with Metrics Dashboard */}
          <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold text-white">Comparison Results</span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("split")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all min-h-[32px] ${
                    viewMode === "split"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Split className="w-3.5 h-3.5" />
                  Split View
                </button>
                <button
                  onClick={() => setViewMode("unified")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all min-h-[32px] ${
                    viewMode === "unified"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  Unified View
                </button>
              </div>
            </div>

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-medium">Total Lines</p>
                <p className="text-lg font-bold text-white">{stats.totalLines}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-medium">Additions</p>
                <p className="text-lg font-bold text-emerald-300">+{stats.additions}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-medium">Deletions</p>
                <p className="text-lg font-bold text-rose-300">-{stats.deletions}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-medium">Similarity</p>
                <p className="text-lg font-bold text-white">{stats.similarity}%</p>
              </div>
            </div>
          </div>

          {/* ── Split View ── */}
          {viewMode === "split" && (
            <div className="grid grid-cols-2 divide-x divide-slate-200">
              {/* Original Side */}
              <div className="overflow-auto max-h-[500px]" style={{ scrollbarWidth: "thin" } as React.CSSProperties}>
                {splitViewData.map((row, idx) => (
                  <div
                    key={idx}
                    className={`flex font-mono text-xs leading-relaxed border-b border-slate-100 ${
                      row.original?.type === "removed"
                        ? "bg-rose-50 dark:bg-rose-950/30"
                        : row.original?.type === "added"
                          ? "bg-emerald-50 dark:bg-emerald-950/30"
                          : ""
                    }`}
                  >
                    <span className="w-10 flex-shrink-0 text-right pr-2 py-1 text-slate-400 select-none border-r border-slate-100">
                      {row.original ? row.lineNumber : ""}
                    </span>
                    <span className={`w-4 flex-shrink-0 text-center py-1 select-none ${
                      row.original?.type === "removed"
                        ? "text-rose-500"
                        : row.original?.type === "added"
                          ? "text-emerald-500"
                          : "text-slate-400"
                    }`}>
                      {row.original ? getLinePrefix(row.original.type) : ""}
                    </span>
                    <span className={`flex-1 py-1 px-2 whitespace-pre-wrap break-all ${
                      row.original
                        ? row.original.type === "removed"
                          ? "text-rose-700 dark:text-rose-400"
                          : row.original.type === "added"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-slate-600 dark:text-slate-400"
                        : "text-slate-300"
                    }`}>
                      {row.original ? row.original.text : ""}
                    </span>
                  </div>
                ))}
                {splitViewData.length === 0 && (
                  <div className="text-center text-sm text-slate-400 p-4 sm:p-6 md:p-8">
                    No content to compare
                  </div>
                )}
              </div>

              {/* Modified Side */}
              <div className="overflow-auto max-h-[500px]" style={{ scrollbarWidth: "thin" } as React.CSSProperties}>
                {splitViewData.map((row, idx) => (
                  <div
                    key={idx}
                    className={`flex font-mono text-xs leading-relaxed border-b border-slate-100 ${
                      row.modified?.type === "added"
                        ? "bg-emerald-50 dark:bg-emerald-950/30"
                        : row.modified?.type === "removed"
                          ? "bg-rose-50 dark:bg-rose-950/30"
                          : ""
                    }`}
                  >
                    <span className="w-10 flex-shrink-0 text-right pr-2 py-1 text-slate-400 select-none border-r border-slate-100">
                      {row.modified ? row.lineNumber : ""}
                    </span>
                    <span className={`w-4 flex-shrink-0 text-center py-1 select-none ${
                      row.modified?.type === "added"
                        ? "text-emerald-500"
                        : row.modified?.type === "removed"
                          ? "text-rose-500"
                          : "text-slate-400"
                    }`}>
                      {row.modified ? getLinePrefix(row.modified.type) : ""}
                    </span>
                    <span className={`flex-1 py-1 px-2 whitespace-pre-wrap break-all ${
                      row.modified
                        ? row.modified.type === "added"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : row.modified.type === "removed"
                            ? "text-rose-700 dark:text-rose-400"
                            : "text-slate-600 dark:text-slate-400"
                        : "text-slate-300"
                    }`}>
                      {row.modified ? row.modified.text : ""}
                    </span>
                  </div>
                ))}
                {splitViewData.length === 0 && (
                  <div className="text-center text-sm text-slate-400 p-4 sm:p-6 md:p-8">
                    No content to compare
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Unified View ── */}
          {viewMode === "unified" && (
            <div className="overflow-auto max-h-[500px]" style={{ scrollbarWidth: "thin" } as React.CSSProperties}>
              {unifiedViewData.map((seg, idx) => (
                <div
                  key={idx}
                  className={`flex font-mono text-xs leading-relaxed border-b border-slate-100 ${
                    seg.type === "added"
                      ? "bg-emerald-50 dark:bg-emerald-950/30"
                      : seg.type === "removed"
                        ? "bg-rose-50 dark:bg-rose-950/30"
                        : ""
                  }`}
                >
                  <span className={`w-8 flex-shrink-0 text-center py-1 select-none font-bold ${
                    seg.type === "added"
                      ? "text-emerald-500"
                      : seg.type === "removed"
                        ? "text-rose-500"
                        : "text-slate-400"
                  }`}>
                    {getLinePrefix(seg.type)}
                  </span>
                  <span className={`flex-1 py-1 px-2 whitespace-pre-wrap break-all ${
                    seg.type === "added"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : seg.type === "removed"
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-slate-600 dark:text-slate-400"
                  }`}>
                    {seg.value}
                  </span>
                </div>
              ))}
              {unifiedViewData.length === 0 && (
                <div className="text-center text-sm text-slate-400 p-4 sm:p-6 md:p-8">
                  No content to compare
                </div>
              )}
            </div>
          )}

          {/* Copy Results Button */}
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50">
            <button
              onClick={copyDiff}
              disabled={diffSegments.length === 0}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] w-full sm:w-auto ${
                diffSegments.length > 0
                  ? copied
                    ? "bg-green-500 text-white shadow-md shadow-green-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
                  Copy Diff Results
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!originalText && !modifiedText && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
            <GitCompare className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Text to Compare</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Paste text into the Original and Modified panels above, or click{" "}
            <strong>Load Sample Data</strong> to see the diff engine in action.
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">

        {/* Card 1: Technical Architecture & Core Principles */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture & Core Principles</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              An online diff checker acts as a state comparison engine designed to compute the minimal edit script necessary to transform an original text corpus into a modified target version. By parsing strings into distinct arrays of tokens—whether line rows separated by newline breaks or words segmented by whitespace delimiters—the computing core tracks historical states line by line. This architecture ensures complete sandboxed isolation; strings never leave your browser context, satisfying the strict requirements of enterprise code reviews and data processing compliance frameworks.
            </p>
          </div>
        </div>

        {/* Card 2: How the Text Comparison Engine Operates Step-by-Step */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Binary className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How the Text Comparison Engine Operates Step-by-Step</span>
          </h2>
          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Token Serialization",
                body: "The text parser ingests both standard inputs and splits raw string blocks into structured arrays based on active line-break arrays or custom character matrices.",
              },
              {
                step: "2",
                title: "Matrix Evaluation",
                body: "The internal algorithm maps sequences to locate matching longest common subsequences (LCS), isolating structural deviations.",
              },
              {
                step: "3",
                title: "Delta Block Compilation",
                body: "Elements missing from the modified target are flagged as deletions, while new entries are isolated as structural insertions.",
              },
              {
                step: "4",
                title: "Visual Layout Formatting",
                body: "The synchronized rendering matrix compiles the text arrays into a responsive HTML layout containing custom background color highlights and inline counter statistics.",
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
                    <h3 className="font-semibold text-slate-800 mb-1.5">{title}</h3>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Code Comparison Reference Samples */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Code className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Code Comparison Reference Samples</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  {["File State", "Visual Prefix", "CSS Color Variable", "Practical Application Context"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Original Baseline", " ", "text-slate-600", "Unchanged source lines used for layout alignment"],
                  ["Deleted Segment", "-", "bg-rose-50 text-rose-700", "Removed properties, deprecated code loops, or typos"],
                  ["Inserted Segment", "+", "bg-emerald-50 text-emerald-700", "Newly integrated methods, updated copy, or parameters"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 text-sm ${
                          j === 0
                            ? "font-semibold text-slate-700"
                            : j === 1
                              ? "text-indigo-700 font-mono font-medium"
                              : j === 2
                                ? "text-slate-600 font-mono text-xs"
                                : "text-slate-600"
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

        {/* Card 4: Strategic Use-Cases for Technical Professionals */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Strategic Use-Cases for Technical Professionals</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Source Code Auditing",
                body: "Validate raw script alterations or patch deployments when local version control clients or staging servers are inaccessible.",
              },
              {
                title: "SEO & Copywriting Tracking",
                body: "Run detailed side-by-side audits on landing page updates, metadata tweaks, or blog adjustments to map precise edits.",
              },
              {
                title: "Config & JSON Verification",
                body: "Track adjustments inside highly nested environment variables, database configuration logs, or API payload strings instantly.",
              },
              {
                title: "Legal Document Validation",
                body: "Compare legal contract variations or terms-of-service revisions line by line to protect operational interests.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                </div>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Advanced Frequently Asked Questions */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Advanced Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Are my confidential files or source blocks processed on external servers?",
                a: "Absolutely not. TwisterTools operates a strict zero-data exposure architecture. All comparison calculations, diff loop indexing, and text renderings occur natively inside your browser sandbox.",
              },
              {
                q: "What is the difference between Split View and Unified View options?",
                a: "Split View sets up a symmetrical side-by-side layout optimal for tracing broad multi-line structure changes. Unified View presents a linear, single-column feed showing additions and deletions stacked vertically in place.",
              },
              {
                q: "Can this diff engine handle non-alphanumeric characters and code punctuation symbols?",
                a: "Yes. The tokenization engine parses complete UTF-8 blocks, ensuring deep compliance when tracking programming symbols, formatting tabs, spaces, or international character matrices.",
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
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Value Card Platform Advantages */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl md:p-10 shadow-lg p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span>Platform Advantages</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Adsense-Optimized Formats",
                body: "Implements high-contrast responsive structural heights tailored to clean user interfaces.",
              },
              {
                title: "Zero Third-Party Tracking",
                body: "Completely unlinked from telemetry servers, ensuring lightning-fast execution and absolute operational privacy.",
              },
              {
                title: "Full Mobile Adaptability",
                body: "Drops from a dual desktop layout into a single unified column view on smaller mobile viewports automatically.",
              },
              {
                title: "100% Client-Side Privacy",
                body: "All diff calculations happen locally in your browser. No data is ever transmitted, stored, or logged.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-200 flex-shrink-0 mt-1.5"></span>
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-indigo-200 text-sm mt-1 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}
