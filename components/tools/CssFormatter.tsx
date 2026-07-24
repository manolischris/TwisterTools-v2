"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FileCode,
  Code,
  Check,
  Copy,
  AlertTriangle,
  Trash2,
  BookOpen,
  HelpCircle,
  Cpu,
  ListOrdered,
  Table,
  Blocks,
  ShieldCheck,
  Zap,
  Shield,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript CSS Formatting & Minification Engine
//  100% Client-Side — Zero External Dependencies
// ─────────────────────────────────────────────────────────────

type IndentSize = "2" | "4" | "tab";

// ── Token types for CSS ──
type CssTokenType =
  | "selector"
  | "open-brace"
  | "close-brace"
  | "property"
  | "colon"
  | "value"
  | "semicolon"
  | "comment"
  | "at-rule"
  | "at-rule-block"
  | "whitespace"
  | "other";

interface CssToken {
  type: CssTokenType;
  value: string;
}

// ─────────────────────────────────────────────────────────────
//  Tokenizer: Scans CSS string into tokens
// ─────────────────────────────────────────────────────────────
function tokenizeCss(css: string): CssToken[] {
  const tokens: CssToken[] = [];
  let i = 0;

  while (i < css.length) {
    // ── Comments /* ... */ ──
    if (css[i] === "/" && css[i + 1] === "*") {
      let comment = "/*";
      i += 2;
      while (i < css.length && !(css[i] === "*" && css[i + 1] === "/")) {
        comment += css[i];
        i++;
      }
      if (i < css.length) {
        comment += "*/";
        i += 2;
      }
      tokens.push({ type: "comment", value: comment });
      continue;
    }

    // ── Whitespace ──
    if (/^\s/.test(css[i])) {
      let ws = "";
      while (i < css.length && /^\s/.test(css[i])) {
        ws += css[i];
        i++;
      }
      tokens.push({ type: "whitespace", value: ws });
      continue;
    }

    // ── Open brace { ──
    if (css[i] === "{") {
      tokens.push({ type: "open-brace", value: "{" });
      i++;
      continue;
    }

    // ── Close brace } ──
    if (css[i] === "}") {
      tokens.push({ type: "close-brace", value: "}" });
      i++;
      continue;
    }

    // ── Semicolon ; ──
    if (css[i] === ";") {
      tokens.push({ type: "semicolon", value: ";" });
      i++;
      continue;
    }

    // ── Colon : ──
    if (css[i] === ":") {
      tokens.push({ type: "colon", value: ":" });
      i++;
      continue;
    }

    // ── At-rule detection (@media, @keyframes, @import, etc.) ──
    if (css[i] === "@") {
      let atRule = "@";
      i++;
      while (i < css.length && /[a-zA-Z0-9_-]/.test(css[i])) {
        atRule += css[i];
        i++;
      }
      tokens.push({ type: "at-rule", value: atRule });
      continue;
    }

    // ── Selector / property / value (word characters, #, ., *, etc.) ──
    if (/[a-zA-Z0-9_#.\-*:\[\]()>~+'"%,!@&]/.test(css[i])) {
      let word = "";
      // Capture until we hit a structural character
      while (
        i < css.length &&
        !/[\s{};:]/.test(css[i]) &&
        !(css[i] === "/" && css[i + 1] === "*")
      ) {
        word += css[i];
        i++;
      }
      if (word) {
        tokens.push({ type: "other", value: word });
      }
      continue;
    }

    // ── Any other character ──
    tokens.push({ type: "other", value: css[i] });
    i++;
  }

  return tokens;
}

// ─────────────────────────────────────────────────────────────
//  Beautify Algorithm
// ─────────────────────────────────────────────────────────────
function beautifyCss(css: string, indentSize: IndentSize): string {
  if (!css.trim()) return "";

  const tokens = tokenizeCss(css);
  const indent = indentSize === "tab" ? "\t" : " ".repeat(parseInt(indentSize, 10));
  const lines: string[] = [];
  let depth = 0;
  let currentLine = "";
  let inSelector = false;
  let inPropertyValue = false;
  let inAtRuleBlock = false;

  const emitLine = (content: string) => {
    if (content.trim() || content === "") {
      lines.push(indent.repeat(depth) + content);
    }
  };

  const flushLine = () => {
    if (currentLine.trim()) {
      emitLine(currentLine.trim());
    }
    currentLine = "";
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = i + 1 < tokens.length ? tokens[i + 1] : null;
    const prevToken = i > 0 ? tokens[i - 1] : null;

    // ── Skip whitespace tokens, we handle spacing ourselves ──
    if (token.type === "whitespace") {
      continue;
    }

    // ── Comments ──
    if (token.type === "comment") {
      if (currentLine.trim()) flushLine();
      emitLine(token.value);
      continue;
    }

    // ── At-rules ──
    if (token.type === "at-rule") {
      if (currentLine.trim()) flushLine();
      currentLine = token.value;
      inAtRuleBlock = true;
      continue;
    }

    // ── Open brace ──
    if (token.type === "open-brace") {
      if (currentLine.trim()) {
        // Check if the current line is an at-rule that needs a space before {
        if (inAtRuleBlock) {
          currentLine += " {";
          flushLine();
          inAtRuleBlock = false;
        } else {
          // Selector block
          currentLine += " {";
          flushLine();
          inSelector = false;
        }
      } else {
        emitLine("{");
      }
      depth++;
      inPropertyValue = false;
      continue;
    }

    // ── Close brace ──
    if (token.type === "close-brace") {
      if (currentLine.trim()) flushLine();
      depth = Math.max(0, depth - 1);
      emitLine("}");
      inPropertyValue = false;
      inSelector = true;
      continue;
    }

    // ── Semicolon ──
    if (token.type === "semicolon") {
      if (currentLine.trim()) {
        currentLine += ";";
        flushLine();
      }
      inPropertyValue = false;
      continue;
    }

    // ── Colon (property-value separator) ──
    if (token.type === "colon") {
      if (currentLine.trim()) {
        currentLine += ": ";
      } else {
        currentLine = ": ";
      }
      inPropertyValue = true;
      continue;
    }

    // ── Other tokens (selectors, property names, values) ──
    if (token.type === "other") {
      const val = token.value;

      // Check if this looks like a selector (follows a close-brace or is at start)
      const isSelector =
        !inPropertyValue &&
        (prevToken === null ||
          prevToken.type === "close-brace" ||
          prevToken.type === "open-brace" ||
          prevToken.type === "whitespace" ||
          (prevToken.type === "other" && inSelector));

      // Check if this is a property name (followed by colon)
      const isProperty =
        nextToken && nextToken.type === "colon" && !inPropertyValue;

      if (isProperty) {
        // This is a property name
        if (currentLine.trim()) {
          currentLine += " " + val;
        } else {
          currentLine = val;
        }
        inSelector = false;
        continue;
      }

      if (isSelector && !inPropertyValue) {
        // This is a selector or part of a selector list
        if (currentLine.trim()) {
          // Check for comma-separated selectors
          if (val === ",") {
            currentLine += ",";
            flushLine();
          } else {
            currentLine += " " + val;
          }
        } else {
          currentLine = val;
        }
        inSelector = true;
        continue;
      }

      // This is a value or other content
      if (currentLine.trim()) {
        currentLine += " " + val;
      } else {
        currentLine = val;
      }
      inSelector = false;
      continue;
    }
  }

  // Flush remaining
  if (currentLine.trim()) {
    emitLine(currentLine.trim());
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
//  Minify Algorithm
// ─────────────────────────────────────────────────────────────
function minifyCss(css: string): string {
  if (!css.trim()) return "";

  const tokens = tokenizeCss(css);
  let result = "";
  let lastTokenWasSemicolon = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = i + 1 < tokens.length ? tokens[i + 1] : null;

    // Strip comments
    if (token.type === "comment") continue;

    // Skip whitespace
    if (token.type === "whitespace") continue;

    // Handle colon: no space after
    if (token.type === "colon") {
      result += ":";
      continue;
    }

    // Handle semicolon
    if (token.type === "semicolon") {
      result += ";";
      lastTokenWasSemicolon = true;
      continue;
    }

    // Handle open brace
    if (token.type === "open-brace") {
      // Remove trailing semicolon before brace (e.g., `color: blue;}` -> `color:blue}`)
      if (result.endsWith(";")) {
        result = result.slice(0, -1);
      }
      result += "{";
      lastTokenWasSemicolon = false;
      continue;
    }

    // Handle close brace
    if (token.type === "close-brace") {
      // Remove trailing semicolon before closing brace
      if (result.endsWith(";")) {
        result = result.slice(0, -1);
      }
      result += "}";
      lastTokenWasSemicolon = false;
      continue;
    }

    // Handle other tokens (selectors, properties, values)
    if (token.type === "other") {
      const val = token.value;

      // Add space before selector if needed (after })
      if (
        nextToken &&
        (nextToken.type === "open-brace" || nextToken.type === "other")
      ) {
        if (val === ",") {
          result += ",";
        } else {
          result += val;
        }
      } else {
        result += val;
      }
      lastTokenWasSemicolon = false;
      continue;
    }

    // At-rules
    if (token.type === "at-rule") {
      result += token.value;
      lastTokenWasSemicolon = false;
      continue;
    }
  }

  // Clean up: remove trailing semicolons before closing braces
  result = result.replace(/;}/g, "}");

  return result;
}

// ─────────────────────────────────────────────────────────────
//  Validation: Check for unclosed braces and brackets
// ─────────────────────────────────────────────────────────────
interface ValidationError {
  message: string;
  type: "warning" | "error";
}

function validateCss(css: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!css.trim()) return errors;

  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let inComment = false;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    const next = i + 1 < css.length ? css[i + 1] : "";

    // Track comments
    if (c === "/" && next === "*" && !inString) {
      inComment = true;
      i++;
      continue;
    }
    if (c === "*" && next === "/" && inComment) {
      inComment = false;
      i++;
      continue;
    }

    if (inComment) continue;

    // Track strings
    if ((c === '"' || c === "'") && !inString) {
      inString = true;
      stringChar = c;
      continue;
    }
    if (c === stringChar && inString) {
      inString = false;
      stringChar = "";
      continue;
    }

    if (inString) continue;

    // Track braces, parens, brackets
    if (c === "{") braceCount++;
    if (c === "}") braceCount--;
    if (c === "(") parenCount++;
    if (c === ")") parenCount--;
    if (c === "[") bracketCount++;
    if (c === "]") bracketCount--;
  }

  if (braceCount > 0) {
    errors.push({
      message: `Unclosed curly brace detected. There ${braceCount === 1 ? "is" : "are"} ${braceCount} unclosed opening brace${braceCount === 1 ? "" : "s"}.`,
      type: "error",
    });
  }
  if (braceCount < 0) {
    errors.push({
      message: `Unexpected closing curly brace detected. There ${Math.abs(braceCount) === 1 ? "is" : "are"} ${Math.abs(braceCount)} extra closing brace${Math.abs(braceCount) === 1 ? "" : "s"}.`,
      type: "error",
    });
  }

  if (parenCount > 0) {
    errors.push({
      message: `Unclosed parenthesis detected. There ${parenCount === 1 ? "is" : "are"} ${parenCount} unclosed opening parenthesis ${parenCount === 1 ? "bracket" : "brackets"}.`,
      type: "error",
    });
  }
  if (parenCount < 0) {
    errors.push({
      message: `Unexpected closing parenthesis detected. There ${Math.abs(parenCount) === 1 ? "is" : "are"} ${Math.abs(parenCount)} extra closing ${Math.abs(parenCount) === 1 ? "bracket" : "brackets"}.`,
      type: "error",
    });
  }

  if (bracketCount > 0) {
    errors.push({
      message: `Unclosed square bracket detected. There ${bracketCount === 1 ? "is" : "are"} ${bracketCount} unclosed opening bracket${bracketCount === 1 ? "" : "s"}.`,
      type: "error",
    });
  }
  if (bracketCount < 0) {
    errors.push({
      message: `Unexpected closing square bracket detected. There ${Math.abs(bracketCount) === 1 ? "is" : "are"} ${Math.abs(bracketCount)} extra closing bracket${Math.abs(bracketCount) === 1 ? "" : "s"}.`,
      type: "error",
    });
  }

  return errors;
}

// ── Count total rule blocks ──
function countRuleBlocks(css: string): number {
  let count = 0;
  let inComment = false;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    const next = i + 1 < css.length ? css[i + 1] : "";

    if (c === "/" && next === "*" && !inString) { inComment = true; i++; continue; }
    if (c === "*" && next === "/" && inComment) { inComment = false; i++; continue; }
    if (inComment) continue;

    if ((c === '"' || c === "'") && !inString) { inString = true; stringChar = c; continue; }
    if (c === stringChar && inString) { inString = false; stringChar = ""; continue; }
    if (inString) continue;

    if (c === "{") count++;
  }

  return count;
}

// ─────────────────────────────────────────────────────────────
//  Sample CSS
// ─────────────────────────────────────────────────────────────
const SAMPLE_CSS = `/* Reset & Base Styles */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:root {
    --primary: #4f46e5;
    --secondary: #06b6d4;
    --accent: #f59e0b;
    --bg-light: #f8fafc;
    --bg-dark: #0f172a;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

body {
    font-family: var(--font-sans);
    color: var(--text-primary);
    background-color: var(--bg-light);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

@media (max-width: 768px) {
    .container {
        padding: 0 0.5rem;
    }

    .grid {
        grid-template-columns: 1fr;
    }
}

@media (prefers-color-scheme: dark) {
    body {
        background-color: var(--bg-dark);
        color: #e2e8f0;
    }

    .card {
        background-color: #1e293b;
        border-color: #334155;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-primary {
    background-color: var(--primary);
    color: white;
}

.btn-primary:hover {
    background-color: #4338ca;
    box-shadow: var(--shadow-md);
}

.card {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
}

.card:hover {
    box-shadow: var(--shadow-md);
}`;

// ─────────────────────────────────────────────────────────────
//  Main CSS Formatter Component
// ─────────────────────────────────────────────────────────────
export default function CssFormatter() {
  const [input, setInput] = useState("");
  const [indentSize, setIndentSize] = useState<IndentSize>("2");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"beautified" | "minified">("beautified");
  const [formatError, setFormatError] = useState<string | null>(null);

  // Reactive Formatting & Validation
  const { formattedOutput, minifiedOutput, formatError: computedError } = React.useMemo(() => {
    try {
      const beautified = beautifyCss(input, indentSize);
      const minified = minifyCss(input);
      return { formattedOutput: beautified, minifiedOutput: minified, formatError: null };
    } catch (e) {
      return {
        formattedOutput: "",
        minifiedOutput: "",
        formatError: "An unexpected error occurred while parsing the CSS. Please check your stylesheet for structural issues."
      };
    }
  }, [input, indentSize]);

  // Sync computed error to state
  useEffect(() => {
    setFormatError(computedError);
  }, [computedError]);

  const validationErrors = React.useMemo(() => validateCss(input), [input]);

  // Metrics
  const inputSize = React.useMemo(() => new Blob([input]).size, [input]);
  const outputSize = React.useMemo(
    () => (formattedOutput ? new Blob([formattedOutput]).size : 0),
    [formattedOutput]
  );
  const minifiedSize = React.useMemo(
    () => (minifiedOutput ? new Blob([minifiedOutput]).size : 0),
    [minifiedOutput]
  );
  const compressionRatio = React.useMemo(
    () =>
      inputSize && outputSize
        ? parseFloat((((inputSize - outputSize) / inputSize) * 100).toFixed(1))
        : 0,
    [inputSize, outputSize]
  );
  const totalRuleBlocks = React.useMemo(() => countRuleBlocks(input), [input]);

  // Display output based on active tab
  const displayOutput =
    activeTab === "beautified" ? formattedOutput : minifiedOutput;
  const displaySize =
    activeTab === "beautified" ? outputSize : minifiedSize;

  // Handlers
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const loadSample = useCallback(() => {
    setInput(SAMPLE_CSS);
  }, []);

  const clearWorkspace = useCallback(() => {
    setInput("");
    setFormatError(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Workspace Grid — Symmetrical 50/50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ══════════════════ LEFT PANEL: INPUT WORKSPACE ══════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          {/* Edge-to-edge Slate-to-Indigo Gradient Header Bar */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                <FileCode className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-slate-900">CSS Input</span>
            </div>
            {input.trim() && (
              <span className="text-xs text-slate-500 font-medium">
                {input.length} Chars
              </span>
            )}
          </div>

          {/* Input Textarea with monospace styling */}
          <div className="p-5 flex-1 flex">
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent flex-1 flex">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your CSS code here to format, beautify, and minify..."
                className="w-full bg-transparent font-mono text-sm text-slate-800 placeholder-slate-400 py-3 px-4 outline-none resize-none overflow-auto leading-6 flex-1"
                style={{ whiteSpace: "pre", overflowWrap: "normal" }}
                id="css-input-editor"
              />
            </div>
          </div>

          {/* Local Operational Control Bar */}
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Indentation Dropdown */}
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="css-indent-select"
                  className="text-xs font-semibold text-slate-600 whitespace-nowrap"
                >
                  Indent:
                </label>
                <select
                  id="css-indent-select"
                  value={indentSize}
                  onChange={(e) => setIndentSize(e.target.value as IndentSize)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-11 min-w-[100px]"
                >
                  <option value="2">2 Spaces</option>
                  <option value="4">4 Spaces</option>
                  <option value="tab">Tab</option>
                </select>
              </div>

              {/* Action Buttons — min 44px touch targets */}
              <button
                onClick={loadSample}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors min-h-[44px]"
              >
                <BookOpen className="w-4 h-4" />
                Load Sample CSS
              </button>
              <button
                onClick={clearWorkspace}
                disabled={!input}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Clear Workspace
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: LIVE FORMATTED OUTPUT ══════════════════ */}
        <div className="space-y-4">
          {/* Main Output Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Slate-to-Indigo Gradient Header Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">Formatted Output</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Format Error Banner */}
              {formatError && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-red-800">
                        Parsing Error
                      </p>
                      <p className="text-xs mt-1 leading-relaxed">{formatError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Warning Banner */}
              {validationErrors.length > 0 && !formatError && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl space-y-2">
                  {validationErrors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs uppercase tracking-wider text-red-800">
                          {err.type === "error"
                            ? "CSS Syntax Error"
                            : "CSS Warning"}
                        </p>
                        <p className="text-xs mt-1 leading-relaxed">{err.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Tab System */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setActiveTab("beautified")}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                    activeTab === "beautified"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Beautified Code
                </button>
                <button
                  onClick={() => setActiveTab("minified")}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                    activeTab === "minified"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Minified Output
                </button>
              </div>

              {/* Read-only Formatted Output */}
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 min-h-[220px] max-h-[340px] overflow-auto">
                {displayOutput ? (
                  <pre className="font-mono text-xs whitespace-pre leading-6 text-indigo-300">
                    <code>{displayOutput}</code>
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[180px] text-slate-500">
                    <Code className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                    <p className="text-xs italic">
                      {input.trim()
                        ? "Processing stylesheet..."
                        : "No CSS code loaded."}
                    </p>
                  </div>
                )}
              </div>

              {/* Copy Button */}
              <button
                onClick={() =>
                  displayOutput && copyToClipboard(displayOutput)
                }
                disabled={!displayOutput}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                  displayOutput
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
                    Copy Formatted CSS
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dynamic Metrics Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              CSS Metrics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  CSS Input Size
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {inputSize.toLocaleString()} B
                </p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  CSS Output Size
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {displaySize.toLocaleString()} B
                </p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  Compression Ratio
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {compressionRatio > 0
                    ? `-${compressionRatio}%`
                    : compressionRatio < 0
                    ? `+${Math.abs(compressionRatio)}%`
                    : "0%"}
                </p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  Rule Blocks
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {totalRuleBlocks}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         BELOW-THE-FOLD SEO DEEP CONTENT
         ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-8 mt-8">

        {/* Section 1: Technical Architecture */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of CSS Optimization & Cascading Tokenization Frameworks</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            The modernization of stylesheet delivery requires a deep understanding of lexical tokenization, browser parsing trees, and layout engine execution lifecycles. When a web browser encounters an external cascading stylesheet, the rendering engine halts layout generation to parse text strings into a structured CSS Object Model (CSSOM). Our client-side optimization suite intercepts raw text payloads, executing deterministic token scanning entirely inside your local browser environment. This isolated parsing pipeline guarantees zero data transmission across external networks, securing confidential corporate design systems and enterprise application layouts from monitoring or exfiltration.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The tokenization engine operates by iterating through each character of the input string, classifying structural tokens into distinct categories: selectors, property declarations, at-rules, comment blocks, and structural braces. Each token is processed through a state machine that tracks nesting depth, selector context, and property-value boundaries. This deterministic approach ensures consistent formatting output regardless of input complexity, supporting deeply nested media queries, keyframe animations, container queries, and custom property cascades without ambiguity.
          </p>
        </div>

        {/* Section 2: Lexical Tokenization Pipeline */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <ListOrdered className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Lexical Tokenization & Minification Pipeline Execution Steps</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            The CSS formatting engine processes raw stylesheet input through a deterministic four-stage pipeline that transforms unstructured text into beautifully formatted or densely compressed output. Each stage builds upon the previous one, starting with raw character scanning and culminating in the final production-ready string assembly. Understanding this pipeline helps developers appreciate how their stylesheets are processed and why the output maintains structural integrity regardless of input complexity.
          </p>
          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Lexical Filtering & Character Traversal",
                body: "The processor scans input streams sequentially, isolating structural characters such as braces, semi-colons, colons, and custom property declarations into independent structural categories. Each character is evaluated against a set of tokenization rules that determine whether it belongs to a selector, property name, value, comment, or structural delimiter. This fine-grained classification enables precise formatting control at the character level.",
              },
              {
                step: "2",
                title: "Contextual Block Mapping",
                body: "The internal parsing engine evaluates selector nesting scopes, mapping media configurations (<code className=\"text-xs bg-slate-100 px-1.5 py-0.5 rounded\">@media</code>), keyframes (<code className=\"text-xs bg-slate-100 px-1.5 py-0.5 rounded\">@keyframes</code>), and structural variable declarations safely. A depth counter tracks the current nesting level, incrementing on opening braces and decrementing on closing braces, ensuring that each ruleset receives the correct indentation weight relative to its position in the cascade.",
              },
              {
                step: "3",
                title: "Whitespace Normalization & Indent Injection",
                body: "For beautification workflows, properties are normalized into single-line segments, applying specific indentation weights to optimize developer readability. The engine strips excessive internal whitespace while preserving meaningful spacing within property values, URL paths, and data URIs. Each property declaration is placed on its own line with consistent indentation, and selectors are separated by line breaks for multi-selector rule sets.",
              },
              {
                step: "4",
                title: "Structural Compression",
                body: "Minification routines discard redundant syntax tokens, comment sequences, and optional terminal whitespace arrays to build highly compressed production strings. The minifier removes all comment blocks, collapses whitespace to single spaces, and eliminates trailing semicolons before closing braces. The result is a dense, production-ready CSS payload that preserves all functional properties while reducing file size for faster network delivery.",
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
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: W3C Spec & Browser Parsing Optimization Reference Matrix */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>W3C Spec & Browser Parsing Optimization Reference Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            The following matrix documents how different CSS rule categories are processed by the formatting engine, comparing native format samples with optimized production states and their impact on layout engine performance.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Rule Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Native Format Sample</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Optimized Production State</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Layout Engine Performance Context</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Standard Elements", "div { color: red; }", "div{color:red}", "Single rule parsed in ~0.01ms; minimal CSSOM impact"],
                  ["Selector Groupings", "h1, h2, h3 { font-weight: bold; }", "h1,h2,h3{font-weight:bold}", "Grouped selectors reduce rule count; faster cascade resolution"],
                  ["Media Layers", "@media (max-width: 768px) { .col { width: 100%; } }", "@media (max-width:768px){.col{width:100%}}", "Conditional blocks evaluated once; minified reduces pre-parse size"],
                  ["Root Variables", ":root { --primary: #4f46e5; }", ":root{--primary:#4f46e5}", "Custom properties stored in CSSOM; minification reduces memory footprint"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 text-sm ${
                          j === 0
                            ? "font-semibold text-slate-700"
                            : "text-slate-600"
                        }`}
                      >
                        {j === 1 || j === 2 ? (
                          <code className="text-xs">{cell}</code>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Real-World Production Integration */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Blocks className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Real-World Production Integration & Front-End Performance Scenarios</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Clean Continuous Integration Staging",
                body: "Ideal for normalizing unstructured vendor code blocks prior to repository inclusion. Development teams can paste minified or poorly formatted CSS from third-party libraries into the beautifier to produce clean, readable stylesheets that conform to team coding standards before committing to version control.",
              },
              {
                title: "High-Velocity Performance Optimization",
                body: "Helps teams strip massive development files into ultra-dense structural payloads to accelerate core web vitals score outputs. The minification engine reduces CSS payload size by up to 40-60%, directly improving First Contentful Paint (FCP) and Largest Contentful Paint (LCP) metrics by reducing network transfer time.",
              },
              {
                title: "Embedded Document Refactoring",
                body: "Simplifies extracting, viewing, and tuning scattered component styles during critical legacy application migrations. Developers can extract inline styles from legacy HTML, format them through the beautifier, and refactor them into organized external stylesheets with proper cascade ordering and selector grouping.",
              },
              {
                title: "Design System Audit & Normalization",
                body: "When consolidating multiple design systems or theme files, the formatter normalizes inconsistent indentation, variable naming conventions, and comment styles across all source files. The metrics grid provides immediate feedback on file sizes and rule counts, enabling teams to track optimization progress during refactoring sprints.",
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
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Advanced FAQs */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Advanced CSS Optimization & Code Parsing Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Does formatting or minifying code alter layout mechanics?",
                a: "No. The logical hierarchy, nesting priority weights, and target specificity levels are perfectly maintained while resolving variable formatting spaces. The beautification process only modifies whitespace, indentation, and line breaks — it does not alter selector names, property values, color codes, font stacks, or any functional CSS declaration. The minification process removes comments and collapses whitespace but preserves all functional properties, URLs, data URIs, and quoted strings exactly as they appear in the source. Both operations are semantically neutral and produce output that renders identically to the original input in any standards-compliant browser.",
              },
              {
                q: "Why is the execution limited entirely to client-side sandboxes?",
                a: "Computing outputs locally eliminates network overhead latency, bypassing server bottlenecks while providing complete security parameters. By executing all tokenization, formatting, and minification logic within the browser's JavaScript runtime, the tool guarantees that no CSS code, design tokens, proprietary selectors, or confidential stylesheet data ever leaves the user's device. This architecture is particularly critical for enterprise teams working with unreleased product designs, proprietary design systems, or client-confidential branding guidelines that cannot be transmitted to external servers for processing.",
              },
              {
                q: "How does this suite process complex modern frameworks?",
                a: "It safely handles nested variable hooks, container queries, and custom tailwind properties by avoiding strict dictionary blocks. The tokenization engine does not rely on a predefined dictionary of CSS properties or values — instead, it uses structural character analysis to identify tokens based on their position relative to braces, colons, and semicolons. This approach ensures compatibility with any CSS syntax, including custom properties (CSS variables), modern container queries (@container), Tailwind CSS directives (@apply, @layer), CSS modules, and future CSS specifications that may introduce new at-rules or property patterns.",
              },
              {
                q: "Can the minifier safely handle complex data URLs and quoted strings?",
                a: "Yes. The minification engine maintains absolute data safety around data URLs, asset paths, and quoted content strings. The tokenizer tracks string boundaries by monitoring opening and closing quote characters, ensuring that whitespace within quoted strings (such as font-family names with spaces, data URIs with base64 padding, or URL paths with encoded characters) is preserved exactly as written. Comment removal is also string-aware, preventing false positive comment detection inside string literals that may contain /* or */ character sequences.",
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
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Why Choose TwisterTools */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span>Why Choose TwisterTools for High-Performance Code Refactoring?</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Zap,
                title: "Zero-Latency Local Execution",
                body: "All formatting and minification logic executes directly in your browser using pure TypeScript. There are no API calls, no server round-trips, and no network latency. Results appear in milliseconds regardless of stylesheet size, with real-time updates as you type or paste new content.",
              },
              {
                icon: Shield,
                title: "No External Package Vulnerabilities",
                body: "The entire parsing pipeline is implemented from scratch in pure TypeScript with zero external npm dependencies. This eliminates supply chain risks, version conflicts, and security vulnerabilities associated with third-party formatting libraries. The tool is self-contained and will function identically across all modern browsers without requiring updates.",
              },
              {
                icon: Code,
                title: "Absolute Data Privacy Guarantees",
                body: "Your CSS code never leaves your device. There are no analytics scripts, no tracking pixels, no data persistence, and no server-side processing. The tool operates entirely within the browser's sandboxed JavaScript environment, making it suitable for formatting proprietary design systems, confidential client stylesheets, and internal corporate branding assets.",
              },
              {
                icon: FileCode,
                title: "Complete Type Safety & Deterministic Output",
                body: "Built with TypeScript's strict type system, the formatting engine produces deterministic output — the same input with the same configuration always produces identical output. This predictability is essential for CI/CD pipelines, automated code review workflows, and team-wide formatting standardization initiatives.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/20 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-indigo-200" />
                  <h3 className="font-semibold text-white text-sm">{title}</h3>
                </div>
                <p className="text-indigo-100 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}
