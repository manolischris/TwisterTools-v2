"use client";

import React, { useState } from "react";
import {
  Database,
  Check,
  Copy,
  AlertTriangle,
  Trash2,
  BookOpen,
  HelpCircle,
  Cpu,
  Table,
  FileText,
  Minus,
  Lock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure JS/TS SQL Formatting Engine — 100% Client-Side
//  No external dependencies, no server processing.
// ─────────────────────────────────────────────────────────────

type IndentSize = "2" | "4" | "tab";
type SqlDialect = "standard" | "mysql" | "postgresql" | "tsql";

// Core SQL keywords that trigger line breaks before them
const MAJOR_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY",
  "LEFT JOIN", "INNER JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN",
  "JOIN", "ON", "UNION", "UNION ALL", "INTERSECT", "EXCEPT",
  "LIMIT", "OFFSET", "FETCH", "INTO", "VALUES",
];

// Keywords that get uppercased
const RESERVED_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "IS", "NULL",
  "AS", "ON", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS",
  "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "TABLE", "DROP", "ALTER", "ADD", "COLUMN", "INDEX",
  "DISTINCT", "TOP", "LIMIT", "OFFSET", "FETCH", "NEXT", "ROWS", "ONLY",
  "UNION", "ALL", "INTERSECT", "EXCEPT",
  "CASE", "WHEN", "THEN", "ELSE", "END",
  "EXISTS", "BETWEEN", "LIKE", "ILIKE",
  "COUNT", "SUM", "AVG", "MIN", "MAX",
  "CAST", "COALESCE", "NULLIF",
  "WITH", "RECURSIVE",
  "PRIMARY", "KEY", "FOREIGN", "REFERENCES",
  "DEFAULT", "CHECK", "CONSTRAINT",
  "BEGIN", "COMMIT", "ROLLBACK",
  "DECLARE", "SET", "EXEC", "EXECUTE",
  "IF", "ELSE", "WHILE", "BREAK", "CONTINUE",
  "RETURN", "PRINT", "RAISERROR",
  "PROCEDURE", "FUNCTION", "TRIGGER", "VIEW",
  "SCHEMA", "DATABASE", "USE",
]);

// ── Tokenizer: splits SQL string into tokens ──
interface Token {
  type: "keyword" | "identifier" | "string" | "number" | "operator" | "paren" | "comma" | "whitespace" | "comment" | "other";
  value: string;
}

function tokenize(sql: string, dialect: SqlDialect): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < sql.length) {
    // Whitespace
    if (/^\s/.test(sql[i])) {
      let ws = "";
      while (i < sql.length && /^\s/.test(sql[i])) {
        ws += sql[i];
        i++;
      }
      tokens.push({ type: "whitespace", value: ws });
      continue;
    }

    // Single-line comment: -- ...
    if (sql[i] === "-" && sql[i + 1] === "-") {
      let comment = "--";
      i += 2;
      while (i < sql.length && sql[i] !== "\n") {
        comment += sql[i];
        i++;
      }
      tokens.push({ type: "comment", value: comment });
      continue;
    }

    // Multi-line comment: /* ... */
    if (sql[i] === "/" && sql[i + 1] === "*") {
      let comment = "/*";
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) {
        comment += sql[i];
        i++;
      }
      if (i < sql.length) {
        comment += "*/";
        i += 2;
      }
      tokens.push({ type: "comment", value: comment });
      continue;
    }

    // String literals
    if (sql[i] === "'" || (dialect === "tsql" && sql[i] === "N" && sql[i + 1] === "'")) {
      let str = sql[i];
      i++;
      if (str === "N") { str += "'"; i++; }
      while (i < sql.length) {
        str += sql[i];
        if (sql[i] === "'" && sql[i + 1] === "'") {
          str += sql[i + 1];
          i += 2;
          continue;
        }
        if (sql[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: "string", value: str });
      continue;
    }

    // MySQL backtick identifiers
    if (sql[i] === "`") {
      let id = "`";
      i++;
      while (i < sql.length && sql[i] !== "`") {
        id += sql[i];
        i++;
      }
      if (i < sql.length) { id += "`"; i++; }
      tokens.push({ type: "identifier", value: id });
      continue;
    }

    // T-SQL bracket identifiers
    if (sql[i] === "[") {
      let id = "[";
      i++;
      while (i < sql.length && sql[i] !== "]") {
        id += sql[i];
        i++;
      }
      if (i < sql.length) { id += "]"; i++; }
      tokens.push({ type: "identifier", value: id });
      continue;
    }

    // Numbers
    if (/[\d]/.test(sql[i]) || (sql[i] === "." && i + 1 < sql.length && /\d/.test(sql[i + 1]))) {
      let num = "";
      while (i < sql.length && /[\d.eE+\-]/.test(sql[i])) {
        num += sql[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // Parentheses
    if (sql[i] === "(" || sql[i] === ")") {
      tokens.push({ type: "paren", value: sql[i] });
      i++;
      continue;
    }

    // Comma
    if (sql[i] === ",") {
      tokens.push({ type: "comma", value: "," });
      i++;
      continue;
    }

    // Operators
    if (/[=<>!+\-*/%&|^~]/.test(sql[i])) {
      let op = sql[i];
      i++;
      if (i < sql.length && /[=<>]/.test(sql[i]) && (op + sql[i] === "<=" || op + sql[i] === ">=" || op + sql[i] === "!=" || op + sql[i] === "<>" || op + sql[i] === "||")) {
        op += sql[i];
        i++;
      }
      tokens.push({ type: "operator", value: op });
      continue;
    }

    // Identifiers / keywords (word characters)
    if (/[a-zA-Z_@#]/.test(sql[i])) {
      let word = "";
      while (i < sql.length && /[a-zA-Z0-9_@#$.]/.test(sql[i])) {
        word += sql[i];
        i++;
      }
      const upper = word.toUpperCase();
      if (RESERVED_KEYWORDS.has(upper)) {
        tokens.push({ type: "keyword", value: upper });
      } else {
        tokens.push({ type: "identifier", value: word });
      }
      continue;
    }

    // Other characters (semicolons, dots, etc.)
    tokens.push({ type: "other", value: sql[i] });
    i++;
  }

  return tokens;
}

// ── Formatter: converts tokens to formatted SQL string ──
function formatSql(sql: string, indentSize: IndentSize, dialect: SqlDialect, minify: boolean): string {
  if (!sql.trim()) return "";

  const tokens = tokenize(sql, dialect);
  const indent = indentSize === "tab" ? "\t" : " ".repeat(parseInt(indentSize, 10));

  if (minify) {
    let result = "";
    for (const token of tokens) {
      if (token.type === "whitespace" || token.type === "comment") continue;
      result += token.value;
    }
    return result;
  }

  // Format with indentation
  const lines: string[] = [];
  let currentLine = "";
  let depth = 0;
  let afterSelect = false;

  const addLine = (line: string) => {
    lines.push(line);
  };

  const flushLine = () => {
    if (currentLine.trim()) {
      addLine(indent.repeat(depth) + currentLine.trim());
    }
    currentLine = "";
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = i + 1 < tokens.length ? tokens[i + 1] : null;

    if (token.type === "whitespace") {
      continue;
    }

    if (token.type === "comment") {
      if (currentLine.trim()) {
        flushLine();
      }
      addLine(indent.repeat(depth) + token.value);
      continue;
    }

    if (token.type === "paren") {
      if (token.value === "(") {
        if (currentLine.trim()) {
          currentLine += " ";
        }
        currentLine += "(";
        depth++;
        continue;
      } else {
        depth = Math.max(0, depth - 1);
        if (currentLine.trim()) {
          flushLine();
        }
        currentLine = ")";
        continue;
      }
    }

    if (token.type === "comma") {
      currentLine += ",";
      if (afterSelect) {
        flushLine();
      }
      continue;
    }

    if (token.type === "keyword") {
      const kw = token.value;

      // Check for multi-word keywords
      let multiWordKw = kw;
      if (nextToken && nextToken.type === "keyword") {
        const combined = kw + " " + nextToken.value;
        if (MAJOR_KEYWORDS.includes(combined)) {
          multiWordKw = combined;
          i++;
        }
      }

      // Major clause keywords trigger line break
      if (MAJOR_KEYWORDS.includes(multiWordKw)) {
        if (currentLine.trim()) {
          flushLine();
        }
        if (["WHERE", "HAVING", "ORDER BY", "GROUP BY", "LIMIT", "OFFSET"].includes(multiWordKw)) {
          depth = Math.max(0, depth - 1);
        }
        currentLine = multiWordKw;

        if (multiWordKw === "SELECT") afterSelect = true;
        if (multiWordKw === "FROM") afterSelect = false;

        if (["SELECT", "FROM", "WHERE", "ON"].includes(multiWordKw)) {
          depth++;
        }
        continue;
      }

      if (currentLine.trim()) {
        currentLine += " ";
      }
      currentLine += kw;
      continue;
    }

    // String, identifier, number, operator, other
    if (currentLine.trim()) {
      currentLine += " ";
    }
    currentLine += token.value;
  }

  // Flush remaining
  if (currentLine.trim()) {
    addLine(indent.repeat(depth) + currentLine.trim());
  }

  return lines.join("\n");
}

// ── Validation: checks for common SQL syntax issues ──
interface ValidationError {
  message: string;
  type: "warning" | "error";
}

function validateSql(sql: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!sql.trim()) return errors;

  let parenCount = 0;
  let inString = false;
  let stringChar = "";
  let inComment = false;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    const next = i + 1 < sql.length ? sql[i + 1] : "";

    if (!inComment) {
      if ((c === "'" || c === '"' || c === "`") && !inString) {
        inString = true;
        stringChar = c;
        continue;
      }
      if (c === stringChar && inString) {
        if (c === "'" && next === "'") {
          i++;
          continue;
        }
        inString = false;
        stringChar = "";
        continue;
      }
    }

    if (!inString) {
      if (c === "-" && next === "-") {
        inComment = true;
        continue;
      }
      if (c === "\n" && inComment) {
        inComment = false;
        continue;
      }
      if (c === "/" && next === "*") {
        inComment = true;
        continue;
      }
      if (c === "*" && next === "/" && inComment) {
        inComment = false;
        i++;
        continue;
      }
    }

    if (!inString && !inComment) {
      if (c === "(") parenCount++;
      if (c === ")") parenCount--;
    }
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

  if (inString) {
    errors.push({
      message: `Unclosed string literal detected. A ${stringChar} quote character was opened but never closed.`,
      type: "error",
    });
  }

  if (!/\bSELECT\b/i.test(sql) && !/\bINSERT\b/i.test(sql) && !/\bCREATE\b/i.test(sql) && !/\bUPDATE\b/i.test(sql) && !/\bDELETE\b/i.test(sql)) {
    errors.push({
      message: "No recognized SQL statement keyword found (SELECT, INSERT, CREATE, UPDATE, DELETE).",
      type: "warning",
    });
  }

  return errors;
}

// ── Sample SQL Query ──
const SAMPLE_QUERY = `SELECT u.id, u.username, u.email, p.first_name, p.last_name, o.id AS order_id, o.total_amount, o.created_at, o.status
FROM users u
INNER JOIN profiles p ON u.id = p.user_id
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.status = 'pending'
  AND o.total_amount > 100.00
  AND (u.is_active = 1 OR u.is_verified = 1)
GROUP BY u.id, u.username, u.email, p.first_name, p.last_name, o.id, o.total_amount, o.created_at, o.status
HAVING COUNT(o.id) > 2
ORDER BY o.created_at DESC
LIMIT 50;`;

// ── Helper: format file sizes ──
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─────────────────────────────────────────────────────────────
//  Main SQL Formatter Component
// ─────────────────────────────────────────────────────────────
export default function SqlFormatter() {
  const [input, setInput] = useState("");
  const [indentSize, setIndentSize] = useState<IndentSize>("2");
  const [dialect, setDialect] = useState<SqlDialect>("standard");
  const [minify, setMinify] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reactive Formatting & Validation
  const formattedOutput = formatSql(input, indentSize, dialect, minify);
  const validationErrors = validateSql(input);

  // Metrics
  const inputSize = new Blob([input]).size;
  const outputSize = formattedOutput ? new Blob([formattedOutput]).size : 0;
  const charCount = formattedOutput.length;
  const reductionRatio = inputSize && outputSize
    ? parseFloat((((inputSize - outputSize) / inputSize) * 100).toFixed(1))
    : 0;

  // Handlers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const loadSample = () => {
    setInput(SAMPLE_QUERY);
  };

  const clearWorkspace = () => {
    setInput("");
  };

  return (
    <div className="space-y-6">
      {/* Workspace Grid — Symmetrical 50/50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ══════════════════ LEFT PANEL: INPUT WORKSPACE ══════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Edge-to-edge Header Bar with Slate-to-Indigo Gradient */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <Database className="w-4 h-4 text-indigo-600" />
                </div>
                SQL Query Editor
              </h2>
              {input.trim() && (
                <span className="text-xs text-slate-500 font-medium">
                  {input.length} Chars
                </span>
              )}
            </div>
          </div>

          {/* Input Textarea */}
          <div className="p-5">
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent min-h-[320px] max-h-[440px]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your SQL query here to format, beautify, and validate..."
                className="w-full h-full bg-transparent font-mono text-xs text-slate-800 placeholder-slate-400 py-3 px-4 outline-none resize-none overflow-auto leading-6 min-h-[320px] max-h-[440px]"
                style={{ whiteSpace: "pre", overflowWrap: "normal" }}
                id="sql-input-editor"
              />
            </div>
          </div>

          {/* Local Operational Control Bar */}
          <div className="border-t border-slate-100 px-5 py-4 space-y-4">
            {/* Row 1: Indentation & Dialect Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Indentation Dropdown */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="sql-indent-select" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Indent:
                </label>
                <select
                  id="sql-indent-select"
                  value={indentSize}
                  onChange={(e) => setIndentSize(e.target.value as IndentSize)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-11 min-w-[100px]"
                >
                  <option value="2">2 Spaces</option>
                  <option value="4">4 Spaces</option>
                  <option value="tab">Tab</option>
                </select>
              </div>

              {/* Dialect Selector */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="sql-dialect-select" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Dialect:
                </label>
                <select
                  id="sql-dialect-select"
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value as SqlDialect)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-11 min-w-[120px]"
                >
                  <option value="standard">Standard SQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="tsql">T-SQL</option>
                </select>
              </div>
            </div>

            {/* Row 2: Action Buttons — min 44px touch targets */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={loadSample}
                className="h-11 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Load Sample Query
              </button>
              <button
                onClick={clearWorkspace}
                disabled={!input}
                className="h-11 px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Clear Workspace
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: LIVE FORMATTED OUTPUT ══════════════════ */}
        <div className="sticky top-4 space-y-4">

          {/* Main Output Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Slate-to-Indigo Gradient Header Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">Formatted Output</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Validation Error Banner */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl space-y-2">
                  {validationErrors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs uppercase tracking-wider text-red-800">
                          {err.type === "error" ? "SQL Syntax Error" : "SQL Warning"}
                        </p>
                        <p className="text-xs mt-1 leading-relaxed">{err.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Read-only Formatted Output */}
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 min-h-[220px] max-h-[340px] overflow-auto">
                {formattedOutput ? (
                  <pre className="font-mono text-xs whitespace-pre leading-6 text-indigo-300">
                    <code>{formattedOutput}</code>
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[180px] text-slate-500">
                    <Database className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                    <p className="text-xs italic">
                      {input.trim() ? "Processing query..." : "No SQL query loaded."}
                    </p>
                  </div>
                )}
              </div>

              {/* Operational Toolbar: Copy + Minify Toggle */}
              <div className="flex items-center gap-3">
                {/* Copy Button */}
                <button
                  onClick={() => formattedOutput && copyToClipboard(formattedOutput)}
                  disabled={!formattedOutput}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${
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
                      Copy Code
                    </>
                  )}
                </button>

                {/* Minify Toggle */}
                <button
                  onClick={() => setMinify((prev) => !prev)}
                  className={`h-11 px-4 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center gap-2 min-h-[44px] ${
                    minify
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  title={minify ? "Switch to formatted view" : "Switch to minified view"}
                >
                  <Minus className="w-4 h-4" />
                  <span className="hidden sm:inline">Minify</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Metrics Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              Query Metrics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Input Size</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{formatFileSize(inputSize)}</p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Output Size</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{formatFileSize(outputSize)}</p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Character Count</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{charCount.toLocaleString()}</p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Reduction Ratio</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {reductionRatio > 0 ? `-${reductionRatio}%` : reductionRatio < 0 ? `+${Math.abs(reductionRatio)}%` : "0%"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD AUTHORITATIVE SEO CONTENT
           High-density, Ad-ready architecture matching MD5 Generator
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6 pt-6">

        {/* SECTION 1: Extended Definitions & Technical Theory */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Definitive Guide to SQL Syntax, Beautification, and Parsing Theory</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Structured Query Language (SQL) is the foundational declarative programming engine used globally to manage, query, and manipulate relational database management systems (RDBMS). Unlike procedural code languages, SQL specifies <em>what</em> data to retrieve rather than <em>how</em> to physically retrieve it. This leaves the operational execution pathway up to the database query optimizer. However, because SQL allows highly flexible whitespace allocations and case-insensitive keyword parsing, raw code written by developers often devolves into dense, unreadable single-line blocks or unstructured scripts.
            </p>
            <p>
              SQL formatting&mdash;often called SQL beautification&mdash;is the structural process of rebuilding raw database scripts into deterministic, standardized visual layouts. A properly formatted SQL statement transforms obscure text strings into a clear hierarchical tree. By enforcing standardized keyword capitalization (such as SELECT, JOIN, and WHERE) and strict indentation matrix rules, developers map the identical logical workflow that the relational engine&rsquo;s lexical scanner creates internally during the compilation phase. This layout strategy radically decreases code review latency, eliminates syntax debugging errors, and ensures that cross-functional engineering teams can audit complex data pipelines smoothly.
            </p>
          </div>
        </div>

        {/* SECTION 2: Step-by-Step Operational Checklist */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How the Local SQL Tokenization Engine Processes Queries</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            Our client-side SQL formatter processes inputs entirely inside your local browser sandbox through a deterministic four-tier parsing pipeline. Here is the operational sequence that ensures high-fidelity code transformation:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mb-3">1</div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1.5">Lexical Scan & Character Tokenization</h3>
              <p className="text-sm text-slate-600 leading-relaxed">The text stream is scanned character by character to detect strict lexical boundaries. It isolates functional operators, language keywords, numeric strings, and literal string constants into explicit semantic tokens.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mb-3">2</div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1.5">Dialect Rules Identification</h3>
              <p className="text-sm text-slate-600 leading-relaxed">The tokenizer adjusts its parsing variables based on your chosen database engine target. It maps system-specific naming wrappers like T-SQL square brackets ([column]), MySQL backticks (`column`), or PostgreSQL string literal dollar-quoting strategies.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mb-3">3</div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1.5">Case Normalization & Token Mapping</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Relational reserved keywords are intercepted and programmatically capitalized to uppercase styling. This establishes immediate visual distinction from localized tables, schemas, and user-defined variables.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mb-3">4</div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1.5">Hierarchical Indentation Injection</h3>
              <p className="text-sm text-slate-600 leading-relaxed">The formatting engine maps parenthetical boundaries and logical clause connectors, injecting predictable line breaks and custom spacing configurations directly before primary relational predicates.</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Production Syntax Reference Matrix */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Relational Database Keywords & Formatting Configuration Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            The following matrix documents how standard SQL keywords are grouped, normalized, and visually isolated by the layout formatting engine to maximize code architecture readability:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Core Keyword Group</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Execution Context</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Structural Layout Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Visual Impact on Code Layout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">SELECT / DISTINCT</td>
                  <td className="py-3 px-4 text-slate-600">Projection Layer</td>
                  <td className="py-3 px-4 text-slate-600">Initiates Root Block Anchor</td>
                  <td className="py-3 px-4 text-slate-600">Aligns target columns into clear, stacked rows</td>
                </tr>
                <tr className="hover:bg-slate-100/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">FROM / JOIN</td>
                  <td className="py-3 px-4 text-slate-600">Data Source Ingestion</td>
                  <td className="py-3 px-4 text-slate-600">Injects Newline + Standard Indent</td>
                  <td className="py-3 px-4 text-slate-600">Isolates parent tables from nested subquery arrays</td>
                </tr>
                <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">WHERE / HAVING</td>
                  <td className="py-3 px-4 text-slate-600">Row & Aggregation Filtering</td>
                  <td className="py-3 px-4 text-slate-600">Injects Newline + Predicate Align</td>
                  <td className="py-3 px-4 text-slate-600">Clarifies logical boolean matching conditions</td>
                </tr>
                <tr className="hover:bg-slate-100/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">GROUP BY / ORDER BY</td>
                  <td className="py-3 px-4 text-slate-600">Sorting & Vector Clustering</td>
                  <td className="py-3 px-4 text-slate-600">Injects Newline + Deterministic Sort</td>
                  <td className="py-3 px-4 text-slate-600">Groups multi-row operational steps together</td>
                </tr>
                <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">INSERT / UPDATE / DELETE</td>
                  <td className="py-3 px-4 text-slate-600">Data Manipulation Language</td>
                  <td className="py-3 px-4 text-slate-600">Initiates Mutation Block</td>
                  <td className="py-3 px-4 text-slate-600">Clearly highlights structural write actions</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Code Architecture & Comparison Samples */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Structural Code Visualizations: Raw vs. Formatted Layouts</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            View the dramatic visual difference between machine-generated raw data queries and formatted, production-ready SQL code structures:
          </p>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
              Unformatted, Minified Database Query String (Raw Input)
            </h3>
            <pre className="bg-slate-900 text-green-400 text-xs md:text-sm leading-relaxed p-4 md:p-5 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap">{`select u.id,u.email,o.total_amount,p.status from users u inner join orders o on u.id=o.user_id left join payments p on o.id=p.order_id where o.created_at>='2026-01-01' and p.status='completed' group by u.id,u.email,o.total_amount,p.status order by o.total_amount desc limit 100;`}</pre>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
              Clean, Beautified Standard SQL Representation (Formatted Output)
            </h3>
            <pre className="bg-slate-900 text-green-400 text-xs md:text-sm leading-relaxed p-4 md:p-5 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap">{`SELECT
  u.id,
  u.email,
  o.total_amount,
  p.status
FROM users u
INNER JOIN orders o
  ON u.id = o.user_id
LEFT JOIN payments p
  ON o.id = p.order_id
WHERE o.created_at >= '2026-01-01'
  AND p.status = 'completed'
GROUP BY
  u.id,
  u.email,
  o.total_amount,
  p.status
ORDER BY o.total_amount DESC
LIMIT 100;`}</pre>
          </div>
        </div>

        {/* SECTION 5: Deep-Dive FAQ Core Compliance Block */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Advanced SQL Formatting Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Why is keyword capitalization critical across standard SQL syntax frameworks?",
                a: "While relational query parsers evaluate expressions case-insensitively, human brains process structured layouts much faster when structural syntax operations are clearly separated from variable schema labels. Standardizing keywords to uppercase provides instant visual anchors for quick navigation.",
              },
              {
                q: "Can a client-side formatter fix missing commas or invalid database table references?",
                a: "No. A code beautifier focus is structural aesthetics, token spacing, and semantic indentation. It does not possess a compiler state machine to map missing schemas or validate structural bindings against your live physical database engine.",
              },
              {
                q: "Does formatting custom white spaces affect query cache hits inside modern engines?",
                a: "Yes, it can. Many relational database query optimizers calculate a precise string hash of incoming text queries to identify matches in the internal query execution cache. Even a minor white space mismatch can force a hard parse rather than a fast cache lookup. Utilizing a standardized formatter ensures consistent query hashing configurations across applications.",
              },
              {
                q: "Is it completely safe to paste sensitive production query strings into this utility?",
                a: "Absolutely. Our tool processes your database scripts natively inside your browser sandboxed engine using Web Crypto and standard JavaScript string processing arrays. No database credentials, schema configurations, or private query structures are ever transmitted to external servers.",
              },
            ].map((faq) => (
              <div key={faq.q} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {faq.q}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: Value Card Platform Advantages */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose TwisterTools for Query Beautification?</h2>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed mb-6">
            The TwisterTools developer platform provides full developer utility performance without the typical ad-bloat or tracking overhead found on legacy sites. By processing code structures 100% locally, you ensure absolute security compliance with zero data leaks. The tool scales fluidly from simple queries to deep corporate warehouse pipeline files up to 5 MB, providing fast, localized formatting with premium UI responsiveness.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "100% Client-Side Processing", body: "All tokenization, formatting, and minification executes locally in your browser. Zero data ever leaves your device." },
              { title: "Multi-Dialect Support", body: "Choose from Standard SQL, MySQL, PostgreSQL, or T-SQL with dialect-specific identifier quoting and keyword handling." },
              { title: "Configurable Indentation", body: "Select 2-space, 4-space, or Tab indentation to match your team's coding standards and style guides." },
              { title: "Real-Time Validation", body: "Built-in parsing guardrails detect unclosed parentheses, missing quotes, and malformed statements instantly." },
            ].map(({ title, body }) => (
              <div key={title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
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
