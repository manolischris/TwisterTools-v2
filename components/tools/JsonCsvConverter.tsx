"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FileJson,
  FileSpreadsheet,
  Braces,
  Check,
  Copy,
  AlertTriangle,
  Trash2,
  RefreshCw,
  ArrowLeftRight,
  Upload,
  HardDrive,
  HelpCircle,
  ShieldCheck,
  Zap,
  Shield,
  ChevronDown,
  ChevronRight,
  ListOrdered,
  Table,
  Blocks,
  Info,
  Database,
  Cpu,
  Terminal,
  FileText,
  Download,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript JSON to CSV & CSV to JSON Conversion Engine
//  100% Client-Side — Zero External Dependencies
// ─────────────────────────────────────────────────────────────

type Delimiter = "," | ";" | "\t";

const DELIMITER_LABELS: Record<Delimiter, string> = {
  ",": "Comma (,)",
  ";": "Semicolon (;)",
  "\t": "Tab",
};

type ConversionMode = "json-to-csv" | "csv-to-json";

// ── JSON to CSV Engine ──────────────────────────────────────

/**
 * Flatten a nested object using dot notation.
 * e.g. { user: { name: "John" } } => { "user.name": "John" }
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
  result: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const key of Object.keys(obj)) {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      flattenObject(value as Record<string, unknown>, prefixedKey, result);
    } else {
      result[prefixedKey] = value;
    }
  }
  return result;
}

/**
 * Escape a CSV field value.
 * Wraps in double quotes if it contains commas, quotes, or newlines.
 * Escapes internal double quotes as "".
 */
function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to CSV string.
 * Handles nested objects via flattening with dot notation.
 * Automatically detects all unique keys across all objects.
 */
function jsonToCsv(jsonStr: string, delimiter: Delimiter): string {
  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error(
      "Invalid JSON input. Please check your syntax and try again."
    );
  }

  // Normalize to array
  let rows: Record<string, unknown>[];
  if (Array.isArray(data)) {
    rows = data.map((item) => {
      if (item !== null && typeof item === "object") {
        return flattenObject(item as Record<string, unknown>);
      }
      return { value: item };
    });
  } else if (data !== null && typeof data === "object") {
    rows = [flattenObject(data as Record<string, unknown>)];
  } else {
    rows = [{ value: data }];
  }

  if (rows.length === 0) {
    return "";
  }

  // Collect all unique keys across all rows
  const allKeys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }

  const headers = Array.from(allKeys);
  const sep = delimiter;

  // Build CSV
  const headerLine = headers.map((h) => escapeCsvField(h)).join(sep);
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h])).join(sep)
  );

  return [headerLine, ...dataLines].join("\n");
}

// ── CSV to JSON Engine ──────────────────────────────────────

/**
 * Parse a CSV line respecting quoted fields.
 * Handles embedded commas, quotes, and newlines within quoted fields.
 */
function parseCsvLine(line: string, delimiter: Delimiter): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  const sep = delimiter;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === sep) {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Infer the native type of a string value.
 * - Numeric strings to number
 * - "true"/"false" to boolean
 * - Empty strings to null
 * - Otherwise to string
 */
function inferType(value: string): unknown {
  if (value === "") return null;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) return num;
  }
  return value;
}

/**
 * Build a nested object from dot-notation keys.
 * e.g. { "user.name": "John", "user.age": 30 } => { user: { name: "John", age: 30 } }
 */
function unflattenObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = obj[key];
  }
  return result;
}

/**
 * Convert CSV string to JSON string.
 * Supports custom delimiter, type inference, and nested object reconstruction.
 */
function csvToJson(
  csvStr: string,
  delimiter: Delimiter,
  flattenNested: boolean
): string {
  if (!csvStr.trim()) {
    throw new Error("CSV input is empty. Please provide valid CSV data.");
  }

  const lines = csvStr.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 1) {
    throw new Error("CSV input must contain at least a header row.");
  }

  // Parse header
  const headers = parseCsvLine(lines[0], delimiter);
  if (headers.length === 0) {
    throw new Error(
      "CSV header row is empty. Please provide valid column headers."
    );
  }

  // Parse data rows
  const result: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i], delimiter);
    const row: Record<string, unknown> = {};

    for (let j = 0; j < headers.length; j++) {
      const value = j < fields.length ? fields[j] : "";
      row[headers[j]] = inferType(value);
    }

    if (flattenNested) {
      result.push(unflattenObject(row));
    } else {
      result.push(row);
    }
  }

  return JSON.stringify(result, null, 2);
}

// ── Sample Data ─────────────────────────────────────────────

const SAMPLE_JSON = JSON.stringify(
  [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      profile: {
        age: 30,
        city: "New York",
        active: true,
      },
      tags: ["developer", "designer"],
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      profile: {
        age: 25,
        city: "San Francisco",
        active: false,
      },
      tags: ["manager"],
    },
    {
      id: 3,
      name: "Charlie Brown",
      email: "charlie@example.com",
      profile: {
        age: 35,
        city: "Chicago",
        active: true,
      },
      tags: ["developer", "lead"],
    },
  ],
  null,
  2
);

const SAMPLE_CSV = `id,name,email,profile.age,profile.city,profile.active,tags
1,Alice Johnson,alice@example.com,30,New York,true,"developer,designer"
2,Bob Smith,bob@example.com,25,San Francisco,false,manager
3,Charlie Brown,charlie@example.com,35,Chicago,true,"developer,lead"`;

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────

export default function JsonCsvConverter() {
  // ── Core State ──
  const [mode, setMode] = useState<ConversionMode>("json-to-csv");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [flattenNested, setFlattenNested] = useState(true);

  // ── Metrics ──
  const [inputSize, setInputSize] = useState(0);
  const [outputSize, setOutputSize] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [efficiencyRatio, setEfficiencyRatio] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Conversion Engine ──
  const processConversion = useCallback(() => {
    setError(null);
    if (!input.trim()) {
      setOutput("");
      setInputSize(0);
      setOutputSize(0);
      setRecordCount(0);
      setEfficiencyRatio(0);
      return;
    }

    try {
      let result = "";
      let records = 0;

      if (mode === "json-to-csv") {
        result = jsonToCsv(input, delimiter);
        const lines = result.split("\n").filter((l) => l.trim());
        records = Math.max(0, lines.length - 1);
      } else {
        result = csvToJson(input, delimiter, flattenNested);
        try {
          const parsed = JSON.parse(result);
          records = Array.isArray(parsed) ? parsed.length : 1;
        } catch {
          records = 0;
        }
      }

      setOutput(result);
      const inBytes = new TextEncoder().encode(input).length;
      const outBytes = new TextEncoder().encode(result).length;
      setInputSize(inBytes);
      setOutputSize(outBytes);
      setRecordCount(records);
      setEfficiencyRatio(
        inBytes > 0 ? Math.round((outBytes / inBytes) * 100) : 0
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during conversion.";
      setError(message);
      setOutput("");
      setOutputSize(0);
      setRecordCount(0);
      setEfficiencyRatio(0);
    }
  }, [input, mode, delimiter, flattenNested]);

  // Auto-convert on input change
  useEffect(() => {
    processConversion();
  }, [processConversion]);

  // ── File Handling ──
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const processFile = useCallback((file: File) => {
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File exceeds the 5 MB limit (${(file.size / 1024 / 1024).toFixed(
          2
        )} MB). Please select a smaller file.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setInput(text);
      } catch {
        setError("Failed to read file. Please try again.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
    };
    reader.readAsText(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Clipboard ──
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  };

  // ── Sample / Clear ──
  const loadSample = () => {
    setInput(mode === "json-to-csv" ? SAMPLE_JSON : SAMPLE_CSV);
    setError(null);
  };

  const clearWorkspace = () => {
    setInput("");
    setOutput("");
    setError(null);
    setInputSize(0);
    setOutputSize(0);
    setRecordCount(0);
    setEfficiencyRatio(0);
  };

  // ── Format file size ──
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // ─────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Dashboard Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL ══════════════════ */}
        <div className="space-y-5">
          {/* Input Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          {/* Edge-to-edge Slate-to-Indigo Gradient Header Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <FileJson className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">JSON / CSV Input</span>
              </div>
            </div>


            <div className="p-5 space-y-4">
              {/* Multi-Mode Toggle (Pill Style) */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                {(
                  [
                    {
                      id: "json-to-csv" as ConversionMode,
                      label: "JSON to CSV",
                      icon: FileJson,
                    },
                    {
                      id: "csv-to-json" as ConversionMode,
                      label: "CSV to JSON",
                      icon: FileSpreadsheet,
                    },
                  ]
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    id={`csv-mode-${id}`}
                    onClick={() => {
                      setMode(id);
                      setOutput("");
                      setError(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                      mode === id
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>


              {/* Drag-and-Drop Zone */}
              <div
                id="csv-drop-zone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex items-center justify-center py-4 px-4 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".json,.csv,.txt"
                  onChange={handleFileSelect}
                  id="csv-file-input"
                />
                <div className="flex items-center gap-3 text-center">
                  <Upload className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <p className="text-xs text-slate-600">
                    {isDragging
                      ? "Drop file to load"
                      : "Drop a .json or .csv file here, or click to browse"}
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Max 5 MB
                    </span>
                  </p>
                </div>
              </div>

              {/* Input Textarea */}
              <div>
                <textarea
                  id="csv-input-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === "json-to-csv"
                      ? 'Paste your JSON here...\n\nExample:\n[\n  { "name": "Alice", "age": 30 },\n  { "name": "Bob", "age": 25 }\n]'
                      : 'Paste your CSV here...\n\nExample:\nname,age\nAlice,30\nBob,25'
                  }
                  className="font-mono text-sm h-[450px] focus:ring-2 focus:ring-indigo-600 outline-none p-4 w-full bg-white text-slate-800 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              {/* Operational Toolbar — 50/50 Row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="csv-load-sample"
                  onClick={loadSample}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 min-h-[44px]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Load Sample {mode === "json-to-csv" ? "JSON" : "CSV"}
                </button>
                <button
                  id="csv-clear"
                  onClick={clearWorkspace}
                  disabled={!input}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Workspace
                </button>
              </div>


            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL ══════════════════ */}
        <div>
          <div className="sticky top-4 space-y-4">
            {/* Output Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
              {/* Slate-to-Indigo Gradient Header Bar */}
              <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm font-semibold">
                    {mode === "json-to-csv" ? "CSV Output" : "JSON Output"}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Configuration Toolbar */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Custom Delimiter Dropdown */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="csv-delimiter"
                      className="text-xs font-medium text-slate-600 whitespace-nowrap"
                    >
                      Delimiter:
                    </label>
                    <select
                      id="csv-delimiter"
                      value={delimiter}
                      onChange={(e) =>
                        setDelimiter(e.target.value as Delimiter)
                      }
                      className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[36px]"
                    >
                      {Object.entries(DELIMITER_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* Flatten Nested Objects Toggle */}
                  {mode === "csv-to-json" && (
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="csv-flatten-toggle"
                        className="text-xs font-medium text-slate-600 whitespace-nowrap cursor-pointer"
                      >
                        Flatten Nested Objects
                      </label>
                      <button
                        id="csv-flatten-toggle"
                        role="switch"
                        aria-checked={flattenNested}
                        onClick={() => setFlattenNested((p) => !p)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          flattenNested ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
                            flattenNested ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Output Container */}
                <div className="relative">
                  <textarea
                    id="csv-output-textarea"
                    value={output}
                    readOnly
                    onClick={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.select();
                    }}
                    placeholder={
                      mode === "json-to-csv"
                        ? "Your CSV output will appear here..."
                        : "Your JSON output will appear here..."
                    }
                    className="font-mono text-sm h-[450px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none cursor-pointer"
                  />
                </div>

                {/* Dynamic Performance Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Input Payload Size
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-800">
                      {formatBytes(inputSize)}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Output Payload Size
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-800">
                      {formatBytes(outputSize)}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Total Record Count
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-800">
                      {recordCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Parse Efficiency
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-800">
                      {efficiencyRatio}%
                    </p>
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  id="csv-copy-button"
                  onClick={() => output && copyToClipboard(output)}
                  disabled={!output}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                    output
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
                      Copy Formatted Output
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        {/* Card 1: Technical Architecture of Data Serialization */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of Data Serialization</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Data serialization is the process of converting structured data
              into a linear format suitable for storage, transmission, or
              interchange between systems. JSON (JavaScript Object Notation) and
              CSV (Comma-Separated Values) represent two fundamentally different
              approaches to this challenge, each optimized for distinct use
              cases within the data engineering pipeline.
            </p>
            <p>
              <strong>JSON</strong> employs a hierarchical tree model where
              objects can be nested arbitrarily deep, arrays can contain
              heterogeneous types, and values can be strings, numbers, booleans,
              null, objects, or arrays. This flexibility makes JSON ideal for
              representing complex relational data, API payloads, and
              configuration files. However, its nested structure introduces
              parsing overhead and makes tabular analysis more difficult without
              flattening transformations.
            </p>
            <p>
              <strong>CSV</strong>, by contrast, uses a flat relational map
              where each row represents a single record and each column
              corresponds to a field. The format is inherently two-dimensional,
              making it trivially compatible with spreadsheet applications,
              database import/export workflows, and statistical analysis tools.
              CSV simplicity comes at the cost of expressiveness — nested
              objects, arrays, and complex data types must be serialized into
              flat string representations, often using dot notation or
              JSON-stringified subfields.
            </p>
            <p>
              The conversion between these two formats requires careful
              tokenization of string boundaries, proper escaping of special
              characters (commas, quotes, newlines), and deterministic
              flattening or unflattening of nested object hierarchies. Our
              engine implements these transformations entirely in client-side
              TypeScript, ensuring zero data transmission and complete privacy.
            </p>
          </div>
        </div>

        {/* Card 2: The Lexical Parsing & Array Mapping Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Lexical Parsing & Array Mapping Pipeline</span>
          </h2>
          <div className="space-y-5">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Our conversion engine follows a deterministic four-step pipeline
              to ensure accurate, lossless transformation between JSON and CSV
              formats:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  step: "1",
                  title:
                    "Token Identification & Boundary Detection",
                  body: "The input string is scanned character-by-character to identify structural tokens. For JSON, this means recognizing braces, brackets, colons, commas, and string delimiters. For CSV, the scanner identifies field separators, quote characters, and line breaks while respecting quoted boundaries that may contain embedded delimiters.",
                },
                {
                  step: "2",
                  title:
                    "Object Flattening & Key Unification",
                  body: "When converting JSON to CSV, nested objects are flattened using dot notation (e.g., 'user.address.city'). All unique keys across every object in the array are collected to form the complete column header set. This ensures no data is lost even when objects have varying key structures.",
                },
                {
                  step: "3",
                  title:
                    "Character Escape Checking & Field Sanitization",
                  body: "Field values containing commas, double quotes, or newline characters are automatically wrapped in double quotes. Internal double quotes are escaped as double-double quotes ('\"\"') per RFC 4180. This guarantees that the resulting CSV can be parsed correctly by any standards-compliant CSV reader.",
                },
                {
                  step: "4",
                  title:
                    "Final Payload Validation & Type Inference",
                  body: "The output is validated for structural integrity. For CSV-to-JSON conversion, numeric strings are automatically converted to numbers, 'true'/'false' strings to booleans, and empty fields to null. Dot-notation headers can be optionally restructured back into nested JSON objects for maximum fidelity.",
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

        {/* Card 3: Data Representation & Format Conversion Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Data Representation & Format Conversion Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            The following reference matrix illustrates how different data layout types map between JSON and CSV formats. Each row demonstrates a specific structural pattern, showing the JSON schema syntax alongside its CSV representation and the delimiter configuration required for proper conversion. This table serves as a quick reference for understanding how the conversion engine handles various data structures.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Data Layout Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">JSON Schema Syntax</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">CSV Representation</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Delimiter Configuration</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Flat Array of Primitives", '[ "a", "b", "c" ]', "value / a / b / c", "Comma, Semicolon, Tab"],
                  ["Flat Object Array", '[ { "id": 1, "name": "A" } ]', "id,name / 1,A", "Comma (standard)"],
                  ["Deep Nested Objects", '{ "user": { "name": "A" } }', "user.name / A", "Dot notation flattening"],
                  ["Comma-Separated Lists in Fields", '{ "tags": ["x", "y"] }', '"tags" / "x,y"', "Quoted field escaping"],
                  ["Tab-Separated Matrix", '[ { "a": 1 }, { "a": 2 } ]', "a / 1 / 2", "Tab delimiter"],
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono"
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


        {/* Card 4: Production Data Pipeline & Migration Use Cases */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Production Data Pipeline & Migration Use Cases</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Spreadsheet Ingestions",
                body: "Import CSV exports from Google Sheets, Microsoft Excel, or Apple Numbers directly into structured JSON objects for programmatic processing. Our engine preserves column headers as keys and infers native types automatically, eliminating manual data cleaning steps.",
              },
              {
                title: "API Data Staging",
                body: "Transform JSON API responses from REST or GraphQL endpoints into flat CSV tables for business intelligence tools, data warehouses, or legacy reporting systems that require tabular input formats.",
              },
              {
                title: "Legacy Database Backups",
                body: "Convert legacy database dumps exported as CSV into properly structured JSON documents for modern NoSQL databases like MongoDB or Firebase. Dot-notation flattening ensures nested relationships are preserved during migration.",
              },
              {
                title: "Modern CRM Payload Normalization",
                body: "Normalize CRM contact exports with varying field structures into consistent JSON schemas. Our engine handles missing fields gracefully, filling gaps with null values while maintaining structural integrity across all records.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
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

        {/* Card 5: Advanced Data Transformation FAQs */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Advanced Data Transformation FAQs</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "How does the converter handle multi-line field data in CSV files?",
                a: "Our CSV parser fully supports RFC 4180 quoted fields, which can span multiple lines. When a field is enclosed in double quotes, embedded newlines, commas, and quotes are preserved correctly. The parser tracks quote state across line boundaries, ensuring that multi-line text fields are reconstructed faithfully in the JSON output.",
              },
              {
                q: "What are the local memory limits for client-side conversion?",
                a: "Since all processing occurs in the browser using JavaScript native arrays and the TextEncoder API, the practical limit depends on available system memory. For most modern browsers, files up to 50-100 MB can be processed comfortably. Our drag-and-drop interface enforces a 5 MB file size limit for uploads, but pasted content can be larger. For extremely large datasets, consider splitting files into smaller batches.",
              },
              {
                q: "How deep does the structure flattening go for nested JSON objects?",
                a: "The flattening algorithm recursively traverses all nested object levels without artificial depth limits. Each nesting level is represented using dot notation (e.g., 'level1.level2.level3.field'). The unflattening process reverses this transformation, reconstructing the full nested hierarchy from dot-notation keys. This supports arbitrarily deep nesting structures commonly found in complex API responses.",
              },
              {
                q: "Is my data safe and private during conversion?",
                a: "Absolutely. All conversion processing happens entirely within your browser using client-side TypeScript. No data is transmitted to any server, API, or third-party service. The FileReader API reads files directly into browser memory, and the TextEncoder/Decoder APIs handle all string operations locally. Your data never leaves your device, ensuring complete privacy and security for sensitive information.",
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


        {/* Card 6: Platform Performance Advantages */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
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
                title: "Zero Latency Processing",
                body: "All conversion logic executes directly in the browser using native JavaScript engines (V8, SpiderMonkey, JavaScriptCore). There are no network round-trips, server queues, or API rate limits. Results appear instantly as you type, with real-time reactive updates driven by React state management.",
              },
              {
                icon: Shield,
                title: "100% Document Sandbox Isolation",
                body: "Your data is processed within the browser's secure sandbox environment. The FileReader API and TextEncoder/Decoder interfaces operate entirely in memory without persisting data to disk or transmitting it over the network. This architecture guarantees complete data privacy.",
              },
              {
                icon: Cpu,
                title: "Native Array Performance",
                body: "Our engine leverages JavaScript native Array methods (map, reduce, forEach) and the highly optimized TextEncoder API for byte-level size calculations. The flattening and unflattening algorithms use iterative object traversal with O(n) complexity, ensuring linear scaling with input size.",
              },
              {
                icon: Blocks,
                title: "No External Dependencies",
                body: "The entire conversion engine is implemented in pure TypeScript with zero external libraries or runtime dependencies. This eliminates supply chain risks, reduces bundle size, and guarantees long-term maintainability. The CSV parser and JSON serializer are hand-optimized for edge-case correctness.",
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

      {/* JSON-LD Structured Metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "JSON to CSV & CSV to JSON Converter",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript. Supports HTML5 FileReader.",
            description:
              "A premium, secure client-side converter for transforming JSON data to CSV format and CSV data to JSON format. Supports custom delimiters, nested object flattening, real-time reactive conversion, dynamic size metrics tracking, and drag-and-drop file ingestion.",
            featureList: [
              "Custom delimiter mapping (Comma, Semicolon, Tab)",
              "Multi-level object flattening with dot notation",
              "Real-time reactive conversion with instant results",
              "Dynamic size metrics tracking (input/output bytes, record count, efficiency ratio)",
              "Drag-and-drop file ingestion via HTML5 FileReader API",
              "Type inference for numeric, boolean, and null values",
              "RFC 4180 compliant CSV escaping and parsing",
              "100% client-side processing with zero data transmission",
            ],
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
    </div>
  );
}
