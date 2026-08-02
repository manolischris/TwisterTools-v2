"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
    Calculator,
    Percent,
    Dices,
    Layers,
    BarChart3,
    Copy,
    Check,
    RefreshCw,
    Trash2,
    HelpCircle,
    BookOpen,
    Info,
    ShieldCheck,
    Zap,
    Award,
    Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Pure Combinatorics & Probability Calculations Engine
// ─────────────────────────────────────────────────────────────

/** Calculates Factorial n! */
function factorial(n: number): number {
    if (n < 0) return 0;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

/** Combinations nCr = n! / (r! * (n - r)!) */
function combinations(n: number, r: number): number {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    if (r > n / 2) r = n - r;
    let res = 1;
    for (let i = 1; i <= r; i++) {
        res = (res * (n - r + i)) / i;
    }
    return Math.round(res);
}

/** Permutations nPr = n! / (n - r)! */
function permutations(n: number, r: number): number {
    if (r < 0 || r > n) return 0;
    let res = 1;
    for (let i = 0; i < r; i++) {
        res *= n - i;
    }
    return Math.round(res);
}

/** Binomial Probability P(X = k) */
function binomialPMF(n: number, k: number, p: number): number {
    return combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/** Convert probability [0, 1] to Odds in Favor / Against */
function probToOdds(p: number): { favor: string; against: string } {
    if (p <= 0) return { favor: "0 : 1", against: "1 : 0" };
    if (p >= 1) return { favor: "1 : 0", against: "0 : 1" };
    const oddsRatio = p / (1 - p);
    // Simple integer approximation
    let bestNum = 1;
    let bestDen = 1;
    let minDiff = Math.abs(oddsRatio - 1);
    for (let den = 1; den <= 100; den++) {
        const num = Math.round(oddsRatio * den);
        const diff = Math.abs(oddsRatio - num / den);
        if (diff < minDiff) {
            minDiff = diff;
            bestNum = num;
            bestDen = den;
        }
    }
    return {
        favor: `${bestNum} : ${bestDen}`,
        against: `${bestDen} : ${bestNum}`,
    };
}

type Mode = "single" | "two-events" | "series" | "binomial";

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    // Parse string, stripping undesirable leading zeros like "0100" -> 100
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function ProbabilityCalculator() {
    const [mode, setMode] = useState<Mode>("single");
    const [copied, setCopied] = useState(false);

    // Single Event State
    const [favorable, setFavorable] = useState<number>(1);
    const [totalOutcomes, setTotalOutcomes] = useState<number>(6);

    // Two Events State
    const [probA, setProbA] = useState<number>(50);
    const [probB, setProbB] = useState<number>(50);
    const [isIndependent, setIsIndependent] = useState<boolean>(true);
    const [probBgivenA, setProbBgivenA] = useState<number>(50);

    // Series / Repeated State
    const [singleProb, setSingleProb] = useState<number>(20);
    const [trialsSeries, setTrialsSeries] = useState<number>(10);

    // Binomial State
    const [nTrials, setNTrials] = useState<number>(10);
    const [kSuccesses, setKSuccesses] = useState<number>(3);
    const [pSuccess, setPSuccess] = useState<number>(50);

    // ─────────────────────────────────────────────────────────────
    // Computed Calculations
    // ─────────────────────────────────────────────────────────────

    const singleResults = useMemo(() => {
        const fav = Math.max(0, favorable);
        const tot = Math.max(1, totalOutcomes);
        const p = Math.min(1, Math.max(0, fav / tot));
        const odds = probToOdds(p);
        return {
            p,
            percentage: (p * 100).toFixed(2),
            complement: ((1 - p) * 100).toFixed(2),
            oddsFavor: odds.favor,
            oddsAgainst: odds.against,
        };
    }, [favorable, totalOutcomes]);

    const twoEventsResults = useMemo(() => {
        const pA = Math.min(1, Math.max(0, probA / 100));
        const pB = Math.min(1, Math.max(0, probB / 100));
        const pB_A = isIndependent
            ? pB
            : Math.min(1, Math.max(0, probBgivenA / 100));

        const pAnd = pA * pB_A;
        const pOr = Math.min(1, pA + pB - pAnd);
        const pAnotB = pA - pAnd;
        const pNeither = 1 - pOr;

        return {
            pAnd: (pAnd * 100).toFixed(2),
            pOr: (pOr * 100).toFixed(2),
            pAnotB: (pAnotB * 100).toFixed(2),
            pNeither: (pNeither * 100).toFixed(2),
        };
    }, [probA, probB, isIndependent, probBgivenA]);

    const seriesResults = useMemo(() => {
        const p = Math.min(1, Math.max(0, singleProb / 100));
        const n = Math.max(1, Math.min(500, trialsSeries));

        const pAtLeastOnce = 1 - Math.pow(1 - p, n);
        const pAll = Math.pow(p, n);
        const pNone = Math.pow(1 - p, n);

        return {
            pAtLeastOnce: (pAtLeastOnce * 100).toFixed(4),
            pAll: (pAll * 100).toFixed(6),
            pNone: (pNone * 100).toFixed(4),
        };
    }, [singleProb, trialsSeries]);

    const binomialResults = useMemo(() => {
        const n = Math.max(1, Math.min(200, nTrials));
        const k = Math.max(0, Math.min(n, kSuccesses));
        const p = Math.min(1, Math.max(0, pSuccess / 100));

        const exact = binomialPMF(n, k, p);

        let atLeast = 0;
        for (let i = k; i <= n; i++) {
            atLeast += binomialPMF(n, i, p);
        }

        let atMost = 0;
        for (let i = 0; i <= k; i++) {
            atMost += binomialPMF(n, i, p);
        }

        const mean = n * p;
        const stdDev = Math.sqrt(n * p * (1 - p));

        return {
            exact: (exact * 100).toFixed(4),
            atLeast: (atLeast * 100).toFixed(4),
            atMost: (atMost * 100).toFixed(4),
            mean: mean.toFixed(2),
            stdDev: stdDev.toFixed(4),
        };
    }, [nTrials, kSuccesses, pSuccess]);

    // Handle Copy Output
    const handleCopy = useCallback(() => {
        let summaryText = "";
        if (mode === "single") {
            summaryText = `Single Event Probability:\nProbability: ${singleResults.percentage}%\nComplement: ${singleResults.complement}%\nOdds in Favor: ${singleResults.oddsFavor}\nOdds Against: ${singleResults.oddsAgainst}`;
        } else if (mode === "two-events") {
            summaryText = `Two Events Probability:\nP(A AND B): ${twoEventsResults.pAnd}%\nP(A OR B): ${twoEventsResults.pOr}%\nP(A ONLY): ${twoEventsResults.pAnotB}%\nP(NEITHER): ${twoEventsResults.pNeither}%`;
        } else if (mode === "series") {
            summaryText = `Series / Repeated Trials:\nAt Least Once: ${seriesResults.pAtLeastOnce}%\nAll Trials: ${seriesResults.pAll}%\nNone: ${seriesResults.pNone}%`;
        } else {
            summaryText = `Binomial Probability:\nExact P(X = ${kSuccesses}): ${binomialResults.exact}%\nP(X ≥ ${kSuccesses}): ${binomialResults.atLeast}%\nP(X ≤ ${kSuccesses}): ${binomialResults.atMost}%\nMean Expected Successes: ${binomialResults.mean}\nStd Dev: ${binomialResults.stdDev}`;
        }

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [
        mode,
        singleResults,
        twoEventsResults,
        seriesResults,
        binomialResults,
        kSuccesses,
    ]);

    const clearInputs = () => {
        setFavorable(1);
        setTotalOutcomes(6);
        setProbA(50);
        setProbB(50);
        setIsIndependent(true);
        setProbBgivenA(50);
        setSingleProb(20);
        setTrialsSeries(10);
        setNTrials(10);
        setKSuccesses(3);
        setPSuccess(50);
    };

    return (
        <div className="w-full space-y-8">

            {/* ── 50/50 Split Workspace Grid ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT CONTROLS ══════════════════ */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                    {/* Mode Selector Tabs */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Select Calculation Mode
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-xl">
                            {(
                                [
                                    { id: "single", label: "Single Event", icon: Dices },
                                    { id: "two-events", label: "Two Events", icon: Layers },
                                    { id: "series", label: "Series / Repeat", icon: BarChart3 },
                                    { id: "binomial", label: "Binomial", icon: Percent },
                                ] as const
                            ).map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setMode(id)}
                                    className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all min-h-[50px] ${mode === id
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode 1: Single Event Inputs */}
                    {mode === "single" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Number of Favorable Outcomes (m)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={favorable === 0 ? "" : favorable}
                                    onChange={(e) => handleNumberInput(e, setFavorable)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                    placeholder="e.g. 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Total Possible Outcomes (n)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={totalOutcomes === 0 ? "" : totalOutcomes}
                                    onChange={(e) => handleNumberInput(e, setTotalOutcomes)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                    placeholder="e.g. 6"
                                />
                            </div>
                        </div>
                    )}

                    {/* Mode 2: Two Events Inputs */}
                    {mode === "two-events" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        P(Event A) %
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={probA === 0 ? "" : probA}
                                        onChange={(e) => handleNumberInput(e, setProbA)}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        P(Event B) %
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={probB === 0 ? "" : probB}
                                        onChange={(e) => handleNumberInput(e, setProbB)}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">
                                    Events are Independent?
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsIndependent(!isIndependent)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isIndependent ? "bg-indigo-600" : "bg-slate-300"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isIndependent ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {!isIndependent && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Conditional P(B given A) %
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={probBgivenA === 0 ? "" : probBgivenA}
                                        onChange={(e) => handleNumberInput(e, setProbBgivenA)}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mode 3: Series Inputs */}
                    {mode === "series" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Single Trial Probability (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={singleProb === 0 ? "" : singleProb}
                                    onChange={(e) => handleNumberInput(e, setSingleProb)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                    placeholder="e.g. 20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Number of Trials (n)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={trialsSeries === 0 ? "" : trialsSeries}
                                    onChange={(e) => handleNumberInput(e, setTrialsSeries)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                    placeholder="e.g. 10"
                                />
                            </div>
                        </div>
                    )}

                    {/* Mode 4: Binomial Distribution Inputs */}
                    {mode === "binomial" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Total Trials (n)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="200"
                                        value={nTrials === 0 ? "" : nTrials}
                                        onChange={(e) => handleNumberInput(e, setNTrials)}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Target Successes (k)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={nTrials}
                                        value={kSuccesses === 0 ? "" : kSuccesses}
                                        onChange={(e) => handleNumberInput(e, setKSuccesses)}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Success Probability Per Trial (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={pSuccess === 0 ? "" : pSuccess}
                                    onChange={(e) => handleNumberInput(e, setPSuccess)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Row */}
                    <div className="pt-2 flex gap-3">
                        <button
                            onClick={clearInputs}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: RESULTS DISPLAY ══════════════════ */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base font-bold text-slate-900">
                                Calculated Metrics & Odds
                            </h2>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Results</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Single Event Results */}
                    {mode === "single" && (
                        <div className="space-y-4">
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-center">
                                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block mb-1">
                                    Probability
                                </span>
                                <span className="text-3xl font-extrabold text-slate-900">
                                    {singleResults.percentage}%
                                </span>
                                <span className="block text-xs text-slate-500 mt-1">
                                    Decimal: {singleResults.p.toFixed(6)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                        Complement P(Not E)
                                    </span>
                                    <span className="text-base font-bold text-slate-800">
                                        {singleResults.complement}%
                                    </span>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                        Odds In Favor
                                    </span>
                                    <span className="text-base font-bold text-slate-800">
                                        {singleResults.oddsFavor}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                    Odds Against
                                </span>
                                <span className="text-base font-bold text-slate-800">
                                    {singleResults.oddsAgainst}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Two Events Results */}
                    {mode === "two-events" && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                                <span className="text-[10px] font-semibold text-indigo-600 uppercase block mb-1">
                                    P(A AND B)
                                </span>
                                <span className="text-xl font-extrabold text-slate-900">
                                    {twoEventsResults.pAnd}%
                                </span>
                            </div>

                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                                <span className="text-[10px] font-semibold text-indigo-600 uppercase block mb-1">
                                    P(A OR B)
                                </span>
                                <span className="text-xl font-extrabold text-slate-900">
                                    {twoEventsResults.pOr}%
                                </span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                                    P(A ONLY)
                                </span>
                                <span className="text-lg font-bold text-slate-800">
                                    {twoEventsResults.pAnotB}%
                                </span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                                    P(NEITHER)
                                </span>
                                <span className="text-lg font-bold text-slate-800">
                                    {twoEventsResults.pNeither}%
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Series Results */}
                    {mode === "series" && (
                        <div className="space-y-3">
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-center">
                                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block mb-1">
                                    P(Occurs At Least Once in {trialsSeries} Trials)
                                </span>
                                <span className="text-3xl font-extrabold text-slate-900">
                                    {seriesResults.pAtLeastOnce}%
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                        P(All {trialsSeries} Succeed)
                                    </span>
                                    <span className="text-base font-bold text-slate-800">
                                        {seriesResults.pAll}%
                                    </span>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                        P(None Succeed)
                                    </span>
                                    <span className="text-base font-bold text-slate-800">
                                        {seriesResults.pNone}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Binomial Results */}
                    {mode === "binomial" && (
                        <div className="space-y-3">
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-center">
                                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block mb-1">
                                    Exact P(X = {kSuccesses})
                                </span>
                                <span className="text-3xl font-extrabold text-slate-900">
                                    {binomialResults.exact}%
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                        Cumulative P(X ≥ {kSuccesses})
                                    </span>
                                    <span className="text-base font-bold text-slate-800">
                                        {binomialResults.atLeast}%
                                    </span>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                        Cumulative P(X ≤ {kSuccesses})
                                    </span>
                                    <span className="text-base font-bold text-slate-800">
                                        {binomialResults.atMost}%
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                        Expected Mean (μ)
                                    </span>
                                    <span className="text-base font-bold text-slate-800">
                                        {binomialResults.mean}
                                    </span>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                        Std Deviation (σ)
                                    </span>
                                    <span className="text-base font-bold text-slate-800">
                                        {binomialResults.stdDev}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT (EXPLICIT WHITE CARDS)
      ───────────────────────────────────────────────────────────── */}

            {/* Card 1: Foundations of Probability */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span>Foundations of Probability Theory & Event Mechanics</span>
                </h2>
                <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                    <p>
                        Probability quantifies the likelihood that a specific event will occur within a defined sample space. Formally defined by the Kolmogorov axioms, probability values range strictly from 0 (impossible event) to 1 (certain event), often expressed as a percentage between 0% and 100%.
                    </p>
                    <p>
                        When calculating single-event classical probability, we assume all sample space outcomes are equally likely. The classic probability formula is given by:
                    </p>
                    <div className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center font-mono text-indigo-700 font-semibold">
                        P(E) = favorable outcomes (m) / total outcomes (n)
                    </div>
                    <p>
                        Beyond simple counts, understanding odds versus probability is crucial in risk management, gaming, and decision science. While probability measures favorable outcomes relative to total outcomes, <strong>odds in favor</strong> compare favorable outcomes directly to unfavorable outcomes ($m : (n - m)$).
                    </p>
                </div>
            </div>

            {/* Card 2: Joint, Conditional, & Series Events */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span>Joint, Conditional, and Multi-Trial Series Events</span>
                </h2>
                <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                    <p>
                        In practical applications, decision-makers frequently evaluate compound events involving two or more conditions:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>Intersection (AND Logic):</strong> $P(A \cap B) = P(A) \times P(B|A)$. For independent events, this simplifies to $P(A) \times P(B)$.
                        </li>
                        <li>
                            <strong>Union (OR Logic):</strong> $P(A \cup B) = P(A) + P(B) - P(A \cap B)$. This inclusion-exclusion principle prevents double-counting overlapping outcomes.
                        </li>
                        <li>
                            <strong>Series Experiments:</strong> When attempting an event with success probability $p$ across $n$ independent trials, the probability of obtaining at least one success is derived using the complement rule:
                        </li>
                    </ul>
                    <div className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center font-mono text-indigo-700 font-semibold">
                        P(at least 1 success) = 1 - (1 - p)^n
                    </div>
                </div>
            </div>

            {/* Card 3: Binomial Distribution & Combinatorics */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span>Binomial Probability Distribution & Combinatorics</span>
                </h2>
                <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                    <p>
                        The binomial distribution models discrete random variables where an experiment consists of $n$ fixed, independent Bernoulli trials, each having two mutually exclusive outcomes: success ($p$) or failure ($1 - p$).
                    </p>
                    <p>
                        The Probability Mass Function (PMF) calculating the exact probability of achieving $k$ successes in $n$ trials is defined as:
                    </p>
                    <div className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center font-mono text-indigo-700 font-semibold">
                        P(X = k) = C(n, k) * p^k * (1 - p)^(n - k)
                    </div>
                    <p>
                        {"Where $C(n, k) = \\frac{n!}{k!(n - k)!}$ represents the number of combinations (unordered selections) of $k$ items from a set of $n$."}
                    </p>
                </div>
            </div>

            {/* Card 4: Practical Applications & Decision Engineering */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span>Practical Applications in Data Science & Risk Management</span>
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {[
                        {
                            title: "A/B Test Variant Modeling",
                            desc: "Determine conversion probability thresholds and confidence intervals when evaluating website feature variants across sample user sizes.",
                        },
                        {
                            title: "Quality Control & Manufacturing",
                            desc: "Utilize binomial distributions to estimate defective product rates per batch and optimize sampling inspection parameters.",
                        },
                        {
                            title: "Financial Risk & Portfolio Analysis",
                            desc: "Model asset default probabilities, tail risk events, and joint conditional dependencies across volatile market assets.",
                        },
                        {
                            title: "Cybersecurity Threat Assessment",
                            desc: "Calculate compound probabilities of credential stuffing attacks or multi-node server cluster downtime across repeated access attempts.",
                        },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1"
                        >
                            <h3 className="font-semibold text-slate-800 text-sm">{item.title}</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 5: FAQ Section (Static Cards - No Accordions) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span>Frequently Asked Questions</span>
                </h2>
                <div className="space-y-4">
                    {[
                        {
                            q: "What is the difference between odds and probability?",
                            a: "Probability expresses favorable outcomes relative to all total outcomes (e.g., 1 out of 6 on a die = 16.67%). Odds express favorable outcomes relative to unfavorable outcomes (e.g., 1 favor to 5 against = 1:5).",
                        },
                        {
                            q: "Why does P(A OR B) subtract P(A AND B)?",
                            a: "When adding P(A) and P(B), any outcome where both A and B occur is counted twice. Subtracting P(A AND B) corrects this double-counting per the inclusion-exclusion principle.",
                        },
                        {
                            q: "What constitutes independent vs dependent events?",
                            a: "Independent events mean the occurrence of event A has zero effect on the probability of event B (e.g., flipping a coin twice). Dependent events mean event A alters the likelihood of B (e.g., drawing cards without replacement).",
                        },
                        {
                            q: "How does repeated trial probability differ from average expected value?",
                            a: "If an event has a 10% chance, running 10 trials does not guarantee a 100% success rate. The probability of occurring at least once in 10 trials is actually 1 - (0.9)^10 ≈ 65.13%.",
                        },
                    ].map((faq, idx) => (
                        <div
                            key={idx}
                            className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5"
                        >
                            <h3 className="font-semibold text-slate-800 text-sm mb-1">{faq.q}</h3>
                            <p className="text-slate-700 text-sm leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Probability Calculator & Event Odds Suite",
                        url: "https://www.twistertools.com/calculators/probability-calculator",
                        applicationCategory: "EducationalApplication",
                        operatingSystem: "All",
                        description:
                            "Calculate single event probabilities, joint event odds, series trials, and binomial probability distributions instantly with zero server dependencies.",
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
                                name: "What is the difference between odds and probability?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Probability expresses favorable outcomes relative to all total outcomes. Odds express favorable outcomes relative to unfavorable outcomes.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why does P(A OR B) subtract P(A AND B)?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Subtracting P(A AND B) eliminates double-counting overlapping outcomes where both events occur simultaneously.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}