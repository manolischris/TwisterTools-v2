'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    Dices,
    History,
    Copy,
    Check,
    Download,
    Settings2,
    Trash2,
    TrendingUp,
    PieChart,
    Layers,
    Sparkles,
    Zap,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    ListOrdered,
    Plus,
    Trophy,
    BarChart3,
    Dices as DiceIcon,
    Volume2,
    VolumeX,
    Calculator,
    ShieldCheck,
    BrainCircuit,
    Lightbulb,
    Percent,
    Target
} from 'lucide-react';

// Types
type StandardDie = 4 | 6 | 8 | 10 | 12 | 20 | 100;

interface DieConfig {
    id: string;
    sides: number;
    label: string;
    color: string;
}

interface CustomPreset {
    id: string;
    name: string;
    notation: string;
    description: string;
}

interface RollDieResult {
    sides: number;
    value: number;
    color: string;
    id: string;
}

interface RollLogEntry {
    id: string;
    timestamp: Date;
    notation: string;
    results: RollDieResult[];
    modifier: number;
    dropLowest: number;
    dropHighest: number;
    total: number;
    highest: number;
    lowest: number;
    average: number;
    isCritSuccess?: boolean;
    isCritFailure?: boolean;
}

const COLOR_PALETTES = [
    { name: 'Indigo', bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', ring: 'ring-indigo-500', gradient: 'from-indigo-500 to-indigo-700' },
    { name: 'Emerald', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', ring: 'ring-emerald-500', gradient: 'from-emerald-500 to-emerald-700' },
    { name: 'Rose', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', ring: 'ring-rose-500', gradient: 'from-rose-500 to-rose-700' },
    { name: 'Amber', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600', ring: 'ring-amber-500', gradient: 'from-amber-500 to-amber-700' },
    { name: 'Sky', bg: 'bg-sky-600', text: 'text-sky-600', border: 'border-sky-600', ring: 'ring-sky-500', gradient: 'from-sky-500 to-sky-700' },
    { name: 'Purple', bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', ring: 'ring-purple-500', gradient: 'from-purple-500 to-purple-700' },
];

const DEFAULT_PRESETS: CustomPreset[] = [
    { id: 'stat-roll', name: 'D&D Stat Roll (4d6 drop lowest)', notation: '4d6k3', description: 'Standard ability score generation' },
    { id: 'advantage', name: 'Advantage (2d20 keep high)', notation: '2d20k1', description: 'Take the higher of two d20 rolls' },
    { id: 'disadvantage', name: 'Disadvantage (2d20 keep low)', notation: '2d20kl1', description: 'Take the lower of two d20 rolls' },
    { id: 'catan', name: 'Settlers of Catan (2d6)', notation: '2d6', description: 'Standard 2d6 resource distribution' },
    { id: 'percentile', name: 'Percentile Check (1d100)', notation: '1d100', description: 'Skill checks in Call of Cthulhu / Warhammer' },
];

// Helper component for rendering realistic pure-CSS polyhedral die shapes
function PolyhedralDieVisual({ sides, value, colorClass, isRolling }: { sides: number; value: number; colorClass: string; isRolling: boolean }) {
    // SVG paths for standard polyhedral die silhouettes
    const renderShapePath = () => {
        switch (sides) {
            case 4: // Tetrahedron (Triangle)
                return <polygon points="32,4 60,56 4,56" className="fill-current" />;
            case 6: // Cube (Square with rounded corners)
                return <rect x="8" y="8" width="48" height="48" rx="8" className="fill-current" />;
            case 8: // Octahedron (Diamond)
                return <polygon points="32,4 60,32 32,60 4,32" className="fill-current" />;
            case 10: // Trapezohedron (Kite / Shield shape)
                return <polygon points="32,4 58,22 46,58 18,58 6,22" className="fill-current" />;
            case 12: // Dodecahedron (Pentagon shape)
                return <polygon points="32,4 58,22 48,56 16,56 6,22" className="fill-current" />;
            case 20: // Icosahedron (20-sided D20 Triangle / Hexagon base)
                return <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" className="fill-current" />;
            case 100: // Percentile Sphere / Shield
                return <circle cx="32" cy="32" r="26" className="fill-current" />;
            default: // Custom die default polygon (Octagon)
                return <polygon points="20,4 44,4 60,20 60,44 44,60 20,60 4,44 4,20" className="fill-current" />;
        }
    };

    // Standard d6 Pip layout (if d6) or clean dynamic text overlay for other dice
    const renderD6Pips = (val: number) => {
        const pipPositions: Record<number, Array<[number, number]>> = {
            1: [[32, 32]],
            2: [[20, 20], [44, 44]],
            3: [[20, 20], [32, 32], [44, 44]],
            4: [[20, 20], [44, 20], [20, 44], [44, 44]],
            5: [[20, 20], [44, 20], [32, 32], [20, 44], [44, 44]],
            6: [[20, 20], [44, 20], [20, 32], [44, 32], [20, 44], [44, 44]],
        };

        const pips = pipPositions[val] || [];

        return pips.map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="4" className="fill-white drop-shadow-xs" />
        ));
    };

    return (
        <div className={`relative w-20 h-20 flex items-center justify-center transition-all duration-300 ${isRolling ? 'animate-bounce' : 'scale-100'}`}>
            <svg viewBox="0 0 64 64" className={`w-full h-full drop-shadow-lg text-slate-800 bg-gradient-to-br ${colorClass} rounded-2xl p-1 text-indigo-600`}>
                <g className="text-current opacity-90">{renderShapePath()}</g>
                {sides === 6 && value >= 1 && value <= 6 ? (
                    renderD6Pips(value)
                ) : (
                    <text
                        x="32"
                        y={sides === 4 ? "42" : "37"}
                        textAnchor="middle"
                        fill="white"
                        fontSize={value > 99 ? "16" : "20"}
                        fontWeight="900"
                        className="font-black drop-shadow-md select-none tracking-tight"
                    >
                        {value}
                    </text>
                )}
            </svg>
            <span className="absolute -bottom-1 bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white/20">
                d{sides}
            </span>
        </div>
    );
}

export default function DiceRoller() {
    // State: Dice Pool Setup
    const [activeDice, setActiveDice] = useState<DieConfig[]>([
        { id: '1', sides: 6, label: 'd6', color: COLOR_PALETTES[0].gradient },
        { id: '2', sides: 6, label: 'd6', color: COLOR_PALETTES[0].gradient },
    ]);
    const [modifierStr, setModifierStr] = useState<string>('0');
    const [dropLowestStr, setDropLowestStr] = useState<string>('0');
    const [dropHighestStr, setDropHighestStr] = useState<string>('0');
    const [customSidesStr, setCustomSidesStr] = useState<string>('20');

    // Animation & Audio State
    const [isRolling, setIsRolling] = useState<boolean>(false);
    const [enableSound, setEnableSound] = useState<boolean>(true);

    // Results State
    const [currentRoll, setCurrentRoll] = useState<RollLogEntry | null>(null);
    const [rollHistory, setRollHistory] = useState<RollLogEntry[]>([]);

    // UI Helpers
    const [copiedNotation, setCopiedNotation] = useState<boolean>(false);
    const [copiedLog, setCopiedLog] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'dice' | 'history' | 'stats'>('dice');

    // Input Sanitization helper
    const handleNumberInput = (value: string, setter: (val: string) => void, min: number = 0, max: number = 999) => {
        if (value === '') {
            setter('0');
            return;
        }
        const cleanValue = value.replace(/^0+(?=\d)/, '');
        const num = parseInt(cleanValue, 10);
        if (isNaN(num)) {
            setter('0');
        } else {
            const clamped = Math.max(min, Math.min(max, num));
            setter(clamped.toString());
        }
    };

    // Sound Synth Effect (Web Audio API for zero dependencies)
    const playDiceSound = useCallback(() => {
        if (!enableSound || typeof window === 'undefined') return;
        try {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();

            const count = Math.min(activeDice.length, 6);
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(150 + Math.random() * 200, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);

                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start();
                    osc.stop(ctx.currentTime + 0.08);
                }, i * 40);
            }
        } catch {
            // AudioContext fallback ignored gracefully
        }
    }, [enableSound, activeDice.length]);

    // Dice Pool Management
    const addDie = (sides: number) => {
        const paletteIndex = activeDice.length % COLOR_PALETTES.length;
        const newDie: DieConfig = {
            id: Math.random().toString(36).substring(2, 9),
            sides,
            label: `d${sides}`,
            color: COLOR_PALETTES[paletteIndex].gradient,
        };
        setActiveDice((prev) => [...prev, newDie]);
    };

    const removeDie = (id: string) => {
        setActiveDice((prev) => prev.filter((d) => d.id !== id));
    };

    const clearPool = () => {
        setActiveDice([]);
    };

    // Add Custom Die
    const handleAddCustomDie = () => {
        const sides = parseInt(customSidesStr, 10);
        if (!isNaN(sides) && sides > 1) {
            addDie(sides);
        }
    };

    // Dice Notation Calculator
    const diceNotation = useMemo(() => {
        if (activeDice.length === 0) return '0d6';

        const counts: Record<number, number> = {};
        activeDice.forEach((d) => {
            counts[d.sides] = (counts[d.sides] || 0) + 1;
        });

        const parts = Object.entries(counts).map(([sides, count]) => `${count}d${sides}`);
        let notation = parts.join('+');

        const dropLow = parseInt(dropLowestStr, 10);
        const dropHigh = parseInt(dropHighestStr, 10);
        const mod = parseInt(modifierStr, 10);

        if (dropLow > 0) notation += `k${Math.max(0, activeDice.length - dropLow)}`;
        if (dropHigh > 0) notation += `kl${Math.max(0, activeDice.length - dropHigh)}`;
        if (mod > 0) notation += `+${mod}`;
        if (mod < 0) notation += `${mod}`;

        return notation;
    }, [activeDice, dropLowestStr, dropHighestStr, modifierStr]);

    // Core Roll Functionality
    const executeRoll = useCallback(() => {
        if (activeDice.length === 0) return;

        setIsRolling(true);
        playDiceSound();

        setTimeout(() => {
            const modifier = parseInt(modifierStr, 10) || 0;
            const dropLowest = parseInt(dropLowestStr, 10) || 0;
            const dropHighest = parseInt(dropHighestStr, 10) || 0;

            // Generate raw results using Web Crypto API for secure entropy
            const rawResults: RollDieResult[] = activeDice.map((die) => {
                const array = new Uint32Array(1);
                crypto.getRandomValues(array);
                const rolledVal = (array[0] % die.sides) + 1;
                return {
                    sides: die.sides,
                    value: rolledVal,
                    color: die.color,
                    id: die.id,
                };
            });

            let workingSet = [...rawResults];

            if (dropLowest > 0 && workingSet.length > dropLowest) {
                workingSet.sort((a, b) => a.value - b.value);
                workingSet = workingSet.slice(dropLowest);
            }

            if (dropHighest > 0 && workingSet.length > dropHighest) {
                workingSet.sort((a, b) => b.value - a.value);
                workingSet = workingSet.slice(dropHighest);
            }

            const sum = workingSet.reduce((acc, curr) => acc + curr.value, 0);
            const total = sum + modifier;

            const values = rawResults.map((r) => r.value);
            const highest = Math.max(...values);
            const lowest = Math.min(...values);
            const average = parseFloat((sum / (workingSet.length || 1)).toFixed(2));

            const isCritSuccess = activeDice.length === 1 && activeDice[0].sides === 20 && rawResults[0].value === 20;
            const isCritFailure = activeDice.length === 1 && activeDice[0].sides === 20 && rawResults[0].value === 1;

            const newEntry: RollLogEntry = {
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date(),
                notation: diceNotation,
                results: rawResults,
                modifier,
                dropLowest,
                dropHighest,
                total,
                highest,
                lowest,
                average,
                isCritSuccess,
                isCritFailure,
            };

            setCurrentRoll(newEntry);
            setRollHistory((prev) => [newEntry, ...prev.slice(0, 49)]);
            setIsRolling(false);
        }, 400);
    }, [activeDice, modifierStr, dropLowestStr, dropHighestStr, diceNotation, playDiceSound]);

    // Load Preset
    const applyPreset = (preset: CustomPreset) => {
        if (preset.notation === '4d6k3') {
            setActiveDice([
                { id: '1', sides: 6, label: 'd6', color: COLOR_PALETTES[0].gradient },
                { id: '2', sides: 6, label: 'd6', color: COLOR_PALETTES[0].gradient },
                { id: '3', sides: 6, label: 'd6', color: COLOR_PALETTES[0].gradient },
                { id: '4', sides: 6, label: 'd6', color: COLOR_PALETTES[0].gradient },
            ]);
            setDropLowestStr('1');
            setDropHighestStr('0');
            setModifierStr('0');
        } else if (preset.notation === '2d20k1') {
            setActiveDice([
                { id: '1', sides: 20, label: 'd20', color: COLOR_PALETTES[0].gradient },
                { id: '2', sides: 20, label: 'd20', color: COLOR_PALETTES[1].gradient },
            ]);
            setDropLowestStr('1');
            setDropHighestStr('0');
            setModifierStr('0');
        } else if (preset.notation === '2d20kl1') {
            setActiveDice([
                { id: '1', sides: 20, label: 'd20', color: COLOR_PALETTES[0].gradient },
                { id: '2', sides: 20, label: 'd20', color: COLOR_PALETTES[1].gradient },
            ]);
            setDropLowestStr('0');
            setDropHighestStr('1');
            setModifierStr('0');
        } else if (preset.notation === '2d6') {
            setActiveDice([
                { id: '1', sides: 6, label: 'd6', color: COLOR_PALETTES[0].gradient },
                { id: '2', sides: 6, label: 'd6', color: COLOR_PALETTES[1].gradient },
            ]);
            setDropLowestStr('0');
            setDropHighestStr('0');
            setModifierStr('0');
        } else if (preset.notation === '1d100') {
            setActiveDice([
                { id: '1', sides: 100, label: 'd100', color: COLOR_PALETTES[3].gradient },
            ]);
            setDropLowestStr('0');
            setDropHighestStr('0');
            setModifierStr('0');
        }
    };

    const copyNotationToClipboard = () => {
        navigator.clipboard.writeText(diceNotation);
        setCopiedNotation(true);
        setTimeout(() => setCopiedNotation(false), 2000);
    };

    const copyLogToClipboard = () => {
        if (rollHistory.length === 0) return;
        const text = rollHistory
            .map(
                (entry) =>
                    `[${entry.timestamp.toLocaleTimeString()}] ${entry.notation}: ${entry.results
                        .map((r) => r.value)
                        .join(', ')} ${entry.modifier >= 0 ? '+' : ''}${entry.modifier} = ${entry.total}`
            )
            .join('\n');
        navigator.clipboard.writeText(text);
        setCopiedLog(true);
        setTimeout(() => setCopiedLog(false), 2000);
    };

    const exportCSV = () => {
        if (rollHistory.length === 0) return;
        const headers = ['Timestamp', 'Notation', 'Results', 'Modifier', 'Total'];
        const rows = rollHistory.map((entry) => [
            entry.timestamp.toLocaleTimeString(),
            entry.notation,
            `"${entry.results.map((r) => r.value).join(', ')}"`,
            entry.modifier,
            entry.total,
        ]);

        const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'dice_roll_history.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const poolStats = useMemo(() => {
        if (activeDice.length === 0) return { min: 0, max: 0, avg: 0 };
        const mod = parseInt(modifierStr, 10) || 0;

        const min = activeDice.length + mod;
        const max = activeDice.reduce((acc, d) => acc + d.sides, 0) + mod;
        const avg = activeDice.reduce((acc, d) => acc + (d.sides + 1) / 2, 0) + mod;

        return { min, max, avg: parseFloat(avg.toFixed(2)) };
    }, [activeDice, modifierStr]);

    const historyStats = useMemo(() => {
        if (rollHistory.length === 0) return null;
        const totals = rollHistory.map((h) => h.total);
        const sum = totals.reduce((a, b) => a + b, 0);
        const mean = parseFloat((sum / totals.length).toFixed(2));
        const highestRoll = Math.max(...totals);
        const lowestRoll = Math.min(...totals);

        return {
            totalRolls: rollHistory.length,
            mean,
            highestRoll,
            lowestRoll,
        };
    }, [rollHistory]);

    const webAppSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Dice Roller & Multi-Die Simulator',
        'url': 'https://twistertools.com/tools/random-tools/dice-roller',
        'description': 'Free online visual 3D dice roller and multi-die simulator supporting d4, d6, d8, d10, d12, d20, d100, custom dice, modifier math, drop-lowest rules, and statistical roll analysis.',
        'applicationCategory': 'UtilitiesApplication',
        'operatingSystem': 'All',
        'browserRequirements': 'Requires JavaScript. Requires HTML5.',
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
        }
    };

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
            {
                '@type': 'Question',
                'name': 'How does the True Random Number Generator (TRNG) work for these dice rolls?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'TwisterTools uses JavaScript\'s Web Cryptography API (`crypto.getRandomValues`) when available, guaranteeing cryptographically secure, high-entropy random distributions that mirror physical dice physics without pattern bias.'
                }
            },
            {
                '@type': 'Question',
                'name': 'How do I roll D&D 5e stat rolls (4d6 drop lowest)?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Select the "D&D Stat Roll (4d6 drop lowest)" preset under Quick Presets, or manually add four 6-sided dice (d6) and set the "Drop Lowest" modifier box to 1. The simulator will automatically drop the lowest die from the calculated total.'
                }
            },
            {
                '@type': 'Question',
                'name': 'Can I roll custom dice with non-standard sides like d7, d14, or d30?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Yes! Enter any numeric value above 1 into the "Custom Die Sides" input box and click "+ Add Custom Die" to append non-standard RPG or board game dice to your dice pool.'
                }
            },
            {
                '@type': 'Question',
                'name': 'Does this simulator calculate Advantage and Disadvantage for tabletop RPGs?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Yes. Use the "Advantage (2d20 keep high)" or "Disadvantage (2d20 keep low)" preset. You can also configure this manually using the Drop Lowest / Drop Highest controls on a 2d20 pool.'
                }
            },
            {
                '@type': 'Question',
                'name': 'What is the probability difference between rolling 2d6 and 1d12?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'A single 1d12 die has a flat discrete uniform probability distribution where every result from 1 to 12 has an equal 8.33% chance. Rolling 2d6 creates a triangular probability curve centered at 7 (16.67% chance), sharply decreasing the variance and making middle values significantly more likely than extreme values (1 or 12).'
                }
            },
            {
                '@type': 'Question',
                'name': 'Are physical dice rolls truly random compared to cryptographic digital dice?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Physical dice suffer from minor manufacturing defects, uneven density, rounded corner wear, and mechanical tossing bias. Digital dice using the Web Cryptography API evaluate hardware-level uniform entropy arrays, yielding mathematically pure randomness free of physical wear bias.'
                }
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-900">

                {/* WORKSPACE GRID (50/50 SPLIT) */}
                <div className="grid lg:grid-cols-2 gap-6 items-start">

                    {/* LEFT PANEL: DICE POOL BUILDER & CONTROLS */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">

                        {/* Quick Add Standard Polyhedrals */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                                Add Polyhedral Dice to Tray
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {([4, 6, 8, 10, 12, 20, 100] as StandardDie[]).map((sides) => (
                                    <button
                                        key={sides}
                                        onClick={() => addDie(sides)}
                                        className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 transition-all font-semibold group shadow-2xs active:scale-95"
                                    >
                                        <span className="text-xs font-black group-hover:scale-110 transition-transform">
                                            d{sides}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active Dice Pool Tray */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Active Tray Pool ({activeDice.length})
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEnableSound(!enableSound)}
                                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1.5 ${enableSound
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                                            }`}
                                        title={enableSound ? 'Mute sound effects' : 'Unmute sound effects'}
                                    >
                                        {enableSound ? (
                                            <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                                        ) : (
                                            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                        <span>Audio {enableSound ? 'ON' : 'OFF'}</span>
                                    </button>
                                    {activeDice.length > 0 && (
                                        <button
                                            onClick={clearPool}
                                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Clear All
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="min-h-[110px] p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap gap-2.5 items-center justify-start content-start">
                                {activeDice.length === 0 ? (
                                    <div className="w-full py-6 text-center text-slate-500 text-xs font-medium">
                                        No dice in pool. Click any polyhedral above to add it!
                                    </div>
                                ) : (
                                    activeDice.map((die) => (
                                        <div
                                            key={die.id}
                                            className={`relative group px-3 py-2 rounded-lg bg-gradient-to-br ${die.color} text-white font-bold text-sm shadow-md flex items-center gap-2 border border-white/20 animate-in fade-in duration-150`}
                                        >
                                            <span>{die.label}</span>
                                            <button
                                                onClick={() => removeDie(die.id)}
                                                className="w-4 h-4 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                                                title="Remove die"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Primary Roll Trigger & Notation */}
                        <div className="space-y-3">
                            <button
                                onClick={executeRoll}
                                disabled={activeDice.length === 0 || isRolling}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${activeDice.length === 0
                                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                    : isRolling
                                        ? 'bg-indigo-500 animate-pulse cursor-wait'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                    }`}
                            >
                                <Dices className={`w-6 h-6 ${isRolling ? 'animate-spin' : ''}`} />
                                {isRolling ? 'Rolling Dice...' : `ROLL (${diceNotation})`}
                            </button>

                            {/* Active Notation & Symmetrical Copy Button */}
                            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-slate-400">Notation Formula:</span>
                                    <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                                        {diceNotation}
                                    </code>
                                </div>
                                <button
                                    onClick={copyNotationToClipboard}
                                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                                    title="Copy notation formula"
                                >
                                    {copiedNotation ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy Formula</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ADVANCED MODIFIERS, RULE PRESETS & CUSTOM DICE */}
                        <div className="pt-5 border-t border-slate-100 space-y-5">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                    Advanced Modifiers & Drop Rules
                                </h3>
                                {/* Modifiers & Math Rules Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                            Modifier (+/-)
                                        </label>
                                        <input
                                            type="number"
                                            value={modifierStr}
                                            onChange={(e) => handleNumberInput(e.target.value, setModifierStr, -100, 100)}
                                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                            Drop Lowest
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={Math.max(0, activeDice.length - 1)}
                                            value={dropLowestStr}
                                            onChange={(e) => handleNumberInput(e.target.value, setDropLowestStr, 0, Math.max(0, activeDice.length - 1))}
                                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                            Drop Highest
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={Math.max(0, activeDice.length - 1)}
                                            value={dropHighestStr}
                                            onChange={(e) => handleNumberInput(e.target.value, setDropHighestStr, 0, Math.max(0, activeDice.length - 1))}
                                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-800 text-center focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                    Quick Rule Presets
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {DEFAULT_PRESETS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors"
                                            title={preset.description}
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Die Creator */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                    <Settings2 className="w-3.5 h-3.5 text-indigo-600" /> Custom Die Sides
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="2"
                                        max="1000"
                                        value={customSidesStr}
                                        onChange={(e) => handleNumberInput(e.target.value, setCustomSidesStr, 2, 1000)}
                                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Sides (e.g. 7, 30)"
                                    />
                                    <button
                                        onClick={handleAddCustomDie}
                                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 shrink-0"
                                    >
                                        <Plus className="w-4 h-4" /> Add Die
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: DISPLAY & ANALYTICS */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6 min-h-[500px] flex flex-col justify-between">

                        <div>
                            {/* Tab Navigation */}
                            <div className="flex items-center gap-1 border-b border-slate-200 pb-3 mb-5">
                                <button
                                    onClick={() => setActiveTab('dice')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'dice'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> Visual Display
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'history'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <History className="w-3.5 h-3.5" /> History ({rollHistory.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('stats')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'stats'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <BarChart3 className="w-3.5 h-3.5" /> Probability Stats
                                </button>
                            </div>

                            {/* TAB 1: VISUAL ROLL DISPLAY & RESULTS */}
                            {activeTab === 'dice' && (
                                <div className="space-y-6">
                                    {currentRoll ? (
                                        <div className="space-y-5 animate-in fade-in duration-200">

                                            {/* Critical Result Banners */}
                                            {currentRoll.isCritSuccess && (
                                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 font-bold text-center text-sm flex items-center justify-center gap-2">
                                                    <Trophy className="w-4 h-4 text-amber-600" />
                                                    NATURAL 20! CRITICAL SUCCESS!
                                                </div>
                                            )}
                                            {currentRoll.isCritFailure && (
                                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-800 font-bold text-center text-sm flex items-center justify-center gap-2">
                                                    <Zap className="w-4 h-4 text-rose-600" />
                                                    NATURAL 1! CRITICAL FAILURE!
                                                </div>
                                            )}

                                            {/* Visual Polyhedral Dice Tray Stage */}
                                            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner space-y-4">
                                                <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block text-center">
                                                    Visual Polyhedral Outcomes
                                                </label>
                                                <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                                                    {currentRoll.results.map((res, idx) => (
                                                        <PolyhedralDieVisual
                                                            key={idx}
                                                            sides={res.sides}
                                                            value={res.value}
                                                            colorClass={res.color}
                                                            isRolling={isRolling}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Giant Total Result Box */}
                                            <div className="text-center p-5 bg-slate-900 rounded-2xl text-white shadow-inner relative overflow-hidden border border-slate-800">
                                                <div className="text-xs uppercase font-bold text-indigo-400 tracking-wider mb-1">
                                                    Total Result ({currentRoll.notation})
                                                </div>
                                                <div className={`text-6xl font-black tracking-tight ${isRolling ? 'scale-90 opacity-50' : 'scale-100'} transition-all duration-150`}>
                                                    {currentRoll.total}
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs text-slate-400">
                                                    <div>
                                                        <span className="block text-[10px] uppercase text-slate-500">Highest</span>
                                                        <span className="font-semibold text-slate-200">{currentRoll.highest}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] uppercase text-slate-500">Lowest</span>
                                                        <span className="font-semibold text-slate-200">{currentRoll.lowest}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] uppercase text-slate-500">Average</span>
                                                        <span className="font-semibold text-slate-200">{currentRoll.average}</span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    ) : (
                                        <div className="py-16 text-center text-slate-400 space-y-3">
                                            <DiceIcon className="w-12 h-12 mx-auto text-slate-300 animate-bounce" />
                                            <p className="text-sm font-medium">Ready to Roll! Choose your dice pool and hit Roll.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: ROLL HISTORY LOG */}
                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Recent Roll Log (Max 50)
                                        </span>
                                        {rollHistory.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={copyLogToClipboard}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                                >
                                                    {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                    Copy Log
                                                </button>
                                                <button
                                                    onClick={exportCSV}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> CSV
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                                        {rollHistory.length === 0 ? (
                                            <div className="py-12 text-center text-slate-400 text-xs font-medium">
                                                No roll history recorded yet.
                                            </div>
                                        ) : (
                                            rollHistory.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                                                >
                                                    <div>
                                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                                            <span>{item.notation}</span>
                                                            <span className="text-[10px] font-normal text-slate-400">
                                                                {item.timestamp.toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        <div className="text-slate-500 font-mono mt-0.5">
                                                            [{item.results.map((r) => r.value).join(', ')}] {item.modifier !== 0 ? `(${item.modifier > 0 ? '+' : ''}${item.modifier})` : ''}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-base font-black text-indigo-600">{item.total}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: PROBABILITY & STATS */}
                            {activeTab === 'stats' && (
                                <div className="space-y-5">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                            <TrendingUp className="w-4 h-4 text-indigo-600" /> Active Pool Theoretical Limits
                                        </h3>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Min Score</div>
                                                <div className="text-lg font-bold text-slate-800">{poolStats.min}</div>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Avg Expected</div>
                                                <div className="text-lg font-bold text-indigo-600">{poolStats.avg}</div>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                                <div className="text-[10px] uppercase font-bold text-slate-400">Max Score</div>
                                                <div className="text-lg font-bold text-slate-800">{poolStats.max}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {historyStats && (
                                        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                                                <PieChart className="w-4 h-4 text-indigo-600" /> Session Roll History Stats
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex justify-between p-2 bg-white rounded border border-indigo-100">
                                                    <span className="text-slate-500">Total Rolls:</span>
                                                    <span className="font-bold text-slate-800">{historyStats.totalRolls}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-white rounded border border-indigo-100">
                                                    <span className="text-slate-500">Observed Mean:</span>
                                                    <span className="font-bold text-indigo-600">{historyStats.mean}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-white rounded border border-indigo-100">
                                                    <span className="text-slate-500">Session High:</span>
                                                    <span className="font-bold text-emerald-600">{historyStats.highestRoll}</span>
                                                </div>
                                                <div className="flex justify-between p-2 bg-white rounded border border-indigo-100">
                                                    <span className="text-slate-500">Session Low:</span>
                                                    <span className="font-bold text-rose-600">{historyStats.lowestRoll}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                            TwisterTools TRNG Engine v2.0 • Cryptographically Secure Uniform Random Distribution
                        </div>

                    </div>
                </div>

                {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
                <div className="space-y-6">

                    {/* CARD 1: OVERVIEW & SYSTEM ARCHITECTURE */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Enterprise Visual Polyhedral Dice Roller & Randomization Engine
                            </h2>
                        </div>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Welcome to the definitive browser-native <strong>Dice Roller and Multi-Die Simulator</strong> engineered for tabletop roleplaying game (TTRPG) players, game masters, board game enthusiasts, and statistical analysts. Designed from the ground up for high-precision randomness and rich visual representation, this utility eliminates physical dice distribution bias by leveraging Web Cryptography hardware primitives.
                        </p>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Whether you are executing complex Dungeons & Dragons (D&D 5e) stat generation rolls using custom drop rules, rolling high-volume Warhammer d6 pools, or resolving critical skill checks in Call of Cthulhu percentile systems, this simulator delivers zero-latency results backed by comprehensive polyhedral SVG visuals, probability statistics, and roll history tracking.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cryptographic TRNG Randomness
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Bypasses deterministic software pseudo-random algorithms like <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Math.random()</code> in favor of hardware entropy via <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">crypto.getRandomValues</code>, delivering true uniform probability across all polyhedral dice faces.
                                </p>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Dices className="w-4 h-4 text-indigo-600" /> Full Polyhedral & Custom Sides
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Supports d4, d6, d8, d10, d12, d20, and d100 percentile dice natively, alongside a custom die generator capable of resolving non-standard geometry ranging from d2 up to d1000.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: MATHEMATICAL FOUNDATIONS & PROBABILITY CURVES */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Mathematical Foundations: Discrete Uniform Distributions vs. Central Limit Theorem
                            </h2>
                        </div>

                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Understanding tabletop probability requires distinguishing between single-die rolls and multi-dice pool combinations. A single die with $S$ sides (such as a 20-sided d20) represents a pure <strong>discrete uniform distribution</strong>:
                        </p>

                        <div className="p-4 bg-slate-900 text-indigo-300 rounded-xl font-mono text-xs sm:text-sm text-center overflow-x-auto border border-slate-800">
                            P(X = k) = 1 / S &nbsp;&nbsp;&nbsp;&nbsp; for all k ∈ &#123;1, 2, ..., S&#125;
                        </div>

                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            However, when rolling multiple dice (e.g., $n$ dice with $S$ sides), the total sum follows a discrete convolution of uniform distributions. As the number of dice $n$ increases, the probability mass function transitions from a flat line into a bell-shaped curve governed by the <strong>Central Limit Theorem (CLT)</strong>.
                        </p>

                        {/* Polyhedral Theoretical Expectations Table */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                                Polyhedral Dice Reference Specifications & Expected Values
                            </h3>
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                                    <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="p-3">Die Type</th>
                                            <th className="p-3">Geometry / Shape</th>
                                            <th className="p-3">Min Value</th>
                                            <th className="p-3">Max Value</th>
                                            <th className="p-3">Single Die Mean E(X)</th>
                                            <th className="p-3">Single Die Variance (σ²)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-medium">
                                        <tr className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-indigo-600">d4</td>
                                            <td className="p-3">Tetrahedron</td>
                                            <td className="p-3">1</td>
                                            <td className="p-3">4</td>
                                            <td className="p-3 font-mono">2.50</td>
                                            <td className="p-3 font-mono">1.25</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-indigo-600">d6</td>
                                            <td className="p-3">Cube</td>
                                            <td className="p-3">1</td>
                                            <td className="p-3">6</td>
                                            <td className="p-3 font-mono">3.50</td>
                                            <td className="p-3 font-mono">2.92</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-indigo-600">d8</td>
                                            <td className="p-3">Octahedron</td>
                                            <td className="p-3">1</td>
                                            <td className="p-3">8</td>
                                            <td className="p-3 font-mono">4.50</td>
                                            <td className="p-3 font-mono">5.25</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-indigo-600">d10</td>
                                            <td className="p-3">Pentagonal Trapezohedron</td>
                                            <td className="p-3">1</td>
                                            <td className="p-3">10</td>
                                            <td className="p-3 font-mono">5.50</td>
                                            <td className="p-3 font-mono">8.25</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-indigo-600">d12</td>
                                            <td className="p-3">Dodecahedron</td>
                                            <td className="p-3">1</td>
                                            <td className="p-3">12</td>
                                            <td className="p-3 font-mono">6.50</td>
                                            <td className="p-3 font-mono">11.92</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                            <td className="p-3 font-bold text-indigo-700">d20</td>
                                            <td className="p-3">Icosahedron</td>
                                            <td className="p-3">1</td>
                                            <td className="p-3">20</td>
                                            <td className="p-3 font-mono font-bold text-indigo-700">10.50</td>
                                            <td className="p-3 font-mono">33.25</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-indigo-600">d100</td>
                                            <td className="p-3">Percentile Sphere / Zocchihedron</td>
                                            <td className="p-3">1</td>
                                            <td className="p-3">100</td>
                                            <td className="p-3 font-mono">50.50</td>
                                            <td className="p-3 font-mono">833.25</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* CARD 3: WORKED PROBABILITY CASE STUDIES */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                <Lightbulb className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Worked TTRPG Probability Case Studies & Step-by-Step Calculations
                            </h2>
                        </div>

                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Explore these practical mathematical breakdowns for popular tabletop game mechanics to optimize your character builds and strategic rolls:
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Case Study 1 */}
                            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-900 text-sm sm:text-base">Case A: D&D 5e Advantage (2d20 keep highest)</span>
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">Order Statistics</span>
                                </div>
                                <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                                    <li><strong>Objective:</strong> Calculate the cumulative probability of hitting a target Armor Class (DC) with Advantage.</li>
                                    <li><strong>Formula:</strong> P(At least one d20 ≥ DC) = 1 - ((DC - 1) / 20)²</li>
                                    <li><strong>Step 1 (DC 15 Check):</strong> Unfavorable outcomes per die = 14/20 = 0.70.</li>
                                    <li><strong>Step 2 (Both Fail):</strong> 0.70 × 0.70 = 0.49 (49% failure rate).</li>
                                    <li><strong>Step 3 (Success Rate):</strong> 1 - 0.49 = 0.51 (51.00% success rate vs 30.00% standard).</li>
                                    <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                        • Result: Advantage adds an effective average bonus of ~+3.32 to +5.00 on d20 rolls.
                                    </li>
                                </ul>
                            </div>

                            {/* Case Study 2 */}
                            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-900 text-sm sm:text-base">Case B: Ability Score Generation (4d6 drop lowest)</span>
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">Combinatorics</span>
                                </div>
                                <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                                    <li><strong>Objective:</strong> Find expected mean for 4d6 keep 3 highest vs standard 3d6.</li>
                                    <li><strong>Total Sample Outcomes:</strong> 6⁴ = 1,296 distinct combinations.</li>
                                    <li><strong>Standard 3d6 Mean:</strong> 3 × 3.5 = 10.50 (range 3 to 18).</li>
                                    <li><strong>4d6 Drop Lowest Mean:</strong> Summing weighted top 3 values yields <strong>12.24</strong>.</li>
                                    <li><strong>Probability of 18:</strong> 21 / 1,296 = 1.62% (vs 0.46% on 3d6).</li>
                                    <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                        • Result: Dropping the lowest die increases average stat scores by +1.74 points.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* CARD 4: ADVANTAGE VS DISADVANTAGE MATRIX */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                <Target className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                D&D 5e Advantage, Disadvantage & Straight Roll Probability Matrix
                            </h2>
                        </div>

                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Compare the exact success rates across target Difficulty Classes (DC 1 through 20) for a straight d20 roll, rolling with Advantage (2d20 keep high), and rolling with Disadvantage (2d20 keep low):
                        </p>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Target DC</th>
                                        <th className="p-3">Straight Roll (1d20)</th>
                                        <th className="p-3 text-emerald-700">With Advantage (2d20k1)</th>
                                        <th className="p-3 text-rose-700">With Disadvantage (2d20kl1)</th>
                                        <th className="p-3">Advantage Shift (+/-)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-mono font-medium">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-900 font-sans">DC 5</td>
                                        <td className="p-3">80.00%</td>
                                        <td className="p-3 text-emerald-700 font-bold">96.00%</td>
                                        <td className="p-3 text-rose-700">64.00%</td>
                                        <td className="p-3 text-indigo-600 font-bold">+16.00%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-900 font-sans">DC 10</td>
                                        <td className="p-3">55.00%</td>
                                        <td className="p-3 text-emerald-700 font-bold">79.75%</td>
                                        <td className="p-3 text-rose-700">30.25%</td>
                                        <td className="p-3 text-indigo-600 font-bold">+24.75%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                        <td className="p-3 font-bold text-slate-900 font-sans">DC 11 (Midpoint)</td>
                                        <td className="p-3">50.00%</td>
                                        <td className="p-3 text-emerald-700 font-bold">75.00%</td>
                                        <td className="p-3 text-rose-700">25.00%</td>
                                        <td className="p-3 text-indigo-600 font-bold">+25.00% (Max)</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-900 font-sans">DC 15</td>
                                        <td className="p-3">30.00%</td>
                                        <td className="p-3 text-emerald-700 font-bold">51.00%</td>
                                        <td className="p-3 text-rose-700">9.00%</td>
                                        <td className="p-3 text-indigo-600 font-bold">+21.00%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-900 font-sans">DC 20 (Crit Only)</td>
                                        <td className="p-3">5.00%</td>
                                        <td className="p-3 text-emerald-700 font-bold">9.75%</td>
                                        <td className="p-3 text-rose-700">0.25%</td>
                                        <td className="p-3 text-indigo-600 font-bold">+4.75%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* CARD 5: COGNITIVE BIASES & PHYSICAL VS DIGITAL randomness */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Physical Dice Wear & Bias vs. Digital Cryptographic Randomness
                            </h2>
                        </div>

                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Physical dice are subject to physical manufacturing tolerances, face imbalance, corner rounding wear, and hand-tossing biases. Digital random number generation eliminates these physical variables:
                        </p>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm">Physical Density Variations</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Opaque plastic dice frequently contain internal air bubbles and uneven color pigment distributions, weighting specific faces (most commonly biasing d20s toward lower numbers).
                                </p>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm">Clustering Fallacy</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Humans intuitively expect random sequences to alternate evenly. When rolling 3 low numbers in a row, players falsely perceive a &quot;cold die,&quot; ignoring true uniform variance.
                                </p>
                            </div>
                            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm">Web Crypto Entropy</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Our engine samples local device hardware thermal noise and electrical variance via <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">crypto.getRandomValues</code>, delivering zero-bias uniform outcomes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CARD 6: EXTENDED FREQUENTLY ASKED QUESTIONS */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Frequently Asked Questions
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                                <h3 className="font-bold text-slate-900 text-base mb-1">
                                    How does the True Random Number Generator (TRNG) work for these dice rolls?
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                    TwisterTools uses JavaScript&apos;s Web Cryptography API (<code className="text-xs bg-indigo-100/70 px-1 py-0.5 rounded text-indigo-900">crypto.getRandomValues</code>) when available, guaranteeing cryptographically secure, high-entropy random distributions that mirror physical dice physics without pattern bias.
                                </p>
                            </div>

                            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                                <h3 className="font-bold text-slate-900 text-base mb-1">
                                    How do I roll D&D 5e stat rolls (4d6 drop lowest)?
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                    Select the &quot;D&amp;D Stat Roll (4d6 drop lowest)&quot; preset under Quick Presets, or manually add four 6-sided dice (d6) and set the &quot;Drop Lowest&quot; modifier box to 1. The simulator will automatically drop the lowest die from the calculated total.
                                </p>
                            </div>

                            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                                <h3 className="font-bold text-slate-900 text-base mb-1">
                                    Can I roll custom dice with non-standard sides like d7, d14, or d30?
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                    Yes! Enter any numeric value above 1 into the &quot;Custom Die Sides&quot; input box and click &quot;+ Add Custom Die&quot; to append non-standard RPG or board game dice to your dice pool.
                                </p>
                            </div>

                            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                                <h3 className="font-bold text-slate-900 text-base mb-1">
                                    Does this simulator calculate Advantage and Disadvantage for tabletop RPGs?
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                    Yes. Use the &quot;Advantage (2d20 keep high)&quot; or &quot;Disadvantage (2d20 keep low)&quot; preset. You can also configure this manually using the Drop Lowest / Drop Highest controls on a 2d20 pool.
                                </p>
                            </div>

                            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                                <h3 className="font-bold text-slate-900 text-base mb-1">
                                    What is the probability difference between rolling 2d6 and 1d12?
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                    A single 1d12 die has a flat discrete uniform probability distribution where every result from 1 to 12 has an equal 8.33% chance. Rolling 2d6 creates a triangular probability curve centered at 7 (16.67% chance), sharply decreasing variance and making extreme totals (2 or 12) rare (2.78% each).
                                </p>
                            </div>

                            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                                <h3 className="font-bold text-slate-900 text-base mb-1">
                                    Are physical dice rolls truly random compared to cryptographic digital dice?
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                    Physical dice suffer from minor manufacturing defects, uneven density, rounded corner wear, and mechanical tossing bias. Digital dice using the Web Cryptography API evaluate hardware-level uniform entropy arrays, yielding mathematically pure randomness free of physical wear bias.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}