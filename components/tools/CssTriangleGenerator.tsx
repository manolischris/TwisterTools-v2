"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    Triangle,
    Copy,
    Check,
    RotateCw,
    Sliders,
    Layers,
    Code,
    Sparkles,
    BookOpen,
    HelpCircle,
    Download,
    Eye,
    Maximize2,
    Palette,
    Compass,
    ShieldCheck,
    Cpu,
    Boxes,
    FileCode,
    Lightbulb,
    ExternalLink
} from "lucide-react";

type Direction =
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

type TriangleType = "isosceles" | "equilateral" | "scalene" | "right-angled";

type PolygonPreset =
    | "triangle-up"
    | "triangle-down"
    | "triangle-left"
    | "triangle-right"
    | "diamond"
    | "trapezoid"
    | "parallelogram"
    | "pentagon"
    | "hexagon"
    | "heptagon"
    | "octagon"
    | "nonagon"
    | "decagon"
    | "bevel"
    | "rabbet"
    | "left-arrow"
    | "right-arrow"
    | "left-point"
    | "right-point"
    | "star-5"
    | "star-6"
    | "cross"
    | "message"
    | "custom";

interface Point {
    x: number;
    y: number;
}

const POLYGON_PRESETS: { id: PolygonPreset; name: string; points: Point[] }[] = [
    {
        id: "triangle-up",
        name: "Triangle (Up)",
        points: [{ x: 50, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }]
    },
    {
        id: "triangle-down",
        name: "Triangle (Down)",
        points: [{ x: 50, y: 100 }, { x: 0, y: 0 }, { x: 100, y: 0 }]
    },
    {
        id: "triangle-right",
        name: "Triangle (Right)",
        points: [{ x: 0, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 100 }]
    },
    {
        id: "triangle-left",
        name: "Triangle (Left)",
        points: [{ x: 100, y: 0 }, { x: 0, y: 50 }, { x: 100, y: 100 }]
    },
    {
        id: "diamond",
        name: "Diamond",
        points: [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }]
    },
    {
        id: "trapezoid",
        name: "Trapezoid",
        points: [{ x: 20, y: 0 }, { x: 80, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]
    },
    {
        id: "parallelogram",
        name: "Parallelogram",
        points: [{ x: 25, y: 0 }, { x: 100, y: 0 }, { x: 75, y: 100 }, { x: 0, y: 100 }]
    },
    {
        id: "pentagon",
        name: "Pentagon",
        points: [{ x: 50, y: 0 }, { x: 100, y: 38 }, { x: 82, y: 100 }, { x: 18, y: 100 }, { x: 0, y: 38 }]
    },
    {
        id: "hexagon",
        name: "Hexagon",
        points: [{ x: 25, y: 0 }, { x: 75, y: 0 }, { x: 100, y: 50 }, { x: 75, y: 100 }, { x: 25, y: 100 }, { x: 0, y: 50 }]
    },
    {
        id: "heptagon",
        name: "Heptagon",
        points: [{ x: 50, y: 0 }, { x: 90, y: 22 }, { x: 100, y: 68 }, { x: 72, y: 100 }, { x: 28, y: 100 }, { x: 0, y: 68 }, { x: 10, y: 22 }]
    },
    {
        id: "octagon",
        name: "Octagon",
        points: [{ x: 30, y: 0 }, { x: 70, y: 0 }, { x: 100, y: 30 }, { x: 100, y: 70 }, { x: 70, y: 100 }, { x: 30, y: 100 }, { x: 0, y: 70 }, { x: 0, y: 30 }]
    },
    {
        id: "star-5",
        name: "5-Point Star",
        points: [
            { x: 50, y: 0 }, { x: 61, y: 35 }, { x: 98, y: 35 }, { x: 68, y: 57 },
            { x: 79, y: 91 }, { x: 50, y: 70 }, { x: 21, y: 91 }, { x: 32, y: 57 },
            { x: 2, y: 35 }, { x: 39, y: 35 }
        ]
    },
    {
        id: "right-arrow",
        name: "Right Arrow",
        points: [{ x: 0, y: 20 }, { x: 60, y: 20 }, { x: 60, y: 0 }, { x: 100, y: 50 }, { x: 60, y: 100 }, { x: 60, y: 80 }, { x: 0, y: 80 }]
    },
    {
        id: "cross",
        name: "Plus / Cross",
        points: [
            { x: 35, y: 0 }, { x: 65, y: 0 }, { x: 65, y: 35 }, { x: 100, y: 35 },
            { x: 100, y: 65 }, { x: 65, y: 65 }, { x: 65, y: 100 }, { x: 35, y: 100 },
            { x: 35, y: 65 }, { x: 0, y: 65 }, { x: 0, y: 35 }, { x: 35, y: 35 }
        ]
    },
    {
        id: "message",
        name: "Speech Bubble",
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 75 }, { x: 75, y: 75 }, { x: 75, y: 100 }, { x: 50, y: 75 }, { x: 0, y: 75 }]
    }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

export default function CssTriangleGenerator() {
    // Mode Switcher: "border" (Traditional CSS Triangles) vs "clip-path" (Modern Polygons)
    const [engineMode, setEngineMode] = useState<"border" | "clip-path">("border");

    // --- Border Method States ---
    const [direction, setDirection] = useState<Direction>("top");
    const [triangleType, setTriangleType] = useState<TriangleType>("isosceles");
    const [width, setWidth] = useState<number>(100);
    const [height, setHeight] = useState<number>(100);
    const [leftWidth, setLeftWidth] = useState<number>(50);
    const [rightWidth, setRightWidth] = useState<number>(50);
    const [topHeight, setTopHeight] = useState<number>(50);
    const [bottomHeight, setBottomHeight] = useState<number>(50);
    const [color, setColor] = useState<string>("#4f46e5");
    const [usePseudo, setUsePseudo] = useState<boolean>(false);
    const [pseudoSelector, setPseudoSelector] = useState<"::before" | "::after">("::after");

    // --- Clip-Path Method States ---
    const [polygonPreset, setPolygonPreset] = useState<PolygonPreset>("triangle-up");
    const [points, setPoints] = useState<Point[]>(POLYGON_PRESETS[0].points);
    const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
    const [polyWidth, setPolyWidth] = useState<number>(200);
    const [polyHeight, setPolyHeight] = useState<number>(200);
    const [polyColor, setPolyColor] = useState<string>("#4f46e5");
    const [polyBgType, setPolyBgType] = useState<"solid" | "gradient">("solid");
    const [polyGradientColorEnd, setPolyGradientColorEnd] = useState<string>("#9333ea");
    const [polyGradientAngle, setPolyGradientAngle] = useState<number>(135);

    // UI Feedback & Interactive States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"css" | "tailwind" | "scss">("css");
    const [containerBg, setContainerBg] = useState<"light" | "dark" | "checker">("checker");

    const svgCanvasRef = useRef<SVGSVGElement | null>(null);

    // Sync Equilateral & Isosceles Border Math
    useEffect(() => {
        if (engineMode !== "border") return;

        if (triangleType === "equilateral") {
            // Equilateral triangle height = (sqrt(3)/2) * width ≈ 0.866025 * width
            if (["top", "bottom"].includes(direction)) {
                const calculatedHeight = Math.round((Math.sqrt(3) / 2) * width);
                setHeight(calculatedHeight);
                setLeftWidth(Math.round(width / 2));
                setRightWidth(Math.round(width / 2));
            } else if (["left", "right"].includes(direction)) {
                const calculatedWidth = Math.round((Math.sqrt(3) / 2) * height);
                setWidth(calculatedWidth);
                setTopHeight(Math.round(height / 2));
                setBottomHeight(Math.round(height / 2));
            }
        } else if (triangleType === "isosceles") {
            setLeftWidth(Math.round(width / 2));
            setRightWidth(Math.round(width / 2));
            setTopHeight(Math.round(height / 2));
            setBottomHeight(Math.round(height / 2));
        }
    }, [triangleType, width, height, direction, engineMode]);

    // Apply Polygon Preset
    const handleSelectPreset = (presetId: PolygonPreset) => {
        setPolygonPreset(presetId);
        const match = POLYGON_PRESETS.find((p) => p.id === presetId);
        if (match) {
            setPoints(match.points.map((pt) => ({ ...pt })));
        }
    };

    // Calculate Border Styles
    const borderStyleCalculation = useMemo(() => {
        let borderTop = "0";
        let borderBottom = "0";
        let borderLeft = "0";
        let borderRight = "0";

        let borderTopColor = "transparent";
        let borderBottomColor = "transparent";
        let borderLeftColor = "transparent";
        let borderRightColor = "transparent";

        const effectiveLeftW = triangleType === "scalene" ? leftWidth : width / 2;
        const effectiveRightW = triangleType === "scalene" ? rightWidth : width / 2;
        const effectiveTopH = triangleType === "scalene" ? topHeight : height / 2;
        const effectiveBottomH = triangleType === "scalene" ? bottomHeight : height / 2;

        switch (direction) {
            case "top":
                borderLeft = `${effectiveLeftW}px solid transparent`;
                borderRight = `${effectiveRightW}px solid transparent`;
                borderBottom = `${height}px solid ${color}`;
                borderBottomColor = color;
                break;
            case "bottom":
                borderLeft = `${effectiveLeftW}px solid transparent`;
                borderRight = `${effectiveRightW}px solid transparent`;
                borderTop = `${height}px solid ${color}`;
                borderTopColor = color;
                break;
            case "left":
                borderTop = `${effectiveTopH}px solid transparent`;
                borderBottom = `${effectiveBottomH}px solid transparent`;
                borderRight = `${width}px solid ${color}`;
                borderRightColor = color;
                break;
            case "right":
                borderTop = `${effectiveTopH}px solid transparent`;
                borderBottom = `${effectiveBottomH}px solid transparent`;
                borderLeft = `${width}px solid ${color}`;
                borderLeftColor = color;
                break;
            case "top-left":
                borderTop = `${height}px solid ${color}`;
                borderRight = `${width}px solid transparent`;
                borderTopColor = color;
                break;
            case "top-right":
                borderTop = `${height}px solid ${color}`;
                borderLeft = `${width}px solid transparent`;
                borderTopColor = color;
                break;
            case "bottom-left":
                borderBottom = `${height}px solid ${color}`;
                borderRight = `${width}px solid transparent`;
                borderBottomColor = color;
                break;
            case "bottom-right":
                borderBottom = `${height}px solid ${color}`;
                borderLeft = `${width}px solid transparent`;
                borderBottomColor = color;
                break;
        }

        return {
            width: "0px",
            height: "0px",
            borderStyle: "solid",
            borderTopWidth: borderTop.split(" ")[0],
            borderBottomWidth: borderBottom.split(" ")[0],
            borderLeftWidth: borderLeft.split(" ")[0],
            borderRightWidth: borderRight.split(" ")[0],
            borderTopColor,
            borderBottomColor,
            borderLeftColor,
            borderRightColor,
            rawTop: borderTop,
            rawBottom: borderBottom,
            rawLeft: borderLeft,
            rawRight: borderRight,
        };
    }, [direction, triangleType, width, height, leftWidth, rightWidth, topHeight, bottomHeight, color]);

    // Calculate Clip-Path Polygon String
    const clipPathString = useMemo(() => {
        return `polygon(${points.map((p) => `${p.x}% ${p.y}%`).join(", ")})`;
    }, [points]);

    // Computed Output Code Strings
    const generatedCSS = useMemo(() => {
        if (engineMode === "border") {
            const b = borderStyleCalculation;
            if (usePseudo) {
                return `.triangle-box {
  position: relative;
}

.triangle-box${pseudoSelector} {
  content: "";
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: ${b.borderTopWidth} ${b.borderRightWidth} ${b.borderBottomWidth} ${b.borderLeftWidth};
  border-color: ${b.borderTopColor} ${b.borderRightColor} ${b.borderBottomColor} ${b.borderLeftColor};
}`;
            }
            return `.css-triangle {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: ${b.borderTopWidth} ${b.borderRightWidth} ${b.borderBottomWidth} ${b.borderLeftWidth};
  border-color: ${b.borderTopColor} ${b.borderRightColor} ${b.borderBottomColor} ${b.borderLeftColor};
}`;
        } else {
            const backgroundVal =
                polyBgType === "gradient"
                    ? `linear-gradient(${polyGradientAngle}deg, ${polyColor}, ${polyGradientColorEnd})`
                    : polyColor;

            return `.css-polygon {
  width: ${polyWidth}px;
  height: ${polyHeight}px;
  background: ${backgroundVal};
  clip-path: ${clipPathString};
  -webkit-clip-path: ${clipPathString};
}`;
        }
    }, [
        engineMode,
        borderStyleCalculation,
        usePseudo,
        pseudoSelector,
        polyWidth,
        polyHeight,
        polyBgType,
        polyGradientAngle,
        polyColor,
        polyGradientColorEnd,
        clipPathString
    ]);

    const generatedTailwind = useMemo(() => {
        if (engineMode === "border") {
            const b = borderStyleCalculation;
            return `<!-- Tailwind Arbitrary Utility Classes -->
<div class="w-0 h-0 border-solid border-t-[${b.borderTopWidth}] border-r-[${b.borderRightWidth}] border-b-[${b.borderBottomWidth}] border-l-[${b.borderLeftWidth}] border-t-[${b.borderTopColor}] border-r-[${b.borderRightColor}] border-b-[${b.borderBottomColor}] border-l-[${b.borderLeftColor}]"></div>`;
        } else {
            const bgClass =
                polyBgType === "gradient"
                    ? `bg-gradient-to-br from-[${polyColor}] to-[${polyGradientColorEnd}]`
                    : `bg-[${polyColor}]`;
            return `<!-- Tailwind Arbitrary Clip-Path Utility -->
<div class="w-[${polyWidth}px] h-[${polyHeight}px] ${bgClass} [clip-path:${clipPathString.replace(/\s+/g, "_")}]"></div>`;
        }
    }, [engineMode, borderStyleCalculation, polyWidth, polyHeight, polyBgType, polyColor, polyGradientColorEnd, clipPathString]);

    const generatedSCSS = useMemo(() => {
        if (engineMode === "border") {
            const b = borderStyleCalculation;
            return `// SCSS Mixin Implementation
@mixin triangle($direction, $size, $color) {
  width: 0;
  height: 0;
  border-style: solid;
  // Dynamic border properties
  border-width: ${b.borderTopWidth} ${b.borderRightWidth} ${b.borderBottomWidth} ${b.borderLeftWidth};
  border-color: ${b.borderTopColor} ${b.borderRightColor} ${b.borderBottomColor} ${b.borderLeftColor};
}

.triangle {
  @include triangle(${direction}, ${width}px, ${color});
}`;
        } else {
            return `// SCSS Polygon Module
$poly-width: ${polyWidth}px;
$poly-height: ${polyHeight}px;
$poly-shape: ${clipPathString};

.css-polygon {
  width: $poly-width;
  height: $poly-height;
  background: ${polyBgType === "gradient" ? `linear-gradient(${polyGradientAngle}deg, ${polyColor}, ${polyGradientColorEnd})` : polyColor};
  clip-path: $poly-shape;
  -webkit-clip-path: $poly-shape;
}`;
        }
    }, [engineMode, borderStyleCalculation, direction, width, color, polyWidth, polyHeight, polyBgType, polyGradientAngle, polyColor, polyGradientColorEnd, clipPathString]);

    const handleCopy = () => {
        const textToCopy =
            activeTab === "css"
                ? generatedCSS
                : activeTab === "tailwind"
                    ? generatedTailwind
                    : generatedSCSS;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCSS = () => {
        const textToCopy =
            activeTab === "css"
                ? generatedCSS
                : activeTab === "tailwind"
                    ? generatedTailwind
                    : generatedSCSS;
        const blob = new Blob([textToCopy], { type: "text/css;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `triangle-polygon-${engineMode}.css`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Interactive Dragging Point Handlers for SVG Polygon
    const handleSvgPointerDown = (index: number) => {
        setActivePointIndex(index);
    };

    const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (activePointIndex === null || !svgCanvasRef.current) return;
        const rect = svgCanvasRef.current.getBoundingClientRect();
        const rawX = ((e.clientX - rect.left) / rect.width) * 100;
        const rawY = ((e.clientY - rect.top) / rect.height) * 100;

        const clampedX = Math.round(Math.max(0, Math.min(100, rawX)));
        const clampedY = Math.round(Math.max(0, Math.min(100, rawY)));

        setPoints((prev) => {
            const next = [...prev];
            next[activePointIndex] = { x: clampedX, y: clampedY };
            return next;
        });
        setPolygonPreset("custom");
    };

    const handleSvgPointerUp = () => {
        setActivePointIndex(null);
    };

    const handleAddPoint = () => {
        if (points.length >= 16) return;
        const last = points[points.length - 1];
        setPoints([...points, { x: Math.min(100, last.x + 10), y: Math.min(100, last.y + 10) }]);
        setPolygonPreset("custom");
    };

    const handleRemovePoint = (index: number) => {
        if (points.length <= 3) return;
        setPoints(points.filter((_, i) => i !== index));
        setPolygonPreset("custom");
    };

    // JSON-LD Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Triangle & Polygon Generator",
        "url": "https://twistertools.com/tools/developer-tools/css-triangle-generator",
        "description": "Generate pure CSS triangles using zero-dimension border-hacks and modern CSS clip-path polygons with draggable control vertices, instant Tailwind classes, and SCSS mixins.",
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
                "name": "How do pure CSS border triangles actually work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CSS border triangles leverage the mitered (diagonal) junction where adjacent borders meet on a box with 0px width and 0px height. By setting three borders to transparent and giving one border a non-zero width and solid color, a sharp geometric triangle is rendered entirely through hardware rasterization without external images or SVG elements."
                }
            },
            {
                "@type": "Question",
                "name": "When should I use CSS clip-path over the CSS border hack?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use CSS clip-path when you need complex n-sided polygons (stars, hexagons, trapezoids), multi-color linear or radial gradients, responsive percentage scaling, or inner content (such as text and icons). Use the CSS border method when targeting legacy browsers or styling lightweight tooltip arrows and dropdown pointers via ::before or ::after pseudo-elements."
                }
            },
            {
                "@type": "Question",
                "name": "How do you make an equilateral triangle with CSS borders?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An equilateral triangle has three 60-degree interior angles and three equal sides. For a base width of W, the height must mathematically equal (sqrt(3)/2) * W (approximately 0.866025 * W). In CSS borders, for an upward triangle, set border-left and border-right to (W / 2)px transparent, and border-bottom to (W * 0.866)px solid color."
                }
            },
            {
                "@type": "Question",
                "name": "Can I attach these CSS triangles to tooltips with pseudo-elements?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Toggle the 'Use ::after / ::before' mode in our tool to generate standard pseudo-element CSS. The parent element receives position: relative, while the ::after pseudo-element is configured with content: '', position: absolute, and the calculated border widths."
                }
            },
            {
                "@type": "Question",
                "name": "Are CSS clip-path shapes GPU accelerated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Modern web browsers process CSS clip-path polygon coordinates on the GPU rasterizer pipeline. When animated with CSS transitions or keyframes, polygons render at a smooth 60–120 FPS, provided that the number of polygon vertices remains constant between keyframes."
                }
            }
        ]
    };

    return (
        <div className="w-full space-y-8">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Interactive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Geometry Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                {engineMode === "border" ? "Border Triangle Controls" : "Clip-Path Polygon Controls"}
                            </h2>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {engineMode === "border" ? "Zero-Box Hack" : "CSS3 Path Vector"}
                            </span>
                        </div>

                        {/* Engine Mode Toggle */}
                        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 mb-5">
                            <button
                                type="button"
                                onClick={() => setEngineMode("border")}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                    engineMode === "border"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                <Triangle className="w-3.5 h-3.5" />
                                Border Method
                            </button>
                            <button
                                type="button"
                                onClick={() => setEngineMode("clip-path")}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                    engineMode === "clip-path"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                                <Boxes className="w-3.5 h-3.5" />
                                Clip-Path Polygon
                            </button>
                        </div>

                        {engineMode === "border" ? (
                            /* Border Hack Controls */
                            <div className="space-y-5">
                                {/* Direction Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Compass className="w-4 h-4 text-indigo-600" /> Direction Point
                                    </label>
                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                                        {(
                                            [
                                                "top",
                                                "bottom",
                                                "left",
                                                "right",
                                                "top-left",
                                                "top-right",
                                                "bottom-left",
                                                "bottom-right"
                                            ] as Direction[]
                                        ).map((dir) => (
                                            <button
                                                key={dir}
                                                type="button"
                                                onClick={() => setDirection(dir)}
                                                className={`py-2 px-1 text-[11px] font-bold rounded-lg capitalize transition text-center cursor-pointer ${direction === dir
                                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                                    : "text-slate-600 hover:text-slate-900"
                                                    }`}
                                            >
                                                {dir.replace("-", " ")}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Triangle Geometric Classification */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Geometry Type
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {(["isosceles", "equilateral", "scalene", "right-angled"] as TriangleType[]).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setTriangleType(t)}
                                                className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition border cursor-pointer ${triangleType === t
                                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {t.replace("-", " ")}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dimensions Controls */}
                                <div className="space-y-3 pt-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                                <span>Width: {width}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="400"
                                                value={width}
                                                onChange={(e) => setWidth(Number(e.target.value))}
                                                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                                <span>Height: {height}px</span>
                                                {triangleType === "equilateral" && (
                                                    <span className="text-[10px] text-indigo-600 font-semibold">(Auto)</span>
                                                )}
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="400"
                                                disabled={triangleType === "equilateral"}
                                                value={height}
                                                onChange={(e) => setHeight(Number(e.target.value))}
                                                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer disabled:opacity-40"
                                            />
                                        </div>
                                    </div>

                                    {/* Scalene Asymmetric Sliders */}
                                    {triangleType === "scalene" && (
                                        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                                            <p className="text-xs font-bold text-indigo-900">Asymmetric Border Wings</p>
                                            {["top", "bottom"].includes(direction) ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                            Left Width: {leftWidth}px
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="200"
                                                            value={leftWidth}
                                                            onChange={(e) => setLeftWidth(Number(e.target.value))}
                                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                            Right Width: {rightWidth}px
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="200"
                                                            value={rightWidth}
                                                            onChange={(e) => setRightWidth(Number(e.target.value))}
                                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                            Top Height: {topHeight}px
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="200"
                                                            value={topHeight}
                                                            onChange={(e) => setTopHeight(Number(e.target.value))}
                                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                            Bottom Height: {bottomHeight}px
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="200"
                                                            value={bottomHeight}
                                                            onChange={(e) => setBottomHeight(Number(e.target.value))}
                                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Color Picker & Pseudo Toggle */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Palette className="w-4 h-4 text-indigo-600" /> Color
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold uppercase bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Tooltip Pseudo-Element
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setUsePseudo(!usePseudo)}
                                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${usePseudo
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {usePseudo ? "Active (::after)" : "Standalone Div"}
                                            </button>
                                            {usePseudo && (
                                                <select
                                                    value={pseudoSelector}
                                                    onChange={(e) => setPseudoSelector(e.target.value as "::before" | "::after")}
                                                    className="px-2 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none"
                                                >
                                                    <option value="::after">::after</option>
                                                    <option value="::before">::before</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Clip-Path Polygon Controls */
                            <div className="space-y-5">
                                {/* Preset Shapes Dropdown Grid */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Boxes className="w-4 h-4 text-indigo-600" /> Choose Polygon Preset
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-500">
                                            {points.length} Vertices
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                                        {POLYGON_PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => handleSelectPreset(preset.id)}
                                                className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition text-center truncate cursor-pointer ${polygonPreset === preset.id
                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                    : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Width & Height Dimensions */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Box Width: {polyWidth}px
                                        </label>
                                        <input
                                            type="range"
                                            min="50"
                                            max="400"
                                            value={polyWidth}
                                            onChange={(e) => setPolyWidth(Number(e.target.value))}
                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Box Height: {polyHeight}px
                                        </label>
                                        <input
                                            type="range"
                                            min="50"
                                            max="400"
                                            value={polyHeight}
                                            onChange={(e) => setPolyHeight(Number(e.target.value))}
                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Vertex Point Editor Table */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Polygon Coordinates (X%, Y%)
                                        </label>
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={handleAddPoint}
                                                disabled={points.length >= 16}
                                                className="px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition cursor-pointer"
                                            >
                                                + Add Vertex
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                                        {points.map((pt, idx) => (
                                            <div key={idx} className="p-2 flex items-center justify-between gap-2 text-xs">
                                                <span className="font-bold text-slate-600 w-6">P{idx + 1}</span>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-[10px] text-slate-400 font-semibold">X:</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={pt.x}
                                                        onChange={(e) => {
                                                            const val = Math.max(0, Math.min(100, Number(e.target.value)));
                                                            const newPts = [...points];
                                                            newPts[idx].x = isNaN(val) ? 0 : val;
                                                            setPoints(newPts);
                                                            setPolygonPreset("custom");
                                                        }}
                                                        className="w-14 px-1.5 py-0.5 border border-slate-200 rounded font-mono text-center"
                                                    />
                                                    <span className="text-[10px] text-slate-400 font-semibold">%</span>

                                                    <span className="text-[10px] text-slate-400 font-semibold ml-2">Y:</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={pt.y}
                                                        onChange={(e) => {
                                                            const val = Math.max(0, Math.min(100, Number(e.target.value)));
                                                            const newPts = [...points];
                                                            newPts[idx].y = isNaN(val) ? 0 : val;
                                                            setPoints(newPts);
                                                            setPolygonPreset("custom");
                                                        }}
                                                        className="w-14 px-1.5 py-0.5 border border-slate-200 rounded font-mono text-center"
                                                    />
                                                    <span className="text-[10px] text-slate-400 font-semibold">%</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={points.length <= 3}
                                                    onClick={() => handleRemovePoint(idx)}
                                                    className="text-red-500 hover:text-red-700 disabled:opacity-30 text-xs px-1.5 py-0.5 font-bold cursor-pointer"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Background Color & Gradient Controls */}
                                <div className="space-y-3 pt-1">
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fill Type:</label>
                                        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                                            <button
                                                type="button"
                                                onClick={() => setPolyBgType("solid")}
                                                className={`px-3 py-1 rounded-md transition cursor-pointer ${polyBgType === "solid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                    }`}
                                            >
                                                Solid Fill
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPolyBgType("gradient")}
                                                className={`px-3 py-1 rounded-md transition cursor-pointer ${polyBgType === "gradient" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                    }`}
                                            >
                                                Gradient Fill
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                {polyBgType === "gradient" ? "Start Color" : "Fill Color"}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={polyColor}
                                                    onChange={(e) => setPolyColor(e.target.value)}
                                                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                                                />
                                                <input
                                                    type="text"
                                                    value={polyColor}
                                                    onChange={(e) => setPolyColor(e.target.value)}
                                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono uppercase"
                                                />
                                            </div>
                                        </div>

                                        {polyBgType === "gradient" && (
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">End Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={polyGradientColorEnd}
                                                        onChange={(e) => setPolyGradientColorEnd(e.target.value)}
                                                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={polyGradientColorEnd}
                                                        onChange={(e) => setPolyGradientColorEnd(e.target.value)}
                                                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono uppercase"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 text-slate-700">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Hardware Accelerated Rendering
                        </span>
                        <span>Zero External Libs</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Visual Stage & Code Generation */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Visual Preview Stage
                            </h2>
                            {/* Backdrop Changer */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setContainerBg("light")}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${containerBg === "light" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                        }`}
                                >
                                    Light
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setContainerBg("dark")}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${containerBg === "dark" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600"
                                        }`}
                                >
                                    Dark
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setContainerBg("checker")}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${containerBg === "checker" ? "bg-indigo-50 text-indigo-600 shadow-xs" : "text-slate-600"
                                        }`}
                                >
                                    Grid
                                </button>
                            </div>
                        </div>

                        {/* Interactive Canvas */}
                        <div
                            className={`w-full h-80 rounded-2xl border border-slate-200/80 flex items-center justify-center relative overflow-hidden transition-colors ${containerBg === "dark"
                                ? "bg-slate-950"
                                : containerBg === "checker"
                                    ? "bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50"
                                    : "bg-white"
                                }`}
                        >
                            {engineMode === "border" ? (
                                /* Render Pure CSS Border Triangle */
                                <div
                                    style={{
                                        width: "0px",
                                        height: "0px",
                                        borderStyle: "solid",
                                        borderTopWidth: borderStyleCalculation.borderTopWidth,
                                        borderBottomWidth: borderStyleCalculation.borderBottomWidth,
                                        borderLeftWidth: borderStyleCalculation.borderLeftWidth,
                                        borderRightWidth: borderStyleCalculation.borderRightWidth,
                                        borderTopColor: borderStyleCalculation.borderTopColor,
                                        borderBottomColor: borderStyleCalculation.borderBottomColor,
                                        borderLeftColor: borderStyleCalculation.borderLeftColor,
                                        borderRightColor: borderStyleCalculation.borderRightColor,
                                        transition: "all 0.15s ease-out",
                                    }}
                                />
                            ) : (
                                /* Render Clip-Path Polygon Shape with Draggable Overlay */
                                <div
                                    className="relative flex items-center justify-center select-none"
                                    style={{ width: `${polyWidth}px`, height: `${polyHeight}px` }}
                                >
                                    {/* Clipped Visual Box */}
                                    <div
                                        className="w-full h-full transition-all duration-75 shadow-lg"
                                        style={{
                                            clipPath: clipPathString,
                                            WebkitClipPath: clipPathString,
                                            background:
                                                polyBgType === "gradient"
                                                    ? `linear-gradient(${polyGradientAngle}deg, ${polyColor}, ${polyGradientColorEnd})`
                                                    : polyColor,
                                        }}
                                    />

                                    {/* Draggable Vertex Point Interactive SVG Layer */}
                                    <svg
                                        ref={svgCanvasRef}
                                        onPointerMove={handleSvgPointerMove}
                                        onPointerUp={handleSvgPointerUp}
                                        onPointerLeave={handleSvgPointerUp}
                                        className="absolute inset-0 w-full h-full overflow-visible touch-none"
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                    >
                                        {/* Polygon Guideline Stroke */}
                                        <polygon
                                            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                                            fill="none"
                                            stroke="#6366f1"
                                            strokeWidth="1.5"
                                            strokeDasharray="3 3"
                                            opacity="0.8"
                                        />

                                        {/* Interactive Circular Control Handles */}
                                        {points.map((pt, idx) => (
                                            <g key={idx} className="group cursor-grab active:cursor-grabbing">
                                                {/* Large Invisible Hit Target for Easier Dragging */}
                                                <circle
                                                    cx={pt.x}
                                                    cy={pt.y}
                                                    r="8"
                                                    fill="transparent"
                                                    className="cursor-grab active:cursor-grabbing"
                                                    onPointerDown={() => handleSvgPointerDown(idx)}
                                                />
                                                {/* Visible Control Handle Point */}
                                                <circle
                                                    cx={pt.x}
                                                    cy={pt.y}
                                                    r={activePointIndex === idx ? "5" : "3.5"}
                                                    fill={activePointIndex === idx ? "#4f46e5" : "#ffffff"}
                                                    stroke="#4f46e5"
                                                    strokeWidth="1.5"
                                                    className="pointer-events-none transition-all duration-150 group-hover:stroke-indigo-700 group-hover:scale-110 origin-center"
                                                    style={{
                                                        transformBox: "fill-box",
                                                        transformOrigin: "center",
                                                    }}
                                                />
                                                <text
                                                    x={pt.x}
                                                    y={pt.y - 6}
                                                    fontSize="6"
                                                    textAnchor="middle"
                                                    fill="#1e293b"
                                                    fontWeight="bold"
                                                    className="pointer-events-none select-none"
                                                >
                                                    P{idx + 1}
                                                </text>
                                            </g>
                                        ))}
                                    </svg>
                                </div>
                            )}

                            {/* Dimension Badge Indicator */}
                            <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur text-white text-[11px] font-mono px-2.5 py-1 rounded-md border border-slate-700">
                                {engineMode === "border" ? `${width}px × ${height}px` : `${polyWidth}px × ${polyHeight}px`}
                            </div>
                        </div>

                        {/* Generated Output Tabs & Editor */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                    {(["css", "tailwind", "scss"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${activeTab === tab ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs font-semibold text-slate-500 font-mono">
                                    {engineMode === "border" ? "CSS 2.1+" : "CSS3 Clip-Path"}
                                </span>
                            </div>

                            {/* Code Snippet Box */}
                            <div className="relative">
                                <pre className="bg-slate-900 text-indigo-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-48">
                                    <code>
                                        {activeTab === "css"
                                            ? generatedCSS
                                            : activeTab === "tailwind"
                                                ? generatedTailwind
                                                : generatedSCSS}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy Code Snippet"}
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadCSS}
                            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition border border-slate-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Download .css
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Deep-Dive on CSS Geometry */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mechanics of Pure CSS Triangles & Polygon Geometry
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Rendering geometric shapes in native CSS without rasterized image assets or SVG overhead relies on two distinct rendering models: the classic <strong>zero-dimension border-miter hack</strong> and modern <strong>CSS3 <code>clip-path: polygon()</code> vectors</strong>. Understanding how web layout engines rasterize these shapes allows frontend engineers to pick the optimal technique for UI performance and design fidelity.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Triangle className="w-4 h-4 text-indigo-600" /> The CSS Border-Miter Method
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When an HTML element has a content box of <code>width: 0</code> and <code>height: 0</code>, its borders meet diagonally at 45-degree angles. By making three borders <code>transparent</code> and assigning a color to the fourth, the browser draws a sharp triangle.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                width: 0; height: 0; border-left: 50px solid transparent; border-right: 50px solid transparent; border-bottom: 100px solid #4f46e5;
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Boxes className="w-4 h-4 text-indigo-600" /> CSS3 Clip-Path Polygon Vectors
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Modern browsers allow masking containers into arbitrary $N$-sided polygons using normalized coordinate pairs $(X_n\%, Y_n\%)$. This unlocks complex geometric silhouettes, linear gradients, and full responsive container scaling.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Architecture Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            CSS Border Hack vs. CSS Clip-Path: Architectural Comparison
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting between border triangles and clip-path polygons depends on legacy browser constraints, gradient styling needs, and whether the shape acts as a layout container or an ornamental pointer:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Feature & Capability</th>
                                    <th className="p-3">CSS Border Method</th>
                                    <th className="p-3">CSS clip-path Polygon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Browser Compatibility</td>
                                    <td className="p-3 text-emerald-700 font-bold">Universal (IE6+, All Modern)</td>
                                    <td className="p-3 text-indigo-700 font-bold">Modern (Chrome, Edge, Safari, Firefox)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Complex Geometries (&gt;3 Vertices)</td>
                                    <td className="p-3 text-rose-600 font-bold">Limited to Triangles & Trapezoids</td>
                                    <td className="p-3 text-emerald-700 font-bold">Unlimited ($N$-Sided Polygons, Stars)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Gradients & Background Images</td>
                                    <td className="p-3 text-rose-600 font-bold">No (Solid Colors Only)</td>
                                    <td className="p-3 text-emerald-700 font-bold">Full Support (Linear, Radial, Images)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Inner Content / Child Elements</td>
                                    <td className="p-3 text-rose-600 font-bold">Impossible (0px Box Model)</td>
                                    <td className="p-3 text-emerald-700 font-bold">Yes (Children clipped within boundary)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Tooltip Pseudo-Element Integration</td>
                                    <td className="p-3 text-emerald-700 font-bold">Extremely Lightweight (::after)</td>
                                    <td className="p-3 text-slate-600 font-semibold">Requires Sized Pseudo Box</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">GPU Animation Interpolation</td>
                                    <td className="p-3 text-amber-600 font-semibold">Layout Reflow Triggered</td>
                                    <td className="p-3 text-emerald-700 font-bold">Hardware Accelerated Transform/Morph</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Mathematical Formulas for Equilateral Triangles */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Trigonometric Formulas for Equilateral and Scalene Triangles
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To construct an exact <strong>equilateral triangle</strong> (three 60° internal angles), standard $1:1$ pixel dimensions cannot be used because the altitude $h$ is proportional to the side length $s$ through the Pythagorean theorem:
                    </p>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Code className="w-4 h-4" /> Equilateral Altitude Derivation
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Height from Base ($W$):</span>
                                <strong className="text-indigo-300 text-sm">h = (√3 / 2) × W ≈ 0.866 × W</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Side Borders:</span>
                                <strong className="text-indigo-300 text-sm">border-left/right = W / 2</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Area of Shape ($A$):</span>
                                <strong className="text-indigo-300 text-sm">A = (√3 / 4) × W²</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Integration Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileCode className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Recipes: Tooltip Pointers, Dropdowns & UI Badges
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Implement these production-tested patterns for UI tooltips, speech bubbles, and responsive ribbons:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Recipe 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">1. Tooltip Arrow Anchor (CSS Pseudo)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Pure CSS</span>
                            </div>
                            <pre className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`.tooltip-container {
  position: relative;
}
.tooltip-container::after {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #1e293b;
}`}
                            </pre>
                        </div>

                        {/* Recipe 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">2. Responsive Tailwind Polygon Banner</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Tailwind v3/v4</span>
                            </div>
                            <pre className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`<div class="relative w-48 h-12 bg-indigo-600 text-white flex items-center justify-center font-bold [clip-path:polygon(0%_0%,100%_0%,85%_50%,100%_100%,0%_100%)]">
  Special Sale
</div>`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do pure CSS border triangles actually work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                CSS border triangles leverage the mitered (diagonal) junction where adjacent borders meet on a box with 0px width and 0px height. By setting three borders to transparent and giving one border a non-zero width and solid color, a sharp geometric triangle is rendered entirely through hardware rasterization without external images or SVG elements.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When should I use CSS clip-path over the CSS border hack?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Use CSS clip-path when you need complex n-sided polygons (stars, hexagons, trapezoids), multi-color linear or radial gradients, responsive percentage scaling, or inner content (such as text and icons). Use the CSS border method when targeting legacy browsers or styling lightweight tooltip arrows and dropdown pointers via ::before or ::after pseudo-elements.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you make an equilateral triangle with CSS borders?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An equilateral triangle has three 60-degree interior angles and three equal sides. For a base width of W, the height must mathematically equal (sqrt(3)/2) * W (approximately 0.866025 * W). In CSS borders, for an upward triangle, set border-left and border-right to (W / 2)px transparent, and border-bottom to (W * 0.866)px solid color.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I attach these CSS triangles to tooltips with pseudo-elements?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Toggle the &quot;Use ::after / ::before&quot; mode in our tool to generate standard pseudo-element CSS. The parent element receives position: relative, while the ::after pseudo-element is configured with content: &quot;&quot;, position: absolute, and the calculated border widths.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are CSS clip-path shapes GPU accelerated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Modern web browsers process CSS clip-path polygon coordinates on the GPU rasterizer pipeline. When animated with CSS transitions or keyframes, polygons render at a smooth 60–120 FPS, provided that the number of polygon vertices remains constant between keyframes.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}