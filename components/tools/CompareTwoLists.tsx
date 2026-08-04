"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import JSZip from "jszip";
import {
  ArrowLeftRight,
  Upload,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Download,
  ShieldCheck,
  FileCode,
  FileJson,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Shield,
  Layers,
  ListFilter,
  AtSign,
  FileArchive,
  AlertTriangle,
  Info,
  Database,
  Search,
  Cpu,
  Table,
  Workflow,
  Sparkles,
  BookOpen,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure Helper Functions & Parsing Engines (100% Browser Native)
// ─────────────────────────────────────────────────────────────

type OutputMode = "listA" | "listB" | "aOnly" | "bOnly" | "intersection" | "union" | "symmetric";

interface ProcessingOptions {
  caseSensitive: boolean;
  trimWhitespace: boolean;
  removeDuplicates: boolean;
  sortOutput: boolean;
  instagramMode: boolean;
}

/**
 * Robustly extracts clean Instagram usernames from JSON structures, HTML documents, or text lists.
 */
function extractInstagramUsernames(text: string): string[] {
  if (!text || !text.trim()) return [];

  const usernames = new Set<string>();
  const isIgnoredHandle = (handle: string) =>
    [
      "_u",
      "explore",
      "direct",
      "reels",
      "stories",
      "p",
      "tv",
      "developer",
      "about",
      "help",
      "legal",
      "privacy",
      "terms",
      "locations",
      "instagram",
    ].includes(handle.toLowerCase());

  // 1. JSON Export Parser
  try {
    const json = JSON.parse(text);
    const extractFromObj = (obj: unknown) => {
      if (!obj) return;
      if (typeof obj === "string") {
        if (obj.startsWith("http") && obj.includes("instagram.com/")) {
          const match = obj.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/);
          if (match && match[1] && !isIgnoredHandle(match[1])) {
            usernames.add(match[1]);
          }
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(extractFromObj);
      } else if (typeof obj === "object") {
        const record = obj as Record<string, unknown>;
        if (typeof record.value === "string" && record.value.trim()) {
          const val = record.value.trim().replace(/^@/, "");
          if (/^[a-zA-Z0-9_.-]{1,30}$/.test(val) && !isIgnoredHandle(val)) {
            usernames.add(val);
          }
        }
        if (typeof record.string_list_data === "object" && Array.isArray(record.string_list_data)) {
          record.string_list_data.forEach((item) => {
            if (item && typeof item.value === "string" && item.value.trim()) {
              const val = item.value.trim().replace(/^@/, "");
              if (/^[a-zA-Z0-9_.-]{1,30}$/.test(val) && !isIgnoredHandle(val)) {
                usernames.add(val);
              }
            }
            if (item && typeof item.href === "string") {
              const match = item.href.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/);
              if (match && match[1] && !isIgnoredHandle(match[1])) {
                usernames.add(match[1]);
              }
            }
          });
        }
        Object.values(record).forEach(extractFromObj);
      }
    };
    extractFromObj(json);
    if (usernames.size > 0) return Array.from(usernames);
  } catch {
    // Not valid JSON, proceed to HTML/Text DOM parsing
  }

  // 2. Client-Side HTML DOM Parser (for HTML data exports)
  if (typeof window !== "undefined" && (text.includes("<html") || text.includes("<div") || text.includes("<table") || text.includes("<a"))) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      // Strategy A: Check H2 headers (Instagram HTML export format for following.html)
      const h2Elements = doc.querySelectorAll("h2");
      h2Elements.forEach((h2) => {
        const txt = h2.textContent?.trim().replace(/^@/, "") || "";
        if (/^[a-zA-Z0-9_.-]{1,30}$/.test(txt) && !isIgnoredHandle(txt)) {
          usernames.add(txt);
        }
      });

      // Strategy B: Check HTML links pointing to instagram.com/_u/username or instagram.com/username
      const anchors = doc.querySelectorAll("a[href*='instagram.com']");
      anchors.forEach((a) => {
        const href = a.getAttribute("href") || "";
        const match = href.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/);
        if (match && match[1] && !isIgnoredHandle(match[1])) {
          usernames.add(match[1]);
        } else {
          const anchorText = a.textContent?.trim().replace(/^@/, "") || "";
          if (/^[a-zA-Z0-9_.-]{1,30}$/.test(anchorText) && !isIgnoredHandle(anchorText)) {
            usernames.add(anchorText);
          }
        }
      });

      // Strategy C: Table cells (Instagram HTML exports format: Username / Όνομα χρήστη)
      const rows = doc.querySelectorAll("tr, div._a6-g, div.pam");
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll("td, div, span"));
        for (let i = 0; i < cells.length; i++) {
          const cellText = cells[i].textContent?.trim().toLowerCase() || "";
          if (cellText.includes("username") || cellText.includes("όνομα χρήστη")) {
            const valueCell = cells[i + 1] || cells[i];
            const candidate = valueCell?.textContent?.trim().replace(/^@/, "") || "";
            if (/^[a-zA-Z0-9_.-]{1,30}$/.test(candidate) && !isIgnoredHandle(candidate)) {
              usernames.add(candidate);
            }
          }
        }
      });

      if (usernames.size > 0) return Array.from(usernames);
    } catch {
      /* Fallback to regex if DOMParser fails */
    }
  }

  // 3. Fallback Regex for URL patterns
  const hrefRegex = /href=["'](?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:_u\/)?([a-zA-Z0-9_.-]+)\/?["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(text)) !== null) {
    if (match[1] && !isIgnoredHandle(match[1])) {
      usernames.add(match[1]);
    }
  }

  // 4. Plain Text Fallback
  if (usernames.size === 0) {
    const lines = text.split(/\r?\n/);
    lines.forEach((line) => {
      const trimmed = line.trim().replace(/^@/, "");
      if (/^[a-zA-Z0-9_.-]{1,30}$/.test(trimmed) && !isIgnoredHandle(trimmed)) {
        usernames.add(trimmed);
      }
    });
  }

  return Array.from(usernames);
}

/**
 * Normalizes raw multiline text into a cleaned array of items based on options.
 */
function parseList(rawText: string, options: ProcessingOptions): string[] {
  if (!rawText.trim()) return [];

  let items: string[] = [];

  if (options.instagramMode) {
    items = extractInstagramUsernames(rawText);
  } else {
    items = rawText.split(/\r?\n/);
  }

  items = items
    .map((item) => (options.trimWhitespace ? item.trim() : item))
    .filter((item) => item.length > 0);

  if (options.removeDuplicates) {
    if (options.caseSensitive) {
      items = Array.from(new Set(items));
    } else {
      const seen = new Set<string>();
      const unique: string[] = [];
      items.forEach((item) => {
        const lower = item.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          unique.push(item);
        }
      });
      items = unique;
    }
  }

  if (options.sortOutput) {
    items.sort((a, b) =>
      options.caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase())
    );
  }

  return items;
}

// ── Sample Data ─────────────────────────────────────────────
const SAMPLE_LIST_A = `alpha@example.com
beta@example.com
gamma@example.com
delta@example.com
epsilon@example.com
zeta@example.com`;

const SAMPLE_LIST_B = `beta@example.com
delta@example.com
zeta@example.com
eta@example.com
theta@example.com`;

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function CompareTwoLists() {
  // ── Input State ──
  const [listAText, setListAText] = useState("");
  const [listBText, setListBText] = useState("");
  const [activeTab, setActiveTab] = useState<OutputMode>("aOnly");

  // ── Configuration Options ──
  const [options, setOptions] = useState<ProcessingOptions>({
    caseSensitive: false,
    trimWhitespace: true,
    removeDuplicates: true,
    sortOutput: true,
    instagramMode: false,
  });

  // ── Output & UI State ──
  const [outputItems, setOutputItems] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [zipMessage, setZipMessage] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // ── Set Operation Calculations ──
  const processComparison = useCallback(() => {
    const itemsA = parseList(listAText, options);
    const itemsB = parseList(listBText, options);

    const getCompareKey = (str: string) => (options.caseSensitive ? str : str.toLowerCase());

    const setAKeys = new Set(itemsA.map(getCompareKey));
    const setBKeys = new Set(itemsB.map(getCompareKey));

    let result: string[] = [];

    switch (activeTab) {
      case "listA":
        result = itemsA;
        break;
      case "listB":
        result = itemsB;
        break;
      case "aOnly": // A \ B (In A, missing in B - e.g., Unfollowers)
        result = itemsA.filter((item) => !setBKeys.has(getCompareKey(item)));
        break;
      case "bOnly": // B \ A (In B, missing in A - e.g., Fans/Non-reciprocated by A)
        result = itemsB.filter((item) => !setAKeys.has(getCompareKey(item)));
        break;
      case "intersection": // A ∩ B (Common to both - Mutuals)
        result = itemsA.filter((item) => setBKeys.has(getCompareKey(item)));
        break;
      case "union": // A ∪ B (Combined Unique)
        const combined = [...itemsA, ...itemsB];
        if (options.removeDuplicates) {
          const seen = new Set<string>();
          result = combined.filter((item) => {
            const key = getCompareKey(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        } else {
          result = combined;
        }
        break;
      case "symmetric": // (A \ B) ∪ (B \ A) (Unique to either, but not both)
        const onlyA = itemsA.filter((item) => !setBKeys.has(getCompareKey(item)));
        const onlyB = itemsB.filter((item) => !setAKeys.has(getCompareKey(item)));
        result = [...onlyA, ...onlyB];
        break;
    }

    if (options.sortOutput) {
      result.sort((a, b) =>
        options.caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase())
      );
    }

    setOutputItems(result);
  }, [listAText, listBText, activeTab, options]);

  useEffect(() => {
    processComparison();
  }, [processComparison]);

  // ── Parsed Raw Counts for Metrics ──
  const parsedA = parseList(listAText, options);
  const parsedB = parseList(listBText, options);
  const countA = parsedA.length;
  const countB = parsedB.length;

  // ── File Loaders for Individual Files ──
  const handleSingleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "A" | "B"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (options.instagramMode || file.name.endsWith(".html") || file.name.endsWith(".json")) {
        const cleanedUsernames = extractInstagramUsernames(text);
        if (cleanedUsernames.length > 0) {
          const joined = cleanedUsernames.join("\n");
          if (target === "A") setListAText(joined);
          else setListBText(joined);
          return;
        }
      }
      if (target === "A") setListAText(text);
      else setListBText(text);
    };
    reader.readAsText(file);
  };

  // ── Instagram Zip Unpacker (Safe Client-Side Unfollow Finder) ──
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingZip(true);
    setZipError(null);
    setZipMessage("Unzipping Instagram archive securely in your browser...");

    try {
      const zip = new JSZip();
      const unzipped = await zip.loadAsync(file);

      let rawFollowersContent = "";
      let rawFollowingContent = "";

      const filePaths = Object.keys(unzipped.files);

      for (const path of filePaths) {
        const filename = path.split("/").pop()?.toLowerCase() || "";

        // Precise filename matching regardless of parent directory structure
        if (
          filename === "followers_1.html" ||
          filename === "followers_1.json" ||
          filename === "followers.html" ||
          filename === "followers.json"
        ) {
          rawFollowersContent += "\n" + (await unzipped.files[path].async("text"));
        }

        if (
          filename === "following.html" ||
          filename === "following.json" ||
          filename === "following_1.html" ||
          filename === "following_1.json"
        ) {
          rawFollowingContent += "\n" + (await unzipped.files[path].async("text"));
        }
      }

      if (!rawFollowersContent && !rawFollowingContent) {
        throw new Error(
          "Could not find followers or following files in the zip archive. Please ensure you uploaded an official Instagram Data Export ZIP."
        );
      }

      // Automatically enable Instagram Mode
      setOptions((prev) => ({ ...prev, instagramMode: true }));

      // Extract clean usernames BEFORE assigning to textarea state
      const followersUsernames = extractInstagramUsernames(rawFollowersContent);
      const followingUsernames = extractInstagramUsernames(rawFollowingContent);

      if (followersUsernames.length === 0 && followingUsernames.length === 0) {
        throw new Error(
          "Could not parse any valid usernames from the extracted archive files. Make sure the ZIP contains official Instagram data."
        );
      }

      setListBText(followersUsernames.join("\n")); // Followers in List B
      setListAText(followingUsernames.join("\n")); // Following in List A
      setActiveTab("aOnly"); // Show accounts you follow who don't follow back (Unfollowers)

      setZipMessage(
        `Successfully extracted ${followingUsernames.length} Following and ${followersUsernames.length} Followers! Displaying accounts you follow who do not follow back.`
      );
    } catch (err) {
      setZipError(
        err instanceof Error
          ? err.message
          : "Failed to process ZIP archive. Make sure it is a valid zip file."
      );
      setZipMessage(null);
    } finally {
      setIsProcessingZip(false);
    }
  };

  // ── Clipboard & Download ──
  const copyToClipboard = async () => {
    const text = outputItems.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  };

  const downloadTxt = () => {
    const text = outputItems.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `list-comparison-${activeTab}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadSample = () => {
    setListAText(SAMPLE_LIST_A);
    setListBText(SAMPLE_LIST_B);
    setZipMessage(null);
    setZipError(null);
  };

  const clearWorkspace = () => {
    setListAText("");
    setListBText("");
    setOutputItems([]);
    setZipMessage(null);
    setZipError(null);
  };

  return (
    <div className="w-full space-y-8">
      {/* ── Global Banner for ZIP / Instagram Quick Action ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
              <FileArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                Instagram Followers & ZIP Archive Parser
                <span className="bg-indigo-500/30 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  100% Client-Side
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Upload your Instagram data ZIP file (HTML or JSON) to instantly detect non-reciprocal accounts (unfollowers) without sharing passwords.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleZipUpload}
              id="instagram-zip-input"
            />
            <button
              onClick={() => zipInputRef.current?.click()}
              disabled={isProcessingZip}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 shadow-md min-h-[40px] disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isProcessingZip ? "Unzipping Archive..." : "Upload IG Data ZIP"}
            </button>
          </div>
        </div>

        {zipMessage && (
          <div className="mt-4 bg-emerald-500/10 text-emerald-300 rounded-xl p-3 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{zipMessage}</span>
          </div>
        )}
        {zipError && (
          <div className="mt-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{zipError}</span>
          </div>
        )}
      </div>

      {/* ── Two-Column Workspace Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: LIST A & LIST B INPUTS ══════════════════ */}
        <div className="space-y-6">
          {/* List A Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-700">A</span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  First List (List A / Following)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputARef}
                  type="file"
                  accept=".txt,.csv,.json,.html"
                  className="hidden"
                  onChange={(e) => handleSingleFileUpload(e, "A")}
                />
                <button
                  onClick={() => fileInputARef.current?.click()}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Load File
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <textarea
                id="list-a-input"
                value={listAText}
                onChange={(e) => setListAText(e.target.value)}
                placeholder={
                  options.instagramMode
                    ? "Paste HTML, JSON, or list of handles for List A (e.g. accounts you follow)..."
                    : "Paste items for List A (one item per line)..."
                }
                className="font-mono text-xs sm:text-sm h-[220px] focus:ring-2 focus:ring-indigo-600 outline-none p-3.5 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none"
              />
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Items counted: <strong className="text-slate-800 font-mono">{countA}</strong></span>
                <button
                  onClick={() => setListAText("")}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear A
                </button>
              </div>
            </div>
          </div>

          {/* List B Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-700">B</span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  Second List (List B / Followers)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputBRef}
                  type="file"
                  accept=".txt,.csv,.json,.html"
                  className="hidden"
                  onChange={(e) => handleSingleFileUpload(e, "B")}
                />
                <button
                  onClick={() => fileInputBRef.current?.click()}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Load File
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <textarea
                id="list-b-input"
                value={listBText}
                onChange={(e) => setListBText(e.target.value)}
                placeholder={
                  options.instagramMode
                    ? "Paste HTML, JSON, or list of handles for List B (e.g. accounts following you)..."
                    : "Paste items for List B (one item per line)..."
                }
                className="font-mono text-xs sm:text-sm h-[220px] focus:ring-2 focus:ring-indigo-600 outline-none p-3.5 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none"
              />
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Items counted: <strong className="text-slate-800 font-mono">{countB}</strong></span>
                <button
                  onClick={() => setListBText("")}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear B
                </button>
              </div>
            </div>
          </div>

          {/* Controls & Options Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Comparison & Parsing Rules
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:bg-indigo-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.instagramMode}
                  onChange={(e) =>
                    setOptions((p) => ({ ...p, instagramMode: e.target.checked }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-pink-600" />
                  Instagram Extractor
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:bg-indigo-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.caseSensitive}
                  onChange={(e) =>
                    setOptions((p) => ({ ...p, caseSensitive: e.target.checked }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>Case Sensitive</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:bg-indigo-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.removeDuplicates}
                  onChange={(e) =>
                    setOptions((p) => ({ ...p, removeDuplicates: e.target.checked }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>Deduplicate Items</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:bg-indigo-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.sortOutput}
                  onChange={(e) =>
                    setOptions((p) => ({ ...p, sortOutput: e.target.checked }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>Alphabetical Sort</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={loadSample}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Load Sample Data
              </button>
              <button
                onClick={clearWorkspace}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Lists
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: RESULTS & SET DIFFERENCES ══════════════════ */}
        <div className="sticky top-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-3.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">Set Comparison Results</span>
              </div>
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-mono font-medium">
                {outputItems.length} items
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Set Operation Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                {[
                  { id: "aOnly" as OutputMode, label: "Only in A (A \\ B)" },
                  { id: "bOnly" as OutputMode, label: "Only in B (B \\ A)" },
                  { id: "intersection" as OutputMode, label: "Intersection (A ∩ B)" },
                  { id: "union" as OutputMode, label: "Union (A ∪ B)" },
                  { id: "symmetric" as OutputMode, label: "Symmetric Diff" },
                  { id: "listA" as OutputMode, label: "Original List A" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all text-center min-h-[36px] flex items-center justify-center ${
                      activeTab === id
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Formula Explanation Banner */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>
                  {activeTab === "aOnly" && (
                    <>
                      <strong>In List A, but NOT in List B:</strong> Useful for finding who you follow on IG that doesn&apos;t follow you back (Unfollowers).
                    </>
                  )}
                  {activeTab === "bOnly" && (
                    <>
                      <strong>In List B, but NOT in List A:</strong> Shows items unique to List B (e.g. Followers you don&apos;t follow back).
                    </>
                  )}
                  {activeTab === "intersection" && (
                    <>
                      <strong>Common to Both Lists (Intersection):</strong> Items existing in both List A and List B (Mutuals).
                    </>
                  )}
                  {activeTab === "union" && (
                    <>
                      <strong>Combined Unique Items (Union):</strong> Master list containing all distinct items from both datasets.
                    </>
                  )}
                  {activeTab === "symmetric" && (
                    <>
                      <strong>Symmetric Difference:</strong> Items that exist in either List A or List B, but NOT in both.
                    </>
                  )}
                  {activeTab === "listA" && (
                    <>
                      <strong>Cleaned List A:</strong> Showing normalized items from List A.
                    </>
                  )}
                </span>
              </div>

              {/* Results Textarea */}
              <textarea
                readOnly
                value={outputItems.join("\n")}
                placeholder="Results will appear here based on selected set operation..."
                className="font-mono text-xs sm:text-sm h-[380px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none cursor-pointer"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />

              {/* Operational Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyToClipboard}
                  disabled={outputItems.length === 0}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                    outputItems.length > 0
                      ? copied
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Output
                    </>
                  )}
                </button>

                <button
                  onClick={downloadTxt}
                  disabled={outputItems.length === 0}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all duration-200 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" /> Download .TXT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        {/* Card 1: Mathematical Set Theory & Algorithmic Set Operations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Mathematical Set Theory & Discrete List Analysis</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Comparing two distinct data arrays to discover missing records, overlapping identifiers, or unique entries is a fundamental operational pattern across software architecture, database management, and digital audience auditing. Our <strong>Compare Two Lists & Set Difference Finder</strong> implements high-performance mathematical set algorithms natively in your browser to transform raw text blocks into actionable set operations instantly.
            </p>
            <p>
              In formal mathematical notation, two collections of data points $A$ and $B$ within a universal set $U$ can be evaluated through standard discrete set operators:
            </p>
            <div className="grid md:grid-cols-2 gap-4 my-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-xs">$A \setminus B$</span>
                  Relative Complement (Difference A - B)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Computes all elements contained within set $A$ that do not exist in set $B$. Commonly used to isolate dropped leads, missing database entries, or accounts you follow who do not follow you back.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-xs">$B \setminus A$</span>
                  Relative Complement (Difference B - A)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Computes all elements contained in set $B$ that are missing from set $A$. Ideal for identifying incoming audience fans, prospective additions, or target delta sets.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-xs">$A \cap B$</span>
                  Intersection (Mutual Matches)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Isolates only the mutual items shared identically by both sets. Used for finding common subscribers, mutual followers, or identical API key registers.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-xs">$A \Delta B$</span>
                  Symmetric Difference
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Calculates $(A \setminus B) \cup (B \setminus A)$, returning all entries unique to either set while completely filtering out mutual elements.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Technical Architecture & In-Memory Unpack Engine */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Algorithmic Processing & In-Memory Parsing Pipeline</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Unlike conventional web utilities that upload user files to remote cloud servers for execution, TwisterTools processes all inputs inside your client browser sandbox. Our engine leverages an $O(N)$ linear time hash-lookup algorithm to handle datasets containing over 100,000 items in milliseconds.
            </p>
            <div className="grid md:grid-cols-4 gap-3 text-xs sm:text-sm">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">1</div>
                <h3 className="font-semibold text-slate-900">1. Stream Decoding</h3>
                <p className="text-slate-600 text-xs">Input streams or uploaded ZIP buffers are converted into raw text vectors without server transmission.</p>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">2</div>
                <h3 className="font-semibold text-slate-900">2. Pattern Extraction</h3>
                <p className="text-slate-600 text-xs">DOM and Regex parsers strip HTML markup, tables, JSON keys, and timestamps to extract clean handles.</p>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">3</div>
                <h3 className="font-semibold text-slate-900">3. Hash Set Indexing</h3>
                <p className="text-slate-600 text-xs">List items are loaded into JavaScript <code>Set</code> objects for instant constant-time $O(1)$ membership checks.</p>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">4</div>
                <h3 className="font-semibold text-slate-900">4. Set Result Output</h3>
                <p className="text-slate-600 text-xs">Selected set difference logic executes instantly, returning deduplicated and sorted lists.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Safe Instagram Unfollower Auditing Protocol */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Zero-Risk Client-Side Instagram Follower & Unfollow Audit</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Traditional online follower apps require users to input their account passwords or grant OAuth session cookies to external web servers. This practice frequently results in flagged accounts, action blocks, or compromise. 
            </p>
            <p>
              Our tool provides a 100% legal, non-invasive alternative by working directly with your official Meta Data Export ZIP file:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Step-by-Step Instagram Audit Instructions:
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-slate-700">
                <li>Log in to your Instagram mobile app or web browser and navigate to <strong>Settings & Privacy &gt; Accounts Center</strong>.</li>
                <li>Select <strong>Your Information and Permissions &gt; Download Your Information</strong>.</li>
                <li>Choose <strong>Export Specific Information</strong> and select <strong>Followers and Following</strong> (JSON or HTML format).</li>
                <li>Once Meta emails you your official download link, save the <code>.zip</code> file onto your computer or phone.</li>
                <li>Drop the <code>.zip</code> archive directly into our top upload bar. The tool automatically reads <code>followers.json/html</code> and <code>following.json/html</code> in local memory, presenting non-reciprocal accounts under the <strong>Only in A (Unfollowers)</strong> tab.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Card 4: Detailed Set Operation Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Comprehensive Set Comparison Feature Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            Review how each set mode evaluates input collections, along with standard enterprise use cases across software engineering, digital marketing, and database management:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="px-4 py-3 text-sm font-semibold">Set Operation</th>
                  <th className="px-4 py-3 text-sm font-semibold">Set Formula</th>
                  <th className="px-4 py-3 text-sm font-semibold">Primary Use Case</th>
                  <th className="px-4 py-3 text-sm font-semibold">Output Result</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Difference (A \\ B)", "A - B", "Find Instagram Unfollowers / Missing Keys", "Items present in List A, but missing from List B"],
                  ["Difference (B \\ A)", "B - A", "Identify Non-Followed Fans / New Leads", "Items present in List B, but missing from List A"],
                  ["Intersection (A ∩ B)", "A ∩ B", "Mutual Followers / Shared Database Keys", "Items appearing in both List A and List B"],
                  ["Union (A ∪ B)", "A ∪ B", "Merge Email Subscribers / Master Lists", "All distinct items combined from both lists"],
                  ["Symmetric Diff (A Δ B)", "(A\\B) ∪ (B\\A)", "Audit System Sync Discrepancies", "Items unique to either list, excluding common matches"],
                  ["Cleaned List A", "A", "Remove Empty Lines & Deduplicate List A", "Normalized, deduplicated, and sorted List A"],
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-4 py-3 text-xs sm:text-sm text-slate-700 border-b border-slate-100 font-mono"
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

        {/* Card 5: Enterprise Engineering & Audience Growth Applications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Workflow className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Production Workflow & Data Engineering Applications</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5 text-slate-700 text-sm md:text-base">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm">Database Migration Auditing</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Compare exported SQL primary key columns against Elasticsearch indices to verify 100% data sync completion during backend migrations.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm">Email Marketing List Suppression</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Filter unsubscribe lists (List B) out of active broadcast newsletters (List A) prior to launching newsletter campaigns.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm">Social Media Audience Hygiene</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Keep your creator or business profile ratio balanced by identifying non-reciprocal accounts safely without third-party login apps.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm">Code Log Delta Inspection</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Extract newly registered stack trace errors or unique IP addresses across production server log files during security sprints.
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: Frequently Asked Questions */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is it safe and legal to upload my Instagram Data ZIP file to this tool?",
                a: "Yes, 100% safe and legal. The unzipping and HTML/JSON parsing execute locally inside your browser's JavaScript engine using JSZip. No data or credentials are transmitted to any cloud server or stored anywhere.",
              },
              {
                q: "Can this tool handle large email lists or log files?",
                a: "Yes. The parsing algorithm runs in client memory with O(N) lookup efficiency. It can comfortably process and compare lists containing over 100,000 items without browser slowdown.",
              },
              {
                q: "What file formats are supported for list extraction?",
                a: "You can upload standard plain text files (.txt), CSV spreadsheets (.csv), JSON data files (.json), HTML files (.html), or complete compressed archives (.zip).",
              },
              {
                q: "Does this violate Instagram Terms of Service?",
                a: "No. This tool does not perform automated scraping, API calls, or unauthorized account access. It simply provides a local math utility for analyzing official data files you download directly from your own account.",
              },
              {
                q: "What is the difference between Case-Sensitive and Case-Insensitive comparison?",
                a: "In case-sensitive mode, 'User@Example.com' and 'user@example.com' are treated as two distinct items. In case-insensitive mode (default), all strings are normalized to lowercase prior to set calculation.",
              },
            ].map(({ q, a }, idx) => (
              <div
                key={idx}
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
      </section>

      {/* JSON-LD Structured Metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Compare Two Lists & Set Difference Finder",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript.",
            description:
              "Compare two text lists online to find missing items, unfollowers, mutual matches, and set differences. Includes native browser ZIP file extraction for Instagram data.",
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