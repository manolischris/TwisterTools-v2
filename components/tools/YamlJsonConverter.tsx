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
  Table,
  Zap,
  Shield,
  Eye,
  Upload,
  ChevronDown,
  ChevronRight,
  ListOrdered,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript YAML Parser & Stringifier Engine
//  100% Client-Side — Zero External Dependencies
// ─────────────────────────────────────────────────────────────

type ConversionMode = "yaml-to-json" | "json-to-yaml" | "yaml-beautify" | "json-minify";

const MODES: ConversionMode[] = ["yaml-to-json", "json-to-yaml", "yaml-beautify", "json-minify"];

const MODE_LABELS: Record<ConversionMode, string> = {
  "yaml-to-json": "YAML to JSON",
  "json-to-yaml": "JSON to YAML",
  "yaml-beautify": "YAML Beautify",
  "json-minify": "JSON Minify",
};

// ── YAML Scalar Value Parsing ─────────────────────────────

function parseYamlScalar(value: string): any {
  const trimmed = value.trim();
  if (trimmed === "null" || trimmed === "~") return null;
  if (trimmed === "true" || trimmed === "yes" || trimmed === "on") return true;
  if (trimmed === "false" || trimmed === "no" || trimmed === "off") return false;
  if (/^-?\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10);
    if (isFinite(n)) return n;
  }
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    const n = parseFloat(trimmed);
    if (isFinite(n)) return n;
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

// ── YAML to JSON Parser ─────────────────────────────────

function parseYamlToObject(yaml: string): any {
  const lines = yaml.split("\n");
  const root: any = { _keys: [] };
  const path: { key: string; indent: number; isMap: boolean; obj: any }[] = [
    { key: "", indent: -1, isMap: true, obj: root },
  ];

  const multiLineBuffer: string[] = [];
  let inMultiLine = false;
  let multiLineIndent = 0;
  let multiLineKey = "";
  let multiLineParent: any = null;
  let multiLineStyle = "";

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.replace(/\r$/, "");

    if (inMultiLine) {
      const contentIndent = line.search(/\S/);
      if (contentIndent < 0) {
        multiLineBuffer.push("");
        continue;
      }
      if (contentIndent <= multiLineIndent) {
        inMultiLine = false;
        const text = joinMultiLine(multiLineBuffer, multiLineStyle);
        assignValue(multiLineParent, multiLineKey, text);
        multiLineBuffer.length = 0;
      } else {
        multiLineBuffer.push(line.trimEnd());
        continue;
      }
    }

    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const indent = line.search(/\S/);

    if (trimmed.endsWith("|") || trimmed.endsWith(">")) {
      const [keyPart] = trimmed.split(/\s*\||\s*>/);
      const colonIdx = keyPart.indexOf(":");
      if (colonIdx >= 0) {
        const key = keyPart.substring(0, colonIdx).trim();
        multiLineStyle = trimmed.endsWith("|") ? "|" : ">";
        multiLineIndent = indent;
        multiLineKey = key;
        multiLineParent = findParentForIndent(path, indent);
        inMultiLine = true;
        continue;
      }
    }

    while (path.length > 1 && path[path.length - 1].indent >= indent) {
      path.pop();
    }

    const parent = path[path.length - 1];
    const parentObj = parent.obj;
    const isArrayItem = trimmed.startsWith("- ");
    let content: string;
    if (isArrayItem) { content = trimmed.substring(2).trim(); }
    else { content = trimmed; }

    const colonIdx = findColonIndex(content);

    if (colonIdx >= 0) {
      const key = content.substring(0, colonIdx).trim();
      let valuePart = content.substring(colonIdx + 1).trim();
      let value: any;
      const isEmpty = valuePart === "";
      if (isEmpty) { value = {}; }
      else { value = parseYamlScalar(valuePart); }

      if (isArrayItem) {
        let array = ensureArray(parentObj, parent.isMap ? parent.key : "items");
        const obj: any = {};
        obj[key] = value;
        obj._keys = [key];
        array.push(obj);
        path.push({ key, indent, isMap: !isEmpty, obj: isEmpty ? value : obj });
      } else {
        assignValue(parentObj, key, value);
        if (!isEmpty) { path.push({ key, indent, isMap: true, obj: value }); }
        else {
          const obj = parentObj[key] || {};
          parentObj[key] = obj;
          if (typeof obj === "object" && !Array.isArray(obj)) {
            path.push({ key, indent, isMap: true, obj });
          }
        }
      }
    } else if (isArrayItem) {
      const value = parseYamlScalar(content);
      let array = ensureArray(parentObj, parent.isMap ? parent.key : "items");
      array.push(value);
    } else {
      const key = content;
      assignValue(parentObj, key, {});
      path.push({ key, indent, isMap: true, obj: parentObj[key] || {} });
    }
  }

  if (inMultiLine) {
    const text = joinMultiLine(multiLineBuffer, multiLineStyle);
    assignValue(multiLineParent, multiLineKey, text);
  }

  return convertFromYamlTree(root);
}

function findColonIndex(content: string): number {
  let inSingle = false, inDouble = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === ":" && !inSingle && !inDouble) return i;
  }
  return -1;
}

function findParentForIndent(path: any[], indent: number): any {
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i].indent < indent) return path[i].obj;
  }
  return path[0].obj;
}

function assignValue(obj: any, key: string, value: any): void {
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[obj.length - 1] === "object" && !Array.isArray(obj[obj.length - 1])) {
      obj[obj.length - 1][key] = value;
    }
    return;
  }
  obj[key] = value;
  if (!obj._keys) obj._keys = [];
  if (!obj._keys.includes(key)) obj._keys.push(key);
}

function ensureArray(obj: any, key: string): any[] {
  if (Array.isArray(obj)) return obj;
  if (!obj[key]) { obj[key] = []; if (!obj._keys) obj._keys = []; if (!obj._keys.includes(key)) obj._keys.push(key); }
  else if (!Array.isArray(obj[key])) { obj[key] = [obj[key]]; }
  return obj[key];
}

function joinMultiLine(lines: string[], style: string): string {
  if (style === ">") return lines.join(" ").replace(/\s+/g, " ").trim();
  return lines.join("\n");
}

function convertFromYamlTree(node: any): any {
  if (node === null || node === undefined) return node;
  if (typeof node !== "object") return node;
  if (Array.isArray(node)) return node.map((item) => convertFromYamlTree(item));
  const keys = node._keys || Object.keys(node).filter((k) => !k.startsWith("_"));
  const result: any = {};
  for (const key of keys) {
    if (key.startsWith("_")) continue;
    result[key] = convertFromYamlTree(node[key]);
  }
  return result;
}

// ── JSON to YAML Stringifier ─────────────────────────────

function stringifyToYaml(obj: any, indent: number = 0): string {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "string") {
    if (/[:\{\}\[\],&\*\?\|<>=!%@`#]/.test(obj) || obj.includes("\n") || obj === "" || obj.startsWith(" ") || obj.endsWith(" ") || /^\d/.test(obj) || obj === "true" || obj === "false" || obj === "yes" || obj === "no" || obj === "on" || obj === "off" || obj === "null" || obj === "~") {
      return quoteYamlString(obj);
    }
    return obj;
  }
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "boolean") return obj ? "true" : "false";

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const prefix = " ".repeat(indent);
    const items: string[] = [];
    for (const item of obj) {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const keys = Object.keys(item);
        if (keys.length > 0) {
          items.push(prefix + `- ${keys[0]}: ${stringifyToYaml(item[keys[0]], indent + 4)}`);
          for (let i = 1; i < keys.length; i++) {
            items.push(stringifyToYamlItem(keys[i], item[keys[i]], indent + 2));
          }
        } else { items.push(prefix + "- {}"); }
      } else if (Array.isArray(item)) {
        items.push(prefix + "-");
        const subLines = stringifyToYaml(item, indent + 2).split("\n");
        for (const line of subLines) { items.push(" ".repeat(indent + 2) + line); }
      } else {
        items.push(prefix + `- ${stringifyToYaml(item, indent + 2)}`);
      }
    }
    return items.join("\n");
  }

  const keys = Object.keys(obj);
  if (keys.length === 0) return "{}";
  return keys.map((key) => stringifyToYamlItem(key, obj[key], indent)).join("\n");
}

function stringifyToYamlItem(key: string, val: any, indent: number): string {
  const prefix = " ".repeat(indent);
  const yamlKey = /[:\{\}\[\],&\*\?\|<>=!%@`#\s]/.test(key) ? `"${key.replace(/"/g, '\\"')}"` : key;
  if (val === null || val === undefined) return `${prefix}${yamlKey}: null`;
  if (typeof val === "string") {
    const needsQuoting = /[:\{\}\[\],&\*\?\|<>=!%@`#]/.test(val) || val.includes("\n") || val === "" || val.startsWith(" ") || val.endsWith(" ") || /^\d/.test(val) || ["true","false","yes","no","on","off","null","~"].includes(val);
    if (val.includes("\n")) return `${prefix}${yamlKey}: |\n${val.split("\n").map((l) => `  ${prefix}${l}`).join("\n")}`;
    return `${prefix}${yamlKey}: ${needsQuoting ? quoteYamlString(val) : val}`;
  }
  if (typeof val === "number" || typeof val === "boolean") return `${prefix}${yamlKey}: ${String(val)}`;
  if (Array.isArray(val)) {
    if (val.length === 0) return `${prefix}${yamlKey}: []`;
    const lines: string[] = [`${prefix}${yamlKey}:`];
    for (const item of val) {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const itemKeys = Object.keys(item);
        if (itemKeys.length > 0) {
          lines.push(`${prefix}  - ${itemKeys[0]}: ${stringifyToYaml(item[itemKeys[0]], indent + 4)}`);
          for (let j = 1; j < itemKeys.length; j++) {
            lines.push(stringifyToYamlItem(itemKeys[j], item[itemKeys[j]], indent + 4));
          }
        } else { lines.push(`${prefix}  - {}`); }
      } else {
        lines.push(`${prefix}  - ${stringifyToYaml(item, indent + 2)}`);
      }
    }
    return lines.join("\n");
  }
  if (typeof val === "object") {
    const subKeys = Object.keys(val);
    if (subKeys.length === 0) return `${prefix}${yamlKey}: {}`;
    return `${prefix}${yamlKey}:\n${subKeys.map((sk) => stringifyToYamlItem(sk, val[sk], indent + 2)).join("\n")}`;
  }
  return `${prefix}${yamlKey}: ${String(val)}`;
}

function quoteYamlString(str: string): string {
  if (str.includes('"')) return `'${str.replace(/'/g, "''")}'`;
  return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// ── Key Count ────────────────────────────────────────────

function countKeys(obj: any): number {
  if (obj === null || obj === undefined || typeof obj !== "object") return 0;
  let count = 0;
  if (Array.isArray(obj)) { for (const item of obj) { count += countKeys(item); } return count; }
  for (const key of Object.keys(obj)) { count++; if (typeof obj[key] === "object" && obj[key] !== null) { count += countKeys(obj[key]); } }
  return count;
}

// ── Format Size Helper ───────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes.toFixed(1) + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ── Sample Data ───────────────────────────────────────────

const SAMPLE_YAML = `# Sample Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web
    tier: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
          env:
            - name: ENVIRONMENT
              value: production
            - name: LOG_LEVEL
              value: debug
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
`;

const SAMPLE_JSON = `{
  "project": "TwisterTools",
  "version": "2.0.0",
  "description": "A comprehensive suite of online developer tools",
  "features": [
    "YAML to JSON Conversion",
    "JSON to YAML Conversion",
    "YAML Beautification",
    "JSON Minification"
  ],
  "metadata": {
    "author": "TwisterTools Team",
    "license": "MIT",
    "repository": {
      "type": "git",
      "url": "https://github.com/twistertools/twistertools"
    }
  },
  "dependencies": {
    "typescript": "^5.0.0",
    "react": "^18.0.0",
    "next": "^14.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}`;

// ── Tree View Component ───────────────────────────────────

function JsonTreeView({ data, depth = 0 }: { data: any; depth?: number }): React.ReactNode {
  const [collapsed, setCollapsed] = useState(depth > 2);

  if (data === null || data === undefined) return <span className="text-slate-400">{String(data)}</span>;
  if (typeof data === "string") return <span className="text-emerald-400">"{data}"</span>;
  if (typeof data === "number") return <span className="text-blue-400">{data}</span>;
  if (typeof data === "boolean") return <span className="text-purple-400">{data ? "true" : "false"}</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-400">[]</span>;
    return (
      <div className="ml-4">
        <button onClick={() => setCollapsed(!collapsed)} className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>Array [{data.length}]</span>
        </button>
        {!collapsed && (
          <div className="ml-2 border-l-2 border-slate-700 pl-3 mt-1 space-y-1">
            {data.map((item: any, idx: number) => (
              <div key={idx} className="text-sm"><span className="text-slate-500 font-mono mr-2">{idx}:</span><JsonTreeView data={item} depth={depth + 1} /></div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span className="text-slate-400">{'{}'}</span>;
    return (
      <div className="ml-4">
        <button onClick={() => setCollapsed(!collapsed)} className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>Object {'{'} {keys.length} {'}'}</span>
        </button>
        {!collapsed && (
          <div className="ml-2 border-l-2 border-slate-700 pl-3 mt-1 space-y-1">
            {keys.map((key) => (
              <div key={key} className="text-sm"><span className="text-indigo-400 font-mono mr-2">"{key}":</span><JsonTreeView data={data[key]} depth={depth + 1} /></div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return <span>{String(data)}</span>;
}

// ── Main Component ─────────────────────────────────────────

export default function YamlJsonConverter() {
  const [mode, setMode] = useState<ConversionMode>("yaml-to-json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outputTab, setOutputTab] = useState<"code" | "tree">("code");
  const [copied, setCopied] = useState(false);
  const [inputSize, setInputSize] = useState(0);
  const [outputSize, setOutputSize] = useState(0);
  const [keyCount, setKeyCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputLines = input ? input.split("\n").length : 0;
  const outputLines = output ? output.split("\n").length : 0;

  const processConversion = useCallback((inputText: string, currentMode: ConversionMode) => {
    if (!inputText.trim()) { setOutput(""); setError(null); setKeyCount(0); return; }
    setInputSize(new TextEncoder().encode(inputText).length);
    try {
      let result = "", keys = 0;
      switch (currentMode) {
        case "yaml-to-json": { const parsed = parseYamlToObject(inputText); result = JSON.stringify(parsed, null, 2); keys = countKeys(parsed); break; }
        case "json-to-yaml": { const parsed = JSON.parse(inputText); result = stringifyToYaml(parsed); keys = countKeys(parsed); break; }
        case "yaml-beautify": { const parsed = parseYamlToObject(inputText); result = stringifyToYaml(parsed); keys = countKeys(parsed); break; }
        case "json-minify": { const parsed = JSON.parse(inputText); result = JSON.stringify(parsed); keys = countKeys(parsed); break; }
      }
      setOutput(result); setOutputSize(new TextEncoder().encode(result).length); setKeyCount(keys); setError(null);
    } catch (err: any) { setError(err?.message || "Conversion error"); setOutput(""); }
  }, []);

  useEffect(() => { processConversion(input, mode); }, [input, mode, processConversion]);

  const handleModeChange = useCallback((m: ConversionMode) => { setMode(m); setError(null); }, []);
  const loadSample = useCallback(() => {
    setInput(mode === "yaml-to-json" || mode === "yaml-beautify" ? SAMPLE_YAML : SAMPLE_JSON);
    setError(null);
  }, [mode]);
  const clearWorkspace = useCallback(() => { setInput(""); setError(null); }, []);
  const copyToClipboard = useCallback((text: string) => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }, []);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (event) => { setInput(event.target?.result as string); setError(null); }; reader.readAsText(file); }
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { const reader = new FileReader(); reader.onload = (event) => { setInput(event.target?.result as string); setError(null); }; reader.readAsText(file); }
  }, []);

  const showTree = outputTab === "tree" && (mode === "yaml-to-json" || mode === "json-to-yaml" || mode === "yaml-beautify");
  const treeData = (() => {
    if (error || !input || mode === "json-minify") return null;
    try {
      if (mode === "yaml-to-json" || mode === "yaml-beautify") return parseYamlToObject(input);
      if (mode === "json-to-yaml") return JSON.parse(input);
      return null;
    } catch { return null; }
  })();

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
            {input.trim() && <span className="text-xs text-slate-300">{input.length} chars</span>}
          </div>

          {/* Mode Selector Tabs */}
          <div className="border-b border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`px-2 py-2.5 text-xs font-semibold transition-all duration-200 border-b-2 ${
                    mode === m
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="relative">
            {isDragOver && (
              <div className="absolute inset-0 z-10 bg-indigo-600/10 border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 rounded-xl p-6 shadow-lg text-center">
                  <Upload className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800 text-sm">Drop file to load</p>
                </div>
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "yaml-to-json" || mode === "yaml-beautify" ? "Paste your YAML here to convert..." : "Paste your JSON here to convert..."}
              className="h-[450px] font-mono text-sm p-4 w-full bg-white text-slate-800 rounded-b-xl resize-none"
              style={{ whiteSpace: "pre", overflowWrap: "normal", outline: "none" } as React.CSSProperties}
            />
          </div>

          {/* Workspace Action Toolbar */}
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={loadSample} className="h-11 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Load Sample
              </button>
              <button onClick={clearWorkspace} disabled={!input} className="h-11 px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
            {/* Drag-and-Drop Upload Zone */}
            <div className="mt-2">
              <input ref={fileInputRef} type="file" accept=".yaml,.yml,.json,.txt" onChange={handleFileSelect} className="hidden" />
              <div
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex items-center justify-center py-4 px-4 ${
                  isDragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
                }`}
              >
                <div className="flex items-center gap-3 text-center">
                  <Upload className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <p className="text-xs text-slate-600">
                    {isDragOver ? "Drop file to load" : "Drop a .yaml, .yml, .json file here, or click to browse"}
                    <span className="block text-[10px] text-slate-400 mt-0.5">.yaml, .yml, .json, .txt</span>
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
              {output && <span className="text-xs text-slate-300">{output.length} chars</span>}
            </div>

            <div className="p-4 space-y-4">
              {/* Dual-View Output Selector */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setOutputTab("code")}
                  className={`flex-1 py-2 text-xs font-semibold transition-all duration-200 border-b-2 ${
                    outputTab === "code" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5"><Code className="w-3.5 h-3.5" /> Code Output</span>
                </button>
                <button
                  onClick={() => setOutputTab("tree")}
                  disabled={mode === "json-minify"}
                  className={`flex-1 py-2 text-xs font-semibold transition-all duration-200 border-b-2 ${
                    mode === "json-minify" ? "text-slate-300 cursor-not-allowed" : outputTab === "tree" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Tree View</span>
                </button>
              </div>

              {/* Output Area */}
              {showTree && treeData ? (
                <div className="h-[450px] rounded-xl bg-slate-900 border border-slate-800 overflow-auto">
                  <div className="font-mono text-xs p-4"><JsonTreeView data={treeData} /></div>
                </div>
              ) : (
                <div className="h-[450px] rounded-xl bg-slate-900 border border-slate-800 overflow-auto">
                  {output ? (
                    <pre className="font-mono text-xs whitespace-pre leading-6 text-indigo-300 p-4"><code>{output}</code></pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <Code className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                      <p className="text-xs italic">{input.trim() ? "Processing..." : "No input loaded."}</p>
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
                {copied ? <><Check className="w-4 h-4" /> Copied Securely!</> : <><Copy className="w-4 h-4" /> Copy Formatted Output</>}
              </button>
            </div>
          </div>

          {/* Real-Time Metrics Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Processing Metrics
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
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Key Count</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{keyCount}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Lines</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{inputLines} &rarr; {outputLines}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD AUTHORITATIVE SEO CONTENT
      ───────────────────────────────────────────────────────────── */}
      <section className="mt-8 space-y-8">

        {/* Card 1: Overview & Converter Engine Specs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Zap className="w-5 h-5" />
            </div>
            <span>Understanding YAML and JSON Conversion</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>YAML (YAML Ain't Markup Language) and JSON (JavaScript Object Notation) are two of the most widely used data serialization formats in modern software development. While both serve the same fundamental purpose of representing structured data in a portable, language-agnostic format, they differ significantly in syntax philosophy, readability characteristics, and ecosystem adoption.</p>
            <p><strong>YAML</strong> was designed with human readability as its primary goal. It achieves this through indentation-based nesting (typically 2-space indentation), which eliminates the need for explicit delimiters like braces and brackets. YAML also supports comments via the <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">#</code> character, allowing developers to document configuration files inline. The specification includes support for multiple document streams, custom data types, anchors, aliases, and multi-line string blocks using the pipe (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">|</code>) and greater-than (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{'>'}</code>) indicators.</p>
            <p><strong>JSON</strong> originated from JavaScript but has become the universal interchange format across virtually all programming languages and platforms. Its syntax is more verbose — requiring curly braces for objects, square brackets for arrays, commas between elements, and double-quoted string keys — but this verbosity eliminates ambiguity. JSON's strict syntax rules make it ideal for machine-to-machine communication, API payloads, and data storage where deterministic parsing is critical.</p>
            <p>The structural differences between YAML and JSON carry real-world implications for common use cases. <strong>Kubernetes manifests</strong> are almost exclusively written in YAML because operators need to read, review, and manually edit complex deployment configurations. <strong>Docker Compose</strong> files leverage YAML's readability for defining multi-container applications. <strong>OpenAPI/Swagger</strong> specifications historically used JSON but now frequently employ YAML for the specification documents themselves while generating JSON schemas. <strong>CI/CD pipeline</strong> configurations — including GitHub Actions, GitLab CI, and Jenkins pipelines — universally adopt YAML for its human-friendly syntax and comment support.</p>
            <p>Our converter engine implements a pure TypeScript YAML parser that handles the core YAML 1.2 feature set: key-value pairs with arbitrary nesting levels, 2-space indentation standard, scalar arrays using the <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">- item</code> notation, boolean coercion (true/false/yes/no/on/off), numeric parsing for integers and floats, null/empty value handling, single and double-quoted strings, multi-line block scalars with literal (|) and folded ({'>'}) styles, inline comments, and root-level key-value mapping. The JSON stringifier produces clean, standard-compliant JSON with proper indentation, and the YAML stringifier generates human-readable 2-space indented output with appropriate quoting for special characters.</p>
          </div>
        </div>

        {/* Card 2: Features & Data Integrity Guardrails */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Features & Data Integrity Guardrails</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "100% In-Browser Processing", desc: "All parsing, conversion, beautification, and minification execute entirely in your browser's JavaScript runtime. Zero data is uploaded to any server, ensuring complete privacy for sensitive configuration files, API payloads, or proprietary data structures." },
              { title: "Nested Array and Object Handling", desc: "The YAML parser correctly handles deeply nested structures including arrays of objects, objects containing arrays, multi-level indentation hierarchies, and mixed scalar-collection data types at arbitrary depths." },
              { title: "Key Validation and Duplicate Detection", desc: "The parser validates YAML key syntax, detects malformed indentation patterns, and surfaces clear error messages with context. JSON parsing uses the native JSON.parse engine with standard error formatting." },
              { title: "Error Location Highlighting", desc: "When parsing fails, the error message includes the nature of the problem (syntax error, unexpected token, invalid indentation, malformed scalar) to help you locate and fix issues quickly in your input." },
              { title: "Multi-Line String Support", desc: "Full support for YAML block scalars — the pipe indicator (|) preserves newlines for literal blocks, while the greater-than indicator (>) folds single newlines into spaces for paragraph-style text." },
              { title: "Zero External Dependencies", desc: "The entire YAML parser and JSON/YAML stringifier are implemented in pure TypeScript with no external libraries. No js-yaml, no yamljs, no JSON5 — just clean, auditable code running natively in your browser." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 text-sm mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Syntax Specification & Conversion Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Table className="w-5 h-5" />
            </div>
            <span>Side-by-Side Structural Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">The following matrix documents the syntax differences between YAML and JSON across common structural patterns, helping you understand when to use each format for your specific use case.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Feature</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">YAML Syntax</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">JSON Syntax</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Recommended Use Case</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { f: "Object / Mapping", y: "key: value\nnested:\n  key2: value2", j: '{"key": "value",\n "nested": {\n  "key2": "value2"\n }}', u: "Configuration files, metadata blocks" },
                  { f: "Array / Sequence", y: "items:\n  - item1\n  - item2", j: '{"items": [\n  "item1",\n  "item2"\n]}', u: "List of values, enumerated options" },
                  { f: "Array of Objects", y: "users:\n  - name: Alice\n    role: admin\n  - name: Bob\n    role: user", j: '{"users": [\n  {"name": "Alice", "role": "admin"},\n  {"name": "Bob", "role": "user"}\n]}', u: "User lists, product catalogs, API responses" },
                  { f: "Boolean Values", y: "enabled: true\ndebug: no\nfeature: on", j: '{"enabled": true,\n"debug": false,\n"feature": true}', u: "Feature flags, configuration toggles" },
                  { f: "Multi-line Strings", y: "description: |\n  This is a\n  multi-line string\ndescription2: >\n  This is folded\n  into one paragraph", j: '{"description": "This is a\\nmulti-line string",\n"description2": "This is folded into one paragraph"}', u: "Documentation, commit messages, long text fields" },
                  { f: "Null / Empty", y: "key: null\ndeleted: ~", j: '{"key": null,\n"deleted": null}', u: "Optional fields, deleted status, unset values" },
                  { f: "Comments", y: "# This is a comment\nkey: value # inline", j: "// Not supported", u: "Documenting config files, annotating YAML" },
                  { f: "Nested Depth", y: "a:\n  b:\n    c:\n      d: e", j: '{"a": {"b": {"c": {"d": "e"}}}}', u: "Deep configuration hierarchies, nested metadata" },
                ].map(({ f, y, j, u }, idx) => (
                  <tr key={f} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-5 py-3 font-medium text-slate-800">{f}</td>
                    <td className="px-5 py-3"><code className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded whitespace-pre-wrap">{y}</code></td>
                    <td className="px-5 py-3"><code className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded whitespace-pre-wrap">{j}</code></td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{u}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Step-by-Step Practical Usage Guide */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <ListOrdered className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Step-by-Step Practical Usage Guide</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">Follow these steps to convert, beautify, or minify your YAML and JSON data efficiently using the converter workspace.</p>
          <div className="space-y-6">
            {[
              { step: "1", title: "Select Your Conversion Mode", body: "Begin by choosing the appropriate conversion mode from the tab selector at the top of the input panel. Select 'YAML to JSON' to convert Kubernetes manifests, Docker Compose files, or CI/CD pipeline configurations. Select 'JSON to YAML' to transform API responses or JSON schemas into human-readable YAML. Use 'YAML Beautify' to standardize YAML formatting with consistent 2-space indentation, or 'JSON Minify' to compress JSON into a single compact line for transmission or storage." },
              { step: "2", title: "Enter or Load Your Data", body: "Type or paste your source data directly into the input textarea. Use the 'Load Sample' button to populate the workspace with representative test data for the selected mode. For file-based workflows, click the drag-and-drop zone or upload area to load a .yaml, .yml, .json, or .txt file. The conversion runs reactively on every keystroke, so you see results instantly." },
              { step: "3", title: "Review the Converted Output", body: "The output panel displays the converted content in real-time. Toggle between 'Code Output' view (raw formatted text with syntax highlighting) and 'Tree View' (interactive collapsible tree representation) to inspect your data structure at different levels of abstraction. The tree view lets you expand and collapse nested objects and arrays for focused analysis of specific sections." },
              { step: "4", title: "Monitor Conversion Metrics", body: "The Processing Metrics panel provides real-time statistics: Input Size and Output Size in bytes/KB help you gauge conversion efficiency, Key Count shows the total number of data fields in your structure, and Lines indicates the line count of input and output for structural comparison." },
              { step: "5", title: "Export Your Results", body: "Click the full-width 'Copy Formatted Output' button to copy the converted content to your clipboard (with a green checkmark confirmation that resets after 2 seconds). The converted data is ready for integration into your development workflow, whether you are preparing Kubernetes API payloads, generating configuration files, or sharing structured data." },
            ].map(({ step, title, body }) => (
              <div key={step} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">{step}</div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5">{title}</h3>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Frequently Asked Questions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-6">
            {[
              { q: "What is the difference between YAML and JSON syntax?", a: "YAML uses indentation-based nesting with a cleaner, more human-readable syntax that omits brackets, commas, and quotes for strings. JSON uses explicit curly braces {}, square brackets [], commas, and requires double-quoted strings. YAML supports comments with the # character, while JSON does not support comments at all." },
              { q: "Is my data uploaded to a server when I convert YAML to JSON?", a: "Absolutely not. All YAML parsing, JSON stringification, beautification, and minification happen entirely within your browser using pure TypeScript. Your data never leaves your device. No server calls, no network transmission, no data logging." },
              { q: "Which YAML features does this parser support?", a: "The parser supports key-value pairs, nested indentations (2-space standard), scalar arrays with dash notation, booleans (true/false/yes/no/on/off), integers, floats, null values, quoted strings (single and double), multi-line strings using the pipe | and greater-than > indicators, and inline comments with the # character." },
              { q: "Can I use this tool for Kubernetes YAML manifests?", a: "Yes, this converter handles typical Kubernetes manifest structures including nested metadata blocks, selector labels, container specifications with port arrays, environment variables, and resource requests and limits. It is well-suited for converting Kubernetes YAML to JSON for API calls or programmatic processing." },
              { q: "What use cases benefit from JSON to YAML conversion?", a: "JSON to YAML conversion is useful for creating Kubernetes manifests from API responses, generating Docker Compose files, preparing OpenAPI/Swagger specifications, configuring CI/CD pipeline definitions (GitHub Actions, GitLab CI), creating Ansible playbooks, and writing CloudFormation or Terraform configurations where YAML is the preferred human-readable format." },
            ].map(({ q, a }) => (
              <div key={q} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}