"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  ChevronRight,
  Lock,
  Zap,
  Database,
  Info,
  HelpCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript MD5 Implementation (RFC 1321)
//  No external dependencies — runs entirely in-browser.
// ─────────────────────────────────────────────────────────────
function md5(input: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function computeMd5(m: number[], l: number): number[] {
    m[l >> 5] |= 0x80 << (l % 32);
    m[(((l + 64) >>> 9) << 4) + 14] = l;
    let i: number;
    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;
    for (i = 0; i < m.length; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d;
      a = md5ff(a, b, c, d, m[i], 7, -680876936);
      d = md5ff(d, a, b, c, m[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, m[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, m[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, m[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, m[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, m[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, m[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, m[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, m[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, m[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, m[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, m[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, m[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, m[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, m[i + 15], 22, 1236535329);
      a = md5gg(a, b, c, d, m[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, m[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, m[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, m[i], 20, -373897302);
      a = md5gg(a, b, c, d, m[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, m[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, m[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, m[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, m[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, m[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, m[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, m[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, m[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, m[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, m[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, m[i + 12], 20, -1926607734);
      a = md5hh(a, b, c, d, m[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, m[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, m[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, m[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, m[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, m[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, m[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, m[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, m[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, m[i], 11, -358537222);
      c = md5hh(c, d, a, b, m[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, m[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, m[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, m[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, m[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, m[i + 2], 23, -995338651);
      a = md5ii(a, b, c, d, m[i], 6, -198630844);
      d = md5ii(d, a, b, c, m[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, m[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, m[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, m[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, m[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, m[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, m[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, m[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, m[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, m[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, m[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, m[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, m[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, m[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, m[i + 9], 21, -343485551);
      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }

  function str2binl(str: string): number[] {
    const bin: number[] = [];
    const mask = (1 << 8) - 1;
    for (let i = 0; i < str.length * 8; i += 8) {
      bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (i % 32);
    }
    return bin;
  }

  function binl2hex(binarray: number[]): string {
    const hexTab = "0123456789abcdef";
    let str = "";
    for (let i = 0; i < binarray.length * 4; i++) {
      str +=
        hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
        hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf);
    }
    return str;
  }

  // Convert to Latin-1 for safe byte handling
  const encoded = unescape(encodeURIComponent(input));
  return binl2hex(computeMd5(str2binl(encoded), encoded.length * 8));
}

// MD5 from ArrayBuffer (for file hashing)
function md5FromArrayBuffer(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < view.length; i++) {
    str += String.fromCharCode(view[i]);
  }
  return md5(str);
}

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
type InputMode = "single" | "bulk" | "file";

interface BulkRow {
  original: string;
  hash: string;
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function Md5Generator() {
  // Mode
  const [activeMode, setActiveMode] = useState<InputMode>("single");

  // Single String
  const [singleInput, setSingleInput] = useState("");

  // Bulk
  const [bulkInput, setBulkInput] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);

  // File
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileHash, setFileHash] = useState<string>("");
  const [fileError, setFileError] = useState<string>("");
  const [fileLoading, setFileLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Output options
  const [uppercase, setUppercase] = useState(false);
  const [copied, setCopied] = useState(false);

  // Per-row copy feedback (bulk mode)
  const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);

  // ── Computed hash for single/file display in output card ──
  const rawHash = (() => {
    if (activeMode === "single") return singleInput ? md5(singleInput) : "";
    if (activeMode === "file") return fileHash;
    return "";
  })();

  const displayHash = uppercase ? rawHash.toUpperCase() : rawHash;

  // ── Bulk processing ──
  useEffect(() => {
    if (activeMode !== "bulk") return;
    const lines = bulkInput.split("\n");
    const rows: BulkRow[] = lines
      .filter((line) => line.trim() !== "")
      .map((line) => ({
        original: line,
        hash: md5(line),
      }));
    setBulkRows(rows);
  }, [bulkInput, activeMode]);

  // ── File processing ──
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

  const processFile = useCallback((file: File) => {
    setFileError("");
    setFileHash("");
    setFileInfo(null);

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File exceeds the 20 MB safety limit (${(file.size / 1024 / 1024).toFixed(2)} MB). Please select a smaller file.`
      );
      return;
    }

    setFileInfo({ name: file.name, size: file.size });
    setFileLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const hash = md5FromArrayBuffer(buffer);
        setFileHash(hash);
      } catch {
        setFileError("Failed to compute hash. Please try again.");
      } finally {
        setFileLoading(false);
      }
    };
    reader.onerror = () => {
      setFileError("Failed to read file. Please try again.");
      setFileLoading(false);
    };
    reader.readAsArrayBuffer(file);
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

  // ── Copy helpers ──
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  };

  const copyRowHash = async (hash: string, idx: number) => {
    try {
      const h = uppercase ? hash.toUpperCase() : hash;
      await navigator.clipboard.writeText(h);
      setCopiedRowIndex(idx);
      setTimeout(() => setCopiedRowIndex(null), 1500);
    } catch {
      /* silent */
    }
  };

  const formatFileSize = (bytes: number) => {
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

          {/* Mode Tab Selector */}
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            {(
              [
                { id: "single", label: "Single String", icon: AlignLeft },
                { id: "bulk", label: "Bulk Multi-Line", icon: FileText },
                { id: "file", label: "Local File Checksum", icon: HardDrive },
              ] as { id: InputMode; label: string; icon: React.ElementType }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`md5-tab-${id}`}
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

          {/* ── Single String Mode ── */}
          {activeMode === "single" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6">
              <div>
                <label
                  htmlFor="md5-single-input"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Input String
                </label>
                <textarea
                  id="md5-single-input"
                  value={singleInput}
                  onChange={(e) => setSingleInput(e.target.value)}
                  placeholder="Type or paste any text to compute its MD5 hash instantly..."
                  rows={15}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all"
                />
              </div>
              {singleInput && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <Zap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>
                    Hashing <strong className="text-slate-700">{singleInput.length}</strong> character
                    {singleInput.length !== 1 ? "s" : ""} in real-time
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Bulk Multi-Line Mode ── */}
          {activeMode === "bulk" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6">
              <div>
                <label
                  htmlFor="md5-bulk-input"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Multi-Line Input
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Each non-empty line is hashed independently. Results appear below.
                </p>
                <textarea
                  id="md5-bulk-input"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={"apple\nbanana\nhello world\nmy secret key"}
                  rows={15}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all font-mono"
                />
              </div>

              {bulkRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Results
                      <span className="ml-2 text-xs font-normal text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                        {bulkRows.length} {bulkRows.length === 1 ? "entry" : "entries"}
                      </span>
                    </span>
                  </div>

                  <div
                    className="border border-slate-200 rounded-xl overflow-hidden"
                    style={{ maxHeight: "320px", overflowY: "auto", scrollbarWidth: "thin" } as React.CSSProperties}
                  >
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold text-slate-600 w-[35%]">Original</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-slate-600">MD5 Hash</th>
                          <th className="px-3 py-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                              }`}
                          >
                            <td className="px-4 py-3 font-medium text-slate-700 max-w-[160px]">
                              <span className="block truncate" title={row.original}>
                                {row.original}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-indigo-600 break-all">
                              {uppercase ? row.hash.toUpperCase() : row.hash}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="relative group">
                                <button
                                  id={`md5-bulk-copy-${idx}`}
                                  onClick={() => copyRowHash(row.hash, idx)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500 transition-all"
                                  aria-label="Copy hash"
                                >
                                  {copiedRowIndex === idx ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                  Copy Checksum
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Local File Checksum Mode ── */}
          {activeMode === "file" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Local File Checksum</p>
                <p className="text-xs text-slate-500 mb-4">
                  Files are read entirely in your browser via the HTML5 FileReader API.
                  Nothing is uploaded — maximum file size:{" "}
                  <strong>20 MB</strong>.
                </p>

                {/* Drop Zone */}
                <div
                  id="md5-drop-zone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-12 px-6 ${isDragging
                    ? "border-indigo-500 bg-indigo-50"
                    : fileInfo && !fileError
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
                    id="md5-file-input"
                  />

                  {fileLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                      <p className="text-sm font-medium text-indigo-600">Computing MD5 checksum...</p>
                      <p className="text-xs text-slate-600">Processing file locally in your browser</p>
                    </div>
                  ) : fileError ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                      <p className="text-sm font-medium text-red-600">{fileError}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileError("");
                          setFileInfo(null);
                          setFileHash("");
                        }}
                        className="text-xs text-slate-500 underline hover:text-indigo-600"
                      >
                        Try another file
                      </button>
                    </div>
                  ) : fileInfo ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                        <HardDrive className="w-7 h-7 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{fileInfo.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(fileInfo.size)}</p>
                      </div>
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Hash computed successfully
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileInfo(null);
                          setFileHash("");
                          setFileError("");
                        }}
                        className="text-xs text-slate-600 underline hover:text-indigo-600 transition-colors"
                      >
                        Select a different file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {isDragging ? "Drop file to hash" : "Drop a file here"}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          or click to browse — any file type, up to 20 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* File hash display in-panel */}
              {fileHash && !fileLoading && (
                <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
                  <p className="text-xs text-slate-400 mb-2 font-medium tracking-wide uppercase">
                    File MD5 Checksum
                  </p>
                  <p className="font-mono text-indigo-400 text-sm break-all leading-relaxed">
                    {uppercase ? fileHash.toUpperCase() : fileHash}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════ RIGHT PANEL ══════════════════ */}
        <div>
          <div className="sticky top-4 space-y-4">
            {/* Output Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
              {/* Slate-to-Indigo Gradient Header Bar */}
              <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm font-semibold">MD5 Hash Output</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Uppercase Toggle */}
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="md5-uppercase-toggle"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Uppercase Hex Format
                  </label>
                  <button
                    id="md5-uppercase-toggle"
                    role="switch"
                    aria-checked={uppercase}
                    onClick={() => setUppercase((p) => !p)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${uppercase ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${uppercase ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>

                {/* Hash Display */}
                <div className="rounded-xl bg-slate-900 border border-slate-700 p-4 min-h-[80px] flex items-center">
                  {displayHash ? (
                    <p
                      id="md5-hash-output"
                      className="font-mono text-indigo-400 text-sm break-all leading-relaxed w-full"
                    >
                      {displayHash}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-sm italic">
                      {activeMode === "single"
                        ? "Start typing to generate hash..."
                        : activeMode === "file"
                          ? "Drop a file to see its checksum..."
                          : "Hash will appear in row results below..."}
                    </p>
                  )}
                </div>

                {/* Char count hint */}
                {displayHash && (
                  <p className="text-xs text-slate-600 text-center">
                    128-bit digest &mdash; 32 hexadecimal characters
                  </p>
                )}

                {/* Copy Button */}
                <button
                  id="md5-copy-button"
                  onClick={() => displayHash && copyToClipboard(displayHash)}
                  disabled={!displayHash}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${displayHash
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
                      Copy Hash Output
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-snug">
                    <strong className="text-slate-800">100% Secure.</strong> Calculations are processed
                    entirely client-side.
                  </p>
                </div>
              </div>
            </div>

            {/* Algorithm Info Card */}
            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Algorithm Info
              </p>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Output size", value: "128-bit / 32 hex chars" },
                  { label: "Algorithm", value: "MD5 (RFC 1321)" },
                  { label: "Processing", value: "Browser — no server" },
                  { label: "File limit", value: "20 MB max" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-mono font-medium text-slate-700 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">

        {/* What is MD5? */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Info className="w-5 h-5 text-indigo-600" />
            </div>
            <span>What Is MD5?</span>
          </h2>
          <div className="space-y-4 text-slate-600">
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              MD5 (Message Digest Algorithm 5) is a cryptographic hash function designed by Ronald Rivest
              in 1991 and standardized in <strong>RFC 1321</strong>. It accepts an input of arbitrary
              length and produces a fixed 128-bit (16-byte) output, conventionally rendered as a
              32-character lowercase hexadecimal string. No matter whether you hash a single character
              or an entire DVD image, the output is always exactly 32 hex digits.
            </p>
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              The function is deterministic — the same input always produces the same output — and
              exhibits the <em>avalanche effect</em>: changing even a single bit of input completely
              transforms the output hash. This property makes MD5 extraordinarily useful for verifying
              data integrity, detecting accidental file corruption, de-duplicating storage, and
              fingerprinting software releases.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How MD5 Works — The Algorithm</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: "1",
                title: "Padding",
                body: "The message is padded so its length is congruent to 448 bits modulo 512. A single '1' bit is appended, followed by '0' bits, then a 64-bit little-endian representation of the original message length.",
              },
              {
                step: "2",
                title: "Four 32-bit Registers",
                body: "MD5 initialises four 32-bit state variables (A, B, C, D) to specific magic constants derived from the sine function, forming the initial 128-bit hash state.",
              },
              {
                step: "3",
                title: "Compression in 512-bit Blocks",
                body: "The padded message is processed in 512-bit chunks. Each chunk runs through 64 rounds of non-linear functions (F, G, H, I) with modular addition, left-rotation, and table constants.",
              },
              {
                step: "4",
                title: "Final Digest",
                body: "After all blocks are processed, the four 32-bit registers are concatenated in little-endian byte order to produce the final 128-bit digest — your 32-character hex string.",
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
                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Practical Use Cases for MD5</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "File Integrity Verification",
                body: "Software distribution sites publish MD5 checksums alongside their downloads. Compare the checksum of your downloaded file against the published value to confirm no corruption or tampering occurred in transit.",
              },
              {
                title: "Duplicate File Detection",
                body: "Hashing every file in a directory and grouping identical checksums pinpoints exact duplicates — even if filenames differ — saving storage and eliminating redundancy in archival systems.",
              },
              {
                title: "Database De-duplication",
                body: "Store MD5 hashes of records or assets in an indexed column. Before inserting a new row, check whether its hash already exists. Dramatically faster than full-text comparisons on large datasets.",
              },
              {
                title: "Caching and ETag Headers",
                body: "Web servers use MD5 (or similar) digests to generate HTTP ETag headers. Browsers cache content and only re-download when the server-computed hash changes, reducing bandwidth and accelerating page loads.",
              },
              {
                title: "API Request Signing",
                body: "Many legacy payment gateways and REST APIs use HMAC-MD5 to sign request parameters, ensuring the payload has not been modified between the client and the server.",
              },
              {
                title: "Forensic Chain of Custody",
                body: "Digital forensics professionals hash disk images immediately upon acquisition. Periodic re-hashing proves the evidence has not been altered since collection — a legally recognised procedure in many jurisdictions.",
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
                <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MD5 vs Other Algorithms */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-indigo-600" />
            </div>
            <span>MD5 vs SHA-1 vs SHA-256</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  {["Property", "MD5", "SHA-1", "SHA-256"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Output size", "128 bits / 32 hex", "160 bits / 40 hex", "256 bits / 64 hex"],
                  ["Digest speed", "Fastest", "Fast", "Moderate"],
                  ["Collision resistance", "Broken (practical)", "Broken (theoretical)", "Secure"],
                  ["Pre-image resistance", "Strong", "Strong", "Very strong"],
                  ["Best for", "Checksums, dedup", "Git object IDs (legacy)", "Security-critical hashing"],
                  ["Avoid for", "Passwords, TLS", "New security systems", "Performance-heavy pipelines"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 text-sm ${j === 0
                          ? "font-semibold text-slate-700"
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

        {/* Security Notice */}
        <div className="bg-gradient-to-br from-amber-50/40 to-white border border-amber-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <span>Security Considerations</span>
          </h2>
          <div className="space-y-4 text-slate-600">
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              While MD5 remains widely used for non-cryptographic purposes, it should{" "}
              <strong>never</strong> be used for password storage, digital signatures, or
              security-critical verification. In 2004, researchers demonstrated the first practical MD5
              collision attack. By 2008, rogue certificate authorities used MD5 collisions to forge SSL
              certificates. Modern GPUs can compute billions of MD5 hashes per second, making
              brute-force attacks on short inputs trivially fast.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-green-800 mb-2">Safe to use MD5 for:</p>
                <ul className="text-sm text-green-700 space-y-1">
                  {[
                    "Non-security file checksums",
                    "Database de-duplication keys",
                    "Cache invalidation tokens",
                    "Content-addressable storage",
                    "Legacy API compatibility",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">Never use MD5 for:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {[
                    "Password storage or verification",
                    "Digital signatures or certificates",
                    "Cryptographic authentication",
                    "Tamper-proof security checksums",
                    "Blockchain or financial integrity",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Is my data sent to any server when using this tool?",
                a: "Absolutely not. All three input modes — single string, bulk multi-line, and local file checksum — are computed entirely within your browser using the Web API and our pure TypeScript MD5 implementation. No data ever leaves your device. The file checksum mode uses the HTML5 FileReader API to read file bytes directly from local storage without any upload.",
              },
              {
                q: "Why does the same string always produce the same MD5 hash?",
                a: "MD5 is a deterministic function: given identical input bytes, the mathematical operations (modular arithmetic, bitwise rotations, non-linear functions) will always produce the same 128-bit output. This determinism is what makes checksums useful for verification — you can recompute and compare at any time.",
              },
              {
                q: "Can two different strings produce the same MD5 hash?",
                a: "Yes — this is called a 'collision'. The MD5 output space is 2128 possible values, which is enormous, but researchers have demonstrated deliberate collision construction attacks since 2004. For casual checksum use, accidental collisions are vanishingly rare (probability approximately 1 in 3.4 x 10 to the power of 38). For security-critical applications, use SHA-256 instead.",
              },
              {
                q: "What is the difference between MD5 and a checksum like CRC32?",
                a: "CRC32 produces a 32-bit output primarily designed to detect accidental errors (bit flips in transmission). It is extremely fast but provides minimal collision resistance. MD5 produces a 128-bit cryptographic hash with much stronger avalanche properties — a one-bit input change flips approximately 50% of output bits, making it far harder to manipulate deliberately, and virtually impossible to produce an accidental collision.",
              },
              {
                q: "Why is my file hash different from the hash shown by another tool?",
                a: "If another tool produces a different hash for the same file, verify: (1) both tools are reading the raw bytes without any encoding conversion; (2) neither tool stripped a BOM or newline characters; (3) you are comparing the same file version. Our tool reads the exact ArrayBuffer returned by FileReader, hashing raw bytes without any transformation.",
              },
              {
                q: "Can I use MD5 to verify software downloads safely?",
                a: "MD5 checksums published alongside downloads protect against accidental corruption during transfer (e.g., interrupted downloads, storage errors). However, because MD5 collisions can be crafted deliberately, a malicious actor with control over both the file and the published checksum could theoretically produce a tampered file with a matching hash. For security-critical software verification, SHA-256 with a digitally signed manifest is recommended.",
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

        {/* Why Our Tool */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl md:p-10 shadow-lg p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Why Use TwisterTools MD5 Generator?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Shield,
                title: "Zero Data Exposure",
                body: "100% client-side computation. Your strings and files never leave your browser tab.",
              },
              {
                icon: Zap,
                title: "Real-Time Hashing",
                body: "Single string mode updates the 32-character digest with every keystroke — zero latency.",
              },
              {
                icon: FileText,
                title: "Bulk Processing",
                body: "Hash hundreds of strings simultaneously in the multi-line mode with per-row copy buttons.",
              },
              {
                icon: HardDrive,
                title: "File Checksum",
                body: "Verify the integrity of any local file up to 20 MB with drag-and-drop simplicity.",
              },
              {
                icon: Lock,
                title: "No Dependencies",
                body: "Pure TypeScript MD5 implementation — no external libraries, no npm packages, no surprises.",
              },
              {
                icon: Database,
                title: "Case Formatting",
                body: "Toggle between lowercase and UPPERCASE hex output with a single switch.",
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
              name: "MD5 Generator and File Checksum Tool",
              description:
                "Free online MD5 hash generator with real-time single string hashing, bulk multi-line processing, and local file checksum verification. Pure client-side computation — no data is ever sent to a server.",
              url: "https://www.twistertools.com/tools/developer-tools/md5-generator",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              browserRequirements:
                "Requires JavaScript. All processing is offline-safe and client-side.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Real-time single string MD5 hashing with zero latency",
                "Bulk multi-line mode — hash hundreds of strings simultaneously",
                "Local file checksum using HTML5 FileReader API (no upload)",
                "20 MB file size safety limit for lightweight browser performance",
                "Uppercase / lowercase hex format toggle",
                "One-click copy to clipboard with visual feedback",
                "Pure TypeScript MD5 implementation — no external npm packages",
                "100% client-side — zero server disk space consumption",
                "Absolute privacy — data never leaves the user browser",
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
