"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Play,
    Pause,
    RotateCcw,
    Copy,
    Check,
    Code,
    Sliders,
    Sparkles,
    Eye,
    Layers,
    Cpu,
    Plus,
    Trash2,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    Monitor,
    Zap,
    Move
} from "lucide-react";

type TimingFunction =
    | "linear"
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "cubic-bezier(0.68,-0.55,0.27,1.55)";

type DirectionType = "normal" | "reverse" | "alternate" | "alternate-reverse";
type FillModeType = "none" | "forwards" | "backwards" | "both";
type IterationCount = "infinite" | number;
type OutputFormat = "css" | "tailwind";
type TargetShape = "card" | "circle" | "badge" | "cube";

interface KeyframeStep {
    id: string;
    percentage: number;
    translateX: number; // -150px to 150px
    translateY: number; // -150px to 150px
    scale: number; // 0.2 to 2.5
    rotate: number; // -360deg to 360deg
    opacity: number; // 0 to 100
    backgroundColor: string;
}

interface AnimationConfig {
    name: string;
    duration: number; // 0.1s - 10s
    delay: number; // 0s - 5s
    timingFunction: TimingFunction;
    iterationCount: IterationCount;
    direction: DirectionType;
    fillMode: FillModeType;
}

const PRESET_ANIMATIONS: Record<string, { config: Partial<AnimationConfig>; keyframes: KeyframeStep[] }> = {
    "Pulse & Glow": {
        config: {
            name: "pulseGlow",
            duration: 1.5,
            timingFunction: "ease-in-out",
            iterationCount: "infinite",
            direction: "alternate",
        },
        keyframes: [
            { id: "1", percentage: 0, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 90, backgroundColor: "#4f46e5" },
            { id: "2", percentage: 50, translateX: 0, translateY: -10, scale: 1.15, rotate: 3, opacity: 100, backgroundColor: "#7c3aed" },
            { id: "3", percentage: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 90, backgroundColor: "#4f46e5" },
        ],
    },
    "Bouncy Pop": {
        config: {
            name: "bouncyPop",
            duration: 1.2,
            timingFunction: "cubic-bezier(0.68,-0.55,0.27,1.55)",
            iterationCount: "infinite",
            direction: "normal",
        },
        keyframes: [
            { id: "1", percentage: 0, translateX: 0, translateY: 0, scale: 0.5, rotate: -15, opacity: 0, backgroundColor: "#06b6d4" },
            { id: "2", percentage: 60, translateX: 0, translateY: -25, scale: 1.2, rotate: 5, opacity: 100, backgroundColor: "#3b82f6" },
            { id: "3", percentage: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 100, backgroundColor: "#4f46e5" },
        ],
    },
    "Floating Hover": {
        config: {
            name: "floatingCard",
            duration: 2.5,
            timingFunction: "ease-in-out",
            iterationCount: "infinite",
            direction: "alternate",
        },
        keyframes: [
            { id: "1", percentage: 0, translateX: 0, translateY: 15, scale: 0.98, rotate: -2, opacity: 95, backgroundColor: "#6366f1" },
            { id: "2", percentage: 50, translateX: 5, translateY: -15, scale: 1.02, rotate: 2, opacity: 100, backgroundColor: "#4f46e5" },
            { id: "3", percentage: 100, translateX: 0, translateY: 15, scale: 0.98, rotate: -2, opacity: 95, backgroundColor: "#6366f1" },
        ],
    },
    "Spin & Expand": {
        config: {
            name: "spinExpand",
            duration: 2.0,
            timingFunction: "ease-in-out",
            iterationCount: "infinite",
            direction: "normal",
        },
        keyframes: [
            { id: "1", percentage: 0, translateX: 0, translateY: 0, scale: 0.8, rotate: 0, opacity: 50, backgroundColor: "#ec4899" },
            { id: "2", percentage: 50, translateX: 0, translateY: 0, scale: 1.25, rotate: 180, opacity: 100, backgroundColor: "#8b5cf6" },
            { id: "3", percentage: 100, translateX: 0, translateY: 0, scale: 0.8, rotate: 360, opacity: 50, backgroundColor: "#ec4899" },
        ],
    },
};

const DEFAULT_CONFIG: AnimationConfig = {
    name: "customAnimation",
    duration: 1.8,
    delay: 0,
    timingFunction: "ease-in-out",
    iterationCount: "infinite",
    direction: "alternate",
    fillMode: "both",
};

const DEFAULT_KEYFRAMES: KeyframeStep[] = [
    { id: "step-0", percentage: 0, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 100, backgroundColor: "#4f46e5" },
    { id: "step-50", percentage: 50, translateX: 0, translateY: -30, scale: 1.12, rotate: 8, opacity: 90, backgroundColor: "#818cf8" },
    { id: "step-100", percentage: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 100, backgroundColor: "#4f46e5" },
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min: number,
    max: number,
    isFloat = false
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(min);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const parsed = isFloat ? parseFloat(cleaned) : parseInt(cleaned, 10);
    if (isNaN(parsed)) {
        setter(min);
        return;
    }
    setter(Math.max(min, Math.min(max, parsed)));
};

export default function CssAnimationGenerator() {
    const [config, setConfig] = useState<AnimationConfig>(DEFAULT_CONFIG);
    const [keyframes, setKeyframes] = useState<KeyframeStep[]>(DEFAULT_KEYFRAMES);
    const [activeKeyframeIndex, setActiveKeyframeIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [targetShape, setTargetShape] = useState<TargetShape>("card");
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("css");
    const [copied, setCopied] = useState<boolean>(false);

    const durationInputId = useId();
    const delayInputId = useId();
    const activeStep = keyframes[activeKeyframeIndex] || keyframes[0];

    const sortedKeyframes = useMemo(() => {
        return [...keyframes].sort((a, b) => a.percentage - b.percentage);
    }, [keyframes]);

    const generatedKeyframesCss = useMemo(() => {
        const steps = sortedKeyframes
            .map((kf) => {
                const transform = `translate3d(${kf.translateX}px, ${kf.translateY}px, 0) scale(${kf.scale}) rotate(${kf.rotate}deg)`;
                const opacity = (kf.opacity / 100).toFixed(2);
                return `  ${kf.percentage}% {
    transform: ${transform};
    opacity: ${opacity};
    background-color: ${kf.backgroundColor};
  }`;
            })
            .join("\n");

        return `@keyframes ${config.name} {\n${steps}\n}`;
    }, [sortedKeyframes, config.name]);

    const generatedRuleCss = useMemo(() => {
        const count = config.iterationCount === "infinite" ? "infinite" : config.iterationCount;
        return `.${config.name} {
  animation-name: ${config.name};
  animation-duration: ${config.duration}s;
  animation-timing-function: ${config.timingFunction};
  animation-delay: ${config.delay}s;
  animation-iteration-count: ${count};
  animation-direction: ${config.direction};
  animation-fill-mode: ${config.fillMode};
  will-change: transform, opacity;
}`;
    }, [config]);

    const fullExportCss = useMemo(() => {
        return `/* TwisterTools CSS Keyframe Export */\n${generatedKeyframesCss}\n\n${generatedRuleCss}`;
    }, [generatedKeyframesCss, generatedRuleCss]);

    const generatedTailwindConfig = useMemo(() => {
        const keyframeObj = sortedKeyframes.reduce<Record<string, Record<string, string>>>((acc, kf) => {
            acc[`${kf.percentage}%`] = {
                transform: `translate3d(${kf.translateX}px, ${kf.translateY}px, 0) scale(${kf.scale}) rotate(${kf.rotate}deg)`,
                opacity: `${(kf.opacity / 100).toFixed(2)}`,
                backgroundColor: kf.backgroundColor,
            };
            return acc;
        }, {});

        const count = config.iterationCount === "infinite" ? "infinite" : config.iterationCount;
        const animationValue = `${config.name} ${config.duration}s ${config.timingFunction} ${config.delay}s ${count} ${config.direction} ${config.fillMode}`;

        return `// tailwind.config.js snippet
module.exports = {
  theme: {
    extend: {
      keyframes: {
        ${config.name}: ${JSON.stringify(keyframeObj, null, 8).replace(/"([^"]+)":/g, "$1:")}
      },
      animation: {
        ${config.name}: '${animationValue}'
      }
    }
  }
};`;
    }, [sortedKeyframes, config]);

    const handleCopy = () => {
        const code = outputFormat === "css" ? fullExportCss : generatedTailwindConfig;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        setKeyframes(DEFAULT_KEYFRAMES);
        setActiveKeyframeIndex(0);
        setIsPlaying(true);
    };

    const loadPreset = (presetName: string) => {
        const preset = PRESET_ANIMATIONS[presetName];
        if (preset) {
            setConfig((prev) => ({ ...prev, ...preset.config }));
            setKeyframes(preset.keyframes);
            setActiveKeyframeIndex(0);
            setIsPlaying(true);
        }
    };

    const updateActiveKeyframe = (patch: Partial<KeyframeStep>) => {
        setKeyframes((prev) => {
            const next = [...prev];
            next[activeKeyframeIndex] = { ...next[activeKeyframeIndex], ...patch };
            return next;
        });
    };

    const addKeyframe = () => {
        if (keyframes.length >= 8) return;
        const usedPercentages = keyframes.map((k) => k.percentage);
        let candidate = 25;
        while (usedPercentages.includes(candidate) && candidate < 95) {
            candidate += 10;
        }
        const newStep: KeyframeStep = {
            id: `step-${Date.now()}`,
            percentage: Math.min(candidate, 95),
            translateX: 0,
            translateY: -15,
            scale: 1.05,
            rotate: 0,
            opacity: 100,
            backgroundColor: "#6366f1",
        };
        const updated = [...keyframes, newStep].sort((a, b) => a.percentage - b.percentage);
        setKeyframes(updated);
        setActiveKeyframeIndex(updated.findIndex((s) => s.id === newStep.id));
    };

    const removeKeyframe = (index: number) => {
        if (keyframes.length <= 2) return;
        const updated = keyframes.filter((_, idx) => idx !== index);
        setKeyframes(updated);
        setActiveKeyframeIndex(Math.max(0, index - 1));
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Keyframe Animation Visualizer & Code Exporter",
        "url": "https://twistertools.com/tools/developer-tools/css-animation-generator",
        "description": "Visual CSS Keyframe Animation Generator and Real-time Timeline Studio. Build smooth 60 FPS GPU-accelerated CSS animations with production CSS and Tailwind config export.",
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
                "name": "Why is animating transform and opacity vastly superior to animating top, left, or margin?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modifying layout properties like top, left, width, or margin forces the browser rendering engine to re-execute Layout (Reflow) and Paint across affected render tree nodes. In contrast, transform (translate3d, scale, rotate) and opacity are handled directly during the Compositing phase on the GPU. This eliminates CPU reflow bottlenecks and guarantees smooth 60fps rendering without jank."
                }
            },
            {
                "@type": "Question",
                "name": "What does will-change: transform do for CSS animation performance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The will-change CSS property notifies the browser rendering engine in advance that an element will undergo transformation. The browser promotes the element to its own dedicated GPU composite layer before the animation begins, avoiding costly layer creation mid-flight. However, it should only be used on animating elements and not globally across all DOM nodes."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between forwards, backwards, and both in animation-fill-mode?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "animation-fill-mode controls what styles apply to an element before execution begins and after completion. 'forwards' keeps the styles applied at the final keyframe (100%) after completion. 'backwards' applies the initial 0% keyframe styles during any animation-delay window. 'both' applies backwards before start and forwards upon finish."
                }
            },
            {
                "@type": "Question",
                "name": "How do cubic-bezier curves provide elastic and bounce effects?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard easing curves like linear or ease-in-out are clamped between 0.0 and 1.0 on the time axis. Custom cubic-bezier functions like cubic-bezier(0.68, -0.55, 0.27, 1.55) push control points below 0.0 or above 1.0 on the progress axis, causing the rendered value to intentionally overshoot its target before settling into place."
                }
            },
            {
                "@type": "Question",
                "name": "How do I implement prefers-reduced-motion for CSS keyframe animations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Wrap non-essential animations inside @media (prefers-reduced-motion: no-preference). For users who have enabled motion sensitivity settings in their OS, you can either completely disable the animation with animation: none !important or replace spatial translation with an accessible cross-fade."
                }
            },
            {
                "@type": "Question",
                "name": "Can I export these CSS keyframes directly into Tailwind CSS configuration?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Switch the Export Syntax toggle from 'Raw CSS' to 'Tailwind CSS'. The visualizer automatically compiles your percentage keyframes into a structured JavaScript object compatible with Tailwind v3 and v4 theme.extend.keyframes and theme.extend.animation configurations."
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

            {/* Dynamic Inline CSS Style Injection for Live Rendering */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
            ${generatedKeyframesCss}
            .stage-anim-target {
              animation: ${config.name} ${config.duration}s ${config.timingFunction} ${config.delay}s ${config.iterationCount} ${config.direction} ${config.fillMode};
              animation-play-state: ${isPlaying ? "running" : "paused"};
              will-change: transform, opacity;
            }
          `,
                }}
            />

            {/* Top Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Keyframe Timeline & Transform Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header & Preset Switchers */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    Timeline & Keyframe Properties
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    Reset
                                </button>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-slate-500 font-medium">Presets:</span>
                                {Object.keys(PRESET_ANIMATIONS).map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => loadPreset(preset)}
                                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visual Keyframe Step Selector Strip */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" /> Keyframe Nodes ({keyframes.length}/8)
                                </label>
                                <button
                                    type="button"
                                    onClick={addKeyframe}
                                    disabled={keyframes.length >= 8}
                                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Step
                                </button>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
                                {sortedKeyframes.map((kf, idx) => {
                                    const isActive = idx === activeKeyframeIndex;
                                    return (
                                        <button
                                            key={kf.id}
                                            type="button"
                                            onClick={() => setActiveKeyframeIndex(idx)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${isActive
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                                }`}
                                        >
                                            <span>{kf.percentage}%</span>
                                            <span
                                                className="w-2.5 h-2.5 rounded-full border border-black/20"
                                                style={{ backgroundColor: kf.backgroundColor }}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active Step Property Configurator */}
                        {activeStep && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                        Editing Step: <span className="text-indigo-600">{activeStep.percentage}%</span>
                                    </span>
                                    {keyframes.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeKeyframe(activeKeyframeIndex)}
                                            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    )}
                                </div>

                                {/* Step Percentage Position Slider */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium text-slate-700">
                                        <span>Keyframe Timeline Point:</span>
                                        <span className="font-mono font-bold">{activeStep.percentage}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={activeStep.percentage}
                                        onChange={(e) =>
                                            updateActiveKeyframe({ percentage: Number(e.target.value) })
                                        }
                                        className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                {/* Translation Controls (X & Y) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-700">
                                            <span>Translate X:</span>
                                            <span className="font-mono font-bold">{activeStep.translateX}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-150"
                                            max="150"
                                            step="1"
                                            value={activeStep.translateX}
                                            onChange={(e) =>
                                                updateActiveKeyframe({ translateX: Number(e.target.value) })
                                            }
                                            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-700">
                                            <span>Translate Y:</span>
                                            <span className="font-mono font-bold">{activeStep.translateY}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-150"
                                            max="150"
                                            step="1"
                                            value={activeStep.translateY}
                                            onChange={(e) =>
                                                updateActiveKeyframe({ translateY: Number(e.target.value) })
                                            }
                                            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>

                                {/* Scale & Rotation Controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-700">
                                            <span>Scale:</span>
                                            <span className="font-mono font-bold">{activeStep.scale}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.2"
                                            max="2.5"
                                            step="0.05"
                                            value={activeStep.scale}
                                            onChange={(e) =>
                                                updateActiveKeyframe({ scale: Number(e.target.value) })
                                            }
                                            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-700">
                                            <span>Rotate:</span>
                                            <span className="font-mono font-bold">{activeStep.rotate}°</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-360"
                                            max="360"
                                            step="5"
                                            value={activeStep.rotate}
                                            onChange={(e) =>
                                                updateActiveKeyframe({ rotate: Number(e.target.value) })
                                            }
                                            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>

                                {/* Opacity & Color Controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-700">
                                            <span>Opacity:</span>
                                            <span className="font-mono font-bold">{activeStep.opacity}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={activeStep.opacity}
                                            onChange={(e) =>
                                                updateActiveKeyframe({ opacity: Number(e.target.value) })
                                            }
                                            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700 block">Target Color</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={activeStep.backgroundColor}
                                                onChange={(e) =>
                                                    updateActiveKeyframe({ backgroundColor: e.target.value })
                                                }
                                                className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5 bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={activeStep.backgroundColor}
                                                onChange={(e) =>
                                                    updateActiveKeyframe({ backgroundColor: e.target.value })
                                                }
                                                className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Global Animation Properties */}
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                                Global Animation Directive
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <label htmlFor={durationInputId}>Duration:</label>
                                        <span className="font-mono text-slate-600">{config.duration}s</span>
                                    </div>
                                    <input
                                        id={durationInputId}
                                        type="range"
                                        min="0.2"
                                        max="6"
                                        step="0.1"
                                        value={config.duration}
                                        onChange={(e) =>
                                            handleNumberInput(e, (v) => setConfig((p) => ({ ...p, duration: v })), 0.2, 6, true)
                                        }
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <label htmlFor={delayInputId}>Delay:</label>
                                        <span className="font-mono text-slate-600">{config.delay}s</span>
                                    </div>
                                    <input
                                        id={delayInputId}
                                        type="range"
                                        min="0"
                                        max="3"
                                        step="0.1"
                                        value={config.delay}
                                        onChange={(e) =>
                                            handleNumberInput(e, (v) => setConfig((p) => ({ ...p, delay: v })), 0, 3, true)
                                        }
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700 block">Easing Curve</label>
                                    <select
                                        value={config.timingFunction}
                                        onChange={(e) =>
                                            setConfig((p) => ({ ...p, timingFunction: e.target.value as TimingFunction }))
                                        }
                                        className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                                    >
                                        <option value="ease">ease</option>
                                        <option value="linear">linear</option>
                                        <option value="ease-in">ease-in</option>
                                        <option value="ease-out">ease-out</option>
                                        <option value="ease-in-out">ease-in-out</option>
                                        <option value="cubic-bezier(0.68,-0.55,0.27,1.55)">cubic-bezier (Bounce)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700 block">Direction</label>
                                    <select
                                        value={config.direction}
                                        onChange={(e) =>
                                            setConfig((p) => ({ ...p, direction: e.target.value as DirectionType }))
                                        }
                                        className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                                    >
                                        <option value="normal">normal</option>
                                        <option value="reverse">reverse</option>
                                        <option value="alternate">alternate</option>
                                        <option value="alternate-reverse">alternate-reverse</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-700 block">Fill Mode</label>
                                    <select
                                        value={config.fillMode}
                                        onChange={(e) =>
                                            setConfig((p) => ({ ...p, fillMode: e.target.value as FillModeType }))
                                        }
                                        className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                                    >
                                        <option value="both">both</option>
                                        <option value="forwards">forwards</option>
                                        <option value="backwards">backwards</option>
                                        <option value="none">none</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Hardware Accelerated (GPU Composited)
                        </span>
                        <span>CSS3 & Tailwind v3/v4</span>
                    </div>
                </div>

                {/* Right Panel: Live Visualizer Stage & Code Export */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Stage Controls Header */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-indigo-600" />
                                    Real-Time Animation Stage
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer shadow-xs ${isPlaying
                                            ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                        }`}
                                >
                                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                    {isPlaying ? "Pause" : "Play"}
                                </button>
                            </div>

                            {/* Target Mesh/Element Selector */}
                            <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl">
                                {(["card", "circle", "badge", "cube"] as TargetShape[]).map((shape) => (
                                    <button
                                        key={shape}
                                        type="button"
                                        onClick={() => setTargetShape(shape)}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition cursor-pointer text-center ${targetShape === shape
                                                ? "bg-white text-indigo-600 shadow-xs font-bold"
                                                : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {shape}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Canvas Stage */}
                        <div className="relative w-full h-80 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-800 [background-image:radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:24px_24px]">
                            {/* Target Element with dynamic CSS animation */}
                            <div
                                key={`${config.name}-${config.duration}-${config.timingFunction}-${sortedKeyframes.length}`}
                                className={`stage-anim-target flex flex-col items-center justify-center select-none shadow-2xl transition-[border-radius] duration-200 ${targetShape === "card"
                                        ? "w-44 h-36 rounded-2xl p-4 text-white"
                                        : targetShape === "circle"
                                            ? "w-36 h-36 rounded-full text-white"
                                            : targetShape === "badge"
                                                ? "px-6 py-3 rounded-full text-white font-bold"
                                                : "w-32 h-32 rounded-xl text-white"
                                    }`}
                            >
                                <Sparkles className="w-6 h-6 mb-1 drop-shadow-md" />
                                <span className="text-xs font-bold font-mono tracking-wider drop-shadow-sm">
                                    {config.name}
                                </span>
                                {targetShape === "card" && (
                                    <span className="text-[10px] opacity-80 mt-1">GPU Composited</span>
                                )}
                            </div>

                            {/* Stage Axis Guides */}
                            <div className="absolute inset-0 pointer-events-none border border-slate-800/80" />
                            <div className="absolute top-1/2 w-full h-px bg-slate-800/60 pointer-events-none" />
                            <div className="absolute left-1/2 h-full w-px bg-slate-800/60 pointer-events-none" />
                        </div>

                        {/* Code Export Format Options */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Generated Export
                                    </span>
                                </div>
                                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setOutputFormat("css")}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${outputFormat === "css"
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Raw CSS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOutputFormat("tailwind")}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${outputFormat === "tailwind"
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Tailwind Config
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs leading-relaxed overflow-x-auto min-h-[140px] max-h-[160px] border border-slate-800">
                                    {outputFormat === "css" ? fullExportCss : generatedTailwindConfig}
                                </pre>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm border border-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied!" : "Copy Code"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            W3C CSS Animations Level 1 Spec
                        </span>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <Copy className="w-3 h-3" /> Quick Copy
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations & Browser Compositor Physics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Architecture of High-Performance CSS Animations: Compositing, GPU Acceleration, and Keyframes
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern web browsers execute visual rendering through a multi-tier pipeline: DOM tree construction, style recalculation, Layout (geometry and reflow), Paint (rasterizing vector paths and fonts into bitmaps), and Compositing (assembling layers on the GPU). To achieve silky-smooth 60 FPS (and 120 FPS on modern ProMotion displays), keyframe animations must bypass Layout and Paint entirely, executing exclusively within the Compositing engine.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Move className="w-4 h-4 text-indigo-600" /> Transform Matrix
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                By relying on <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">translate3d()</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">scale()</code>, and <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">rotate()</code>, the browser shifts geometry on dedicated GPU textures without triggering CPU-bound reflow calculations.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600" /> Layer Alpha Channel
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Animating <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">opacity</code> modifies the surface blend multiplier directly in GPU shaders, allowing seamless fades and dissolved transitions without disturbing neighboring DOM elements.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Compositor Promotion
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Declaring <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">will-change: transform, opacity</code> hints to the browser compositor to isolate the animating element onto an independent hardware layer before execution begins.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Code className="w-4 h-4" /> Production Keyframe Anatomy
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            A production-grade CSS keyframe animation separates the definition of trajectory points (@keyframes) from the execution directive (animation property bundle), ensuring reusability and maximum performance:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`@keyframes floatElevation {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate3d(0, -20px, 0) scale(1.05);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 1;
  }
}

.animated-element {
  animation: floatElevation 2s ease-in-out infinite alternate both;
  will-change: transform, opacity;
}`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Performance: CSS Keyframes vs JavaScript & Web Animations API
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct animation runtime is vital for web application performance. While JavaScript engines offer programmatic callbacks, native CSS animations execute off the main thread on the browser&apos;s compositor process, preventing jank during heavy JavaScript execution:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Methodology</th>
                                    <th className="p-3">Thread Execution</th>
                                    <th className="p-3">Main-Thread Blocking Risk</th>
                                    <th className="p-3">Bundle Footprint</th>
                                    <th className="p-3">Ideal Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">CSS @keyframes</td>
                                    <td className="p-3 text-emerald-600 font-bold">Compositor Thread</td>
                                    <td className="p-3 text-emerald-600 font-bold">Zero (Immune to JS lag)</td>
                                    <td className="p-3 font-mono text-slate-600">0 KB (Native CSS)</td>
                                    <td className="p-3">Micro-interactions, loaders, ambient loops</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Web Animations API (WAAPI)</td>
                                    <td className="p-3">Compositor Thread</td>
                                    <td className="p-3 text-emerald-600 font-bold">Low (Setup on JS only)</td>
                                    <td className="p-3 font-mono text-slate-600">0 KB (Native browser API)</td>
                                    <td className="p-3">Dynamic runtime keyframes, gesture dragging</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Framer Motion / GSAP</td>
                                    <td className="p-3">Main JS Thread (RAF)</td>
                                    <td className="p-3 text-amber-600 font-bold">Moderate (Locks under heavy task)</td>
                                    <td className="p-3 font-mono text-rose-600">30 KB - 70 KB</td>
                                    <td className="p-3">Complex timeline orchestration, physics layouts</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">requestAnimationFrame</td>
                                    <td className="p-3">Main JS Thread</td>
                                    <td className="p-3 text-rose-600 font-bold">High (Subject to event loop lag)</td>
                                    <td className="p-3 font-mono text-slate-600">Custom Code</td>
                                    <td className="p-3">Canvas 2D / WebGL game loop rendering</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Easing Functions & Mathematical Curves */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mastering Timing Functions: Cubic Bézier Mathematics & Natural Physics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In the physical world, objects never accelerate or decelerate instantly. CSS timing functions define how progress values map across time. Understanding Bézier spline coordinates enables developers to create organic, tactile user experiences:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Standard Easing Archetypes
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>linear:</strong> Constant velocity throughout. Essential for infinite spinners and progress bars, but unnatural for spatial UI movements.
                                </li>
                                <li>
                                    • <strong>ease-out:</strong> Rapid initial burst followed by gentle deceleration. Ideal for modal entrances and drawer openings entering the viewport.
                                </li>
                                <li>
                                    • <strong>ease-in-out:</strong> Gradual acceleration and deceleration. Best suited for ambient floating objects, pulsing indicators, and breathing animations.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Elastic Overshoot Curves
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Spring Simulation:</strong> By setting Y-coordinates above 1.0 (such as <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">cubic-bezier(0.68, -0.55, 0.27, 1.55)</code>), the element intentionally overshoots its destination before snapping back.
                                </li>
                                <li>
                                    • <strong>Anticipation:</strong> Setting initial coordinates below 0.0 creates an &quot;anticipation wind-up&quot; effect before launching forward.
                                </li>
                                <li>
                                    • <strong>Snappiness:</strong> Keeping total animation durations under 350ms ensures playful personality without frustrating users waiting for UI interactions.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Accessibility and Reduced Motion */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            WCAG 2.2 Accessibility Compliance & prefers-reduced-motion
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Vestibular motion disorders can cause dizziness, nausea, and disorientation when users encounter intense spatial translations, rapid zooming, or infinite parallax movement. Under WCAG 2.2 Success Criterion 2.3.3 (Animation from Interactions), websites must respect the operating system&apos;s reduced motion configuration.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Universal CSS Reduced-Motion Reset Pattern</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Implement media queries that gracefully neutralize movement while preserving subtle, non-disorienting opacity fades for essential state feedback:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended FAQ */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is animating transform and opacity vastly superior to animating top, left, or margin?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Modifying layout properties like top, left, width, or margin forces the browser rendering engine to re-execute Layout (Reflow) and Paint across affected render tree nodes. In contrast, transform (translate3d, scale, rotate) and opacity are handled directly during the Compositing phase on the GPU. This eliminates CPU reflow bottlenecks and guarantees smooth 60fps rendering without jank.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What does will-change: transform do for CSS animation performance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The will-change CSS property notifies the browser rendering engine in advance that an element will undergo transformation. The browser promotes the element to its own dedicated GPU composite layer before the animation begins, avoiding costly layer creation mid-flight. However, it should only be used on animating elements and not globally across all DOM nodes.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between forwards, backwards, and both in animation-fill-mode?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                animation-fill-mode controls what styles apply to an element before execution begins and after completion. &apos;forwards&apos; keeps the styles applied at the final keyframe (100%) after completion. &apos;backwards&apos; applies the initial 0% keyframe styles during any animation-delay window. &apos;both&apos; applies backwards before start and forwards upon finish.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do cubic-bezier curves provide elastic and bounce effects?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Standard easing curves like linear or ease-in-out are clamped between 0.0 and 1.0 on the time axis. Custom cubic-bezier functions like cubic-bezier(0.68, -0.55, 0.27, 1.55) push control points below 0.0 or above 1.0 on the progress axis, causing the rendered value to intentionally overshoot its target before settling into place.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I implement prefers-reduced-motion for CSS keyframe animations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Wrap non-essential animations inside @media (prefers-reduced-motion: no-preference). For users who have enabled motion sensitivity settings in their OS, you can either completely disable the animation with animation: none !important or replace spatial translation with an accessible cross-fade.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I export these CSS keyframes directly into Tailwind CSS configuration?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Switch the Export Syntax toggle from &apos;Raw CSS&apos; to &apos;Tailwind CSS&apos;. The visualizer automatically compiles your percentage keyframes into a structured JavaScript object compatible with Tailwind v3 and v4 theme.extend.keyframes and theme.extend.animation configurations.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}