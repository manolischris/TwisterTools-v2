"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  Copy,
  Check,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  Eraser,
  Type,
  FileCode2,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Zap,
  Sliders,
  Maximize2,
  Minimize2,
} from "lucide-react";

export default function OnlineTextEditor() {
  // ── States ──
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>(
    "<h2>Welcome to TwisterTools Rich Text Editor!</h2><p>This is a <strong>powerful</strong>, <em>client-side</em> rich text formatting sandbox. You can craft articles, format documentation, clean up HTML, or calculate word and character counts in real-time.</p><ul><li>Full WYSIWYG editing capabilities</li><li>Instant HTML code generation</li><li>Clean formatting & text case transformations</li><li>100% private — zero server uploads</li></ul>"
  );
  const [activeTab, setActiveTab] = useState<"visual" | "html">("visual");
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    charsNoSpaces: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: 0,
  });

  // ── Sync Editor Content on Mount & Dynamic Updates ──
  useEffect(() => {
    if (editorRef.current && activeTab === "visual") {
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [activeTab]);

  // ── Calculate Text Metrics ──
  const calculateMetrics = useCallback((html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.innerText || tempDiv.textContent || "";

    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter(Boolean).length : 0;
    const paragraphs = html
      .split(/<\/p>|<br\s*\/?>/i)
      .filter((p) => p.replace(/<[^>]*>/g, "").trim().length > 0).length;
    const readingTime = Math.ceil(words / 200);

    setStats({
      words,
      chars,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingTime,
    });
  }, []);

  useEffect(() => {
    calculateMetrics(htmlContent);
  }, [htmlContent, calculateMetrics]);

  // ── Execute ExecCommand Actions ──
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setHtmlContent(newHtml);
      calculateMetrics(newHtml);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setHtmlContent(newHtml);
      calculateMetrics(newHtml);
    }
  };

  // ── Helper Formatting Functions ──
  const addLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) execCmd("createLink", url);
  };

  const clearFormatting = () => {
    execCmd("removeFormat");
  };

  const transformCase = (type: "upper" | "lower" | "title" | "sentence") => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    let text = tempDiv.innerText || tempDiv.textContent || "";

    if (type === "upper") text = text.toUpperCase();
    if (type === "lower") text = text.toLowerCase();
    if (type === "title") {
      text = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
    if (type === "sentence") {
      text = text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());
    }

    const formattedHtml = `<p>${text.replace(/\n/g, "</p><p>")}</p>`;
    setHtmlContent(formattedHtml);
    if (editorRef.current && activeTab === "visual") {
      editorRef.current.innerHTML = formattedHtml;
    }
  };

  // ── File Handlers ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
        setHtmlContent(content);
        if (editorRef.current) editorRef.current.innerHTML = content;
      } else {
        const paragraphs = content
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => `<p>${line}</p>`)
          .join("");
        setHtmlContent(paragraphs);
        if (editorRef.current) editorRef.current.innerHTML = paragraphs;
      }
    };
    reader.readAsText(file);
  };

  const downloadFile = (format: "html" | "txt") => {
    let content = htmlContent;
    let mime = "text/html";
    let ext = "html";

    if (format === "txt") {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      content = tempDiv.innerText || tempDiv.textContent || "";
      mime = "text/plain";
      ext = "txt";
    }

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `document.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      const text = activeTab === "html" ? htmlContent : tempDiv.innerText || tempDiv.textContent || "";
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent catch */
    }
  };

  const loadSample = () => {
    const sample = `<h2>Mastering Rich Text Formatting</h2><p>Online text editors provide seamless layout controls without demanding complex desktop applications.</p><h3>Key Architectural Benefits:</h3><ul><li><strong>Portability:</strong> Works across any modern browser.</li><li><mark>Instant Output:</mark> Switch seamlessly between Visual & HTML source code views.</li><li><em>Zero Latency:</em> Operates 100% locally on your browser.</li></ul><blockquote>"Simplicity is key to efficient document engineering."</blockquote>`;
    setHtmlContent(sample);
    if (editorRef.current && activeTab === "visual") {
      editorRef.current.innerHTML = sample;
    }
  };

  const clearWorkspace = () => {
    setHtmlContent("");
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  return (
    <div className="w-full space-y-8">
      {/* ── Main Workspace Grid (50/50 Split) ── */}
      <div className={`grid ${isFullScreen ? "fixed inset-4 z-50 bg-slate-900 p-6 rounded-2xl shadow-2xl overflow-y-auto" : "lg:grid-cols-[3fr_2fr]"} gap-6 items-start`}>

        {/* ══════════════════ LEFT PANEL: EDITOR CONTROLS & VISUAL WORKSPACE ══════════════════ */}
        <div className="space-y-4 w-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-200" />
                </div>
                <span className="text-sm font-semibold">Rich Text Workspace</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-200"
                  title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1 items-center">
              <button onClick={() => execCmd("bold")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Bold"><Bold className="w-4 h-4" /></button>
              <button onClick={() => execCmd("italic")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Italic"><Italic className="w-4 h-4" /></button>
              <button onClick={() => execCmd("underline")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Underline"><Underline className="w-4 h-4" /></button>
              <button onClick={() => execCmd("strikeThrough")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Strikethrough"><Strikethrough className="w-4 h-4" /></button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button onClick={() => execCmd("formatBlock", "<h1>")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
              <button onClick={() => execCmd("formatBlock", "<h2>")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
              <button onClick={() => execCmd("formatBlock", "<h3>")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Heading 3"><Heading3 className="w-4 h-4" /></button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button onClick={() => execCmd("justifyLeft")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Align Left"><AlignLeft className="w-4 h-4" /></button>
              <button onClick={() => execCmd("justifyCenter")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Align Center"><AlignCenter className="w-4 h-4" /></button>
              <button onClick={() => execCmd("justifyRight")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Align Right"><AlignRight className="w-4 h-4" /></button>
              <button onClick={() => execCmd("justifyFull")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Justify"><AlignJustify className="w-4 h-4" /></button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button onClick={() => execCmd("insertUnorderedList")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Bullet List"><List className="w-4 h-4" /></button>
              <button onClick={() => execCmd("insertOrderedList")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
              <button onClick={() => execCmd("formatBlock", "<blockquote>")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Quote"><Quote className="w-4 h-4" /></button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button onClick={addLink} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Add Link"><LinkIcon className="w-4 h-4" /></button>
              <button onClick={() => execCmd("unlink")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Remove Link"><Unlink className="w-4 h-4" /></button>
              <button onClick={clearFormatting} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Clear Formatting"><Eraser className="w-4 h-4" /></button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <button onClick={() => execCmd("undo")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Undo"><Undo className="w-4 h-4" /></button>
              <button onClick={() => execCmd("redo")} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="Redo"><Redo className="w-4 h-4" /></button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border-b border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab("visual")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "visual" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Type className="w-3.5 h-3.5" /> Visual Editor
              </button>
              <button
                onClick={() => setActiveTab("html")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "html" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <FileCode2 className="w-3.5 h-3.5" /> HTML Source Code
              </button>
            </div>

            {/* Editing Box */}
            <div className="p-4">
              {activeTab === "visual" ? (
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  className="w-full h-[450px] p-4 bg-white text-slate-800 border border-slate-200 rounded-xl overflow-y-auto focus:outline-none focus:ring-2 focus:ring-indigo-600 prose prose-slate max-w-none"
                />
              ) : (
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full h-[450px] font-mono text-sm p-4 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              )}
            </div>

            {/* Control Bar Below Canvas */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={loadSample}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-semibold rounded-xl transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" /> Sample Text
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                <Upload className="w-3.5 h-3.5" /> Upload File
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.html,.htm" className="hidden" />
              <button
                onClick={clearWorkspace}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: UTILITIES & ANALYTICS ══════════════════ */}
        <div className="space-y-4 w-full">
          {/* Real-Time Metrics Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">Real-Time Text Analytics</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Words</p>
                  <p className="text-lg font-mono font-bold text-slate-800">{stats.words.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Characters</p>
                  <p className="text-lg font-mono font-bold text-slate-800">{stats.chars.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">No Spaces</p>
                  <p className="text-lg font-mono font-bold text-slate-800">{stats.charsNoSpaces.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Sentences</p>
                  <p className="text-lg font-mono font-bold text-slate-800">{stats.sentences.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Paragraphs</p>
                  <p className="text-lg font-mono font-bold text-slate-800">{stats.paragraphs.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Est. Read Time</p>
                  <p className="text-lg font-mono font-bold text-indigo-600">{stats.readingTime} min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rapid Transformations Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" /> Case & Format Transformations
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => transformCase("upper")}
                className="py-2.5 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200 text-xs font-medium rounded-xl transition-all"
              >
                UPPERCASE
              </button>
              <button
                onClick={() => transformCase("lower")}
                className="py-2.5 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200 text-xs font-medium rounded-xl transition-all"
              >
                lowercase
              </button>
              <button
                onClick={() => transformCase("title")}
                className="py-2.5 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200 text-xs font-medium rounded-xl transition-all"
              >
                Title Case
              </button>
              <button
                onClick={() => transformCase("sentence")}
                className="py-2.5 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200 text-xs font-medium rounded-xl transition-all"
              >
                Sentence case
              </button>
            </div>
          </div>

          {/* Export Options Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" /> Export Options
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => downloadFile("html")}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-md transition-all"
              >
                <Code className="w-4 h-4" /> Download .HTML
              </button>
              <button
                onClick={() => downloadFile("txt")}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-md transition-all"
              >
                <FileText className="w-4 h-4" /> Download .TXT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO CONTENT & TECHNICAL PROSE
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        {/* Card 1: Comprehensive Online Text Processing */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Comprehensive Browser-Based Text Editing & Formatting</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The TwisterTools Online Text Editor provides a rich, web-based sandbox for crafting, cleaning, and converting structured text. Built on native browser APIs, it combines WYSIWYG visual editing with raw HTML code views, offering a seamless workspace for content writers, web developers, copywriters, and markdown enthusiasts alike.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Whether you need to quickly strip unwanted formatting from copied text, draft blog posts with clean HTML tags, or perform instant text transformations, our rich text sandbox runs completely within your browser, ensuring maximum responsiveness and complete client-side data privacy.
          </p>
        </div>

        {/* Card 2: Core Engineering Capabilities */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Core Engineering & Text Processing Capabilities</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-800 text-sm">Dual-Mode Visual & HTML Workspace</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Seamlessly toggle between styled visual preview and pure HTML source code. Edit content in visual mode or refine structured tags directly in code mode without layout shift or data loss.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-800 text-sm">Real-Time Analytical Engine</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Monitor key writing metrics dynamically, including total word counts, character lengths (with and without spaces), sentence structures, paragraph counts, and estimated reading time.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-800 text-sm">Instant Case Transformations</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Transform entire documents between UPPERCASE, lowercase, Title Case, and Sentence case with a single click, automating tedious copy-editing workflows.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-800 text-sm">Clean Export Options</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Export processed text instantly as standard plain text (.txt) files or fully structured web documents (.html), preserving heading hierarchies and list structures.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Frequently Asked Questions (Static Cards) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-1">Is my document text saved on external servers?</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                No. All text formatting, metrics calculation, and file conversions occur entirely within your web browser using client-side JavaScript. Your text is never sent across a network or stored on server databases.
              </p>
            </div>
            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-1">Can I copy and paste directly from Microsoft Word or Google Docs?</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Yes. You can paste styled content directly into the Visual Editor. Use the "Clear Formatting" utility to strip embedded inline CSS or inline web styles if clean HTML output is required.
              </p>
            </div>
            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-1">How is reading time calculated?</h3>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Estimated reading time is calculated using standard industry benchmarks, assuming an average reading speed of 200 words per minute across general prose documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Online Text Editor & Rich Formatting Sandbox",
            url: "https://www.twistertools.com/tools/text-tools/online-text-editor",
            applicationCategory: "UtilityApplication",
            operatingSystem: "All",
            description: "Free online rich text editor and HTML sandbox. Format text, edit raw HTML source code, count words and characters, and transform cases in real-time.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
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
                name: "Is my document text saved on external servers?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. All text formatting, metrics calculation, and file conversions occur entirely within your web browser using client-side JavaScript.",
                },
              },
              {
                "@type": "Question",
                name: "Can I copy and paste directly from Microsoft Word or Google Docs?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. You can paste styled content directly into the Visual Editor.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}