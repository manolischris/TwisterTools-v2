"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FileCode,
  Code,
  Check,
  Copy,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Braces,
  Cpu,
  Terminal,
  HelpCircle,
  ShieldCheck,
  Zap,
  Shield,
  ChevronDown,
  ChevronRight,
  ListOrdered,
  Table,
  Blocks,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript JavaScript Formatting & Minification Engine
//  100% Client-Side — Zero External Dependencies
// ─────────────────────────────────────────────────────────────

type IndentSize = "2" | "4" | "tab";

// ── Token types for JavaScript ──
type JsTokenType =
  | "keyword"
  | "identifier"
  | "string"
  | "template"
  | "regex"
  | "number"
  | "operator"
  | "open-paren"
  | "close-paren"
  | "open-brace"
  | "close-brace"
  | "open-bracket"
  | "close-bracket"
  | "semicolon"
  | "colon"
  | "comma"
  | "dot"
  | "arrow"
  | "comment"
  | "whitespace"
  | "newline"
  | "other";

interface JsToken {
  type: JsTokenType;
  value: string;
}

// ── JavaScript keywords ──
const JS_KEYWORDS = new Set([
  "break", "case", "catch", "class", "const", "continue", "debugger",
  "default", "delete", "do", "else", "export", "extends", "finally",
  "for", "function", "if", "import", "in", "instanceof", "let",
  "new", "of", "return", "super", "switch", "this", "throw", "try",
  "typeof", "var", "void", "while", "with", "yield", "async", "await",
  "from", "as", "static", "get", "set", "enum", "implements",
  "interface", "package", "private", "protected", "public",
]);

// ─────────────────────────────────────────────────────────────
//  Tokenizer: Scans JavaScript string into tokens
// ─────────────────────────────────────────────────────────────
function tokenizeJs(js: string): JsToken[] {
  const tokens: JsToken[] = [];
  let i = 0;

  while (i < js.length) {
    // ── Single-line comments // ──
    if (js[i] === "/" && js[i + 1] === "/") {
      let comment = "//";
      i += 2;
      while (i < js.length && js[i] !== "\n") {
        comment += js[i];
        i++;
      }
      tokens.push({ type: "comment", value: comment });
      continue;
    }

    // ── Multi-line comments /* */ ──
    if (js[i] === "/" && js[i + 1] === "*") {
      let comment = "/*";
      i += 2;
      while (i < js.length && !(js[i] === "*" && js[i + 1] === "/")) {
        comment += js[i];
        i++;
      }
      if (i < js.length) {
        comment += "*/";
        i += 2;
      }
      tokens.push({ type: "comment", value: comment });
      continue;
    }

    // ── Template literals `...` ──
    if (js[i] === "`") {
      let template = "`";
      i++;
      let depth = 0;
      while (i < js.length) {
        if (js[i] === "\\") {
          template += js[i] + (js[i + 1] || "");
          i += 2;
          continue;
        }
        if (js[i] === "$" && js[i + 1] === "{") {
          depth++;
          template += "${";
          i += 2;
          continue;
        }
        if (js[i] === "}" && depth > 0) {
          depth--;
          template += "}";
          i++;
          continue;
        }
        if (js[i] === "`" && depth === 0) {
          template += "`";
          i++;
          break;
        }
        template += js[i];
        i++;
      }
      tokens.push({ type: "template", value: template });
      continue;
    }

    // ── Strings (single and double quotes) ──
    if (js[i] === '"' || js[i] === "'") {
      const quote = js[i];
      let str = quote;
      i++;
      while (i < js.length) {
        if (js[i] === "\\") {
          str += js[i] + (js[i + 1] || "");
          i += 2;
          continue;
        }
        if (js[i] === quote) {
          str += quote;
          i++;
          break;
        }
        if (js[i] === "\n") {
          break;
        }
        str += js[i];
        i++;
      }
      tokens.push({ type: "string", value: str });
      continue;
    }

    // ── Regex literals /.../ ──
    if (js[i] === "/") {
      const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
      const isRegexStart =
        !prevToken ||
        prevToken.type === "operator" ||
        prevToken.type === "open-paren" ||
        prevToken.type === "open-brace" ||
        prevToken.type === "open-bracket" ||
        prevToken.type === "comma" ||
        prevToken.type === "colon" ||
        prevToken.type === "semicolon" ||
        prevToken.type === "arrow" ||
        prevToken.type === "keyword" ||
        prevToken.type === "whitespace";

      if (isRegexStart) {
        let regex = "/";
        i++;
        let inClass = false;
        while (i < js.length) {
          if (js[i] === "\\") {
            regex += js[i] + (js[i + 1] || "");
            i += 2;
            continue;
          }
          if (js[i] === "[" && !inClass) {
            inClass = true;
            regex += "[";
            i++;
            continue;
          }
          if (js[i] === "]" && inClass) {
            inClass = false;
            regex += "]";
            i++;
            continue;
          }
          if (js[i] === "/" && !inClass) {
            regex += "/";
            i++;
            while (i < js.length && /[gimsuy]/.test(js[i])) {
              regex += js[i];
              i++;
            }
            break;
          }
          if (js[i] === "\n") break;
          regex += js[i];
          i++;
        }
        tokens.push({ type: "regex", value: regex });
        continue;
      }
    }

    // ── Whitespace ──
    if (/^\s/.test(js[i])) {
      let ws = "";
      while (i < js.length && /^\s/.test(js[i])) {
        ws += js[i];
        i++;
      }
      tokens.push({ type: "whitespace", value: ws });
      continue;
    }

    // ── Arrows => ──
    if (js[i] === "=" && js[i + 1] === ">") {
      tokens.push({ type: "arrow", value: "=>" });
      i += 2;
      continue;
    }

    // ── Operators (multi-char first) ──
    const multiCharOps = [
      "===", "!==", "==", "!=", "<=", ">=", "&&", "||",
      "++", "--", "+=", "-=", "*=", "/=", "%=", "**=",
      "<<=", ">>=", ">>>=", "&=", "|=", "^=", "??=",
      "=>", "**", "<<", ">>", ">>>", "??", "?.",
    ];
    let matchedOp = "";
    for (const op of multiCharOps) {
      if (js.substring(i, i + op.length) === op) {
        matchedOp = op;
        break;
      }
    }
    if (matchedOp) {
      tokens.push({ type: "operator", value: matchedOp });
      i += matchedOp.length;
      continue;
    }

    // ── Single-char operators ──
    const singleOps = new Set([
      "+", "-", "*", "/", "%", "=", "<", ">", "!", "&", "|",
      "^", "~", "?",
    ]);
    if (singleOps.has(js[i])) {
      tokens.push({ type: "operator", value: js[i] });
      i++;
      continue;
    }

    // ── Structural characters ──
    if (js[i] === "(") { tokens.push({ type: "open-paren", value: "(" }); i++; continue; }
    if (js[i] === ")") { tokens.push({ type: "close-paren", value: ")" }); i++; continue; }
    if (js[i] === "{") { tokens.push({ type: "open-brace", value: "{" }); i++; continue; }
    if (js[i] === "}") { tokens.push({ type: "close-brace", value: "}" }); i++; continue; }
    if (js[i] === "[") { tokens.push({ type: "open-bracket", value: "[" }); i++; continue; }
    if (js[i] === "]") { tokens.push({ type: "close-bracket", value: "]" }); i++; continue; }
    if (js[i] === ";") { tokens.push({ type: "semicolon", value: ";" }); i++; continue; }
    if (js[i] === ":") { tokens.push({ type: "colon", value: ":" }); i++; continue; }
    if (js[i] === ",") { tokens.push({ type: "comma", value: "," }); i++; continue; }
    if (js[i] === ".") { tokens.push({ type: "dot", value: "." }); i++; continue; }

    // ── Numbers ──
    if (/[0-9]/.test(js[i]) || (js[i] === "." && i + 1 < js.length && /[0-9]/.test(js[i + 1]))) {
      let num = "";
      if (js[i] === "0" && i + 1 < js.length && /[xXoObB]/.test(js[i + 1])) {
        num += js[i] + js[i + 1];
        i += 2;
        while (i < js.length && /[0-9a-fA-F]/.test(js[i])) {
          num += js[i];
          i++;
        }
      } else {
        while (i < js.length && /[0-9.]/.test(js[i])) {
          num += js[i];
          i++;
        }
        if (i < js.length && /[eE]/.test(js[i])) {
          num += js[i];
          i++;
          if (i < js.length && /[+-]/.test(js[i])) {
            num += js[i];
            i++;
          }
          while (i < js.length && /[0-9]/.test(js[i])) {
            num += js[i];
            i++;
          }
        }
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // ── Identifiers and keywords ──
    if (/[a-zA-Z_$]/.test(js[i])) {
      let word = "";
      while (i < js.length && /[a-zA-Z0-9_$]/.test(js[i])) {
        word += js[i];
        i++;
      }
      if (JS_KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else {
        tokens.push({ type: "identifier", value: word });
      }
      continue;
    }

    // ── Any other character ──
    tokens.push({ type: "other", value: js[i] });
    i++;
  }

  return tokens;
}

// ─────────────────────────────────────────────────────────────
//  Beautify Algorithm
// ─────────────────────────────────────────────────────────────
function beautifyJs(js: string, indentSize: IndentSize): string {
  if (!js.trim()) return "";

  const tokens = tokenizeJs(js);
  const indent = indentSize === "tab" ? "\t" : " ".repeat(parseInt(indentSize, 10));
  const lines: string[] = [];
  let depth = 0;
  let currentLine = "";
  let inObjectLiteral = false;
  let braceStack: string[] = [];

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

    if (token.type === "whitespace") {
      continue;
    }

    if (token.type === "comment") {
      if (currentLine.trim()) {
        currentLine += "  " + token.value;
        flushLine();
      } else {
        emitLine(token.value);
      }
      continue;
    }

    if (token.type === "string" || token.type === "template" || token.type === "regex") {
      if (currentLine.trim()) {
        currentLine += " " + token.value;
      } else {
        currentLine = token.value;
      }
      continue;
    }

    if (token.type === "number") {
      if (currentLine.trim()) {
        currentLine += " " + token.value;
      } else {
        currentLine = token.value;
      }
      continue;
    }

    if (token.type === "keyword") {
      const kw = token.value;

      if (kw === "case" || kw === "default") {
        if (currentLine.trim()) flushLine();
        currentLine = kw;
        continue;
      }

      if (kw === "return" || kw === "throw" || kw === "yield") {
        if (currentLine.trim()) flushLine();
        currentLine = kw;
        continue;
      }

      if (kw === "else") {
        if (currentLine.trim()) flushLine();
        if (lines.length > 0 && lines[lines.length - 1].trim() === "}") {
          lines[lines.length - 1] = lines[lines.length - 1].trimEnd() + " else";
        } else {
          currentLine = kw;
        }
        continue;
      }

      if (kw === "catch" || kw === "finally") {
        if (currentLine.trim()) flushLine();
        if (lines.length > 0 && lines[lines.length - 1].trim() === "}") {
          lines[lines.length - 1] = lines[lines.length - 1].trimEnd() + " " + kw;
        } else {
          currentLine = kw;
        }
        continue;
      }

      if (["if", "for", "while", "switch", "with"].includes(kw)) {
        if (currentLine.trim()) flushLine();
        currentLine = kw;
        continue;
      }

      if (kw === "function" || kw === "class") {
        if (currentLine.trim()) flushLine();
        currentLine = kw;
        continue;
      }

      if (["var", "let", "const"].includes(kw)) {
        if (currentLine.trim()) flushLine();
        currentLine = kw;
        continue;
      }

      if (kw === "import" || kw === "export") {
        if (currentLine.trim()) flushLine();
        currentLine = kw;
        continue;
      }

      if (kw === "async") {
        if (currentLine.trim()) flushLine();
        currentLine = kw;
        continue;
      }

      if (currentLine.trim()) {
        currentLine += " " + kw;
      } else {
        currentLine = kw;
      }
      continue;
    }

    if (token.type === "identifier") {
      if (currentLine.trim()) {
        if (prevToken && prevToken.type === "keyword") {
          currentLine += " " + token.value;
        } else {
          currentLine += " " + token.value;
        }
      } else {
        currentLine = token.value;
      }
      continue;
    }

    if (token.type === "open-paren") {
      const isControlFlowParen =
        prevToken &&
        prevToken.type === "keyword" &&
        ["if", "for", "while", "switch", "catch", "with"].includes(prevToken.value);

      if (isControlFlowParen) {
        currentLine += " (";
      } else if (currentLine.trim()) {
        currentLine += "(";
      } else {
        currentLine = "(";
      }
      braceStack.push("(");
      continue;
    }

    if (token.type === "close-paren") {
      braceStack = braceStack.filter(b => b !== "(");
      currentLine += ")";
      continue;
    }

    if (token.type === "open-brace") {
      if (currentLine.trim()) {
        const isBlock =
          prevToken &&
          (prevToken.type === "close-paren" ||
           prevToken.type === "close-brace" ||
           prevToken.value === ")" ||
           prevToken.value === "else" ||
           prevToken.value === "do" ||
           prevToken.value === "try" ||
           prevToken.value === "catch" ||
           prevToken.value === "finally");

        if (isBlock) {
          currentLine += " {";
          flushLine();
          inObjectLiteral = false;
        } else {
          currentLine += " {";
          flushLine();
          inObjectLiteral = true;
        }
      } else {
        emitLine("{");
      }
      depth++;
      braceStack.push("{");
      continue;
    }

    if (token.type === "close-brace") {
      if (currentLine.trim()) flushLine();
      depth = Math.max(0, depth - 1);
      braceStack = braceStack.filter(b => b !== "{");
      emitLine("}");
      inObjectLiteral = false;
      continue;
    }

    if (token.type === "open-bracket") {
      if (currentLine.trim()) {
        currentLine += "[";
      } else {
        currentLine = "[";
      }
      braceStack.push("[");
      continue;
    }

    if (token.type === "close-bracket") {
      braceStack = braceStack.filter(b => b !== "[");
      currentLine += "]";
      continue;
    }

    if (token.type === "semicolon") {
      if (currentLine.trim()) {
        currentLine += ";";
        flushLine();
      } else {
        emitLine(";");
      }
      continue;
    }

    if (token.type === "comma") {
      currentLine += ",";
      if (inObjectLiteral || (prevToken && prevToken.type === "close-brace")) {
        flushLine();
      } else {
        currentLine += " ";
      }
      continue;
    }

    if (token.type === "colon") {
      if (inObjectLiteral) {
        currentLine += ": ";
      } else {
        currentLine += " : ";
      }
      continue;
    }

    if (token.type === "dot") {
      currentLine += ".";
      continue;
    }

    if (token.type === "arrow") {
      currentLine += " => ";
      continue;
    }

    if (token.type === "operator") {
      const op = token.value;

      if (op === "++" || op === "--") {
        currentLine += op;
        continue;
      }

      if (op === "?") {
        currentLine += " ? ";
        continue;
      }

      if (op === "?.") {
        currentLine += "?.";
        continue;
      }

      if (op === "??") {
        currentLine += " ?? ";
        continue;
      }

      if (op === "&&" || op === "||") {
        currentLine += " " + op + " ";
        continue;
      }

      if (["===", "!==", "==", "!=", "<=", ">=", "<", ">"].includes(op)) {
        currentLine += " " + op + " ";
        continue;
      }

      if (["=", "+=", "-=", "*=", "/=", "%=", "**=", "<<=", ">>=", ">>>=", "&=", "|=", "^=", "??="].includes(op)) {
        currentLine += " " + op + " ";
        continue;
      }

      if (["+", "-", "*", "/", "%", "**"].includes(op)) {
        currentLine += " " + op + " ";
        continue;
      }

      if (["&", "|", "^", "~", "<<", ">>", ">>>"].includes(op)) {
        currentLine += " " + op + " ";
        continue;
      }

      if (op === "...") {
        currentLine += "...";
        continue;
      }

      currentLine += op;
      continue;
    }

    if (token.type === "other") {
      currentLine += token.value;
      continue;
    }
  }

  if (currentLine.trim()) {
    emitLine(currentLine.trim());
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
//  Minify Algorithm
// ─────────────────────────────────────────────────────────────
function minifyJs(js: string): string {
  if (!js.trim()) return "";

  const tokens = tokenizeJs(js);
  let result = "";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = i + 1 < tokens.length ? tokens[i + 1] : null;

    if (token.type === "comment") continue;
    if (token.type === "whitespace") continue;

    if (token.type === "string" || token.type === "template" || token.type === "regex") {
      result += token.value;
      continue;
    }

    if (token.type === "number") {
      result += token.value;
      continue;
    }

    if (token.type === "keyword") {
      if (result.length > 0 && !/[({[\s]/.test(result[result.length - 1])) {
        result += " ";
      }
      result += token.value;
      if (nextToken && nextToken.type === "open-paren") {
        // no space
      } else if (nextToken && nextToken.type !== "whitespace" && nextToken.type !== "semicolon" && nextToken.type !== "colon" && nextToken.type !== "comma") {
        result += " ";
      }
      continue;
    }

    if (token.type === "identifier") {
      result += token.value;
      continue;
    }

    if (token.type === "open-paren") { result += "("; continue; }
    if (token.type === "close-paren") { result += ")"; continue; }
    if (token.type === "open-brace") { result += "{"; continue; }
    if (token.type === "close-brace") { result += "}"; continue; }
    if (token.type === "open-bracket") { result += "["; continue; }
    if (token.type === "close-bracket") { result += "]"; continue; }
    if (token.type === "semicolon") { result += ";"; continue; }
    if (token.type === "colon") { result += ":"; continue; }
    if (token.type === "comma") { result += ","; continue; }
    if (token.type === "dot") { result += "."; continue; }
    if (token.type === "arrow") { result += "=>"; continue; }

    if (token.type === "operator") {
      const op = token.value;
      if (op === "++" || op === "--") {
        result += op;
      } else if (op === "..." || op === "?.") {
        result += op;
      } else {
        result += op;
      }
      continue;
    }

    if (token.type === "other") {
      result += token.value;
      continue;
    }
  }

  result = result.replace(/\s+([}\]),;:])/g, "$1");
  result = result.replace(/([\[({])\s+/g, "$1");
  result = result.replace(/\s{2,}/g, " ");

  return result.trim();
}

// ─────────────────────────────────────────────────────────────
//  Validation: Check for unclosed strings, braces, etc.
// ─────────────────────────────────────────────────────────────
interface ValidationError {
  message: string;
  type: "warning" | "error";
}

function validateJs(js: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!js.trim()) return errors;

  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let inComment = false;
  let inString = false;
  let stringChar = "";
  let inTemplate = false;
  let templateDepth = 0;

  for (let i = 0; i < js.length; i++) {
    const c = js[i];
    const next = i + 1 < js.length ? js[i + 1] : "";

    if (c === "/" && next === "*" && !inString && !inTemplate) {
      inComment = true;
      i++;
      continue;
    }
    if (c === "*" && next === "/" && inComment) {
      inComment = false;
      i++;
      continue;
    }
    if (c === "/" && next === "/" && !inString && !inTemplate && !inComment) {
      while (i < js.length && js[i] !== "\n") i++;
      continue;
    }

    if (inComment) continue;

    if (c === "`" && !inString) {
      if (inTemplate) {
        if (templateDepth === 0) {
          inTemplate = false;
        }
      } else {
        inTemplate = true;
        templateDepth = 0;
      }
      continue;
    }

    if (inTemplate) {
      if (c === "$" && next === "{") {
        templateDepth++;
        i++;
        continue;
      }
      if (c === "}" && templateDepth > 0) {
        templateDepth--;
        continue;
      }
      continue;
    }

    if ((c === '"' || c === "'") && !inString) {
      inString = true;
      stringChar = c;
      continue;
    }
    if (c === "\\" && inString) {
      i++;
      continue;
    }
    if (c === stringChar && inString) {
      inString = false;
      stringChar = "";
      continue;
    }

    if (inString) continue;

    if (c === "{") braceCount++;
    if (c === "}") braceCount--;
    if (c === "(") parenCount++;
    if (c === ")") parenCount--;
    if (c === "[") bracketCount++;
    if (c === "]") bracketCount--;
  }

  if (inString) {
    errors.push({
      message: "Unclosed string literal detected. The string starting with " + stringChar + " was never closed.",
      type: "error",
    });
  }

  if (inTemplate) {
    errors.push({
      message: "Unclosed template literal detected. The template string starting with ` was never closed.",
      type: "error",
    });
  }

  if (braceCount > 0) {
    errors.push({
      message: "Unclosed curly brace detected. There " + (braceCount === 1 ? "is" : "are") + " " + braceCount + " unclosed opening brace" + (braceCount === 1 ? "" : "s") + ".",
      type: "error",
    });
  }
  if (braceCount < 0) {
    errors.push({
      message: "Unexpected closing curly brace detected. There " + (Math.abs(braceCount) === 1 ? "is" : "are") + " " + Math.abs(braceCount) + " extra closing brace" + (Math.abs(braceCount) === 1 ? "" : "s") + ".",
      type: "error",
    });
  }

  if (parenCount > 0) {
    errors.push({
      message: "Unclosed parenthesis detected. There " + (parenCount === 1 ? "is" : "are") + " " + parenCount + " unclosed opening parenthesis.",
      type: "error",
    });
  }
  if (parenCount < 0) {
    errors.push({
      message: "Unexpected closing parenthesis detected. There " + (Math.abs(parenCount) === 1 ? "is" : "are") + " " + Math.abs(parenCount) + " extra closing parenthesis.",
      type: "error",
    });
  }

  if (bracketCount > 0) {
    errors.push({
      message: "Unclosed square bracket detected. There " + (bracketCount === 1 ? "is" : "are") + " " + bracketCount + " unclosed opening bracket" + (bracketCount === 1 ? "" : "s") + ".",
      type: "error",
    });
  }
  if (bracketCount < 0) {
    errors.push({
      message: "Unexpected closing square bracket detected. There " + (Math.abs(bracketCount) === 1 ? "is" : "are") + " " + Math.abs(bracketCount) + " extra closing bracket" + (Math.abs(bracketCount) === 1 ? "" : "s") + ".",
      type: "error",
    });
  }

  return errors;
}

// ── Count total statement blocks ──
function countStatementBlocks(js: string): number {
  let count = 0;
  let inComment = false;
  let inString = false;
  let stringChar = "";
  let inTemplate = false;
  let templateDepth = 0;

  for (let i = 0; i < js.length; i++) {
    const c = js[i];
    const next = i + 1 < js.length ? js[i + 1] : "";

    if (c === "/" && next === "*" && !inString && !inTemplate) { inComment = true; i++; continue; }
    if (c === "*" && next === "/" && inComment) { inComment = false; i++; continue; }
    if (inComment) continue;

    if (c === "`" && !inString) {
      if (inTemplate) { if (templateDepth === 0) inTemplate = false; }
      else inTemplate = true;
      continue;
    }
    if (inTemplate) {
      if (c === "$" && next === "{") { templateDepth++; i++; continue; }
      if (c === "}" && templateDepth > 0) { templateDepth--; continue; }
      continue;
    }

    if ((c === '"' || c === "'") && !inString) { inString = true; stringChar = c; continue; }
    if (c === "\\" && inString) { i++; continue; }
    if (c === stringChar && inString) { inString = false; stringChar = ""; continue; }
    if (inString) continue;

    if (c === "{") count++;
  }

  return count;
}

// ─────────────────────────────────────────────────────────────
//  Sample JavaScript
// ─────────────────────────────────────────────────────────────
const SAMPLE_JS = `// TwisterTools JavaScript Formatter Sample
const { useState, useEffect } = require("react");

/**
 * Fetches user data from the API endpoint
 * and returns a formatted user object.
 */
async function fetchUserData(userId) {
  const response = await fetch(
    \`https://api.example.com/users/\${userId}\`
  );

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role || "user",
    metadata: {
      lastLogin: data.lastLogin,
      preferences: data.preferences || {},
    },
  };
}

function calculateMetrics(items, multiplier = 1) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    const value = items[i].value * multiplier;
    if (value > 100) {
      total += value * 0.9;
    } else {
      total += value;
    }
  }
  return {
    total: total,
    average: items.length > 0 ? total / items.length : 0,
    count: items.length,
  };
}

const config = {
  theme: "dark",
  debug: false,
  version: "2.1.0",
  plugins: ["core", "utils", "ui"],
};

export { fetchUserData, calculateMetrics, config };`;

// ─────────────────────────────────────────────────────────────
//  React Component
// ─────────────────────────────────────────────────────────────

export default function JavaScriptFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState<"beautify" | "minify">("beautify");
  const [indentSize, setIndentSize] = useState<IndentSize>("2");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);


  // ── Process input whenever it changes ──
  useEffect(() => {
    try {
      const validationErrors = validateJs(input);
      setErrors(validationErrors);

      if (input.trim()) {
        if (activeTab === "beautify") {
          const beautified = beautifyJs(input, indentSize);
          setOutput(beautified);
        } else {
          const minified = minifyJs(input);
          setOutput(minified);
        }
      } else {
        setOutput("");
      }
    } catch (e) {
      setErrors([{ message: "An unexpected error occurred while processing JavaScript.", type: "error" }]);
      setOutput("");
    }
  }, [input, activeTab, indentSize]);

  // ── Load sample ──
  const loadSample = useCallback(() => {
    setInput(SAMPLE_JS);
  }, []);

  // ── Clear workspace ──
  const clearWorkspace = useCallback(() => {
    setInput("");
    setOutput("");
    setErrors([]);
  }, []);

  // ── Copy to clipboard ──
  const copyToClipboard = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = output;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  // ── Metrics ──
  const inputBytes = new TextEncoder().encode(input).length;
  const outputBytes = new TextEncoder().encode(output).length;
  const ratio = inputBytes > 0 ? ((outputBytes / inputBytes) * 100) : 0;
  const statementBlocks = countStatementBlocks(input);

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
              <span className="text-sm font-semibold text-slate-900">JavaScript Input</span>
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
                placeholder="Paste your JavaScript code here to format, beautify, and minify..."
                className="w-full bg-transparent font-mono text-sm text-slate-800 placeholder-slate-400 py-3 px-4 outline-none resize-none overflow-auto leading-6 flex-1"
                style={{ whiteSpace: "pre", overflowWrap: "normal" }}
                id="js-input-editor"
              />
            </div>
          </div>

          {/* Local Operational Control Bar */}
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Indentation Dropdown */}
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="js-indent-select"
                  className="text-xs font-semibold text-slate-600 whitespace-nowrap"
                >
                  Indent:
                </label>
                <select
                  id="js-indent-select"
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
                <RefreshCw className="w-4 h-4" />
                Load Sample JS
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
              {/* Validation Error Banner */}
              {errors.length > 0 && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-red-800">
                        JavaScript Syntax Error
                      </p>
                      {errors.map((err, idx) => (
                        <p key={idx} className="text-xs mt-1 leading-relaxed">{err.message}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Tab System */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setActiveTab("beautify")}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                    activeTab === "beautify"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Beautified Code
                </button>
                <button
                  onClick={() => setActiveTab("minify")}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                    activeTab === "minify"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Minified Output
                </button>
              </div>

              {/* Read-only Formatted Output */}
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 min-h-[220px] max-h-[340px] overflow-auto">
                {output ? (
                  <pre className="font-mono text-xs whitespace-pre leading-6 text-indigo-300">
                    <code>{output}</code>
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[180px] text-slate-500">
                    <Code className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                    <p className="text-xs italic">
                      {input.trim()
                        ? "Processing JavaScript..."
                        : "No JavaScript code loaded."}
                    </p>
                  </div>
                )}
              </div>

              {/* Copy Button */}
              <button
                onClick={copyToClipboard}
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
                    Copy Formatted JavaScript
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dynamic Metrics Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-500" />
              JS Metrics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  JS Input Size
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {inputBytes.toLocaleString()} B
                </p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  JS Output Size
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {outputBytes.toLocaleString()} B
                </p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  Compression Ratio
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {ratio > 0
                    ? `-${ratio.toFixed(1)}%`
                    : ratio < 0
                    ? `+${Math.abs(ratio).toFixed(1)}%`
                    : "0%"}
                </p>
              </div>

              <div className="bg-white border border-slate-200/60 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">
                  Statement Blocks
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {statementBlocks}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
         BELOW-THE-FOLD SEO PROSE
         ═══════════════════════════════════════════════════════ */}
      <section className="space-y-8 mt-8">

        {/* ── Section 1: Technical Architecture ── */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Braces className="w-5 h-5 text-indigo-600" />
            </div>
            Technical Architecture of JavaScript Compilation & Runtime Formatting
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            JavaScript parsing engines rely on tokenization pipelines to transform plain text source code into Abstract Syntax Trees (AST) before executing bytecode within high-performance virtual sandboxes. This client-side processing tool utilizes a lightweight, deterministic lexical analyzer optimized to run natively inside your browser. By isolating raw scripts locally, the system strips formatting anomalies while mapping control blocks without transmitting data across external network sockets.
          </p>
        </div>

        {/* Section 2: Lexical Tokenization Pipeline */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <ListOrdered className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Lexical Tokenization & Minification Pipeline Execution Steps</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            The JavaScript formatting engine processes raw script input through a deterministic four-stage pipeline that transforms unstructured code into beautifully formatted or densely compressed output. Each stage builds upon the previous one, starting with raw character scanning and culminating in the final production-ready string assembly. Understanding this pipeline helps developers appreciate how their code is processed and why the output maintains structural integrity regardless of input complexity.
          </p>
          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Lexical Filtering & Character Traversal",
                body: "The processor scans input streams sequentially, isolating structural characters such as braces, parentheses, semicolons, and operator tokens into independent structural categories. Each character is evaluated against a set of tokenization rules that determine whether it belongs to a keyword, identifier, string literal, comment, or structural delimiter. This fine-grained classification enables precise formatting control at the character level.",
              },
              {
                step: "2",
                title: "Contextual Block Mapping",
                body: "The internal parsing engine evaluates function scopes, conditional branches, loop constructs, and class declarations by tracking a depth counter that increments on opening braces and decrements on closing braces. Each control flow keyword (<code className=\"text-xs bg-slate-100 px-1.5 py-0.5 rounded\">if</code>, <code className=\"text-xs bg-slate-100 px-1.5 py-0.5 rounded\">for</code>, <code className=\"text-xs bg-slate-100 px-1.5 py-0.5 rounded\">while</code>, <code className=\"text-xs bg-slate-100 px-1.5 py-0.5 rounded\">function</code>) is recognized and handled with appropriate spacing and indentation rules.",
              },
              {
                step: "3",
                title: "Whitespace Normalization & Indent Injection",
                body: "For beautification workflows, statements are normalized into clean single-line segments, applying specific indentation weights to optimize developer readability. The engine strips excessive internal whitespace while preserving meaningful spacing within string literals, template expressions, and regular expression patterns. Each statement is placed on its own line with consistent indentation, and operators are surrounded by standard spacing for maximum clarity.",
              },
              {
                step: "4",
                title: "Structural Compression",
                body: "Minification routines discard redundant syntax tokens, comment sequences, and optional terminal whitespace arrays to build highly compressed production strings. The minifier removes all comment blocks, collapses whitespace to single spaces, and eliminates unnecessary spacing around operators and structural tokens. The result is a dense, production-ready JavaScript payload that preserves all functional logic while reducing file size for faster network delivery.",
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

        {/* ── Section 3: ECMAScript Token Optimization Reference Matrix ── */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>ECMAScript Token Optimization Reference Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            The following reference matrix illustrates how the JavaScript formatting engine transforms raw, unformatted code patterns into clean, production-ready structures. Each row demonstrates a specific syntax category, showing the before-and-after transformation alongside the performance impact of proper formatting. This table serves as a quick reference for understanding how the beautifier and minifier handle different JavaScript constructs.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Syntax Category</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Raw Formatting Layout</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Optimized Execution State</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Engine Performance Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-medium">Function Declarations</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 font-mono">{'function myFn(){return 1;}'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 font-mono">{'function myFn() {\n  return 1;\n}'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100">Prevents execution lookup lags</td>
                </tr>
                <tr className="bg-slate-50 hover:bg-slate-100 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-medium">Block Scope Control</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 font-mono">{'if(x==y){doSomething()}'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 font-mono">{'if (x === y) {\n  doSomething();\n}'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100">Clarifies branch conditions</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-medium">Embedded String Literals</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 font-mono">const s = "data value";</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 font-mono">const s = "data value";</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100">Retains integrity constraints</td>
                </tr>
                <tr className="bg-slate-50 hover:bg-slate-100 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-medium">Complex Multi-Line Arrays</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 font-mono">const a=[1,2,3,4];</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 font-mono">const a = [1, 2, 3, 4];</td>
                  <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100">Streamlines iterative indexing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 4: Real-World Front-End Staging Use Cases ── */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-indigo-600" />
            </div>
            Real-World Front-End Staging Use Cases
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <h3 className="font-semibold text-slate-800 mb-2">Production Bundle Debugging</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">Beautify obfuscated minified scripts directly inside a sandboxed local deck to easily isolate active execution bugs.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <h3 className="font-semibold text-slate-800 mb-2">Asset Size Reduction</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">Minify local script configurations or third-party web embeds instantly, minimizing bundle overhead before site deployments.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <h3 className="font-semibold text-slate-800 mb-2">Formatter Normalization</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">Clean up dynamic template strings, structural spacing mismatches, and messy formatting configurations across legacy scripts.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <h3 className="font-semibold text-slate-800 mb-2">Dev Ops Pipeline Testing</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">Validate code snippets quickly during staging reviews without standing up heavy Node modules or local build suites.</p>
            </div>
          </div>
        </div>

        {/* ── Section 5: Advanced JavaScript Optimization FAQs ── */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Advanced JavaScript Optimization & Code Parsing Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Is it safe to process sensitive enterprise scripts inside this tool?",
                a: "Yes. The conversion engine runs entirely inside your client browser sandbox utilizing native JavaScript execution APIs. No scripts, text inputs, or operational keys are ever sent to external databases or analytics networks.",
              },
              {
                q: "Does the minifier modify variable names or trigger structural breaking risks?",
                a: "No. This tool operates as a safe, structural whitespace processor. Unlike heavy build step tools that apply destructive variable mangling, this minifier removes spacing parameters safely without changing runtime code logic.",
              },
              {
                q: "How does the formatting engine protect complex regular expressions and template literals?",
                a: "The token scanner tracks opening syntax strings dynamically. When a quote, template tag, or regex boundary is encountered, the scanner bypasses adjustments until the segment closes safely, preventing formatting damage.",
              },
              {
                q: "Is this tool compliant with modern ECMAScript specifications?",
                a: "Yes. The underlying traversal logic respects structural formatting rules across modern variants including ES6 through ES14, supporting arrow functions, classes, modules, and modern syntax layouts.",
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
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 6: Platform Advantages & Performance Architecture ── */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl md:p-10 shadow-lg text-white p-4 sm:p-6">
          <h2 className="text-2xl font-bold mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span>Why Choose TwisterTools for High-Performance Code Refactoring?</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-indigo-200" />
                <h3 className="font-semibold text-white">Client-Side Sandbox Safety</h3>
              </div>
              <p className="text-indigo-100 text-sm md:text-base leading-relaxed">100% processing isolation inside your local runtime layer ensures your proprietary corporate code remains completely private.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-indigo-200" />
                <h3 className="font-semibold text-white">Zero External Package Risks</h3>
              </div>
              <p className="text-indigo-100 text-sm md:text-base leading-relaxed">Building upon native JavaScript text processing loops avoids external package bloat and supply-chain vulnerabilities.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Terminal className="w-5 h-5 text-indigo-200" />
                <h3 className="font-semibold text-white">Real-Time Metric Dashboards</h3>
              </div>
              <p className="text-indigo-100 text-sm md:text-base leading-relaxed">Keep track of raw script weights, compressed payload reductions, and expansion ratios immediately on every character stroke.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Blocks className="w-5 h-5 text-indigo-200" />
                <h3 className="font-semibold text-white">Strict Type Safety Controls</h3>
              </div>
              <p className="text-indigo-100 text-sm md:text-base leading-relaxed">Engineered using TypeScript constraints to provide predictable, deterministic code outputs every time you process scripts.</p>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
