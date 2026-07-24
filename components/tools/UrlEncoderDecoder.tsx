"use client";

import { useState, useRef } from "react";
import {
  Globe,
  Info,
  Cpu,
  Layers,
  Table,
  HelpCircle,
  Copy,
  Check,
  Shield,
  AlertCircle,
  RefreshCw,
  Trash2,
  FileText,
  Upload,
  GitCompare,
} from "lucide-react";

export default function UrlEncoderDecoder() {
  // ── State Management ──
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [variant, setVariant] = useState<"component" | "uri">("component");
  const [spaceAsPlus, setSpaceAsPlus] = useState(false);
  const [copied, setCopied] = useState(false);

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sample Texts ──
  const SAMPLE_TEXT_ENCODE = "https://www.example.com/search?q=web development & design?category=developer_tools#main-section";
  const SAMPLE_TEXT_DECODE = "https%3A%2F%2Fwww.example.com%2Fsearch%3Fq%3Dweb%20development%20%26%20design%3Fcategory%3Ddeveloper_tools%23main-section";

  // ── File Processing ──
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const processFile = (file: File) => {
    setFileError("");
    setFileInfo(null);

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File exceeds the 5 MB size limit (${formatFileSize(file.size)}).`);
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
      setFileError("Error reading file.");
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

  // ── Processing Logic ──
  let output = "";
  let hasError = false;
  let errorMessage = "";

  try {
    if (input) {
      if (mode === "encode") {
        let processedInput = input;
        let encoded = variant === "component" ? encodeURIComponent(processedInput) : encodeURI(processedInput);
        if (spaceAsPlus) {
          encoded = encoded.replace(/%20/g, "+");
        }
        output = encoded;
      } else {
        let processedInput = input;
        if (spaceAsPlus) {
          processedInput = processedInput.replace(/\+/g, "%20");
        }
        output = variant === "component" ? decodeURIComponent(processedInput) : decodeURI(processedInput);
      }
    }
  } catch (e: any) {
    hasError = true;
    errorMessage = e?.message || "Malformed URI sequence";
  }

  // ── Size Calculations ──
  const originalCharCount = input.length;
  const processedCharCount = output.length;
  const charDifference = processedCharCount - originalCharCount;
  const percentageChange = originalCharCount > 0 ? (charDifference / originalCharCount) * 100 : 0;
  const expansionRatio = originalCharCount > 0 ? processedCharCount / originalCharCount : 1;

  // ── Action Handlers ──
  const handleLoadSample = () => {
    setInput(mode === "encode" ? SAMPLE_TEXT_ENCODE : SAMPLE_TEXT_DECODE);
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
                id="url-tab-encode"
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
                id="url-tab-decode"
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
                  htmlFor="url-input-textarea"
                  className="block text-sm font-semibold text-slate-700"
                >
                  {mode === "encode" ? "Raw Text / URL to Encode" : "Encoded URL string to Decode"}
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  {originalCharCount} character{originalCharCount !== 1 ? "s" : ""}
                </span>
              </div>
              <textarea
                id="url-input-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "encode"
                    ? "Type, paste, or load sample text to URL-encode..."
                    : "Paste percent-encoded string to decode..."
                }
                rows={12}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-y transition-all"
              />
            </div>

            {/* File Upload Dropzone (UNDER THE TEXTAREA) */}
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
                    : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-500 hover:bg-indigo-50/10"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json,.csv,.log,.xml,.html,.js,.css"
                  className="hidden"
                  onChange={handleFileSelect}
                  id="url-file-input"
                />
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-700">
                      {isDragging ? "Drop text file here" : "Drag & drop text file or click to browse"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Supports .txt, .json, .csv, .log (up to 5 MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inline file metadata badge */}
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

            {/* Encoding Variants Accordion/Row */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Encoding Variant</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 min-h-[48px] ${
                      variant === "component"
                        ? "border-indigo-600 bg-indigo-50/20"
                        : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="variant-toggle"
                      checked={variant === "component"}
                      onChange={() => setVariant("component")}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-slate-300"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-slate-800">
                        encodeURIComponent
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        Encodes absolutely all special characters including path marks, protocol boundaries, and query delimiters.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 min-h-[48px] ${
                      variant === "uri"
                        ? "border-indigo-600 bg-indigo-50/20"
                        : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="variant-toggle"
                      checked={variant === "uri"}
                      onChange={() => setVariant("uri")}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-slate-300"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-slate-800">
                        encodeURI
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        Preserves primary URL structures intact, including protocol components (http://), domain separators, and slashes.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Advanced Toggles */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="space-plus-toggle"
                  checked={spaceAsPlus}
                  onChange={(e) => setSpaceAsPlus(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
                <label
                  htmlFor="space-plus-toggle"
                  className="text-xs font-medium text-slate-700 cursor-pointer select-none"
                >
                  Handle space characters as &quot;+&quot; (application/x-www-form-urlencoded format)
                </label>
              </div>
            </div>

            {/* Local Utility Control Bar */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                id="url-process-btn"
                disabled={!input}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex-1 min-h-[40px] flex items-center justify-center ${
                  input
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Process Output
              </button>
              <button
                type="button"
                id="url-load-sample-btn"
                onClick={handleLoadSample}
                className="px-4 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-sm font-medium transition-all duration-200 min-h-[40px] flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Sample Text Load
              </button>
              <button
                type="button"
                id="url-clear-btn"
                onClick={handleClear}
                className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-xl text-sm font-medium transition-all duration-200 min-h-[40px] flex items-center justify-center gap-1.5"
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
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm font-semibold text-white">Processed Output Result</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Result Textarea */}
                <div className="space-y-1">
                  <textarea
                    id="url-output-textarea"
                    readOnly
                    value={hasError ? "" : output}
                    placeholder={
                      hasError
                        ? "Waiting for valid character sequence input..."
                        : mode === "encode"
                        ? "Encoded URL output will appear here..."
                        : "Decoded URL output will appear here..."
                    }
                    rows={10}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 font-mono focus:outline-none resize-none cursor-text"
                  />
                </div>

                {/* Copy Button */}
                <button
                  type="button"
                  id="url-copy-btn"
                  onClick={handleCopy}
                  disabled={!output || hasError}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[40px] ${
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
                      Copy Output
                    </>
                  )}
                </button>

                {/* Quick-Shift Matrix Grid */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Payload Performance Metrics
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-slate-500 mb-0.5">Size Difference</span>
                      <span className="block font-mono font-semibold text-slate-800">
                        {input ? (charDifference >= 0 ? `+${charDifference}` : charDifference) : 0} chars
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-slate-500 mb-0.5">Change Ratio</span>
                      <span className="block font-mono font-semibold text-slate-800">
                        {input ? `${percentageChange >= 0 ? "+" : ""}${percentageChange.toFixed(1)}%` : "0.0%"}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100 col-span-2">
                      <span className="block text-slate-500 mb-0.5">Payload Expansion Factor</span>
                      <span className="block font-mono font-semibold text-indigo-600">
                        {input ? `${expansionRatio.toFixed(2)}x` : "1.00x"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operational Guardrail Warning */}
                {hasError && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-red-800">Invalid URI Character Sequence</p>
                      <p className="text-xs text-red-600 leading-snug">
                        {errorMessage}. Check if the percent-encoded sequences are formatted correctly (e.g., %20, %2F) and do not contain dangling percent symbols.
                      </p>
                    </div>
                  </div>
                )}

                {/* Security Assurance Badge */}
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-snug">
                    <strong className="text-slate-800">100% Secure.</strong> URL conversions run completely locally within your browser sandboxed workspace.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO CARD SYSTEM (MD5 MIRROR STANDARD)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">

        {/* Card 1: What is URL Encoding and Decoding? */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-indigo-600" />
            </div>
            <span>What is URL Encoding and Decoding?</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            URL encoding, formally designated as percent-encoding, is a standardized mechanism used to translate arbitrary text data into a format that can be safely transmitted over the Internet within a Uniform Resource Identifier (URI). The Internet Engineering Task Force (IETF) defines strict operational blueprints for URL parsing under RFC 3986. Within this framework, characters are split into reserved and unreserved categories. Reserved characters are those that possess functional, structural significance within a web address—such as the colon separating a protocol from the host, or the ampersand delineating distinct query arguments. When raw user strings contain these characters outside their intended structural role, they must be transformed into highly reliable, safe character triplets. These triplets always consist of a percent symbol (%) followed by a two-digit hexadecimal sequence reflecting the character&apos;s exact ASCII or multi-byte UTF-8 value.
          </p>
        </div>

        {/* Card 2: The Core Mechanics of Percent-Encoding Step-by-Step (MD5 BADGE STEP DESIGN) */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Core Mechanics of Percent-Encoding Step-by-Step</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: "1",
                title: "Structural Identification",
                body: "The encoder reviews the individual character string input to verify whether it resides inside the unreserved set (alphanumeric strings, hyphens, periods, underscores, and tildes).",
              },
              {
                step: "2",
                title: "Byte Fragmentation",
                body: "If the character belongs to the reserved set or exists outside the legacy 7-bit ASCII range (such as localized international symbols or emojis), the engine reads its underlying byte layout under UTF-8 specifications.",
              },
              {
                step: "3",
                title: "Hexadecimal Extraction",
                body: "The machine isolates the numeric byte coordinates and calculates their base-16 hexadecimal text representation.",
              },
              {
                step: "4",
                title: "Percent Prefixing",
                body: "A physical percent symbol character (%) is bound directly to the front of the two-digit hex value, yielding a web-compatible, sanitized payload element (for example, standard spacing scales to '%20', while a literal question mark converts to '%3F').",
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

        {/* Card 3: Interactive URI Character Character Specification Matrix (MD5 DARK TABLE STYLE) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Interactive URI Character Character Specification Matrix</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  {[
                    "Character Group",
                    "Literal Symbol",
                    "Standard URL Percent-Encoding",
                    "Alternative Form Encoding",
                    "Structural Context / Functional Role"
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Space", "(blank)", "%20", "+", "Delineates text breaks; converts to '+' in application/x-www-form-urlencoded payloads."],
                  ["Ampersand", "&", "%26", "%26", "Appended to query components to separate discrete key-value parameter pairs."],
                  ["Equals Sign", "=", "%3D", "%3D", "Binds a specific query parameter name to its corresponding value array."],
                  ["Question Mark", "?", "%3F", "%3F", "Injected immediately after a path string to initiate the query string sequence."],
                  ["Forward Slash", "/", "%2F", "%2F", "Establishes hierarchical folder and file directories within web path routing."],
                  ["Colon", ":", "%3A", "%3A", "Separates the networking protocol (e.g., https) from the target hostname or port number."],
                  ["Number Sign", "#", "%23", "%23", "Denotes a fragment identifier linking directly to a specific anchor ID on a page."],
                  ["Percent Sign", "%", "%25", "%25", "Acts as the universal escape trigger character; must be encoded to avoid parsing failures."],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 text-sm ${
                          j === 0
                            ? "font-semibold text-slate-700"
                            : j === 2
                            ? "text-indigo-700 font-semibold font-mono"
                            : j === 1 || j === 3
                            ? "text-slate-600 font-mono"
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

        {/* Card 4: Technical Differences: encodeURI vs. encodeURIComponent (MD5 DARK TABLE COMPARISON STYLE) */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <GitCompare className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Differences: encodeURI vs. encodeURIComponent</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  {["Property / Comparison", "encodeURI Directive", "encodeURIComponent Directive"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Goal & Target Scope",
                    "Programmed to format a complete, functional URL. It deliberately leaves all operational structural characters untouched.",
                    "Tailored to prepare data payloads for insertion inside query parameters. It targets every character outside the strict unreserved set."
                  ],
                  [
                    "Preserved Characters",
                    "Preserves protocols, domain outlines, query separators, and hashes (ignores http://, colons, slashes, ?, #).",
                    "Only leaves unreserved alphanumeric characters, hyphens, periods, underscores, and tildes unescaped."
                  ],
                  [
                    "Escaping Behavior",
                    "Only escapes characters that cannot safely exist in any part of a URL (e.g. spaces, multi-byte Unicode strings).",
                    "Converts structural markers like slashes (/), colons (:), question marks (?), and ampersands (&) into escaped triplets."
                  ],
                  [
                    "Typical Implementation",
                    "Used to clean up a full URL input string that may contain spaces or copy-paste Unicode characters before networking.",
                    "Used to sanitize parameter values, files, or tokens before they are appended to the query parameter section of an address."
                  ]
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 text-sm ${
                          j === 0
                            ? "font-semibold text-slate-700 w-[25%]"
                            : j === 1
                            ? "text-indigo-700 font-medium"
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

        {/* Card 5: Professional Use Cases for Technical Professionals (MD5 ROUND DOT BULLET GRID DESIGN) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Professional Use Cases for Technical Professionals</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "REST API Query Pipeline Architecture",
                body: "Web platforms continuously transmit user parameters, email text filters, and complex search strings through URL addresses. Universal percent-encoding ensures that variables containing text layout spacing or structural punctuation do not prematurely truncate the API string or lead to microservice parser crashes."
              },
              {
                title: "Deep-Linked Analytics Tracking",
                body: "Tracking pixels, dynamic UTM structures, and automated web scrapers bundle full source URLs within primary request arguments. Encoding the target destination route guarantees that tracking boundaries remain separated from the parent URL framework."
              },
              {
                title: "Secure HTML Form Submission",
                body: "Legacy web forms leveraging standard POST/GET actions utilizing form encoding rely heavily on percent-escaped configurations to bundle key-value data matrices across active HTTP request headers."
              },
              {
                title: "Cross-Domain OAuth Callback Handling",
                body: "Security infrastructure passing long-form authentication codes, state parameters, and return application paths safely within unified query lines uses percent-encoding to shield internal validation configurations from parser errors."
              }
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

        {/* Card 6: Frequently Asked Questions (MD5 GRADIENT LEFT-BORDER ACCENT ACCORDION STYLE) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Why do space characters sometimes encode as %20 and other times as a plus symbol (+)?",
                a: "The %20 triplet is the official designation under RFC 3986 for standard URI query segments. The plus symbol (+) is a legacy variant explicitly reserved for application/x-www-form-urlencoded payloads, widely leveraged during HTML form submissions. Our interface provides structural toggles to adapt to either encoding environment seamlessly."
              },
              {
                q: "Does URL encoding provide data security, obfuscation, or encryption?",
                a: "No. URL encoding is an open structural text representation protocol, not a security layer or cryptographic mechanism. The transformation is entirely reversible by any computer terminal or web browser globally. Its sole purpose is data transmission compatibility across standard internet networking stacks."
              },
              {
                q: "How does this encoder manage complex international scripts and emojis?",
                a: "Modern percent-encoding processes characters by splitting multi-byte Unicode strings (including non-Latin character sets, accents, and emojis) into independent raw UTF-8 byte lists. Each byte is then systematically escaped with an individual percent symbol prefix, resulting in a safe sequence like %F0%9F%9A%80 for a rocket emoji."
              },
              {
                q: "Does any input text processed by this tool pass through external servers?",
                a: "Absolutely not. All programmatic functions, string alterations, and regex updates operate completely client-side in the browser execution scope. No information is transmitted across external API pipelines, maintaining absolute data privacy."
              }
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-3.5">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Our Tool (MD5 ACCENT CTA DESIGN BLOCK) */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Why Use TwisterTools URL Encoder / Decoder?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Shield,
                title: "Zero Data Exposure",
                body: "100% client-side computation. Your queries, paths, and local files never leave your browser tab.",
              },
              {
                icon: RefreshCw,
                title: "Real-Time Processing",
                body: "Dynamic conversions update the output character streams on every keystroke — zero network delays.",
              },
              {
                icon: GitCompare,
                title: "Flexible Variant Settings",
                body: "Quickly toggle between standard encodeURIComponent parsing or URI structural preservation.",
              },
              {
                icon: FileText,
                title: "File Upload Support",
                body: "Drag and drop any local text file (up to 5 MB) directly to parse it without copying.",
              },
              {
                icon: Table,
                title: "Standard Space Handling",
                body: "Toggle spaces to '+' (for application/x-www-form-urlencoded standard) or standard '%20' instantly.",
              },
              {
                icon: Info,
                title: "Crash Protection Guardrails",
                body: "Caught URIError handles malformed sequences gracefully, protecting layout stability.",
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
              name: "URL Encoder / Decoder Tool",
              description:
                "Free online URL Encoder / Decoder tool with real-time encoding, standard variant selection, custom space character converters, and local file text ingestion. 100% secure client-side execution.",
              url: "https://www.twistertools.com/tools/developer-tools/url-encoder-decoder",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript. Works fully locally in the browser tab.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Real-time URL encoding and decoding as you type",
                "Support for encodeURIComponent and encodeURI variants",
                "Advanced checkbox to handle spaces as '+' or '%20'",
                "Local text file uploader supporting up to 5 MB size limit",
                "Interactive URI character specification mapping matrix documentation",
                "Graceful malformed sequence validation warning alert banner",
                "1-click copy with green checkmark success verification",
                "Privacy guaranteed with completely client-side parsing",
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
