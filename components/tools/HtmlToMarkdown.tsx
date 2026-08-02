"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ArrowRightLeft,
  Code2,
  CheckCircle2,
  Table,
  Layers,
  HelpCircle,
  Sparkles,
  Copy,
  Check,
  Trash2,
  FileDown,
  FileText,
  AlertTriangle,
  BarChart3,
  Eye,
  Code,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Mode types
// ─────────────────────────────────────────────────────────────
type ConversionMode = "html-to-md" | "md-to-html";
type OutputTab = "raw" | "preview";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript HTML → Markdown Engine (DOMParser-based)
//  Zero external dependencies — 100% client-side
// ─────────────────────────────────────────────────────────────

function htmlToMarkdown(html: string): string {
  if (!html.trim()) return "";

  // Attempt to parse with DOMParser
  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(html, "text/html");
    // Check for parser errors
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      throw new Error("Invalid HTML structure");
    }
  } catch (e: any) {
    throw new Error(e?.message || "Failed to parse HTML input. Please check your markup for syntax errors.");
  }

  const body = doc.body;
  const results: string[] = [];

  function traverse(node: Node, depth: number): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      // Normalize whitespace for non-pre contexts
      results.push(text);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      // ── Headings ──
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
        const level = parseInt(tag.charAt(1), 10);
        const prefix = "#".repeat(level);
        results.push(`\n${prefix} `);
        for (const child of Array.from(el.childNodes)) traverse(child, depth);
        results.push("\n\n");
        break;
      }

      // ── Paragraphs ──
      case "p": {
        results.push("\n\n");
        for (const child of Array.from(el.childNodes)) traverse(child, depth);
        results.push("\n\n");
        break;
      }

      // ── Line break ──
      case "br": {
        results.push("\n");
        break;
      }

      // ── Horizontal rule ──
      case "hr": {
        results.push("\n\n---\n\n");
        break;
      }

      // ── Bold / Strong ──
      case "strong": case "b": {
        results.push("**");
        for (const child of Array.from(el.childNodes)) traverse(child, depth);
        results.push("**");
        break;
      }

      // ── Italic / Emphasis ──
      case "em": case "i": {
        results.push("*");
        for (const child of Array.from(el.childNodes)) traverse(child, depth);
        results.push("*");
        break;
      }

      // ── Strikethrough ──
      case "s": case "del": case "strike": {
        results.push("~~");
        for (const child of Array.from(el.childNodes)) traverse(child, depth);
        results.push("~~");
        break;
      }

      // ── Inline code ──
      case "code": {
        // Check if inside a <pre> tag — handled at <pre> level
        if (el.closest("pre")) {
          for (const child of Array.from(el.childNodes)) traverse(child, depth);
        } else {
          results.push("`");
          for (const child of Array.from(el.childNodes)) traverse(child, depth);
          results.push("`");
        }
        break;
      }

      // ── Pre-formatted / Code block ──
      case "pre": {
        const codeEl = el.querySelector("code");
        let codeText = el.textContent || "";
        // Try to extract language from class like "language-js", "lang-python", etc.
        let language = "";
        if (codeEl) {
          const cls = codeEl.className || "";
          const langMatch = cls.match(/(?:lang(?:uage)?)-(\w+)/i);
          if (langMatch) language = langMatch[1];
        }
        results.push(`\n\n\`\`\`${language}\n${codeText.trim()}\n\`\`\`\n\n`);
        break;
      }

      // ── Blockquote ──
      case "blockquote": {
        // Extract inner text lines and prefix with ">"
        const innerLines: string[] = [];
        for (const child of Array.from(el.childNodes)) {
          traverse(child, depth + 1);
        }
        const raw = results.pop() || "";
        raw.split("\n").forEach((line) => {
          if (line.trim()) innerLines.push(`> ${line}`);
          else innerLines.push(">");
        });
        results.push(`\n\n${innerLines.join("\n")}\n\n`);
        break;
      }

      // ── Unordered list ──
      case "ul": {
        results.push("\n\n");
        for (const li of Array.from(el.children).filter((c) => c.tagName === "LI")) {
          results.push(`${"  ".repeat(Math.max(0, depth - 1))}- `);
          for (const child of Array.from(li.childNodes)) traverse(child, depth + 1);
          results.push("\n");
        }
        results.push("\n");
        break;
      }

      // ── Ordered list ──
      case "ol": {
        results.push("\n\n");
        let idx = 1;
        for (const li of Array.from(el.children).filter((c) => c.tagName === "LI")) {
          results.push(`${"  ".repeat(Math.max(0, depth - 1))}${idx}. `);
          for (const child of Array.from(li.childNodes)) traverse(child, depth + 1);
          results.push("\n");
          idx++;
        }
        results.push("\n");
        break;
      }

      // ── List item — handled inside ul/ol ──
      case "li": {
        for (const child of Array.from(el.childNodes)) traverse(child, depth);
        break;
      }

      // ── Anchor / Link ──
      case "a": {
        const href = el.getAttribute("href") || "";
        const title = el.getAttribute("title") || "";
        // Gather inner text
        const innerText = el.textContent || "";
        if (href && innerText) {
          const titlePart = title ? ` "${title}"` : "";
          results.push(`[${innerText}](${href}${titlePart})`);
        } else if (href) {
          results.push(`<${href}>`);
        } else {
          for (const child of Array.from(el.childNodes)) traverse(child, depth);
        }
        break;
      }

      // ── Image ──
      case "img": {
        const src = el.getAttribute("src") || "";
        const alt = el.getAttribute("alt") || "";
        const title = el.getAttribute("title") || "";
        const titlePart = title ? ` "${title}"` : "";
        if (src) {
          results.push(`![${alt}](${src}${titlePart})`);
        }
        break;
      }

      // ── Div / Span / Section / Article / Main / Header / Footer / Nav / Aside ──
      case "div": case "span": case "section": case "article":
      case "main": case "header": case "footer": case "nav": case "aside":
      case "figure": case "figcaption": case "details": case "summary": {
        for (const child of Array.from(el.childNodes)) traverse(child, depth);
        break;
      }

      // ── Tables ──
      case "table": {
        traverseTable(el);
        break;
      }

      // ── Default: pass through children ──
      default: {
        for (const child of Array.from(el.childNodes)) traverse(child, depth);
        break;
      }
    }

    function traverseTable(tableEl: Element): void {
      results.push("\n\n");
      const allRows = tableEl.querySelectorAll("tr");

      if (allRows.length === 0) return;

      // Process header row (first row)
      const headerCells = Array.from(allRows[0].querySelectorAll("th, td"));
      const headerMarkdown = headerCells.map((cell) => cell.textContent?.trim() || "").join(" | ");
      results.push(`| ${headerMarkdown} |\n`);

      // Separator row
      const separators = headerCells.map(() => "---");
      results.push(`| ${separators.join(" | ")} |\n`);

      // Data rows
      for (let i = 1; i < allRows.length; i++) {
        const cells = Array.from(allRows[i].querySelectorAll("td, th"));
        const rowMarkdown = cells.map((cell) => cell.textContent?.trim() || "").join(" | ");
        results.push(`| ${rowMarkdown} |\n`);
      }
      results.push("\n");
    }
  }

  for (const child of Array.from(body.childNodes)) {
    traverse(child, 0);
  }

  // Clean up excessive whitespace
  let md = results.join("");
  // Collapse more than 2 consecutive newlines into 2
  md = md.replace(/\n{3,}/g, "\n\n");
  // Trim leading/trailing whitespace
  md = md.trim();

  return md;
}

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript Regex-Based Markdown → HTML Compiler
//  Reuses the engine from MarkdownToHtmlConverter
// ─────────────────────────────────────────────────────────────

function compileMarkdown(md: string): string {
  if (!md.trim()) return "";

  let html = md;

  // ── Step 1: Escape HTML entities ──
  html = html
    .replace(/&/g, "\x26amp;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;");

  // ── Step 2: Block-level processing ──

  // Horizontal rules
  html = html.replace(/^(?:[-*_]){3,}\s*$/gm, '<hr class="my-6 border-slate-300 dark:border-slate-600">');

  // Fenced code blocks
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/gm,
    (_match: string, lang: string, code: string) => {
      const langClass = lang ? ` class="language-${lang}"` : "";
      return `<pre class="bg-slate-900 text-slate-100 rounded-xl p-5 overflow-x-auto text-sm font-mono leading-relaxed my-4 shadow-inner"><code${langClass}>${code.trim()}</code></pre>`;
    }
  );

  // Indented code blocks
  html = html.replace(
    /(?:^ {4}.*(?:\n|$))+/gm,
    (match: string) => {
      const code = match.replace(/^ {4}/gm, "").trim();
      if (!code) return match;
      return `<pre class="bg-slate-900 text-slate-100 rounded-xl p-5 overflow-x-auto text-sm font-mono leading-relaxed my-4 shadow-inner"><code>${code}</code></pre>`;
    }
  );

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-5 mb-2">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="text-base font-semibold text-slate-800 dark:text-slate-200 mt-5 mb-2">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-5 mb-2">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-7 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-bold text-slate-900 dark:text-white mt-8 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">$1</h1>');

  // Blockquotes
  html = html.replace(
    /^(>+\s?.*(?:\n|$))+/gm,
    (match: string) => {
      const content = match
        .split("\n")
        .map((line: string) => line.replace(/^>+\s?/, ""))
        .join("\n")
        .trim();
      return `<blockquote class="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-r-xl pl-5 pr-4 py-3 my-4 text-slate-700 dark:text-slate-300 italic leading-relaxed">${content}</blockquote>`;
    }
  );

  // Unordered lists
  html = html.replace(
    /(?:^[*\-+]\s+.*(?:\n|$))+/gm,
    (match: string) => {
      const items = match
        .split("\n")
        .filter((line: string) => line.trim())
        .map((line: string) => `<li class="text-slate-700 dark:text-slate-300 leading-relaxed pl-1">${line.replace(/^[*\-+]\s+/, "")}</li>`)
        .join("\n");
      return `<ul class="list-disc list-inside space-y-1.5 my-3 pl-2">\n${items}\n</ul>`;
    }
  );

  // Ordered lists
  html = html.replace(
    /(?:^\d+\.\s+.*(?:\n|$))+/gm,
    (match: string) => {
      const items = match
        .split("\n")
        .filter((line: string) => line.trim())
        .map((line: string) => `<li class="text-slate-700 dark:text-slate-300 leading-relaxed pl-1">${line.replace(/^\d+\.\s+/, "")}</li>`)
        .join("\n");
      return `<ol class="list-decimal list-inside space-y-1.5 my-3 pl-2">\n${items}\n</ol>`;
    }
  );

  // Tables
  html = html.replace(
    /^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm,
    (_match: string, headerRow: string, bodyRows: string) => {
      const headers = headerRow
        .split("|")
        .map((h: string) => h.trim())
        .filter((h: string) => h)
        .map((h: string) => `<th class="border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-left text-sm font-semibold text-slate-800 dark:text-slate-200">${h}</th>`)
        .join("\n");

      const rows = bodyRows
        .trim()
        .split("\n")
        .filter((r: string) => r.trim())
        .map((row: string) => {
          const cells = row
            .split("|")
            .map((c: string) => c.trim())
            .filter((c: string) => c)
            .map((c: string) => `<td class="border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-700 dark:text-slate-300">${c}</td>`)
            .join("\n");
          return `<tr>\n${cells}\n</tr>`;
        })
        .join("\n");

      return `<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-slate-300 dark:border-slate-600 rounded-xl">\n<thead>\n<tr>\n${headers}\n</tr>\n</thead>\n<tbody>\n${rows}\n</tbody>\n</table></div>`;
    }
  );

  // ── Step 3: Inline processing ──

  // Images (before links)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="max-w-full h-auto rounded-xl my-4 shadow-md" loading="lazy">'
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2 decoration-indigo-300 dark:decoration-indigo-600 hover:decoration-indigo-600 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-mono text-sm px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">$1</code>'
  );

  // Bold + Italic (***text***)
  html = html.replace(
    /\*\*\*(.+?)\*\*\*/g,
    '<strong class="font-bold"><em class="italic">$1</em></strong>'
  );

  // Bold (**text**)
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>'
  );

  // Italic (*text*)
  html = html.replace(
    /\*(.+?)\*/g,
    '<em class="italic text-slate-800 dark:text-slate-200">$1</em>'
  );

  // Strikethrough (~~text~~)
  html = html.replace(
    /~~(.+?)~~/g,
    '<del class="line-through text-slate-500 dark:text-slate-400">$1</del>'
  );

  // ── Step 4: Paragraph wrapping ──
  const lines = html.split("\n");
  const wrapped: string[] = [];
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (inBlock) inBlock = false;
      continue;
    }

    if (
      line.startsWith("<h") ||
      line.startsWith("<pre") ||
      line.startsWith("<blockquote") ||
      line.startsWith("<ul") ||
      line.startsWith("<ol") ||
      line.startsWith("<li") ||
      line.startsWith("<div") ||
      line.startsWith("<table") ||
      line.startsWith("<tr") ||
      line.startsWith("<th") ||
      line.startsWith("<td") ||
      line.startsWith("<hr") ||
      line.startsWith("<img") ||
      line.startsWith("</") ||
      line.endsWith("</pre>") ||
      line.endsWith("</blockquote>") ||
      line.endsWith("</ul>") ||
      line.endsWith("</ol>") ||
      line.endsWith("</div>") ||
      line.endsWith("</table>")
    ) {
      if (inBlock) {
        wrapped.push("</p>");
        inBlock = false;
      }
      wrapped.push(line);
      continue;
    }

    if (!inBlock) {
      wrapped.push('<p class="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">');
      inBlock = true;
    }
    wrapped.push(line);
  }

  if (inBlock) wrapped.push("</p>");

  return wrapped.join("\n");
}

// ─────────────────────────────────────────────────────────────
//  Sample Data
// ─────────────────────────────────────────────────────────────

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Sample Document</title>
</head>
<body>
  <h1>Welcome to HTML to Markdown Converter</h1>
  <p>This is a <strong>sample HTML document</strong> that demonstrates the <em>bi-directional</em> conversion capabilities of this tool.</p>

  <h2>Features Overview</h2>
  <p>Here are some key features:</p>
  <ul>
    <li>Convert <strong>HTML to Markdown</strong> using DOM parsing</li>
    <li>Convert <strong>Markdown to HTML</strong> using regex compilation</li>
    <li>Real-time <em>live preview</em> of the output</li>
  </ul>

  <h3>Code Example</h3>
  <pre><code class="language-javascript">function greet(name) {
  return \`Hello, \${name}!\`;
}</code></pre>

  <blockquote>
    Markdown is a lightweight markup language with plain text formatting syntax.
  </blockquote>

  <hr>

  <h3>Links and Images</h3>
  <p>Visit <a href="https://www.twistertools.com">TwisterTools</a> for more utilities.</p>

  <h3>Table Example</h3>
  <table>
    <thead>
      <tr>
        <th>Feature</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Headings</td>
        <td>Supported</td>
      </tr>
      <tr>
        <td>Lists</td>
        <td>Supported</td>
      </tr>
      <tr>
        <td>Code Blocks</td>
        <td>Supported</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

const SAMPLE_MARKDOWN = `# Welcome to Markdown to HTML Converter

Transform your **Markdown** documents into clean, semantic *HTML* code instantly — all within your browser.

## Quick Start Guide

This tool supports the full spectrum of **CommonMark** syntax elements:

### Text Formatting

You can use **bold text**, *italic text*, ***bold italic***, ~~strikethrough~~, and \`inline code\` to style your content.

### Lists

Unordered list:
- Item one with some descriptive text
- Item two with additional context
- Item three completing the set

Ordered list:
1. First step in the process
2. Second step with details
3. Third and final step

### Code Blocks

Here's a JavaScript example:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}! Welcome to Markdown.\`;
}

console.log(greet("Developer"));
\`\`\`

### Blockquotes

> Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents.
>
> — John Gruber, Creator of Markdown

### Links and Images

Visit [TwisterTools](https://www.twistertools.com) for more developer utilities.

### Tables

| Feature | Status | Version |
|---------|--------|---------|
| Headings | Complete | 1.0 |
| Lists | Complete | 1.0 |
| Code Blocks | Complete | 1.0 |
| Tables | Complete | 1.0 |

---

*Start typing or load the sample to see the live preview update in real-time!*
`;

// ─────────────────────────────────────────────────────────────
//  Utility: Count rendered HTML elements
// ─────────────────────────────────────────────────────────────

function countRenderedElements(html: string): number {
  if (!html) return 0;
  const tagRegex = /<(\w+)[\s>]/g;
  let count = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html)) !== null) {
    if (!["div", "p", "span"].includes(match[1])) {
      count++;
    }
  }
  return count;
}

// ─────────────────────────────────────────────────────────────
//  Static FAQ Section (always expanded)
// ─────────────────────────────────────────────────────────────

function FaqSection({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  return (
    <div className="space-y-5">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="border-l-4 border-indigo-500 pl-4 py-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-r-xl"
        >
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
            {item.q}
          </h3>
          <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pr-4">
            {item.a}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────

export default function HtmlToMarkdown() {
  const [mode, setMode] = useState<ConversionMode>("html-to-md");
  const [input, setInput] = useState("");
  const [outputTab, setOutputTab] = useState<OutputTab>("raw");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Core Conversion ──
  const convertedOutput = useMemo(() => {
    if (!input.trim()) return "";
    setErrorMessage(null);
    try {
      if (mode === "html-to-md") {
        return htmlToMarkdown(input);
      } else {
        return compileMarkdown(input);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || "An unexpected error occurred during conversion.");
      return "";
    }
  }, [input, mode]);

  // Reset error when input/mode changes
  useEffect(() => {
    if (input.trim()) {
      // re-evaluate error
      try {
        if (mode === "html-to-md") {
          htmlToMarkdown(input);
        } else {
          compileMarkdown(input);
        }
        setErrorMessage(null);
      } catch (e: any) {
        setErrorMessage(e?.message || "An unexpected error occurred.");
      }
    } else {
      setErrorMessage(null);
    }
  }, [input, mode]);

  // ── Metrics ──
  const metrics = useMemo(() => {
    const encoder = typeof window !== "undefined" ? new TextEncoder() : null;
    const inputBytes = encoder ? encoder.encode(input).length : input.length;
    const outputBytes = encoder ? encoder.encode(convertedOutput).length : convertedOutput.length;
    const inputChars = input.length;
    const outputChars = convertedOutput.length;
    const inputWords = input.trim() ? input.trim().split(/\s+/).length : 0;
    const outputWords = convertedOutput.trim() ? convertedOutput.trim().split(/\s+/).length : 0;
    const efficiencyRatio = outputBytes > 0 && inputBytes > 0
      ? Math.min(100, Math.round((outputBytes / inputBytes) * 100))
      : 0;
    return {
      inputBytes,
      outputBytes,
      inputChars,
      outputChars,
      inputWords,
      outputWords,
      efficiencyRatio,
    };
  }, [input, convertedOutput]);

  // ── Handlers ──
  const handleLoadSample = useCallback(() => {
    setInput(mode === "html-to-md" ? SAMPLE_HTML : SAMPLE_MARKDOWN);
    setErrorMessage(null);
    setOutputTab("raw");
  }, [mode]);

  const handleClear = useCallback(() => {
    setInput("");
    setErrorMessage(null);
    setOutputTab("raw");
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSwap = useCallback(() => {
    const currentOutput = convertedOutput;
    setMode((prev) => (prev === "html-to-md" ? "md-to-html" : "html-to-md"));
    if (currentOutput) {
      setInput(currentOutput);
    }
    setErrorMessage(null);
    setOutputTab("raw");
  }, [convertedOutput]);

  const handleCopy = useCallback(async () => {
    if (!convertedOutput) return;
    try {
      await navigator.clipboard.writeText(convertedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = convertedOutput;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [convertedOutput]);

  // ── Preview HTML (for Markdown → HTML mode) ──
  const previewHtml = useMemo(() => {
    if (mode === "md-to-html" && convertedOutput) {
      return convertedOutput;
    }
    return "";
  }, [mode, convertedOutput]);

  return (
    <div className="w-full space-y-4">
      {/* ── Mode Switcher Tab Bar ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {(
          [
            { id: "html-to-md", label: "HTML to Markdown", icon: Code },
            { id: "md-to-html", label: "Markdown to HTML", icon: FileText },
          ] as { id: ConversionMode; label: string; icon: React.ElementType }[]
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setMode(id);
              setOutputTab("raw");
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 border min-h-[40px] ${
              mode === id
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT COLUMN — Input ══════════════════ */}
        <div className="space-y-4">
          {/* Input Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Gradient Title Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mode === "html-to-md" ? (
                  <Code className="w-4 h-4 text-indigo-300" />
                ) : (
                  <FileText className="w-4 h-4 text-indigo-300" />
                )}
                <span className="text-sm font-semibold">
                  {mode === "html-to-md" ? "HTML Input" : "Markdown Input"}
                </span>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded-full">
                {mode === "html-to-md" ? "DOMParser Engine" : "Regex Compiler"}
              </span>
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "html-to-md"
                  ? "Paste your HTML markup here to convert it to Markdown..."
                  : "Paste your Markdown text here to convert it to HTML..."
              }
              className="font-mono text-sm h-[450px] p-4 w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-b-xl resize-none"
              style={{ outline: "none" } as React.CSSProperties}
              spellCheck={false}
            />
          </div>

          {/* Toolbar Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleLoadSample}
              className="min-h-[40px] px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <FileDown className="w-4 h-4" />
              Load Sample Data
            </button>
            <button
              onClick={handleSwap}
              disabled={!convertedOutput}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 border ${
                convertedOutput
                  ? "bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  : "bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed border-slate-100 dark:border-slate-800"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Swap
            </button>
            <button
              onClick={handleClear}
              className="min-h-[40px] px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Trash2 className="w-4 h-4" />
              Clear Workspace
            </button>
          </div>
        </div>

        {/* ══════════════════ RIGHT COLUMN — Output ══════════════════ */}
        <div>
          <div className="sticky top-4">
            {/* Output Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {/* Gradient Header Bar */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mode === "html-to-md" ? (
                    <FileText className="w-4 h-4 text-indigo-300" />
                  ) : (
                    <Code className="w-4 h-4 text-indigo-300" />
                  )}
                  <span className="text-sm font-semibold">
                    {mode === "html-to-md" ? "Markdown Output" : "HTML Output"}
                  </span>
                </div>
                <span className="text-[10px] text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded-full">
                  {mode === "html-to-md" ? "CommonMark Syntax" : "Semantic HTML"}
                </span>
              </div>

              {/* Dual-View Selector */}
              {convertedOutput && mode === "md-to-html" && (
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setOutputTab("raw")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium min-h-[44px] transition-colors ${
                      outputTab === "raw"
                        ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    Converted Output
                  </button>
                  <button
                    onClick={() => setOutputTab("preview")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium min-h-[44px] transition-colors ${
                      outputTab === "preview"
                        ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Live Preview
                  </button>
                </div>
              )}

              {/* Output Content */}
              <div className="p-4">
                {errorMessage ? (
                  <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl p-4 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Conversion Error</p>
                      <p className="mt-1 text-rose-700 dark:text-rose-400">{errorMessage}</p>
                    </div>
                  </div>
                ) : mode === "md-to-html" && outputTab === "preview" && convertedOutput ? (
                  <div
                    className="h-[370px] overflow-y-auto p-4 prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl"
                    dangerouslySetInnerHTML={{
                      __html: previewHtml,
                    }}
                  />
                ) : (
                  <div className="h-[370px] overflow-y-auto">
                    {convertedOutput ? (
                      <pre className="text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all leading-relaxed">
                        {convertedOutput}
                      </pre>
                    ) : (
                      <p className="text-slate-400 dark:text-slate-500 italic text-sm">
                        {input.trim()
                          ? ""
                          : mode === "html-to-md"
                          ? "Paste HTML markup on the left to see Markdown output here..."
                          : "Paste Markdown text on the left to see HTML output here..."}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Copy Button */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleCopy}
                  disabled={!convertedOutput}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    convertedOutput
                      ? copied
                        ? "bg-green-500 text-white shadow-md shadow-green-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied Successfully!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Converted Output
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Conversion Metrics
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800">
                <div className="bg-white dark:bg-slate-900 p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Input Size
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {metrics.inputBytes.toLocaleString()} <span className="font-normal text-slate-400">B</span>
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Output Size
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {metrics.outputBytes.toLocaleString()} <span className="font-normal text-slate-400">B</span>
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Char / Word
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {metrics.inputChars.toLocaleString()} / {metrics.inputWords.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Efficiency
                  </p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {metrics.efficiencyRatio}<span className="font-normal">%</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          BELOW-THE-FOLD SEO CONTENT CARDS
          ════════════════════════════════════════════════════════ */}

      <section className="space-y-8 mt-12">
        {/* ── Card 1: Technical Architecture ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm md:p-8 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of HTML & Markdown Conversion</span>
          </h2>
          <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
            <p>
              The bi-directional conversion between HTML and Markdown operates on two fundamentally
              different parsing paradigms. <strong>DOM tree serialization</strong> (used for HTML-to-Markdown
              conversion) leverages the browser's native <code className="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-mono text-sm px-1.5 py-0.5 rounded">DOMParser</code> API to
              construct a complete Document Object Model tree from the input HTML string. The engine then
              performs a depth-first recursive traversal of every node in the tree, mapping each semantic
              HTML element to its corresponding CommonMark syntax equivalent. This approach ensures that
              the structural integrity of nested elements — such as lists within blockquotes or code blocks
              within list items — is preserved with high fidelity.
            </p>
            <p>
              In contrast, <strong>regex-based parsing</strong> (used for Markdown-to-HTML conversion) employs
              a multi-pass pattern-matching pipeline. Each Markdown construct — headings, code fences,
              blockquotes, lists, tables, inline formatting — is matched by a carefully ordered regular
              expression and replaced with its semantic HTML equivalent. This approach is computationally
              lightweight and executes in O(n) time relative to input length, making it ideal for
              client-side processing where minimal latency is critical.
            </p>
            <p>
              Maintaining semantic fidelity across content migrations requires careful handling of edge
              cases: nested inline formatting within block elements, language identifiers in fenced code
              blocks, list nesting depth, and table alignment markers. Both engines in this suite implement
              rigorous normalization routines for whitespace, indentation, and line breaks to ensure that
              converted output remains clean, readable, and structurally valid when rendered.
            </p>
          </div>
        </div>

        {/* ── Card 2: Conversion Engine Pipeline ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm md:p-8 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Lexical Parsing & DOM Traversal Pipeline</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                step: "1",
                title: "DOM Document Parsing & Node Extraction",
                body: "The HTML input string is parsed into a live Document object using DOMParser. All element nodes, text nodes, and attribute values are extracted into a traversable tree structure. For Markdown input, the string is tokenized into block-level segments using multi-line regex matching.",
              },
              {
                step: "2",
                title: "Semantic Tag to Markdown Syntax Translation",
                body: "Each HTML element is mapped to its CommonMark equivalent: headings become hash prefixes, emphasis becomes asterisk wrapping, links become bracket-parenthesis pairs, and code blocks become triple-backtick fences. The recursive traversal ensures nested structures are properly indented.",
              },
              {
                step: "3",
                title: "Whitespace, Linebreak & Indentation Normalization",
                body: "Raw HTML whitespace — including non-breaking spaces, multiple consecutive line breaks, and tab characters — is normalized to clean Markdown conventions. List indentation is calculated based on nesting depth, and block-level elements are separated by double line breaks.",
              },
              {
                step: "4",
                title: "Clean Markdown Assembly & Sanitization",
                body: "The final Markdown string is assembled from the processed segments, with excessive whitespace collapsed and leading/trailing whitespace trimmed. The output is validated for structural consistency and returned as a clean, human-readable Markdown document ready for use.",
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 rounded-xl p-5 flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-sm">{title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Card 3: Markup Specification Reference Matrix ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm md:p-8 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>HTML Tag vs. Markdown Syntax Specification Matrix</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-6">
            The table below maps every supported HTML element to its corresponding CommonMark Markdown
            syntax, along with the visual rendering behavior and the parsing rule applied by the conversion
            engine. This reference matrix serves as a comprehensive guide for understanding how each
            structural component is transformed during the bi-directional conversion process.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 dark:bg-slate-700">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    HTML Element
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Markdown Equivalent
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Visual Rendering
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Parsing Rule
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {[
                  { html: "<h1>–<h6>", md: "# to ######", render: "Heading hierarchy, bold weight", rule: "Hash prefix followed by space" },
                  { html: "<p>", md: "Plain text + blank line", render: "Block paragraph, regular weight", rule: "Double newline separation" },
                  { html: "<strong> / <b>", md: "**bold**", render: "Strong emphasis, bold weight", rule: "Double asterisk wrapping" },
                  { html: "<em> / <i>", md: "*italic*", render: "Emphasized text, italic style", rule: "Single asterisk wrapping" },
                  { html: "<s> / <del>", md: "~~strike~~", render: "Strikethrough, line-through", rule: "Double tilde wrapping" },
                  { html: "<code> (inline)", md: "`code`", render: "Monospace, colored background", rule: "Backtick code fence" },
                  { html: "<pre><code>", md: "```lang```", render: "Fenced block, dark background", rule: "Triple backtick with optional lang" },
                  { html: "<blockquote>", md: "> prefix", render: "Indented quote, left border", rule: "Greater-than prefix per line" },
                  { html: "<ul> / <li>", md: "- item", render: "Bullet list, disc markers", rule: "Hyphen prefix with indentation" },
                  { html: "<ol> / <li>", md: "1. item", render: "Numbered list, decimal markers", rule: "Number-period prefix" },
                  { html: "<a>", md: "[text](url)", render: "Hyperlink, underlined", rule: "Bracket-parenthesis pair" },
                  { html: "<img>", md: "![alt](src)", render: "Responsive image, rounded", rule: "Exclamation + brackets + parentheses" },
                  { html: "<hr>", md: "---", render: "Horizontal rule, slate line", rule: "Three or more hyphens" },
                  { html: "<table>", md: "| cell | cell |", render: "Grid with bordered cells", rule: "Pipe-delimited rows with separator" },
                ].map(({ html, md, render, rule }, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-800 dark:text-slate-200">
                      {html}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {md}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {render}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {rule}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Card 4: Enterprise Use Cases ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm md:p-8 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Enterprise Use Cases & Technical Integration</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                title: "Legacy CMS to Static Site Migrations",
                body: "Organizations migrating from traditional CMS platforms (WordPress, Drupal, Joomla) to static site generators (Astro, Next.js, Hugo, Eleventy) need to convert thousands of HTML-stored articles into Markdown frontmatter. This tool's DOMParser-based engine preserves heading hierarchy, link structures, image references, and embedded formatting — dramatically reducing migration engineering hours.",
              },
              {
                title: "Scraping & Clean Content Extraction",
                body: "Data engineering teams extracting content from web scraping pipelines can convert scraped HTML into clean, minimal Markdown for storage in version-controlled repositories. The Markdown output eliminates extraneous div wrappers, inline styles, and script tags, producing human-readable documents that are ideal for diff-based change tracking and content review workflows.",
              },
              {
                title: "Developer Documentation Staging",
                body: "Documentation engineers drafting API references and technical guides in Markdown can use the Markdown-to-HTML compiler to preview how content will render in production documentation sites. The live preview tab provides instant visual feedback, while the raw HTML output can be directly embedded into JSDoc, TypeDoc, or similar documentation generation pipelines.",
              },
              {
                title: "API Payload Serialization",
                body: "Backend developers working with content management APIs often receive HTML-formatted rich text fields that need to be stored, indexed, or displayed in Markdown-rendered interfaces. This tool's client-side conversion enables real-time transformation of API response payloads without requiring server-side Markdown libraries, reducing infrastructure dependencies and latency.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="border border-slate-200 dark:border-slate-700 p-5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:-translate-y-1 transition-transform"
              >
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-sm">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Card 5: Frequently Asked Questions ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm md:p-8 p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <FaqSection
            items={[
              {
                q: "Is this tool safe for offline and client-only use?",
                a: "Absolutely. All conversion processing — both HTML-to-Markdown and Markdown-to-HTML — executes entirely within your browser using the DOMParser API and pure TypeScript regex engines. No input text, converted output, or any other data is transmitted to any server, stored in any database, or processed by any external API. This makes the tool fully functional even in offline or air-gapped environments, and ensures complete data privacy for sensitive content.",
              },
              {
                q: "How does the tool handle inline CSS and style attributes?",
                a: "Inline CSS styles and style attributes are not directly converted to Markdown, as CommonMark has no equivalent for CSS properties. However, the HTML parser fully preserves the textual content within styled elements. For styling-critical workflows, the recommended approach is to strip inline styles before conversion or use the Markdown output as a clean base that can be re-styled with CSS frameworks in the target rendering environment.",
              },
              {
                q: "Does the converter support nested lists (lists within lists)?",
                a: "Yes, the DOMParser-based HTML-to-Markdown engine recursively traverses nested list structures and outputs them with proper Markdown indentation using two-space prefixes per nesting level. For Markdown-to-HTML conversion, the regex compiler handles flat list structures with reliable accuracy. For deeply nested lists (3+ levels), it is recommended to use the HTML-to-Markdown direction for optimal fidelity.",
              },
              {
                q: "How secure is my data during conversion?",
                a: "Security is a core architectural property of this tool. Because every conversion operation occurs entirely within the browser's JavaScript runtime using native web APIs (DOMParser, TextEncoder), there are zero network requests, zero data transmissions, and zero persistence layers involved. Your HTML source, Markdown output, and any intermediate processing results never leave your device. This zero-trust architecture makes the tool suitable for proprietary code, confidential documentation, and sensitive data processing.",
              },
            ]}
          />
        </div>

        {/* ── Card 6: Platform Advantages ── */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white md:p-8 rounded-2xl p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span>Why Choose TwisterTools for HTML & Markdown Conversion?</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                title: "Zero-Latency, Real-Time Execution",
                body: "Both conversion engines execute entirely within your browser with no network round-trips. The DOMParser-based HTML-to-Markdown engine and regex-based Markdown-to-HTML compiler both deliver sub-millisecond conversion times, enabling instant feedback as you type or paste content. There are no API rate limits, no processing queues, and no server-side bottlenecks.",
              },
              {
                title: "Complete Data Privacy Architecture",
                body: "All processing occurs locally on your device using native browser APIs. Zero data — including input text, converted output, or intermediate processing state — is transmitted over any network. This zero-exfiltration architecture ensures that sensitive code snippets, proprietary documentation, and confidential content never leave your controlled environment.",
              },
              {
                title: "Offline-Safe & Air-Gap Compatible",
                body: "Because the entire application bundles the conversion logic as client-side TypeScript modules with zero external runtime dependencies, the tool functions reliably in offline environments, air-gapped networks, and restricted enterprise infrastructures where external API access is prohibited by security policy.",
              },
              {
                title: "Zero External Package Overhead",
                body: "Unlike many conversion tools that depend on third-party npm packages like Turndown or Marked, this suite implements both conversion engines using pure TypeScript with standard browser APIs. This eliminates supply chain risks, reduces bundle size, and ensures long-term maintainability without external dependency drift.",
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

      {/* JSON-LD Structured Data */}
      <div className="hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "HTML to Markdown & Markdown to HTML Converter Suite",
              description:
                "Free online bi-directional HTML to Markdown and Markdown to HTML converter. Pure TypeScript DOMParser and regex-based conversion engines with real-time preview, dual-view output, and comprehensive metrics. 100% client-side with zero external dependencies.",
              url: "https://www.twistertools.com/tools/developer-tools/html-to-markdown",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "All",
              browserRequirements: "Requires JavaScript",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Bi-directional HTML to Markdown and Markdown to HTML conversion",
                "DOMParser-based DOM tree serialization for HTML-to-Markdown",
                "Multi-pass regex tokenization for Markdown-to-HTML compilation",
                "Real-time reactive conversion on every keystroke",
                "Dual-view output: Converted Output and Live Preview tabs",
                "Performance metrics: Input Size, Output Size, Character/Word count, Conversion Efficiency Ratio",
                "Error guardrails with soft-red warning banner for malformed input",
                "Load Sample Data and Clear Workspace controls",
                "Swap Input/Output for bi-directional workflow",
                "Full-width Copy Converted Output button with 2-second success feedback",
                "100% client-side execution with zero server transmission",
                "Zero external npm dependencies — pure TypeScript implementation",
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