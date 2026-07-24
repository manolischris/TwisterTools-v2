"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Shield,
  Hash,
  FileText,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Upload,
  Loader2,
  Lock,
  HardDrive,
  AlertCircle,
  HelpCircle,
  Cpu,
  Terminal
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript SHA-3 (Keccak-f[1600]) Implementation
//  Compliant with FIPS 202. No external library dependencies.
// ─────────────────────────────────────────────────────────────
class Sha3 {
  static keccak1600(r: number, c: number, data: Uint8Array): string {
    const l = c / 2; // message digest output length in bits
    const state: bigint[][] = [[], [], [], [], []];
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        state[x][y] = BigInt(0);
      }
    }

    const rateBytes = r / 8;
    const paddingLength = rateBytes - (data.length % rateBytes);
    const paddedData = new Uint8Array(data.length + paddingLength);
    paddedData.set(data);

    if (paddingLength === 1) {
      paddedData[data.length] = 0x86;
    } else {
      paddedData[data.length] = 0x06;
      paddedData[paddedData.length - 1] = 0x80;
    }

    const blockSizeBytes = rateBytes;
    for (let i = 0; i < paddedData.length; i += blockSizeBytes) {
      for (let j = 0; j < rateBytes / 8; j++) {
        let i64 = BigInt(0);
        for (let byteIdx = 0; byteIdx < 8; byteIdx++) {
          i64 |= BigInt(paddedData[i + j * 8 + byteIdx]) << BigInt(byteIdx * 8);
        }
        const x = j % 5;
        const y = Math.floor(j / 5);
        state[x][y] ^= i64;
      }
      Sha3.keccak_f_1600(state);
    }

    const transpose = (arr: bigint[][]) => arr.map((row, rIdx) => arr.map(col => col[rIdx]));
    const md = transpose(state)
      .map(plane => plane.map(lane => lane.toString(16).padStart(16, '0').match(/.{2}/g)!.reverse().join('')).join(''))
      .join('')
      .slice(0, l / 4);

    return md;
  }

  static hash256(data: Uint8Array): string {
    return Sha3.keccak1600(1088, 512, data);
  }

  static hash512(data: Uint8Array): string {
    return Sha3.keccak1600(576, 1024, data);
  }

  static keccak_f_1600(a: bigint[][]) {
    const nRounds = 24;
    const RC = [
      BigInt("0x0000000000000001"), BigInt("0x0000000000008082"), BigInt("0x800000000000808a"),
      BigInt("0x8000000080008000"), BigInt("0x000000000000808b"), BigInt("0x0000000080000001"),
      BigInt("0x8000000080008081"), BigInt("0x8000000000008009"), BigInt("0x000000000000008a"),
      BigInt("0x0000000000000088"), BigInt("0x0000000080008009"), BigInt("0x000000008000000a"),
      BigInt("0x000000008000808b"), BigInt("0x800000000000008b"), BigInt("0x8000000000008089"),
      BigInt("0x8000000000008003"), BigInt("0x8000000000008002"), BigInt("0x8000000000000080"),
      BigInt("0x000000000000800a"), BigInt("0x800000008000000a"), BigInt("0x8000000080008081"),
      BigInt("0x8000000000008080"), BigInt("0x0000000080000001"), BigInt("0x8000000080008008"),
    ];

    for (let r = 0; r < nRounds; r++) {
      const C: bigint[] = [];
      const D: bigint[] = [];
      for (let x = 0; x < 5; x++) {
        C[x] = a[x][0] ^ a[x][1] ^ a[x][2] ^ a[x][3] ^ a[x][4];
      }
      for (let x = 0; x < 5; x++) {
        D[x] = C[(x + 4) % 5] ^ ROT(C[(x + 1) % 5], 1);
        for (let y = 0; y < 5; y++) {
          a[x][y] ^= D[x];
        }
      }

      let [x, y] = [1, 0];
      let current = a[x][y];
      for (let t = 0; t < 24; t++) {
        const [X, Y] = [y, (2 * x + 3 * y) % 5];
        const tmp = a[X][Y];
        a[X][Y] = ROT(current, ((t + 1) * (t + 2) / 2) % 64);
        current = tmp;
        [x, y] = [X, Y];
      }

      for (let y = 0; y < 5; y++) {
        const C_plane: bigint[] = [];
        for (let x = 0; x < 5; x++) C_plane[x] = a[x][y];
        for (let x = 0; x < 5; x++) {
          a[x][y] = C_plane[x] ^ ((~C_plane[(x + 1) % 5]) & C_plane[(x + 2) % 5]);
        }
      }

      a[0][0] ^= RC[r];
    }

    function ROT(val: bigint, d: number): bigint {
      return BigInt.asUintN(64, (val << BigInt(d)) | (val >> BigInt(64 - d)));
    }
  }
}

// Helper to compute standard hash using Web Crypto API
async function computeWebCrypto(algorithm: string, data: Uint8Array): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is not supported in this environment.");
  }
  const hashBuffer = await window.crypto.subtle.digest(algorithm, data as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to parse file in chunks (blocks) to avoid main thread blocking
const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB

type InputMode = "single" | "bulk" | "file";
type HashVariant = "sha-1" | "sha-256" | "sha-512" | "sha3-256" | "sha3-512";

interface BulkRow {
  original: string;
  hash: string;
}

export default function ShaGenerator() {
  const [activeMode, setActiveMode] = useState<InputMode>("single");
  const [activeVariant, setActiveVariant] = useState<HashVariant>("sha-256");

  // Single mode state
  const [singleInput, setSingleInput] = useState("");
  const [singleHash, setSingleHash] = useState("");

  // Bulk mode state
  const [bulkInput, setBulkInput] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);

  // File mode state
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileHash, setFileHash] = useState<string>("");
  const [fileProgress, setFileProgress] = useState(0);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loaded file buffer to avoid re-reading if variant is toggled
  const loadedFileBufferRef = useRef<Uint8Array | null>(null);

  // Modifiers
  const [uppercase, setUppercase] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetChecksum, setTargetChecksum] = useState("");

  // Statistics for text area
  const textStats = (() => {
    const charCount = singleInput.length;
    const byteSize = new TextEncoder().encode(singleInput).length;
    const trimmed = singleInput.trim();
    const wordCount = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
    return { charCount, byteSize, wordCount };
  })();

  // ─────────────────────────────────────────────────────────────
  //  Calculators
  // ─────────────────────────────────────────────────────────────

  // Reactive single input hash computation
  useEffect(() => {
    if (activeMode !== "single") return;

    let isCurrent = true;
    const encoder = new TextEncoder();
    const data = encoder.encode(singleInput);

    const calculate = async () => {
      try {
        let hash = "";
        if (activeVariant === "sha-1") {
          hash = await computeWebCrypto("SHA-1", data);
        } else if (activeVariant === "sha-256") {
          hash = await computeWebCrypto("SHA-256", data);
        } else if (activeVariant === "sha-512") {
          hash = await computeWebCrypto("SHA-512", data);
        } else if (activeVariant === "sha3-256") {
          hash = Sha3.hash256(data);
        } else if (activeVariant === "sha3-512") {
          hash = Sha3.hash512(data);
        }

        if (isCurrent) {
          setSingleHash(hash);
        }
      } catch (err) {
        if (isCurrent) setSingleHash("");
      }
    };

    calculate();

    return () => {
      isCurrent = false;
    };
  }, [singleInput, activeVariant, activeMode]);

  // Reactive bulk input hash computation
  useEffect(() => {
    if (activeMode !== "bulk") return;

    let isCurrent = true;
    const lines = bulkInput.split("\n").filter(line => line !== "");

    const calculate = async () => {
      try {
        const encoder = new TextEncoder();
        const rows = await Promise.all(
          lines.map(async (line) => {
            const data = encoder.encode(line);
            let hash = "";
            if (activeVariant === "sha-1") {
              hash = await computeWebCrypto("SHA-1", data);
            } else if (activeVariant === "sha-256") {
              hash = await computeWebCrypto("SHA-256", data);
            } else if (activeVariant === "sha-512") {
              hash = await computeWebCrypto("SHA-512", data);
            } else if (activeVariant === "sha3-256") {
              hash = Sha3.hash256(data);
            } else if (activeVariant === "sha3-512") {
              hash = Sha3.hash512(data);
            }
            return { original: line, hash };
          })
        );

        if (isCurrent) {
          setBulkRows(rows);
        }
      } catch (err) {
        if (isCurrent) setBulkRows([]);
      }
    };

    calculate();

    return () => {
      isCurrent = false;
    };
  }, [bulkInput, activeVariant, activeMode]);

  // Re-hash file automatically if the user switches active variant and buffer is cached
  useEffect(() => {
    if (activeMode !== "file" || !loadedFileBufferRef.current) return;

    const rehash = async () => {
      setFileLoading(true);
      try {
        const buffer = loadedFileBufferRef.current!;
        let hash = "";
        if (activeVariant === "sha-1") {
          hash = await computeWebCrypto("SHA-1", buffer);
        } else if (activeVariant === "sha-256") {
          hash = await computeWebCrypto("SHA-256", buffer);
        } else if (activeVariant === "sha-512") {
          hash = await computeWebCrypto("SHA-512", buffer);
        } else if (activeVariant === "sha3-256") {
          hash = Sha3.hash256(buffer);
        } else if (activeVariant === "sha3-512") {
          hash = Sha3.hash512(buffer);
        }
        setFileHash(hash);
      } catch (err) {
        setFileError("Failed to calculate cryptographic hash.");
      } finally {
        setFileLoading(false);
      }
    };

    rehash();
  }, [activeVariant, activeMode]);

  // File chunking and reader loop
  const processFile = useCallback((file: File) => {
    setFileError("");
    setFileHash("");
    setFileInfo(null);
    setFileProgress(0);
    loadedFileBufferRef.current = null;

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB Limit
    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File exceeds the 100 MB safety limit (${(file.size / 1024 / 1024).toFixed(2)} MB). Please select a smaller file.`
      );
      return;
    }

    setFileInfo({ name: file.name, size: file.size });
    setFileLoading(true);

    let fileBuffer: Uint8Array;
    try {
      fileBuffer = new Uint8Array(file.size);
    } catch (err) {
      setFileError("Memory allocation failed. File is too large for browser buffers.");
      setFileLoading(false);
      return;
    }

    let offset = 0;

    const readNextChunk = () => {
      if (offset >= file.size) {
        loadedFileBufferRef.current = fileBuffer;
        calculateHash(fileBuffer);
        return;
      }

      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const reader = new FileReader();

      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        fileBuffer.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;

        const pct = Math.round((offset / file.size) * 100);
        setFileProgress(pct);

        requestAnimationFrame(readNextChunk);
      };

      reader.onerror = () => {
        setFileError("Failed to read local file chunk.");
        setFileLoading(false);
      };

      reader.readAsArrayBuffer(chunk);
    };

    const calculateHash = async (buffer: Uint8Array) => {
      try {
        let hash = "";
        if (activeVariant === "sha-1") {
          hash = await computeWebCrypto("SHA-1", buffer);
        } else if (activeVariant === "sha-256") {
          hash = await computeWebCrypto("SHA-256", buffer);
        } else if (activeVariant === "sha-512") {
          hash = await computeWebCrypto("SHA-512", buffer);
        } else if (activeVariant === "sha3-256") {
          hash = Sha3.hash256(buffer);
        } else if (activeVariant === "sha3-512") {
          hash = Sha3.hash512(buffer);
        }
        setFileHash(hash);
      } catch (err) {
        setFileError("Failed to calculate cryptographic hash.");
      } finally {
        setFileLoading(false);
      }
    };

    readNextChunk();
  }, [activeVariant]);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const copyRowHash = async (hash: string, idx: number) => {
    try {
      const h = uppercase ? hash.toUpperCase() : hash;
      await navigator.clipboard.writeText(h);
      setCopiedRowIndex(idx);
      setTimeout(() => setCopiedRowIndex(null), 1500);
    } catch {
      // fallback
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const currentRawHash = (() => {
    if (activeMode === "single") return singleHash;
    if (activeMode === "file") return fileHash;
    return "";
  })();

  const currentDisplayHash = uppercase ? currentRawHash.toUpperCase() : currentRawHash;

  // Checksum match properties
  const isMatch = targetChecksum && currentDisplayHash && targetChecksum.trim().toLowerCase() === currentRawHash.toLowerCase();
  const hasVerificationText = targetChecksum.trim() !== "";

  return (
    <div className="w-full space-y-8">
      {/* Structured Schema Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "SHA Hash Generator & Checksum Tool Suite",
            description: "High-performance client-side tool to calculate SHA-1, SHA-256, SHA-512, and SHA-3-256/512 hashes. Securely validates digests entirely inside your browser.",
            url: "https://www.twistertools.com/tools/developer-tools/sha-generator",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD"
            },
            featureList: [
              "Secure client-side SHA-1, SHA-256, and SHA-512 using SubtleCrypto",
              "Hardware-accelerated processing",
              "Lightweight BigInt Keccak-f[1600] implementation for SHA-3 (256/512)",
              "Bulk multi-line text hashing dashboard",
              "Block-based drag-and-drop file hashing up to 100MB",
              "Interactive checksum verification shield matching",
              "Uppercase and lowercase hexadecimal outputs"
            ],
            browserRequirements: "Requires browser with SubtleCrypto and JavaScript support"
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Is it possible to reverse-engineer a SHA hash back to text?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. The Secure Hash Algorithm family operates as a strictly one-way mathematical function. It strips away variable input constraints to compute a fixed-size signature, rendering mathematical reversal impossible. Recovery is restricted solely to brute-force dictionary attacks matching identical inputs."
                }
              },
              {
                "@type": "Question",
                name: "What indicates a hash collision event?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A collision occurs when two completely independent data streams resolve to the exact same output digest value. While legacy configurations like SHA-1 are practically vulnerable to theoretical collision attacks, SHA-256 and SHA-3 have zero recorded real-world collisions due to their massive structural mathematical output space."
                }
              }
            ]
          })
        }}
      />

      {/* ── Two-Column Dashboard Grid ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* ══════════════════ LEFT WORKSPACE PANEL (8-COLUMNS) ══════════════════ */}
        <div className="lg:col-span-8 space-y-6">

          {/* Mode Tab Selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(
              [
                { id: "single", label: "Text Mode", icon: AlignLeft },
                { id: "bulk", label: "Bulk Mode", icon: FileText },
                { id: "file", label: "File Mode", icon: HardDrive }
              ] as { id: InputMode; label: string; icon: React.ElementType }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`sha-tab-${id}`}
                onClick={() => setActiveMode(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[40px] border whitespace-nowrap flex-shrink-0 ${activeMode === id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Algorithmic Selection Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              Cryptographic Algorithm Variant
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(
                [
                  { id: "sha-1", label: "SHA-1", desc: "160-bit (Legacy)" },
                  { id: "sha-256", label: "SHA-256", desc: "256-bit (Standard)" },
                  { id: "sha-512", label: "SHA-512", desc: "512-bit (Heavy)" },
                  { id: "sha3-256", label: "SHA-3 (256)", desc: "256-bit (Sponge)" },
                  { id: "sha3-512", label: "SHA-3 (512)", desc: "512-bit (Sponge)" }
                ] as { id: HashVariant; label: string; desc: string }[]
              ).map(({ id, label, desc }) => (
                <button
                  key={id}
                  onClick={() => setActiveVariant(id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 min-h-[50px] ${activeVariant === id
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-slate-900"
                    }`}
                >
                  <span className="text-sm font-bold">{label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Text Mode ── */}
          {activeMode === "single" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="sha-single-input"
                  className="block text-sm font-semibold text-slate-900 dark:text-white mb-2"
                >
                  Input Plaintext
                </label>
                <textarea
                  id="sha-single-input"
                  value={singleInput}
                  onChange={(e) => setSingleInput(e.target.value)}
                  placeholder={`Type or paste the contents to calculate the ${activeVariant.toUpperCase()} digest dynamically...`}
                  rows={10}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all"
                />
              </div>

              {/* Text Area Statistics */}
              <div className="grid grid-cols-3 gap-4 pt-1">
                {[
                  { label: "Characters", value: textStats.charCount },
                  { label: "Bytes (UTF-8)", value: textStats.byteSize },
                  { label: "Words", value: textStats.wordCount }
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3 text-center">
                    <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="block text-lg font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Bulk Mode ── */}
          {activeMode === "bulk" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="sha-bulk-input"
                  className="block text-sm font-semibold text-slate-900 dark:text-white mb-1"
                >
                  Multi-Line Batch Input
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Each line is processed as a separate independent string.
                </p>
                <textarea
                  id="sha-bulk-input"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={`first_string\nsecond_string\nthird_string\nusername:password`}
                  rows={10}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all font-mono"
                />
              </div>

              {bulkRows.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Calculated Aligned Results
                    <span className="ml-2 text-xs font-normal text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
                      {bulkRows.length} {bulkRows.length === 1 ? "line" : "lines"}
                    </span>
                  </span>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 w-[30%]">Raw Text</th>
                          <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">{activeVariant.toUpperCase()} Hash</th>
                          <th className="px-4 py-3 w-12 text-center">Copy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800/80">
                        {bulkRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/30 dark:bg-slate-900/30"
                              }`}
                          >
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-350 max-w-[160px] truncate" title={row.original}>
                              {row.original}
                            </td>
                            <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400 break-all leading-normal">
                              {uppercase ? row.hash.toUpperCase() : row.hash}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => copyRowHash(row.hash, idx)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-500 dark:text-slate-400 transition-all border border-slate-200/40 dark:border-slate-700/40"
                                title="Copy row hash"
                              >
                                {copiedRowIndex === idx ? (
                                  <Check className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
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

          {/* ── File Mode ── */}
          {activeMode === "file" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Local File Target
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Calculated locally within the browser thread via block-slice streams. Zero network transfers. Supports files up to 100 MB.
                </p>

                {/* Drag and Drop Zone */}
                <div
                  id="sha-drop-zone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-12 px-6 ${isDragging
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/10"
                      : fileInfo && !fileError
                        ? "border-green-400 dark:border-green-800 bg-green-50/10"
                        : fileError
                          ? "border-red-400 dark:border-red-900 bg-red-50/10"
                          : "border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/5"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    id="sha-file-input"
                  />

                  {fileLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        Processing Local File Stream...
                      </p>
                      <div className="w-48 bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                          style={{ width: `${fileProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{fileProgress}% Complete</p>
                    </div>
                  ) : fileError ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">{fileError}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileError("");
                          setFileInfo(null);
                          setFileHash("");
                          loadedFileBufferRef.current = null;
                        }}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline min-h-[40px]"
                      >
                        Try another file
                      </button>
                    </div>
                  ) : fileInfo ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-950 flex items-center justify-center">
                        <HardDrive className="w-7 h-7 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fileInfo.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
                          {formatFileSize(fileInfo.size)}
                        </p>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Checksum ready for the selected file
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileInfo(null);
                          setFileHash("");
                          setFileError("");
                          loadedFileBufferRef.current = null;
                        }}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:underline transition-colors min-h-[40px]"
                      >
                        Select a different file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-350">
                          {isDragging ? "Drop file to start processing" : "Drag & drop files here"}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-450 mt-1">
                          or click to browse local storage &mdash; up to 100 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ══════════════════ RIGHT STICKY OUTPUT PANEL (4-COLUMNS) ══════════════════ */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">

          {/* Sticky Output Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold tracking-wide">
                  {activeVariant.toUpperCase()} Digest Output
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Uppercase format switcher */}
              <div className="flex items-center justify-between">
                <label
                  htmlFor="sha-uppercase-toggle"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Uppercase Hex Format
                </label>
                <button
                  id="sha-uppercase-toggle"
                  role="switch"
                  aria-checked={uppercase}
                  onClick={() => setUppercase((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${uppercase ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-100 shadow-md ring-0 transition-transform duration-200 ${uppercase ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>

              {/* Hash Display Area */}
              <div className="rounded-xl bg-slate-900 border border-slate-750 p-4 min-h-[90px] flex items-center">
                {currentRawHash ? (
                  <p
                    id="sha-hash-output"
                    className="font-mono text-indigo-400 dark:text-indigo-300 text-sm break-all leading-relaxed w-full selection:bg-indigo-500 selection:text-white"
                  >
                    {currentDisplayHash}
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm italic w-full text-center">
                    {activeMode === "single"
                      ? "Start typing to generate hash..."
                      : activeMode === "file"
                        ? "Upload a file to see its checksum..."
                        : "Bulk hashes appear in row outputs below..."}
                  </p>
                )}
              </div>

              {/* Quick stats on generated hash */}
              {currentRawHash && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                  Length: {currentRawHash.length * 4} bits ({currentRawHash.length} hex chars)
                </p>
              )}

              {/* Main Copy Action */}
              <button
                id="sha-copy-button"
                onClick={() => currentDisplayHash && copyToClipboard(currentDisplayHash)}
                disabled={!currentDisplayHash}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${currentDisplayHash
                    ? copied
                      ? "bg-green-500 text-white shadow-md shadow-green-100 dark:shadow-none"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
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

              {/* Verification Shield Input Area */}
              <div className="border-t border-slate-150 dark:border-slate-850 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Checksum Verification Shield
                </h4>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={targetChecksum}
                    onChange={(e) => setTargetChecksum(e.target.value)}
                    placeholder="Paste target checksum to match..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />

                  {hasVerificationText && (
                    <div
                      className={`rounded-xl p-3 border text-xs font-semibold transition-all flex items-start gap-2 ${isMatch
                          ? "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-900/60 text-green-700 dark:text-green-400"
                          : "bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400"
                        }`}
                    >
                      {isMatch ? (
                        <>
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Checksum Match!</p>
                            <p className="font-normal mt-0.5">The digests are identical. Data integrity verified.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Checksum Discrepancy</p>
                            <p className="font-normal mt-0.5">Digests do not match. Verify source parameters.</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Zero data exposure disclaimer */}
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl px-3 py-2.5">
                <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  <strong className="text-slate-850 dark:text-slate-300">100% Client-Side.</strong> Hashing is executed locally. No parameters are sent over the network.
                </p>
              </div>

            </div>
          </div>

          {/* Quick Specifications Card */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
              Tool Specifications
            </h4>
            <div className="space-y-2 text-xs">
              {[
                { label: "SHA-1 Length", value: "160 bits (40 hex chars)" },
                { label: "SHA-256 Length", value: "256 bits (64 hex chars)" },
                { label: "SHA-512 Length", value: "512 bits (128 hex chars)" },
                { label: "SHA-3 Length", value: "256 / 512 bits" },
                { label: "Browser Sandbox", value: "Active (Local processing)" },
                { label: "Max File Limit", value: "100 MB" }
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center gap-4">
                  <span className="text-slate-500 dark:text-slate-450">{label}</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO AUTHORITATIVE CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-6 pt-4">

        {/* SECTION 1: Deep Definitative Reference Guide */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            The Ultimate Technical Guide to the Secure Hash Algorithm (SHA) Suite
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-4">
            The Secure Hash Algorithm (SHA) family represents a cornerstone of modern digital security, cryptography, and data integrity verification systems. Originally formulated by the National Institute of Standards and Technology (NIST) alongside the National Security Agency (NSA), these mathematical algorithms act as one-way compression pipelines. They ingest data packages of arbitrary lengths—ranging from plain text strings to multi-gigabyte disk images—and compress them into a rigid, immutable, fixed-bit character fingerprint known as a cryptographic checksum or digest.
          </p>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-4">
            A true production-grade cryptographic hash depends fundamentally on three core operational axioms: **Pre-image resistance** (given a hash value $h$, it must be computationally impossible to isolate the original message $x$ such that $H(x) = h$), **Second pre-image resistance** (given an initial message $x_1$, finding an independent message $x_2$ that resolves to an identical digest is mathematically unfeasible), and **Collision resistance** (isolating any two entirely distinct inputs that yield matching outputs must be functionally impossible within realistic timelines).
          </p>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
            Our advanced validation environment executes these intensive geometric matrix transformations directly within your browser's sandboxed script execution engine. Because processing scales entirely within client-side memory structures, sensitive data payloads or raw token streams never transition across an external network router, maximizing infrastructure privacy while taking full advantage of localized hardware acceleration.
          </p>
        </section>

        {/* SECTION 2: High-Density Cryptographic Comparison Matrix */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm mt-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <Hash className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            Architectural Specifications: SHA-1, SHA-2, and SHA-3 Comparison
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            Selecting the appropriate hash primitive requires understanding structural variations across mathematical designs, block boundaries, internal word registers, and vulnerability baselines. The table below outlines the foundational specifications across standard operational configurations:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 dark:bg-slate-950 text-white">
                <tr>
                  {["Algorithm Variant", "Output Length", "Internal Block Size", "Mathematical Structure", "Security / Vulnerability Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["SHA-1", "160 Bits (40 Hex Chars)", "512 Bits (32-bit words)", "Merkle-Damgård Construction", "Deprecated. Practically vulnerable to collision attacks."],
                  ["SHA-256", "256 Bits (64 Hex Chars)", "512 Bits (32-bit words)", "Merkle-Damgård / Davies-Meyer", "Industry Standard. Robust security for ledger state and compliance."],
                  ["SHA-512", "512 Bits (128 Hex Chars)", "1024 Bits (64-bit words)", "Merkle-Damgård Construction", "Highly secure. Optimized for high-throughput 64-bit hardware systems."],
                  ["SHA-3 (256)", "256 Bits (64 Hex Chars)", "1600 Bits (State size)", "Keccak Permutation Sponge", "Next-Gen standard. Immune to length-extension vector exploits."]
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-850/50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm ${
                          j === 0
                            ? "font-semibold text-slate-700 dark:text-slate-300"
                            : j === 1
                              ? "text-indigo-700 dark:text-indigo-400 font-medium"
                              : j === 4
                                ? i === 0
                                  ? "text-red-650 font-medium bg-red-50/30 dark:bg-red-950/10"
                                  : i === 1
                                    ? "text-emerald-650 font-medium bg-emerald-50/30 dark:bg-emerald-950/10"
                                    : "text-emerald-650 font-medium bg-emerald-50/30 dark:bg-emerald-950/10"
                                : "text-slate-650 dark:text-slate-400"
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
        </section>

        {/* SECTION 3: Detailed Step-by-Step Mathematical Flow */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm mt-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            The Internal Mechanics: How the Compression Engine Works
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            To illustrate the transformation pipeline inside the standard SHA-256 process, data payloads move systematically through three core algorithmic phases:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-3">1</div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Padding & Block Parsing</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                The raw string array is appended with a single termination bit (1) followed by an exact number of zero bits (0) until the payload length congruent to 448 mod 512 is reached. The final 64 bits are injected with an explicit big-endian representation of the original message size, ensuring variations in string boundaries generate distinct initialized blocks.
              </p>
            </div>
            <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-3">2</div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">The 64-Round Compression Loop</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
                The system populates eight working registers ($A, B, C, D, E, F, G, H$) with specialized constant fractional square roots. For each individual block, the algorithm parses message arrays through 64 consecutive iterations utilizing non-linear logical operations: Majority ($Maj$), Choice ($Ch$), and bitwise Sigma rotations ($\Sigma_0, \Sigma_1$), generating complete bit-level diffusion.
              </p>
            </div>
            <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-3">3</div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">State Aggregation & Output</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Once all message blocks have been processed through the compression pipeline, the working registers are accumulated with their initial hash vectors via addition modulo $2^{32}$. The resulting state values are concatenated and mapped directly into a continuous lowercase or uppercase hexadecimal digest stream.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: Real-World Code Examples */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm mt-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <Terminal className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            Programmatic Implementation Reference
          </h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-4">
            For engineering environments requiring programmatic generation outside of our visual utility workspace, these examples demonstrate how to compute standardized SHA-256 digests natively across core modern application runtimes:
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Modern JavaScript / Web Crypto API</h3>
              <pre className="bg-slate-950 text-slate-200 rounded-xl p-4 text-xs font-mono overflow-x-auto border border-slate-800">
{`async function generateSHA256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}`}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Python 3 (Standard Library)</h3>
              <pre className="bg-slate-950 text-slate-200 rounded-xl p-4 text-xs font-mono overflow-x-auto border border-slate-800">
{`import hashlib

def calculate_sha256(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()`}
              </pre>
            </div>
          </div>
        </section>

        {/* SECTION 5: Comprehensive Practical Use Cases */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm mt-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            Strategic Use Cases for Security Professionals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-2">Software Package Integrity Checks</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Distribution mirrors release explicit SHA-256 hashes alongside software binaries. System administrators run a checksum validation to guarantee files haven't been modified, injected with malicious code, or corrupted during transmission.
              </p>
            </div>
            <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-2">Distributed Ledger State Tracking</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Blockchains rely on hashing pipelines like SHA-256 to recursively link transactions through cryptographic structures called Merkle trees. Altering even a single character breaks historical state continuity instantly.
              </p>
            </div>
            <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-2">Data Deduplication Engine Optimization</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Enterprise file storage networks catalog blocks by their hash signatures instead of names. If two distinct directory assets share identical SHA-512 signatures, storage pipelines deduplicate structural footprints instantly.
              </p>
            </div>
            <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-2">Digital Signature Verification Architecture</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Instead of encrypting massive documents directly with a private key, security protocols sign a compact SHA hash. This optimizes processing overhead while ensuring non-repudiation and structural alignment remain fully intact.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: Authoritative FAQ Section */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-950/20 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm mt-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "What is the structural difference between SHA-2 and SHA-3?",
                a: "SHA-2 is built on the classic Merkle-Damgård construction framework, which functions by processing sequential blocks. Because of this structural alignment, it is theoretically vulnerable to length-extension vector attacks if not protected by a keyed HMAC layer. SHA-3, conversely, leverages the modern Keccak permutation sponge construction, allowing data to be dynamically absorbed into internal state channels before being squeezed out as a digest, making it inherently immune to length-extension exploits."
              },
              {
                q: "Can SHA hashes be safely used for user password hashing databases?",
                a: "No. Raw SHA functions are designed to operate at maximum hardware efficiency to process massive datasets rapidly. This design makes them highly susceptible to optimized GPU-driven brute-force attacks or pre-computed Rainbow Table mapping attempts. Password storage architectures should instead employ specialized key-stretching functions like Argon2id, bcrypt, or PBKDF2, which integrate configurable work factors and localized salt handling to slow down brute-force hardware clusters."
              },
              {
                q: "Does generating a hash stream send any data back to your servers?",
                a: "Absolutely not. This platform functions entirely as a secure, client-side utility runtime. All cryptographic logic, block processing loop hooks, and hexadecimal translations are executed natively within your browser's sandboxed environment via Web Crypto primitives and Javascript. Your string data, intellectual properties, and local file elements never touch an external server or telemetry channel."
              }
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 dark:text-slate-350 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Tab Icon Helper Fallbacks & AlignLeft
// ─────────────────────────────────────────────────────────────
function AlignLeft(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="21" x2="3" y1="6" y2="6" />
      <line x1="15" x2="3" y1="12" y2="12" />
      <line x1="17" x2="3" y1="18" y2="18" />
    </svg>
  );
}
