"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Copy,
  Check,
  Shield,
  FileText,
  AlignLeft,
  HardDrive,
  Upload,
  AlertCircle,
  Loader2,
  Lock,
  Zap,
  HelpCircle,
  Cpu,
  CheckCircle2,
  ShieldAlert,
  MessageSquare,
  Binary,
  Download,
  Table,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Base64 Pure Client-side UTF-8 & URL-Safe Encoding/Decoding
// ─────────────────────────────────────────────────────────────

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

// Encode Uint8Array to standard Base64 string
function bytesToBase64(bytes: Uint8Array): string {
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
    const enc3 = i + 1 < len ? (((b2 & 15) << 2) | (b3 >> 6)) : 64;
    const enc4 = i + 2 < len ? (b3 & 63) : 64;

    result += BASE64_CHARS.charAt(enc1) +
      BASE64_CHARS.charAt(enc2) +
      (enc3 === 64 ? "=" : BASE64_CHARS.charAt(enc3)) +
      (enc4 === 64 ? "=" : BASE64_CHARS.charAt(enc4));
  }
  return result;
}

// Decode standard/URL-safe Base64 string to Uint8Array
function base64ToBytes(str: string): Uint8Array {
  const trimmed = str.trim();

  // Strict check for invalid characters: anything other than A-Z, a-z, 0-9, +, /, -, _, and =
  if (/[^A-Za-z0-9+/_\-=]/.test(trimmed)) {
    throw new Error("Invalid characters in Base64 string");
  }

  // Normalize URL-safe Base64 to standard
  let normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");

  // Add back padding if missing (URL-safe sometimes strips padding)
  const pad = normalized.length % 4;
  if (pad) {
    normalized += "=".repeat(4 - pad);
  }

  // Ensure the length is a multiple of 4
  if (normalized.length % 4 !== 0) {
    throw new Error("Invalid Base64 length");
  }

  // Decode
  const len = normalized.length;
  let paddingCount = 0;
  if (normalized.endsWith("==")) paddingCount = 2;
  else if (normalized.endsWith("=")) paddingCount = 1;

  const bufferLength = Math.floor(len * 0.75) - paddingCount;
  const bytes = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const char1 = normalized.charCodeAt(i);
    const char2 = normalized.charCodeAt(i + 1);
    const char3 = normalized.charCodeAt(i + 2);
    const char4 = normalized.charCodeAt(i + 3);

    if (char1 === 61 || char2 === 61) {
      throw new Error("Invalid padding placement");
    }

    const c1 = BASE64_LOOKUP[char1];
    const c2 = BASE64_LOOKUP[char2];
    const c3 = char3 === 61 ? 0 : BASE64_LOOKUP[char3];
    const c4 = char4 === 61 ? 0 : BASE64_LOOKUP[char4];

    bytes[p++] = (c1 << 2) | (c2 >> 4);
    if (char3 !== 61 && p < bufferLength) {
      bytes[p++] = ((c2 & 15) << 4) | (c3 >> 2);
    }
    if (char4 !== 61 && p < bufferLength) {
      bytes[p++] = ((c3 & 3) << 6) | c4;
    }
  }

  return bytes;
}

// UTF-8 Safe Text to Base64 (Standard)
function utf8ToBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    return bytesToBase64(bytes);
  } catch (e) {
    console.error("UTF-8 to Base64 conversion failed", e);
    return "";
  }
}

// UTF-8 Safe Base64 to Text (Standard or URL-Safe)
function base64ToUtf8(str: string): string {
  const bytes = base64ToBytes(str);
  return new TextDecoder().decode(bytes);
}

// Convert ArrayBuffer to Base64 in Chunks
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return bytesToBase64(bytes);
}

// Base64 to ArrayBuffer for file reconstitution
function base64ToArrayBuffer(str: string): ArrayBuffer {
  const bytes = base64ToBytes(str);
  return bytes.buffer as ArrayBuffer;
}

// Convert Standard Base64 to URL-Safe Base64
function toUrlSafe(base64: string): string {
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
type ConverterMode = "encode" | "decode";
type InputType = "text" | "file";

interface FileState {
  name: string;
  size: number;
  type: string;
  data: string; // Base64 encoded for Encode, or raw Text for Decode
  decodedBuffer?: ArrayBuffer; // For binary restoration in decode mode
}

export default function Base64Converter() {
  // Modes & State
  const [activeMode, setActiveMode] = useState<ConverterMode>("encode");
  const [inputType, setInputType] = useState<InputType>("text");

  // Text state
  const [textInput, setTextInput] = useState("");

  // File state
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [fileError, setFileError] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Controls
  const [urlSafe, setUrlSafe] = useState(false);
  const [includeMimePrefix, setIncludeMimePrefix] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper to format file sizes
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Reset inputs when changing mode or input type
  useEffect(() => {
    setTextInput("");
    setFileState(null);
    setFileError("");
    setIncludeMimePrefix(false);
  }, [activeMode, inputType]);

  // Compute final inputs/outputs for the dashboard preview panel
  const { inputLength, output, overhead, outputSize, decodedBuffer, decodeError } = useMemo(() => {
    // ──────── ENCODE MODE ────────
    if (activeMode === "encode") {
      if (inputType === "text") {
        if (!textInput) return { inputLength: 0, output: "", overhead: 0, outputSize: 0, decodeError: false };
        const rawOutput = utf8ToBase64(textInput);
        const finalOutput = urlSafe ? toUrlSafe(rawOutput) : rawOutput;

        // Input bytes vs Output bytes
        const inputBytes = new TextEncoder().encode(textInput).length;
        const outputBytes = new TextEncoder().encode(finalOutput).length;
        const overhead = inputBytes > 0 ? ((outputBytes - inputBytes) / inputBytes) * 100 : 0;

        return {
          inputLength: inputBytes,
          output: finalOutput,
          overhead,
          outputSize: outputBytes,
          decodeError: false,
        };
      } else {
        // Encode File Mode
        if (!fileState) return { inputLength: 0, output: "", overhead: 0, outputSize: 0, decodeError: false };

        let rawOutput = fileState.data;
        if (includeMimePrefix && fileState.type) {
          rawOutput = `data:${fileState.type};base64,${rawOutput}`;
        }

        const finalOutput = urlSafe ? toUrlSafe(rawOutput) : rawOutput;
        const inputBytes = fileState.size;
        const outputBytes = new TextEncoder().encode(finalOutput).length;
        const overhead = inputBytes > 0 ? ((outputBytes - inputBytes) / inputBytes) * 100 : 0;

        return {
          inputLength: inputBytes,
          output: finalOutput,
          overhead,
          outputSize: outputBytes,
          decodeError: false,
        };
      }
    }

    // ──────── DECODE MODE ────────
    if (activeMode === "decode") {
      if (inputType === "text") {
        if (!textInput) return { inputLength: 0, output: "", overhead: 0, outputSize: 0, decodeError: false };
        try {
          const finalOutput = base64ToUtf8(textInput);
          const inputBytes = new TextEncoder().encode(textInput).length;
          const outputBytes = new TextEncoder().encode(finalOutput).length;
          const reduction = inputBytes > 0 ? ((inputBytes - outputBytes) / inputBytes) * 100 : 0;

          return {
            inputLength: inputBytes,
            output: finalOutput,
            overhead: -reduction, // Negative overhead indicates size reduction
            outputSize: outputBytes,
            decodeError: false,
          };
        } catch {
          return { inputLength: 0, output: "", overhead: 0, outputSize: 0, decodeError: true };
        }
      } else {
        // Decode File Mode
        if (!fileState) return { inputLength: 0, output: "", overhead: 0, outputSize: 0, decodeError: false };
        try {
          let cleanedData = fileState.data.trim();
          if (cleanedData.startsWith("data:")) {
            const commaIndex = cleanedData.indexOf(",");
            if (commaIndex !== -1) {
              cleanedData = cleanedData.slice(commaIndex + 1);
            }
          }

          const decodedBuffer = base64ToArrayBuffer(cleanedData);
          const inputBytes = fileState.size;
          const outputBytes = decodedBuffer.byteLength;
          const reduction = inputBytes > 0 ? ((inputBytes - outputBytes) / inputBytes) * 100 : 0;

          let textPreview = "";
          try {
            textPreview = new TextDecoder("utf-8", { fatal: true }).decode(decodedBuffer);
          } catch {
            textPreview = "[Binary Data] Decoded file contains binary content. Use the download button below to save the file.";
          }

          return {
            inputLength: inputBytes,
            output: textPreview,
            overhead: -reduction,
            outputSize: outputBytes,
            decodedBuffer,
            decodeError: false,
          };
        } catch {
          return { inputLength: 0, output: "", overhead: 0, outputSize: 0, decodeError: true };
        }
      }
    }

    return { inputLength: 0, output: "", overhead: 0, outputSize: 0, decodeError: false };
  }, [activeMode, inputType, textInput, fileState, urlSafe, includeMimePrefix]);

  // ── File Handlers ──
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

  const processLocalFile = useCallback(
    (file: File) => {
      setFileError("");
      setFileState(null);

      if (file.size > MAX_FILE_SIZE) {
        setFileError(
          `File size exceeds the 10 MB safety limit (${(file.size / 1024 / 1024).toFixed(2)} MB). Please select a smaller file.`
        );
        return;
      }

      setFileLoading(true);
      const reader = new FileReader();

      if (activeMode === "encode") {
        // For Encode, we read files as ArrayBuffer to support all formats (image, pdf, binary, zip, etc.)
        reader.onload = (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer;
            const base64Str = arrayBufferToBase64(buffer);
            setFileState({
              name: file.name,
              size: file.size,
              type: file.type,
              data: base64Str,
            });
          } catch {
            setFileError("Error processing file encoding.");
          } finally {
            setFileLoading(false);
          }
        };
        reader.onerror = () => {
          setFileError("Failed to read file.");
          setFileLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        // For Decode, we read the uploaded file as Text because it's expected to hold a Base64 string
        reader.onload = (e) => {
          try {
            const textContent = (e.target?.result as string) || "";
            setFileState({
              name: file.name,
              size: file.size,
              type: file.type,
              data: textContent,
            });
          } catch {
            setFileError("Error reading Base64 contents.");
          } finally {
            setFileLoading(false);
          }
        };
        reader.onerror = () => {
          setFileError("Failed to read Base64 text file.");
          setFileLoading(false);
        };
        reader.readAsText(file);
      }
    },
    [activeMode]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.type === "dragover") {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processLocalFile(file);
    },
    [processLocalFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLocalFile(file);
  };

  // ── Clipboard Copy Helper ──
  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // ── Decoded File Downloader ──
  const downloadDecodedFile = () => {
    let bufferToUse: ArrayBuffer | null = null;
    let defaultFilename = "decoded_file.bin";

    if (inputType === "file" && decodedBuffer) {
      bufferToUse = decodedBuffer;
      // Strip original name extensions to create a reasonable default download filename
      const originalName = fileState?.name || "";
      const dotIdx = originalName.lastIndexOf(".");
      if (dotIdx !== -1) {
        defaultFilename = "decoded_" + originalName.slice(0, dotIdx);
      } else {
        defaultFilename = "decoded_" + originalName + ".bin";
      }
    } else if (inputType === "text" && textInput) {
      try {
        bufferToUse = base64ToArrayBuffer(textInput);
      } catch {
        // Invalid Base64
      }
    }

    if (!bufferToUse) return;

    const blob = new Blob([bufferToUse], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-8">
      {/* ── Two-Column Dashboard Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">

        {/* ══════════════════ LEFT PANEL ══════════════════ */}
        <div className="space-y-5">

          {/* Tabs and Toggles Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Main Mode Tabs */}
            <div
              className="flex gap-2 overflow-x-auto pb-1 sm:pb-0"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
              {(
                [
                  { id: "encode", label: "Encode", icon: Lock },
                  { id: "decode", label: "Decode", icon: Zap },
                ] as { id: ConverterMode; label: string; icon: React.ElementType }[]
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`b64-tab-${id}`}
                  onClick={() => setActiveMode(id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 border ${activeMode === id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                      : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  style={{ minHeight: "40px" }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Secondary Options Selector: Text vs Local File */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 w-fit sm:ml-auto">
              {(
                [
                  { id: "text", label: "Text String", icon: AlignLeft },
                  { id: "file", label: "Local File", icon: HardDrive },
                ] as { id: InputType; label: string; icon: React.ElementType }[]
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setInputType(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${inputType === id
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-800"
                    }`}
                  style={{ minHeight: "36px" }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Text Input Mode ── */}
          {inputType === "text" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6">
              <div>
                <label
                  htmlFor="b64-text-input"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  {activeMode === "encode" ? "Raw Input Text" : "Base64 Encoded Text"}
                </label>
                <textarea
                  id="b64-text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    activeMode === "encode"
                      ? "Enter the text string you want to encode to Base64 format..."
                      : "Paste a Base64 or URL-Safe Base64 string to decode it..."
                  }
                  rows={12}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-y transition-all font-mono"
                />
              </div>

              {/* Character and Byte Statistics Row */}
              {textInput && (
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      Character Count: <strong className="text-slate-700">{textInput.length}</strong>
                    </span>
                  </div>
                  <span>
                    Byte Weight: <strong className="text-slate-700">{new TextEncoder().encode(textInput).length} Bytes</strong>
                  </span>
                </div>
              )}

              {/* Decode Error Prompt */}
              {decodeError && (
                <div className="flex items-start gap-3 bg-red-50/50 border border-red-200 text-red-800 rounded-xl p-4 text-sm leading-relaxed shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-red-900 mb-1">Invalid Data Payload Pattern</strong>
                    The input string could not be parsed as valid Base64 encoded payload. Please check that it consists only of standard characters (A–Z, a–z, 0–9, +, /) or URL-safe characters (-, _), contains no spaces, and uses correct terminal padding.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── File Input Mode ── */}
          {inputType === "file" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  Local File {activeMode === "encode" ? "Encoder" : "Decoder"}
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  {activeMode === "encode"
                    ? "Upload any local file (image, document, binary) to convert it to a Base64 string instantly."
                    : "Upload a text file (.txt, .b64) containing a Base64-encoded string to restore its binary file source."}
                  {" "}File processing is completely private and sandboxed. Size limit:{" "}
                  <strong>10 MB</strong>.
                </p>

                {/* Drag and Drop Zone */}
                <div
                  id="b64-drop-zone"
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-12 px-6 ${isDragging
                      ? "border-indigo-500 bg-indigo-50"
                      : fileState && !fileError
                        ? "border-green-400 bg-green-50/50"
                        : fileError
                          ? "border-red-400 bg-red-50/50"
                          : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept={activeMode === "decode" ? ".txt,.b64,text/plain" : "*/*"}
                    id="b64-file-input"
                  />

                  {fileLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                      <p className="text-sm font-semibold text-indigo-600">Reading local payload...</p>
                      <p className="text-xs text-slate-500">Processing locally inside your browser tab</p>
                    </div>
                  ) : fileError ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                      <p className="text-sm font-semibold text-red-600">{fileError}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileError("");
                          setFileState(null);
                        }}
                        className="text-xs text-slate-500 underline hover:text-indigo-600"
                        style={{ minHeight: "40px" }}
                      >
                        Select a different file
                      </button>
                    </div>
                  ) : fileState ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                        <HardDrive className="w-7 h-7 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{fileState.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatFileSize(fileState.size)} {fileState.type ? `• ${fileState.type}` : ""}
                        </p>
                      </div>
                      <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        File parsed successfully
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileState(null);
                          setFileError("");
                        }}
                        className="text-xs text-slate-600 underline hover:text-indigo-600 transition-colors"
                        style={{ minHeight: "40px" }}
                      >
                        Use a different file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {isDragging ? "Drop your file here" : "Drag & drop a file here"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          or click to browse — up to 10 MB local file limits
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data URI format options (only applicable for File Encoding) */}
              {activeMode === "encode" && fileState && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="b64-mime-prefix"
                    checked={includeMimePrefix}
                    onChange={(e) => setIncludeMimePrefix(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="b64-mime-prefix"
                    className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
                  >
                    Include Data URI payload prefix (e.g. <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">data:{fileState.type || "mime"};base64,...</code>)
                  </label>
                </div>
              )}

              {/* Decode Error Prompt */}
              {decodeError && (
                <div className="flex items-start gap-3 bg-red-50/50 border border-red-200 text-red-800 rounded-xl p-4 text-sm leading-relaxed shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-red-900 mb-1">Invalid Data Payload Pattern</strong>
                    The uploaded text file does not contain a valid Base64 string sequence, or the binary header is corrupt. Please verify the source format.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════ RIGHT PANEL ══════════════════ */}
        <div className="sticky top-4 space-y-4">

          {/* Output Panel Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Output Card Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold text-white">
                  {activeMode === "encode" ? "Base64 Output" : "Decoded Text Output"}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Options Toolbar: URL Safe Switch */}
              {inputType === "text" && activeMode === "encode" && (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700">URL-Safe Base64</span>
                    <span className="text-[10px] text-slate-500">Use - and _ instead of + and /</span>
                  </div>
                  <button
                    id="b64-url-safe-toggle"
                    type="button"
                    onClick={() => setUrlSafe(!urlSafe)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${urlSafe ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                    style={{ minHeight: "24px" }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${urlSafe ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              )}

              {/* Read-Only Output Textarea */}
              <div className="rounded-xl bg-slate-900 border border-slate-700 p-4 min-h-[120px] flex flex-col justify-between">
                {output ? (
                  <textarea
                    id="b64-output-display"
                    readOnly
                    value={output}
                    rows={5}
                    className="w-full bg-transparent border-0 p-0 text-xs font-mono text-indigo-400 focus:outline-none focus:ring-0 resize-none leading-relaxed"
                  />
                ) : (
                  <p className="text-slate-500 text-xs italic">
                    {activeMode === "encode"
                      ? inputType === "text"
                        ? "Enter text on the left to see Base64 output..."
                        : "Upload a file to see its Base64 encoding..."
                      : inputType === "text"
                        ? "Enter Base64 data to view decoded output..."
                        : "Upload a text file containing Base64 data..."}
                  </p>
                )}
              </div>

              {/* Size conversion metrics */}
              {output && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Input Size:</span>
                    <span className="font-mono text-slate-700">{formatFileSize(inputLength)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Output Size:</span>
                    <span className="font-mono text-slate-700">{formatFileSize(outputSize)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500 font-medium">
                      {activeMode === "encode" ? "Encoding Overhead:" : "Size Reduction:"}
                    </span>
                    <span className={`font-mono font-bold ${activeMode === "encode" ? "text-amber-600" : "text-green-600"}`}>
                      {activeMode === "encode"
                        ? `+${overhead.toFixed(1)}%`
                        : `${Math.abs(overhead).toFixed(1)}%`
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="space-y-2">
                {/* Copy Button */}
                <button
                  id="b64-copy-button"
                  onClick={() => output && copyToClipboard(output)}
                  disabled={!output}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${output
                      ? copied
                        ? "bg-green-500 text-white shadow-md shadow-green-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  style={{ minHeight: "40px" }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied Securely!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Result
                    </>
                  )}
                </button>

                {/* File Download Button (For Decoded File or Encoded Text File) */}
                {output && (activeMode === "decode" || inputType === "file") && (
                  <button
                    id="b64-download-button"
                    onClick={
                      activeMode === "decode"
                        ? downloadDecodedFile
                        : () => {
                          const blob = new Blob([output], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `base64_${fileState?.name || "text"}.txt`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }
                    }
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all duration-200"
                    style={{ minHeight: "40px" }}
                  >
                    <Download className="w-4 h-4" />
                    {activeMode === "decode" ? "Download Decoded File" : "Download Base64 Text File"}
                  </button>
                )}
              </div>

              {/* Security and Privacy Badge */}
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-normal">
                  <strong className="text-slate-800">100% Client-Side.</strong> All processes are executed entirely locally in your browser. Data is never transmitted to a server.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">

        {/* Card 1: HelpCircle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:p-8 shadow-sm p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>The Definitive Guide to Base64 Encoding &amp; Decoding</span>
          </h2>
          <div className="space-y-4">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Base64 is a fundamental binary-to-text encoding scheme used throughout modern internet infrastructure. It translates arbitrary binary data—whether executable files, raw byte streams, or complex text encodings—into a clean, readable string of 64 safe ASCII characters. This sequence consists of uppercase letters (A–Z), lowercase letters (a–z), numerals (0–9), and the symbols (+) and (/).
            </p>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              The primary utility of Base64 is transport integrity, not data security. Many legacy communication channels, such as email servers handling MIME protocols, were fundamentally designed to process 7-bit ASCII text. When raw binary files pass through these network nodes, certain control characters can be misinterpreted, stripped, or modified, corrupting the underlying payload. Transforming data into Base64 guarantees that the payload remains completely uncorrupted as it traverses text-only network layers.
            </p>
          </div>
        </div>

        {/* Card 2: Table */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Base64 Character Index Mapping Matrix</span>
          </h2>
          <div className="space-y-4">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Base64 divides data into units of 6 bits. Each 6-bit value (ranging from 0 to 63 in decimal) points directly to a fixed character in the standard index table. Below is the exact logical structural layout of how bits map to displayable characters:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    {["Binary", "Value", "Character", "Binary", "Value", "Character", "Binary", "Value", "Character"].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { b1: "000000", v1: "0", c1: "A", b2: "010110", v2: "22", c2: "W", b3: "101100", v3: "44", c3: "s" },
                    { b1: "000001", v1: "1", c1: "B", b2: "010111", v2: "23", c2: "X", b3: "101101", v3: "45", c3: "t" },
                    { b1: "000010", v1: "2", c1: "C", b2: "011000", v2: "24", c2: "Y", b3: "101110", v3: "46", c3: "u" },
                    { b1: "000011", v1: "3", c1: "D", b2: "011001", v2: "25", c2: "Z", b3: "101111", v3: "47", c3: "v" },
                    { b1: "000100", v1: "4", c1: "E", b2: "011010", v2: "26", c2: "a", b3: "110000", v3: "48", c3: "w" },
                    { b1: "000101", v1: "5", c1: "F", b2: "011011", v2: "27", c2: "b", b3: "110001", v3: "49", c3: "x" },
                    { b1: "000110", v1: "6", c1: "G", b2: "011100", v2: "28", c2: "c", b3: "110010", v3: "50", c3: "y" },
                    { b1: "000111", v1: "7", c1: "H", b2: "011101", v2: "29", c2: "d", b3: "110011", v3: "51", c3: "z" },
                    { b1: "001000", v1: "8", c1: "I", b2: "011110", v2: "30", c2: "e", b3: "110100", v3: "52", c3: "0" },
                    { b1: "001001", v1: "9", c1: "J", b2: "011111", v2: "31", c2: "f", b3: "110101", v3: "53", c3: "1" },
                    { b1: "001010", v1: "10", c1: "K", b2: "100000", v2: "32", c2: "g", b3: "110110", v3: "54", c3: "2" },
                    { b1: "001011", v1: "11", c1: "L", b2: "100001", v2: "33", c2: "h", b3: "110111", v3: "55", c3: "3" },
                    { b1: "001100", v1: "12", c1: "M", b2: "100010", v2: "34", c2: "i", b3: "111000", v3: "56", c3: "4" },
                    { b1: "001101", v1: "13", c1: "N", b2: "100011", v2: "35", c2: "j", b3: "111001", v3: "57", c3: "5" },
                    { b1: "001110", v1: "14", c1: "O", b2: "100100", v2: "36", c2: "k", b3: "111010", v3: "58", c3: "6" },
                    { b1: "001111", v1: "15", c1: "P", b2: "100101", v2: "37", c2: "l", b3: "111011", v3: "59", c3: "7" },
                    { b1: "010000", v1: "16", c1: "Q", b2: "100110", v2: "38", c2: "m", b3: "111100", v3: "60", c3: "8" },
                    { b1: "010001", v1: "17", c1: "R", b2: "100111", v2: "39", c2: "n", b3: "111101", v3: "61", c3: "9" },
                    { b1: "010010", v1: "18", c1: "S", b2: "101000", v2: "40", c2: "o", b3: "111110", v3: "62", c3: "+" },
                    { b1: "010011", v1: "19", c1: "T", b2: "101001", v2: "41", c2: "p", b3: "111111", v3: "63", c3: "/" },
                    { b1: "010100", v1: "20", c1: "U", b2: "101010", v2: "42", c2: "q", b3: "", v3: "", c3: "" },
                    { b1: "010101", v1: "21", c1: "V", b2: "101011", v2: "43", c2: "r", b3: "", v3: "", c3: "" },
                  ].map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700 font-mono">{row.b1}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600 font-mono">{row.v1}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-indigo-700 font-semibold font-mono">{row.c1}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700 font-mono">{row.b2}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600 font-mono">{row.v2}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-indigo-700 font-semibold font-mono">{row.c2}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700 font-mono">{row.b3}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600 font-mono">{row.v3}</td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-indigo-700 font-semibold font-mono">{row.c3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Card 3: Cpu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:p-8 shadow-sm p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Step-by-Step Mathematical Walkthrough of Padding Calculations</span>
          </h2>
          <div className="space-y-5">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              To understand why padding occurs, let's step through an explicit conversion process using the word "Go".
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  step: "1",
                  title: "Text Character Isolation",
                  body: "We take the letters 'G' and 'o'.",
                },
                {
                  step: "2",
                  title: "ASCII / Byte Translation",
                  body: "'G' in decimal is 71, which equates to binary 01000111. 'o' in decimal is 111, which equates to binary 01101111.",
                },
                {
                  step: "3",
                  title: "Combining into a Bitstream",
                  body: "Merging these together creates a 16-bit stream: 0100011101101111.",
                },
                {
                  step: "4",
                  title: "Dividing into 6-bit Blocks",
                  body: "Base64 requires groups of 6 bits. We divide our 16 bits into chunks: Block 1: 010001 (Decimal 17) -> Maps to 'R'. Block 2: 110110 (Decimal 54) -> Maps to '2'. Block 3: 1111.. (Only 4 bits remain!). The algorithm appends two zero bits to make it 111100 (Decimal 60) -> Maps to '8'.",
                },
                {
                  step: "5",
                  title: "Applying the Padding Rule",
                  body: "A full Base64 quantum requires groups of 4 encoded characters (representing 3 input bytes). Because we only provided 2 bytes, we are short by one byte. To explicitly signal this to the decoder, a standard equal sign (=) padding character is appended to the tail end.",
                },
                {
                  step: "6",
                  title: "Final Output",
                  body: "The string \"Go\" translates perfectly into \"RzI=\".",
                },
              ].map(({ step, title, body }) => (
                <div
                  key={step}
                  className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                      {step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-sm">{title}</h3>
                      <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: ShieldAlert */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:p-8 shadow-sm p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Encryption vs. Obfuscation: Critical Security Warning</span>
          </h2>
          <div className="space-y-4">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              It is an industry-wide security mistake to use Base64 for data protection. Base64 is a publicly accessible, standardized reversible algorithm. Anyone who accesses a Base64 string can instantly decode it back to its original raw bytes.
            </p>

            <ul className="space-y-2.5 py-1">
              {[
                { title: "Encoding", body: "The intentional transformation of data format to guarantee compatibility between different processing systems." },
                { title: "Encryption", body: "The mathematical obscuring of data using a secure, variable key (such as AES-256) so that only authorized key-holders can read the data." },
              ].map(({ title, body }) => (
                <li key={title} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-2"></span>
                  <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">{title}:</strong> {body}
                  </p>
                </li>
              ))}
            </ul>

            <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium bg-amber-50/50 dark:bg-slate-950 border border-amber-200/50 p-4 rounded-xl">
              Never use Base64 to handle system passwords, financial records, or personally identifiable information (PII) without a robust cryptographic layer applied beforehand.
            </p>
          </div>
        </div>

        {/* Card 5: MessageSquare */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:p-8 shadow-sm p-4 sm:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Base64 Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Why does my Base64 string grow in size compared to the source file?",
                a: "Standard Base64 maps sets of 3 input bytes into 4 text characters. This causes a predictable 33.3% size inflation overhead, which can expand slightly more if formatting newlines are included.",
              },
              {
                q: "What is the difference between Standard and URL-Safe Base64?",
                a: "Standard Base64 utilizes the '+' and '/' characters. In a web browser environment, these characters act as reserved URL parameters, causing string parsing errors in endpoints. URL-safe mode substitutes '+' with '-' and '/' with '_', and strips trailing padding '=' marks.",
              },
              {
                q: "How does the local file mode handle privacy limits?",
                a: "Our system processes files entirely inside your web browser via the HTML5 FileReader API. No data is transmitted to an external server or saved to an online infrastructure database, guaranteeing total computing confidentiality.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-slate-50 dark:bg-slate-950 p-5 rounded-r-xl shadow-sm"
              >
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Our Tool - Card 6 */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl md:p-10 shadow-lg p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose the TwisterTools Base64 Converter?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: "Instant Client-Side Parsing",
                body: "Experience immediate reactivity. Large text payloads and binary strings compute locally in real time.",
              },
              {
                icon: Shield,
                title: "Zero Server Footprint",
                body: "Maximize data confidentiality. Your text inputs and uploaded media assets never leave your device.",
              },
              {
                icon: Cpu,
                title: "Multi-Byte UTF-8 Proof",
                body: "Avoid typical browser application crashes. Our custom byte-loop safely parses emojis and foreign languages without breaking.",
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
              name: "Base64 Encoder / Decoder",
              description:
                "Free online tool to encode and decode Base64 and URL-Safe Base64 strings or local binary files. Processing runs 100% locally in your browser for total data privacy.",
              url: "https://www.twistertools.com/tools/developer-tools/base64-encode-decode",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              browserRequirements:
                "Requires JavaScript. Processing is offline-safe and client-side.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Real-time text encoding and decoding with zero network overhead",
                "Local file encoder supporting files up to 10 MB (images, PDFs, binary documents)",
                "Local file decoder for restoring Base64 text streams back into original binary formats",
                "URL-safe encoding mode substituting standard special characters and stripping trailing padding",
                "Data URI schema output formatting with MIME-type headers auto-detection",
                "Visual encoding/decoding size metrics and ratio differences tracker",
                "Pure client-side processing using browser native APIs for absolute privacy"
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
