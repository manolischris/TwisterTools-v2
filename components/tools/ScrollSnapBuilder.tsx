"use client";

import React, { useState, useMemo, useRef, useId } from "react";
import {
    Sliders,
    Eye,
    Code,
    Copy,
    Check,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Plus,
    Trash2,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Monitor,
    Smartphone,
    Tablet,
    Sparkles,
    MousePointerClick,
    Gauge,
    Cpu
} from "lucide-react";

type SnapTypeDirection = "x" | "y" | "both";
type SnapStrictness = "mandatory" | "proximity";
type SnapAlignment = "start" | "center" | "end";
type SnapStop = "normal" | "always";
type CarouselOrientation = "horizontal" | "vertical";
type DevicePreviewMode = "mobile" | "tablet" | "desktop";
type OutputFormat = "css" | "tailwind";

interface SlideItem {
    id: string;
    title: string;
    badge: string;
    description: string;
    gradient: string;
}

const INITIAL_SLIDES: SlideItem[] = [
    {
        id: "slide-1",
        title: "Adaptive Scroll-Snap Architecture",
        badge: "Module 01",
        description: "Zero-runtime, 60fps hardware-accelerated carousel interactions handled strictly by browser rendering engines.",
        gradient: "from-indigo-600 via-indigo-700 to-slate-900",
    },
    {
        id: "slide-2",
        title: "Strict Boundary Alignment",
        badge: "Module 02",
        description: "Enforce strict landing targets with snap-stop: always and scroll-snap-stop to prevent erratic kinetic bypass.",
        gradient: "from-violet-600 via-purple-700 to-slate-900",
    },
    {
        id: "slide-3",
        title: "Calculated Scroll Margins",
        badge: "Module 03",
        description: "Offset fixed navigation bars and sticky headers effortlessly using granular scroll-margin and scroll-padding rules.",
        gradient: "from-blue-600 via-cyan-700 to-slate-900",
    },
    {
        id: "slide-4",
        title: "Universal Touch Physics",
        badge: "Module 04",
        description: "Eliminate jitter and layout thrashing across mobile touchscreens and desktop high-precision trackpads.",
        gradient: "from-emerald-600 via-teal-700 to-slate-900",
    },
    {
        id: "slide-5",
        title: "Accessible Focus Traversals",
        badge: "Module 05",
        description: "Fully compliant with WCAG 2.1 AA keyboard focus order, interactive screen reader flows, and assistive inputs.",
        gradient: "from-rose-600 via-pink-700 to-slate-900",
    },
];

const PRESET_CONFIGURATIONS = {
    "Classic Fullscreen": {
        orientation: "horizontal" as CarouselOrientation,
        snapDirection: "x" as SnapTypeDirection,
        strictness: "mandatory" as SnapStrictness,
        snapAlign: "start" as SnapAlignment,
        snapStop: "always" as SnapStop,
        gap: 16,
        padding: 24,
        itemWidth: 100,
        scrollMargin: 0,
        hideScrollbars: true,
        smoothScroll: true,
    },
    "Card Carousel (Peek)": {
        orientation: "horizontal" as CarouselOrientation,
        snapDirection: "x" as SnapTypeDirection,
        strictness: "mandatory" as SnapStrictness,
        snapAlign: "center" as SnapAlignment,
        snapStop: "normal" as SnapStop,
        gap: 20,
        padding: 40,
        itemWidth: 80,
        scrollMargin: 12,
        hideScrollbars: false,
        smoothScroll: true,
    },
    "Proximity Feed": {
        orientation: "horizontal" as CarouselOrientation,
        snapDirection: "x" as SnapTypeDirection,
        strictness: "proximity" as SnapStrictness,
        snapAlign: "start" as SnapAlignment,
        snapStop: "normal" as SnapStop,
        gap: 16,
        padding: 16,
        itemWidth: 70,
        scrollMargin: 8,
        hideScrollbars: false,
        smoothScroll: true,
    },
    "Vertical Reel": {
        orientation: "vertical" as CarouselOrientation,
        snapDirection: "y" as SnapTypeDirection,
        strictness: "mandatory" as SnapStrictness,
        snapAlign: "start" as SnapAlignment,
        snapStop: "always" as SnapStop,
        gap: 16,
        padding: 20,
        itemWidth: 100,
        scrollMargin: 0,
        hideScrollbars: true,
        smoothScroll: true,
    },
};

export default function ScrollSnapBuilder() {
    const [orientation, setOrientation] = useState<CarouselOrientation>("horizontal");
    const [snapDirection, setSnapDirection] = useState<SnapTypeDirection>("x");
    const [strictness, setStrictness] = useState<SnapStrictness>("mandatory");
    const [snapAlign, setSnapAlign] = useState<SnapAlignment>("center");
    const [snapStop, setSnapStop] = useState<SnapStop>("always");
    const [gap, setGap] = useState<number>(20);
    const [padding, setPadding] = useState<number>(32);
    const [itemWidth, setItemWidth] = useState<number>(85);
    const [scrollMargin, setScrollMargin] = useState<number>(0);
    const [hideScrollbars, setHideScrollbars] = useState<boolean>(true);
    const [smoothScroll, setSmoothScroll] = useState<boolean>(true);
    const [deviceMode, setDeviceMode] = useState<DevicePreviewMode>("desktop");
    const [activeFormat, setActiveFormat] = useState<OutputFormat>("css");
    const [copied, setCopied] = useState<boolean>(false);
    const [slides, setSlides] = useState<SlideItem[]>(INITIAL_SLIDES);
    const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

    const gapInputId = useId();
    const paddingInputId = useId();
    const widthInputId = useId();
    const marginInputId = useId();
    const strictnessSelectId = useId();
    const alignSelectId = useId();
    const stopSelectId = useId();
    const directionSelectId = useId();

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
        const num = parseInt(cleaned, 10);
        setter(isNaN(num) ? min : Math.max(min, Math.min(max, num)));
    };

    const handleOrientationChange = (newOrientation: CarouselOrientation) => {
        setOrientation(newOrientation);
        if (newOrientation === "vertical") {
            setSnapDirection("y");
        } else {
            setSnapDirection("x");
        }
    };

    const loadPreset = (presetName: keyof typeof PRESET_CONFIGURATIONS) => {
        const p = PRESET_CONFIGURATIONS[presetName];
        setOrientation(p.orientation);
        setSnapDirection(p.snapDirection);
        setStrictness(p.strictness);
        setSnapAlign(p.snapAlign);
        setSnapStop(p.snapStop);
        setGap(p.gap);
        setPadding(p.padding);
        setItemWidth(p.itemWidth);
        setScrollMargin(p.scrollMargin);
        setHideScrollbars(p.hideScrollbars);
        setSmoothScroll(p.smoothScroll);
    };

    const handleReset = () => {
        loadPreset("Card Carousel (Peek)");
        setDeviceMode("desktop");
        setSlides(INITIAL_SLIDES);
        setCurrentSlideIndex(0);
        if (isAutoPlaying) {
            setIsAutoPlaying(false);
            if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
        }
    };

    const scrollToSlide = (index: number) => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const children = container.children;
        if (index >= 0 && index < children.length) {
            const target = children[index] as HTMLElement;
            target.scrollIntoView({
                behavior: smoothScroll ? "smooth" : "auto",
                block: orientation === "vertical" ? snapAlign : "nearest",
                inline: orientation === "horizontal" ? snapAlign : "nearest",
            });
            setCurrentSlideIndex(index);
        }
    };

    const handleNextSlide = () => {
        const next = (currentSlideIndex + 1) % slides.length;
        scrollToSlide(next);
    };

    const handlePrevSlide = () => {
        const prev = (currentSlideIndex - 1 + slides.length) % slides.length;
        scrollToSlide(prev);
    };

    const toggleAutoPlay = () => {
        if (isAutoPlaying) {
            if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
            setIsAutoPlaying(false);
        } else {
            setIsAutoPlaying(true);
            autoPlayTimerRef.current = setInterval(() => {
                setCurrentSlideIndex((prev) => {
                    const next = (prev + 1) % slides.length;
                    if (scrollContainerRef.current) {
                        const target = scrollContainerRef.current.children[next] as HTMLElement;
                        if (target) {
                            target.scrollIntoView({
                                behavior: "smooth",
                                block: orientation === "vertical" ? snapAlign : "nearest",
                                inline: orientation === "horizontal" ? snapAlign : "nearest",
                            });
                        }
                    }
                    return next;
                });
            }, 3000);
        }
    };

    const addSlide = () => {
        if (slides.length >= 10) return;
        const newIndex = slides.length + 1;
        const gradients = [
            "from-amber-600 via-orange-700 to-slate-900",
            "from-teal-600 via-cyan-700 to-slate-900",
            "from-fuchsia-600 via-purple-700 to-slate-900",
        ];
        const newSlide: SlideItem = {
            id: `slide-${Date.now()}`,
            title: `Custom Snap Element ${newIndex}`,
            badge: `Module 0${newIndex}`,
            description: "A newly injected dynamic slide testing container boundaries, kinetic friction, and snap alignment points.",
            gradient: gradients[newIndex % gradients.length],
        };
        setSlides([...slides, newSlide]);
    };

    const removeSlide = (id: string) => {
        if (slides.length <= 2) return;
        setSlides(slides.filter((s) => s.id !== id));
        setCurrentSlideIndex(0);
    };

    const generatedCss = useMemo(() => {
        const hideScrollbarRule = hideScrollbars
            ? `
/* Hide browser native scrollbars while preserving kinetic touch gestures */
.scroll-snap-container::-webkit-scrollbar {
  display: none;
}
.scroll-snap-container {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}`
            : "";

        return `/* CSS Scroll-Snap Container Architecture */
.scroll-snap-container {
  display: flex;
  flex-direction: ${orientation === "horizontal" ? "row" : "column"};
  overflow-${orientation === "horizontal" ? "x" : "y"}: auto;
  overflow-${orientation === "horizontal" ? "y" : "x"}: hidden;
  scroll-snap-type: ${snapDirection} ${strictness};
  scroll-behavior: ${smoothScroll ? "smooth" : "auto"};
  scroll-padding: ${padding}px;
  gap: ${gap}px;
  padding: ${padding}px;
  -webkit-overflow-scrolling: touch;
}${hideScrollbarRule}

/* CSS Scroll-Snap Child Item */
.scroll-snap-item {
  flex: 0 0 ${orientation === "horizontal" ? `${itemWidth}%` : "100%"};
  scroll-snap-align: ${snapAlign};
  scroll-snap-stop: ${snapStop};
  scroll-margin: ${scrollMargin}px;
}`;
    }, [
        orientation,
        snapDirection,
        strictness,
        smoothScroll,
        padding,
        gap,
        hideScrollbars,
        itemWidth,
        snapAlign,
        snapStop,
        scrollMargin,
    ]);

    const generatedTailwind = useMemo(() => {
        const baseContainer = [
            "flex",
            orientation === "horizontal" ? "flex-row overflow-x-auto overflow-y-hidden" : "flex-col overflow-y-auto overflow-x-hidden",
            strictness === "mandatory" ? (snapDirection === "x" ? "snap-x snap-mandatory" : "snap-y snap-mandatory") : (snapDirection === "x" ? "snap-x snap-proximity" : "snap-y snap-proximity"),
            smoothScroll ? "scroll-smooth" : "scroll-auto",
            `gap-[${gap}px]`,
            `p-[${padding}px]`,
            hideScrollbars ? "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" : "",
        ]
            .filter(Boolean)
            .join(" ");

        const baseChild = [
            orientation === "horizontal" ? `shrink-0 flex-[0_0_${itemWidth}%]` : "shrink-0 w-full",
            snapAlign === "center" ? "snap-center" : snapAlign === "start" ? "snap-start" : "snap-end",
            snapStop === "always" ? "snap-always" : "snap-normal",
            scrollMargin > 0 ? `scroll-m-[${scrollMargin}px]` : "",
        ]
            .filter(Boolean)
            .join(" ");

        return `<!-- Container Element -->\n<div class="${baseContainer}">\n  <!-- Slide Item (Repeat for children) -->\n  <div class="${baseChild}">\n    <!-- Child Card Content -->\n  </div>\n</div>`;
    }, [
        orientation,
        strictness,
        snapDirection,
        smoothScroll,
        gap,
        padding,
        hideScrollbars,
        itemWidth,
        snapAlign,
        snapStop,
        scrollMargin,
    ]);

    const handleCopyCode = () => {
        const content = activeFormat === "css" ? generatedCss : generatedTailwind;
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const containerInlineStyles: React.CSSProperties = {
        display: "flex",
        flexDirection: orientation === "horizontal" ? "row" : "column",
        overflowX: orientation === "horizontal" ? "auto" : "hidden",
        overflowY: orientation === "vertical" ? "auto" : "hidden",
        scrollSnapType: `${snapDirection} ${strictness}`,
        scrollBehavior: smoothScroll ? "smooth" : "auto",
        scrollPadding: `${padding}px`,
        gap: `${gap}px`,
        padding: `${padding}px`,
        scrollbarWidth: hideScrollbars ? "none" : "auto",
        msOverflowStyle: hideScrollbars ? "none" : "auto",
    };

    const childInlineStyles: React.CSSProperties = {
        flex: orientation === "horizontal" ? `0 0 ${itemWidth}%` : "0 0 100%",
        scrollSnapAlign: snapAlign,
        scrollSnapStop: snapStop,
        scrollMargin: `${scrollMargin}px`,
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Scroll-Snap Carousel & Gallery Playground",
        "url": "https://twistertools.com/tools/developer-tools/css-scroll-snap-builder",
        "description": "Interactive browser-native CSS Scroll-Snap visual builder. Construct high-performance, accessible touch sliders, carousels, and vertical page feeds with pure CSS and Tailwind export.",
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
                "name": "What is the primary advantage of CSS Scroll-Snap over JavaScript carousels?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CSS Scroll-Snap delegates kinetic deceleration, touch trajectory tracking, and visual snapping directly to the browser's compositing thread. Unlike JavaScript slider libraries (such as Swiper or Slick) that bind heavy touchmove and scroll event listeners on the main execution thread, native CSS snapping avoids layout thrashing, delivers guaranteed 60fps or 120fps hardware acceleration, and requires 0kb of runtime JavaScript dependencies."
                }
            },
            {
                "@type": "Question",
                "name": "What is the operational difference between mandatory and proximity scroll-snap-type?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 'mandatory' strictness parameter forces the browser viewport to strictly rest on a valid snap coordinate whenever resting. If no user inertia is present, it will automatically shift to the nearest target. In contrast, 'proximity' only triggers snapping if the scroll deceleration trajectory naturally terminates within a narrow perceptual threshold of an alignment point, letting the user rest between cards if desired."
                }
            },
            {
                "@type": "Question",
                "name": "Why is scroll-snap-stop: always essential for full-page sliders and stories?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "By default, browser scroll snapping uses scroll-snap-stop: normal, which allows strong flick gestures or rapid mousewheel revolutions to skip over several slides in a single continuous kinetic glide. Setting scroll-snap-stop: always instructs the compositor to catch and trap the scroll boundary at the very next snap target, ensuring users cannot accidentally skip critical narrative slides or sequential forms."
                }
            },
            {
                "@type": "Question",
                "name": "How do scroll-margin and scroll-padding resolve fixed header overlaps?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When users scroll an item into view within a viewport containing a sticky header or floating floating navigation bar, the target element can end up hidden behind the chrome. Applying scroll-padding to the parent container establishes an inner boundary inset for snap calculation, while scroll-margin on child elements introduces an individual bounding box offset without affecting standard layout geometry."
                }
            },
            {
                "@type": "Question",
                "name": "How do you ensure full accessibility and keyboard navigation on scroll-snap containers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To achieve full WCAG AA compliance, the parent scrollable container must be focusable via keyboard by providing tabindex='0' and an explicit aria-label (such as 'Interactive Carousel'). Furthermore, child items containing actionable elements (links, buttons, forms) must preserve sequential tab ordering, and developers should provide explicit Prev and Next navigation buttons with aria-controls linkages."
                }
            },
            {
                "@type": "Question",
                "name": "Can you hide native scrollbars in CSS while preserving touch swipe physics?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can hide native visual scrollbars without preventing kinetic scroll gestures by pairing scrollbar-width: none (for modern Firefox) and -ms-overflow-style: none (for legacy Edge) with the webkit vendor pseudo-selector ::-webkit-scrollbar { display: none; }. This preserves complete trackpad and touch gesture mechanics."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Asymmetric 5/7 Flexible Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration Controls (lg:col-span-5) */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    {/* Header & Reset */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-slate-900">Snap Configuration</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            Reset Defaults
                        </button>
                    </div>

                    {/* Presets Bar */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 block">Archetype Presets</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(PRESET_CONFIGURATIONS) as Array<keyof typeof PRESET_CONFIGURATIONS>).map((presetKey) => (
                                <button
                                    key={presetKey}
                                    type="button"
                                    onClick={() => loadPreset(presetKey)}
                                    className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 transition cursor-pointer text-left truncate"
                                >
                                    {presetKey}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Orientation & Snap Direction */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Carousel Axis</label>
                            <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => handleOrientationChange("horizontal")}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${orientation === "horizontal" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Horizontal (X)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOrientationChange("vertical")}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${orientation === "vertical" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Vertical (Y)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor={directionSelectId} className="text-xs font-bold text-slate-700 block">
                                scroll-snap-type
                            </label>
                            <select
                                id={directionSelectId}
                                aria-label="Snap Direction Type"
                                value={snapDirection}
                                onChange={(e) => setSnapDirection(e.target.value as SnapTypeDirection)}
                                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="x">x (Horizontal snap)</option>
                                <option value="y">y (Vertical snap)</option>
                                <option value="both">both (2D Grid snap)</option>
                            </select>
                        </div>
                    </div>

                    {/* Strictness & Alignment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor={strictnessSelectId} className="text-xs font-bold text-slate-700 block">
                                Snap Strictness
                            </label>
                            <select
                                id={strictnessSelectId}
                                aria-label="Snap Strictness"
                                value={strictness}
                                onChange={(e) => setStrictness(e.target.value as SnapStrictness)}
                                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="mandatory">mandatory (Strict Lock)</option>
                                <option value="proximity">proximity (Soft Float)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor={alignSelectId} className="text-xs font-bold text-slate-700 block">
                                scroll-snap-align
                            </label>
                            <select
                                id={alignSelectId}
                                aria-label="Snap Alignment"
                                value={snapAlign}
                                onChange={(e) => setSnapAlign(e.target.value as SnapAlignment)}
                                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="start">start (Align flush leading)</option>
                                <option value="center">center (Align middle)</option>
                                <option value="end">end (Align flush trailing)</option>
                            </select>
                        </div>
                    </div>

                    {/* Stop Behavior */}
                    <div className="space-y-1.5">
                        <label htmlFor={stopSelectId} className="text-xs font-bold text-slate-700 block">
                            scroll-snap-stop (Kinetic Bypass Guard)
                        </label>
                        <select
                            id={stopSelectId}
                            aria-label="Snap Stop Behavior"
                            value={snapStop}
                            onChange={(e) => setSnapStop(e.target.value as SnapStop)}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="always">always (Force stopping at next item)</option>
                            <option value="normal">normal (Allow multi-slide flick skip)</option>
                        </select>
                    </div>

                    {/* Numeric Geometry Sliders */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                        {/* Slide Item Basis Width */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={widthInputId}>Slide Card Width Ratio:</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={widthInputId}
                                        aria-label="Slide Width Ratio"
                                        type="number"
                                        min="40"
                                        max="100"
                                        value={itemWidth}
                                        onChange={(e) => handleNumberInput(e, setItemWidth, 40, 100)}
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-600 dark:text-slate-300 font-normal">%</span>
                                </div>
                            </div>
                            <input
                                aria-label="Adjust slide width percentage"
                                type="range"
                                min="40"
                                max="100"
                                step="1"
                                value={itemWidth}
                                onChange={(e) => setItemWidth(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Gap Distance */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={gapInputId}>Item Gap Separation:</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={gapInputId}
                                        aria-label="Gap Separation"
                                        type="number"
                                        min="0"
                                        max="64"
                                        value={gap}
                                        onChange={(e) => handleNumberInput(e, setGap, 0, 64)}
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-600 dark:text-slate-300 font-normal">px</span>
                                </div>
                            </div>
                            <input
                                aria-label="Adjust gap separation"
                                type="range"
                                min="0"
                                max="64"
                                step="2"
                                value={gap}
                                onChange={(e) => setGap(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Outer Inset Padding */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={paddingInputId}>Container Scroll Padding:</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={paddingInputId}
                                        aria-label="Container Scroll Padding"
                                        type="number"
                                        min="0"
                                        max="80"
                                        value={padding}
                                        onChange={(e) => handleNumberInput(e, setPadding, 0, 80)}
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-600 dark:text-slate-300 font-normal">px</span>
                                </div>
                            </div>
                            <input
                                aria-label="Adjust container scroll padding"
                                type="range"
                                min="0"
                                max="80"
                                step="2"
                                value={padding}
                                onChange={(e) => setPadding(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Child Scroll Margin */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={marginInputId}>Child scroll-margin Inset:</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={marginInputId}
                                        aria-label="Child Scroll Margin"
                                        type="number"
                                        min="0"
                                        max="48"
                                        value={scrollMargin}
                                        onChange={(e) => handleNumberInput(e, setScrollMargin, 0, 48)}
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-600 dark:text-slate-300 font-normal">px</span>
                                </div>
                            </div>
                            <input
                                aria-label="Adjust child scroll margin"
                                type="range"
                                min="0"
                                max="48"
                                step="2"
                                value={scrollMargin}
                                onChange={(e) => setScrollMargin(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>

                    {/* Toggles & Dynamic Slide Controls */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">Hide Native Scrollbars</label>
                            <button
                                type="button"
                                onClick={() => setHideScrollbars(!hideScrollbars)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${hideScrollbars ? "bg-indigo-600 justify-end" : "bg-slate-200 justify-start"
                                    }`}
                            >
                                <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">Smooth Kinetic Transition</label>
                            <button
                                type="button"
                                onClick={() => setSmoothScroll(!smoothScroll)}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${smoothScroll ? "bg-indigo-600 justify-end" : "bg-slate-200 justify-start"
                                    }`}
                            >
                                <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-bold text-slate-700">Active Slides ({slides.length})</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={addSlide}
                                    disabled={slides.length >= 10}
                                    className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 flex items-center gap-1 transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Slide
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Compositor Thread Ready
                        </span>
                        <span>Zero Runtime Script Deps</span>
                    </div>
                </div>

                {/* Right Panel: Interactive Canvas & Code Output (lg:col-span-7) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    {/* Visualizer Top Bar & Responsive Viewport Simulator */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-bold text-slate-900">Interactive Visualizer</h2>
                            </div>

                            {/* Viewport Width Buttons */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setDeviceMode("mobile")}
                                    className={`p-1.5 rounded-md transition cursor-pointer ${deviceMode === "mobile" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    title="Mobile View (360px)"
                                >
                                    <Smartphone className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeviceMode("tablet")}
                                    className={`p-1.5 rounded-md transition cursor-pointer ${deviceMode === "tablet" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    title="Tablet View (580px)"
                                >
                                    <Tablet className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeviceMode("desktop")}
                                    className={`p-1.5 rounded-md transition cursor-pointer ${deviceMode === "desktop" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    title="Desktop View (100%)"
                                >
                                    <Monitor className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Interactive Navigation Action Bar */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handlePrevSlide}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                    aria-label="Previous Slide"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextSlide}
                                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                    aria-label="Next Slide"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleAutoPlay}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${isAutoPlaying ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                >
                                    {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                    {isAutoPlaying ? "Pause Auto-Cycle" : "Simulate Auto-Cycle"}
                                </button>
                            </div>

                            <span className="text-xs font-mono text-slate-500">
                                Active Target: {currentSlideIndex + 1} / {slides.length}
                            </span>
                        </div>
                    </div>

                    {/* Canvas Stage Frame */}
                    <div className="flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div
                            className={`transition-all duration-300 w-full ${deviceMode === "mobile" ? "max-w-[340px]" : deviceMode === "tablet" ? "max-w-[540px]" : "max-w-full"
                                }`}
                        >
                            {/* Visual Simulated Browser Shell */}
                            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                                <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
                                        scroll-snap-type: {snapDirection} {strictness}
                                    </span>
                                    <span className="text-[11px] font-mono text-indigo-400 font-semibold">{orientation.toUpperCase()}</span>
                                </div>

                                {/* Actual Scroll Container */}
                                <div
                                    ref={scrollContainerRef}
                                    tabIndex={0}
                                    aria-label="Interactive CSS Scroll-Snap Visualizer"
                                    style={containerInlineStyles}
                                    className={`relative ${orientation === "vertical" ? "h-[360px]" : "h-[290px]"
                                        } outline-none focus:ring-1 focus:ring-indigo-500 select-none`}
                                >
                                    {slides.map((slide, index) => (
                                        <div
                                            key={slide.id}
                                            style={childInlineStyles}
                                            className={`relative rounded-xl p-5 bg-gradient-to-br ${slide.gradient} text-white shadow-lg flex flex-col justify-between border border-white/15 transition-transform shrink-0`}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px] uppercase tracking-wider backdrop-blur-xs">
                                                        {slide.badge}
                                                    </span>
                                                    {slides.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeSlide(slide.id);
                                                            }}
                                                            className="p-1 rounded bg-black/20 hover:bg-rose-500/40 text-white/70 hover:text-white transition cursor-pointer"
                                                            aria-label="Delete Slide"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <h3 className="text-base font-bold leading-tight">{slide.title}</h3>
                                                <p className="text-xs text-white/80 leading-relaxed">{slide.description}</p>
                                            </div>

                                            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/70">
                                                <span className="font-mono">Align: {snapAlign}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => scrollToSlide(index)}
                                                    className="px-2 py-1 rounded bg-white/15 hover:bg-white/25 text-white font-semibold flex items-center gap-1 transition cursor-pointer"
                                                >
                                                    <MousePointerClick className="w-3 h-3" /> Snap Target
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Simulated Stage Pagination Dots */}
                                <div className="bg-slate-900/90 py-2.5 px-4 border-t border-slate-800 flex items-center justify-center gap-1.5">
                                    {slides.map((_, i) => (
                                        <button
                                            key={`dot-${i}`}
                                            type="button"
                                            onClick={() => scrollToSlide(i)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${currentSlideIndex === i ? "w-6 bg-indigo-500" : "bg-slate-600 hover:bg-slate-400"
                                                }`}
                                            aria-label={`Jump to slide ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Generated Code Output Box */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Export Production Syntax</span>
                            </div>
                            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setActiveFormat("css")}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${activeFormat === "css" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                        }`}
                                >
                                    Standard CSS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveFormat("tailwind")}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${activeFormat === "tailwind" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                        }`}
                                >
                                    Tailwind CSS
                                </button>
                            </div>
                        </div>

                        <div className="relative group">
                            <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs leading-relaxed overflow-x-auto min-h-[160px] max-h-[220px] border border-slate-800">
                                {activeFormat === "css" ? generatedCss : generatedTailwind}
                            </pre>
                            <button
                                type="button"
                                onClick={handleCopyCode}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm border border-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied!" : "Copy Code"}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                            CSS Scroll Snap Module Level 1
                        </span>
                        <button
                            type="button"
                            onClick={handleCopyCode}
                            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <Copy className="w-3 h-3" /> Quick Copy
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Mechanical Anatomy of CSS Scroll Snap: Fluid Deceleration and Compositor Physics
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Historically, implementing sliding carousels, responsive galleries, and full-viewport presentations required heavy JavaScript libraries that hijacked native user scrolling. By tracking raw wheel, touchstart, and touchmove events on the browser main execution thread, these legacy implementations introduced noticeable input lag, broke OS-level kinetic inertia, and triggered recurring layout recalculations. The W3C CSS Scroll Snap Module completely resolves this problem by moving scroll boundaries into the GPU compositor.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Gauge className="w-4 h-4 text-indigo-600" /> Native 120 FPS Compositing
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Snapping mathematical vectors are resolved directly by hardware display pipelines, preserving buttery smooth tactile feedback across 120Hz ProMotion and high-refresh Android screens.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Kinetic Deceleration
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Users preserve their operating system&apos;s natural friction curves, elastic rubber-banding overscroll boundaries, and device-specific gesture momentum.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Zero JS Bundle Weight
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Avoid loading 30KB to 70KB of bulky third-party script bundles, reducing Total Blocking Time (TBT) and optimizing Google Core Web Vitals instantly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Comparison Matrix */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Monitor className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Performance: Native CSS Scroll Snap vs JavaScript Slider Libraries
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting between native declarative CSS snapping and script-based carousel frameworks depends on architectural complexity and interaction fidelity:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Feature Metric</th>
                                    <th className="p-3">Native CSS Scroll Snap</th>
                                    <th className="p-3">JavaScript Sliders (Swiper / Slick)</th>
                                    <th className="p-3">Performance Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Execution Thread</td>
                                    <td className="p-3 text-emerald-600 font-bold">Compositor Thread (Off-Main)</td>
                                    <td className="p-3 text-rose-600 font-bold">Main JS Execution Thread</td>
                                    <td className="p-3">CSS avoids event queue jank entirely</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Bundle Size</td>
                                    <td className="p-3 text-emerald-600 font-bold">0 KB (Zero overhead)</td>
                                    <td className="p-3 text-amber-600 font-bold">35 KB – 90 KB gzipped</td>
                                    <td className="p-3">Massive reduction in script parse/compile</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Trackpad & Touch Physics</td>
                                    <td className="p-3 text-emerald-600 font-bold">100% Native OS Mechanics</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400 font-bold">Simulated / Emulated curves</td>
                                    <td className="p-3">CSS eliminates unnatural float and stutter</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Infinite Looping Clones</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400 font-bold">Requires light DOM wrap script</td>
                                    <td className="p-3 text-emerald-600 font-bold">Built-in virtual DOM duplication</td>
                                    <td className="p-3">JS excels at seamless infinite looping</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Engineering Best Practices & Antipatterns */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Engineering Guidelines: Best Practices & Common Implementation Pitfalls
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        To construct flawless production layouts, front-end engineers must configure container properties correctly alongside child item alignment coordinates:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Apply scroll-padding on Parent:</strong> Always define <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">scroll-padding</code> equal to your container padding to prevent slides from snapping flush against the container border.
                                </li>
                                <li>
                                    • <strong>Use scroll-snap-stop: always for Stories:</strong> Prevent high-velocity swipes from skipping multiple viewports during step-by-step onboarding sequences.
                                </li>
                                <li>
                                    • <strong>Include tabIndex=&quot;0&quot;:</strong> Allow keyboard users to easily focus the container and navigate slides using standard arrow keys.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Antipatterns to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Oversized Child Widths:</strong> Setting child widths larger than the container width with <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">scroll-snap-align: center</code> can trap users between unreadable edges.
                                </li>
                                <li>
                                    • <strong>Forgetting min-w-0 on Flex Containers:</strong> In modern CSS flexbox grids, nested containers will overflow viewports on mobile unless explicitly constrained.
                                </li>
                                <li>
                                    • <strong>Disabling Touch Gestures:</strong> Never attach <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">touch-action: none</code> or block default gesture events on scroll snap parents.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                What is the primary advantage of CSS Scroll-Snap over JavaScript carousels?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                CSS Scroll-Snap delegates kinetic deceleration, touch trajectory tracking, and visual snapping directly to the browser&apos;s compositing thread. Unlike JavaScript slider libraries (such as Swiper or Slick) that bind heavy touchmove and scroll event listeners on the main execution thread, native CSS snapping avoids layout thrashing, delivers guaranteed 60fps or 120fps hardware acceleration, and requires 0kb of runtime JavaScript dependencies.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the operational difference between mandatory and proximity scroll-snap-type?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The &apos;mandatory&apos; strictness parameter forces the browser viewport to strictly rest on a valid snap coordinate whenever resting. If no user inertia is present, it will automatically shift to the nearest target. In contrast, &apos;proximity&apos; only triggers snapping if the scroll deceleration trajectory naturally terminates within a narrow perceptual threshold of an alignment point, letting the user rest between cards if desired.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why is scroll-snap-stop: always essential for full-page sliders and stories?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                By default, browser scroll snapping uses scroll-snap-stop: normal, which allows strong flick gestures or rapid mousewheel revolutions to skip over several slides in a single continuous kinetic glide. Setting scroll-snap-stop: always instructs the compositor to catch and trap the scroll boundary at the very next snap target, ensuring users cannot accidentally skip critical narrative slides or sequential forms.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do scroll-margin and scroll-padding resolve fixed header overlaps?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                When users scroll an item into view within a viewport containing a sticky header or floating floating navigation bar, the target element can end up hidden behind the chrome. Applying scroll-padding to the parent container establishes an inner boundary inset for snap calculation, while scroll-margin on child elements introduces an individual bounding box offset without affecting standard layout geometry.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do you ensure full accessibility and keyboard navigation on scroll-snap containers?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                To achieve full WCAG AA compliance, the parent scrollable container must be focusable via keyboard by providing tabindex=&quot;0&quot; and an explicit aria-label (such as &quot;Interactive Carousel&quot;). Furthermore, child items containing actionable elements (links, buttons, forms) must preserve sequential tab ordering, and developers should provide explicit Prev and Next navigation buttons with aria-controls linkages.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can you hide native scrollbars in CSS while preserving touch swipe physics?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. You can hide native visual scrollbars without preventing kinetic scroll gestures by pairing scrollbar-width: none (for modern Firefox) and -ms-overflow-style: none (for legacy Edge) with the webkit vendor pseudo-selector ::-webkit-scrollbar &#123; display: none; &#125;. This preserves complete trackpad and touch gesture mechanics.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}