"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Braces,
  Check,
  Copy,
  AlertTriangle,
  Trash2,
  Sparkles,
  BookOpen,
  HelpCircle,
  Cpu,
  Upload,
  FileText,
  FileJson,
  ShieldCheck,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure JS Helper Functions for Metrics & Transformations
// ─────────────────────────────────────────────────────────────

// Recursively calculates nesting depth
function getDepth(obj: any): number {
  if (obj === null || typeof obj !== "object") return 0;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return 1;
    return 1 + Math.max(...obj.map((item) => getDepth(item)));
  }
  const keys = Object.keys(obj);
  if (keys.length === 0) return 1;
  return 1 + Math.max(...keys.map((key) => getDepth(obj[key])));
}

// Recursively counts total keys
function getKeyCount(obj: any): number {
  if (obj === null || typeof obj !== "object") return 0;
  let count = 0;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += getKeyCount(item);
    }
  } else {
    const keys = Object.keys(obj);
    count += keys.length;
    for (const key of keys) {
      count += getKeyCount(obj[key]);
    }
  }
  return count;
}

// Safe character-level scanner to strip trailing commas
function fixTrailingCommas(jsonStr: string): string {
  let inString = false;
  let escape = false;
  const chars = jsonStr.split("");
  let lastCommaIndex = -1;

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }

    if (c === ",") {
      lastCommaIndex = i;
    } else if (c === "}" || c === "]") {
      if (lastCommaIndex !== -1) {
        const between = jsonStr.slice(lastCommaIndex + 1, i);
        if (/^\s*$/.test(between)) {
          chars[lastCommaIndex] = " "; // Replace trailing comma with space
        }
      }
      lastCommaIndex = -1;
    } else if (!/\s/.test(c)) {
      lastCommaIndex = -1;
    }
  }
  return chars.join("");
}

// Helper to format file sizes nicely
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const FAQS = [
  {
    q: "What causes typical JSON SyntaxErrors during structural parsing?",
    a: "Syntax failures are usually triggered by minor oversights: using single quotes (') instead of standard double quotes (\") around string keys and values, leaving a trailing comma after the final item in an object or array block, missing structural brackets, or pasting unescaped control characters."
  },
  {
    q: "How does the \"Fix Common Trailing Commas\" option work?",
    a: "When active, our processing engine applies targeted regular expressions to locate trailing commas positioned immediately before closing brackets (\"]\") or closing braces (\"}\"). It removes these invalid elements automatically before running the primary verification pass, correcting minor formatting oversights seamlessly."
  },
  {
    q: "Does my confidential code cross external networks?",
    a: "Absolutely not. The TwisterTools architecture is fundamentally built on privacy-first client execution. All parsing calculations, text transformations, and formatting layouts occur directly within your individual browser runtime session. Zero payload records are sent back to our servers, keeping your proprietary records safe."
  },
  {
    q: "What is the max data capacity this workbench can process?",
    a: "The system handles file processing up to 5 MB through our optimized HTML5 file reader interface. For heavy log arrays or high-density payloads beyond this limit, browser heap constraints can degrade rendering speeds, so we recommend staging larger files in sections for the smoothest experience."
  }
];

// ─────────────────────────────────────────────────────────────
//  Main JSON Formatter & Validator Component
// ─────────────────────────────────────────────────────────────
export default function JsonFormatterValidator() {
  const [input, setInput] = useState("");
  const [indentSize, setIndentSize] = useState<"2" | "4" | "tab">("2");
  const [fixTrailing, setFixTrailing] = useState(false);
  const [copied, setCopied] = useState(false);

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll Sync Refs
  const lineGutterRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize Scroll of Gutter and Textarea
  const handleScroll = () => {
    if (textareaRef.current && lineGutterRef.current) {
      lineGutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // ── Drag & Drop file processing ──
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit

  const processFile = (file: File) => {
    setFileError("");
    setFileInfo(null);

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File exceeds the 5 MB limit (${formatFileSize(file.size)}).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setInput(text);
        setFileInfo({ name: file.name, size: file.size });
      } else {
        setFileError("Could not read file contents as text.");
      }
    };
    reader.onerror = () => {
      setFileError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setFileInfo(null);
    setInput("");
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Sample Loader ──
  const loadSampleJson = () => {
    const sample = {
      name: "TwisterTools JSON Benchmark Payload",
      version: 2.0,
      active: true,
      meta: {
        category: "developer-tools",
        tags: ["formatter", "validator", "beautifier"],
      },
      metrics: {
        engine: "V8 client-side",
        safe: true,
        limit_mb: 5,
      },
      contributors: [
        {
          name: "Manolis",
          role: "Lead Architect",
        },
        {
          name: "Antigravity",
          role: "AI Pair Programmer",
        },
      ],
    };
    const indent = indentSize === "tab" ? "\t" : parseInt(indentSize, 10);
    setInput(JSON.stringify(sample, null, indent));
    setFileInfo(null);
    setFileError("");
  };

  // ── In-place Transformations ──
  const handleBeautifyInput = () => {
    if (!input.trim()) return;
    try {
      let clean = input;
      if (fixTrailing) {
        clean = fixTrailingCommas(input);
      }
      const parsed = JSON.parse(clean);
      const indent = indentSize === "tab" ? "\t" : parseInt(indentSize, 10);
      setInput(JSON.stringify(parsed, null, indent));
    } catch (err) {
      // Allow dynamic error interceptor to catch the issue
    }
  };

  const handleMinifyInput = () => {
    if (!input.trim()) return;
    try {
      let clean = input;
      if (fixTrailing) {
        clean = fixTrailingCommas(input);
      }
      const parsed = JSON.parse(clean);
      setInput(JSON.stringify(parsed));
    } catch (err) {
      // Allow dynamic error interceptor to catch the issue
    }
  };

  const handleClear = () => {
    setInput("");
    setFileInfo(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Reactive Parser & Validation Engine ──
  let parsedObj: any = null;
  let parseError: { message: string; line: number; column: number } | null = null;
  let formattedOutput = "";

  if (input.trim()) {
    try {
      let cleanInput = input;
      if (fixTrailing) {
        cleanInput = fixTrailingCommas(input);
      }
      parsedObj = JSON.parse(cleanInput);
      const indent = indentSize === "tab" ? "\t" : parseInt(indentSize, 10);
      formattedOutput = JSON.stringify(parsedObj, null, indent);
    } catch (err: any) {
      const msg = err.message || "Invalid JSON syntax";
      let line = 1;
      let column = 1;

      // Extract line and column information from V8 error object
      const lineColMatch = msg.match(/line (\d+) column (\d+)/i) || msg.match(/at line (\d+), column (\d+)/i);
      if (lineColMatch) {
        line = parseInt(lineColMatch[1], 10);
        column = parseInt(lineColMatch[2], 10);
      } else {
        const posMatch = msg.match(/position (\d+)/i);
        if (posMatch) {
          const pos = parseInt(posMatch[1], 10);
          const linesUpToPos = input.slice(0, pos).split("\n");
          line = linesUpToPos.length;
          column = linesUpToPos[linesUpToPos.length - 1].length + 1;
        }
      }

      parseError = {
        message: msg,
        line,
        column,
      };
    }
  }

  // ── Metrics Calculation ──
  const inputSize = new Blob([input]).size;
  const outputSize = formattedOutput ? new Blob([formattedOutput]).size : 0;
  const compressionRatio = inputSize && outputSize
    ? parseFloat((((inputSize - outputSize) / inputSize) * 100).toFixed(1))
    : 0;
  const nestingDepth = parsedObj ? getDepth(parsedObj) : 0;
  const totalKeys = parsedObj ? getKeyCount(parsedObj) : 0;

  // ── Line numbers count ──
  const lineCount = input.split("\n").length || 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // ── Custom JSON Tokenizer for Premium Highlighting ──
  const highlightJson = (json: string) => {
    if (!json) return null;
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[\[\]{}:,])/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(json)) !== null) {
      if (match.index > lastIndex) {
        parts.push(json.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('"')) {
        if (token.endsWith(":")) {
          // Object Key - Slate-indigo accent matching active focus
          parts.push(
            <span key={match.index} className="text-indigo-400 font-semibold">
              {token.slice(0, -1)}
            </span>
          );
          parts.push(":");
        } else {
          // String Value - Emerald green
          parts.push(
            <span key={match.index} className="text-emerald-400">
              {token}
            </span>
          );
        }
      } else if (/^(true|false|null)$/.test(token)) {
        // Boolean or Null - Amber orange
        parts.push(
          <span key={match.index} className="text-amber-400 font-semibold">
            {token}
          </span>
        );
      } else if (/^-?\d/.test(token)) {
        // Number - Sky blue
        parts.push(
          <span key={match.index} className="text-sky-400">
            {token}
          </span>
        );
      } else {
        // Structural Characters - Slate gray
        parts.push(
          <span key={match.index} className="text-slate-400">
            {token}
          </span>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < json.length) {
      parts.push(json.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="space-y-6">
      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* ══════════════════ LEFT PANEL: WORKSPACE INPUT ══════════════════ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Braces className="w-5 h-5 text-indigo-600" />
              JSON Input Editor
            </h2>
            {input.trim() && (
              <span className="text-xs text-slate-500 font-medium">
                {lineCount} Line{lineCount !== 1 ? "s" : ""} &bull; {input.length} Chars
              </span>
            )}
          </div>

          {/* Code Editor Container */}
          <div className="relative flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent min-h-[360px] max-h-[480px]">
            {/* Scroll-synced Line Numbers */}
            <pre
              ref={lineGutterRef}
              className="w-12 select-none bg-slate-100 border-r border-slate-200 pr-2 text-right leading-6 py-3 font-mono text-xs text-slate-400 overflow-y-hidden"
            >
              {lineNumbers.join("\n")}
            </pre>

            {/* Input Text Area */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onScroll={handleScroll}
              placeholder="Paste raw minified JSON here or drag-and-drop a text file..."
              className="flex-1 bg-transparent font-mono text-xs text-slate-800 placeholder-slate-400 py-3 px-3 outline-none resize-none overflow-auto leading-6 min-h-[360px] max-h-[480px]"
              style={{ whiteSpace: "pre", overflowWrap: "normal" }}
              id="json-input-editor"
            />
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-4 px-4 min-h-[72px] ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/40"
                : fileInfo && !fileError
                ? "border-green-400 bg-green-50/10"
                : fileError
                ? "border-red-400 bg-red-50/10"
                : "border-slate-300 bg-slate-50/50 hover:border-indigo-500 hover:bg-indigo-50/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              className="hidden"
              onChange={handleFileSelect}
              id="json-file-input"
            />
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-700">
                  {isDragging ? "Drop JSON file here" : "Drag & drop JSON file or click to browse"}
                </p>
                <p className="text-[10px] text-slate-500">
                  Upload file up to 5 MB
                </p>
              </div>
            </div>
          </div>

          {/* File Metadata Badges */}
          {fileInfo && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800 block truncate max-w-[200px]" title={fileInfo.name}>
                    {fileInfo.name}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {formatFileSize(fileInfo.size)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-red-600 hover:text-red-700 font-semibold px-2 py-1.5 hover:bg-red-50 rounded-md transition-colors min-h-[40px] flex items-center"
              >
                Remove File
              </button>
            </div>
          )}

          {fileError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Indentation Selector & Actions Toolbar */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            {/* Indentation Option */}
            <div className="flex items-center gap-2">
              <label htmlFor="indentation-select" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                Indentation:
              </label>
              <select
                id="indentation-select"
                value={indentSize}
                onChange={(e) => setIndentSize(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-10 min-w-[120px]"
              >
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
                <option value="tab">Tab Indent</option>
              </select>
            </div>

            {/* Actions toolbar grid layout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleBeautifyInput}
                disabled={!input.trim()}
                className="h-10 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
              >
                Format / Beautify
              </button>
              <button
                onClick={handleMinifyInput}
                disabled={!input.trim()}
                className="h-10 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
              >
                Minify / Compact
              </button>
              <button
                onClick={loadSampleJson}
                className="h-10 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center whitespace-nowrap"
              >
                Load Sample
              </button>
              <button
                onClick={handleClear}
                disabled={!input}
                className="h-10 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                title="Clear input"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Input</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: OUTPUT & VALIDATION ══════════════════ */}
        <div className="sticky top-4 space-y-4">
          
          {/* Main Formatted Code view card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-600" />
                Formatted Output
              </h2>

              <div className="flex items-center gap-4">
                {/* Trailing Commas Helper Toggle */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="fix-commas-toggle"
                    className="text-xs font-medium text-slate-600 cursor-pointer"
                  >
                    Fix Commas
                  </label>
                  <button
                    id="fix-commas-toggle"
                    role="switch"
                    aria-checked={fixTrailing}
                    onClick={() => setFixTrailing((prev) => !prev)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      fixTrailing ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                        fixTrailing ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Syntax Error Interception Banner */}
            {parseError && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-red-800">
                      JSON Syntax Error Detected
                    </p>
                    <p className="text-xs font-mono mt-1 whitespace-pre-wrap leading-relaxed">
                      {parseError.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] font-bold text-red-800">
                      <span>Line: {parseError.line}</span>
                      <span>Col Offset: {parseError.column}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Read-only Formatted Monospace Code block */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 min-h-[220px] max-h-[340px] overflow-auto">
              {formattedOutput ? (
                <pre className="font-mono text-xs whitespace-pre leading-6 text-indigo-400">
                  <code>{highlightJson(formattedOutput)}</code>
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[180px] text-slate-500">
                  <Braces className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                  <p className="text-xs italic">
                    {input.trim() ? "Resolve errors to inspect output..." : "No JSON payload loaded."}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Copy Action */}
            <button
              onClick={() => formattedOutput && copyToClipboard(formattedOutput)}
              disabled={!formattedOutput}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                formattedOutput
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
                  Copy Formatted JSON
                </>
              )}
            </button>
          </div>

          {/* Payload Metrics Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              Payload Statistics & Metrics
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Payload Sizes</p>
                <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                  <span className="text-sm font-bold text-slate-800">{formatFileSize(inputSize)}</span>
                  <span className="text-slate-400 text-xs">vs</span>
                  <span className="text-xs font-semibold text-slate-600">{formatFileSize(outputSize)}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Size Change</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {compressionRatio > 0 ? `+${compressionRatio}%` : `${compressionRatio}%`}
                </p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Max Nesting Depth</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{nestingDepth}</p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Object Key Count</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{totalKeys}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD AUTHORITATIVE SEO CONTENT
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6 pt-6">
        {/* SECTION 1: COMPREHENSIVE TECHNICAL OVERVIEW */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/60 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <FileJson className="w-5 h-5 text-indigo-600" />
            The Ultimate Specification Guide to Modern JSON Parsing
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            JavaScript Object Notation (JSON) has evolved from a lightweight subset of ECMAScript 3 into the internet's primary data interchange format. Governed strictly by the **RFC 8259** and **ECMA-404** international standards, JSON provides a language-independent text format for representing structured data. However, because modern production environments prioritize bandwidth reduction, data transfer pipelines heavily minify JSON payloads. This mechanical stripping of whitespace, tabulations, and carriage returns results in single-line data strings that are completely unreadable for engineering teams attempting to isolate bugs, verify network schemas, or inspect backend responses.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mt-3">
            The TwisterTools JSON Formatter & Validator acts as a robust, sandboxed client-side workbench that bridges the gap between high-density computer serialization and human readability. By applying advanced syntactic pass-through tokenization, the tool translates compressed payloads into clean, hierarchical representations featuring customized indentation spaces. Operating entirely within your local browser runtime, it guarantees that confidential API keys, personal user metrics, and enterprise system data never cross the network or face third-party telemetry exposures.
          </p>
        </div>

        {/* SECTION 2: THE 4-STAGE CLIENT VALIDATION ENGINE */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/60 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
            <Cpu className="w-5 h-5 text-indigo-600" />
            How the JSON Validation Mechanism Works Step-by-Step
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            When a string sequence is introduced to the workbench, our localized JavaScript/TypeScript engine processes the data stream across four clear computational phases to isolate data structural anomalies instantly:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold mb-3">1</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">String Ingestion</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Accepts raw input strings or local text payloads up to 5 MB via the HTML5 FileReader API, processing data entirely within temporary memory registers.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold mb-3">2</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Lexical Tokenization</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Scans individual structural markers—curly braces, square brackets, key-value colons, and escaping characters—to verify structural integrity against strict specifications.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold mb-3">3</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Tree Construction</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Builds an internal data hierarchy, accurately mapping nested object scopes, complex value pairs, and boolean or null primitive distributions.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold mb-3">4</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Indentation Rebuild</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Applies clean formatting spacing based on selected tab or space parameters, instantly returning organized code blocks ready for developer review.</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: CORE COMPLIANCE AND VALIDATION MATRIX */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/60 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            JSON Formatting Compliance: Valid vs. Invalid Structures
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            Unlike casual JavaScript object initializers, the official RFC specifications for JSON reject flexible syntax variations. Review this compliance matrix to understand what causes structural syntax parser failures:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3">Syntax Element</th>
                  <th className="p-3 text-emerald-700">Valid RFC Specification</th>
                  <th className="p-3 text-rose-700">Invalid Syntax Formats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-3 font-medium text-slate-900">Key Quoting</td>
                  <td className="p-3 font-mono text-emerald-600">{"{\"status\": \"active\"}"}</td>
                  <td className="p-3 font-mono text-rose-600">{"{'status': 'active'}"} <span className="text-slate-500 block text-[11px]">(Single quotes are illegal)</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-900">Trailing Commas</td>
                  <td className="p-3 font-mono text-emerald-600">{"[1, 2, 3]"}</td>
                  <td className="p-3 font-mono text-rose-600">{"[1, 2, 3,]"} <span className="text-slate-500 block text-[11px]">(Dangling commas throw syntax errors)</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-900">String Primitives</td>
                  <td className="p-3 font-mono text-emerald-600">{"true"}, {"false"}, {"null"}</td>
                  <td className="p-3 font-mono text-rose-600">{"True"}, {"FALSE"}, {"undefined"} <span className="text-slate-500 block text-[11px]">(Must be absolute lower-case primitives)</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-900">Numerical Values</td>
                  <td className="p-3 font-mono text-emerald-600">{"0.45"}, {"-12"}</td>
                  <td className="p-3 font-mono text-rose-600">{"012"}, {".45"}, {"NaN"} <span className="text-slate-500 block text-[11px]">(Leading zeros and orphaned decimals fail)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: REAL-WORLD USE CASES */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/60 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Professional Application Scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 border border-slate-200/80 rounded-xl hover:shadow-md transition-shadow bg-slate-50/30">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                REST & GraphQL API Integration
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Modern network tools or terminal curl queries often output completely minified payload structures. Drop those raw text responses directly into the input container to break complex data structures down into readable, high-contrast objects, making payload debugging highly efficient.
              </p>
            </div>
            <div className="p-5 border border-slate-200/80 rounded-xl hover:shadow-md transition-shadow bg-slate-50/30">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Application Architecture Configuration
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Modern build chains rely on strict file configurations such as `package.json`, `tsconfig.json`, or customized localized app settings. Running your files through our validation system verifies structural syntax before deployments, preventing unexpected compilation drops.
              </p>
            </div>
            <div className="p-5 border border-slate-200/80 rounded-xl hover:shadow-md transition-shadow bg-slate-50/30">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                NoSQL Database Records Management
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Document stores like MongoDB, CouchDB, or Firebase rely on JSON data storage formats. This workbench lets you easily review or format records, modify keys safely, and maintain clean database structure without errors.
              </p>
            </div>
            <div className="p-5 border border-slate-200/80 rounded-xl hover:shadow-md transition-shadow bg-slate-50/30">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Webhook Event Diagnostics
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Integrations from providers like Stripe, GitHub, or Shopify deliver rich metadata arrays via automated POST endpoints. Formatting those incoming records makes tracking parameter issues simple and clear.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {FAQS.map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose TwisterTools */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose TwisterTools for Data Processing?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "Zero Data Exposure",
                body: "100% client-side computation. Your JSON payloads never leave your browser tab.",
              },
              {
                icon: Sparkles,
                title: "Instant Formatting",
                body: "Minified JSON strings are beautified instantly using your preferred spacing with zero latency.",
              },
              {
                icon: Braces,
                title: "Precise Error Isolation",
                body: "Instantly maps JSON validation failures to the exact line and column offset to trace bugs quickly.",
              },
              {
                icon: FileJson,
                title: "Local File Support",
                body: "Drag-and-drop or select any local .json or .txt file up to 5 MB for parsing directly from disk.",
              },
              {
                icon: Check,
                title: "Smart Trailing Commas Fix",
                body: "Toggle our smart character-level scanner to strip invalid trailing commas before verification.",
              },
              {
                icon: Cpu,
                title: "Deep Payload Metrics",
                body: "Gain insights into your data with live size counters, compression ratios, nesting depths, and key counts.",
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
    </div>
  );
}
