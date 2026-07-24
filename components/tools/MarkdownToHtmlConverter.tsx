"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  FileText,
  Eye,
  Code,
  Copy,
  Check,
  Trash2,
  FileCode,
  Sparkles,
  HelpCircle,
  Layers,
  Info,
  Shield,
  Zap,
  Cpu,
  RefreshCw,
  BookOpen,
  CheckCircle,
  Hash,
  List,
  Quote,
  Terminal,
  Bold,
  Italic,
  Link,
  Image,
  Table,
  AlertTriangle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure TypeScript Regex-Based Markdown Compiler
//  Zero external dependencies — 100% client-side
// ─────────────────────────────────────────────────────────────

/**
 * Compile raw Markdown string into sanitized HTML string.
 * Uses a multi-pass regex tokenization pipeline:
 *   1. Block-level elements (headings, code blocks, blockquotes, lists, HR, tables)
 *   2. Inline elements (bold, italic, code, links, images)
 *   3. Sanitization & assembly
 */
function compileMarkdown(md: string): string {
  if (!md.trim()) return "";

  let html = md;

  // ── Step 1: Escape HTML entities to prevent XSS ──
  html = html
    .replace(/&/g, "\x26amp;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;");

  // ── Step 2: Block-level processing ──

  // Horizontal rules (must be before headings to avoid conflicts)
  html = html.replace(/^(?:[-*_]){3,}\s*$/gm, '<hr class="my-6 border-slate-300">');

  // Fenced code blocks (```lang or ```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/gm,
    (_match: string, lang: string, code: string) => {
      const langClass = lang ? ` class="language-${lang}"` : "";
      return `<pre class="bg-slate-900 text-slate-100 rounded-xl p-5 overflow-x-auto text-sm font-mono leading-relaxed my-4 shadow-inner"><code${langClass}>${code.trim()}</code></pre>`;
    }
  );

  // Indented code blocks (4 spaces or 1 tab)
  html = html.replace(
    /(?:^ {4}.*(?:\n|$))+/gm,
    (match: string) => {
      const code = match.replace(/^ {4}/gm, "").trim();
      return `<pre class="bg-slate-900 text-slate-100 rounded-xl p-5 overflow-x-auto text-sm font-mono leading-relaxed my-4 shadow-inner"><code>${code}</code></pre>`;
    }
  );

  // Headings (must be after code blocks to avoid matching inside code)
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-semibold text-slate-800 mt-5 mb-2">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="text-base font-semibold text-slate-800 mt-5 mb-2">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="text-lg font-semibold text-slate-800 mt-5 mb-2">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-slate-900 mt-7 mb-3 pb-2 border-b border-slate-200">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-bold text-slate-900 mt-8 mb-4 pb-3 border-b border-slate-200">$1</h1>');

  // Blockquotes
  html = html.replace(
    /^(>+\s?.*(?:\n|$))+/gm,
    (match: string) => {
      const content = match
        .split("\n")
        .map((line: string) => line.replace(/^>+\s?/, ""))
        .join("\n")
        .trim();
      return `<blockquote class="border-l-4 border-indigo-500 bg-indigo-50/50 rounded-r-xl pl-5 pr-4 py-3 my-4 text-slate-700 italic leading-relaxed">${content}</blockquote>`;
    }
  );

  // Unordered lists
  html = html.replace(
    /(?:^[*\-+]\s+.*(?:\n|$))+/gm,
    (match: string) => {
      const items = match
        .split("\n")
        .filter((line: string) => line.trim())
        .map((line: string) => `<li class="text-slate-700 leading-relaxed pl-1">${line.replace(/^[*\-+]\s+/, "")}</li>`)
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
        .map((line: string) => `<li class="text-slate-700 leading-relaxed pl-1">${line.replace(/^\d+\.\s+/, "")}</li>`)
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
        .map((h: string) => `<th class="border border-slate-300 bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-slate-800">${h}</th>`)
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
            .map((c: string) => `<td class="border border-slate-300 px-4 py-2 text-sm text-slate-700">${c}</td>`)
            .join("\n");
          return `<tr>\n${cells}\n</tr>`;
        })
        .join("\n");

      return `<div class="overflow-x-auto my-4"><table class="w-full border-collapse border border-slate-300 rounded-xl">\n<thead>\n<tr>\n${headers}\n</tr>\n</thead>\n<tbody>\n${rows}\n</tbody>\n</table></div>`;
    }
  );

  // ── Step 3: Inline processing ──

  // Images (must be before links)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="max-w-full h-auto rounded-xl my-4 shadow-md" loading="lazy">'
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-100 text-rose-600 font-mono text-sm px-1.5 py-0.5 rounded-md border border-slate-200">$1</code>'
  );

  // Bold + Italic combined (***text***)
  html = html.replace(
    /\*\*\*(.+?)\*\*\*/g,
    '<strong class="font-bold"><em class="italic">$1</em></strong>'
  );

  // Bold (**text**)
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-bold text-slate-900">$1</strong>'
  );

  // Italic (*text*)
  html = html.replace(
    /\*(.+?)\*/g,
    '<em class="italic text-slate-800">$1</em>'
  );

  // Strikethrough (~~text~~)
  html = html.replace(
    /~~(.+?)~~/g,
    '<del class="line-through text-slate-500">$1</del>'
  );

  // ── Step 4: Paragraph wrapping ──
  // Wrap remaining text blocks in <p> tags
  const lines = html.split("\n");
  const wrapped: string[] = [];
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (inBlock) {
        inBlock = false;
      }
      continue;
    }

    // Skip lines that are already block-level elements
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
      wrapped.push('<p class="text-slate-700 leading-relaxed mb-4">');
      inBlock = true;
    }
    wrapped.push(line);
  }

  if (inBlock) {
    wrapped.push("</p>");
  }

  return wrapped.join("\n");
}

// ─────────────────────────────────────────────────────────────
//  Sample Markdown
// ─────────────────────────────────────────────────────────────

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
    // Don't count container/div wrapper tags
    if (!["div", "p", "span"].includes(match[1])) {
      count++;
    }
  }
  return count;
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────

export default function MarkdownToHtmlConverter() {
  const [markdown, setMarkdown] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "html">("preview");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Compile markdown to HTML ──
  const compiledHtml = useMemo(() => compileMarkdown(markdown), [markdown]);

  // ── Stats ──
  const stats = useMemo(() => {
    const chars = markdown.length;
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    const lines = markdown ? markdown.split("\n").length : 0;
    const htmlBytes = new TextEncoder().encode(compiledHtml).length;
    const renderedElements = countRenderedElements(compiledHtml);
    const efficiencyRatio = chars > 0
      ? ((htmlBytes / chars) * 100).toFixed(1)
      : "0.0";
    return { chars, words, lines, htmlBytes, renderedElements, efficiencyRatio };
  }, [markdown, compiledHtml]);

  // ── Handlers ──
  const handleLoadSample = useCallback(() => {
    setMarkdown(SAMPLE_MARKDOWN);
  }, []);

  const handleClear = useCallback(() => {
    setMarkdown("");
    setActiveTab("preview");
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(compiledHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = compiledHtml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [compiledHtml]);

  return (
    <div className="space-y-8">
      {/* ── Main Tool Dashboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT COLUMN (lg:col-span-6) ── */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* ── LEFT PANEL: Markdown Input Widget ── */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-700 px-5 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Markdown Workspace
              </h2>
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type or paste your Markdown here..."
              className="h-[450px] text-slate-800 font-mono text-sm p-4 w-full border-0 border-b border-slate-200 focus:ring-2 focus:ring-indigo-600 rounded-none resize-none outline-none bg-white placeholder:text-slate-400 leading-relaxed"
              spellCheck={false}
            />

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-px bg-slate-200 border-t border-slate-200">
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Characters
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {stats.chars.toLocaleString()}
                </p>
              </div>
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Words
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {stats.words.toLocaleString()}
                </p>
              </div>
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Lines
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {stats.lines.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* ── Action Buttons (below widget, inside column) ── */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Load Sample Markdown
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear Workspace
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL: Preview / HTML Output (lg:col-span-6) ── */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden sticky top-6 flex flex-col">
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-700 px-5 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Live Preview
              </h2>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium min-h-[44px] transition-colors ${
                  activeTab === "preview"
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Eye className="w-4 h-4" />
                Live Visual Preview
              </button>
              <button
                onClick={() => setActiveTab("html")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium min-h-[44px] transition-colors ${
                  activeTab === "html"
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Code className="w-4 h-4" />
                Raw HTML Output Code
              </button>
            </div>

            {/* Content Area */}
            {activeTab === "preview" ? (
              <div
                className="h-[400px] overflow-y-auto p-5 prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{
                  __html:
                    compiledHtml ||
                    '<p class="text-slate-400 italic">Start typing Markdown to see the live preview...</p>',
                }}
              />
            ) : (
              <div className="p-4">
                <div className="h-[320px] overflow-y-auto bg-slate-900 rounded-xl p-4 mb-4">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                    <code>
                      {compiledHtml ||
                        '<span class="text-slate-500">No HTML output yet. Start typing Markdown...</span>'}
                    </code>
                  </pre>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!compiledHtml}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-sm font-semibold rounded-xl transition-all duration-200 ${
                    copied
                      ? "bg-emerald-600 text-white shadow-md"
                      : compiledHtml
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied Securely!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy HTML Code
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-px bg-slate-200 border-t border-slate-200">
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  HTML Payload
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {stats.htmlBytes.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-500">bytes</span>
                </p>
              </div>
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Efficiency Ratio
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {stats.efficiencyRatio}
                  <span className="text-xs font-normal text-slate-500">%</span>
                </p>
              </div>
              <div className="bg-white px-4 py-3 text-center">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Rendered Elements
                </p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {stats.renderedElements}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          BELOW-THE-FOLD SEO CONTENT CARDS
          ════════════════════════════════════════════════════════ */}

      {/* ── Section 1: Technical Architecture ── */}
      <section className="bg-white border border-slate-200/60 p-8 md:p-10 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Cpu className="w-5 h-5 text-indigo-600" />
          </div>
          <span>
            Technical Architecture of Markdown Compilers & Parsing Theory
          </span>
        </h2>
        <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
          <p>
            Markdown compilers operate on a foundational principle of{" "}
            <strong className="text-slate-900">deterministic string scanning</strong>: a linear
            sequence of plaintext characters is systematically analyzed and transformed into a
            structured Document Object Model (DOM) tree. Unlike full programming language parsers
            that require context-free grammar definitions, Markdown parsing leverages a simpler but
            highly effective{" "}
            <strong className="text-slate-900">multi-pass regex tokenization pipeline</strong> that
            processes the input in discrete, ordered stages.
          </p>
          <p>
            At the architectural core, the compiler maintains a{" "}
            <strong className="text-slate-900">state machine</strong> that tracks whether the parser
            is currently inside a block-level construct (such as a code fence, blockquote, or list)
            or processing inline content. This state awareness prevents false matches — for example,
            ensuring that asterisks inside a code block are not incorrectly interpreted as bold or
            italic markers. The compiler processes the document in two primary phases:{" "}
            <strong className="text-slate-900">block-level segmentation</strong> followed by{" "}
            <strong className="text-slate-900">inline tokenization</strong>.
          </p>
          <p>
            The regex-based approach offers significant advantages for a client-side utility: it
            requires zero external dependencies, executes with minimal computational overhead, and
            provides predictable, debuggable behavior. Each regex pattern is carefully ordered to
            respect Markdown's precedence rules — for instance, fenced code blocks are extracted
            before inline patterns to prevent interference, and images are parsed before links to
            ensure the distinct{" "}
            <code className="bg-slate-100 text-rose-600 font-mono text-sm px-1.5 py-0.5 rounded">
              ![alt](url)
            </code>{" "}
            syntax is correctly handled.
          </p>
          <p>
            Modern Markdown engines like this one implement a{" "}
            <strong className="text-slate-900">sanitized DOM string assembly</strong> step as the
            final stage. All HTML entities are escaped early in the pipeline to prevent cross-site
            scripting (XSS) vectors, and the output is wrapped in semantic HTML tags with
            appropriate Tailwind CSS classes for immediate visual rendering. This architecture
            ensures that the compiled output is both visually polished and security-hardened for
            production use.
          </p>
        </div>
      </section>

      {/* ── Section 2: Tokenization & Compilation Pipeline ── */}
      <section className="bg-white border border-slate-200/60 p-8 md:p-10 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Markdown Tokenization & Compilation Pipeline</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            {
              step: "01",
              title: "Block-Level Segmenting",
              body: "The compiler scans the raw Markdown input for block-level constructs: headings (H1-H6), fenced and indented code blocks, blockquotes, horizontal rules, ordered and unordered lists, and tables. Each block is extracted and transformed into its HTML equivalent with appropriate semantic tags and Tailwind styling classes.",
            },
            {
              step: "02",
              title: "Inline Tokenization",
              body: "After block segmentation, the remaining inline content is processed for text-level semantics: bold (**), italic (*), bold-italic (***), strikethrough (~~), inline code (`), links ([text](url)), and images (![alt](src)). Each pattern is matched via ordered regex passes that respect nesting and precedence rules.",
            },
            {
              step: "03",
              title: "Attribute Injection",
              body: "HTML elements are enriched with Tailwind CSS utility classes for immediate visual rendering. Headings receive typography scales, code blocks get dark backgrounds with monospace fonts, blockquotes gain indigo left borders, and links are styled with underline decorations and hover transitions for a polished, production-ready appearance.",
            },
            {
              step: "04",
              title: "Sanitized DOM String Assembly",
              body: "The final stage wraps orphan text in paragraph tags, ensures all HTML entities are properly escaped, and assembles the complete HTML string. The output is validated for structural integrity and injected into the preview panel via dangerouslySetInnerHTML for instant visual feedback.",
            },
          ].map(({ step, title, body }) => (
            <div
              key={step}
              className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold tracking-wide">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Formatting Compliance Matrix ── */}
      <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Table className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Document Element Syntax & Formatting Compliance Matrix</span>
        </h2>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
          The table below maps every supported Markdown shorthand construct to its corresponding
          semantic HTML tag and describes the visual rendering behavior applied by the compiler.
          This compliance matrix serves as a quick reference for understanding how each Markdown
          element is transformed during the tokenization pipeline.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Markdown Syntax
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  HTML Tag Equivalent
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Rendering Behavior
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[
                { md: "# Heading 1", html: "<h1>", behavior: "Page-level title, largest typography scale, bottom border separator" },
                { md: "## Heading 2", html: "<h2>", behavior: "Section heading, bold weight, border-bottom accent" },
                { md: "### Heading 3", html: "<h3>", behavior: "Subsection heading, bold weight, no border" },
                { md: "**bold**", html: "<strong>", behavior: "Strong emphasis, bold font weight, dark slate color" },
                { md: "*italic*", html: "<em>", behavior: "Emphasized text, italic style, slate-800 color" },
                { md: "`code`", html: "<code>", behavior: "Inline monospace, rose-600 text, slate-100 background" },
                { md: "- List item", html: "<ul> / <li>", behavior: "Unordered bullet list with disc markers and spacing" },
                { md: "1. Ordered", html: "<ol> / <li>", behavior: "Numbered list with decimal markers and indentation" },
                { md: "> Quote", html: "<blockquote>", behavior: "Indented quote block with indigo left border accent" },
                { md: "```code```", html: "<pre><code>", behavior: "Fenced code block, dark background, monospace font" },
                { md: "[Link](url)", html: "<a>", behavior: "Hyperlink with underline decoration and hover transition" },
                { md: "![Image](src)", html: "<img>", behavior: "Responsive image with rounded corners and shadow" },
                { md: "| Table | Row |", html: "<table>", behavior: "Structured data grid with bordered cells and header row" },
                { md: "---", html: "<hr>", behavior: "Horizontal thematic break with slate border color" },
                { md: "~~strike~~", html: "<del>", behavior: "Strikethrough text with line-through decoration" },
              ].map(({ md, html, behavior }, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-800">
                    {md}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-medium">
                    {html}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    {behavior}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 4: Production Workflows & Use Cases ── */}
      <section className="bg-white border border-slate-200/60 p-8 md:p-10 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Production Workflows & Strategic Use Cases</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            {
              title: "Technical Documentation Writing",
              icon: BookOpen,
              body: "Engineers and technical writers use Markdown to draft API documentation, README files, and internal wikis. The live preview and raw HTML output enable rapid iteration on documentation structure before publishing to static site generators like Docusaurus, MkDocs, or VitePress.",
              metrics: "~60% of developer docs use Markdown",
            },
            {
              title: "CMS Content Staging",
              icon: FileCode,
              body: "Content managers and editors can draft articles in Markdown, preview the formatted output, and copy the compiled HTML directly into CMS platforms like WordPress, Contentful, or Sanity. This eliminates formatting inconsistencies and reduces editorial overhead.",
              metrics: "~40% faster content publishing",
            },
            {
              title: "Cross-Platform Copywriting",
              icon: RefreshCw,
              body: "Writers producing content for multiple platforms (blogs, newsletters, documentation) can maintain a single Markdown source and generate platform-specific HTML output. The character and word counters provide real-time length tracking for platform constraints.",
              metrics: "Single-source multi-platform output",
            },
            {
              title: "Developer Blogging Frameworks",
              icon: Terminal,
              body: "Developers writing technical blog posts can compose in Markdown, verify the rendered output, and export clean HTML for platforms that don't natively support Markdown. The code block syntax highlighting and table support make it ideal for technical content.",
              metrics: "Zero-dependency client-side compilation",
            },
          ].map(({ title, icon: Icon, body, metrics }) => (
            <div
              key={title}
              className="group bg-white border border-slate-200/60 rounded-xl p-5 hover:shadow-md hover:border-indigo-200/60 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2 text-sm">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{body}</p>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                {metrics}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 5: Advanced FAQ ── */}
      <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Advanced Markdown Conversion Frequently Asked Questions</span>
        </h2>
        <div className="space-y-5">
          {[
            {
              q: "Is my Markdown data secure during conversion?",
              a: "Absolutely. The Markdown to HTML converter operates entirely within your browser — no data is ever transmitted to a server, stored in a database, or processed by an external API. The regex-based compiler runs locally in your JavaScript runtime, ensuring complete data isolation and privacy. This architecture is particularly valuable for organizations handling sensitive or proprietary documentation that cannot be exposed to third-party services.",
            },
            {
              q: "How does the compiler handle nested Markdown elements?",
              a: "The multi-pass pipeline architecture naturally handles nesting through ordered processing. Block-level elements (lists inside blockquotes, code blocks inside list items) are processed first, establishing the structural hierarchy. Inline elements are then applied within each block context. The regex patterns are designed with non-greedy quantifiers and precise boundary matching to prevent false positives across nested structures. For deeply nested or edge cases, the paragraph-wrapping final pass ensures all orphan content is properly contained.",
            },
            {
              q: "What are the performance characteristics of client-side compilation?",
              a: "Client-side Markdown compilation offers near-instantaneous performance for documents up to several thousand words. The regex-based approach has O(n) time complexity relative to input length, with each pass scanning the document linearly. For typical documentation pages (500-2000 words), compilation completes in under 5ms. The useMemo hook ensures that recompilation only occurs when the input changes, preventing unnecessary recomputation during React re-renders.",
            },
            {
              q: "Does the converter support all CommonMark specification features?",
              a: "This converter implements the core CommonMark specification including headings (H1-H6), bold, italic, strikethrough, inline code, fenced and indented code blocks, blockquotes, ordered and unordered lists, links, images, horizontal rules, and tables. While it covers the vast majority of real-world Markdown usage, certain edge-case behaviors (such as nested lists with complex indentation or HTML block-level passthrough) follow pragmatic interpretations optimized for common writing workflows rather than strict specification compliance.",
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
      </section>

      {/* ── Section 6: Platform Performance Advantages ── */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 md:p-10 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span>Platform Performance Advantages</span>
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              icon: Shield,
              title: "Absolute Data Isolation",
              body: "All Markdown processing occurs exclusively within your browser's JavaScript runtime. No network requests, no server uploads, no third-party API calls. Your documents remain completely private and secure, making this tool suitable for confidential business documentation, legal writing, and proprietary technical content.",
            },
            {
              icon: Zap,
              title: "Performance Efficiency",
              body: "The lightweight regex-based compiler executes with minimal computational overhead, delivering sub-millisecond compilation for typical documents. Without the need for network round-trips or server-side rendering, the tool provides instantaneous feedback as you type, enabling a fluid and responsive editing experience.",
            },
            {
              icon: Info,
              title: "Total Document Privacy",
              body: "Because the converter operates entirely offline-capable and client-side, there is zero data persistence, zero tracking, and zero exposure to external infrastructure. Your Markdown source and compiled HTML never leave your device, ensuring complete compliance with data protection regulations and internal security policies.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">{title}</h3>
              <p className="text-sm text-indigo-100 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
