"use client";

import React, { useState, useMemo, useId, useRef, useEffect } from "react";
import {
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    Layers,
    Terminal,
    Code2,
    Laptop,
    Tablet,
    Smartphone,
    Maximize2,
    MoveHorizontal,
    Compass,
    Settings,
    LayoutGrid,
    Boxes,
    FileCode,
    Cpu,
    ArrowRight
} from "lucide-react";

type ContainerType = "inline-size" | "size" | "normal";
type ComponentPreset = "responsive-card" | "ecommerce-product" | "stat-widget" | "nav-bar";

interface BreakpointRule {
    id: string;
    conditionType: "min-width" | "max-width" | "range";
    minVal: number;
    maxVal: number;
    cssDeclarations: string;
}

const PRESETS: Record<
    ComponentPreset,
    {
        name: string;
        containerName: string;
        containerType: ContainerType;
        parentWidth: number;
        breakpoints: BreakpointRule[];
        htmlTemplate: string;
        baseCss: string;
    }
> = {
    "responsive-card": {
        name: "Adaptive Editorial Card",
        containerName: "card-container",
        containerType: "inline-size",
        parentWidth: 420,
        baseCss: `.card-container {
  container-name: card-container;
  container-type: inline-size;
}

.cq-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.cq-card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
}

.cq-card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cq-card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.cq-card-text {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}

.cq-card-badge {
  display: inline-block;
  width: fit-content;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  background: #eef2ff;
  color: #4f46e5;
}`,
        breakpoints: [
            {
                id: "b1",
                conditionType: "min-width",
                minVal: 480,
                maxVal: 0,
                cssDeclarations: `.cq-card {
    flex-direction: row;
    align-items: center;
  }
  .cq-card-image {
    width: 220px;
    height: 100%;
    min-height: 200px;
  }
  .cq-card-body {
    padding: 1.75rem;
  }
  .cq-card-title {
    font-size: 1.35rem;
  }`
            },
            {
                id: "b2",
                conditionType: "min-width",
                minVal: 640,
                maxVal: 0,
                cssDeclarations: `.cq-card-body {
    padding: 2.25rem;
  }
  .cq-card-title {
    font-size: 1.6rem;
  }
  .cq-card-text {
    font-size: 1rem;
  }`
            }
        ],
        htmlTemplate: `<div class="card-container">
  <div class="cq-card">
    <div class="cq-card-image"></div>
    <div class="cq-card-body">
      <span class="cq-card-badge">Next-Gen Architecture</span>
      <h3 class="cq-card-title">Independent Modular UI</h3>
      <p class="cq-card-text">
        This card adjusts based solely on its own parent box dimensions, regardless of whether the browser viewport is a phone or a 4K display.
      </p>
    </div>
  </div>
</div>`
    },
    "ecommerce-product": {
        name: "Product Commerce Tile",
        containerName: "product-slot",
        containerType: "inline-size",
        parentWidth: 340,
        baseCss: `.product-slot {
  container-name: product-slot;
  container-type: inline-size;
}

.cq-product {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  gap: 0.75rem;
}

.cq-product-img {
  height: 150px;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
}

.cq-product-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cq-product-price {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.cq-product-btn {
  width: 100%;
  padding: 0.625rem;
  background: #4f46e5;
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  text-align: center;
}`,
        breakpoints: [
            {
                id: "b1",
                conditionType: "min-width",
                minVal: 450,
                maxVal: 0,
                cssDeclarations: `.cq-product {
    display: grid;
    grid-template-columns: 140px 1fr auto;
    align-items: center;
    gap: 1.25rem;
  }
  .cq-product-img {
    height: 110px;
  }
  .cq-product-btn {
    width: auto;
    padding: 0.75rem 1.25rem;
  }`
            }
        ],
        htmlTemplate: `<div class="product-slot">
  <div class="cq-product">
    <div class="cq-product-img"></div>
    <div class="cq-product-meta">
      <h4 style="font-weight:700;font-size:1.1rem;color:#0f172a;margin:0;">Pro Audio Headset</h4>
      <p style="font-size:0.8rem;color:#64748b;margin:0;">Active noise cancellation wireless audio.</p>
      <span class="cq-product-price">$249.00</span>
    </div>
    <button class="cq-product-btn">Add to Cart</button>
  </div>
</div>`
    },
    "stat-widget": {
        name: "Analytics Metrics Row",
        containerName: "dashboard-widget",
        containerType: "inline-size",
        parentWidth: 320,
        baseCss: `.dashboard-widget {
  container-name: dashboard-widget;
  container-type: inline-size;
}

.cq-stat-box {
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cq-stat-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 700;
}

.cq-stat-val {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
}

.cq-stat-delta {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #10b981;
}`,
        breakpoints: [
            {
                id: "b1",
                conditionType: "min-width",
                minVal: 400,
                maxVal: 0,
                cssDeclarations: `.cq-stat-box {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .cq-stat-val {
    font-size: 2.25rem;
  }`
            }
        ],
        htmlTemplate: `<div class="dashboard-widget">
  <div class="cq-stat-box">
    <div>
      <div class="cq-stat-title">Monthly Recurring Revenue</div>
      <div class="cq-stat-val">$84,920</div>
    </div>
    <div class="cq-stat-delta">+18.4% vs last month</div>
  </div>
</div>`
    },
    "nav-bar": {
        name: "Adaptive Navigation Header",
        containerName: "site-nav",
        containerType: "inline-size",
        parentWidth: 360,
        baseCss: `.site-nav {
  container-name: site-nav;
  container-type: inline-size;
}

.cq-navbar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.cq-nav-brand {
  font-weight: 800;
  font-size: 1.125rem;
  color: #4f46e5;
}

.cq-nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cq-nav-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  text-decoration: none;
}`,
        breakpoints: [
            {
                id: "b1",
                conditionType: "min-width",
                minVal: 520,
                maxVal: 0,
                cssDeclarations: `.cq-navbar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .cq-nav-links {
    flex-direction: row;
    gap: 1.25rem;
  }`
            }
        ],
        htmlTemplate: `<div class="site-nav">
  <nav class="cq-navbar">
    <div class="cq-nav-brand">CloudCore</div>
    <div class="cq-nav-links">
      <span class="cq-nav-link">Overview</span>
      <span class="cq-nav-link">Infrastructure</span>
      <span class="cq-nav-link">Security</span>
      <span class="cq-nav-link">Billing</span>
    </div>
  </nav>
</div>`
    }
};

export default function CssContainerQueryBuilder() {
    const [selectedPreset, setSelectedPreset] = useState<ComponentPreset>("responsive-card");
    const [containerName, setContainerName] = useState<string>("card-container");
    const [containerType, setContainerType] = useState<ContainerType>("inline-size");
    const [parentWidth, setParentWidth] = useState<number>(420);
    const [useShorthand, setUseShorthand] = useState<boolean>(true);
    const [baseCss, setBaseCss] = useState<string>(PRESETS["responsive-card"].baseCss);
    const [breakpoints, setBreakpoints] = useState<BreakpointRule[]>(PRESETS["responsive-card"].breakpoints);
    const [htmlTemplate, setHtmlTemplate] = useState<string>(PRESETS["responsive-card"].htmlTemplate);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

    const containerNameInputId = useId();
    const containerTypeSelectId = useId();
    const parentWidthInputId = useId();

    const isDraggingRef = useRef<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Apply Preset handler
    const applyPreset = (presetKey: ComponentPreset) => {
        setSelectedPreset(presetKey);
        const p = PRESETS[presetKey];
        setContainerName(p.containerName);
        setContainerType(p.containerType);
        setParentWidth(p.parentWidth);
        setBaseCss(p.baseCss);
        setBreakpoints(p.breakpoints);
        setHtmlTemplate(p.htmlTemplate);
    };

    // Sanitize integer inputs preventing stuck zero prefix
    const handleNumberInput = (
        rawVal: string,
        setter: (n: number) => void
    ) => {
        if (rawVal === "") {
            setter(0);
            return;
        }
        const cleaned = rawVal.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        setter(isNaN(num) ? 0 : num);
    };

    const addBreakpoint = () => {
        const newId = `b_${Date.now()}`;
        setBreakpoints([
            ...breakpoints,
            {
                id: newId,
                conditionType: "min-width",
                minVal: 500,
                maxVal: 0,
                cssDeclarations: `  /* Add style overrides for this container size */`
            }
        ]);
    };

    const updateBreakpoint = (id: string, updates: Partial<BreakpointRule>) => {
        setBreakpoints(
            breakpoints.map((b) => (b.id === id ? { ...b, ...updates } : b))
        );
    };

    const removeBreakpoint = (id: string) => {
        setBreakpoints(breakpoints.filter((b) => b.id !== id));
    };

    // Generated Production CSS
    const generatedCss = useMemo(() => {
        let output = "/* CSS Container Query Specification */\n";

        if (useShorthand && containerName.trim()) {
            output += `/* Shorthand declaration: container: <name> / <type> */\n`;
            output += `.${containerName} {\n  container: ${containerName} / ${containerType};\n}\n\n`;
        } else {
            output += `/* Longhand property declarations */\n`;
            output += `.${containerName || "cq-wrapper"} {\n`;
            if (containerName.trim()) {
                output += `  container-name: ${containerName};\n`;
            }
            output += `  container-type: ${containerType};\n}\n\n`;
        }

        // Base CSS Rules
        output += `/* Base Styles */\n${baseCss.trim()}\n\n`;

        // Breakpoint Query Blocks
        if (breakpoints.length > 0) {
            output += `/* Container Query Breakpoints */\n`;
            breakpoints.forEach((bp) => {
                const targetName = containerName.trim() ? `${containerName} ` : "";
                let queryCondition = "";

                if (bp.conditionType === "min-width") {
                    queryCondition = `(min-width: ${bp.minVal}px)`;
                } else if (bp.conditionType === "max-width") {
                    queryCondition = `(max-width: ${bp.maxVal}px)`;
                } else if (bp.conditionType === "range") {
                    queryCondition = `(${bp.minVal}px <= width <= ${bp.maxVal}px)`;
                }

                output += `@container ${targetName}${queryCondition} {\n`;
                output += `  ${bp.cssDeclarations.trim().split("\n").join("\n  ")}\n`;
                output += `}\n\n`;
            });
        }

        return output.trim();
    }, [containerName, containerType, useShorthand, baseCss, breakpoints]);

    // Construct preview scoped style tag
    const previewStyleTag = useMemo(() => {
        return `
      #cq-sandbox-mount {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }
      #cq-sandbox-mount * {
        box-sizing: border-box;
      }
      ${generatedCss}
    `;
    }, [generatedCss]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(generatedCss);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        applyPreset("responsive-card");
    };

    // Pointer-based container resizing logic for touch and mouse
    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (!isDraggingRef.current || !containerRef.current) return;
            const bounds = containerRef.current.getBoundingClientRect();
            const rawW = e.clientX - bounds.left;
            const clamped = Math.max(240, Math.min(Math.round(rawW), Math.round(bounds.width)));
            setParentWidth(clamped);
        };

        const handlePointerUp = () => {
            isDraggingRef.current = false;
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, []);

    // WebApplication & FAQ Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Container Query (CQ) & Size-Container Formatter",
        "url": "https://twistertools.com/tools/developer-tools/css-container-query-builder",
        "description": "Enterprise interactive CSS Container Query builder and formatter. Construct modular @container styles, configure inline-size containers, preview responsive components, and export standard CSS syntax.",
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
                "name": "What is the difference between CSS Media Queries and Container Queries?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CSS Media Queries (@media) evaluate the global browser viewport dimensions or device capabilities. CSS Container Queries (@container) evaluate the micro-dimensions of an individual ancestor parent element designated with 'container-type'. This enables UI components to adapt intelligently based on where they are placed in a layout, such as a narrow sidebar or a wide hero section, independent of screen size."
                }
            },
            {
                "@type": "Question",
                "name": "When should I use container-type: inline-size vs container-type: size?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use 'inline-size' when query breakpoints rely solely on horizontal width changes (the inline axis in horizontal writing systems). This is recommended for 95% of web layouts because it avoids vertical cyclic layout loops. Use 'size' only when queries need to measure both block (height) and inline (width) axes simultaneously, which requires the container to have an explicitly declared height."
                }
            },
            {
                "@type": "Question",
                "name": "What are Container Query Units (cqw, cqh, cqi, cqb, cqmin, cqmax)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Container query units provide relative measurements based on the query container dimensions rather than the viewport. For example, 1cqw is equal to 1% of the query container's width, while 1cqi represents 1% of the container's inline size. They allow fluid typography and dynamic padding that responds to the module's immediate container."
                }
            },
            {
                "@type": "Question",
                "name": "Are CSS Container Queries supported across modern web browsers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. CSS Container Queries and Container Query Units are officially standardized and supported natively in all modern evergreen browsers, including Chrome 105+, Edge 105+, Safari 16+, and Firefox 110+, with over 93% global device support."
                }
            },
            {
                "@type": "Question",
                "name": "Why is container shorthand syntax (container: name / type) preferred?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The shorthand syntax 'container: <container-name> / <container-type>' condenses rules into a single readable line and standardizes container naming conventions. It prevents accidental inheritance bugs and ensures browser layout engines initialize container containment in one unified pass."
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

            {/* Top Preset & Actions Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mr-1 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-indigo-600" /> Presets:
                    </span>
                    {(["responsive-card", "ecommerce-product", "stat-widget", "nav-bar"] as ComponentPreset[]).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => applyPreset(key)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${selectedPreset === key
                                    ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                        >
                            {PRESETS[key].name}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer self-end sm:self-auto"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Configuration
                </button>
            </div>

            {/* Asymmetrical 5/7 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration Controls (Col 5) */}
                <div className="lg:col-span-5 space-y-6 min-w-0">
                    {/* Container Definition Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Container Setup
                            </h2>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                CSS spec Level 3
                            </span>
                        </div>

                        {/* Container Name */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor={containerNameInputId}
                                className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                            >
                                Container Name (<code className="font-mono text-indigo-600">container-name</code>)
                            </label>
                            <input
                                id={containerNameInputId}
                                type="text"
                                value={containerName}
                                onChange={(e) => setContainerName(e.target.value.replace(/\s+/g, "-"))}
                                placeholder="e.g. card-container"
                                aria-label="Container name identifier"
                                className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                Optional identifier for nesting multiple queries without ambiguity.
                            </p>
                        </div>

                        {/* Container Type */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor={containerTypeSelectId}
                                className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                            >
                                Container Type (<code className="font-mono text-indigo-600">container-type</code>)
                            </label>
                            <select
                                id={containerTypeSelectId}
                                value={containerType}
                                aria-label="Select container type property"
                                onChange={(e) => setContainerType(e.target.value as ContainerType)}
                                className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="inline-size">inline-size (Evaluates horizontal width - Recommended)</option>
                                <option value="size">size (Evaluates both width and fixed height)</option>
                                <option value="normal">normal (Style queries only, no sizing)</option>
                            </select>
                        </div>

                        {/* Shorthand Switch */}
                        <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none pt-1">
                            <input
                                type="checkbox"
                                checked={useShorthand}
                                onChange={(e) => setUseShorthand(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                            />
                            <span>Use modern shorthand syntax (<code className="font-mono text-indigo-600">container: name / type</code>)</span>
                        </label>
                    </div>

                    {/* Breakpoint Conditions Builder */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Query Breakpoints
                            </h2>
                            <button
                                type="button"
                                onClick={addBreakpoint}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center gap-1"
                            >
                                + Add Rule
                            </button>
                        </div>

                        {breakpoints.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                                No container breakpoints configured. Click &ldquo;+ Add Rule&rdquo; to define adaptive queries.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {breakpoints.map((bp, index) => (
                                    <div
                                        key={bp.id}
                                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <Compass className="w-3.5 h-3.5 text-indigo-600" /> Rule #{index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeBreakpoint(bp.id)}
                                                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                                                    Condition:
                                                </label>
                                                <select
                                                    aria-label="Condition Type"
                                                    value={bp.conditionType}
                                                    onChange={(e) =>
                                                        updateBreakpoint(bp.id, {
                                                            conditionType: e.target.value as "min-width" | "max-width" | "range"
                                                        })
                                                    }
                                                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                                >
                                                    <option value="min-width">min-width (&ge; px)</option>
                                                    <option value="max-width">max-width (&le; px)</option>
                                                    <option value="range">Range (min &le; w &le; max)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                                                    {bp.conditionType === "range" ? "Min Width (px):" : "Width Threshold (px):"}
                                                </label>
                                                <input
                                                    type="number"
                                                    aria-label="Threshold in pixels"
                                                    value={bp.minVal === 0 ? "" : bp.minVal}
                                                    onChange={(e) =>
                                                        handleNumberInput(e.target.value, (n) =>
                                                            updateBreakpoint(bp.id, { minVal: n })
                                                        )
                                                    }
                                                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                                />
                                            </div>

                                            {bp.conditionType === "range" && (
                                                <div className="sm:col-span-2">
                                                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                                                        Max Width (px):
                                                    </label>
                                                    <input
                                                        type="number"
                                                        aria-label="Max width threshold in pixels"
                                                        value={bp.maxVal === 0 ? "" : bp.maxVal}
                                                        onChange={(e) =>
                                                            handleNumberInput(e.target.value, (n) =>
                                                                updateBreakpoint(bp.id, { maxVal: n })
                                                            )
                                                        }
                                                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                                                CSS Overrides Inside Container:
                                            </label>
                                            <textarea
                                                rows={3}
                                                aria-label="CSS Overrides"
                                                value={bp.cssDeclarations}
                                                onChange={(e) =>
                                                    updateBreakpoint(bp.id, { cssDeclarations: e.target.value })
                                                }
                                                placeholder=".card { flex-direction: row; }"
                                                className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Interactive Canvas & Code Generator (Col 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        {/* Tabs Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("preview")}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === "preview"
                                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                        }`}
                                >
                                    <Eye className="w-3.5 h-3.5" /> Interactive Sandbox
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("code")}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === "code"
                                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                        }`}
                                >
                                    <FileCode className="w-3.5 h-3.5" /> Generated CSS
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleCopyCode}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${copied
                                        ? "bg-emerald-600 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied CSS!" : "Copy CSS"}
                            </button>
                        </div>

                        {activeTab === "preview" ? (
                            <div className="space-y-4">
                                {/* Width Controller Bar */}
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <label
                                            htmlFor={parentWidthInputId}
                                            className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                                        >
                                            <MoveHorizontal className="w-4 h-4 text-indigo-600" /> Parent Container Width:
                                        </label>
                                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                                            {parentWidth}px
                                        </span>
                                    </div>
                                    <input
                                        id={parentWidthInputId}
                                        type="range"
                                        min={260}
                                        max={780}
                                        value={parentWidth}
                                        onChange={(e) => setParentWidth(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-ew-resize"
                                    />
                                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                                        <span>260px (Sidebar / Mobile)</span>
                                        <span>520px (Tablet / Mid-column)</span>
                                        <span>780px (Full Content)</span>
                                    </div>
                                </div>

                                {/* Sandbox Stage */}
                                <div
                                    ref={containerRef}
                                    className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[380px] flex flex-col items-center justify-center overflow-x-auto relative"
                                >
                                    {/* Resizable Mock Parent Element */}
                                    <div
                                        style={{ width: `${parentWidth}px`, transition: "width 0.1s ease-out" }}
                                        className="relative border-2 border-dashed border-indigo-400/80 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm max-w-full"
                                    >
                                        {/* Container Dimension Tag */}
                                        <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                                            Container: {parentWidth}px
                                        </div>

                                        {/* Embedded Component Scope */}
                                        <style dangerouslySetInnerHTML={{ __html: previewStyleTag }} />
                                        <div
                                            id="cq-sandbox-mount"
                                            dangerouslySetInnerHTML={{ __html: htmlTemplate }}
                                        />

                                        {/* Interactive Handle Grip */}
                                        <div
                                            onPointerDown={(e) => {
                                                isDraggingRef.current = true;
                                                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                            }}
                                            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center cursor-ew-resize shadow-md"
                                            title="Drag to resize container"
                                        >
                                            <MoveHorizontal className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                                    <span>
                                        <strong>True Modular Isolation:</strong> Drag the blue handle to resize. Notice how layout adaptations occur strictly when the wrapper crosses the specified breakpoint, completely independent of browser screen size.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                                    <pre className="p-4 text-xs font-mono text-indigo-300 overflow-x-auto leading-relaxed max-h-[460px]">
                                        {generatedCss}
                                    </pre>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                        Sample HTML Markup:
                                    </label>
                                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                                        <pre className="p-3 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                                            {htmlTemplate}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Container Queries Deep Dive */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Paradigm Shift of CSS Container Queries (@container)
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        For more than a decade, responsive web design relied exclusively on viewport media queries (<code className="font-mono text-indigo-600 dark:text-indigo-400">@media (min-width: ...)</code>). While media queries transformed mobile web usability, they introduced significant architectural friction into modern component-driven systems like React, Vue, and Web Components. When a card component is embedded inside a 300px sidebar on a 1920px desktop monitor, a traditional media query treats it as desktop-sized, squashing its layout into unreadable fragments.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Modular Independence
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Components control their own design based on allocated layout real estate. A button, card, or navigation bar renders with complete visual autonomy across sidebars, dashboards, or modals.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Zero JavaScript Observers
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Container queries replace heavy ResizeObserver scripts and runtime DOM listener hooks with native browser C++ rendering pipeline logic, dramatically improving frame rates and Core Web Vitals.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Container Query Units
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Scale fluid typography and padding dynamically via <code className="font-mono text-indigo-600">cqw</code>, <code className="font-mono text-indigo-600">cqh</code>, and <code className="font-mono text-indigo-600">cqi</code> units, tying typography scale directly to the parent box.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Architecture Matrix */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Architecture: Media Queries vs Container Queries vs ResizeObserver
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the correct layout mechanism prevents unnecessary browser repaints and reduces bundle sizes. The table below illustrates the trade-offs:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Methodology</th>
                                    <th className="p-3">Evaluation Context</th>
                                    <th className="p-3">Component Reusability</th>
                                    <th className="p-3">Performance Impact</th>
                                    <th className="p-3">Browser Support</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">CSS Container Queries (@container)</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Ancestor Parent Box</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Infinite (Self-contained)</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Zero CPU Runtime / Native</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Chrome 105+, Safari 16+, FF 110+</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">CSS Media Queries (@media)</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Global Browser Window</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Low (Hardcoded to Viewport)</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Native C++ CSSOM Parser</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Universal (&gt;99.9%)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">JS ResizeObserver / Hook</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">DOM Node Geometry</td>
                                    <td className="p-3 text-emerald-600 font-semibold">High</td>
                                    <td className="p-3 text-rose-600 font-bold">Frequent Main-Thread Layout Thrashing</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Requires polyfills & bundle bloat</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Enterprise Best Practices & Units Guide */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Container Query Units & Implementation Guide
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        CSS Containment Level 3 standardizes six dedicated length units designed to calculate dimensions relative to the query container:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-indigo-600" /> Relative Container Units
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">cqw</code>: 1% of query container&apos;s width.
                                </li>
                                <li>
                                    • <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">cqh</code>: 1% of query container&apos;s height.
                                </li>
                                <li>
                                    • <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">cqi</code>: 1% of query container&apos;s inline size.
                                </li>
                                <li>
                                    • <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">cqb</code>: 1% of query container&apos;s block size.
                                </li>
                                <li>
                                    • <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">cqmin / cqmax</code>: The smaller or larger value of <code className="font-mono">cqi</code> or <code className="font-mono">cqb</code>.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-emerald-600" /> Golden Rules for Production
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Default to inline-size:</strong> Applying <code className="font-mono">container-type: size</code> requires rigid height values. 98% of UI systems only require horizontal responsive adaptations.
                                </li>
                                <li>
                                    • <strong>Avoid Querying the Container Itself:</strong> A container cannot query its own dimensions within the same rule. Always apply responsive classes to descendants inside the wrapper.
                                </li>
                                <li>
                                    • <strong>Use Named Containers for Nested Structures:</strong> When nesting widgets inside grid layouts, specify <code className="font-mono">container-name</code> to prevent queries from binding to outer parents.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
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
                                What is the difference between CSS Media Queries and Container Queries?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                CSS Media Queries (@media) evaluate the global browser viewport dimensions or device capabilities. CSS Container Queries (@container) evaluate the micro-dimensions of an individual ancestor parent element designated with &lsquo;container-type&rsquo;. This enables UI components to adapt intelligently based on where they are placed in a layout, such as a narrow sidebar or a wide hero section, independent of screen size.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                When should I use container-type: inline-size vs container-type: size?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Use &lsquo;inline-size&rsquo; when query breakpoints rely solely on horizontal width changes (the inline axis in horizontal writing systems). This is recommended for 95% of web layouts because it avoids vertical cyclic layout loops. Use &lsquo;size&rsquo; only when queries need to measure both block (height) and inline (width) axes simultaneously, which requires the container to have an explicitly declared height.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What are Container Query Units (cqw, cqh, cqi, cqb, cqmin, cqmax)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Container query units provide relative measurements based on the query container dimensions rather than the viewport. For example, 1cqw is equal to 1% of the query container&apos;s width, while 1cqi represents 1% of the container&apos;s inline size. They allow fluid typography and dynamic padding that responds to the module&apos;s immediate container.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Are CSS Container Queries supported across modern web browsers?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. CSS Container Queries and Container Query Units are officially standardized and supported natively in all modern evergreen browsers, including Chrome 105+, Edge 105+, Safari 16+, and Firefox 110+, with over 93% global device support.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why is container shorthand syntax (container: name / type) preferred?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The shorthand syntax &lsquo;container: &lt;container-name&gt; / &lt;container-type&gt;&rsquo; condenses rules into a single readable line and standardizes container naming conventions. It prevents accidental inheritance bugs and ensures browser layout engines initialize container containment in one unified pass.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}