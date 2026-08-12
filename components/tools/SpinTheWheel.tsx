"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
    RotateCw,
    PieChart,
    Plus,
    Trash2,
    Play,
    Sparkles,
    RefreshCw,
    Volume2,
    VolumeX,
    Trophy,
    Settings,
    Shuffle,
    Check,
    Copy,
    Download,
    HelpCircle,
    BookOpen,
    TrendingUp,
    BarChart3,
    BrainCircuit,
    Lightbulb,
    Layers,
    Calculator,
    ShieldCheck,
    ListPlus,
    CheckCircle2
} from "lucide-react";

interface WheelOption {
    id: string;
    text: string;
    weight: number;
    color: string;
}

interface SpinHistoryRecord {
    id: string;
    winner: string;
    timestamp: string;
    totalOptionsCount: number;
}

const DEFAULT_COLORS = [
    "#4f46e5", // Indigo
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f97316", // Orange
    "#6366f1"  // Indigo Light
];

const PRESETS = [
    {
        name: "Yes or No",
        options: ["Yes", "No"]
    },
    {
        name: "Dinner Ideas",
        options: ["Pizza", "Sushi", "Tacos", "Burgers", "Pasta", "Salad", "Thai Curry", "Ramen"]
    },
    {
        name: "Numbers 1-10",
        options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    },
    {
        name: "Decision Helper",
        options: ["Do it now", "Wait until tomorrow", "Ask a friend", "Flip a coin", "Sleep on it"]
    },
    {
        name: "Truth or Dare",
        options: ["Truth", "Dare"]
    }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(1);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) || num < 1 ? 1 : num);
};

export default function SpinTheWheel() {
    // Wheel Options State
    const [options, setOptions] = useState<WheelOption[]>([
        { id: "1", text: "Option A", weight: 1, color: DEFAULT_COLORS[0] },
        { id: "2", text: "Option B", weight: 1, color: DEFAULT_COLORS[1] },
        { id: "3", text: "Option C", weight: 1, color: DEFAULT_COLORS[2] },
        { id: "4", text: "Option D", weight: 1, color: DEFAULT_COLORS[3] },
        { id: "5", text: "Option E", weight: 1, color: DEFAULT_COLORS[4] },
        { id: "6", text: "Option F", weight: 1, color: DEFAULT_COLORS[5] }
    ]);

    const [newOptionText, setNewOptionText] = useState<string>("");
    const [bulkText, setBulkText] = useState<string>("");
    const [isBulkMode, setIsBulkMode] = useState<boolean>(false);

    // Configuration Settings
    const [enableWeighted, setEnableWeighted] = useState<boolean>(false);
    const [spinDuration, setSpinDuration] = useState<number>(4); // seconds
    const [removeOnWin, setRemoveOnWin] = useState<boolean>(false);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

    // Animation & State Control
    const [isSpinning, setIsSpinning] = useState<boolean>(false);
    const [currentAngle, setCurrentAngle] = useState<number>(0);
    const [winner, setWinner] = useState<string | null>(null);
    const [history, setHistory] = useState<SpinHistoryRecord[]>([]);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"wheel" | "stats">("wheel");

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Compute total weight
    const totalWeight = useMemo(() => {
        return options.reduce((acc, curr) => acc + (enableWeighted ? curr.weight : 1), 0);
    }, [options, enableWeighted]);

    // Play synthesized tick sound on rotation milestone
    const playTickSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            if (!audioContextRef.current) {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                audioContextRef.current = new AudioCtx();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === "suspended") {
                ctx.resume();
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch {
            // Audio context fallback
        }
    }, [soundEnabled]);

    // Play fanfare win sound
    const playWinSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            if (!audioContextRef.current) {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                audioContextRef.current = new AudioCtx();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === "suspended") {
                ctx.resume();
            }
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.1);
                osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
            });
        } catch {
            // Audio context fallback
        }
    }, [soundEnabled]);

    // Draw Wheel on HTML5 Canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 15;

        ctx.clearRect(0, 0, width, height);

        if (options.length === 0) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Add choices to build the wheel", centerX, centerY);
            return;
        }

        let startAngle = currentAngle;

        options.forEach((opt) => {
            const weight = enableWeighted ? opt.weight : 1;
            const sliceAngle = (weight / totalWeight) * (2 * Math.PI);
            const endAngle = startAngle + sliceAngle;

            // Draw Wedge
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = opt.color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();

            // Draw Wedge Text Label
            ctx.save();
            ctx.translate(centerX, centerY);
            const midAngle = startAngle + sliceAngle / 2;
            ctx.rotate(midAngle);
            ctx.textAlign = "right";
            ctx.fillStyle = "#ffffff";
            ctx.font = options.length > 12 ? "bold 11px sans-serif" : "bold 14px sans-serif";
            ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
            ctx.shadowBlur = 4;

            // Truncate long text for slice fitting
            const maxTextWidth = radius - 35;
            let textToDraw = opt.text;
            if (ctx.measureText(textToDraw).width > maxTextWidth) {
                while (textToDraw.length > 3 && ctx.measureText(textToDraw + "...").width > maxTextWidth) {
                    textToDraw = textToDraw.slice(0, -1);
                }
                textToDraw += "...";
            }

            ctx.fillText(textToDraw, radius - 20, 5);
            ctx.restore();

            startAngle = endAngle;
        });

        // Center Cap Decorative Circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = "#4f46e5";
        ctx.fill();
    }, [options, currentAngle, totalWeight, enableWeighted]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // Cryptographically Secure Weighted Choice Selection
    const selectWinnerIndex = useCallback((): number => {
        if (options.length === 0) return 0;
        const randomBuffer = new Uint32Array(1);
        crypto.getRandomValues(randomBuffer);
        const maxUint32 = 4294967295;
        const randomRatio = randomBuffer[0] / maxUint32;

        const targetValue = randomRatio * totalWeight;
        let cumulative = 0;

        for (let i = 0; i < options.length; i++) {
            const weight = enableWeighted ? options[i].weight : 1;
            cumulative += weight;
            if (targetValue <= cumulative) {
                return i;
            }
        }
        return options.length - 1;
    }, [options, enableWeighted, totalWeight]);

    // Execute Spin Animation
    const handleSpin = () => {
        if (isSpinning || options.length === 0) return;

        setIsSpinning(true);
        setWinner(null);

        // Pre-determine winner using Web Crypto API
        const winnerIdx = selectWinnerIndex();
        const winningOption = options[winnerIdx];

        // Calculate angular offsets
        // Pointer is at TOP (angle = 270 deg or 1.5 * PI rad)
        let cumulativeAngle = 0;
        for (let i = 0; i < winnerIdx; i++) {
            const weight = enableWeighted ? options[i].weight : 1;
            cumulativeAngle += (weight / totalWeight) * (2 * Math.PI);
        }
        const winningWeight = enableWeighted ? winningOption.weight : 1;
        const winningSliceAngle = (winningWeight / totalWeight) * (2 * Math.PI);
        const winnerMidAngle = cumulativeAngle + winningSliceAngle / 2;

        // Pointer is at 1.5 * PI (270 degrees)
        // We want (currentAngle + winnerMidAngle) % 2PI = 1.5 * PI
        const targetPointerRad = 1.5 * Math.PI;
        const fullRotations = (Math.floor(Math.random() * 4) + 6) * 2 * Math.PI;

        const currentMod = currentAngle % (2 * Math.PI);
        let desiredAngleRad = targetPointerRad - winnerMidAngle;
        while (desiredAngleRad < currentMod) {
            desiredAngleRad += 2 * Math.PI;
        }

        const totalTargetAngle = currentAngle + (desiredAngleRad - currentMod) + fullRotations;

        // Easing cubic curve animation
        const startTime = performance.now();
        const durationMs = spinDuration * 1000;
        const startAngleVal = currentAngle;
        let lastTickAngle = startAngleVal;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / durationMs, 1);

            // Ease Out Quart formula: 1 - (1 - t)^4
            const easeOut = 1 - Math.pow(1 - progress, 4);
            const nextAngle = startAngleVal + (totalTargetAngle - startAngleVal) * easeOut;

            // Trigger tick audio when rotating across slice boundaries (~0.3 rad step)
            if (Math.abs(nextAngle - lastTickAngle) >= (Math.PI / 10)) {
                playTickSound();
                lastTickAngle = nextAngle;
            }

            setCurrentAngle(nextAngle);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);
                setWinner(winningOption.text);
                playWinSound();

                // Append to history
                const record: SpinHistoryRecord = {
                    id: Date.now().toString(),
                    winner: winningOption.text,
                    timestamp: new Date().toLocaleTimeString(),
                    totalOptionsCount: options.length
                };
                setHistory((prev) => [record, ...prev].slice(0, 50));

                // Optional auto-removal
                if (removeOnWin && options.length > 1) {
                    setOptions((prev) => prev.filter((o) => o.id !== winningOption.id));
                }
            }
        };

        requestAnimationFrame(animate);
    };

    // Option Management Handlers
    const handleAddOption = () => {
        if (!newOptionText.trim()) return;
        const nextColor = DEFAULT_COLORS[options.length % DEFAULT_COLORS.length];
        const newOpt: WheelOption = {
            id: Date.now().toString(),
            text: newOptionText.trim(),
            weight: 1,
            color: nextColor
        };
        setOptions((prev) => [...prev, newOpt]);
        setNewOptionText("");
    };

    const handleRemoveOption = (id: string) => {
        if (options.length <= 1) return;
        setOptions((prev) => prev.filter((o) => o.id !== id));
    };

    const handleUpdateWeight = (id: string, weight: number) => {
        setOptions((prev) =>
            prev.map((o) => (o.id === id ? { ...o, weight: Math.max(1, weight) } : o))
        );
    };

    const handleApplyBulkText = () => {
        const lines = bulkText
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

        if (lines.length === 0) return;

        const newOptions: WheelOption[] = lines.map((line, idx) => ({
            id: `${Date.now()}-${idx}`,
            text: line,
            weight: 1,
            color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
        }));

        setOptions(newOptions);
        setIsBulkMode(false);
        setBulkText("");
    };

    const handleLoadPreset = (presetOptions: string[]) => {
        const loaded: WheelOption[] = presetOptions.map((text, idx) => ({
            id: `${Date.now()}-${idx}`,
            text,
            weight: 1,
            color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
        }));
        setOptions(loaded);
        setWinner(null);
    };

    const handleShuffleOptions = () => {
        setOptions((prev) => {
            const arr = [...prev];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr.map((item, idx) => ({
                ...item,
                color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
            }));
        });
    };

    const handleCopySummary = () => {
        const text = `Spin the Wheel Choice Picker Results:
----------------------------------------
Latest Winner: ${winner || "None"}
Total Spins: ${history.length}
Total Choices Available: ${options.length}
Options List: ${options.map((o) => o.text).join(", ")}
----------------------------------------
Simulated via twistertools.com/tools/random-tools/spin-the-wheel`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (history.length === 0) return;
        const headers = ["Spin Index", "Winning Choice", "Timestamp", "Total Options"];
        const rows = history.map((item, idx) => [
            history.length - idx,
            item.winner,
            item.timestamp,
            item.totalOptionsCount
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "spin_the_wheel_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Statistical frequency distribution calculation
    const frequencyMap = useMemo(() => {
        const map: Record<string, number> = {};
        history.forEach((h) => {
            map[h.winner] = (map[h.winner] || 0) + 1;
        });
        return map;
    }, [history]);

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Spin the Wheel & Choice Picker",
        "url": "https://twistertools.com/tools/random-tools/spin-the-wheel",
        "description": "Interactive HTML5 canvas wheel spinner for making random decisions, selecting contest winners, picking raffle options, and executing weighted probability choices.",
        "applicationCategory": "UtilitiesApplication",
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
                "name": "Is this spin the wheel decision picker mathematically fair?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The winning choice is pre-calculated using the browser's cryptographic Web Crypto API (crypto.getRandomValues), providing uniform, hardware-level randomness. The visual canvas animation then smoothly decelerates to align with the pre-selected winning wedge."
                }
            },
            {
                "@type": "Question",
                "name": "How does weighted wheel spinning work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When weighted mode is enabled, each choice receives a arc slice proportional to its assigned weight. An option with weight 2 occupies twice the visual angular space and possesses twice the mathematical probability of selection compared to an option with weight 1."
                }
            },
            {
                "@type": "Question",
                "name": "Can I remove winning choices automatically after each spin?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Toggle the 'Remove Choice on Win' option in the settings. This is ideal for multi-round giveaways, raffles, or classroom turn-taking where each item should only be picked once."
                }
            },
            {
                "@type": "Question",
                "name": "Is there a limit on how many options I can add to the wheel?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No strict technical limit exists. However, for optimal visual clarity on standard desktop and mobile screens, having between 2 and 50 choices is recommended. Text auto-scales and truncates to preserve canvas legibility."
                }
            },
            {
                "@type": "Question",
                "name": "How do I import a large list of names or choices at once?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Click the 'Bulk List Import' toggle in the left workspace panel. Paste line-separated items into the text area and click 'Apply Bulk Choices' to populate the wheel instantly."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Panel: Choice Inputs & Customization */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 flex flex-col justify-between min-w-0">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <ListPlus className="w-5 h-5 text-indigo-600" />
                                Options & Configurations
                            </h2>
                            <button
                                onClick={handleShuffleOptions}
                                disabled={isSpinning || options.length <= 1}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 cursor-pointer disabled:opacity-50"
                            >
                                <Shuffle className="w-3.5 h-3.5" />
                                Shuffle Order
                            </button>
                        </div>

                        {/* Quick Presets Row */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Load Quick Preset
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p.name}
                                        type="button"
                                        onClick={() => handleLoadPreset(p.options)}
                                        disabled={isSpinning}
                                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer disabled:opacity-50"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Mode Toggle */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                            <button
                                onClick={() => setIsBulkMode(false)}
                                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${!isBulkMode ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                            >
                                Item List View ({options.length})
                            </button>
                            <button
                                onClick={() => setIsBulkMode(true)}
                                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${isBulkMode ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                            >
                                Bulk Import Text
                            </button>
                        </div>

                        {!isBulkMode ? (
                            <div className="space-y-4">
                                {/* Single Option Add Input */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newOptionText}
                                        onChange={(e) => setNewOptionText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                                        placeholder="Add new choice option..."
                                        disabled={isSpinning}
                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    />
                                    <button
                                        onClick={handleAddOption}
                                        disabled={isSpinning || !newOptionText.trim()}
                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>

                                {/* Options Scrollable Table/List */}
                                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 border border-slate-100 p-2 rounded-xl bg-slate-50">
                                    {options.map((opt, idx) => (
                                        <div
                                            key={opt.id}
                                            className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs"
                                        >
                                            <span
                                                className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10"
                                                style={{ backgroundColor: opt.color }}
                                            />
                                            <span className="text-xs font-bold text-slate-400 w-5">
                                                #{idx + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={opt.text}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setOptions((prev) =>
                                                        prev.map((o) => (o.id === opt.id ? { ...o, text: val } : o))
                                                    );
                                                }}
                                                disabled={isSpinning}
                                                className="flex-1 text-xs font-semibold text-slate-900 border-none bg-transparent focus:ring-0 outline-none"
                                            />

                                            {/* Weight Input if Weighted Mode Enabled */}
                                            {enableWeighted && (
                                                <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    <span className="text-[10px] font-bold text-slate-500">W:</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        value={opt.weight}
                                                        onChange={(e) => handleNumberInput(e, (v) => handleUpdateWeight(opt.id, v))}
                                                        disabled={isSpinning}
                                                        className="w-10 text-xs font-bold text-slate-900 bg-transparent text-center outline-none"
                                                    />
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleRemoveOption(opt.id)}
                                                disabled={isSpinning || options.length <= 1}
                                                className="p-1 text-slate-400 hover:text-red-500 transition disabled:opacity-30 cursor-pointer"
                                                title="Remove Choice"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Bulk Import Textarea */
                            <div className="space-y-3">
                                <textarea
                                    rows={8}
                                    value={bulkText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                    placeholder="Enter one choice per line:&#10;Option A&#10;Option B&#10;Option C"
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                                <button
                                    onClick={handleApplyBulkText}
                                    disabled={isSpinning || !bulkText.trim()}
                                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs transition cursor-pointer"
                                >
                                    Apply Bulk Choices
                                </button>
                            </div>
                        )}

                        {/* Additional Toggles & Settings */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Settings className="w-4 h-4 text-indigo-600" /> Advanced Options
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium text-slate-700">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={enableWeighted}
                                        onChange={(e) => setEnableWeighted(e.target.checked)}
                                        disabled={isSpinning}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Enable Weights</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={removeOnWin}
                                        onChange={(e) => setRemoveOnWin(e.target.checked)}
                                        disabled={isSpinning}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Remove Choice on Win</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={soundEnabled}
                                        onChange={(e) => setSoundEnabled(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="flex items-center gap-1">
                                        {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                                        Sound Effects
                                    </span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 whitespace-nowrap">Duration:</span>
                                    <select
                                        value={spinDuration}
                                        onChange={(e) => setSpinDuration(Number(e.target.value))}
                                        disabled={isSpinning}
                                        className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-800"
                                    >
                                        <option value={2}>2 Seconds</option>
                                        <option value={4}>4 Seconds</option>
                                        <option value={6}>6 Seconds</option>
                                        <option value={8}>8 Seconds</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Wheel Data"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={history.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-xs sm:text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Panel: Wheel Canvas Stage & Winner Banner */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 flex flex-col justify-between min-w-0">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <RotateCw className="w-5 h-5 text-indigo-600" />
                                Interactive Canvas Stage
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("wheel")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "wheel" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}
                                >
                                    Wheel Stage
                                </button>
                                <button
                                    onClick={() => setActiveTab("stats")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "stats" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}
                                >
                                    Log ({history.length})
                                </button>
                            </div>
                        </div>

                        {activeTab === "wheel" ? (
                            <div className="flex flex-col items-center justify-center space-y-6 py-2">
                                {/* HTML5 Wheel Canvas Container */}
                                <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center">
                                    {/* Wheel Pointer Arrow */}
                                    <div className="absolute top-0 z-20 left-1/2 -translate-x-1/2 -translate-y-3 pointer-events-none">
                                        <svg className="w-10 h-10 text-indigo-950 fill-current drop-shadow-md" viewBox="0 0 24 24">
                                            <path d="M12 22c-0.6 0-1.1-0.3-1.4-0.8L3.2 7.1C2.5 6.1 3.2 4 4.5 4h15c1.3 0 2 2.1 1.3 3.1l-7.4 14.1c-0.3 0.5-0.8 0.8-1.4 0.8z" />
                                        </svg>
                                    </div>

                                    {/* Canvas element */}
                                    <canvas
                                        ref={canvasRef}
                                        width={400}
                                        height={400}
                                        className="w-full h-full object-contain rounded-full shadow-lg border-4 border-slate-900 bg-white"
                                    />
                                </div>

                                {/* Winner Announcement Banner */}
                                {winner && (
                                    <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center shadow-lg animate-bounce-short">
                                        <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-100 flex items-center justify-center gap-1">
                                            <Trophy className="w-4 h-4 text-amber-300" /> Winner Selected!
                                        </span>
                                        <p className="text-2xl font-black mt-1 tracking-wide">{winner}</p>
                                    </div>
                                )}

                                {/* Spin Action Button */}
                                <button
                                    onClick={handleSpin}
                                    disabled={isSpinning || options.length === 0}
                                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-slate-400 disabled:to-slate-500 text-white font-extrabold text-lg transition shadow-md hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
                                >
                                    <Play className={`w-6 h-6 fill-current ${isSpinning ? "animate-spin" : ""}`} />
                                    {isSpinning ? "Spinning..." : "SPIN THE WHEEL"}
                                </button>
                            </div>
                        ) : (
                            /* History & Stats Log Tab */
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <BarChart3 className="w-4 h-4 text-indigo-600" /> Selection Frequency
                                    </h3>
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                                        {Object.entries(frequencyMap).length === 0 ? (
                                            <p className="text-xs text-slate-400">No spin history recorded yet.</p>
                                        ) : (
                                            Object.entries(frequencyMap).map(([item, count]) => {
                                                const pct = ((count / history.length) * 100).toFixed(1);
                                                return (
                                                    <div key={item} className="space-y-1">
                                                        <div className="flex justify-between text-xs font-bold text-slate-800">
                                                            <span>{item}</span>
                                                            <span className="text-indigo-600">{count} wins ({pct}%)</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-indigo-600 h-full transition-all"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Chronological History
                                    </h3>
                                    <div className="max-h-[200px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                        {history.length === 0 ? (
                                            <p className="p-4 text-center text-xs text-slate-400">Spin the wheel to log results.</p>
                                        ) : (
                                            history.map((record, idx) => (
                                                <div key={record.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-400">#{history.length - idx}</span>
                                                        <span className="font-extrabold text-slate-900">{record.winner}</span>
                                                    </div>
                                                    <span className="text-slate-400 text-[11px]">{record.timestamp}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Hardware Crypto RNG
                        </span>
                        <span>Uniform Probability</span>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Theoretical Mechanics & Cryptographic Randomness */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Cryptographic Randomness & Web Crypto Engine Architecture
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In digital choice picking and random selection tools, traditional algorithms rely on pseudo-random number generators (PRNGs) like JavaScript’s native <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-indigo-600 font-mono">Math.random()</code>. While suitable for simple visual animations, standard PRNGs are deterministic equations seeded by system timestamp clocks, making them vulnerable to statistical bias or predictability over long sequences.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To guarantee enterprise-grade fairness for contests, raffles, and critical decision-making, <strong>TwisterTools Spin the Wheel</strong> incorporates the browser's hardware-backed <strong>Web Crypto API</strong> (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-indigo-600 font-mono">window.crypto.getRandomValues</code>). This extracts high-entropy hardware noise directly from the underlying host operating system kernel, delivering non-deterministic uniform random distribution across all choices.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> Discrete Uniform Distribution
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {"For $N$ unweighted wheel choices, the theoretical probability $P(X_i)$ of selecting any individual option $X_i$ is strictly identical:"}
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                P(X_i) = 1 / N
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Weighted Arc Formulation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {"When weight $w_i$ is assigned to choice $i$, the selection probability scales linearly with respect to total sum of weights $W = \\sum_{j=1}^{N} w_j$:"}
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                P(X_i) = w_i / W
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Customization & Practical Applications */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Multi-Scenario Utility & Feature Spectrum
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Whether facilitating classroom turn-taking, executing live stream social media giveaways, or eliminating group dinner decision stalemates, our interactive wheel spinner adapts seamlessly to diverse use cases:
                    </p>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Giveaways & Raffles
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Enable <strong>Remove Choice on Win</strong> to conduct fair multi-winner drawings without replacement. Export winner logs to CSV for verification.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Educational Classroom
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Randomly call on students or assign study topics. Quick preset toggles allow teachers to load line-separated rosters instantly.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Group Decisions
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Overcome option paralysis during group meetings or social gatherings by delegating tie-breakers to an unbiased, visual wheel.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Probability & Weight Calculations Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Probability Reference Matrix & Weight Scaling
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Understanding how slice slice count and custom weighting influence individual probabilities is essential for configuring custom games and competitions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Option Count ($N$)</th>
                                    <th className="p-3">Wedge Arc Angle</th>
                                    <th className="p-3">Individual Probability (Equal)</th>
                                    <th className="p-3">Weighted Odds Example (Weight = 3 vs 1s)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2 Choices</td>
                                    <td className="p-3 font-mono">180.0°</td>
                                    <td className="p-3 font-bold text-indigo-600">50.00%</td>
                                    <td className="p-3 font-mono text-xs">W3: 75.0% | W1: 25.0%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4 Choices</td>
                                    <td className="p-3 font-mono">90.0°</td>
                                    <td className="p-3 font-bold text-indigo-600">25.00%</td>
                                    <td className="p-3 font-mono text-xs">W3: 50.0% | W1: 16.67%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">6 Choices</td>
                                    <td className="p-3 font-mono">60.0°</td>
                                    <td className="p-3 font-bold text-indigo-600">16.67%</td>
                                    <td className="p-3 font-mono text-xs">W3: 37.5% | W1: 12.5%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">8 Choices</td>
                                    <td className="p-3 font-mono">45.0°</td>
                                    <td className="p-3 font-bold text-indigo-600">12.50%</td>
                                    <td className="p-3 font-mono text-xs">W3: 30.0% | W1: 10.0%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">10 Choices</td>
                                    <td className="p-3 font-mono">36.0°</td>
                                    <td className="p-3 font-bold text-indigo-600">10.00%</td>
                                    <td className="p-3 font-mono text-xs">W3: 25.0% | W1: 8.33%</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                    <td className="p-3 font-semibold text-slate-900">20 Choices</td>
                                    <td className="p-3 font-mono">18.0°</td>
                                    <td className="p-3 font-bold text-indigo-600">5.00%</td>
                                    <td className="p-3 font-mono text-xs">W3: 13.64% | W1: 4.55%</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-100/50">
                                    <td className="p-3 font-semibold text-slate-900">50 Choices</td>
                                    <td className="p-3 font-mono">7.2°</td>
                                    <td className="p-3 font-bold text-indigo-600">2.00%</td>
                                    <td className="p-3 font-mono text-xs">W3: 5.77% | W1: 1.92%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Psychological Applications & Overcoming Decision Fatigue */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Psychology of Decision Fatigue & The Buridan’s Paradox
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In cognitive psychology, <strong>decision fatigue</strong> refers to the deteriorating quality of decisions made by an individual after a long session of decision-making. When faced with multiple equivalent choices (a dilemma known historically as <em>Buridan's Ass</em> paradox), human brains experience analysis paralysis.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Externalizing Choice Agency</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Delegating a tie-breaker to a visual wheel removes the emotional burden of hesitation. Interestingly, observing where the wheel lands often reveals one's true subconscious preference immediately.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Gamification of Routine Tasks</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Adding visual suspense, audio ticking feedback, and color-coded wedges transforms mundane choices (like chores or workout routines) into rewarding, gamified events.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Step-by-Step Worked Math Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Probability Case Studies
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Raffle Prize Odds Calculation</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Giveaways</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Scenario:</strong> 5 participants buy tickets: Alice (3 tickets), Bob (1), Charlie (1).</li>
                                <li><strong>Step 1:</strong> {"Sum total weights: $3 + 1 + 1 = 5$."}</li>
                                <li><strong>Step 2:</strong> {"Calculate Alice's probability: $P(\\text{Alice}) = 3 / 5 = 0.60$."}</li>
                                <li><strong>Step 3:</strong> {"Calculate Bob's probability: $P(\\text{Bob}) = 1 / 5 = 0.20$."}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Result: Alice has a 60.0% winning chance; Bob has 20.0%.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Multi-Round Sampling Without Replacement</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Raffles</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Scenario:</strong> Picking 2 distinct winners out of 4 candidates with 'Remove on Win'.</li>
                                <li><strong>Round 1:</strong> Each candidate has a $1/4 = 25\%$ chance.</li>
                                <li><strong>Round 2:</strong> With winner removed, remaining 3 candidates have a $1/3 = 33.33\%$ chance.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Result: Every remaining participant's odds increase progressively each round.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 6: Static Border-Highlighted FAQ Section */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
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
                                Is this spin the wheel decision picker mathematically fair?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The winning choice is pre-calculated using the browser's cryptographic Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>), providing uniform, hardware-level randomness. The visual canvas animation then smoothly decelerates to align with the pre-selected winning wedge.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does weighted wheel spinning work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"When weighted mode is enabled, each choice receives an arc slice proportional to its assigned weight. An option with weight 2 occupies twice the visual angular space and possesses twice the mathematical probability of selection compared to an option with weight 1 ($P = w_i / \\sum w$)."}'
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I remove winning choices automatically after each spin?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Toggle the 'Remove Choice on Win' option in the settings. This is ideal for multi-round giveaways, raffles, or classroom turn-taking where each item should only be picked once.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is there a limit on how many options I can add to the wheel?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No strict technical limit exists. However, for optimal visual clarity on standard desktop and mobile screens, having between 2 and 50 choices is recommended. Text auto-scales and truncates to preserve canvas legibility.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I import a large list of names or choices at once?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Click the 'Bulk Import Text' tab in the options panel. Paste line-separated items into the text area and click 'Apply Bulk Choices' to populate the wheel instantly.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}