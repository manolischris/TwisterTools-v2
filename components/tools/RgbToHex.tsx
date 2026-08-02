"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Palette,
  Copy,
  Check,
  RefreshCw,
  Pipette,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Zap,
  Sliders,
  Code,
  Info,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Pure Helper Functions for Color Conversions & Calculations
// ─────────────────────────────────────────────────────────────

interface ColorState {
  r: number;
  g: number;
  b: number;
  a: number; // 0 to 1
  hex: string;
}

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

function componentToHex(c: number): string {
  const hex = clamp(Math.round(c), 0, 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number, a = 1): string {
  const hexR = componentToHex(r);
  const hexG = componentToHex(g);
  const hexB = componentToHex(b);
  if (a < 1) {
    const hexA = componentToHex(Math.round(a * 255));
    return `#${hexR}${hexG}${hexB}${hexA}`.toUpperCase();
  }
  return `#${hexR}${hexG}${hexB}`.toUpperCase();
}

function hexToRgb(hexStr: string): { r: number; g: number; b: number; a: number } | null {
  let hex = hexStr.trim().replace(/^#/, "");

  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b, a: 1 };
  }

  if (hex.length === 8) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const aVal = parseInt(hex.substring(6, 8), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(aVal)) return null;
    return { r, g, b, a: parseFloat((aVal / 255).toFixed(2)) };
  }

  return null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    const val = v / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(r: number, g: number, b: number): { white: number; black: number } {
  const lum = getLuminance(r, g, b);
  const ratioWhite = (1.05) / (lum + 0.05);
  const ratioBlack = (lum + 0.05) / 0.05;
  return {
    white: parseFloat(ratioWhite.toFixed(2)),
    black: parseFloat(ratioBlack.toFixed(2)),
  };
}

const FAQS = [
  {
    q: "What is the primary difference between Hex and RGB color formats?",
    a: "Hex (Hexadecimal) uses a 6-character or 8-character base-16 string (e.g., #4F46E5) representing Red, Green, Blue, and optional Alpha channels. RGB specifies color values as integers from 0 to 255 (e.g., rgb(79, 70, 229)). Both represent the same additive color space, but Hex is more compact for CSS, while RGB is often easier to adjust procedurally.",
  },
  {
    q: "Does this converter support Alpha channels (RGBA and Hex with opacity)?",
    a: "Yes! Our conversion engine fully supports 8-digit Hex values (#RRGGBBAA) and RGBA notation. When adjusting the opacity slider or entering an alpha component, the generated output instantly synchronizes across Hex, RGBA, HSL, and CSS variable formats.",
  },
  {
    q: "How does the EyeDropper color picker tool work?",
    a: "The EyeDropper button leverages the native browser EyeDropper API (supported in Chromium-based browsers like Chrome, Edge, and Opera). Clicking it allows you to pick any exact color pixel directly from your desktop or active browser screen.",
  },
  {
    q: "Is any color data or image uploaded to an external server?",
    a: "No. TwisterTools operates with a 100% client-side execution architecture. All conversions, calculations, matrix transformations, and eye-dropper samples execute locally inside your browser's JavaScript runtime engine.",
  },
];

export default function RgbToHex() {
  const [color, setColor] = useState<ColorState>({
    r: 79,
    g: 70,
    b: 229,
    a: 1,
    hex: "#4F46E5",
  });

  const [hexInput, setHexInput] = useState("#4F46E5");
  const [hexError, setHexError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Track EyeDropper API availability after hydration to prevent SSR/CSR mismatch
  const [hasEyeDropper, setHasEyeDropper] = useState(false);

  useEffect(() => {
    setHasEyeDropper("EyeDropper" in window);
  }, []);

  // Sync state when RGB sliders / numerical inputs change
  const handleRgbChange = (key: "r" | "g" | "b" | "a", value: number) => {
    const nextR = key === "r" ? clamp(value, 0, 255) : color.r;
    const nextG = key === "g" ? clamp(value, 0, 255) : color.g;
    const nextB = key === "b" ? clamp(value, 0, 255) : color.b;
    const nextA = key === "a" ? clamp(value, 0, 1) : color.a;

    const nextHex = rgbToHex(nextR, nextG, nextB, nextA);

    setColor({ r: nextR, g: nextG, b: nextB, a: nextA, hex: nextHex });
    setHexInput(nextHex);
    setHexError("");
  };

  // Sync state when Hex input field changes directly
  const handleHexInputChange = (val: string) => {
    setHexInput(val);
    const parsed = hexToRgb(val);
    if (parsed) {
      setColor({
        r: parsed.r,
        g: parsed.g,
        b: parsed.b,
        a: parsed.a,
        hex: val.startsWith("#") ? val.toUpperCase() : `#${val.toUpperCase()}`,
      });
      setHexError("");
    } else {
      setHexError("Invalid Hex string format (e.g., #4F46E5 or #4F46E5FF)");
    }
  };

  const handleRandomColor = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const nextHex = rgbToHex(r, g, b, color.a);

    setColor({ r, g, b, a: color.a, hex: nextHex });
    setHexInput(nextHex);
    setHexError("");
  };

  const handleEyeDropper = async () => {
    if ("EyeDropper" in window) {
      try {
        // @ts-ignore
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          handleHexInputChange(result.sRGBHex);
        }
      } catch (e) {
        // User canceled eye dropper selection
      }
    } else {
      alert("The EyeDropper API is not supported in your browser. Please use Chrome, Edge, or Opera.");
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // Computed Color Outputs & Formats
  const hsl = useMemo(() => rgbToHsl(color.r, color.g, color.b), [color.r, color.g, color.b]);
  const cmyk = useMemo(() => rgbToCmyk(color.r, color.g, color.b), [color.r, color.g, color.b]);
  const contrast = useMemo(() => getContrastRatio(color.r, color.g, color.b), [color.r, color.g, color.b]);

  const outputRgbStr = color.a < 1 ? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})` : `rgb(${color.r}, ${color.g}, ${color.b})`;
  const outputHslStr = color.a < 1 ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${color.a})` : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  const outputCmykStr = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
  const outputCssVarStr = `--color-primary: ${color.hex};`;

  return (
    <div className="space-y-6">

      {/* ══════════════════ WORKSPACE GRID (50/50 SPLIT) ══════════════════ */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* LEFT PANEL: INTERACTIVE CONTROLS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Color Sliders & Hex Input
            </h2>
            <div className="flex items-center gap-2">
              {hasEyeDropper && (
                <button
                  type="button"
                  onClick={handleEyeDropper}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  title="Pick color from screen"
                >
                  <Pipette className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Pick Color</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleRandomColor}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                title="Generate Random Color"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Random</span>
              </button>
            </div>
          </div>

          {/* Hex Input Box */}
          <div className="space-y-1.5">
            <label htmlFor="hex-code-input" className="block text-xs font-semibold text-slate-700">
              Hex Code (#RRGGBB or #RRGGBBAA)
            </label>
            <div className="relative">
              <input
                id="hex-code-input"
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInputChange(e.target.value)}
                placeholder="#4F46E5"
                className={`w-full rounded-xl border ${hexError ? "border-red-400 bg-red-50/20" : "border-slate-200 bg-slate-50"
                  } px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(color.hex, "hexInput")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                title="Copy Hex"
              >
                {copiedKey === "hexInput" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {hexError && <p className="text-xs text-red-500 font-medium">{hexError}</p>}
          </div>

          {/* RGB & Alpha Sliders */}
          <div className="space-y-4 pt-2">
            {/* Red Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-red-600 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Red (R)
                </span>
                <span className="font-mono text-slate-700">{color.r}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={color.r}
                onChange={(e) => handleRgbChange("r", parseInt(e.target.value, 10))}
                className="w-full accent-red-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Green Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-emerald-600 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Green (G)
                </span>
                <span className="font-mono text-slate-700">{color.g}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={color.g}
                onChange={(e) => handleRgbChange("g", parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Blue Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-blue-600 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Blue (B)
                </span>
                <span className="font-mono text-slate-700">{color.b}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={color.b}
                onChange={(e) => handleRgbChange("b", parseInt(e.target.value, 10))}
                className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Alpha / Opacity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> Alpha / Opacity (A)
                </span>
                <span className="font-mono text-slate-700">{Math.round(color.a * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={color.a}
                onChange={(e) => handleRgbChange("a", parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: COLOR PREVIEW & OUTPUT CODES */}
        <div className="sticky top-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Live Preview & Color Formats
              </h2>
            </div>

            {/* Checkerboard Wrapper for Opacity Preview */}
            <div
              className="w-full h-36 rounded-2xl border border-slate-200 shadow-inner overflow-hidden flex items-center justify-center relative"
              style={{
                backgroundImage:
                  "radial-gradient(#cbd5e1 1px, transparent 1px), radial-gradient(#cbd5e1 1px, #f8fafc 1px)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 8px 8px",
              }}
            >
              {/* Dynamic Overlay Color Swatch */}
              <div
                className="absolute inset-0 transition-colors duration-150"
                style={{ backgroundColor: outputRgbStr }}
              />
              <div
                className="relative z-10 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg border text-center font-mono font-bold text-sm"
                style={{
                  backgroundColor: contrast.black > contrast.white ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.85)",
                  color: contrast.black > contrast.white ? "#0f172a" : "#ffffff",
                  borderColor: contrast.black > contrast.white ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                }}
              >
                {color.hex}
              </div>
            </div>

            {/* Generated Code Formats List */}
            <div className="space-y-3">
              {[
                { label: "HEX Code", val: color.hex, key: "hex" },
                { label: "RGB / RGBA", val: outputRgbStr, key: "rgb" },
                { label: "HSL / HSLA", val: outputHslStr, key: "hsl" },
                { label: "CMYK", val: outputCmykStr, key: "cmyk" },
                { label: "CSS Variable", val: outputCssVarStr, key: "css" },
              ].map(({ label, val, key }) => (
                <div key={key} className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-mono font-semibold text-slate-800 mt-0.5">{val}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(val, key)}
                    className="p-2 hover:bg-slate-200/60 rounded-lg text-slate-600 transition-colors"
                    title={`Copy ${label}`}
                  >
                    {copiedKey === key ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Contrast Ratio Badges */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">WCAG Contrast:</span>
              <div className="flex gap-2 font-mono">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-bold border border-slate-200">
                  vs White: {contrast.white}:1
                </span>
                <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-bold">
                  vs Black: {contrast.black}:1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════ BELOW-THE-FOLD CONTENT ══════════════════ */}
      <section className="space-y-6 pt-6">
        {/* Card 1: Comprehensive Technical Overview */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Understanding Color Models: Hexadecimal, RGB, and HSL</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            In modern web design, frontend engineering, and digital graphic design, colors are defined using standardized numeric spaces. The two most ubiquitous representations are **Hexadecimal (Hex)** and **Red-Green-Blue (RGB)** formats. Both describe colors in the additive sRGB color space—where Red, Green, and Blue light channels combine in varying intensities from 0 to 255 to reproduce over 16.7 million distinct hues.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Hexadecimal representation encodes each 8-bit color channel into a 2-digit base-16 number (`00` to `FF`). Combining these gives a compact 6-character string (`#RRGGBB`). When alpha transparency is introduced, an additional 2-digit hex byte is appended (`#RRGGBBAA`). The RGB model, conversely, uses base-10 decimal numbers (`rgb(255, 255, 255)`), providing a format that is easily manipulated through JavaScript math or CSS transitions.
          </p>
        </div>

        {/* Card 2: Technical Comparison Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Code className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Color Space Specification Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Compare how different digital color models represent hues across UI component systems, digital printing, and stylesheet configurations:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold">
                  <th className="p-3">Format</th>
                  <th className="p-3">Syntax Example</th>
                  <th className="p-3">Alpha Support</th>
                  <th className="p-3">Primary Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">HEX</td>
                  <td className="p-3 font-mono text-indigo-600">#4F46E5</td>
                  <td className="p-3">Yes (#4F46E5FF)</td>
                  <td className="p-3">CSS UI styles, Figma design tokens, brand design kits</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">RGB / RGBA</td>
                  <td className="p-3 font-mono text-indigo-600">rgba(79, 70, 229, 1)</td>
                  <td className="p-3">Yes (0.0 to 1.0)</td>
                  <td className="p-3">Canvas drawing, CSS programmatic animations, WebGL</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">HSL / HSLA</td>
                  <td className="p-3 font-mono text-indigo-600">hsla(244, 76%, 59%, 1)</td>
                  <td className="p-3">Yes (0.0 to 1.0)</td>
                  <td className="p-3">Creating dynamic color themes, light/dark mode variations</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">CMYK</td>
                  <td className="p-3 font-mono text-indigo-600">cmyk(66%, 69%, 0%, 10%)</td>
                  <td className="p-3">No</td>
                  <td className="p-3">Physical printing, offset press layouts, magazine publishing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Frequently Asked Questions */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5"
              >
                <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Security & Architecture Features */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl shadow-lg text-white space-y-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-indigo-200" />
            <span>Enterprise-Grade Privacy & Real-Time Performance</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-xs md:text-sm">
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm space-y-1">
              <p className="font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-200" /> Zero Network Transmission
              </p>
              <p className="text-indigo-100/80 leading-relaxed">
                All color matrix transforms execute locally inside client browser RAM. Your design palettes stay completely secure.
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm space-y-1">
              <p className="font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-200" /> Instant WCAG Accessibility Check
              </p>
              <p className="text-indigo-100/80 leading-relaxed">
                Calculates relative luminance ratios in real-time to ensure your UI text meets WCAG AA and AAA accessibility standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ JSON-LD SCHEMAS ══════════════════ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "RGB to Hex & Hex to RGB Color Converter",
            description:
              "Convert RGB to Hex and Hex to RGB online with real-time sliders, alpha transparency support, HSL/CMYK generation, and WCAG contrast checking.",
            url: "https://www.twistertools.com/tools/developer-tools/rgb-to-hex",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            featureList: [
              "Bidirectional RGB to Hex and Hex to RGB conversion",
              "Alpha channel and opacity support",
              "Screen EyeDropper color picker",
              "Real-time WCAG contrast calculation",
              "100% client-side privacy execution",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          }),
        }}
      />
    </div>
  );
}