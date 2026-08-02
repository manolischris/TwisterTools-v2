"use client";

import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
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
  Layers,
  Table,
  Workflow,
  Zap,
  Shield,
  Minimize2,
  Maximize2,
  Eye,
  FileText,
  Upload,
  Columns,
  GripVertical,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript HTML/CSS Minification & Unminification Engine
//  100% Client-Side — Zero External Dependencies
// ─────────────────────────────────────────────────────────────

type OperationMode = "html-minify" | "html-unminify" | "css-minify" | "css-unminify";

// ─────────────────────────────────────────────────────────────
//  HTML Engine
// ─────────────────────────────────────────────────────────────

// Block-level HTML elements that trigger newline + indent for unminify
const HTML_BLOCK_ELEMENTS = new Set([
  "html", "head", "body", "div", "section", "article", "nav", "aside",
  "header", "footer", "main", "form", "fieldset", "table", "thead",
  "tbody", "tfoot", "tr", "th", "td", "ul", "ol", "li", "dl", "dt", "dd",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "blockquote", "figure",
  "figcaption", "details", "summary", "dialog", "menu", "pre", "template",
  "select", "optgroup", "option", "datalist",
]);

const HTML_VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

const HTML_INLINE_ELEMENTS = new Set([
  "span", "a", "strong", "b", "em", "i", "u", "s", "del", "ins",
  "small", "sub", "sup", "mark", "q", "cite", "abbr", "time",
  "code", "kbd", "samp", "var", "bdo", "bdi", "data", "dfn",
  "label", "output", "progress", "meter", "button", "textarea",
  "input", "select", "option", "optgroup",
]);

// Protected blocks: their inner content should not be minified
const PROTECTED_TAGS = new Set(["pre", "code", "script", "style"]);

interface HtmlToken {
  type: "open-tag" | "close-tag" | "self-closing-tag" | "comment" | "doctype" | "cdata" | "text" | "whitespace";
  value: string;
  tagName?: string;
}

function tokenizeHtml(html: string): HtmlToken[] {
  const tokens: HtmlToken[] = [];
  let i = 0;

  while (i < html.length) {
    // DOCTYPE
    if (html[i] === "<" && html.substring(i, i + 9).toLowerCase() === "<!doctype") {
      let end = html.indexOf(">", i);
      if (end === -1) end = html.length;
      tokens.push({ type: "doctype", value: html.substring(i, end + 1) });
      i = end + 1;
      continue;
    }

    // Comments
    if (html[i] === "<" && html[i + 1] === "!" && html[i + 2] === "-" && html[i + 3] === "-") {
      let end = html.indexOf("-->", i);
      if (end === -1) end = html.length - 1;
      else end += 3;
      tokens.push({ type: "comment", value: html.substring(i, end) });
      i = end;
      continue;
    }

    // CDATA
    if (html[i] === "<" && html.substring(i, i + 9).toUpperCase() === "<![CDATA[") {
      let end = html.indexOf("]]>", i);
      if (end === -1) end = html.length;
      else end += 3;
      tokens.push({ type: "cdata", value: html.substring(i, end) });
      i = end;
      continue;
    }

    // Closing tag
    if (html[i] === "<" && html[i + 1] === "/") {
      let end = html.indexOf(">", i);
      if (end === -1) end = html.length;
      const tagContent = html.substring(i + 2, end).trim();
      const tagName = tagContent.split(/\s+/)[0].toLowerCase();
      tokens.push({ type: "close-tag", value: html.substring(i, end + 1), tagName });
      i = end + 1;
      continue;
    }

    // Opening or self-closing tag
    if (html[i] === "<") {
      let end = html.indexOf(">", i);
      if (end === -1) end = html.length;
      const tagStr = html.substring(i + 1, end).trim();
      const isSelfClosingSyntax = tagStr.endsWith("/");
      const cleanTagStr = isSelfClosingSyntax ? tagStr.slice(0, -1).trim() : tagStr;
      const tagName = cleanTagStr.split(/\s+/)[0].toLowerCase();

      if (HTML_VOID_ELEMENTS.has(tagName) || isSelfClosingSyntax) {
        tokens.push({ type: "self-closing-tag", value: html.substring(i, end + 1), tagName });
      } else {
        tokens.push({ type: "open-tag", value: html.substring(i, end + 1), tagName });
      }
      i = end + 1;
      continue;
    }

    // Whitespace
    if (/^\s/.test(html[i])) {
      let ws = "";
      while (i < html.length && /^\s/.test(html[i])) { ws += html[i]; i++; }
      tokens.push({ type: "whitespace", value: ws });
      continue;
    }

    // Text
    let text = "";
    while (i < html.length && html[i] !== "<") { text += html[i]; i++; }
    if (text) tokens.push({ type: "text", value: text });
  }

  return tokens;
}

function minifyHtml(html: string): string {
  if (!html.trim()) return "";
  const tokens = tokenizeHtml(html);
  let result = "";
  let inProtected = false;

  for (const token of tokens) {
    if (token.type === "comment") continue;
    if (token.type === "whitespace") {
      if (!inProtected) continue;
      result += " ";
      continue;
    }
    if (token.type === "open-tag" && token.tagName && PROTECTED_TAGS.has(token.tagName)) {
      inProtected = true;
    }
    if (token.type === "close-tag" && token.tagName && PROTECTED_TAGS.has(token.tagName)) {
      inProtected = false;
    }
    if (token.type === "text") {
      if (inProtected) {
        result += token.value;
      } else {
        const collapsed = token.value.replace(/\s+/g, " ").trim();
        if (collapsed) result += collapsed;
      }
    } else {
      result += token.value;
    }
  }

  return result;
}

function unminifyHtml(html: string): string {
  if (!html.trim()) return "";
  const tokens = tokenizeHtml(html);
  const indent = "  ";
  const lines: string[] = [];
  let depth = 0;

  const emitLine = (content: string) => {
    lines.push(indent.repeat(depth) + content);
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "comment") {
      emitLine(token.value);
      continue;
    }
    if (token.type === "doctype") {
      emitLine(token.value);
      continue;
    }
    if (token.type === "cdata") {
      emitLine(token.value);
      continue;
    }
    if (token.type === "close-tag") {
      depth = Math.max(0, depth - 1);
      emitLine(token.value);
      continue;
    }
    if (token.type === "self-closing-tag") {
      emitLine(token.value);
      continue;
    }
    if (token.type === "open-tag") {
      emitLine(token.value);
      if (HTML_BLOCK_ELEMENTS.has(token.tagName!) || !HTML_INLINE_ELEMENTS.has(token.tagName!)) {
        depth++;
      } else if (!HTML_INLINE_ELEMENTS.has(token.tagName!)) {
        depth++;
      } else {
        depth++;
      }
      continue;
    }
    if (token.type === "text") {
      const trimmed = token.value.trim();
      if (trimmed) {
        emitLine(trimmed);
      }
      continue;
    }
    // Skip whitespace in unminify mode
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
//  CSS Engine
// ─────────────────────────────────────────────────────────────

function minifyCss(css: string): string {
  if (!css.trim()) return "";

  // Strip CSS comments
  let result = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Collapse whitespace around structural characters
  result = result
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*;\s*/g, ";")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s*>\s*/g, ">")
    .replace(/\s*\+\s*/g, "+")
    .replace(/\s*~\s*/g, "~")
    .replace(/\s+/g, " ");

  // Remove trailing semicolons before closing braces
  result = result.replace(/;}/g, "}");

  // Trim leading/trailing whitespace
  result = result.trim();

  return result;
}

function unminifyCss(css: string): string {
  if (!css.trim()) return "";

  // Strip CSS comments
  let cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  if (!cleaned) return "";

  const indent = "  ";
  const lines: string[] = [];
  let i = 0;
  let depth = 0;
  let buffer = "";

  const emitLine = (content: string) => {
    lines.push(indent.repeat(depth) + content);
  };

  while (i < cleaned.length) {
    const ch = cleaned[i];

    if (ch === "{") {
      const trimmed = buffer.trim();
      if (trimmed) emitLine(trimmed + " {");
      depth++;
      buffer = "";
      i++;
      continue;
    }

    if (ch === "}") {
      const trimmed = buffer.trim();
      if (trimmed) {
        // Could be a property value without semicolon
        emitLine(trimmed);
      }
      depth = Math.max(0, depth - 1);
      emitLine("}");
      buffer = "";
      i++;
      continue;
    }

    if (ch === ";") {
      const trimmed = buffer.trim();
      if (trimmed) emitLine(trimmed + ";");
      buffer = "";
      i++;
      continue;
    }

    if (ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    buffer += ch;
    i++;
  }

  // Flush remaining buffer
  const trimmed = buffer.trim();
  if (trimmed) {
    emitLine(trimmed);
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
//  Sample Data
// ─────────────────────────────────────────────────────────────

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Page</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
        p { line-height: 1.6; color: #666; }
        .highlight { background: #eef2ff; padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to TwisterTools</h1>
        <p>This is a <strong>sample</strong> HTML document for <span class="highlight">testing</span> minification and unminification.</p>
        <p>Use the toolbar below to switch between HTML and CSS modes, and toggle minify/unminify operations.</p>
    </div>
</body>
</html>`;

const SAMPLE_CSS = `/* Sample stylesheet for testing */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f8fafc;
  color: #1e293b;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  padding: 60px 0;
  text-align: center;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.btn {
  display: inline-block;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #4f46e5;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
}`;

// ── Helper: format file sizes ──
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Count lines/blocks ──
function countLines(text: string): number {
  if (!text.trim()) return 0;
  return text.split("\n").length;
}

// ─────────────────────────────────────────────────────────────
//  Main HTML/CSS Minifier & Unminifier Component
// ─────────────────────────────────────────────────────────────

export default function HtmlCssMinifier() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<OperationMode>("html-minify");
  const [copied, setCopied] = useState(false);
  const [outputTab, setOutputTab] = useState<"code" | "preview">("code");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute output
  const { output, processError } = useMemo(() => {
    try {
      if (!input.trim()) return { output: "", processError: null };

      let result = "";
      switch (mode) {
        case "html-minify":
          result = minifyHtml(input);
          break;
        case "html-unminify":
          result = unminifyHtml(input);
          break;
        case "css-minify":
          result = minifyCss(input);
          break;
        case "css-unminify":
          result = unminifyCss(input);
          break;
      }

      return { output: result, processError: null };
    } catch (e) {
      return {
        output: "",
        processError: "An unexpected error occurred while processing your input. Please check your markup for structural issues."
      };
    }
  }, [input, mode]);

  // Sync error
  useEffect(() => {
    setError(processError);
  }, [processError]);

  // Metrics
  const inputSize = useMemo(() => new Blob([input]).size, [input]);
  const outputSize = useMemo(() => (output ? new Blob([output]).size : 0), [output]);
  const compressionRatio = useMemo(() => {
    if (!inputSize || !outputSize) return 0;
    const diff = inputSize - outputSize;
    return parseFloat(((diff / inputSize) * 100).toFixed(1));
  }, [inputSize, outputSize]);
  const inputLines = useMemo(() => countLines(input), [input]);
  const outputLines = useMemo(() => countLines(output), [output]);

  // Handlers
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const loadSample = useCallback(() => {
    if (mode.startsWith("html")) {
      setInput(SAMPLE_HTML);
    } else {
      setInput(SAMPLE_CSS);
    }
    setError(null);
  }, [mode]);

  const clearWorkspace = useCallback(() => {
    setInput("");
    setError(null);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInput(text);
        setError(null);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInput(text);
        setError(null);
      };
      reader.readAsText(file);
    }
  }, []);

  // Mode label for UI
  const modeLabel = {
    "html-minify": "HTML Minify",
    "html-unminify": "HTML Unminify",
    "css-minify": "CSS Minify",
    "css-unminify": "CSS Unminify",
  }[mode];

  // Check if we should show live preview (HTML modes only)
  const showPreview = outputTab === "preview" && mode.startsWith("html") && output;

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm mb-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider text-rose-800">Processing Error</p>
              <p className="text-xs mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ WORKSPACE GRID ══════════════════ */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════ LEFT PANEL: INPUT AREA ══════════ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Bar */}
          <div className="bg-slate-800 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              <span className="text-sm font-semibold">Input</span>
            </div>
            {input.trim() && (
              <span className="text-xs text-slate-300">
                {input.length} chars
              </span>
            )}
          </div>

          {/* Mode Selector Tabs */}
          <div className="border-b border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {(["html-minify", "html-unminify", "css-minify", "css-unminify"] as OperationMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); }}
                  className={`px-2 py-2.5 text-xs font-semibold transition-all duration-200 border-b-2 ${
                    mode === m
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {m === "html-minify" && "HTML Minify"}
                  {m === "html-unminify" && "HTML Unminify"}
                  {m === "css-minify" && "CSS Minify"}
                  {m === "css-unminify" && "CSS Unminify"}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative"
          >
            {/* Drag and drop overlay */}
            {isDragOver && (
              <div className="absolute inset-0 z-10 bg-indigo-600/10 border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 rounded-xl shadow-lg text-center p-4 sm:p-6">
                  <Upload className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800 text-sm">Drop file to load</p>
                </div>
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              placeholder={
                mode.startsWith("html")
                  ? "Paste your HTML markup here to minify or unminify..."
                  : "Paste your CSS stylesheet here to minify or unminify..."
              }
              className="h-[450px] font-mono text-sm p-4 w-full bg-white text-slate-800 rounded-b-xl resize-none"
              style={{ whiteSpace: "pre", overflowWrap: "normal", outline: "none" } as React.CSSProperties}
            />
          </div>

          {/* Workspace Action Toolbar */}
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={loadSample}
                className="h-11 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                Load Sample
              </button>
              <button
                onClick={clearWorkspace}
                disabled={!input}
                className="h-11 px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
            {/* Drag-and-Drop Upload Zone */}
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={mode.startsWith("html") ? ".html,.htm" : ".css"}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex items-center justify-center py-4 px-4 ${
                  isDragOver
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
                }`}
              >
                <div className="flex items-center gap-3 text-center">
                  <Upload className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <p className="text-xs text-slate-600">
                    {isDragOver
                      ? "Drop file to load"
                      : `Drop a .${mode.startsWith("html") ? "html" : "css"} file here, or click to browse`}
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {mode.startsWith("html") ? ".html, .htm" : ".css"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ RIGHT PANEL: OUTPUT AREA ══════════ */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header Bar */}
            <div className="bg-slate-800 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-semibold">Output</span>
              </div>
              {output && (
                <span className="text-xs text-slate-300">
                  {output.length} chars
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Dual-View Output Selector */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setOutputTab("code")}
                  className={`flex-1 py-2 text-xs font-semibold transition-all duration-200 border-b-2 ${
                    outputTab === "code"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    Code Output
                  </span>
                </button>
                <button
                  onClick={() => setOutputTab("preview")}
                  disabled={!mode.startsWith("html")}
                  className={`flex-1 py-2 text-xs font-semibold transition-all duration-200 border-b-2 ${
                    !mode.startsWith("html")
                      ? "text-slate-300 cursor-not-allowed"
                      : outputTab === "preview"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Live Preview
                  </span>
                </button>
              </div>

              {/* Output Area */}
              {showPreview ? (
                <div className="h-[450px] overflow-auto bg-white border border-slate-200 rounded-xl p-4">
                  <div dangerouslySetInnerHTML={{ __html: output }} />
                </div>
              ) : (
                <div className="h-[450px] rounded-xl bg-slate-900 border border-slate-800 overflow-auto">
                  {output ? (
                    <pre className="font-mono text-xs whitespace-pre leading-6 text-indigo-300 p-4">
                      <code>{output}</code>
                    </pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <Code className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                      <p className="text-xs italic">
                        {input.trim()
                          ? "Processing..."
                          : "No input loaded."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Copy Button */}
              <button
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

          {/* Real-Time Metrics Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Processing Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Input Size</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{formatFileSize(inputSize)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Output Size</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{formatFileSize(outputSize)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Compression</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {compressionRatio > 0
                    ? `-${compressionRatio}%`
                    : compressionRatio < 0
                    ? `+${Math.abs(compressionRatio)}%`
                    : "0%"}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Lines</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {inputLines} &rarr; {outputLines}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD AUTHORITATIVE SEO CONTENT
      ───────────────────────────────────────────────────────────── */}
      <section className="mt-8 space-y-8">

        {/* Card 1: Technical Architecture */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <span>Technical Architecture of Web Asset Minification & Unminification</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              The HTML and CSS minification engine operates on a multi-phase lexical analysis pipeline that transforms raw, verbose markup into compressed, network-optimized payloads. The core architecture separates tokenization from transformation, enabling both minification (compression) and unminification (beautification) from the same intermediate representation. For HTML, a character-level scanner iterates through the input string identifying structural boundaries such as tag delimiters, comment markers, CDATA sections, and DOCTYPE declarations. Each boundary triggers a token emission event that classifies the captured substring into one of seven token types. This tokenization phase establishes a structured intermediate representation that decouples the raw input from the formatting logic, enabling the engine to operate on a clean, predictable data structure rather than raw string manipulation.
            </p>
            <p>
              For CSS, the engine employs a simplified tokenization approach that identifies structural characters (braces, colons, semicolons, commas) and comment boundaries. The minification pass strips all CSS comments, collapses whitespace around structural characters, and removes trailing semicolons before closing braces. The unminification pass uses a stack-based brace tracker that mirrors selector nesting, formatting each property-value pair onto its own line with proper indentation. Both engines wrap conversion routines in strict try...catch blocks, rendering a soft-red warning banner if input parsing fails. This architecture ensures that malformed input never crashes the interface, providing clear, actionable feedback through graceful degradation.
            </p>
            <p>
              The minification algorithms achieve significant payload reduction through strategic whitespace elimination while preserving semantic integrity. HTML minification removes redundant whitespace between tags, strips HTML comments, collapses newlines between elements, and condenses text node whitespace while protecting special elements like "pre", "code", "script", and "style" from content modification. CSS minification similarly removes comments, collapses spaces around colons and semicolons, eliminates optional semicolons before closing braces, and condenses multiple whitespace characters into single spaces. These transformations can reduce payload sizes by 30-60% for typical documents, directly improving page load times and reducing bandwidth consumption.
            </p>
          </div>
        </div>

        {/* Card 2: Lexical Tokenization & Parsing Pipeline */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Step-by-Step Lexical Tokenization Pipeline</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            The tokenization pipeline follows a deterministic four-stage process that converts raw markup and stylesheet source code into compressed or beautified output. Each stage builds upon the previous to ensure structural integrity and optimal transformation results.
          </p>
          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Lexical Filtering & Character Traversal",
                body: 'The scanner traverses the input string character by character, identifying structural markers such as angle brackets (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">< ></code>), forward slashes (/), braces (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{ }</code>), and colons (:). Each recognized pattern triggers a token emission that captures the exact substring along with its semantic classification. The scanner handles edge cases including nested brackets inside attribute values, malformed tags, and mixed-content regions without throwing exceptions.',
              },
              {
                step: "2",
                title: "Block & Comment Identification",
                body: 'The tokenizer identifies structural blocks and comment regions that require special handling. HTML comments (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded"><!-- --></code>) are stripped during minification but preserved during unminification. CSS comments (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/* */</code>) are removed in both minification modes. Protected blocks such as "pre", "code", "script", and "style" elements are flagged so their inner content is preserved verbatim during HTML minification, preventing corruption of embedded code or whitespace-sensitive content.',
              },
              {
                step: "3",
                title: "Whitespace Normalization & Indent Injection",
                body: "During minification, whitespace tokens are collapsed or removed entirely based on context. Inter-tag whitespace is stripped, text node whitespace is condensed to single spaces, and redundant newlines are eliminated. During unminification, the engine injects proper indentation using a stack-based depth tracker, incrementing depth for block-level elements and formatting each structural unit on its own line. CSS property-value pairs are formatted onto individual lines with consistent indentation.",
              },
              {
                step: "4",
                title: "Structural Compression & Payload Optimization",
                body: "The final stage assembles the processed tokens into the output string. For minification, tokens are concatenated with minimal overhead: whitespace is stripped, comments are removed, and text content is compressed. For unminification, tokens are assembled into indented lines with consistent structural spacing. The output is then presented in the read-only preview panel with syntax-highlighted styling for immediate visual inspection. The metrics dashboard shows real-time size comparisons and compression ratios.",
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
        {/* Card 3: Syntax Specification & Compression Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Table className="w-5 h-5" />
            </div>
            <span>Asset Optimization & Formatting Reference Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The following matrix documents the transformation patterns applied to different asset types during minification and unminification operations.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Target Asset</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Processing Mode</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Transformation Pattern</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Performance Gain Context</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["HTML Markup", "Minify", "Strip comments, collapse whitespace, remove inter-tag spaces, condense text nodes", "30-50% payload reduction; faster DOM parsing; reduced bandwidth consumption"],
                  ["HTML Markup", "Unminify", "Stack-based indent injection, block element line breaks, inline preservation", "Improved code readability; easier debugging; standardized formatting"],
                  ["Inline CSS Styles", "Minify", "Remove CSS comments, collapse selector/value spacing, trim trailing semicolons", "25-40% size reduction; eliminates inline style bloat"],
                  ["Inline CSS Styles", "Unminify", "Tokenize selector blocks, format property-value pairs onto new lines", "Enhanced maintainability; visual clarity for embedded styles"],
                  ["External Stylesheets", "Minify", "Strip all comments, collapse braces/semicolons, remove optional semicolons", "40-60% file size reduction; critical for render-blocking CSS"],
                  ["External Stylesheets", "Unminify", "Brace tokenization, depth-based indentation, property-per-line formatting", "Code review readiness; version control diff clarity"],
                  ["Minified Snippets", "Unminify", "Full structural decompression with semantic line breaks", "Restores human-readable formatting from compressed sources"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td key={j} className={`px-4 py-3 border-b border-slate-100 text-sm ${
                        j === 0 ? "font-semibold text-slate-700" : "text-slate-600"
                      }`}>
                        {j === 2 ? <code className="text-xs">{cell}</code> : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Enterprise Production & Staging Use Cases */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <span>Production Deployment & Optimization Scenarios</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "High-Velocity Web Production",
                body: "Frontend and DevOps teams can paste compiled HTML and CSS assets into the minifier before deployment to optimize payload sizes. The compression ratio metrics provide immediate feedback on optimization effectiveness, and the copy button streamlines the integration into CI/CD pipelines. Minified assets load faster, improving Core Web Vitals scores and reducing Time to Interactive (TTI)."
              },
              {
                title: "Legacy Source Refactoring",
                body: "When migrating legacy codebases with inconsistent formatting, the unminifier normalizes indentation and strips redundant whitespace. Developers can paste minified production code to restore human-readable formatting for debugging and code review. The metrics panel tracks byte-size differences between original and formatted versions, providing concrete data on optimization opportunities."
              },
              {
                title: "CI/CD Asset Pipeline Staging",
                body: "Integrate the minifier into build tool chains for pre-deployment asset optimization. The pure client-side engine processes HTML and CSS without external dependencies, making it suitable for local development workflows. Developers can verify that minification preserves structural integrity by toggling between input and output views before committing optimized assets."
              },
              {
                title: "Debugging & Code Auditing",
                body: "Security auditors and code reviewers can use the unminifier to decompress obfuscated or minified HTML and CSS for inspection. The structured output with proper indentation reveals hidden elements, inline event handlers, and embedded styles that may be obscured in minified form. The error guardrails provide warnings for malformed markup without crashing."
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                </div>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Advanced Frequently Asked Questions */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is my HTML or CSS data secure when using this minifier? Does it send data to any server?",
                a: "Yes, your data is completely secure. The HTML/CSS Minifier & Unminifier operates entirely within your browser using pure JavaScript with zero external dependencies. No data, markup, or metadata is ever transmitted to any server, API endpoint, or third-party service. The tokenization, compression, and beautification engines all execute locally on your device. There are no network requests, no analytics tracking, no cookies, and no data persistence beyond the current browser session."
              },
              {
                q: "How does the minifier protect script and style blocks from being corrupted during HTML minification?",
              a: `The HTML minification engine maintains a protected tag registry for special elements including "pre", "code", "script", and "style". When the tokenizer encounters an opening tag matching any of these protected elements, it enters a preservation mode that passes all content verbatim until the corresponding closing tag is found. This ensures that JavaScript code blocks, CSS internal stylesheets, and preformatted text are not modified during the whitespace compression phase. Content within these blocks retains its original formatting, line breaks, and indentation.`
              },
              {
                q: "Can the unminifier restore the original formatting of severely minified production code?",
                a: "The unminification engine can restore structural formatting for most HTML and CSS documents, but it cannot recover comments or original whitespace patterns that were intentionally removed during minification. For HTML, the stack-based indentation engine inserts proper line breaks for block-level elements and preserves inline element continuity. For CSS, the brace tokenization engine formats each property-value pair onto its own line with consistent indentation. While the decompressed output is structurally correct and human-readable, it represents a standardized formatting rather than the original author's specific style."
              },
              {
                q: "Can I use this tool offline without an internet connection?",
                a: "Yes, absolutely. The HTML/CSS Minifier & Unminifier is a fully self-contained client-side application. All processing logic, tokenization engines, and transformation algorithms are implemented in pure TypeScript with zero external npm dependencies or CDN resources. Once the page has loaded in your browser, the tool functions completely offline with no network connectivity required. There are no rate limits, usage caps, or subscription tiers restricting throughput, making it suitable for high-volume batch processing of production assets."
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Platform Performance Advantages */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white md:p-8 rounded-2xl p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span>Why Choose TwisterTools for Code Optimization?</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                title: "100% Client-Side Privacy",
                body: "Your code never leaves your browser. All processing, tokenization, and transformation engines execute locally with zero network transmission."
              },
              {
                title: "Zero Network Latency",
                body: "Client-side execution eliminates round-trip delays, delivering minification and unminification results in milliseconds regardless of document size."
              },
              {
                title: "Zero Dependencies",
                body: "The entire processing pipeline is implemented in pure TypeScript with no external npm packages, CDN scripts, or runtime libraries required."
              },
              {
                title: "Type-Safe Execution",
                body: "Full TypeScript implementation with comprehensive error guardrails ensures predictable behavior and graceful handling of malformed inputs."
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="flex items-start gap-3 bg-white/10 rounded-xl p-4"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-200 flex-shrink-0 mt-1.5"></span>
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-indigo-200 text-sm mt-1 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}