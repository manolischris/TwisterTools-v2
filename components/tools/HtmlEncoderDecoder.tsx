"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Code,
  Info,
  Cpu,
  Briefcase,
  Table,
  MessageSquare,
  Copy,
  Check,
  Shield,
  AlertCircle,
  RefreshCw,
  Trash2,
  FileText,
  Upload,
  Settings,
  ShieldCheck,
  FileCode,
  BookOpen,
  Code2,
  HelpCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure HTML Entity Encoder / Decoder Logic
// ─────────────────────────────────────────────────────────────

const NAMED_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
  // Common symbols
  "\u00A0": "&nbsp;",
  "©": "&copy;",
  "®": "&reg;",
  "™": "&trade;",
  "¢": "&cent;",
  "£": "&pound;",
  "¥": "&yen;",
  "€": "&euro;",
  "°": "&deg;",
  "±": "&plusmn;",
  "×": "&times;",
  "÷": "&divide;",
  "¶": "&para;",
  "§": "&sect;",
  "·": "&middot;",
  "•": "&bull;",
  "–": "&ndash;",
  "—": "&mdash;",
  "‘": "&lsquo;",
  "’": "&rsquo;",
  "“": "&ldquo;",
  "”": "&rdquo;",
  "…": "&hellip;",
};

function encodeHtml(
  text: string,
  encodeType: "all" | "special",
  outputRef: "named" | "decimal" | "hex"
): string {
  if (!text) return "";

  const specialChars = new Set(["<", ">", "&", '"', "'"]);
  let result = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);
    const isSpecial = specialChars.has(char);

    let shouldEncode = false;
    if (encodeType === "special") {
      shouldEncode = isSpecial;
    } else {
      // Encode all non-alphanumeric and non-basic whitespace characters
      const isAlphanumeric =
        (code >= 48 && code <= 57) ||
        (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122);
      const isWhitespace =
        char === " " || char === "\t" || char === "\n" || char === "\r";
      shouldEncode = !isAlphanumeric && !isWhitespace;
    }

    if (shouldEncode) {
      if (outputRef === "named") {
        if (NAMED_MAP[char]) {
          result += NAMED_MAP[char];
        } else {
          result += `&#${code};`;
        }
      } else if (outputRef === "decimal") {
        result += `&#${code};`;
      } else {
        result += `&#x${code.toString(16)};`;
      }
    } else {
      result += char;
    }
  }

  return result;
}

function decodeHtml(html: string): { text: string; error?: string } {
  if (!html) return { text: "" };

  try {
    if (typeof window !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const text = doc.documentElement.textContent || "";
      return { text };
    }
  } catch (e: any) {
    return {
      text: html,
      error: e?.message || "Failed to decode HTML entities safely.",
    };
  }

  return { text: html };
}

// Check for potentially broken or malformed entity syntax (e.g. unclosed ampersands)
function checkMalformedEntities(text: string, mode: "encode" | "decode"): string | null {
  if (mode === "encode") return null;

  // Find occurrences of & followed by text/numbers but missing a closing semicolon
  // e.g. &lt (not followed by ;) or &#60 (not followed by ;)
  const unclosedPattern = /&[a-zA-Z0-9#x]+(?![;a-zA-Z0-9#x])/g;
  const matches = text.match(unclosedPattern);

  if (matches && matches.length > 0) {
    return `Detected ${matches.length} unclosed entity reference(s) (e.g. "${matches[0]}"). They will be parsed using default browser correction.`;
  }

  return null;
}

export default function HtmlEncoderDecoder() {
  // ── State Management ──
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [encodeType, setEncodeType] = useState<"all" | "special">("special");
  const [outputRef, setOutputRef] = useState<"named" | "decimal" | "hex">("named");
  const [copied, setCopied] = useState(false);

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // ── Sample HTML ──
  const SAMPLE_HTML_ENCODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML Entity Demo Page</title>
</head>
<body>
  <!-- Greeting -->
  <h1 class="heading">Hello & Welcome to "TwisterTools"!</h1>
  
  <p>Let's check HTML reserved characters: <, >, &, ", and '.</p>
  <p>Accented characters: André, café, mañana.</p>
  <p>Unicode math/currency: ©, ®, ™, €, and ¥.</p>
</body>
</html>`;

  const SAMPLE_HTML_DECODE = `&lt;!DOCTYPE html&gt;
&lt;html lang=&quot;en&quot;&gt;
&lt;head&gt;
  &lt;meta charset=&quot;UTF-8&quot;&gt;
  &lt;title&gt;HTML Entity Demo Page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;!-- Greeting --&gt;
  &lt;h1 class=&quot;heading&quot;&gt;Hello &amp; Welcome to &quot;TwisterTools&quot;!&lt;/h1&gt;
  
  &lt;p&gt;Let's check HTML reserved characters: &amp;lt;, &amp;gt;, &amp;amp;, &amp;quot;, and &amp;apos;.&lt;/p&gt;
  &lt;p&gt;Accented characters: Andr&amp;eacute;, caf&amp;eacute;, ma&amp;ntilde;ana.&lt;/p&gt;
  &lt;p&gt;Unicode math/currency: &amp;copy;, &amp;reg;, &amp;trade;, &amp;euro;, and &amp;yen;.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;`;

  // ── File Processing ──
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const processFile = (file: File) => {
    setFileError("");
    setFileInfo(null);

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File exceeds the 5 MB safety limit (${formatFileSize(file.size)}).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setInput(text);
        setFileInfo({ name: file.name, size: file.size });
      } else {
        setFileError("Could not parse file content as text.");
      }
    };
    reader.onerror = () => {
      setFileError("Error reading local file.");
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ── Core Processing Loop ──
  let output = "";
  let hasError = false;
  let validationWarning = checkMalformedEntities(input, mode);

  try {
    if (input) {
      if (mode === "encode") {
        output = encodeHtml(input, encodeType, outputRef);
      } else {
        const decoded = decodeHtml(input);
        output = decoded.text;
        if (decoded.error) {
          validationWarning = decoded.error;
        }
      }
    }
  } catch (e: any) {
    hasError = true;
    validationWarning = e?.message || "Execution error during entity translation.";
  }

  // ── Action Handlers ──
  const handleLoadSample = () => {
    setInput(mode === "encode" ? SAMPLE_HTML_ENCODE : SAMPLE_HTML_DECODE);
    setFileInfo(null);
    setFileError("");
  };

  const handleClear = () => {
    setInput("");
    setFileInfo(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSwap = () => {
    const currentOutput = output;
    setMode((prev) => (prev === "encode" ? "decode" : "encode"));
    setInput(currentOutput);
    setFileInfo(null);
    setFileError("");
  };

  const handleCopy = async () => {
    if (!output || hasError) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  };

  // ── Payload Performance Metrics ──
  const inputCharCount = input.length;
  const outputCharCount = output.length;
  const charDifference = outputCharCount - inputCharCount;

  const encoder = typeof window !== "undefined" ? new TextEncoder() : null;
  const inputBytes = encoder ? encoder.encode(input).length : inputCharCount;
  const outputBytes = encoder ? encoder.encode(output).length : outputCharCount;
  const byteDifference = outputBytes - inputBytes;

  const changeRatio = inputBytes > 0 ? (byteDifference / inputBytes) * 100 : 0;
  const expansionFactor = inputBytes > 0 ? outputBytes / inputBytes : 1.0;

  const inputLineCount = input ? input.split("\n").length : 0;
  const outputLineCount = output ? output.split("\n").length : 0;

  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Dashboard Grid (EQUAL WIDTH COLUMNS) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL (Workspace Controls) ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            {/* Mode Selector Row */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              <button
                type="button"
                id="html-tab-encode"
                onClick={() => {
                  setMode("encode");
                  handleClear();
                }}
                className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 min-h-[40px] flex items-center justify-center ${
                  mode === "encode"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                }`}
              >
                Encode Mode
              </button>
              <button
                type="button"
                id="html-tab-decode"
                onClick={() => {
                  setMode("decode");
                  handleClear();
                }}
                className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 min-h-[40px] flex items-center justify-center ${
                  mode === "decode"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                }`}
              >
                Decode Mode
              </button>
            </div>

            {/* Input Workspace (TEXTAREA FIRST) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="html-input-textarea"
                  className="block text-sm font-semibold text-slate-700"
                >
                  {mode === "encode" ? "Raw HTML / Plain Text to Encode" : "Encoded HTML Entity Code to Decode"}
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  {inputCharCount.toLocaleString()} character{inputCharCount !== 1 ? "s" : ""}
                </span>
              </div>
              <textarea
                id="html-input-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "encode"
                    ? "Type, paste, or load sample HTML to encode..."
                    : "Paste text containing HTML entity references to decode..."
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-mono h-[320px] resize-none"
              />
            </div>

            {/* File Ingestion Area */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Load from File (Optional)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-5 px-4 ${
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
                  accept=".txt,.html,.htm,.xml,.json,.js,.css"
                  className="hidden"
                  onChange={handleFileSelect}
                  id="html-file-input"
                />
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-700">
                      {isDragging ? "Drop text file here" : "Drag & drop local file or click to browse"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Supports .html, .txt, .xml, .json (up to 5 MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion Feedback Badges */}
            {fileInfo && (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 block truncate max-w-[220px]" title={fileInfo.name}>
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
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Advanced Options Accordion */}
            {mode === "encode" && (
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm mb-1">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span>Encoding Settings</span>
                </div>
                
                {/* Encoding Type Toggle */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Encoding Scope
                  </span>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 min-h-[48px] ${
                        encodeType === "special"
                          ? "border-indigo-600 bg-indigo-50/20"
                          : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="encode-type"
                        checked={encodeType === "special"}
                        onChange={() => setEncodeType("special")}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-slate-300"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-800">
                          Special Characters Only
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          Only encodes HTML markup syntax symbols: &lt; &gt; &amp; &quot; &apos;
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 min-h-[48px] ${
                        encodeType === "all"
                          ? "border-indigo-600 bg-indigo-50/20"
                          : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="encode-type"
                        checked={encodeType === "all"}
                        onChange={() => setEncodeType("all")}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-slate-300"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-800">
                          Encode All Characters
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          Encodes all symbols, accents, and high-order unicode points.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Output Reference Format */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Output Reference Format
                  </span>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {[
                      { id: "named", label: "Named Entities", desc: "&amp;lt; / &amp;copy;" },
                      { id: "decimal", label: "Decimal Refs", desc: "&amp;#60; / &amp;#169;" },
                      { id: "hex", label: "Hexadecimal Refs", desc: "&amp;#x3c; / &amp;#xa9;" },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-all duration-200 min-h-[56px] text-center ${
                          outputRef === opt.id
                            ? "border-indigo-600 bg-indigo-50/20 text-indigo-900"
                            : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="output-ref"
                          checked={outputRef === opt.id}
                          onChange={() => setOutputRef(opt.id as any)}
                          className="sr-only"
                        />
                        <span className="text-xs font-semibold block">{opt.label}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5" dangerouslySetInnerHTML={{ __html: opt.desc }} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Operational Warning Banner */}
            {validationWarning && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-medium flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-500" />
                <span>{validationWarning}</span>
              </div>
            )}

            {/* Utility Control Toolbar (MIN 40PX TOUCH TARGETS) */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                id="html-load-sample-btn"
                onClick={handleLoadSample}
                className="px-4 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[42px] flex items-center justify-center gap-1.5 flex-1"
              >
                <FileCode className="w-4 h-4" />
                Load Sample HTML
              </button>
              
              <button
                type="button"
                id="html-swap-btn"
                onClick={handleSwap}
                disabled={!input}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[42px] flex items-center justify-center gap-1.5 flex-1 ${
                  input
                    ? "bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700"
                    : "bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100"
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Swap Input/Output
              </button>

              <button
                type="button"
                id="html-clear-btn"
                onClick={handleClear}
                className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[42px] flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL (Sticky Preview & Live Outputs) ══════════════════ */}
        <div>
          <div className="sticky top-4 space-y-4">
            {/* Output Display Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm font-semibold text-white">Local Processed Result</span>
                </div>
                <div className="text-[10px] bg-white/10 text-white font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Secure Offline
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Result Textarea (LOCKED HEIGHT, MATCHING INPUT) */}
                <div className="space-y-1">
                  <textarea
                    id="html-output-textarea"
                    readOnly
                    value={hasError ? "" : output}
                    placeholder={
                      hasError
                        ? "Waiting for valid character input sequences..."
                        : mode === "encode"
                        ? "Encoded entity output will appear here..."
                        : "Decoded plain-text output will appear here..."
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 font-mono h-[320px] resize-none focus:outline-none cursor-text"
                  />
                </div>

                {/* Instant Copy Integration */}
                <button
                  type="button"
                  id="html-copy-btn"
                  onClick={handleCopy}
                  disabled={!output || hasError}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                    output && !hasError
                      ? copied
                        ? "bg-green-500 text-white shadow-md shadow-green-100"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 hover:shadow-lg hover:-translate-y-0.5"
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
                      Copy Translated Output
                    </>
                  )}
                </button>

                {/* Payload Performance Metrics Grid */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Payload Performance Metrics
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-slate-500 mb-0.5">Input / Output Lines</span>
                      <span className="block font-mono font-semibold text-slate-800">
                        {inputLineCount} / {outputLineCount} lines
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-slate-500 mb-0.5">Size Difference</span>
                      <span className="block font-mono font-semibold text-slate-800">
                        {input ? (byteDifference >= 0 ? `+${byteDifference}` : byteDifference) : 0} bytes
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-slate-500 mb-0.5">Change Ratio</span>
                      <span className="block font-mono font-semibold text-slate-800">
                        {input ? `${changeRatio >= 0 ? "+" : ""}${changeRatio.toFixed(1)}%` : "0.0%"}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-slate-500 mb-0.5">Expansion Factor</span>
                      <span className="block font-mono font-semibold text-indigo-600">
                        {input ? `${expansionFactor.toFixed(2)}x` : "1.00x"}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Bit sizes are calculated using standard UTF-8 byte encoding arrays.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Below-the-Fold Skyscraper Content Cards ── */}
      <section className="space-y-8 pt-8">
        {/* CARD 1: MASTER DEFINITION & ARCHITECTURE */}
        <div className="bg-gradient-to-br from-slate-50/50 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Definitive Guide to HTML Entity Encoding and Decoding</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              HTML character entity references are predefined symbolic sequences that map directly to specific Unicode code points. In the core architecture of the World Wide Web, the HyperText Markup Language (HTML) reserves a distinct subset of characters to define document layout structures, parse tags, and execute DOM elements. Characters like the less-than sign (&lt;), greater-than sign (&gt;), ampersand (&amp;), double quote (&quot;), and single quote (&apos;) possess native syntactic meaning. When a browser encounters these raw characters within an HTML text node, its built-in lexical parser automatically interprets them as the initiation or termination of tags or attributes rather than literal text strings.
            </p>
            <p>
              HTML Entity Encoding is the deterministic process of scanning a string payload and substituting these reserved elements with their matching character entity references or numeric character references (NCRs). Conversely, HTML Entity Decoding is the reverse operation, parsing incoming entity streams and restoring them to raw, literal characters for textual output. This system ensures cross-platform consistency across varying operating systems, database storage engines, and network transmission paths.
            </p>
          </div>
        </div>

        {/* CARD 2: DETAILED SYSTEMATIC MATRIX TABLE */}
        <div className="bg-gradient-to-br from-slate-50/50 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Comprehensive Unicode Character Mapping Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            The table below maps the primary reserved characters, symbols, and high-order glyphs to their respective HTML5 named, decimal, and hexadecimal character configurations.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  {["Raw Glyph", "Character Name", "Unicode Point", "Named Entity", "Decimal Ref (NCR)", "Hexadecimal Ref"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["<", "Less Than", "U+003C", "&lt;", "&#60;", "&#x3C;"],
                  [">", "Greater Than", "U+003E", "&gt;", "&#62;", "&#x3E;"],
                  ["&", "Ampersand", "U+0026", "&amp;", "&#38;", "&#x26;"],
                  ["\"", "Double Quotation", "U+0022", "&quot;", "&#34;", "&#x22;"],
                  ["'", "Apostrophe / Single Quote", "U+0027", "&apos;", "&#39;", "&#x27;"],
                  ["¢", "Cent Sign", "U+00A2", "&cent;", "&#162;", "&#xA2;"],
                  ["©", "Copyright Symbol", "U+00A9", "&copy;", "&#169;", "&#xA9;"]
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 text-sm ${
                          j === 0
                            ? "font-mono font-bold text-indigo-700"
                            : j === 1
                              ? "font-semibold text-slate-700"
                              : j === 3
                                ? "font-mono text-emerald-600 font-medium"
                                : "font-mono text-slate-600"
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

        {/* CARD 3: THE TECHNICAL ALGORITHM STEP-BY-STEP */}
        <div className="bg-gradient-to-br from-slate-50/50 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Breakdown of the Conversion Engine Workflow</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            To process data safely without data structural loss or multi-byte corruption, this application executes an independent, memory-bounded lexical execution loop:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="font-semibold text-slate-800 text-sm md:text-base">Lexical Tokenization</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">The string stream is iterated point-by-point using JavaScript native standard iterators. This method safely identifies compound surrogate pairs, avoiding high-order symbol fracturing.</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                <h3 className="font-semibold text-slate-800 text-sm md:text-base">Constraint Filtering</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">Depending on the active selection ('Special Characters Only' vs 'All Characters'), the engine evaluates if the character requires replacement or passes through untouched.</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                <h3 className="font-semibold text-slate-800 text-sm md:text-base">Entity Reference Matching</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">If the character is targeted for transformation, the system checks the HTML5 dictionary to see if a valid named string exists. If selected, it maps the matching configuration.</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">4</div>
                <h3 className="font-semibold text-slate-800 text-sm md:text-base">Numeric Mapping Fallback</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">If no named entity matches, or if numeric references are forced by configuration, the system parses the character code point directly into its explicit decimal or hexadecimal notation.</p>
            </div>
          </div>
        </div>

        {/* CARD 4: CRITICAL SECURITY & COMPLIANCE VALUE */}
        <div className="bg-gradient-to-br from-slate-50/50 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Preventing Cross-Site Scripting (XSS) Vulnerabilities</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              HTML Entity Encoding serves as a vital defensive pillar against Reflected and Stored Cross-Site Scripting (XSS) attacks. When modern web applications inject user-provided query strings, input vectors, or form entries directly into the Document Object Model (DOM) layout without sanitation, attackers can supply malicious code payloads like `<script>maliciousCode()</script>` or inline attribute event vectors such as `onload` or `onerror`.
            </p>
            <p>
              By passing untrusted input streams through an entity encoding protocol, raw syntactic wrappers are converted into harmless string expressions. The web rendering system displays the exact string literals intended without executing code within the user's active context. Adhering to OWASP Core Security standards, this defensive conversion ensures that untrusted variable data remains isolated inside pure text contexts, protecting user session storage assets and authentication tokens.
            </p>
          </div>
        </div>

        {/* CARD 5: REAL-WORLD CODE COMPARISON IMPLEMENTATIONS */}
        <div className="bg-gradient-to-br from-slate-50/50 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Structural Examples: Raw HTML vs. Encoded Output</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            Review how structural components transform when processed by our high-performance client-side translation layers.
          </p>
          <div className="my-6 space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">Raw Dynamic Code Snippet Input</span>
              <pre className="p-4 bg-slate-900 text-indigo-400 rounded-xl font-mono text-xs overflow-x-auto">
{`<div>
  <a href="/login?user=admin&session=true">Click Here & "Proceed"</a>
</div>`}
              </pre>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">Encoded HTML Entity Safe Output</span>
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto">
{`&lt;div&gt;
  &lt;a href=&quot;/login?user=admin&amp;session=true&quot;&gt;Click Here &amp; &quot;Proceed&quot;&lt;/a&gt;
&lt;/div&gt;`}
              </pre>
            </div>
          </div>
        </div>

        {/* CARD 6: DEEP-DIVE ENHANCED FAQ ACCORDION */}
        <div className="bg-gradient-to-br from-slate-50/50 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "What is the operational difference between HTML encoding and URL encoding?",
                a: "HTML encoding translates symbols inside dynamic web documents to prevent the browser engine from parsing text chunks as active element structures. URL encoding targets parameter strings inside web link paths, parsing components like query strings into percent-encoded fragments (e.g., matching %20 styles) to maintain compliance with URI infrastructure standards.",
              },
              {
                q: "Are numeric decimal character references faster to resolve than named entries?",
                a: "Modern parsing engines handle both formats efficiently. Named references offer high code readability for human operators, whereas numeric character references (NCRs) tie directly to precise Unicode indexes, providing predictable fallbacks when legacy systems lack full name definition lookups.",
              },
              {
                q: "How does this component maintain full data confidentiality?",
                a: "All calculations run strictly inside your browser instance using local variables. No text inputs, strings, or dropped files cross network layers or log to external systems, ensuring full offline security and data isolation.",
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
                <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">{a}</p>
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
              name: "HTML Entity Encoder / Decoder",
              description:
                "Free online HTML Entity Encoder and Decoder tool. Encode reserved characters into named entities, decimal refs, or hex refs, and decode them back safely. Offline processing with drag-and-drop file upload.",
              url: "https://www.twistertools.com/tools/developer-tools/html-entity-encoder-decoder",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "HTML Named entity conversion in real-time",
                "HTML Numeric decimal reference encoding",
                "HTML Hexadecimal reference encoding",
                "Special characters strictly safe parsing (< > & \" ')",
                "Full high-order unicode and symbol encoding mode",
                "Drag-and-drop file ingestion support up to 5 MB",
                "Client-side zero server transmission security framework",
                "Copy to clipboard with secure verification feedback",
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
