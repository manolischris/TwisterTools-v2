"use client";

import { useState, useCallback, useEffect } from "react";
import {
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  FileText,
  HelpCircle,
  Layers,
  Settings,
  CalendarClock,
  Trash2,
  BookOpen,
  Cpu,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Algorithmic & Operational Logic (100% Client-Side)
// ─────────────────────────────────────────────────────────────

// Cryptographically secure UUID v4 generation using Web Crypto API with custom fallback
function randomUUIDFallback(): string {
  const arr = new Uint8Array(16);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 16; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  // Version 4 bits (0100xxxx at byte 6)
  arr[6] = (arr[6] & 0x0f) | 0x40;
  // Variant bits (10xxxxxx at byte 8)
  arr[8] = (arr[8] & 0x3f) | 0x80;

  const hex: string[] = [];
  for (let i = 0; i < 16; i++) {
    hex.push(arr[i].toString(16).padStart(2, "0"));
  }
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

function generateV4(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return randomUUIDFallback();
}

// Pure TypeScript sequential UUID v1 implementation (Gregorian calendar time-based)
let v1Initialized = false;
let v1LastTime = BigInt(0);
let v1ClockSeq = 0;
let v1NodeId = "";

function initV1() {
  if (v1Initialized) return;
  const nodeBytes = new Uint8Array(6);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(nodeBytes);
  } else {
    for (let i = 0; i < 6; i++) nodeBytes[i] = Math.floor(Math.random() * 256);
  }
  nodeBytes[0] |= 0x01; // Multicast bit set to 1 as per RFC 4122
  v1NodeId = Array.from(nodeBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const seqBytes = new Uint16Array(1);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(seqBytes);
  } else {
    seqBytes[0] = Math.floor(Math.random() * 65536);
  }
  v1ClockSeq = seqBytes[0] & 0x3fff; // 14-bit clock sequence
  v1Initialized = true;
}

function generateV1(): string {
  initV1();

  const epochOffset = BigInt("122192928000000000"); // 100-ns intervals between Gregorian and Unix epochs
  let now = BigInt(Date.now()) * BigInt(10000) + epochOffset;

  if (now <= v1LastTime) {
    now = v1LastTime + BigInt(1);
  } else if (v1LastTime > BigInt(0) && now < v1LastTime) {
    v1ClockSeq = (v1ClockSeq + 1) & 0x3fff;
  }
  v1LastTime = now;

  const timeLow = Number(now & BigInt("0xffffffff"));
  const timeMid = Number((now >> BigInt(32)) & BigInt("0xffff"));
  const timeHi = Number((now >> BigInt(48)) & BigInt("0x0fff"));
  const timeHiAndVersion = timeHi | 0x1000; // version 1

  const clockSeqLow = v1ClockSeq & 0xff;
  const clockSeqHi = ((v1ClockSeq >> 8) & 0x3f) | 0x80; // variant 1

  const sTimeLow = timeLow.toString(16).padStart(8, "0");
  const sTimeMid = timeMid.toString(16).padStart(4, "0");
  const sTimeHi = timeHiAndVersion.toString(16).padStart(4, "0");
  const sClockSeqHi = clockSeqHi.toString(16).padStart(2, "0");
  const sClockSeqLow = clockSeqLow.toString(16).padStart(2, "0");

  return `${sTimeLow}-${sTimeMid}-${sTimeHi}-${sClockSeqHi}${sClockSeqLow}-${v1NodeId}`;
}

// ─────────────────────────────────────────────────────────────
//  Formatting Helper
// ─────────────────────────────────────────────────────────────
function formatUuid(
  uuid: string,
  casing: "lower" | "upper",
  includeHyphens: boolean,
  wrapBraces: boolean,
  quoteEncapsulate: boolean
): string {
  let result = uuid;
  if (!includeHyphens) {
    result = result.replace(/-/g, "");
  }
  if (casing === "upper") {
    result = result.toUpperCase();
  } else {
    result = result.toLowerCase();
  }
  if (wrapBraces) {
    result = `{${result}}`;
  }
  if (quoteEncapsulate) {
    result = `"${result}"`;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function UuidGenerator() {
  const [uuidVersion, setUuidVersion] = useState<"v4" | "v1">("v4");
  const [quantity, setQuantity] = useState<number>(100);
  const [casing, setCasing] = useState<"lower" | "upper">("lower");
  const [includeHyphens, setIncludeHyphens] = useState<boolean>(true);
  const [wrapBraces, setWrapBraces] = useState<boolean>(false);
  const [quoteEncapsulate, setQuoteEncapsulate] = useState<boolean>(false);

  const [rawUuids, setRawUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  // Generate a new batch of raw UUIDs
  const handleGenerate = useCallback(() => {
    setIsRotating(true);
    const count = Math.max(1, Math.min(500, quantity));
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      if (uuidVersion === "v4") {
        list.push(generateV4());
      } else {
        list.push(generateV1());
      }
    }
    setRawUuids(list);
    setTimeout(() => setIsRotating(false), 600);
  }, [quantity, uuidVersion]);

  // Initial generation
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format the list based on current active choices
  const formattedList = rawUuids
    .map((uuid) => formatUuid(uuid, casing, includeHyphens, wrapBraces, quoteEncapsulate))
    .join("\n");

  // Copy List Helper
  const handleCopy = async () => {
    if (!formattedList) return;
    try {
      await navigator.clipboard.writeText(formattedList);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  // Reset to default settings
  const handleReset = () => {
    setUuidVersion("v4");
    setQuantity(100);
    setCasing("lower");
    setIncludeHyphens(true);
    setWrapBraces(false);
    setQuoteEncapsulate(false);
    // Regenerate defaults
    const list: string[] = [];
    for (let i = 0; i < 100; i++) {
      list.push(generateV4());
    }
    setRawUuids(list);
  };

  // Safe Quantity Stepper Controls
  const handleIncrement = () => {
    setQuantity((prev) => Math.min(500, prev + 10));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 10));
  };

  const handleQuantityInput = (val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      setQuantity(1);
    } else {
      setQuantity(Math.max(1, Math.min(500, parsed)));
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Two-Column Dashboard Grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL (CONTROL CENTER) ══════════════════ */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            {/* UUID Version Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                UUID Version Selector
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUuidVersion("v4")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                    uuidVersion === "v4"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>UUID v4 (Random)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUuidVersion("v1")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                    uuidVersion === "v1"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  <CalendarClock className="w-4 h-4" />
                  <span>UUID v1 (Time-based)</span>
                </button>
              </div>
            </div>

            {/* Bulk Quantity Input */}
            <div className="flex flex-col items-center text-center">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Bulk Quantity Input
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Select the number of identifiers to generate per batch (1 to 500 max).
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-12 h-12 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:bg-slate-200 text-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Decrease quantity by 10"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => handleQuantityInput(e.target.value)}
                  onBlur={() => {
                    if (quantity < 1 || isNaN(quantity)) setQuantity(1);
                    if (quantity > 500) setQuantity(500);
                  }}
                  className="w-24 h-12 text-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-12 h-12 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:bg-slate-200 text-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Increase quantity by 10"
                >
                  +
                </button>
              </div>
            </div>

            {/* Casing Options Toggle */}
            <div className="flex flex-col items-center text-center">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Casing Options
              </label>
              <div className="flex gap-3 justify-center w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => setCasing("lower")}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    casing === "lower"
                      ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  lowercase
                </button>
                <button
                  type="button"
                  onClick={() => setCasing("upper")}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    casing === "upper"
                      ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  UPPER-CASE
                </button>
              </div>
            </div>

            {/* Formatting Checkboxes */}
            <div className="border-t border-slate-100 pt-5">
              <label className="block text-sm font-semibold text-slate-700 mb-4">
                Formatting Options
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="include-hyphens"
                    checked={includeHyphens}
                    onChange={(e) => setIncludeHyphens(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="include-hyphens"
                    className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                  >
                    Include Hyphens
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="wrap-braces"
                    checked={wrapBraces}
                    onChange={(e) => setWrapBraces(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="wrap-braces"
                    className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                  >
                    Wrap in Braces &#123;&#125;
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="quote-encapsulate"
                    checked={quoteEncapsulate}
                    onChange={(e) => setQuoteEncapsulate(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="quote-encapsulate"
                    className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                  >
                    Quote Encapsulate
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Workspace Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-sm font-bold bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:shadow-lg transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRotating ? "animate-spin" : ""}`} />
              <span>Generate UUIDs</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Options</span>
            </button>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL (STICKY FLOATING PREVIEW) ══════════════════ */}
        <div className="lg:col-span-5">
          <div className="sticky top-4 space-y-4">
            {/* Output Preview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden flex flex-col">
              {/* Slate-to-Indigo Gradient Header Bar */}
              <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm font-semibold">Generated Preview</span>
                </div>
                {/* Copy List Action Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={rawUuids.length === 0}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:pointer-events-none"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Securely!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy List</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Content */}
              <div className="p-5 space-y-4">
                <div className="relative">
                  <textarea
                    readOnly
                    value={formattedList}
                    placeholder="Click Generate to produce identifiers..."
                    className="w-full h-[320px] font-mono text-xs text-indigo-400 bg-slate-900 border border-slate-700 rounded-xl p-4 focus:outline-none resize-none text-center"
                    style={{ scrollbarWidth: "thin" }}
                  />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Batch Count
                    </span>
                    <span className="text-lg font-extrabold text-slate-700">
                      {rawUuids.length}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Length
                    </span>
                    <span className="text-lg font-extrabold text-slate-700">
                      {formattedList.length} chars
                    </span>
                  </div>
                </div>

                {/* Inline Security Badge */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <p className="text-xs text-slate-600 font-medium">
                    100% Secure: Generated locally via Web Crypto API.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO GUIDE SECTION (BELOW-THE-FOLD)
      ───────────────────────────────────────────────────────────── */}
      {/* SECTION 1: DEFINITIONS & ARCHITECTURE MATRIX */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200/50 p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          The Definitive Guide to UUID & GUID Implementations
        </h2>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
          A Universally Unique Identifier (UUID) is a standardized 128-bit numeric label used in computer system architectures to uniquely identify information without significant central coordination. In the Microsoft ecosystem, this standard is colloquially implemented as a Globally Unique Identifier (GUID). The foundational core premise of UUIDs is their mathematical immensity: the system relies on an incredibly vast identifier space, ensuring that the probability of generating duplicate IDs approaches zero for all practical real-world applications.
        </p>
        
        <h3 className="text-base font-semibold text-slate-900 mb-3">Structural Anatomy of a Canonical UUID</h3>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
          A standard canonical representation consists of 32 hexadecimal digits displayed in 5 distinct groups separated by hyphens, following a strict 8-4-4-4-12 pattern for a total string length of 36 characters: <code className="bg-slate-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs md:text-sm">xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx</code>. The variable <code className="font-mono text-sm font-semibold">M</code> indicates the specific UUID version, while the variable <code className="font-mono text-sm font-semibold">N</code> indicates the variant architecture.
        </p>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">UUID Field Segment</th>
                <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Hex Characters</th>
                <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Bit Width</th>
                <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Functional Technical Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700 font-mono">time_low</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">8 Hex chars</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">32 bits</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">Interpreted as the low-order bits of the precise system timestamp.</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700 font-mono">time_mid</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">4 Hex chars</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">16 bits</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">Interpreted as the middle-order bits of the precise system timestamp.</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700 font-mono">time_hi_and_version</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">4 Hex chars</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">16 bits</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">Combines the high bits of the timestamp with the 4-bit variant identifier code.</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700 font-mono">clock_seq_hi_and_res</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">4 Hex chars</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">16 bits</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">Encodes the multiplexed variant layout along with the localized clock sequence.</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700 font-mono">node</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">12 Hex chars</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">48 bits</td>
                <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">Represents the spatial node identifier (frequently the hardware MAC address or random block).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SPECIFICATIONS AND COMPARISON */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200/50 p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 mb-4">
          <Layers className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          Comparing Version 1 (Time-Based) vs Version 4 (Cryptographically Random)
        </h2>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
          Choosing the right identifier layout depends heavily on your system performance parameters, compliance needs, and indexing strategies. While both formats consume exactly 128 bits of space, their internal mechanisms diverge entirely.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-100 bg-slate-50/50 p-5 rounded-xl">
            <h3 className="text-base font-semibold text-indigo-600 mb-2 font-mono">UUID Version 1 Properties</h3>
            <ul className="space-y-2.5 text-slate-600 text-sm leading-relaxed">
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" /> Generates chronological order, optimal for sequence-based clustered indexing.</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" /> Embeds a high-precision 60-bit timestamp tracking Gregorian intervals.</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" /> Requires physical or pseudo node components (hardware MAC addresses).</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" /> Exposes generation time and internal network hardware addresses if not obscured.</li>
            </ul>
          </div>
          <div className="border border-slate-100 bg-slate-50/50 p-5 rounded-xl">
            <h3 className="text-base font-semibold text-indigo-600 mb-2 font-mono">UUID Version 4 Properties</h3>
            <ul className="space-y-2.5 text-slate-600 text-sm leading-relaxed">
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" /> Relies entirely on secure bitwise entropy algorithms rather than chronological sequences.</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" /> Employs 122 bits of clean, cryptographically secure hardware randomness.</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" /> Leak-proof layout containing zero host machine tracking or timestamps.</li>
              <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" /> Industry standard format for API keys, authorization tokens, and web session tracking.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 3: THE MATHEMATICS OF COLLISIONS */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200/50 p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          The Mathematics of Collision Space: How Unique is a UUID?
        </h2>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
          The shear safety threshold of an operational UUID v4 system rests entirely upon combinatorics. With 122 bits allocated exclusively to random configurations, the total number of unique keys available scales to:
        </p>
        <div className="my-5 p-4 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl font-mono text-center text-indigo-700 font-bold text-base md:text-lg">
          2^122 = 5,316,911,983,139,663,494,615,222,786,750,221,063,336
        </div>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
          This value corresponds roughly to 5.3 Undecillion records. To illustrate the functional resilience against duplication, consider the standard **Birthday Problem** paradox applied to key collision probability:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          <div className="p-4 border border-slate-100 rounded-xl text-center">
            <div className="text-2xl font-bold text-slate-900">100 Trillion</div>
            <div className="text-xs text-slate-500 mt-1">UUIDs Stored Collectively</div>
            <div className="text-sm font-semibold text-indigo-600 mt-2">1 in 1 Billion Collision Odds</div>
          </div>
          <div className="p-4 border border-slate-100 rounded-xl text-center">
            <div className="text-2xl font-bold text-slate-900">1 Billion / sec</div>
            <div className="text-xs text-slate-500 mt-1">Generation Flow over 100 Years</div>
            <div className="text-sm font-semibold text-indigo-600 mt-2">Virtually Zero Real Impact</div>
          </div>
          <div className="p-4 border border-slate-100 rounded-xl text-center">
            <div className="text-2xl font-bold text-slate-900">100% Offline</div>
            <div className="text-xs text-slate-500 mt-1">Coordination Overhead Needed</div>
            <div className="text-sm font-semibold text-indigo-600 mt-2">Instant Decentralized Generation</div>
          </div>
        </div>
      </div>

      {/* SECTION 4: USE CASES AND PARSING MATRIX */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200/50 p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 mb-4">
          <Cpu className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          Enterprise Use Cases & Integration Patterns
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-900 mb-2">Microservices Architecture</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Enables individual decentralized microservices to spawn transactional entities concurrently without polling a monolithic centralized sequence table.
            </p>
          </div>
          <div className="p-5 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-900 mb-2">Database Primary Keys</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Prevents ID enumeration attacks on REST endpoints by substituting sequential integer counters with complex, unguessable cryptographic tokens.
            </p>
          </div>
          <div className="p-5 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-900 mb-2">Distributed Log Merging</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Allows analytics processing pipelines across separate regional cloud zones to aggregate metrics without key collision overlaps.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 5: ACCESSIBILITY FAQS */}
      <div className="mt-6 bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Frequently Asked Questions</span>
        </h2>
        
        <div className="space-y-5">
          <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
              Is there a programmatic risk of encountering duplicate identifiers?
            </h3>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              No. The generation engine consumes native secure pseudo-random number generator routines (CSPRNG) supplied by modern browser environment frameworks. The probability threshold remains so miniscule that it can be safely assumed that every single batch contains absolute unique entries globally.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
              Are these generated UUID values strictly case-sensitive?
            </h3>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              According to the core specifications outlined within RFC 4122, hexadecimal representations are standardly treated as case-insensitive on parsing layers. However, modern linting systems and database engines frequently dictate uniform lower-case strings as the ultimate production standard to maintain serialization consistency.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
              Are any generation strings logged or sent to external servers?
            </h3>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Absolutely not. In strict compliance with our local architectural layout principles, all generation logic runs completely isolated inside your sandboxed browser context using local JavaScript calculations. Your technical keys never traverse an active web network boundary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
