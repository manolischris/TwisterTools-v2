"use client";

import React, { useState, useMemo } from "react";
import {
    GraduationCap,
    Calculator,
    Copy,
    Check,
    Download,
    RefreshCw,
    HelpCircle,
    BookOpen,
    Sparkles,
    ShieldCheck,
    Sliders,
    Table,
    FileText,
    CheckCircle2,
    Target,
    Award,
    TrendingUp,
    Percent,
    AlertTriangle,
    Layers,
    Plus,
    Trash2,
    BookMarked,
    Brain,
    CheckCircle
} from "lucide-react";

interface CategoryItem {
    id: string;
    name: string;
    weight: string;
    score: string;
}

interface GradeScaleItem {
    letter: string;
    minScore: number;
    gpa: string;
}

interface InvalidCalculationResult {
    valid: false;
    message: string;
}

interface ValidCalculationResult {
    valid: true;
    calcMode: "simple" | "weighted";
    currentGrade: number;
    targetGrade: number;
    finalWeight: number;
    neededScore: number;
    isAchievable: boolean;
    isImpossible: boolean;
    isGuaranteed: boolean;
    scoreIf100: number;
    scoreIf80: number;
    scoreIf60: number;
    scoreIf0: number;
    steps: string[];
    totalExistingWeight?: number;
    totalWeightedPoints?: number;
}

type CalculationResult = InvalidCalculationResult | ValidCalculationResult;

const DEFAULT_GRADE_SCALE: GradeScaleItem[] = [
    { letter: "A", minScore: 90, gpa: "4.0" },
    { letter: "B", minScore: 80, gpa: "3.0" },
    { letter: "C", minScore: 70, gpa: "2.0" },
    { letter: "D", minScore: 60, gpa: "1.0" },
    { letter: "F", minScore: 0, gpa: "0.0" }
];

const PRESETS = [
    {
        id: "standard-college",
        label: "Standard College Course",
        tag: "30% Final Exam",
        currentGrade: "85",
        targetGrade: "90",
        finalWeight: "30",
        categories: [
            { id: "1", name: "Midterm Exam", weight: "30", score: "82" },
            { id: "2", name: "Homework & Quizzes", weight: "20", score: "92" },
            { id: "3", name: "Projects & Labs", weight: "20", score: "88" }
        ]
    },
    {
        id: "high-final-weight",
        label: "Final-Heavy Course",
        tag: "50% Final Exam",
        currentGrade: "78",
        targetGrade: "80",
        finalWeight: "50",
        categories: [
            { id: "1", name: "Midterm Exam 1", weight: "25", score: "74" },
            { id: "2", name: "Midterm Exam 2", weight: "25", score: "82" }
        ]
    },
    {
        id: "borderline-climb",
        label: "Climbing to an A",
        tag: "Climb to 90%",
        currentGrade: "88",
        targetGrade: "90",
        finalWeight: "20",
        categories: [
            { id: "1", name: "Assignments", weight: "40", score: "90" },
            { id: "2", name: "Midterm", weight: "40", score: "86" }
        ]
    }
];

export default function FinalGradeCalculator() {
    // Mode State
    const [calcMode, setCalcMode] = useState<"simple" | "weighted">("simple");

    // Simple Mode Inputs
    const [currentGrade, setCurrentGrade] = useState<string>("85");
    const [targetGrade, setTargetGrade] = useState<string>("90");
    const [finalWeight, setFinalWeight] = useState<string>("20");

    // Weighted Categories Mode Inputs
    const [weightedTarget, setWeightedTarget] = useState<string>("90");
    const [weightedFinalWeight, setWeightedFinalWeight] = useState<string>("25");
    const [categories, setCategories] = useState<CategoryItem[]>([
        { id: "1", name: "Assignments & Homework", weight: "25", score: "92" },
        { id: "2", name: "Midterm Exam 1", weight: "25", score: "84" },
        { id: "3", name: "Quizzes & Labs", weight: "25", score: "88" }
    ]);

    // Copy & Preset UI State
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>("standard-college");

    // Sanitize and handle number inputs without stuck zeros
    const sanitizeInput = (val: string): string => {
        if (val === "") return "";
        const cleaned = val.replace(/^0+(?=\d)/, "");
        return cleaned;
    };

    // Weighted Category Handlers
    const addCategory = () => {
        const newId = Date.now().toString();
        setCategories(prev => [...prev, { id: newId, name: `Assignment ${prev.length + 1}`, weight: "10", score: "85" }]);
        setActivePresetId(null);
    };

    const removeCategory = (id: string) => {
        if (categories.length <= 1) return;
        setCategories(prev => prev.filter(item => item.id !== id));
        setActivePresetId(null);
    };

    const updateCategory = (id: string, field: keyof CategoryItem, value: string) => {
        const sanitized = field === "weight" || field === "score" ? sanitizeInput(value) : value;
        setCategories(prev =>
            prev.map(item => (item.id === id ? { ...item, [field]: sanitized } : item))
        );
        setActivePresetId(null);
    };

    // Primary Math Engine
    const calculation = useMemo<CalculationResult>(() => {
        if (calcMode === "simple") {
            const current = parseFloat(currentGrade);
            const target = parseFloat(targetGrade);
            const weight = parseFloat(finalWeight);

            if (isNaN(current) || isNaN(target) || isNaN(weight)) {
                return { valid: false, message: "Please fill in all numerical fields with valid percentages." };
            }

            if (weight <= 0 || weight >= 100) {
                return { valid: false, message: "Final exam weight must be strictly between 0% and 100%." };
            }

            const wDecimal = weight / 100;
            const neededScore = (target - current * (1 - wDecimal)) / wDecimal;

            // Scenario calculations
            const scoreIf100 = current * (1 - wDecimal) + 100 * wDecimal;
            const scoreIf80 = current * (1 - wDecimal) + 80 * wDecimal;
            const scoreIf60 = current * (1 - wDecimal) + 60 * wDecimal;
            const scoreIf0 = current * (1 - wDecimal);

            return {
                valid: true,
                calcMode: "simple",
                currentGrade: current,
                targetGrade: target,
                finalWeight: weight,
                neededScore: neededScore,
                isAchievable: neededScore <= 100,
                isImpossible: neededScore > 100,
                isGuaranteed: neededScore <= 0,
                scoreIf100,
                scoreIf80,
                scoreIf60,
                scoreIf0,
                steps: [
                    `Final Weight Decimal: ${weight}% ÷ 100 = ${wDecimal.toFixed(4)}`,
                    `Current Weight Decimal: 100% - ${weight}% = ${(100 - weight)}% (${(1 - wDecimal).toFixed(4)})`,
                    `Current Contribution: ${current}% × ${(1 - wDecimal).toFixed(4)} = ${(current * (1 - wDecimal)).toFixed(2)}%`,
                    `Formula: Needed = [Target (${target}%) - Current Contribution (${(current * (1 - wDecimal)).toFixed(2)}%)] ÷ ${wDecimal.toFixed(4)}`,
                    `Required Final Exam Score: ${neededScore.toFixed(2)}%`
                ]
            };
        } else {
            // Weighted Categories Calculation
            const target = parseFloat(weightedTarget);
            const finalW = parseFloat(weightedFinalWeight);

            if (isNaN(target) || isNaN(finalW)) {
                return { valid: false, message: "Please specify valid target and final exam weight percentages." };
            }

            let totalExistingWeight = 0;
            let totalWeightedPoints = 0;
            let invalidCategory = false;

            categories.forEach(cat => {
                const w = parseFloat(cat.weight);
                const s = parseFloat(cat.score);
                if (isNaN(w) || isNaN(s)) {
                    invalidCategory = true;
                } else {
                    totalExistingWeight += w;
                    totalWeightedPoints += (w / 100) * s;
                }
            });

            if (invalidCategory) {
                return { valid: false, message: "Ensure all course categories have valid numeric weights and scores." };
            }

            const totalCalculatedWeight = totalExistingWeight + finalW;
            const currentWeightedAvg = totalExistingWeight > 0 ? (totalWeightedPoints / (totalExistingWeight / 100)) : 0;

            if (Math.abs(totalCalculatedWeight - 100) > 0.01) {
                return {
                    valid: false,
                    message: `Total weights must add up to 100%. Currently: ${totalExistingWeight}% (existing) + ${finalW}% (final) = ${totalCalculatedWeight}%.`
                };
            }

            const finalWDecimal = finalW / 100;
            const neededScore = (target - totalWeightedPoints) / finalWDecimal;

            const scoreIf100 = totalWeightedPoints + 100 * finalWDecimal;
            const scoreIf80 = totalWeightedPoints + 80 * finalWDecimal;
            const scoreIf60 = totalWeightedPoints + 60 * finalWDecimal;
            const scoreIf0 = totalWeightedPoints;

            return {
                valid: true,
                calcMode: "weighted",
                currentGrade: currentWeightedAvg,
                targetGrade: target,
                finalWeight: finalW,
                neededScore: neededScore,
                totalExistingWeight,
                totalWeightedPoints,
                isAchievable: neededScore <= 100,
                isImpossible: neededScore > 100,
                isGuaranteed: neededScore <= 0,
                scoreIf100,
                scoreIf80,
                scoreIf60,
                scoreIf0,
                steps: [
                    `Sum of Existing Category Weights: ${totalExistingWeight}%`,
                    `Current Weighted Grade Average: ${currentWeightedAvg.toFixed(2)}% (${totalWeightedPoints.toFixed(2)} overall points accumulated)`,
                    `Final Exam Weight Decimal: ${finalW}% ÷ 100 = ${finalWDecimal.toFixed(4)}`,
                    `Formula: Needed = [Target (${target}%) - Accumulated Points (${totalWeightedPoints.toFixed(2)})] ÷ ${finalWDecimal.toFixed(4)}`,
                    `Required Final Exam Score: ${neededScore.toFixed(2)}%`
                ]
            };
        }
    }, [calcMode, currentGrade, targetGrade, finalWeight, weightedTarget, weightedFinalWeight, categories]);

    // Apply Presets
    const applyPreset = (preset: typeof PRESETS[0]) => {
        setCalcMode("weighted");
        setWeightedTarget(preset.targetGrade);
        setWeightedFinalWeight(preset.finalWeight);
        setCategories(preset.categories);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCalcMode("simple");
        setCurrentGrade("85");
        setTargetGrade("90");
        setFinalWeight("20");
        setWeightedTarget("90");
        setWeightedFinalWeight("25");
        setCategories([
            { id: "1", name: "Assignments & Homework", weight: "25", score: "92" },
            { id: "2", name: "Midterm Exam 1", weight: "25", score: "84" },
            { id: "3", name: "Quizzes & Labs", weight: "25", score: "88" }
        ]);
        setActivePresetId(null);
    };

    const handleCopy = () => {
        if (!calculation.valid) return;

        let summaryText = `Grade & Exam Score Calculation (TwisterTools):\n----------------------------------------\n`;
        summaryText += `Current Grade: ${calculation.currentGrade.toFixed(2)}%\n`;
        summaryText += `Target Desired Grade: ${calculation.targetGrade}%\n`;
        summaryText += `Final Exam Weight: ${calculation.finalWeight}%\n`;
        summaryText += `Required Score on Final Exam: ${calculation.neededScore.toFixed(2)}%\n\n`;

        if (calculation.isImpossible) {
            summaryText += `Note: Score exceeds 100%. Extra credit or scaling is required to reach this target.\n`;
        } else if (calculation.isGuaranteed) {
            summaryText += `Note: Target already locked! You can score 0% on the final and still achieve this target grade.\n`;
        }

        summaryText += `----------------------------------------\nCalculated at twistertools.com/tools/calculators/final-grade-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (!calculation.valid) return;

        let csvRows: string[] = [];
        csvRows.push(`"Metric","Value"`);
        csvRows.push(`"Calculation Mode","${calcMode}"`);
        csvRows.push(`"Current Overall Grade","${calculation.currentGrade.toFixed(2)}%"`);
        csvRows.push(`"Target Desired Grade","${calculation.targetGrade}%"`);
        csvRows.push(`"Final Exam Weight","${calculation.finalWeight}%"`);
        csvRows.push(`"Required Final Exam Score","${calculation.neededScore.toFixed(2)}%"`);
        csvRows.push(`"Final Grade if 100% on Final","${calculation.scoreIf100.toFixed(2)}%"`);
        csvRows.push(`"Final Grade if 80% on Final","${calculation.scoreIf80.toFixed(2)}%"`);
        csvRows.push(`"Final Grade if 60% on Final","${calculation.scoreIf60.toFixed(2)}%"`);

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `final_grade_calculation.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Grade & Exam Score Needed Calculator",
        "url": "https://twistertools.com/tools/calculators/final-grade-calculator",
        "description": "Calculate the exact score needed on your final exam to achieve your target class grade. Supports simple current grade mode and multi-category weighted course breakdowns.",
        "applicationCategory": "EducationalApplication",
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
                "name": "How is the required final exam score calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The required final exam score is calculated using the weighted average formula: Score Needed = [Target Grade - Current Grade * (1 - Final Weight)] / Final Weight, where weights are expressed as decimals."
                }
            },
            {
                "@type": "Question",
                "name": "What if the calculated needed score is over 100%?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "If the calculated score exceeds 100%, it means it is mathematically impossible to reach your target grade with the final exam alone without earning extra credit or curve points."
                }
            },
            {
                "@type": "Question",
                "name": "What does a negative needed exam score mean?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A negative required score means you have already accumulated enough points throughout the semester that even scoring 0% on the final exam will keep your grade at or above your target."
                }
            },
            {
                "@type": "Question",
                "name": "How do I calculate my current grade if my syllabus uses weighted categories?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Switch to 'Weighted Categories' mode in our calculator. Input each category's weight and your average score in that category. The calculator computes your accumulated weighted points automatically."
                }
            },
            {
                "@type": "Question",
                "name": "Does a higher final exam weight make it easier or harder to raise my grade?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A higher final exam weight increases the impact of the final test. If your current grade is below your target, a heavily weighted final makes it easier to pull your grade up, but also carries higher risk if you score poorly."
                }
            },
            {
                "@type": "Question",
                "name": "How do unweighted total points systems compare to weighted systems?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In a total points system, every point carries equal weight regardless of assignment type. In a weighted system, categories (e.g., Exams 50%, Homework 20%) carry fixed percentages regardless of how many individual points were assigned."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input Controls & Modes */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Grade Calculator Inputs
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Mode Switcher */}
                        <div className="mb-5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Calculation Method
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("simple")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${calcMode === "simple" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Simple Grade Mode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("weighted")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${calcMode === "weighted" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Weighted Categories Mode
                                </button>
                            </div>
                        </div>

                        {/* MODE 1: SIMPLE MODE INPUTS */}
                        {calcMode === "simple" && (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Percent className="w-4 h-4 text-indigo-600" /> Current Overall Grade (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="150"
                                        value={currentGrade}
                                        onChange={(e) => { setCurrentGrade(sanitizeInput(e.target.value)); setActivePresetId(null); }}
                                        placeholder="e.g. 85"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <p className="text-[11px] text-slate-500">Your current grade average in the course so far.</p>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Target className="w-4 h-4 text-indigo-600" /> Target Class Grade (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={targetGrade}
                                        onChange={(e) => { setTargetGrade(sanitizeInput(e.target.value)); setActivePresetId(null); }}
                                        placeholder="e.g. 90"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <p className="text-[11px] text-slate-500">The overall class percentage you wish to achieve (e.g. 90% for an A).</p>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Award className="w-4 h-4 text-indigo-600" /> Final Exam Weight (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={finalWeight}
                                        onChange={(e) => { setFinalWeight(sanitizeInput(e.target.value)); setActivePresetId(null); }}
                                        placeholder="e.g. 20"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <p className="text-[11px] text-slate-500">How much the final test is worth relative to your total grade.</p>
                                </div>
                            </div>
                        )}

                        {/* MODE 2: WEIGHTED CATEGORIES INPUTS */}
                        {calcMode === "weighted" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                                        <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                                            Target Grade (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={weightedTarget}
                                            onChange={(e) => { setWeightedTarget(sanitizeInput(e.target.value)); setActivePresetId(null); }}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                                        />
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                                        <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                                            Final Exam Weight (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={weightedFinalWeight}
                                            onChange={(e) => { setWeightedFinalWeight(sanitizeInput(e.target.value)); setActivePresetId(null); }}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Course Grade Breakdown
                                        </span>
                                        <button
                                            type="button"
                                            onClick={addCategory}
                                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Category
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {categories.map((cat, idx) => (
                                            <div key={cat.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={cat.name}
                                                    onChange={(e) => updateCategory(cat.id, "name", e.target.value)}
                                                    placeholder={`Category ${idx + 1}`}
                                                    className="flex-2 min-w-0 px-2 py-1 rounded-md border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                                                />
                                                <div className="flex-1 min-w-0 flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={cat.weight}
                                                        onChange={(e) => updateCategory(cat.id, "weight", e.target.value)}
                                                        placeholder="W%"
                                                        className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs font-bold text-slate-800 bg-white text-center"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">%</span>
                                                </div>
                                                <div className="flex-1 min-w-0 flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={cat.score}
                                                        onChange={(e) => updateCategory(cat.id, "score", e.target.value)}
                                                        placeholder="Score%"
                                                        className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs font-bold text-slate-800 bg-white text-center"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">%</span>
                                                </div>
                                                {categories.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCategory(cat.id)}
                                                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Presets Section */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Syllabus Templates
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Template Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            disabled={!calculation.valid}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Target Analysis"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={!calculation.valid}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Required Score Output & Scenario Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Required Score & Analysis
                            </h2>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                Output Engine
                            </span>
                        </div>

                        {!calculation.valid ? (
                            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-amber-600" /> Input Verification Required
                                </h3>
                                <p className="text-xs leading-relaxed">{calculation.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Hero Score Card */}
                                <div className="p-5 rounded-2xl border bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                            <Target className="w-4 h-4 text-indigo-400" /> Needed Score on Final Exam
                                        </span>
                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${calculation.isImpossible
                                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                            : calculation.isGuaranteed
                                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                                : "bg-indigo-500/30 text-indigo-200 border-indigo-400/30"
                                            }`}>
                                            {calculation.isImpossible ? "Requires Extra Credit" : calculation.isGuaranteed ? "Target Secured" : "Achievable Goal"}
                                        </span>
                                    </div>

                                    <div className="flex items-baseline gap-2">
                                        <div className="text-4xl sm:text-5xl font-black text-white">
                                            {calculation.neededScore.toFixed(1)}%
                                        </div>
                                        <span className="text-xs text-indigo-200 font-medium">score required</span>
                                    </div>

                                    {/* Feasibility Alert Text */}
                                    <div className="mt-4 pt-3 text-xs border-t border-indigo-800/80 flex items-center gap-2">
                                        {calculation.isImpossible && (
                                            <>
                                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                                <span className="text-rose-200">
                                                    You need higher than 100%. Speak with your professor regarding extra credit opportunities!
                                                </span>
                                            </>
                                        )}
                                        {calculation.isGuaranteed && (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                                <span className="text-emerald-200">
                                                    Even with 0% on the final exam, your grade stays at or above your {calculation.targetGrade}% target!
                                                </span>
                                            </>
                                        )}
                                        {!calculation.isImpossible && !calculation.isGuaranteed && (
                                            <>
                                                <TrendingUp className="w-4 h-4 text-indigo-300 shrink-0" />
                                                <span className="text-indigo-200">
                                                    Achieving {calculation.neededScore.toFixed(1)}% on a {calculation.finalWeight}% weighted exam will lock in your {calculation.targetGrade}% overall course grade.
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Outcome Scenario Table */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Table className="w-4 h-4 text-indigo-600" /> Final Grade Outcome Scenarios
                                    </h3>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                                                <tr>
                                                    <th className="p-2.5">Final Exam Score</th>
                                                    <th className="p-2.5">Resulting Class Grade</th>
                                                    <th className="p-2.5">Outcome Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                                <tr className="bg-white">
                                                    <td className="p-2.5 font-bold text-emerald-600">100% (Ace)</td>
                                                    <td className="p-2.5 font-bold">{calculation.scoreIf100.toFixed(2)}%</td>
                                                    <td className="p-2.5 text-slate-500">
                                                        {calculation.scoreIf100 >= calculation.targetGrade ? "Target Met" : "Below Target"}
                                                    </td>
                                                </tr>
                                                <tr className="bg-slate-50/50">
                                                    <td className="p-2.5 font-bold text-indigo-600">80% (Solid B)</td>
                                                    <td className="p-2.5 font-bold">{calculation.scoreIf80.toFixed(2)}%</td>
                                                    <td className="p-2.5 text-slate-500">
                                                        {calculation.scoreIf80 >= calculation.targetGrade ? "Target Met" : "Below Target"}
                                                    </td>
                                                </tr>
                                                <tr className="bg-white">
                                                    <td className="p-2.5 font-bold text-amber-600">60% (Passing)</td>
                                                    <td className="p-2.5 font-bold">{calculation.scoreIf60.toFixed(2)}%</td>
                                                    <td className="p-2.5 text-slate-500">
                                                        {calculation.scoreIf60 >= calculation.targetGrade ? "Target Met" : "Below Target"}
                                                    </td>
                                                </tr>
                                                <tr className="bg-slate-50/50">
                                                    <td className="p-2.5 font-bold text-rose-600">0% (Missed)</td>
                                                    <td className="p-2.5 font-bold">{calculation.scoreIf0.toFixed(2)}%</td>
                                                    <td className="p-2.5 text-slate-500">Floor Grade</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mathematical Derivation */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-600" /> Step-by-Step Derivation
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs text-slate-800">
                                        {calculation.steps?.map((step, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="font-bold text-indigo-600 select-none">[{idx + 1}]</span>
                                                <span>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Native Math
                        </span>
                        <span>TwisterTools Grade Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Fundamental Mathematical Definitions & Core Rules */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Final Grade Calculations & Exam Weights
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Determining what score you need on a final exam is one of the most critical math exercises students face at the end of an academic term. Academic courses in high school, college, and graduate programs generally use either a <strong>weighted category system</strong> or an <strong>unweighted total points system</strong> to calculate overall semester grades.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Percent className="w-4 h-4 text-indigo-600" /> Current Weighted Average
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Represents your standing percentage based on all completed assignments, quizzes, and midterm exams prior to taking the final exam.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Award className="w-4 h-4 text-emerald-600" /> Final Exam Weight
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The percentage of your final course grade determined exclusively by your score on the final exam (typically ranging from 15% to 40%).
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Target className="w-4 h-4 text-amber-600" /> Target Grade Threshold
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The minimum class percentage required to secure a specific letter grade according to your school's official grading standard.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3">
                        <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Essential Mathematical Rules of Final Exam Calculations
                        </h3>
                        <ul className="text-xs text-indigo-900 space-y-1.5 list-disc list-inside">
                            <li><strong>Linear Weight Formula:</strong> Your overall grade equals $(Current \times (1 - w)) + (Exam \times w)$, where $w$ is the decimal weight of the final exam.</li>
                            <li><strong>Inverse Calculation:</strong> Solving for Exam yields Exam = [Target - (Current × (1 - w))] / w.</li>
                            <li><strong>Impact Scaling:</strong> The higher the weight $w$, the smaller the effect of past grades on your final standing and the greater the sensitivity to your final exam score.</li>
                            <li><strong>Negative Score Meaning:</strong> A required score below 0% indicates you have already guaranteed your target grade even if you earn 0% on the final.</li>
                        </ul>
                    </div>
                </section>

                {/* Card 2: Standard College Grade Scale Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Academic Grading Scale & GPA Equivalencies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this reference table to match your target letter grade with standard percentage thresholds and 4.0 GPA scale conversions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Letter Grade</th>
                                    <th className="p-3">Percentage Range</th>
                                    <th className="p-3">4.0 GPA Value</th>
                                    <th className="p-3">Academic Performance Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {DEFAULT_GRADE_SCALE.map((item, i) => (
                                    <tr key={i} className={i % 2 === 1 ? "bg-slate-50/50 hover:bg-slate-50" : "hover:bg-slate-50"}>
                                        <td className="p-3 font-bold text-indigo-600 text-base">{item.letter}</td>
                                        <td className="p-3 font-medium">{item.minScore}% – {i === 0 ? "100%" : `${DEFAULT_GRADE_SCALE[i - 1].minScore - 1}%`}</td>
                                        <td className="p-3 font-mono font-bold">{item.gpa}</td>
                                        <td className="p-3 text-slate-600">
                                            {item.letter === "A" && "Excellent / Mastery"}
                                            {item.letter === "B" && "Above Average / Good"}
                                            {item.letter === "C" && "Average / Satisfactory"}
                                            {item.letter === "D" && "Below Average / Passing"}
                                            {item.letter === "F" && "Failure / Unsatisfactory"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Step-by-Step Mathematical Derivation */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Brain className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Calculation Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review these real-world academic scenarios to understand how weighted averages determine your required exam performance:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 1: Target an A (90%) with a 20% Final</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Standard</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Current Grade = 85%, Target Grade = 90%, Final Exam Weight = 20%.
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1.5 text-slate-800">
                                <div>1. Weight Decimal $w = 20 / 100 = 0.20$</div>
                                <div>2. Current Contribution = $85 \times (1 - 0.20) = 85 \times 0.80 = 68.0\%$</div>
                                <div>3. Points Needed from Final = $90 - 68.0 = 22.0\%$</div>
                                <div>4. Final Score Needed = $22.0 / 0.20 =$ <strong className="text-indigo-600">110.0%</strong></div>
                                <div className="text-[11px] font-sans text-rose-600 font-bold pt-1">
                                    Result: Requires extra credit as score exceeds 100%.
                                </div>
                            </div>
                        </div>

                        {/* Example 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 2: Maintain a B (80%) with a 30% Final</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Heavy Final</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Current Grade = 84%, Target Grade = 80%, Final Exam Weight = 30%.
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1.5 text-slate-800">
                                <div>1. Weight Decimal $w = 30 / 100 = 0.30$</div>
                                <div>2. Current Contribution = $84 \times 0.70 = 58.8\%$</div>
                                <div>3. Points Needed from Final = $80 - 58.8 = 21.2\%$</div>
                                <div>4. Final Score Needed = $21.2 / 0.30 =$ <strong className="text-indigo-600">70.67%</strong></div>
                                <div className="text-[11px] font-sans text-emerald-600 font-bold pt-1">
                                    Result: A score of 70.67% on the final secures the B grade.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: How-To Usage Steps */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Use the Final Grade Calculator
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <h3 className="font-bold text-slate-900 text-xs">Select Calculation Mode</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Choose 'Simple Mode' if you already know your current class percentage, or 'Weighted Categories Mode' to enter individual assignment categories.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <h3 className="font-bold text-slate-900 text-xs">Enter Current Standing</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Input your existing overall grade or syllabus category weights alongside your earned percentage scores.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                            <h3 className="font-bold text-slate-900 text-xs">Set Target & Exam Weight</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Specify your desired class letter target (e.g. 90% for an A) and your final test's percentage weight from the syllabus.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                            <h3 className="font-bold text-slate-900 text-xs">Analyze Scenarios & Export</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Instantly review the required test score, outcome scenario table, and step-by-step mathematical proof.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is the required final exam score calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The required final exam score is calculated using the weighted average formula: Score Needed = [Target Grade - Current Grade * (1 - Final Weight)] / Final Weight, where weights are expressed as decimals.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What if the calculated needed score is over 100%?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                If the calculated score exceeds 100%, it means it is mathematically impossible to reach your target grade with the final exam alone without earning extra credit or curve points.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What does a negative needed exam score mean?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A negative required score means you have already accumulated enough points throughout the semester that even scoring 0% on the final exam will keep your grade at or above your target.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I calculate my current grade if my syllabus uses weighted categories?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Switch to 'Weighted Categories' mode in our calculator. Input each category's weight and your average score in that category. The calculator computes your accumulated weighted points automatically.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does a higher final exam weight make it easier or harder to raise my grade?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A higher final exam weight increases the impact of the final test. If your current grade is below your target, a heavily weighted final makes it easier to pull your grade up, but also carries higher risk if you score poorly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do unweighted total points systems compare to weighted systems?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In a total points system, every point carries equal weight regardless of assignment type. In a weighted system, categories (e.g., Exams 50%, Homework 20%) carry fixed percentages regardless of how many individual points were assigned.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}