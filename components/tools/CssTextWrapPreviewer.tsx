"use client";

import React, { useState, useMemo, useId, useRef, useEffect } from "react";
import {
    AlignJustify,
    Copy,
    Check,
    RotateCcw,
    Sliders,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    Type,
    Layers,
    Terminal,
    Sparkles,
    SplitSquareVertical,
    Monitor,
    Smartphone,
    Tablet,
    Code2,
    Info,
    MoveHorizontal
} from "lucide-react";

type TextWrapValue = "auto" | "balance" | "pretty" | "nowrap";

interface TypographyPreset {
    id: string;
    label: string;
    category: "headline" | "editorial" | "card" | "callout";
    text: string;
    fontSize: number;
    lineHeight: number;
    maxWidth: number;
}

const PRESETS: TypographyPreset[] = [
    {
        id: "hero-headline",
        label: "Hero Headline (Widow Prevention)",
        category: "headline",
        text: "Designing Resilient Web Architectures for High-Concurrency Next-Generation Cloud Systems",
        fontSize: 32,
        lineHeight: 1.2,
        maxWidth: 620
    },
    {
        id: "subheading",
        label: "Marketing Subtitle",
        category: "headline",
        text: "Empowering engineering teams with zero-latency browser-native tooling built for modern micro-frontends.",
        fontSize: 20,
        lineHeight: 1.4,
        maxWidth: 540
    },
    {
        id: "editorial-paragraph",
        label: "Editorial Article Lede",
        category: "editorial",
        text: "When typography meets automated line balancing, developers can finally eradicate single trailing words without fragile manual non-breaking spaces or hacky responsive media queries that degrade across variable font pairings.",
        fontSize: 16,
        lineHeight: 1.65,
        maxWidth: 480
    },
    {
        id: "product-card",
        label: "UI Card Title & Summary",
        category: "card",
        text: "Interactive real-time previewer demonstrating modern CSS text-wrap values across diverse container viewports and typography scales.",
        fontSize: 18,
        lineHeight: 1.35,
        maxWidth: 360
    }
];

export default function CssTextWrapPreviewer() {
    const [sampleText, setSampleText] = useState<string>(PRESETS[0].text);
    const [selectedWrapMode, setSelectedWrapMode] = useState<TextWrapValue>("balance");
    const [fontSize, setFontSize] = useState<number>(PRESETS[0].fontSize);
    const [lineHeight, setLineHeight] = useState<number>(PRESETS[0].lineHeight);
    const [containerWidth, setContainerWidth] = useState<number>(PRESETS[0].maxWidth);
    const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
    const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("sans");
    const [isCompareSplit, setIsCompareSplit] = useState<boolean>(true);
    const [copiedCss, setCopiedCss] = useState<boolean>(false);
    const [copiedHtml, setCopiedHtml] = useState<boolean>(false);

    const textareaId = useId();
    const wrapSelectId = useId();
    const fontFamilySelectId = useId();
    const textAlignSelectId = useId();
    const fontSizeInputId = useId();
    const lineHeightInputId = useId();
    const containerWidthInputId = useId();

    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [measuredAutoLines, setMeasuredAutoLines] = useState<number>(0);
    const [measuredWrapLines, setMeasuredWrapLines] = useState<number>(0);

    const autoBoxRef = useRef<HTMLParagraphElement>(null);
    const wrapBoxRef = useRef<HTMLParagraphElement>(null);

    // Measure rendered line count heuristic based on height / line-height
    useEffect(() => {
        const computeLines = (elem: HTMLElement | null, size: number, lh: number) => {
            if (!elem) return 0;
            const singleLineHeightPx = size * lh;
            if (singleLineHeightPx <= 0) return 0;
            const computedHeight = elem.getBoundingClientRect().height;
            return Math.max(1, Math.round(computedHeight / singleLineHeightPx));
        };

        setMeasuredAutoLines(computeLines(autoBoxRef.current, fontSize, lineHeight));
        setMeasuredWrapLines(computeLines(wrapBoxRef.current, fontSize, lineHeight));
    }, [sampleText, fontSize, lineHeight, containerWidth, selectedWrapMode, textAlign, fontFamily, isCompareSplit]);

    const handleNumberInput = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: number) => void,
        min: number,
        max: number
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(min);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseFloat(cleaned);
        if (isNaN(num)) {
            setter(min);
        } else {
            setter(Math.max(min, Math.min(max, num)));
        }
    };

    const loadPreset = (presetId: string) => {
        const preset = PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        setSampleText(preset.text);
        setFontSize(preset.fontSize);
        setLineHeight(preset.lineHeight);
        setContainerWidth(preset.maxWidth);
    };

    const generatedCssSnippet = useMemo(() => {
        const fontStack =
            fontFamily === "serif"
                ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
                : fontFamily === "mono"
                    ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                    : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        return `.balanced-typography {
  text-wrap: ${selectedWrapMode};
  font-size: ${fontSize}px;
  line-height: ${lineHeight};
  text-align: ${textAlign};
  max-width: ${containerWidth}px;
  font-family: ${fontStack};
}`;
    }, [selectedWrapMode, fontSize, lineHeight, textAlign, containerWidth, fontFamily]);

    const generatedHtmlSnippet = useMemo(() => {
        return `<div class="balanced-typography">
  ${sampleText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
</div>`;
    }, [sampleText]);

    const handleCopyCss = () => {
        navigator.clipboard.writeText(generatedCssSnippet);
        setCopiedCss(true);
        setTimeout(() => setCopiedCss(false), 2000);
    };

    const handleCopyHtml = () => {
        navigator.clipboard.writeText(generatedHtmlSnippet);
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
    };

    const handleQuickViewport = (width: number) => {
        setContainerWidth(width);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS text-wrap: balance & pretty Typography Previewer",
        "url": "https://twistertools.com/tools/developer-tools/css-text-wrap-previewer",
        "description": "Interactive visual workspace to preview and generate modern CSS text-wrap properties (balance, pretty, nowrap, and auto). Eliminate orphan words and widows in web typography.",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is the difference between CSS text-wrap: balance and text-wrap: pretty?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CSS 'text-wrap: balance' distributes text so every line has approximately equal character count and width. It is designed specifically for headlines, subheadings, and short callouts up to 6 lines. On the other hand, 'text-wrap: pretty' is optimized for body text and long-form prose; it evaluates typographic breaks line-by-line to prevent typographic widows (a single orphan word stranded on the final line) without altering the layout of the preceding paragraph."
                }
            },
            {
                "@type": "Question",
                "name": "Why is text-wrap: balance limited to 6 lines in browser rendering engines?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The balance algorithm performs iterative binary search and algorithmic recalculations to discover optimal line breaks across variable widths. Because calculating balanced line permutations over long paragraphs would create measurable main-thread rendering lag and degrade Cumulative Layout Shift (CLS), browser engines (Blink, Gecko, WebKit) restrict balance computation to containers rendering six or fewer lines of text."
                }
            },
            {
                "@type": "Question",
                "name": "Does CSS text-wrap cause layout shifts (CLS) or slow performance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When applied natively via browser CSS engines, text-wrap executes during the layout and reflow stage, avoiding layout thrashing. Because balance is internally capped at 6 lines and pretty only adjusts line-ending penalties for widows, the performance footprint is negligible compared to third-party JavaScript libraries like Balance-Text."
                }
            },
            {
                "@type": "Question",
                "name": "What is the browser support for text-wrap: balance and pretty in 2026?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modern evergreen browsers (Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari) support text-wrap: balance and text-wrap: pretty natively. Unsupported legacy browsers simply ignore the rule and default gracefully to standard text-wrap: auto, making it an ideal progressive enhancement."
                }
            },
            {
                "@type": "Question",
                "name": "Can I replace manual non-breaking spaces (&nbsp;) with text-wrap: pretty?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Manually inserting non-breaking spaces (&nbsp;) between the final two words of a paragraph is brittle because responsive viewports or font variations can cause unexpected overflow or awkward line jumps. 'text-wrap: pretty' delegates widow prevention to the native layout engine dynamically."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 12-Column Responsive Workspace Grid (5 Control / 7 Preview Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Configuration Controls (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Typography Controls
                        </h2>
                        <button
                            type="button"
                            onClick={() => loadPreset("hero-headline")}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center gap-1"
                        >
                            <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                    </div>

                    {/* Presets Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Editorial Sample Presets:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => loadPreset(preset.id)}
                                    className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-xs font-medium text-slate-800 dark:text-slate-200 transition truncate cursor-pointer"
                                >
                                    <span className="block font-bold text-indigo-600 dark:text-indigo-400 text-[11px] uppercase truncate">
                                        {preset.category}
                                    </span>
                                    <span className="truncate block">{preset.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Text Area */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor={textareaId} className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Live Headline / Text Content:
                            </label>
                            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                {sampleText.length} chars
                            </span>
                        </div>
                        <textarea
                            id={textareaId}
                            rows={4}
                            aria-label="Typography test string"
                            value={sampleText}
                            onChange={(e) => setSampleText(e.target.value)}
                            placeholder="Type or paste sample headline or paragraph text here..."
                            className="w-full p-3 text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[90px]"
                        />
                    </div>

                    {/* CSS text-wrap Mode Selector */}
                    <div className="space-y-2">
                        <label htmlFor={wrapSelectId} className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Target text-wrap Value:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(["balance", "pretty", "auto", "nowrap"] as TextWrapValue[]).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setSelectedWrapMode(mode)}
                                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${selectedWrapMode === mode
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Typography Variables (Font Size, Line Height, Width) */}
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {/* Container Width Slider & Numeric */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <label htmlFor={containerWidthInputId} className="flex items-center gap-1.5">
                                    <MoveHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    Container Max-Width
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={containerWidthInputId}
                                        type="number"
                                        min={240}
                                        max={1000}
                                        value={containerWidth}
                                        onChange={(e) => handleNumberInput(e, setContainerWidth, 240, 1000)}
                                        aria-label="Container max width in pixels"
                                        className="w-16 px-1.5 py-0.5 text-right font-mono text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                                    />
                                    <span className="text-slate-600 dark:text-slate-300 text-[11px]">px</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min={240}
                                max={900}
                                step={10}
                                value={containerWidth}
                                onChange={(e) => setContainerWidth(Number(e.target.value))}
                                aria-label="Container max width slider"
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            {/* Device quick triggers */}
                            <div className="flex items-center gap-1.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => handleQuickViewport(320)}
                                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                                >
                                    <Smartphone className="w-3 h-3" /> Mobile (320px)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickViewport(480)}
                                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                                >
                                    <Tablet className="w-3 h-3" /> Tablet (480px)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickViewport(640)}
                                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                                >
                                    <Monitor className="w-3 h-3" /> Desktop (640px)
                                </button>
                            </div>
                        </div>

                        {/* Font Size & Line Height Dual Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label htmlFor={fontSizeInputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <Type className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Font Size
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        id={fontSizeInputId}
                                        type="number"
                                        min={12}
                                        max={72}
                                        value={fontSize}
                                        onChange={(e) => handleNumberInput(e, setFontSize, 12, 72)}
                                        aria-label="Font size in pixels"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                                    />
                                    <span className="text-slate-600 dark:text-slate-300 text-xs">px</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor={lineHeightInputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <AlignJustify className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Line Height
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        id={lineHeightInputId}
                                        type="number"
                                        step="0.05"
                                        min={1.0}
                                        max={2.5}
                                        value={lineHeight}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setLineHeight(isNaN(val) ? 1.2 : Math.max(1.0, Math.min(2.5, val)));
                                        }}
                                        aria-label="Line height unitless multiplier"
                                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                                    />
                                    <span className="text-slate-600 dark:text-slate-300 text-xs">em</span>
                                </div>
                            </div>
                        </div>

                        {/* Font Family & Text Alignment Selectors */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label htmlFor={fontFamilySelectId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Font Family:
                                </label>
                                <select
                                    id={fontFamilySelectId}
                                    aria-label="Font family selector"
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value as "sans" | "serif" | "mono")}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                                >
                                    <option value="sans">Modern Sans-Serif</option>
                                    <option value="serif">Editorial Serif</option>
                                    <option value="mono">Monospace Technical</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor={textAlignSelectId} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Text Alignment:
                                </label>
                                <select
                                    id={textAlignSelectId}
                                    aria-label="Text alignment selector"
                                    value={textAlign}
                                    onChange={(e) => setTextAlign(e.target.value as "left" | "center" | "right")}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                                >
                                    <option value="left">Left Aligned</option>
                                    <option value="center">Center Aligned</option>
                                    <option value="right">Right Aligned</option>
                                </select>
                            </div>
                        </div>

                        {/* Side-by-Side Comparison Toggle */}
                        <div className="pt-2">
                            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isCompareSplit}
                                    onChange={(e) => setIsCompareSplit(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span className="flex items-center gap-1.5">
                                    <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    Show Side-by-Side Comparison (auto vs. {selectedWrapMode})
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Interactive Canvas & Code Output (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0">
                    {/* Visual Preview Canvas Container */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                    Render Canvas
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    Viewport: {containerWidth}px
                                </span>
                            </div>
                        </div>

                        {/* Interactive Drag/Resize Frame Simulation */}
                        <div
                            ref={previewContainerRef}
                            className="p-4 sm:p-6 rounded-2xl bg-slate-100/60 dark:bg-slate-950/80 border border-dashed border-slate-300 dark:border-slate-800 overflow-x-auto min-h-[300px] flex flex-col justify-center"
                        >
                            <div
                                style={{ maxWidth: `${containerWidth}px` }}
                                className="mx-auto w-full transition-all duration-150 ease-out space-y-6"
                            >
                                {/* Primary Balanced Container */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Active CSS: text-wrap: {selectedWrapMode}
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                            ~{measuredWrapLines} {measuredWrapLines === 1 ? "line" : "lines"}
                                        </span>
                                    </div>
                                    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 dark:border-indigo-500/30 shadow-xs">
                                        <p
                                            ref={wrapBoxRef}
                                            style={{
                                                textWrap: selectedWrapMode as any,
                                                fontSize: `${fontSize}px`,
                                                lineHeight: lineHeight,
                                                textAlign: textAlign,
                                                fontFamily:
                                                    fontFamily === "serif"
                                                        ? "ui-serif, Georgia, serif"
                                                        : fontFamily === "mono"
                                                            ? "ui-monospace, monospace"
                                                            : "system-ui, sans-serif"
                                            }}
                                            className="text-slate-900 dark:text-white transition-all select-text break-words"
                                        >
                                            {sampleText || "Type text to preview..."}
                                        </p>
                                    </div>
                                </div>

                                {/* Comparison Box: Default text-wrap: auto */}
                                {isCompareSplit && (
                                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                                <AlignJustify className="w-3.5 h-3.5" />
                                                Default CSS: text-wrap: auto (Unbalanced / Widow Risk)
                                            </span>
                                            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                                ~{measuredAutoLines} {measuredAutoLines === 1 ? "line" : "lines"}
                                            </span>
                                        </div>
                                        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                                            <p
                                                ref={autoBoxRef}
                                                style={{
                                                    textWrap: "auto",
                                                    fontSize: `${fontSize}px`,
                                                    lineHeight: lineHeight,
                                                    textAlign: textAlign,
                                                    fontFamily:
                                                        fontFamily === "serif"
                                                            ? "ui-serif, Georgia, serif"
                                                            : fontFamily === "mono"
                                                                ? "ui-monospace, monospace"
                                                                : "system-ui, sans-serif"
                                                }}
                                                className="text-slate-700 dark:text-slate-300 transition-all select-text break-words"
                                            >
                                                {sampleText || "Type text to preview..."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Typographic Diagnostics & Heuristics Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Selected Mode
                                </span>
                                <p className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {selectedWrapMode}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Aspect Ratio Width
                                </span>
                                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                    {containerWidth}px
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Line Delta
                                </span>
                                <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                    {measuredWrapLines} vs {measuredAutoLines}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Widow Shield
                                </span>
                                <p className={`text-sm font-bold font-mono ${selectedWrapMode !== "auto" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                    {selectedWrapMode !== "auto" ? "Active" : "None"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Production CSS & HTML Code Snippets */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Generated CSS & HTML Snippet
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyCss}
                                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    {copiedCss ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedCss ? "CSS Copied!" : "Copy CSS"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopyHtml}
                                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedHtml ? "HTML Copied!" : "Copy HTML"}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                                <pre className="leading-relaxed">{generatedCssSnippet}</pre>
                            </div>
                            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                                <pre className="leading-relaxed">{generatedHtmlSnippet}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Practical Implementation Callout Banner */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Engine Note:</strong> Modern rendering engines automatically limit <code>text-wrap: balance</code> to headlines and elements spanning 6 or fewer lines to prevent main-thread layout recalculation overhead. For body paragraphs and multi-sentence content, use <code>text-wrap: pretty</code> to eliminate single-word widows without line count restrictions.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: The Engineering Mechanics of text-wrap */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Modern CSS Typography: Resolving Widows and Orphans with text-wrap
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        For decades, front-end engineers and web designers grappled with typographic imperfections native to responsive web browsers. A headline rendered at 1200px desktop width would look pristine, but scaling down to 390px mobile viewports routinely stranded a single orphan word on the final line. Prior workarounds relied on non-breaking spaces (<code>&amp;nbsp;</code>), manual line break tags (<code>&lt;br /&gt;</code>), or client-side JavaScript resizing observers like Balance-Text.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <AlignJustify className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Greedy Line Breaking (Auto)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                The traditional browser default (<code>text-wrap: auto</code>) uses a greedy first-fit algorithm. It fits as many characters as physically possible onto the current line before wrapping, frequently leaving a solitary word isolated on the bottom line.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Symmetrical Balance
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                With <code>text-wrap: balance</code>, the browser engine calculates the total string length and distributes text across lines to harmonize character density. Lines end up approximately equal in visual weight, creating polished headlines.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Widow Elimination (Pretty)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                The <code>text-wrap: pretty</code> property uses typographic line-penalty heuristics. It evaluates the final four lines of a paragraph to ensure at least two words occupy the last row, resolving widows without reforming the entire block.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> CSS Specification Syntax & Progressive Enhancement
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Implementing balanced typography requires no polyfills or runtime dependencies. Modern browsers parse the declaration natively while unsupported engines silently ignore it:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`/* Target prominent display headings and hero titles */
h1, h2, h3, .hero-title {
  text-wrap: balance;
}

/* Target editorial copy and long-form prose */
p, article p, blockquote {
  text-wrap: pretty;
}`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Technical Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Architectural Analysis: CSS text-wrap Values
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the correct text-wrap property depends heavily on the DOM node&apos;s typographic function, line count, and performance constraints:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">CSS text-wrap Property</th>
                                    <th className="p-3">Target Use Case</th>
                                    <th className="p-3">Engine Threshold</th>
                                    <th className="p-3">Performance Impact</th>
                                    <th className="p-3">Layout Shift (CLS) Risk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">text-wrap: balance</td>
                                    <td className="p-3 text-slate-900 dark:text-white font-semibold">Headlines, H1-H3, Hero Titles, Badges</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Max 6 lines (Capped)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Low (Native Binary Search)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Zero (During reflow)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">text-wrap: pretty</td>
                                    <td className="p-3 text-slate-900 dark:text-white font-semibold">Paragraphs, Articles, Product Reviews</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">No line count limit</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Negligible (Trailing 4 lines)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Zero</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">text-wrap: auto</td>
                                    <td className="p-3 text-slate-900 dark:text-white">Default Browser Greedy Wrapping</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Unlimited</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Baseline Lowest</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Baseline</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">text-wrap: nowrap</td>
                                    <td className="p-3 text-slate-900 dark:text-white">Navigation tabs, Chips, Single-line code</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Single line (No wrap)</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">None</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Horizontal Overflow Risk</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for Production Systems */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Implementation Playbook: 4 Rules for Web Typographic Excellence
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Ensure clean rendering without accidental performance regressions across your responsive design system:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Practices
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Apply Balance Strictly to Headings:</strong> Add <code>text-wrap: balance</code> inside base CSS resets for <code>h1</code>, <code>h2</code>, <code>h3</code>, and <code>h4</code> elements.
                                </li>
                                <li>
                                    • <strong>Deploy Pretty for Editorial Content:</strong> Use <code>text-wrap: pretty</code> on body paragraphs (<code>p</code>) to safeguard against single-word widows on mobile screens.
                                </li>
                                <li>
                                    • <strong>Retire Custom JS Balancing Libraries:</strong> Replace heavy JavaScript resize listeners (like Balance-Text or ShrinkWrap) with native CSS to save script evaluation time.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-amber-600" /> Pitfalls to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Do Not Apply Balance to Massive Paragraphs:</strong> Applying balance to 500-word prose blocks is useless because browsers abort balancing after 6 lines.
                                </li>
                                <li>
                                    • <strong>Avoid Hardcoded Non-Breaking Spaces:</strong> Manually typing <code>&amp;nbsp;</code> into CMS entries can cause words to overflow when translated into different languages.
                                </li>
                                <li>
                                    • <strong>Verify Variable Font Pairings:</strong> Ensure your line-height allows sufficient breathing room when balanced headings distribute into multiple tiers.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended FAQ */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between CSS text-wrap: balance and text-wrap: pretty?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                CSS <code>text-wrap: balance</code> distributes text so every line has approximately equal character count and width. It is designed specifically for headlines, subheadings, and short callouts up to 6 lines. On the other hand, <code>text-wrap: pretty</code> is optimized for body text and long-form prose; it evaluates typographic breaks line-by-line to prevent typographic widows (a single orphan word stranded on the final line) without altering the layout of the preceding paragraph.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why is text-wrap: balance limited to 6 lines in browser rendering engines?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The balance algorithm performs iterative binary search and algorithmic recalculations to discover optimal line breaks across variable widths. Because calculating balanced line permutations over long paragraphs would create measurable main-thread rendering lag and degrade Cumulative Layout Shift (CLS), browser engines (Blink, Gecko, WebKit) restrict balance computation to containers rendering six or fewer lines of text.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does CSS text-wrap cause layout shifts (CLS) or slow performance?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                When applied natively via browser CSS engines, text-wrap executes during the layout and reflow stage, avoiding layout thrashing. Because balance is internally capped at 6 lines and pretty only adjusts line-ending penalties for widows, the performance footprint is negligible compared to third-party JavaScript libraries like Balance-Text.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the browser support for text-wrap: balance and pretty in 2026?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Modern evergreen browsers (Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari) support text-wrap: balance and text-wrap: pretty natively. Unsupported legacy browsers simply ignore the rule and default gracefully to standard text-wrap: auto, making it an ideal progressive enhancement.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I replace manual non-breaking spaces (&amp;nbsp;) with text-wrap: pretty?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Manually inserting non-breaking spaces (<code>&amp;nbsp;</code>) between the final two words of a paragraph is brittle because responsive viewports or font variations can cause unexpected overflow or awkward line jumps. <code>text-wrap: pretty</code> delegates widow prevention to the native layout engine dynamically.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}