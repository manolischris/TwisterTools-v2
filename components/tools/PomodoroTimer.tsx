"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Timer,
    Play,
    Pause,
    RotateCcw,
    SkipForward,
    Volume2,
    VolumeX,
    Bell,
    CheckCircle2,
    Flame,
    Zap,
    Coffee,
    Moon,
    SlidersHorizontal,
    BarChart3,
    Clock,
    Plus,
    Trash2,
    Check,
    Copy,
    ListTodo,
    ShieldCheck,
    Brain,
    Lightbulb,
    HelpCircle,
    Info,
    Calendar,
    Target,
    Activity,
    BookOpen,
    CheckSquare,
    Sparkles,
    Workflow,
    Layers,
    Compass,
    Award
} from "lucide-react";

type TimerMode = "work" | "shortBreak" | "longBreak";

interface TaskItem {
    id: string;
    text: string;
    estimatedPomodoros: number;
    completedPomodoros: number;
    completed: boolean;
}

interface PomodoroPreset {
    name: string;
    description: string;
    work: number;
    shortBreak: number;
    longBreak: number;
    cyclesBeforeLong: number;
}

const PRESETS: PomodoroPreset[] = [
    {
        name: "Classic Standard (25/5)",
        description: "Standard Francesco Cirillo rhythm for steady knowledge work",
        work: 25,
        shortBreak: 5,
        longBreak: 15,
        cyclesBeforeLong: 4
    },
    {
        name: "Ultradian Deep Work (50/10)",
        description: "Extended flow cycles for complex coding and deep architecture",
        work: 50,
        shortBreak: 10,
        longBreak: 30,
        cyclesBeforeLong: 3
    },
    {
        name: "Rule of 52/17 (Desk Science)",
        description: "Optimized ratio derived from workplace ergonomics research",
        work: 52,
        shortBreak: 17,
        longBreak: 30,
        cyclesBeforeLong: 3
    },
    {
        name: "Desk Micro-Sprint (15/3)",
        description: "High-intensity bursts for inbox triage and task unblocking",
        work: 15,
        shortBreak: 3,
        longBreak: 10,
        cyclesBeforeLong: 4
    },
    {
        name: "Extended Marathon (90/20)",
        description: "Full natural biological circadian cycle for writing and creative flow",
        work: 90,
        shortBreak: 20,
        longBreak: 45,
        cyclesBeforeLong: 2
    }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min = 1,
    max = 180
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(min);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) {
        setter(min);
    } else {
        setter(Math.min(max, Math.max(min, num)));
    }
};

export default function PomodoroTimer() {
    // Timer Configuration State (in minutes)
    const [workDuration, setWorkDuration] = useState<number>(25);
    const [shortBreakDuration, setShortBreakDuration] = useState<number>(5);
    const [longBreakDuration, setLongBreakDuration] = useState<number>(15);
    const [targetCycles, setTargetCycles] = useState<number>(4);

    // Dynamic Execution State
    const [currentMode, setCurrentMode] = useState<TimerMode>("work");
    const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [completedCycles, setCompletedCycles] = useState<number>(0);
    const [totalCompletedToday, setTotalCompletedToday] = useState<number>(0);
    const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(0);

    // Audio & Browser Notification State
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [autoStartBreaks, setAutoStartBreaks] = useState<boolean>(false);
    const [autoStartPomodoros, setAutoStartPomodoros] = useState<boolean>(false);
    const [notificationPermission, setNotificationPermission] = useState<string>("default");

    // Task Management State
    const [tasks, setTasks] = useState<TaskItem[]>([
        { id: "1", text: "Refactor API request handling logic", estimatedPomodoros: 2, completedPomodoros: 1, completed: false },
        { id: "2", text: "Review open pull requests & unit tests", estimatedPomodoros: 1, completedPomodoros: 0, completed: false }
    ]);
    const [newTaskText, setNewTaskText] = useState<string>("");
    const [newTaskEst, setNewTaskEst] = useState<number>(1);
    const [activeTaskId, setActiveTaskId] = useState<string | null>("1");

    // UI Feedback State
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
    const [isCustomizing, setIsCustomizing] = useState<boolean>(false);

    // Audio Synthesis helper using Web Audio API (zero external audio asset latency)
    const playNotificationBeep = (type: "workEnd" | "breakEnd") => {
        if (!soundEnabled || typeof window === "undefined") return;
        try {
            const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            if (type === "workEnd") {
                // Energetic two-tone chime for break start
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.12);
                    osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
                });
            } else {
                // Gentle alerting pulse for work sprint resumption
                const notes = [880, 440, 880];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "triangle";
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.15);
                    osc.stop(ctx.currentTime + idx * 0.15 + 0.35);
                });
            }
        } catch {
            // Ignore audio context block errors
        }
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        if (typeof window !== "undefined" && "Notification" in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    // Trigger Desktop Notification
    const triggerDesktopNotification = (title: string, body: string) => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(title, {
                    body,
                    icon: "/favicon.ico"
                });
            } catch {
                // Ignore silent notification permission errors
            }
        }
    };

    // Total duration of current selected mode in seconds
    const currentModeTotalSeconds = useMemo(() => {
        if (currentMode === "work") return workDuration * 60;
        if (currentMode === "shortBreak") return shortBreakDuration * 60;
        return longBreakDuration * 60;
    }, [currentMode, workDuration, shortBreakDuration, longBreakDuration]);

    // Timer Interval Engine
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (isRunning && timeLeft === 0) {
            // Mode Transition Logic
            if (currentMode === "work") {
                const nextCycles = completedCycles + 1;
                setCompletedCycles(nextCycles);
                setTotalCompletedToday((prev) => prev + 1);
                setTotalFocusMinutes((prev) => prev + workDuration);

                // Increment active task pomodoro counter
                if (activeTaskId) {
                    setTasks((prevTasks) =>
                        prevTasks.map((t) =>
                            t.id === activeTaskId
                                ? { ...t, completedPomodoros: t.completedPomodoros + 1 }
                                : t
                        )
                    );
                }

                playNotificationBeep("workEnd");
                triggerDesktopNotification("Focus Sprint Completed!", "Great job! Time to step back, stretch, and relax.");

                if (nextCycles % targetCycles === 0) {
                    setCurrentMode("longBreak");
                    setTimeLeft(longBreakDuration * 60);
                } else {
                    setCurrentMode("shortBreak");
                    setTimeLeft(shortBreakDuration * 60);
                }
                setIsRunning(autoStartBreaks);
            } else {
                // Break ended -> Return to work sprint
                playNotificationBeep("breakEnd");
                triggerDesktopNotification("Break Finished!", "Ready to dive back into your next focus sprint?");
                setCurrentMode("work");
                setTimeLeft(workDuration * 60);
                setIsRunning(autoStartPomodoros);
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [
        isRunning,
        timeLeft,
        currentMode,
        completedCycles,
        targetCycles,
        workDuration,
        shortBreakDuration,
        longBreakDuration,
        autoStartBreaks,
        autoStartPomodoros,
        activeTaskId
    ]);

    // Mode Switch Handler
    const switchMode = (mode: TimerMode) => {
        setIsRunning(false);
        setCurrentMode(mode);
        if (mode === "work") setTimeLeft(workDuration * 60);
        if (mode === "shortBreak") setTimeLeft(shortBreakDuration * 60);
        if (mode === "longBreak") setTimeLeft(longBreakDuration * 60);
    };

    // Reset Current Timer
    const handleResetTimer = () => {
        setIsRunning(false);
        if (currentMode === "work") setTimeLeft(workDuration * 60);
        if (currentMode === "shortBreak") setTimeLeft(shortBreakDuration * 60);
        if (currentMode === "longBreak") setTimeLeft(longBreakDuration * 60);
    };

    // Skip Current Mode
    const handleSkip = () => {
        setIsRunning(false);
        if (currentMode === "work") {
            const nextCycles = completedCycles + 1;
            setCompletedCycles(nextCycles);
            if (nextCycles % targetCycles === 0) {
                setCurrentMode("longBreak");
                setTimeLeft(longBreakDuration * 60);
            } else {
                setCurrentMode("shortBreak");
                setTimeLeft(shortBreakDuration * 60);
            }
        } else {
            setCurrentMode("work");
            setTimeLeft(workDuration * 60);
        }
    };

    // Preset Selection
    const applyPreset = (preset: PomodoroPreset) => {
        setIsRunning(false);
        setWorkDuration(preset.work);
        setShortBreakDuration(preset.shortBreak);
        setLongBreakDuration(preset.longBreak);
        setTargetCycles(preset.cyclesBeforeLong);
        if (currentMode === "work") setTimeLeft(preset.work * 60);
        if (currentMode === "shortBreak") setTimeLeft(preset.shortBreak * 60);
        if (currentMode === "longBreak") setTimeLeft(preset.longBreak * 60);
    };

    // Task Actions
    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        const newTask: TaskItem = {
            id: Date.now().toString(),
            text: newTaskText.trim(),
            estimatedPomodoros: newTaskEst,
            completedPomodoros: 0,
            completed: false
        };
        setTasks((prev) => [...prev, newTask]);
        if (!activeTaskId) setActiveTaskId(newTask.id);
        setNewTaskText("");
        setNewTaskEst(1);
    };

    const toggleTaskCompleted = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        );
    };

    const deleteTask = (id: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (activeTaskId === id) setActiveTaskId(null);
    };

    // Copy Session Summary to Clipboard
    const copySessionLog = () => {
        const text = `Pomodoro Work Sprint Summary:
----------------------------------------
Total Pomodoros Completed: ${totalCompletedToday}
Total Focus Time: ${totalFocusMinutes} minutes (~${(totalFocusMinutes / 60).toFixed(1)} hrs)
Current Cycle Progress: ${completedCycles % targetCycles} / ${targetCycles}
Tasks Tracked:
${tasks.map((t) => ` - [${t.completed ? "X" : " "}] ${t.text} (${t.completedPomodoros}/${t.estimatedPomodoros} pomodoros)`).join("\n")}
----------------------------------------
Logged with TwisterTools Pomodoro Work Sprint Visualizer`;

        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    // Calculate Radial Progress (0% to 100%)
    const progressPercent = useMemo(() => {
        const elapsed = currentModeTotalSeconds - timeLeft;
        return Math.min(100, Math.max(0, (elapsed / currentModeTotalSeconds) * 100));
    }, [timeLeft, currentModeTotalSeconds]);

    // Format mm:ss
    const displayMinutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const displaySeconds = (timeLeft % 60).toString().padStart(2, "0");

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Pomodoro Interval Timer & Work Sprint Visualizer",
        "url": "https://twistertools.com/tools/date-tools/pomodoro-timer",
        "description": "Enterprise-grade Pomodoro timer and workflow visualizer with interval rhythm tracking, task batching, custom presets, and circadian sprint analytics.",
        "applicationCategory": "ProductivityApplication",
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
                "name": "What is the classic Pomodoro Technique and why does it boost cognitive efficiency?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Pomodoro Technique, created by Francesco Cirillo in the late 1980s, divides complex work into 25-minute uninterrupted focus intervals separated by 5-minute restorative breaks. After four cycles, a longer 15 to 30-minute break is taken. This structure prevents mental exhaustion, eliminates task switching overhead, and leverages the brain's natural attention spans."
                }
            },
            {
                "@type": "Question",
                "name": "How does the 50/10 Ultradian Rhythm compare to the classic 25/5 Pomodoro rhythm?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While 25/5 is ideal for routine tasks, inbox triage, and overcoming procrastination, the 50/10 Ultradian Rhythm aligns with natural human brainwave cycles (90-120 minute peak alertness windows). Software engineers, writers, and technical architects frequently prefer 50-minute sprints to achieve and sustain deep programming flow states without premature interruptions."
                }
            },
            {
                "@type": "Question",
                "name": "What should I do during short and long breaks to avoid breaking focus?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Effective breaks require stepping away from all digital screens. Recommended activities include physical stretching, refilling water, resting your eyes on a distant horizon (the 20-20-20 rule), and light walking. Avoid social media, reading the news, or checking emails, as these activities flood working memory with cognitive debt."
                }
            },
            {
                "@type": "Question",
                "name": "Can I customize the work and break interval lengths for my team or workflow?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. This tool provides instant preset toggles (Classic 25/5, Ultradian 50/10, Desk Ergonomics 52/17, and Sprint 15/3) along with granular slider controls to customize work, short break, and long break durations to match your exact schedule."
                }
            },
            {
                "@type": "Question",
                "name": "Does this Pomodoro timer track task estimation accuracy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The built-in Sprint Task Planner allows you to estimate the number of Pomodoro intervals each subtask will take. As you finish intervals, the tool logs your completed vs estimated pomodoros, helping you refine your daily task scoping accuracy."
                }
            },
            {
                "@type": "Question",
                "name": "How does interval timeboxing reduce cognitive fatigue and attention residue?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "According to Dr. Gloria Mark's cognitive research, it takes an average of 23 minutes and 15 seconds to regain deep focus after a distraction. By creating rigid timeboxes, Pomodoro intervals prevent multitasking, minimize attention residue, and allow working memory to clear systematically during structured breaks."
                }
            },
            {
                "@type": "Question",
                "name": "Is the Pomodoro Technique suitable for software engineering and deep coding sessions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. While standard 25-minute intervals can feel brief for complex programming tasks, the 50/10 Ultradian rhythm or 90/20 Circadian block provides the uninterrupted mental runway required to build abstract architectural trees in memory while still enforcing mandatory recovery."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Interactive Timer & Sprint Visualizer */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Audio & Alert Control Options */}
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                                Timer Settings
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer shadow-xs"
                                    title={soundEnabled ? "Mute audio alerts" : "Enable audio alerts"}
                                >
                                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                                    <span>{soundEnabled ? "Sound On" : "Muted"}</span>
                                </button>

                                {notificationPermission !== "granted" && (
                                    <button
                                        type="button"
                                        onClick={requestNotificationPermission}
                                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center gap-1.5 transition border border-indigo-200 cursor-pointer"
                                    >
                                        <Bell className="w-3 h-3 text-indigo-500" />
                                        <span>Enable Alerts</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mode Switcher Tabs */}
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => switchMode("work")}
                                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${currentMode === "work"
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Flame className="w-4 h-4 text-amber-500" />
                                <span>Focus ({workDuration}m)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode("shortBreak")}
                                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${currentMode === "shortBreak"
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Coffee className="w-4 h-4 text-emerald-500" />
                                <span>Short ({shortBreakDuration}m)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode("longBreak")}
                                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${currentMode === "longBreak"
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Moon className="w-4 h-4 text-indigo-500" />
                                <span>Long ({longBreakDuration}m)</span>
                            </button>
                        </div>

                        {/* Radial Visualizer & Countdown Display */}
                        <div className="relative flex flex-col items-center justify-center py-6">
                            {/* Radial Progress Ring */}
                            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
                                    <circle
                                        cx="120"
                                        cy="120"
                                        r="102"
                                        className="text-slate-100 stroke-current"
                                        strokeWidth="12"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="120"
                                        cy="120"
                                        r="102"
                                        className={`stroke-current transition-all duration-1000 ease-linear ${currentMode === "work"
                                            ? "text-indigo-600"
                                            : currentMode === "shortBreak"
                                                ? "text-emerald-500"
                                                : "text-sky-500"
                                            }`}
                                        strokeWidth="12"
                                        strokeDasharray={2 * Math.PI * 102}
                                        strokeDashoffset={2 * Math.PI * 102 * (1 - progressPercent / 100)}
                                        strokeLinecap="round"
                                        fill="transparent"
                                    />
                                </svg>

                                {/* Central Numerical Readout */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                        {currentMode === "work" ? "Deep Focus Sprint" : currentMode === "shortBreak" ? "Restorative Break" : "Extended Recovery"}
                                    </span>
                                    <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
                                        {displayMinutes}:{displaySeconds}
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                                        Cycle #{completedCycles + 1} &bull; {Math.round(progressPercent)}% elapsed
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Primary Timer Controls */}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsRunning(!isRunning)}
                                className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer ${isRunning
                                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                            >
                                {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                <span>{isRunning ? "Pause Sprint" : "Start Sprint"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleResetTimer}
                                className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 cursor-pointer"
                                title="Reset Current Interval"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>

                            <button
                                type="button"
                                onClick={handleSkip}
                                className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 cursor-pointer"
                                title="Skip to Next Mode"
                            >
                                <SkipForward className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cycle Breadcrumbs Indicator */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span>Sprint Target Progress</span>
                                <span>{completedCycles % targetCycles} of {targetCycles} intervals until Long Break</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: targetCycles }).map((_, idx) => {
                                    const isFilled = idx < completedCycles % targetCycles;
                                    const isCurrent = idx === completedCycles % targetCycles && currentMode === "work";
                                    return (
                                        <div
                                            key={idx}
                                            className={`h-2.5 rounded-full transition-all ${isFilled
                                                ? "bg-indigo-600"
                                                : isCurrent
                                                    ? "bg-indigo-400 animate-pulse"
                                                    : "bg-slate-200"
                                                }`}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Quick Ergonomics Insight Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Active Preset: {workDuration}m Focus / {shortBreakDuration}m Break
                        </span>
                        <span className="font-semibold text-emerald-600">Zero Distraction Mode</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Presets, Interval Modifiers & Sprint Task Planner */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Section 1: Productivity Rhythm Presets */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-indigo-600" />
                                    Sprint Rhythm Presets
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomizing(!isCustomizing)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    {isCustomizing ? "Close Customizer" : "Customize Sliders"}
                                </button>
                            </div>

                            {/* Preset Buttons Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {PRESETS.map((p) => {
                                    const isActive = workDuration === p.work && shortBreakDuration === p.shortBreak;
                                    return (
                                        <button
                                            key={p.name}
                                            type="button"
                                            onClick={() => applyPreset(p)}
                                            className={`p-3 rounded-xl border text-left transition cursor-pointer group ${isActive
                                                ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400"
                                                : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={`text-xs font-bold ${isActive ? "text-indigo-900" : "text-slate-800 group-hover:text-indigo-600"}`}>
                                                    {p.name}
                                                </span>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 font-bold border border-slate-200">
                                                    {p.work} / {p.shortBreak}m
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 line-clamp-1">{p.description}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Granular Sliders (Collapsible) */}
                            {isCustomizing && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 pt-4 animate-in fade-in duration-200">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold text-slate-700">
                                            <span>Work Sprint Duration</span>
                                            <span className="font-mono text-indigo-600 font-black">{workDuration} mins</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={5}
                                            max={120}
                                            step={1}
                                            value={workDuration}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setWorkDuration(val);
                                                if (currentMode === "work" && !isRunning) setTimeLeft(val * 60);
                                            }}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                                <span>Short Break</span>
                                                <span className="font-mono text-emerald-600 font-black">{shortBreakDuration}m</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={30}
                                                step={1}
                                                value={shortBreakDuration}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setShortBreakDuration(val);
                                                    if (currentMode === "shortBreak" && !isRunning) setTimeLeft(val * 60);
                                                }}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                                <span>Long Break</span>
                                                <span className="font-mono text-indigo-600 font-black">{longBreakDuration}m</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={5}
                                                max={60}
                                                step={5}
                                                value={longBreakDuration}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setLongBreakDuration(val);
                                                    if (currentMode === "longBreak" && !isRunning) setTimeLeft(val * 60);
                                                }}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Auto-start triggers */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs font-medium text-slate-700">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={autoStartBreaks}
                                                onChange={(e) => setAutoStartBreaks(e.target.checked)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                            />
                                            <span>Auto-start Breaks</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={autoStartPomodoros}
                                                onChange={(e) => setAutoStartPomodoros(e.target.checked)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                            />
                                            <span>Auto-start Pomodoros</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Session Analytics Metrics */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Completed</span>
                                <span className="text-xl sm:text-2xl font-black text-indigo-600 font-mono">{totalCompletedToday}</span>
                                <span className="text-[10px] text-slate-400 block">sprints today</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Focus</span>
                                <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono">{totalFocusMinutes}m</span>
                                <span className="text-[10px] text-slate-400 block">~{(totalFocusMinutes / 60).toFixed(1)} hours</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Streak Cycle</span>
                                <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">{completedCycles}</span>
                                <span className="text-[10px] text-slate-400 block">intervals completed</span>
                            </div>
                        </div>

                        {/* Section 3: Sprint Task Planner & Estimator */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <ListTodo className="w-4 h-4 text-indigo-600" />
                                    Sprint Task Planner
                                </h2>
                                <span className="text-xs font-semibold text-slate-500">
                                    {tasks.filter((t) => t.completed).length}/{tasks.length} Done
                                </span>
                            </div>

                            {/* Task Creation Input */}
                            <form onSubmit={handleAddTask} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add task to focus on..."
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200" title="Estimated Pomodoros">
                                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                                    <input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={newTaskEst}
                                        onChange={(e) => handleNumberInput(e, setNewTaskEst, 1, 12)}
                                        className="w-8 text-center font-bold text-xs bg-transparent outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add</span>
                                </button>
                            </form>

                            {/* Task List */}
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {tasks.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-4 italic">No active tasks. Add a task to link sprint intervals.</p>
                                ) : (
                                    tasks.map((task) => {
                                        const isActive = activeTaskId === task.id;
                                        return (
                                            <div
                                                key={task.id}
                                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${isActive
                                                    ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-300"
                                                    : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleTaskCompleted(task.id)}
                                                        className={`w-5 h-5 rounded-md flex items-center justify-center transition border cursor-pointer ${task.completed
                                                            ? "bg-emerald-500 border-emerald-600 text-white"
                                                            : "border-slate-300 bg-white hover:border-indigo-500"
                                                            }`}
                                                    >
                                                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                    </button>
                                                    <span
                                                        onClick={() => setActiveTaskId(task.id)}
                                                        className={`text-xs font-semibold truncate cursor-pointer flex-1 ${task.completed ? "line-through text-slate-400" : "text-slate-800"
                                                            }`}
                                                    >
                                                        {task.text}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1">
                                                        <Flame className="w-3 h-3 text-amber-500" />
                                                        {task.completedPomodoros}/{task.estimatedPomodoros}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteTask(task.id)}
                                                        className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                                                        title="Delete Task"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Copy Summary Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={copySessionLog}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedSummary ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedSummary ? "Sprint Summary Copied to Clipboard!" : "Copy Daily Work Log & Analytics"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Pomodoro Method Overview & Core Tenets */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is the Pomodoro Technique? Fundamentals, History, and Cognitive Foundations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The Pomodoro Technique is a globally acclaimed time management system developed by Francesco Cirillo in the late 1980s. Named after the Italian word for tomato—inspired by the tomato-shaped mechanical kitchen timer Cirillo used during his university studies—the methodology transforms time from an anxious adversary into a quantifiable metric of productive momentum.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Rather than attempting unbroken, multi-hour marathons that inevitably induce cognitive exhaustion, the Pomodoro workflow segments intensive intellectual exertion into structured, atomic work intervals (termed &quot;Pomodoros&quot;) interleaved with deliberate, restorative intervals. By establishing strict psychological boundaries around concentration and recovery, knowledge workers eliminate decision fatigue, suppress contextual multitasking, and build sustainable daily productivity cadences.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Pillar I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Timeboxing Singularity</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Committing to a single defined task per interval eliminates attention splitting and drastically reduces working memory cognitive overhead.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Pillar II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Mandatory Synaptic Rest</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Short 5-minute pauses replenish prefrontal dopamine stores, allowing metabolic waste clearance before cognitive fatigue accumulates.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Pillar III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Empirical Calibration</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Tracking estimated versus actual intervals transforms subjective scheduling into an exact, data-driven forecasting framework.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Interval Science & Chronobiology Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Pomodoro Interval Matrix & Cognitive Workflow Science
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Human neurophysiology does not support indefinite linear concentration. Modern chronobiological research demonstrates that brainwave alertness oscillates in cyclical patterns throughout the waking day. Selecting an interval cadence tuned to your task complexity prevents synaptic saturation and aligns exertion with your natural biological rhythms.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Rhythm Profile</th>
                                    <th className="p-3">Focus Sprint</th>
                                    <th className="p-3">Rest Break</th>
                                    <th className="p-3">Long Recovery</th>
                                    <th className="p-3">Cognitive Mechanism</th>
                                    <th className="p-3">Optimal Professional Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Classic Cirillo</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">25 mins</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">5 mins</td>
                                    <td className="p-3 font-mono text-slate-600">15-30m (after 4)</td>
                                    <td className="p-3 text-xs">High Procrastination Resistance</td>
                                    <td className="p-3 text-xs text-slate-600">Task triage, customer support, administrative workflows, sprint backlog clearance</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Ultradian Rhythm</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">50 mins</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">10 mins</td>
                                    <td className="p-3 font-mono text-slate-600">30m (after 3)</td>
                                    <td className="p-3 text-xs">Deep State Continuity</td>
                                    <td className="p-3 text-xs text-slate-600">Full-stack software engineering, algorithmic debugging, API architecture, data modeling</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Draugiem 52/17</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">52 mins</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">17 mins</td>
                                    <td className="p-3 font-mono text-slate-600">30m (after 3)</td>
                                    <td className="p-3 text-xs">Ergonomic Energy Balancing</td>
                                    <td className="p-3 text-xs text-slate-600">Executive strategy, deep market analysis, research reviews, financial auditing</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Sprint Micro-Bursts</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">15 mins</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">3 mins</td>
                                    <td className="p-3 font-mono text-slate-600">10m (after 4)</td>
                                    <td className="p-3 text-xs">Inertia & ADHD Mitigation</td>
                                    <td className="p-3 text-xs text-slate-600">Intimidating legacy codebases, overcoming writer&apos;s block, urgent ticket resolution</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Circadian Wave</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">90 mins</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">20 mins</td>
                                    <td className="p-3 font-mono text-slate-600">45m (after 2)</td>
                                    <td className="p-3 text-xs">Full Cognitive Cycle Flow</td>
                                    <td className="p-3 text-xs text-slate-600">Long-form technical authoring, novel writing, UX system design, scientific dissertations</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Neuroscience of Attention Residue & Cognitive Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Neuroscience of Focus: Combating Attention Residue and Context Switching
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When knowledge workers rapidly toggle between code repositories, messaging applications, and email clients, they fall victim to a neurobiological phenomenon identified by Dr. Sophie Leroy known as <strong>Attention Residue</strong>. When shifting from Task A to Task B, attention does not transition immediately; a significant portion of neural capacity remains fixated on the preceding task.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Workflow className="w-4 h-4 text-indigo-600" /> Prefrontal Cortex Fatigue
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The prefrontal cortex manages executive function, working memory, and impulse suppression. Unstructured work demands continuous micro-decisions (&quot;Should I reply to this alert now?&quot;), rapidly draining cellular glucose and reducing higher-order problem-solving capability.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" /> Attention Residue Amortization
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                By enforcing an uninterrupted 25 or 50-minute timebox dedicated exclusively to a singular objective, the Pomodoro Technique allows attention residue from previous work to fully decay, elevating the brain into an uninterrupted flow state.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" /> The Quantitative Cost of Workplace Interruptions
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-bold">23 Min 15 Sec</span>
                                <p>Average recovery time required to regain original deep focus after a single external interruption (UC Irvine Study).</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-bold">40% Efficiency Loss</span>
                                <p>Average drop in cognitive performance caused by continuous multitasking and rapid task-switching (APA Research).</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-bold">10-15 IQ Point Drop</span>
                                <p>Temporary impairment in effective functional intelligence caused by unmanaged digital notifications and inbox alerts.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Implementation Framework */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Implementation: The 6-Stage Daily Pomodoro Protocol
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To maximize productivity gains, execute your work day according to this structured six-stage operating framework:
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Morning Inventory & Task Deconstruction</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Review your backlog and select high-priority deliverables. Break complex epics into discrete actions sized between 1 and 4 Pomodoros. If a task exceeds 5 Pomodoros, decompose it into smaller operational components.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Zero-Distraction Environment Lock</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Mute Slack, close unnecessary browser tabs, activate Do Not Disturb mode on mobile devices, and place noise-canceling headphones on. Commit 100% of your visual field to the active task.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Sprint Execution (The Atomic 25 Minutes)</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Start the countdown timer and engage in single-minded execution. Do not pause the timer to check a message or look up unrelated questions. If a tangential thought arises, jot it down in your scratchpad and resume immediately.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Strict 5-Minute Synaptic Recovery</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    When the chime sounds, cease work immediately—even mid-sentence. Step away from your desk, stretch, drink water, and let your optical focus rest on a distant horizon. Never spend your break reading articles or scrolling social media.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                5
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Four-Cycle Long Recovery (15-30 Minutes)</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Upon completing four consecutive Pomodoro cycles (100 minutes of pure focus), initiate an extended 15 to 30-minute recovery break. Take a short walk, enjoy a nutritious snack, or practice mindful breathing to reset your nervous system.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                6
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Daily Retro & Estimation Calibration</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    At day&apos;s end, review your completed sprint metrics. Compare estimated vs actual Pomodoros per task, calculate your total focus minutes, and use this data to refine tomorrow&apos;s planning precision.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Best Practices for Break Protocols & Cognitive Recovery */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Coffee className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Break Ergonomics: High-Recovery vs Low-Recovery Activities
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Not all breaks provide equal neurological restorative value. The table below illustrates the critical distinction between high-recovery restorative habits and low-recovery activities that sabotage interval momentum:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Break Type</th>
                                    <th className="p-3">Recommended High-Recovery Action</th>
                                    <th className="p-3">Sub-optimal Habit to Avoid</th>
                                    <th className="p-3">Physiological Benefit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Visual & Ocular</td>
                                    <td className="p-3 text-slate-800 font-semibold">20-20-20 Rule (Look 20 feet away for 20 seconds)</td>
                                    <td className="p-3 text-rose-600">Browsing phone feeds or reading articles</td>
                                    <td className="p-3 text-xs text-slate-600">Relaxes ciliary eye muscles, mitigates digital screen strain</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Physical & Postural</td>
                                    <td className="p-3 text-slate-800 font-semibold">Doorframe chest openers, hip flexor stretches, light walking</td>
                                    <td className="p-3 text-rose-600">Remaining seated in identical slumped posture</td>
                                    <td className="p-3 text-xs text-slate-600">Restores spinal alignment, stimulates venous blood return</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Hydration & Cellular</td>
                                    <td className="p-3 text-slate-800 font-semibold">Drinking 250ml of water with electrolytes</td>
                                    <td className="p-3 text-rose-600">Downing energy drinks or sugary snacks</td>
                                    <td className="p-3 text-xs text-slate-600">Maintains cerebral perfusion, avoids post-sugar crash</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Mental & Neural</td>
                                    <td className="p-3 text-slate-800 font-semibold">Box breathing (4s in, 4s hold, 4s out, 4s hold)</td>
                                    <td className="p-3 text-rose-600">Engaging in contentious political debates online</td>
                                    <td className="p-3 text-xs text-slate-600">Down-regulates sympathetic nervous system arousal</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 6: Role-Based Workflow Use Cases */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Role-Specific Pomodoro Strategies for Modern Professionals
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Tailor your interval configuration to match the cognitive demands and interruption dynamics of your specific profession:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Software Developers</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">50/10 Ratio</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Complex software engineering involves holding extensive dependency trees in working memory. The 50/10 preset provides adequate uninterrupted runtime for unit test creation, architectural design, and complex debugging.
                            </p>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                                <li>Sprint 1: Architecture & schema design</li>
                                <li>Sprint 2: Core feature implementation</li>
                                <li>Sprint 3: Unit testing & edge case verification</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Writers & Marketers</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">25/5 or 90/20</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Overcome blank-page paralysis by using 25-minute sprints for messy first drafts, then switch to 90-minute circadian blocks for deep editing, narrative sequencing, and comprehensive keyword strategy reviews.
                            </p>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                                <li>Sprint 1: Content outline & research links</li>
                                <li>Sprint 2-3: Rapid zero-draft writing</li>
                                <li>Sprint 4: Proofreading, SEO tuning & assets</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Students & Researchers</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">25/5 Standard</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Maximize active recall and spaced repetition during study sessions. Use each 25-minute Pomodoro for flashcard testing, reading dense academic papers, or solving worked practice problems.
                            </p>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                                <li>Sprint 1: Chapter synthesis & Feynman notes</li>
                                <li>Sprint 2: Flashcard active recall drill</li>
                                <li>Sprint 3: Practice examination problems</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 7: Frequently Asked Questions (FAQ) */}
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
                                What is the classic Pomodoro Technique and why does it boost cognitive efficiency?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Pomodoro Technique, created by Francesco Cirillo in the late 1980s, divides complex work into 25-minute uninterrupted focus intervals separated by 5-minute restorative breaks. After four cycles, a longer 15 to 30-minute break is taken. This structure prevents mental exhaustion, eliminates task switching overhead, and leverages the brain&apos;s natural attention spans.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the 50/10 Ultradian Rhythm compare to the classic 25/5 Pomodoro rhythm?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While 25/5 is ideal for routine tasks, inbox triage, and overcoming procrastination, the 50/10 Ultradian Rhythm aligns with natural human brainwave cycles (90-120 minute peak alertness windows). Software engineers, writers, and technical architects frequently prefer 50-minute sprints to achieve and sustain deep programming flow states without premature interruptions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What should I do during short and long breaks to avoid breaking focus?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Effective breaks require stepping away from all digital screens. Recommended activities include physical stretching, refilling water, resting your eyes on a distant horizon (the 20-20-20 rule), and light walking. Avoid social media, reading the news, or checking emails, as these activities flood working memory with cognitive debt.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I customize the work and break interval lengths for my team or workflow?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. This tool provides instant preset toggles (Classic 25/5, Ultradian 50/10, Desk Ergonomics 52/17, and Sprint 15/3) along with granular slider controls to customize work, short break, and long break durations to match your exact schedule.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this Pomodoro timer track task estimation accuracy?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The built-in Sprint Task Planner allows you to estimate the number of Pomodoro intervals each subtask will take. As you finish intervals, the tool logs your completed vs estimated pomodoros, helping you refine your daily task scoping accuracy.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does interval timeboxing reduce cognitive fatigue and attention residue?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                According to cognitive research, it takes an average of 23 minutes and 15 seconds to regain deep focus after a distraction. By creating rigid timeboxes, Pomodoro intervals prevent multitasking, minimize attention residue, and allow working memory to clear systematically during structured breaks.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is the Pomodoro Technique suitable for software engineering and deep coding sessions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. While standard 25-minute intervals can feel brief for complex programming tasks, the 50/10 Ultradian rhythm or 90/20 Circadian block provides the uninterrupted mental runway required to build abstract architectural trees in memory while still enforcing mandatory recovery.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}