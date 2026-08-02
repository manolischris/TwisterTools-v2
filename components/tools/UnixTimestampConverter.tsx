"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Clock,
  Copy,
  Check,
  Shield,
  Pause,
  Play,
  RefreshCw,
  Calendar,
  HelpCircle,
  Cpu,
  ShieldAlert,
  Info,
  Zap,
  Timer,
  ArrowRight,
  AlertCircle,
  Layers,
  Activity,
  FileText,
  AlertTriangle,
  ListOrdered,
  Code,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
type ConverterMode = "ts-to-date" | "date-to-ts";

interface DateBreakdown {
  isoString: string;
  utcString: string;
  localString: string;
  relativeTime: string;
  dayOfWeek: string;
  dayOfYear: number;
  isLeapYear: boolean;
  unixSeconds: number;
  unixMs: number;
  hexTimestamp: string;
}

// ─────────────────────────────────────────────────────────────
//  Pure utility functions (no external deps)
// ─────────────────────────────────────────────────────────────
function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const absDiffMs = Math.abs(diffMs);
  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const prefix = diffMs < 0 ? "" : "in ";
  const suffix = diffMs < 0 ? " ago" : "";

  if (seconds < 5) return "just now";
  if (seconds < 60) return prefix + seconds + " second" + (seconds !== 1 ? "s" : "") + suffix;
  if (minutes < 60) return prefix + minutes + " minute" + (minutes !== 1 ? "s" : "") + suffix;
  if (hours < 24) return prefix + hours + " hour" + (hours !== 1 ? "s" : "") + suffix;
  if (days < 7) return prefix + days + " day" + (days !== 1 ? "s" : "") + suffix;
  if (weeks < 5) return prefix + weeks + " week" + (weeks !== 1 ? "s" : "") + suffix;
  if (months < 12) return prefix + months + " month" + (months !== 1 ? "s" : "") + suffix;
  return prefix + years + " year" + (years !== 1 ? "s" : "") + suffix;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDayOfWeekName(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

function computeBreakdownFromDate(date: Date): DateBreakdown {
  const unixMs = date.getTime();
  const unixSeconds = Math.floor(unixMs / 1000);
  return {
    isoString: date.toISOString(),
    utcString: date.toUTCString(),
    localString: date.toString(),
    relativeTime: getRelativeTime(date),
    dayOfWeek: getDayOfWeekName(date),
    dayOfYear: getDayOfYear(date),
    isLeapYear: isLeapYear(date.getFullYear()),
    unixSeconds,
    unixMs,
    hexTimestamp: "0x" + unixSeconds.toString(16),
  };
}

function parseTimestampInput(value: string, isMs: boolean): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (isNaN(num) || !Number.isFinite(num)) return null;
  const ms = isMs ? num : num * 1000;
  const date = new Date(ms);
  if (isNaN(date.getTime())) return null;
  return date;
}

function detectPrecision(value: string): "seconds" | "milliseconds" {
  const trimmed = value.trim();
  if (!trimmed) return "seconds";
  const len = trimmed.replace(/[^0-9]/g, "").length;
  if (len >= 13) return "milliseconds";
  return "seconds";
}

function formatLocalDatetimeString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function UnixTimestampConverter() {
  // ── Live Ticker ──
  const [currentTime, setCurrentTime] = useState(0);
  const [tickerPaused, setTickerPaused] = useState(false);
  const tickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Mode ──
  const [activeMode, setActiveMode] = useState<ConverterMode>("ts-to-date");

  // ── Mode 1: Timestamp to Date ──
  const [tsInput, setTsInput] = useState("");
  const [tsIsMs, setTsIsMs] = useState(true);
  const [tsBreakdown, setTsBreakdown] = useState<DateBreakdown | null>(null);
  const [tsError, setTsError] = useState("");

  // ── Mode 2: Date to Timestamp ──
  const [dtDatetime, setDtDatetime] = useState(() => formatLocalDatetimeString(new Date()));
  const [dtTimezone, setDtTimezone] = useState("local");
  const [dtBreakdown, setDtBreakdown] = useState<DateBreakdown | null>(null);

  // ── Copy feedback ──
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ── Live ticker ──
  useEffect(() => {
    if (tickerPaused) {
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
      return;
    }
    tickerIntervalRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => {
      if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
    };
  }, [tickerPaused]);

  // ── Auto-detect precision on input change ──
  useEffect(() => {
    if (!tsInput.trim()) {
      setTsError("");
      setTsBreakdown(null);
      return;
    }
    const detected = detectPrecision(tsInput);
    setTsIsMs(detected === "milliseconds");
    const date = parseTimestampInput(tsInput, detected === "milliseconds");
    if (!date) {
      setTsError("Invalid timestamp. Please enter a valid numeric epoch value.");
      setTsBreakdown(null);
    } else {
      setTsError("");
      setTsBreakdown(computeBreakdownFromDate(date));
    }
  }, [tsInput]);

  // ── Compute date-to-timestamp on input change ──
  useEffect(() => {
    if (!dtDatetime) {
      setDtBreakdown(null);
      return;
    }
    const date = new Date(dtDatetime);
    if (isNaN(date.getTime())) {
      setDtBreakdown(null);
      return;
    }
    setDtBreakdown(computeBreakdownFromDate(date));
  }, [dtDatetime, dtTimezone]);

  // ── Copy helper ──
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* silent */
    }
  }, []);

  // ── Handlers ──
  const pasteCurrentTime = () => {
    setTsInput(String(Date.now()));
  };

  const loadSampleData = () => {
    setTsInput("1711234567");
    setActiveMode("ts-to-date");
  };

  const clearAll = () => {
    setTsInput("");
    setTsBreakdown(null);
    setTsError("");
    setDtDatetime(formatLocalDatetimeString(new Date()));
    setDtBreakdown(null);
  };

  const togglePrecision = () => {
    if (!tsInput.trim()) return;
    const date = parseTimestampInput(tsInput, tsIsMs);
    if (!date) return;
    if (tsIsMs) {
      setTsInput(String(Math.floor(date.getTime() / 1000)));
    } else {
      setTsInput(String(date.getTime()));
    }
  };

  // ── Ticker values ──
  const tickerSeconds = Math.floor(currentTime / 1000);
  const tickerMs = currentTime;

  // ─────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Dashboard Grid ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* ══════════════════ LEFT PANEL (col-span-8) ══════════════════ */}
        <div className="lg:col-span-8 space-y-5">

          {/* ── Mode Tab Selector ── */}
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            {(
              [
                { id: "ts-to-date", label: "Timestamp to Date", icon: Clock },
                { id: "date-to-ts", label: "Date to Timestamp", icon: Calendar },
              ] as { id: ConverterMode; label: string; icon: React.ElementType }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`ts-tab-${id}`}
                onClick={() => setActiveMode(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 border ${activeMode === id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                    : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── MODE 1: Timestamp to Date ── */}
          {activeMode === "ts-to-date" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6">
              <div>
                <label
                  htmlFor="ts-input"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Enter Epoch Timestamp
                </label>
                <div className="flex gap-2">
                  <input
                    id="ts-input"
                    type="text"
                    value={tsInput}
                    onChange={(e) => setTsInput(e.target.value)}
                    placeholder="e.g. 1711234567 or 1711234567890"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  />
                  <button
                    id="ts-paste-current"
                    onClick={pasteCurrentTime}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 text-sm font-medium transition-all whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Paste Current</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    id="ts-precision-toggle"
                    onClick={togglePrecision}
                    disabled={!tsInput.trim()}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${!tsInput.trim()
                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {tsIsMs ? "Milliseconds" : "Seconds"}
                    <ArrowRight className="w-3 h-3" />
                    {tsIsMs ? "Seconds" : "Milliseconds"}
                  </button>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Detected: <strong className="text-slate-700">{tsIsMs ? "13-digit (ms)" : "10-digit (sec)"}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="ts-load-sample"
                    onClick={loadSampleData}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Load Sample Data</span>
                  </button>
                  <button
                    id="ts-clear-all"
                    onClick={clearAll}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear Panel States</span>
                  </button>
                </div>
              </div>


              {tsError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{tsError}</p>
                </div>
              )}

              {tsBreakdown && !tsError && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "ISO 8601", value: tsBreakdown.isoString },
                      { label: "UTC Date String", value: tsBreakdown.utcString },
                      { label: "Local Timezone", value: tsBreakdown.localString },
                      { label: "Relative Time", value: tsBreakdown.relativeTime },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group"
                      >
                        <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                        <p className="text-sm text-slate-800 font-mono break-all">{value}</p>
                        <button
                          onClick={() => copyToClipboard(value, `ts-${label}`)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white border border-slate-200 opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                          aria-label={`Copy ${label}`}
                        >
                          {copiedField === `ts-${label}` ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Day of Week", value: tsBreakdown.dayOfWeek },
                      { label: "Day of Year", value: `${tsBreakdown.dayOfYear}/366` },
                      {
                        label: "Leap Year",
                        value: tsBreakdown.isLeapYear ? "Yes" : "No",
                        highlight: tsBreakdown.isLeapYear,
                      },
                    ].map(({ label, value, highlight }) => (
                      <div
                        key={label}
                        className={`rounded-xl p-4 border ${highlight
                            ? "bg-indigo-50 border-indigo-200"
                            : "bg-slate-50 border-slate-200"
                          }`}
                      >
                        <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                        <p
                          className={`text-sm font-semibold ${highlight ? "text-indigo-700" : "text-slate-800"
                            }`}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!tsInput.trim() && (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Enter a Unix timestamp above to see the date breakdown</p>
                </div>
              )}
            </div>
          )}

          {/* ── MODE 2: Date to Timestamp ── */}
          {activeMode === "date-to-ts" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6">
              <div>
                <label
                  htmlFor="dt-datetime"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Select Date & Time
                </label>
                <input
                  id="dt-datetime"
                  type="datetime-local"
                  value={dtDatetime}
                  onChange={(e) => setDtDatetime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="dt-timezone"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Timezone
                </label>
                <select
                  id="dt-timezone"
                  value={dtTimezone}
                  onChange={(e) => setDtTimezone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="local">Local Timezone</option>
                  <option value="utc">UTC</option>
                </select>
              </div>

              {dtBreakdown ? (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Epoch Timestamp (Seconds)", value: String(dtBreakdown.unixSeconds) },
                      { label: "Epoch Timestamp (Milliseconds)", value: String(dtBreakdown.unixMs) },
                      { label: "Hex Timestamp", value: dtBreakdown.hexTimestamp },
                      { label: "ISO 8601", value: dtBreakdown.isoString },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group"
                      >
                        <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                        <p className="text-sm text-slate-800 font-mono break-all">{value}</p>
                        <button
                          onClick={() => copyToClipboard(value, `dt-${label}`)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white border border-slate-200 opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                          aria-label={`Copy ${label}`}
                        >
                          {copiedField === `dt-${label}` ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Select a date and time above to generate timestamps</p>
                </div>
              )}
            </div>
          )}

          {/* ── Live Ticker Widget ── */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Timer className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-semibold text-slate-200">Current Unix Epoch Time</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="ticker-pause-toggle"
                  onClick={() => setTickerPaused((p) => !p)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${tickerPaused
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  aria-label={tickerPaused ? "Resume ticker" : "Pause ticker"}
                >
                  {tickerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <div className="relative group">
                  <button
                    id="ticker-copy"
                    onClick={() => copyToClipboard(String(tickerSeconds), "ticker")}
                    className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                    aria-label="Copy current timestamp"
                  >
                    {copiedField === "ticker" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-20">
                    {copiedField === "ticker" ? "Copied!" : "Copy timestamp"}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Seconds (10-digit)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg text-indigo-400 font-bold tracking-wider">
                  {tickerSeconds}
                </span>
                <button
                  id="ticker-copy-seconds"
                  onClick={() => copyToClipboard(String(tickerSeconds), "ticker-sec")}
                  className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
                  aria-label="Copy seconds timestamp"
                >
                  {copiedField === "ticker-sec" ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Milliseconds (13-digit)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-300 tracking-wider">
                  {tickerMs}
                </span>
                <button
                  id="ticker-copy-ms"
                  onClick={() => copyToClipboard(String(tickerMs), "ticker-ms")}
                  className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
                  aria-label="Copy milliseconds timestamp"
                >
                  {copiedField === "ticker-ms" ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {tickerPaused && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Ticker paused — values are frozen</span>
              </div>
            )}
          </div>

        </div>

        {/* ══════════════════ RIGHT PANEL (col-span-4) ══════════════════ */}
        <div className="lg:col-span-4">
          <div className="sticky top-4 space-y-4">
            {/* Preview Summary Output Deck */}
            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm font-semibold">Parsing Summary</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2 text-xs">
                  {activeMode === "ts-to-date" && tsBreakdown && (
                    <>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Input Value</span>
                        <span className="font-mono font-medium text-slate-700 text-right max-w-[140px] truncate">
                          {tsInput || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Precision</span>
                        <span className="font-mono font-medium text-slate-700">
                          {tsIsMs ? "13-digit (ms)" : "10-digit (sec)"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Unix Seconds</span>
                        <span className="font-mono font-medium text-slate-700">
                          {tsBreakdown.unixSeconds.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Unix Milliseconds</span>
                        <span className="font-mono font-medium text-slate-700">
                          {tsBreakdown.unixMs.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Hex</span>
                        <span className="font-mono font-medium text-indigo-600">
                          {tsBreakdown.hexTimestamp}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-slate-500">Relative</span>
                        <span className="font-medium text-slate-700">
                          {tsBreakdown.relativeTime}
                        </span>
                      </div>
                    </>
                  )}

                  {activeMode === "date-to-ts" && dtBreakdown && (
                    <>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Selected Date</span>
                        <span className="font-mono font-medium text-slate-700 text-right max-w-[140px] truncate">
                          {dtDatetime || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Timezone</span>
                        <span className="font-medium text-slate-700">
                          {dtTimezone === "utc" ? "UTC" : "Local"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Unix Seconds</span>
                        <span className="font-mono font-medium text-slate-700">
                          {dtBreakdown.unixSeconds.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Unix Milliseconds</span>
                        <span className="font-mono font-medium text-slate-700">
                          {dtBreakdown.unixMs.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-slate-500">Hex</span>
                        <span className="font-mono font-medium text-indigo-600">
                          {dtBreakdown.hexTimestamp}
                        </span>
                      </div>
                    </>
                  )}

                  {((activeMode === "ts-to-date" && !tsBreakdown) || (activeMode === "date-to-ts" && !dtBreakdown)) && (
                    <div className="text-center py-6 text-slate-400">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">Enter values to see parsing summary</p>
                    </div>
                  )}
                </div>

                {(tsBreakdown || dtBreakdown) && (
                  <button
                    id="ts-copy-all"
                    onClick={() => {
                      const data = activeMode === "ts-to-date" && tsBreakdown
                        ? `Unix Seconds: ${tsBreakdown.unixSeconds}\nUnix Milliseconds: ${tsBreakdown.unixMs}\nISO 8601: ${tsBreakdown.isoString}\nUTC: ${tsBreakdown.utcString}\nLocal: ${tsBreakdown.localString}\nRelative: ${tsBreakdown.relativeTime}\nDay of Week: ${tsBreakdown.dayOfWeek}\nDay of Year: ${tsBreakdown.dayOfYear}\nLeap Year: ${tsBreakdown.isLeapYear ? "Yes" : "No"}`
                        : dtBreakdown
                          ? `Unix Seconds: ${dtBreakdown.unixSeconds}\nUnix Milliseconds: ${dtBreakdown.unixMs}\nHex: ${dtBreakdown.hexTimestamp}\nISO 8601: ${dtBreakdown.isoString}`
                          : "";
                      copyToClipboard(data, "all");
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${copiedField === "all"
                        ? "bg-green-500 text-white shadow-md shadow-green-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                      }`}
                  >
                    {copiedField === "all" ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied Securely!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy All Results
                      </>
                    )}
                  </button>
                )}

                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-snug">
                    <strong className="text-slate-800">100% Secure.</strong> All timestamp conversions are processed entirely client-side in your browser. No data is ever uploaded or transmitted over the network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BELOW-THE-FOLD SEO CONTENT CARDS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-6 pt-4">

        {/* ── CARD 1: The Comprehensive Technical Guide to Unix Epoch Time ── */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Comprehensive Technical Guide to Unix Epoch Time</span>
          </h2>
          <div className="text-slate-700 text-sm md:text-base leading-relaxed space-y-4">
            <p>
              Unix Epoch Time (also referred to as POSIX time or Unix Timestamp format) represents a standardized temporal counting methodology engineered to track chronological progressions by calculating the exact quantity of seconds that have elapsed since the official epoch baseline of Thursday, January 1, 1970, at 00:00:00 Coordinated Universal Time (UTC). This tracking standard intentionally omits leap seconds, creating a highly predictable, linear integer sequence that radically simplifies time math logic across heterogeneous hardware nodes, operating systems, and database systems.
            </p>
            <p>
              By converting multidimensional calendar variables (years, months, leap years, days, hours, and minutes) into a single scalar integer, programmatic execution loops completely bypass localized runtime rules during distributed transactions, database indexing, and cryptography handshakes. Whether you are defining system cache invalidation deadlines or correlating distributed microservice telemetry, Unix time serves as the fundamental invariant baseline for modern compute operations.
            </p>
          </div>
        </div>

        {/* ── CARD 2: The Anatomical Breakdown: Seconds vs. Milliseconds ── */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Anatomical Breakdown: Seconds vs. Milliseconds</span>
          </h2>
          <div className="text-slate-700 text-sm md:text-base leading-relaxed space-y-4">
            <p>
              Depending on your platform runtime environment, framework architecture, or log ingestion layer, you will interact with timestamps across two primary precision tiers:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs md:text-sm text-center space-y-2">
              <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider">10-Digit Seconds (Standard POSIX)</p>
              <p className="text-indigo-600 tracking-widest">
                [ 1 ] [ 7 ] [ 7 ] [ 2 ] [ 5 ] [ 4 ] [ 9 ] [ 6 ] [ 0 ] [ 0 ]
              </p>
              <p className="text-slate-400 text-[10px]">|_______________________ Total Seconds Elapsed Since 1970 _______________________|</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs md:text-sm text-center space-y-2">
              <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider">13-Digit Milliseconds (High-Frequency / JavaScript)</p>
              <p className="text-indigo-600 tracking-widest">
                [ 1 ] [ 7 ] [ 7 ] [ 2 ] [ 5 ] [ 4 ] [ 9 ] [ 6 ] [ 0 ] [ 0 ] [ 0 ] [ 0 ] [ 0 ]
              </p>
              <p className="text-slate-400 text-[10px]">|_______________________ Seconds Components ____________________| Sub-Sec ms ___|</p>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-slate-800">10-Digit Seconds Precision:</strong> The traditional baseline tracking elapsed integer seconds. This format crossed the 1 billion seconds threshold on September 9, 2001, and will scale safely until the critical 32-bit ceiling is broken.
              </li>
              <li>
                <strong className="text-slate-800">13-Digit Milliseconds Precision:</strong> The high-resolution layout native to the modern web browser ecosystem (JavaScript), Java, and low-latency microservice architectures. It records high-frequency transactional data points with granular precision.
              </li>
            </ul>

            <h3 className="text-base font-semibold text-slate-800 pt-2">High-Density Precision Mapping Reference Table</h3>
            <p className="text-slate-600">
              The following matrix demonstrates how major languages and database layers expect epoch timestamps to be passed, stored, and extracted within your code layers:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    {["Environment", "Default Precision", "Sample Retrieval Method / Code Syntax", "Common Output Type"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["JavaScript / TypeScript", "13-Digit (ms)", "Date.now() or new Date().getTime()", "Float / Number"],
                    ["Python", "10-Digit (Seconds.ms)", "time.time()", "Float"],
                    ["Go (Golang)", "Nanoseconds", "time.Now().Unix() or time.Now().UnixMilli()", "int64"],
                    ["PHP (Modern)", "10-Digit (Seconds)", "time() or microtime(true)", "int / Float"],
                    ["Ruby", "10-Digit (Seconds)", "Time.now.to_i", "Integer"],
                    ["Java", "13-Digit (ms)", "System.currentTimeMillis()", "long"],
                    ["MySQL", "10-Digit (Seconds)", "UNIX_TIMESTAMP()", "Integer"],
                    ["PostgreSQL", "10-Digit (Seconds)", "EXTRACT(EPOCH FROM NOW())", "Double Precision"],
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`px-4 py-3 text-sm ${j === 0 ? "font-medium text-slate-800" : j === 2 ? "font-mono text-indigo-600 text-xs" : "text-slate-600"}`}
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
        </div>

        {/* ── CARD 3: Mitigating the Impending Year 2038 Problem (Y2K38) ── */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Mitigating the Impending Year 2038 Problem (Y2K38)</span>
          </h2>
          <div className="text-slate-700 text-sm md:text-base leading-relaxed space-y-4">
            <p>
              Software engineers working across cloud computing layers must actively factor in the systemic risk introduced by the Year 2038 Problem, commonly cataloged across network vulnerabilities as the <strong className="text-slate-800">Y2K38 Integer Overflow Exception</strong>.
            </p>
            <p>
              This phenomenon stems from legacy 32-bit signed integer memory allocations. Because a signed 32-bit allocation has a hard maximum storage threshold of exactly 2,147,483,647, the continuous tracking sequence will reach its ultimate limits on <strong className="text-slate-800">Tuesday, January 19, 2038, at 03:14:07 UTC</strong>.
            </p>
            <p>
              Upon crossing this threshold, the next numerical increment will trigger a bit-overflow event, instantly flipping the structural sign bit to negative. This mathematical overflow will wrap system clocks backward to Friday, December 13, 1901, leading to widespread logic failure, premature token expiration, database sorting compilation drops, and infinite transaction execution loops.
            </p>

            <div className="bg-slate-900 rounded-xl p-4 md:p-5 space-y-3 font-mono text-xs md:text-sm">
              <p className="text-green-400 font-semibold text-xs uppercase tracking-wider">MAX SIGNED 32-BIT BOUNDARY:</p>
              <p className="text-green-300 tracking-wider">
                01111111 11111111 11111111 11111111 = 2,147,483,647 Seconds (Jan 19, 2038)
              </p>
              <div className="border-t border-slate-700 pt-3">
                <p className="text-red-400 font-semibold text-xs uppercase tracking-wider">CRITICAL OVERFLOW EXCEPTION:</p>
                <p className="text-red-300 tracking-wider">
                  10000000 00000000 00000000 00000000 = -2,147,483,648 Seconds (Dec 13, 1901)
                </p>
              </div>
            </div>

            <h3 className="text-base font-semibold text-slate-800 pt-2">Strategic Resolution Pathways</h3>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                <strong className="text-slate-800">Migrate Infrastructure to 64-Bit Memory Tiers:</strong> Upgrading application execution binaries to full 64-bit architectures expands the maximum chronological storage ceiling to approximately 9.22 x 10<sup>18</sup> seconds — extending computing uniqueness safety boundaries past hundreds of billions of calendar cycles into the deep future.
              </li>
              <li>
                <strong className="text-slate-800">Database Data-Type Overhauls:</strong> Refactor all historical columns tracking date values via standard 32-bit integers over to native 64-bit fields (such as <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono">BIGINT</code> or native timezone-aware <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono">TIMESTAMP</code> tracking data types).
              </li>
            </ol>
          </div>
        </div>

        {/* ── CARD 4: Step-by-Step Programming Language Implementation Guides ── */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <ListOrdered className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Step-by-Step Programming Language Implementation Guides</span>
          </h2>
          <div className="text-slate-700 text-sm md:text-base leading-relaxed space-y-4">
            <p>
              To parse, extract, and convert epochs inside your codebase, use these tested, enterprise-ready, zero-dependency snippets:
            </p>

            <h3 className="text-base font-semibold text-slate-800">1. Node.js / Browser JavaScript Engine</h3>
            <pre className="bg-slate-900 text-slate-200 rounded-xl p-4 md:p-5 overflow-x-auto text-xs md:text-sm leading-relaxed font-mono">
              {`// Current Milliseconds Epoch Retrieval
const currentMs = Date.now();

// Convert a Raw 10-Digit Seconds Timestamp to Readable Date Object
const epochSeconds = 1772549600;
const readableDate = new Date(epochSeconds * 1000);
console.log(readableDate.toUTCString());`}
            </pre>

            <h3 className="text-base font-semibold text-slate-800">2. Python 3 Runtime Core</h3>
            <pre className="bg-slate-900 text-slate-200 rounded-xl p-4 md:p-5 overflow-x-auto text-xs md:text-sm leading-relaxed font-mono">
              {`import time
from datetime import datetime, timezone

# Current Timestamp Extractor
current_seconds = time.time()

# Convert Unix Timestamp to UTC Datetime String
epoch_val = 1772549600
utc_datetime = datetime.fromtimestamp(epoch_val, tz=timezone.utc)
print(utc_datetime.strftime('%Y-%m-%d %H:%M:%S UTC'))`}
            </pre>

            <h3 className="text-base font-semibold text-slate-800">3. Bash / Linux Terminal Commands</h3>
            <pre className="bg-slate-900 text-slate-200 rounded-xl p-4 md:p-5 overflow-x-auto text-xs md:text-sm leading-relaxed font-mono">
              {`# Get the current Unix timestamp from the shell terminal
date +%s

# Convert a specific epoch integer back into standard human-readable format
date -u -d @1772549600`}
            </pre>
          </div>
        </div>

        {/* ── CARD 5: Key Epoch Chronological Milestones Reference ── */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Info className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Key Epoch Chronological Milestones Reference</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            Track historical data points, check translation layouts, or calibrate local parser tests using these significant epoch coordinates:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  {["Target Historical Event", "Epoch Timestamp (Seconds)", "Corresponding Human Date Structure (UTC)"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["The Dawn of Epoch Time", "0", "January 1, 1970, 00:00:00 UTC"],
                  ["The 1 Billion Second Milestone", "1000000000", "September 9, 2001, 01:46:40 UTC"],
                  ["The 1.5 Billion Second Milestone", "1500000000", "July 14, 2017, 02:40:00 UTC"],
                  ["The 2 Billion Second Milestone", "2000000000", "May 18, 2033, 03:33:20 UTC"],
                  ["The Safe 32-Bit Max Limit (Y2K38)", "2147483647", "January 19, 2038, 03:14:07 UTC"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 text-sm ${j === 0 ? "font-medium text-slate-800" : j === 1 ? "font-mono text-indigo-600" : "text-slate-600"}`}
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

        {/* ── CARD 6: Advanced Frequently Asked Questions (FAQ) ── */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Advanced Frequently Asked Questions (FAQ)</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "How does this online tool compute timezones securely?",
                a: "Every computation, parsing loop, and timestamp generation event takes place purely inside your browser engine using local execution runtimes. Your data arrays, private logging files, and API timestamps are never routed across external networks or stored in tracking servers, providing 100% processing data privacy.",
              },
              {
                q: "Why does my local date string look completely different from the UTC output layout?",
                a: "Coordinated Universal Time (UTC) remains standard everywhere as a zero-offset baseline. Conversely, Local Timezone strings are dynamically computed by your operating system, which automatically factor in regional variances, geographical settings, and localized Daylight Saving Time (DST) adjustments.",
              },
              {
                q: "What happens to official leap seconds within the Unix integer timeline?",
                a: "Unix time completely ignores leap seconds. When an extra leap second is injected into our standard UTC timeline by global metrology institutes, the Unix integer counter sequence briefly dampens or duplicates a tracking step to snap back into position with civil configurations without disrupting software range-subtraction formulas.",
              },
              {
                q: "How can I easily convert seconds to high-resolution milliseconds?",
                a: "To shift down from a 13-digit millisecond timestamp to conventional seconds, divide your target entry value by 1,000 and discard the remainder using basic floor math. To scale up from a 10-digit second value, multiply the input number by 1,000 to pad the sub-second integer blocks.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-2"></span>
                  <h3 className="font-semibold text-slate-800 text-sm">{q}</h3>
                </div>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CARD 7: Structured JSON-LD Injection Schema ── */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Code className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Structured JSON-LD Injection Schema</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            This structured data schema is injected as native JSON-LD markup to enhance search engine understanding of the tool's capabilities and operational scope.
          </p>
          <pre className="bg-slate-900 text-slate-200 rounded-xl p-4 md:p-6 overflow-x-auto text-xs md:text-sm leading-relaxed font-mono">
            {`{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Unix Timestamp Converter & Epoch Calculator",
  "url": "https://www.twistertools.com/tools/developer-tools/unix-timestamp-converter",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "featureList": [
    "Real-time live Unix epoch ticker rendering framework",
    "Bi-directional timestamp to human date string conversions module",
    "Automated seconds and milliseconds precision detection mechanics",
    "Comprehensive relative time calculations matrix display deck",
    "100 percent offline browser execution data safety guarantees"
  ]
}`}
          </pre>
        </div>
      </div>

      {/* ── JSON-LD Script Tag ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Unix Timestamp Converter & Epoch Calculator",
            url: "https://www.twistertools.com/tools/developer-tools/unix-timestamp-converter",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript. Requires HTML5.",
            featureList: [
              "Real-time live Unix epoch ticker rendering framework",
              "Bi-directional timestamp to human date string conversions module",
              "Automated seconds and milliseconds precision detection mechanics",
              "Comprehensive relative time calculations matrix display deck",
              "100 percent offline browser execution data safety guarantees",
            ],
          }),
        }}
      />
    </div>
  );
}
