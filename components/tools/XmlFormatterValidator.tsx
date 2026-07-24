"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Braces,
  Check,
  Copy,
  AlertTriangle,
  Trash2,
  Sparkles,
  HelpCircle,
  Cpu,
  Upload,
  FileText,
  FileCode,
  ShieldCheck,
  Table,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TS XML Formatting & Minification Utilities
// ─────────────────────────────────────────────────────────────

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
}

// Recursively serializes a DOM node to a formatted string
function serializeNode(node: Node, depth: number, indent: string): string {
  const currentIndent = indent.repeat(depth);

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tagName = el.tagName;

    // Serialize attributes
    let attrs = "";
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      attrs += ` ${attr.name}="${escapeXml(attr.value)}"`;
    }

    const children = Array.from(el.childNodes);
    if (children.length === 0) {
      return `${currentIndent}<${tagName}${attrs} />`;
    }

    // Check if children is only a single text node
    const isSingleTextNode = children.length === 1 && children[0].nodeType === Node.TEXT_NODE;

    if (isSingleTextNode) {
      const textVal = children[0].nodeValue?.trim() || "";
      if (textVal === "") {
        return `${currentIndent}<${tagName}${attrs} />`;
      }
      return `${currentIndent}<${tagName}${attrs}>${escapeXml(textVal)}</${tagName}>`;
    }

    let childrenSerialized = "";
    let hasValidChildren = false;
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE && !child.nodeValue?.trim()) {
        continue;
      }
      const childStr = serializeNode(child, depth + 1, indent);
      if (childStr) {
        childrenSerialized += "\n" + childStr;
        hasValidChildren = true;
      }
    }

    if (hasValidChildren) {
      return `${currentIndent}<${tagName}${attrs}>${childrenSerialized}\n${currentIndent}</${tagName}>`;
    } else {
      return `${currentIndent}<${tagName}${attrs} />`;
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    const textVal = node.nodeValue?.trim();
    if (!textVal) return "";
    return `${currentIndent}${escapeXml(textVal)}`;
  } else if (node.nodeType === Node.COMMENT_NODE) {
    return `${currentIndent}<!-- ${node.nodeValue?.trim()} -->`;
  } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${currentIndent}<![CDATA[${node.nodeValue}]]>`;
  } else if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    const pi = node as ProcessingInstruction;
    return `${currentIndent}<?${pi.target} ${pi.data}?>`;
  }

  return "";
}

// Recursively serializes a DOM node to a minified string
function serializeNodeMinified(node: Node): string {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tagName = el.tagName;

    let attrs = "";
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      attrs += ` ${attr.name}="${escapeXml(attr.value)}"`;
    }

    const children = Array.from(el.childNodes);
    if (children.length === 0) {
      return `<${tagName}${attrs}/>`;
    }

    let childrenSerialized = "";
    for (const child of children) {
      childrenSerialized += serializeNodeMinified(child);
    }

    if (childrenSerialized === "") {
      return `<${tagName}${attrs}/>`;
    }

    return `<${tagName}${attrs}>${childrenSerialized}</${tagName}>`;
  } else if (node.nodeType === Node.TEXT_NODE) {
    return escapeXml(node.nodeValue?.trim() || "");
  } else if (node.nodeType === Node.COMMENT_NODE) {
    // Comments are completely stripped for clean minification
    return "";
  } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `<![CDATA[${node.nodeValue}]]>`;
  } else if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    const pi = node as ProcessingInstruction;
    return `<?${pi.target} ${pi.data}?>`;
  }
  return "";
}

// Balances unclosed tags to prevent parser crashes
function fixUnclosedTags(xmlStr: string): string {
  const tagRegex = /(<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[a-zA-Z0-9_\-:]+|\/?>)/g;
  let match;
  const tokens: { type: "text" | "open" | "close" | "selfclose" | "special"; value: string; tagName?: string }[] = [];
  let lastIndex = 0;

  while ((match = tagRegex.exec(xmlStr)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: xmlStr.substring(lastIndex, match.index) });
    }

    const tagText = match[0];
    if (tagText.startsWith("<!--") || tagText.startsWith("<?") || tagText.startsWith("<!")) {
      tokens.push({ type: "special", value: tagText });
    } else if (tagText.startsWith("</")) {
      const tagName = tagText.slice(2).trim().split(/\s+/)[0].replace(/>$/, "");
      tokens.push({ type: "close", value: tagText + (tagText.endsWith(">") ? "" : ">"), tagName });
    } else if (tagText.endsWith("/>")) {
      tokens.push({ type: "selfclose", value: tagText });
    } else {
      const tagName = tagText.slice(1).trim().split(/\s+/)[0].replace(/>$/, "");
      tokens.push({ type: "open", value: tagText + (tagText.endsWith(">") ? "" : ">"), tagName });
    }
    lastIndex = tagRegex.lastIndex;
  }
  if (lastIndex < xmlStr.length) {
    tokens.push({ type: "text", value: xmlStr.substring(lastIndex) });
  }

  const openStack: string[] = [];
  let rebuilt = "";

  for (const token of tokens) {
    if (token.type === "open" && token.tagName) {
      openStack.push(token.tagName);
      rebuilt += token.value;
    } else if (token.type === "close" && token.tagName) {
      const idx = openStack.lastIndexOf(token.tagName);
      if (idx !== -1) {
        while (openStack.length > idx + 1) {
          const unclosed = openStack.pop();
          rebuilt += `</${unclosed}>`;
        }
        openStack.pop();
        rebuilt += token.value;
      } else {
        // Discard extra closing tags to heal structural integrity
      }
    } else {
      rebuilt += token.value;
    }
  }

  while (openStack.length > 0) {
    const unclosed = openStack.pop();
    rebuilt += `</${unclosed}>`;
  }

  return rebuilt;
}

// Walks parsed DOM to extract high-density metrics
function getXmlMetrics(doc: Document): { nodeCount: number; maxDepth: number; attrCount: number } {
  let nodeCount = 0;
  let maxDepth = 0;
  let attrCount = 0;

  function walk(node: Node, depth: number) {
    nodeCount++;
    if (depth > maxDepth) {
      maxDepth = depth;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      attrCount += el.attributes.length;

      const children = Array.from(el.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.TEXT_NODE && !child.nodeValue?.trim()) {
          continue;
        }
        walk(child, depth + 1);
      }
    }
  }

  if (doc.documentElement) {
    walk(doc.documentElement, 1);
  }

  return { nodeCount, maxDepth, attrCount };
}

// Helper to format file sizes nicely
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// XML Custom syntax highlighter for read-only view
const highlightXml = (xml: string) => {
  if (!xml) return null;

  const regex = /(<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[a-zA-Z0-9_\-:]+|\/?>|xmlns(?::[a-zA-Z0-9_\-]+)?="[^"]*"|xmlns(?::[a-zA-Z0-9_\-]+)?='[^']*'|[a-zA-Z0-9_\-:]+="[^"]*"|[a-zA-Z0-9_\-:]+='[^']*')/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    if (match.index > lastIndex) {
      parts.push(xml.substring(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("<!--")) {
      parts.push(
        <span key={match.index} className="text-slate-500 italic">
          {token}
        </span>
      );
    } else if (token.startsWith("<![CDATA[")) {
      parts.push(
        <span key={match.index} className="text-purple-400">
          {token}
        </span>
      );
    } else if (token.startsWith("<?")) {
      parts.push(
        <span key={match.index} className="text-amber-500 font-medium">
          {token}
        </span>
      );
    } else if (token.startsWith("<") || token.startsWith("</")) {
      parts.push(
        <span key={match.index} className="text-sky-400 font-semibold">
          {token}
        </span>
      );
    } else if (token === ">" || token === "/>") {
      parts.push(
        <span key={match.index} className="text-slate-400">
          {token}
        </span>
      );
    } else if (token.includes("=")) {
      const eqIdx = token.indexOf("=");
      const attrName = token.slice(0, eqIdx);
      const attrVal = token.slice(eqIdx);
      const isXmlns = attrName.startsWith("xmlns");

      parts.push(
        <span key={match.index + "_name"} className={isXmlns ? "text-indigo-400 font-semibold" : "text-amber-400 font-semibold"}>
          {attrName}
        </span>
      );
      parts.push("=");
      parts.push(
        <span key={match.index + "_val"} className="text-emerald-400">
          {attrVal.slice(1)}
        </span>
      );
    } else {
      parts.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < xml.length) {
    parts.push(xml.substring(lastIndex));
  }

  return parts;
};

// ─────────────────────────────────────────────────────────────
//  Main XML Formatter Component
// ─────────────────────────────────────────────────────────────
export default function XmlFormatterValidator() {
  const [input, setInput] = useState("");
  const [indentSize, setIndentSize] = useState<"2" | "4" | "tab">("2");
  const [fixUnclosed, setFixUnclosed] = useState(false);
  const [copied, setCopied] = useState(false);

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll Sync Refs
  const lineGutterRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  const loadSampleXml = () => {
    const sample = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore xmlns:store="https://example.com/store">
  <book category="cooking" id="bk101">
    <title lang="en">Everyday Italian</title>
    <author>Giada De Laurentiis</author>
    <year>2005</year>
    <price currency="USD">30.00</price>
    <store:inventory>15</store:inventory>
  </book>
  <book category="children" id="bk102">
    <title lang="en">Harry Potter</title>
    <author>J. K. Rowling</author>
    <year>2005</year>
    <price currency="GBP">29.99</price>
    <store:inventory>8</store:inventory>
  </book>
  <!-- Optional XML CDATA tag for demo -->
  <description><![CDATA[Contains special characters like & and < safely inside CDATA!]]></description>
</bookstore>`;
    setInput(sample);
    setFileInfo(null);
    setFileError("");
  };

  // ── In-place Transformations ──
  const handleBeautifyInput = () => {
    if (!input.trim()) return;
    try {
      let clean = input;
      if (fixUnclosed) {
        clean = fixUnclosedTags(input);
      }
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(clean, "application/xml");
      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) return;

      const declMatch = clean.trim().match(/^<\?xml[^>]*\?>/i);
      const declaration = declMatch ? declMatch[0] : "";

      const indent = indentSize === "tab" ? "\t" : parseInt(indentSize, 10);
      const spacer = typeof indent === "string" ? indent : " ".repeat(indent);
      const body = serializeNode(xmlDoc.documentElement, 0, spacer);
      setInput(declaration ? `${declaration}\n${body}` : body);
    } catch (err) {
      // Handled reactively
    }
  };

  const handleMinifyInput = () => {
    if (!input.trim()) return;
    try {
      let clean = input;
      if (fixUnclosed) {
        clean = fixUnclosedTags(input);
      }
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(clean, "application/xml");
      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) return;

      const declMatch = clean.trim().match(/^<\?xml[^>]*\?>/i);
      const declaration = declMatch ? declMatch[0] : "";
      const body = serializeNodeMinified(xmlDoc.documentElement);
      setInput(declaration ? `${declaration}${body}` : body);
    } catch (err) {
      // Handled reactively
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
  let xmlMetrics = { nodeCount: 0, maxDepth: 0, attrCount: 0 };
  let parseError: { message: string; line: number; column: number } | null = null;
  let formattedOutput = "";

  if (input.trim()) {
    try {
      let cleanInput = input;
      if (fixUnclosed) {
        cleanInput = fixUnclosedTags(input);
      }
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(cleanInput, "application/xml");
      const parserErrorNodes = xmlDoc.getElementsByTagName("parsererror");

      if (parserErrorNodes.length > 0) {
        const msg = parserErrorNodes[0].textContent || "XML parsing syntax violation";
        let line = 1;
        let column = 1;

        // Parse line/col out of DOMParser error block
        const lineColMatch =
          msg.match(/line\s+(\d+)\s+at\s+column\s+(\d+)/i) ||
          msg.match(/line\s+(\d+),\s+column\s+(\d+)/i) ||
          msg.match(/at\s+line\s+(\d+),\s+column\s+(\d+)/i) ||
          msg.match(/on\s+line\s+(\d+)\s+at\s+column\s+(\d+)/i);

        if (lineColMatch) {
          line = parseInt(lineColMatch[1], 10);
          column = parseInt(lineColMatch[2], 10);
        } else {
          // Fallback line scan for unclosed element elements
          const lines = cleanInput.split("\n");
          line = lines.length;
          column = lines[lines.length - 1].length + 1;
        }

        parseError = {
          message: msg,
          line,
          column,
        };
      } else {
        // Success
        xmlMetrics = getXmlMetrics(xmlDoc);
        const declMatch = cleanInput.trim().match(/^<\?xml[^>]*\?>/i);
        const declaration = declMatch ? declMatch[0] : "";
        const indent = indentSize === "tab" ? "\t" : parseInt(indentSize, 10);
        const spacer = typeof indent === "string" ? indent : " ".repeat(indent);
        const body = serializeNode(xmlDoc.documentElement, 0, spacer);
        formattedOutput = declaration ? `${declaration}\n${body}` : body;
      }
    } catch (err: any) {
      parseError = {
        message: err.message || "Failed to process XML structures.",
        line: 1,
        column: 1,
      };
    }
  }

  // ── Sizes and Compressions ──
  const inputSize = new Blob([input]).size;
  const outputSize = formattedOutput ? new Blob([formattedOutput]).size : 0;
  const compressionRatio =
    inputSize && outputSize
      ? parseFloat((((inputSize - outputSize) / inputSize) * 100).toFixed(1))
      : 0;

  // Line numbers calculation for Gutter
  const lineCount = input.split("\n").length || 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: WORKSPACE INPUT ══════════════════ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Braces className="w-5 h-5 text-indigo-600" />
              XML Input Editor
            </h2>
            {input.trim() && (
              <span className="text-xs text-slate-500 font-medium">
                {lineCount} Line{lineCount !== 1 ? "s" : ""} &bull; {input.length} Chars
              </span>
            )}
          </div>

          {/* Code Editor Container */}
          <div className="relative flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent min-h-[360px] max-h-[480px]">
            {/* Scroll-synced Line Numbers Gutter */}
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
              placeholder="Paste raw, unformatted XML here or drag-and-drop an XML asset file..."
              className="flex-1 bg-transparent font-mono text-xs text-slate-800 placeholder-slate-400 py-3 px-3 outline-none resize-none overflow-auto leading-6 min-h-[360px] max-h-[480px]"
              style={{ whiteSpace: "pre", overflowWrap: "normal" }}
              id="xml-input-editor"
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
              accept=".xml,.txt"
              className="hidden"
              onChange={handleFileSelect}
              id="xml-file-input"
            />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-700">
                  {isDragging ? "Drop XML file here" : "Drag & drop XML file or click to browse"}
                </p>
                <p className="text-[10px] text-slate-500">Upload file up to 5 MB</p>
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
                  <span className="text-slate-500 text-[10px]">{formatFileSize(fileInfo.size)}</span>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleBeautifyInput}
                disabled={!input.trim() || !!parseError}
                className="h-10 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
              >
                Format / Beautify
              </button>
              <button
                onClick={handleMinifyInput}
                disabled={!input.trim() || !!parseError}
                className="h-10 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
              >
                Minify / Compact
              </button>
              <button
                onClick={loadSampleXml}
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                Formatted Output
              </h2>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="fix-tags-toggle" className="text-xs font-medium text-slate-600 cursor-pointer">
                    Fix Unclosed Tags
                  </label>
                  <button
                    id="fix-tags-toggle"
                    role="switch"
                    aria-checked={fixUnclosed}
                    onClick={() => setFixUnclosed((prev) => !prev)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      fixUnclosed ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                        fixUnclosed ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Native V8 Syntax Error Banner */}
            {parseError && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-red-800">
                      XML Parser Error Detected
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

            {/* Read-only Formatted Monospace Code surface */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 min-h-[220px] max-h-[340px] overflow-auto">
              {formattedOutput ? (
                <pre className="font-mono text-xs whitespace-pre leading-6 text-indigo-400">
                  <code>{highlightXml(formattedOutput)}</code>
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[180px] text-slate-500">
                  <FileCode className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                  <p className="text-xs italic">
                    {input.trim() ? "Resolve errors to inspect output..." : "No XML payload loaded."}
                  </p>
                </div>
              )}
            </div>

            {/* Copy Button */}
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
                  Copy Formatted XML
                </>
              )}
            </button>
          </div>

          {/* High-Density Metrics Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              XML Document Metrics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Size Change</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {compressionRatio > 0 ? `+${compressionRatio}%` : `${compressionRatio}%`}
                </p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Payload Sizes</p>
                <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                  <span className="text-sm font-bold text-slate-800">{formatFileSize(inputSize)}</span>
                  <span className="text-slate-400 text-xs">vs</span>
                  <span className="text-xs font-semibold text-slate-600">{formatFileSize(outputSize)}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Node Count</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{xmlMetrics.nodeCount}</p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Max Nesting Depth</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{xmlMetrics.maxDepth}</p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl col-span-2">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Attributes Counter</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{xmlMetrics.attrCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD AUTHORITATIVE SEO CONTENT
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6 pt-6">
        {/* Section 1: Detailed Technical Overview */}
        <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200/60 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Braces className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            What is the XML Formatter, Validator & Viewer?
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-4">
            Extensible Markup Language (XML) is a fundamental, W3C-standardized meta-language designed to store, transmit, and represent structured records in a self-descriptive format. Widely utilized in SOAP web services, legacy enterprise architectures, RSS feeds, Android layouts, and system configuration files, XML enforces strict hierarchical constraints. However, automated systems and API endpoints often transmit these documents in highly minified, single-line configurations to optimize payload footprints. This makes inspecting schema layouts or debugging anomalies exceptionally difficult for developers.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The TwisterTools XML Formatter, Validator & Viewer provides a premium, zero-dependency workspace that resolves these challenges entirely on the client side. By translating raw string inputs into a robust virtual DOM tree using browser-native parsers, it ensures that your configuration payloads, security tokens, and corporate files never traverse any network interfaces. It operates 100% sandboxed in your browser to deliver professional performance with total privacy.
          </p>
        </div>

        {/* Section 2: The Parsing and Validation Mechanism */}
        <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200/60 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
            <Cpu className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            How the XML Validation Mechanism Operates Step-by-Step
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                num: "01",
                title: "Input Sanitization & Ingestion",
                body: "Ingests raw text streams or files through the client FileReader boundary, validating file limits up to 5 MB entirely inside local memory stacks.",
              },
              {
                num: "02",
                title: "Tokenization & Tree Building",
                body: "Leverages the browser-native DOMParser to translate character arrays into a structural Document Object Model (DOM) tree structure dynamically.",
              },
              {
                num: "03",
                title: "Structural Integrity Checks",
                body: "Scans node pairs to identify missing closing tags, misaligned attributes, unquoted metadata properties, or character encoding mismatches.",
              },
              {
                num: "04",
                title: "Node Serialization & Beautification",
                body: "Re-serializes nodes using custom spacing loops based on the user-selected indentation depth parameters (2 spaces, 4 spaces, or Tab characters).",
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="bg-slate-50 border border-slate-200/50 rounded-xl p-5">
                <span className="text-indigo-600 text-sm font-bold block mb-2">{num}.</span>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: XML Specifications & Compliance Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <Table className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            <span>XML Validation & Compliance Metrics</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white">
                <tr>
                  {["Structural Feature", "Well-Formed XML", "Valid XML (DTD/Schema)", "HTML5 (Comparison)"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Element Nesting", "Must follow strict hierarchical overlapping rules", "Must match rules defined in DTD / XSD schemas", "Permissive tag overlapping rendering"],
                  ["Attribute Quoting", "Mandatory single or double quotes", "Mandatory; must conform to schema types", "Optional in some specific DOM contexts"],
                  ["XML Declaration", "Highly recommended; defines encoding version", "Mandatory if validating against strict schemas", "Replaced by <!DOCTYPE html> preamble"],
                  ["Closing Tags", "Strictly required for all non-empty elements", "Strictly required; validates structural elements", "Optional for self-closing or void elements"],
                  ["Namespace Compliance", "Supported natively via prefix mappings", "Validated; namespaces must match targets", "HTML5 elements map to default namespace"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 border-b border-slate-100 text-sm ${
                          j === 0
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

        {/* Section 4: Advanced Frequently Asked Questions (FAQ) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Does this XML formatter send my data or server configurations to an external server?",
                a: "No. TwisterTools operates entirely inside your local browser sandboxed context using client-side JavaScript APIs. Your configuration files, payloads, and text credentials never cross a network interface.",
              },
              {
                q: "What causes the 'error on line X at column Y' parser warning?",
                a: "This occurs when the browser's native parsing framework encounters a structural violation of the W3C XML specifications, typically triggered by unescaped special characters (like ampersands), unquoted attributes, or mismatched tags.",
              },
              {
                q: "How does the Minify option differ from the Formatter module?",
                a: "The Formatter expands your tree structurally by introducing indentation levels and carriage returns for human optimization. The Minifier strips out insignificative whitespace, line breaks, and comments to drastically compress payload size for production routing.",
              },
              {
                q: "Can this tool handle large configuration files or Android layout layouts?",
                a: "Yes. The execution runtime easily formats and evaluates typical app configurations and layouts up to 5 MB instantly without browser lag.",
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

        {/* Section 5: Why Choose TwisterTools for XML Processing */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg text-white">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose TwisterTools for XML Processing?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "100% Offline Processing",
                body: "Every DOM validation, serialization, and syntax highlighting calculation is done locally. Your secret credentials never leave your workspace.",
              },
              {
                icon: Cpu,
                title: "Real-time Responsive Analytics",
                body: "Live sizing updates, node depth tracking, and attribute counters refresh on every single input update without blocking the event loop.",
              },
              {
                icon: AlertTriangle,
                title: "Dynamic Error Tracing",
                body: "The parser captures syntax compiler violations to pinpoint line/column errors so you can debug faulty SOAP/REST payloads immediately.",
              },
              {
                icon: FileCode,
                title: "Focused Workspace Environment",
                body: "Clean, ads-light, zero-dependency architecture that runs instantly and stays optimized even under memory-constrained mobile environments.",
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

      {/* JSON-LD Structured Data */}
      <div className="hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "name": "XML Formatter, Validator & Viewer",
                  "description": "Free client-side tool to format, validate, beautify, and minify XML data instantly with syntax highlighting and zero data transmission.",
                  "applicationCategory": "DeveloperApplication",
                  "operatingSystem": "Any",
                  "browserRequirements": "Requires JavaScript. Supports offline operations.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "featureList": [
                    "Client-side XML parsing and syntax validation using native DOMParser",
                    "Real-time syntax highlighting for elements, attributes, namespaces, comments, and CDATA",
                    "Recursive nodes beautifier with space and tab selectors",
                    "High-density XML metrics grid including node counts, attributes, and max nesting depth",
                    "Self-healing switch to balance unclosed tags automatically",
                    "FileReader API drag-and-drop layer for files up to 5 MB",
                    "Zero network traffic and complete data privacy protection"
                  ]
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Does this XML formatter send my data or server configurations to an external server?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "No. TwisterTools operates entirely inside your local browser sandboxed context using client-side JavaScript APIs. Your configuration files, payloads, and text credentials never cross a network interface."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "What causes the 'error on line X at column Y' parser warning?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "This occurs when the browser's native parsing framework encounters a structural violation of the W3C XML specifications, typically triggered by unescaped special characters (like ampersands), unquoted attributes, or mismatched tags."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "How does the Minify option differ from the Formatter module?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "The Formatter expands your tree structurally by introducing indentation levels and carriage returns for human optimization. The Minifier strips out insignificative whitespace, line breaks, and comments to drastically compress payload size for production routing."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can this tool handle large configuration files or Android layout layouts?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. The execution runtime easily formats and evaluates typical app configurations and layouts up to 5 MB instantly without browser lag."
                      }
                    }
                  ]
                }
              ]
            })
          }}
        />
      </div>
    </div>
  );
}
