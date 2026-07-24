"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Type,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Sparkles,
  Zap,
  Shield,
  HelpCircle,
  Cpu,
  Table,
  Layers,
  FileText,
  Sliders,
  CheckCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Unicode Small Text Transformation Engine
//  100% Client-Side Pure TypeScript Translation Maps
// ─────────────────────────────────────────────────────────────

// Standard Character Set Base
const CHARS_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHARS_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARS_NUMS = "0123456789";

// Small Caps Map (A-Z standard, lowercase maps to small caps)
const SMALL_CAPS_MAP: Record<string, string> = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ",
  j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ",
  s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
  A: "ᴀ", B: "ʙ", C: "ᴄ", D: "ᴅ", E: "ᴇ", F: "ꜰ", G: "ɢ", H: "ʜ", I: "ɪ",
  J: "ᴊ", K: "ᴋ", L: "ʟ", M: "ᴍ", N: "ɴ", O: "ᴏ", P: "ᴘ", Q: "ǫ", R: "ʀ",
  S: "ꜱ", T: "ᴛ", U: "ᴜ", V: "ᴠ", W: "ᴡ", X: "x", Y: "ʏ", Z: "ᴢ"
};

// Superscript Map
const SUPERSCRIPT_MAP: Record<string, string> = {
  a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ",
  j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ", q: "ᑫ", r: "ʳ",
  s: "ˢ", t: "ᵗ", u: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
  A: "ᴬ", B: "ᴮ", C: "ᶜ", D: "ᴰ", E: "ᴱ", F: "ᶠ", G: "ᴳ", H: "ᴴ", I: "ᴵ",
  J: "ᴶ", K: "ᴷ", L: "ᴸ", M: "ᴹ", N: "ᴺ", O: "ᴼ", P: "ᴾ", Q: "Q", R: "ᴿ",
  S: "ˢ", T: "ᵀ", U: "ᵁ", V: "ⱽ", W: "ᵂ", X: "ˣ", Y: "ʸ", Z: "ᶻ",
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾"
};

// Subscript Map
const SUBSCRIPT_MAP: Record<string, string> = {
  a: "ₐ", b: "♭", c: "꜀", d: "ᑯ", e: "ₑ", f: "բ", g: "₉", h: "ₕ", i: "ᵢ",
  j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ", p: "ₚ", q: "૧", r: "ᵣ",
  s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", w: "w", x: "ₓ", y: "ᵧ", z: "z",
  A: "ₐ", B: "ₑ", C: "꜀", D: "ᴰ", E: "ₑ", F: "բ", G: "₉", H: "ₕ", I: "ᵢ",
  J: "ⱼ", K: "ₖ", L: "ₗ", M: "ₘ", N: "ₙ", O: "ₒ", P: "ₚ", Q: "૧", R: "ᵣ",
  S: "ₛ", T: "ₜ", U: "ᵤ", V: "ᵥ", W: "w", X: "ₓ", Y: "ᵧ", Z: "z",
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎"
};

// Monospace / Code Font Map
const MONOSPACE_MAP: Record<string, string> = {
  a: "𝚊", b: "𝚋", c: "𝚌", d: "𝚍", e: "𝚎", f: "𝚏", g: "𝚐", h: "𝚑", i: "𝚒",
  j: "𝚓", k: "𝚔", l: "𝚕", m: "𝚖", n: "𝚗", o: "𝚘", p: "𝚙", q: "𝚚", r: "𝚛",
  s: "𝚜", t: "𝚝", u: "𝚞", v: "𝚟", w: "𝚠", x: "𝚡", y: "𝚢", z: "𝚣",
  A: "𝙰", B: "𝙱", C: "𝙲", D: "𝙳", E: "𝙴", F: "𝙵", G: "𝙶", H: "𝙷", I: "𝙸",
  J: "𝙹", K: "𝙺", L: "𝙻", M: "𝙼", N: "𝙽", O: "𝙾", P: "𝙿", Q: "𝚀", R: "𝚁",
  S: "𝚂", T: "𝚃", U: "𝚄", V: "𝚅", W: "𝚆", X: "𝚇", Y: "𝚈", Z: "𝚈",
  "0": "𝟶", "1": "𝟷", "2": "𝟸", "3": "𝟹", "4": "𝟺", "5": "𝟻", "6": "𝟼", "7": "𝟽", "8": "𝟾", "9": "𝟿"
};

// Bubble / Circled Text Map
const BUBBLE_MAP: Record<string, string> = {
  a: "ⓐ", b: "ⓑ", c: "ⓒ", d: "ⓓ", e: "ⓔ", f: "ⓕ", g: "ⓖ", h: "ⓗ", i: "ⓘ",
  j: "ⓙ", k: "ⓚ", l: "ⓛ", m: "ⓜ", n: "ⓝ", o: "ⓞ", p: "ⓟ", q: "ⓠ", r: "ⓡ",
  s: "ⓢ", t: "ⓣ", u: "ⓤ", v: "⓯", w: "ⓦ", x: "ⓧ", y: "ⓨ", z: "ⓩ",
  A: "Ⓐ", B: "Ⓑ", C: "Ⓒ", D: "Ⓓ", E: "Ⓔ", F: "Ⓕ", G: "Ⓖ", H: "Ⓗ", I: "Ⓘ",
  J: "Ⓙ", K: "Ⓚ", L: "Ⓛ", M: "Ⓜ", N: "Ⓝ", O: "Ⓞ", P: "Ⓟ", Q: "Ⓠ", R: "Ⓡ",
  S: "Ⓢ", T: "Ⓣ", U: "Ⓤ", V: "Ⓥ", W: "Ⓦ", X: "Ⓧ", Y: "Ⓨ", Z: "Ⓩ",
  "0": "⓪", "1": "①", "2": "②", "3": "③", "4": "④", "5": "⑤", "6": "⑥", "7": "⑦", "8": "⑧", "9": "⑨"
};

// Gothic / Fraktur Map
const GOTHIC_MAP: Record<string, string> = {
  a: "𝖆", b: "𝖇", c: "𝖈", d: "𝖉", e: "𝖊", f: "𝖋", g: "𝖌", h: "𝖍", i: "𝖎",
  j: "𝖄", k: "𝖐", l: "𝖑", m: "𝖒", n: "𝖓", o: "𝖔", p: "𝖕", q: "𝖖", r: "𝖗",
  s: "𝖘", t: "𝖙", u: "𝖚", v: "𝖛", w: "𝖜", x: "𝖞", y: "𝖞", z: "𝖟",
  A: "𝕬", B: "𝕱", C: "𝕮", D: "𝕯", E: "𝕰", F: "𝕱", G: "kd", H: " any", I: "𝕴",
  J: "𝕵", K: "𝕶", L: "𝕷", M: "𝕸", N: "𝕹", O: "𝕺", P: "𝕻", Q: "𝕼", R: "𝕽",
  S: "𝕾", T: "𝕿", U: "𝖀", V: "𝖁", W: "𝖂", X: "𝖃", Y: "𝖄", Z: "𝖏"
};

// Cursive / Script Map
const SCRIPT_MAP: Record<string, string> = {
  a: "𝒶", b: "𝒷", c: "𝒸", d: "𝒹", e: "ℯ", f: "𝒻", g: "ℊ", h: "𝒽", i: "𝒾",
  j: "𝒿", k: "𝓀", l: "𝓁", m: "𝓂", n: "𝓃", o: "ℴ", p: "𝓅", q: "𝓆", r: "𝓇",
  s: "𝓈", t: "𝓉", u: "𝓊", v: "𝓋", w: "𝓌", x: "𝓍", y: "𝓎", z: "𝓏",
  A: "𝒜", B: "ℬ", C: "𝒞", D: "𝒟", E: "ℰ", F: "ℱ", G: "𝒢", H: "ℋ", I: "ℐ",
  J: "𝒥", K: "𝒦", L: "ℒ", M: "ℳ", N: "𝒩", O: "𝒪", P: "𝒫", Q: "𝒬", R: "ℛ",
  S: "𝒮", T: "𝒯", U: "𝒰", V: "𝒱", W: "𝒲", X: "𝒳", Y: "𝒴", Z: "𝒵"
};

/**
 * Universal text transformation processor
 */
function transformText(text: string, map: Record<string, string>): string {
  if (!text) return "";
  return text
    .split("")
    .map((char) => map[char] || char)
    .join("");
}

const SAMPLE_TEXT = "TwisterTools 2.0 Small Text Generator & Unicode Styler!";

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────

export default function SmallTextGenerator() {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Transform Input Text Across All Styles ──
  const transformedOutputs = useMemo(() => {
    const text = inputText.trim() ? inputText : SAMPLE_TEXT;

    return [
      {
        id: "small-caps",
        name: "Small Caps (ᴀʙᴄ)",
        description: "Capital letter structures scaled to lowercase height",
        badge: "Most Popular",
        value: transformText(text, SMALL_CAPS_MAP),
      },
      {
        id: "superscript",
        name: "Superscript (ᵃᵇᶜ)",
        description: "Elevated micro-text positioned above line baseline",
        badge: "Compact",
        value: transformText(text, SUPERSCRIPT_MAP),
      },
      {
        id: "subscript",
        name: "Subscript (ₐ♭꜀)",
        description: "Lowered micro-text positioned below line baseline",
        badge: "Technical",
        value: transformText(text, SUBSCRIPT_MAP),
      },
      {
        id: "monospace",
        name: "Monospace Code (𝚊𝚋𝚌)",
        description: "Fixed-width typewriter aesthetic glyphs",
        badge: "Developer",
        value: transformText(text, MONOSPACE_MAP),
      },
      {
        id: "bubble",
        name: "Circled Bubble (ⓐⓑⓒ)",
        description: "Encapsulated circular outline glyphs",
        badge: "Social Media",
        value: transformText(text, BUBBLE_MAP),
      },
      {
        id: "script",
        name: "Cursive Script (𝒶𝒷𝒸)",
        description: "Flowing calligraphic handwritten letterforms",
        badge: "Elegant",
        value: transformText(text, SCRIPT_MAP),
      },
      {
        id: "gothic",
        name: "Gothic Fraktur (𝖆𝖇𝖈)",
        description: "Traditional dark medieval typeface accents",
        badge: "Stylized",
        value: transformText(text, GOTHIC_MAP),
      },
    ];
  }, [inputText]);

  // ── Metrics ──
  const stats = useMemo(() => {
    const chars = inputText.length;
    const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    const bytes = new TextEncoder().encode(inputText).length;
    return { chars, words, bytes };
  }, [inputText]);

  // ── Clipboard Handler ──
  const handleCopy = useCallback((textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleClear = useCallback(() => {
    setInputText("");
  }, []);

  const handleLoadSample = useCallback(() => {
    setInputText(SAMPLE_TEXT);
  }, []);

  return (
    <div className="w-full space-y-8">

      {/* ── Workspace 50/50 Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ══════════════════ LEFT PANEL: Input ══════════════════ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
          {/* Control Header */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <label htmlFor="small-text-input" className="text-sm font-semibold text-slate-900 cursor-pointer">
                Source Text Input
              </label>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {stats.chars} chars | {stats.words} words
            </span>
          </div>

          <div className="p-5 flex flex-col flex-1 space-y-4">
            <textarea
              id="small-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste your text here to convert into small text styles..."
              className="w-full flex-1 min-h-[300px] p-4 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none resize-none font-sans text-base leading-relaxed placeholder:text-slate-400"
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" />
                Load Sample Text
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!inputText}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Clear Input
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: Unicode Styles Output ══════════════════ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/20">
                <Sliders className="w-4 h-4 text-indigo-200" />
              </div>
              <span className="text-sm font-semibold">Real-Time Styled Outputs</span>
            </div>
            <span className="text-xs text-white/70 font-medium">
              Click any card to copy
            </span>
          </div>

          <div className="p-5 flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {transformedOutputs.map((style) => {
                const isCopied = copiedId === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => handleCopy(style.value, style.id)}
                    className="group relative bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-none hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                        {style.name}
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-normal">
                          {style.badge}
                        </span>
                      </span>
                      <button
                        type="button"
                        className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                          isCopied
                            ? "bg-green-600 text-white"
                            : "bg-indigo-600 group-hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-base text-slate-900 font-normal break-words leading-relaxed select-all">
                      {style.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT CARDS
      ───────────────────────────────────────────────────────────── */}

      {/* Card 1: Technical Architecture */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Cpu className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Technical Architecture of Unicode Character Transformation</span>
        </h2>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
          The Unicode Standard is an international encoding architecture designed to represent text across modern software platforms. Rather than altering CSS styling parameters or relying on web fonts, small text generators operate by re-mapping standard ASCII characters to distinct high-order Unicode code points within specified glyph blocks.
        </p>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
          Small Caps glyphs belong primarily to the <strong>Latin Extended-D</strong> and <strong>Phonetic Extensions</strong> blocks, where capital character shapes are drawn within lowercase baseline boundaries. Superscript and Subscript characters derive from dedicated mathematical and subscript/superscript character blocks (U+2070–U+209C). Because these symbols exist as independent Unicode characters, they can be copied into plain-text environments including social media profiles, chat apps, and document metadata.
        </p>
      </div>

      {/* Card 2: Functional Mapping Pipeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <span>The Character Translation & Rendering Pipeline</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              step: "1",
              title: "String Decomposition",
              body: "The raw input string is parsed into individual grapheme clusters and mapped against standard ASCII code points.",
            },
            {
              step: "2",
              title: "Dictionary Re-mapping",
              body: "Each input character triggers a lookup in the selected Unicode translation matrix (e.g., Small Caps, Superscript, Subscript).",
            },
            {
              step: "3",
              title: "Fallback Preservation",
              body: "Characters without exact Unicode small text equivalents (such as punctuation or special accents) are preserved in their original form.",
            },
            {
              step: "4",
              title: "Grapheme Assembly",
              body: "The transformed Unicode character stream is reassembled into a single text output ready for instant clipboard duplication.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm mb-1">{item.title}</h3>
                  <p className="text-slate-700 text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Unicode Character Mapping Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Table className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Unicode Style Mapping Reference</span>
        </h2>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
          The table below illustrates how standard ASCII characters are mapped across different Unicode character sets within our conversion engine:
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-800 text-white font-semibold">
              <tr>
                <th className="p-3">Standard Input</th>
                <th className="p-3">Small Caps</th>
                <th className="p-3">Superscript</th>
                <th className="p-3">Subscript</th>
                <th className="p-3">Monospace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-indigo-600">hello world</td>
                <td className="p-3">ʜᴇʟʟᴏ ᴡᴏʀʟᴅ</td>
                <td className="p-3">ʰᵉˡˡᵒ ʷᵒʳˡᵈ</td>
                <td className="p-3">ₕₑₗₗₒ wₒᵣₗᑯ</td>
                <td className="p-3">𝚑𝚎𝚕𝚕𝚘 𝚠𝚘𝚛𝚕𝚍</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-indigo-600">12345</td>
                <td className="p-3">12345</td>
                <td className="p-3">¹²³⁴⁵</td>
                <td className="p-3">₁₂₃₄₅</td>
                <td className="p-3">𝟷𝟸𝟹𝟺𝟻</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-indigo-600">twistertools</td>
                <td className="p-3">ᴛᴡɪꜱᴛᴇʀᴛᴏᴏʟꜱ</td>
                <td className="p-3">ᵗʷⁱˢᵗᵉʳᵗᵒᵒˡˢ</td>
                <td className="p-3">ₜwᵢₛₜₑᵣₜₒₒₗₛ</td>
                <td className="p-3">𝚝𝚠𝚒𝚜𝚝𝚎𝚛𝚝𝚘𝚘𝚕𝚜</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 4: Practical Use Cases */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Popular Use Cases for Unicode Small Text</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm">Social Media Bios</h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              Stand out on Instagram, Twitter (X), TikTok, and Discord with customized bios and profile descriptions that render across mobile apps.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm">Mathematical Expressions</h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              Generate proper superscripts and subscripts for algebraic variables, exponents, chemical formulas (e.g., H₂O), and statistical notes.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm">Typography & Design</h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              Add small caps headers or stylized subtext to plain-text emails, forum posts, blog comments, and markdown documents.
            </p>
          </div>
        </div>
      </div>

      {/* Card 5: Static FAQ Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Frequently Asked Questions</span>
        </h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-1">
              Why do some small text characters look slightly different?
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              Not all letters have native Unicode small versions created for the exact same historical purpose. Small Caps borrow glyphs from phonetic and extended Latin blocks, which may render with subtle variations depending on your device font.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-1">
              Will small text work on all devices and platforms?
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              Yes! Because the generated small text consists of standard Unicode characters rather than rich text formatting, it works on modern operating systems including iOS, Android, Windows, and macOS.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-1">
              Is my input data kept private?
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              All text processing happens 100% locally in your browser using pure client-side JavaScript. No text is sent to any server or external service.
            </p>
          </div>
        </div>
      </div>

      {/* Card 6: Performance & Privacy */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Client-Side Security & Zero Latency</span>
        </h2>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
          TwisterTools small text generator provides instant, client-side execution. With zero network round-trips, text transformations occur in real time as you type, giving you maximum privacy and optimal performance.
        </p>
      </div>

      {/* Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Small Text Generator",
            applicationCategory: "UtilityApplication",
            operatingSystem: "All",
            description: "Convert standard text into Unicode Small Caps, Superscript, Subscript, and stylized fonts instantly.",
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
                name: "Why do some small text characters look slightly different?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Small Caps borrow glyphs from phonetic and extended Latin blocks in the Unicode standard, which may render with subtle variations depending on your device system fonts.",
                },
              },
              {
                "@type": "Question",
                name: "Will small text work on all devices and platforms?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. The output consists of valid Unicode characters that render natively across modern web browsers, mobile apps, and social media platforms.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}