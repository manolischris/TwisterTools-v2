"use client";

import React, { useState, useMemo } from "react";
import {
    GraduationCap,
    Calculator,
    Plus,
    Trash2,
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
    Award,
    TrendingUp,
    BarChart3,
    Lightbulb,
    Target,
    Layers,
    AlertCircle
} from "lucide-react";

interface CourseRow {
    id: string;
    name: string;
    grade: string;
    credits: string;
    isHonorsOrAP: boolean;
    courseType: "regular" | "honors" | "ap";
}

interface Preset {
    id: string;
    label: string;
    scale: "4.0" | "4.3" | "5.0";
    courses: CourseRow[];
    priorGpa: string;
    priorCredits: string;
    tag: string;
}

const GRADE_SCALE_4_0: Record<string, number> = {
    "A+": 4.0,
    "A": 4.0,
    "A-": 3.7,
    "B+": 3.3,
    "B": 3.0,
    "B-": 2.7,
    "C+": 2.3,
    "C": 2.0,
    "C-": 1.7,
    "D+": 1.3,
    "D": 1.0,
    "D-": 0.7,
    "F": 0.0
};

const GRADE_SCALE_4_3: Record<string, number> = {
    "A+": 4.3,
    "A": 4.0,
    "A-": 3.7,
    "B+": 3.3,
    "B": 3.0,
    "B-": 2.7,
    "C+": 2.3,
    "C": 2.0,
    "C-": 1.7,
    "D+": 1.3,
    "D": 1.0,
    "D-": 0.7,
    "F": 0.0
};

const PRESETS: Preset[] = [
    {
        id: "undergrad-stem",
        label: "Undergraduate STEM Term (4.0 Scale)",
        scale: "4.0",
        priorGpa: "3.45",
        priorCredits: "45",
        courses: [
            { id: "c1", name: "Calculus II", grade: "A", credits: "4", isHonorsOrAP: false, courseType: "regular" },
            { id: "c2", name: "Physics I (Lab)", grade: "B+", credits: "4", isHonorsOrAP: false, courseType: "regular" },
            { id: "c3", name: "Data Structures", grade: "A-", credits: "3", isHonorsOrAP: false, courseType: "regular" },
            { id: "c4", name: "Technical Writing", grade: "A", credits: "3", isHonorsOrAP: false, courseType: "regular" }
        ],
        tag: "College"
    },
    {
        id: "highschool-ap",
        label: "High School AP/Honors Semester (5.0 Weighted)",
        scale: "5.0",
        priorGpa: "3.80",
        priorCredits: "24",
        courses: [
            { id: "c1", name: "AP Calculus BC", grade: "A", credits: "1", isHonorsOrAP: true, courseType: "ap" },
            { id: "c2", name: "AP Physics C", grade: "A-", credits: "1", isHonorsOrAP: true, courseType: "ap" },
            { id: "c3", name: "Honors Literature", grade: "B+", credits: "1", isHonorsOrAP: true, courseType: "honors" },
            { id: "c4", name: "US History", grade: "A", credits: "1", isHonorsOrAP: false, courseType: "regular" }
        ],
        tag: "High School"
    },
    {
        id: "freshman-term",
        label: "Freshman General Education (4.3 Scale)",
        scale: "4.3",
        priorGpa: "",
        priorCredits: "",
        courses: [
            { id: "c1", name: "Intro to Psychology", grade: "A+", credits: "3", isHonorsOrAP: false, courseType: "regular" },
            { id: "c2", name: "English Composition", grade: "A", credits: "3", isHonorsOrAP: false, courseType: "regular" },
            { id: "c3", name: "Macroeconomics", grade: "B", credits: "3", isHonorsOrAP: false, courseType: "regular" },
            { id: "c4", name: "Environmental Science", grade: "A-", credits: "4", isHonorsOrAP: false, courseType: "regular" }
        ],
        tag: "Freshman"
    }
];

export default function GpaCalculator() {
    // Basic Settings
    const [scale, setScale] = useState<"4.0" | "4.3" | "5.0">("4.0");
    const [courses, setCourses] = useState<CourseRow[]>([
        { id: "1", name: "Course 1", grade: "A", credits: "3", isHonorsOrAP: false, courseType: "regular" },
        { id: "2", name: "Course 2", grade: "B+", credits: "3", isHonorsOrAP: false, courseType: "regular" },
        { id: "3", name: "Course 3", grade: "A-", credits: "4", isHonorsOrAP: false, courseType: "regular" },
        { id: "4", name: "Course 4", grade: "B", credits: "3", isHonorsOrAP: false, courseType: "regular" }
    ]);

    // Prior Cumulative History
    const [includePrior, setIncludePrior] = useState<boolean>(false);
    const [priorGpa, setPriorGpa] = useState<string>("");
    const [priorCredits, setPriorCredits] = useState<string>("");

    // Target GPA Scenario Planner
    const [targetGpa, setTargetGpa] = useState<string>("");
    const [remainingCredits, setRemainingCredits] = useState<string>("");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    // Course Row Controls
    const addCourse = () => {
        const nextId = (courses.length + 1).toString();
        setCourses(prev => [
            ...prev,
            { id: Date.now().toString(), name: `Course ${nextId}`, grade: "A", credits: "3", isHonorsOrAP: false, courseType: "regular" }
        ]);
        setActivePresetId(null);
    };

    const removeCourse = (id: string) => {
        if (courses.length <= 1) return;
        setCourses(prev => prev.filter(c => c.id !== id));
        setActivePresetId(null);
    };

    const updateCourse = (id: string, field: keyof CourseRow, value: any) => {
        setCourses(prev => prev.map(c => {
            if (c.id === id) {
                const updated = { ...c, [field]: value };
                if (field === "courseType") {
                    updated.isHonorsOrAP = value !== "regular";
                }
                return updated;
            }
            return c;
        }));
        setActivePresetId(null);
    };

    const handlePriorGpaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/^0+(?=\d)/, "");
        setPriorGpa(raw);
        setActivePresetId(null);
    };

    const handlePriorCreditsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/^0+(?=\d)/, "");
        setPriorCredits(raw);
        setActivePresetId(null);
    };

    const handleTargetGpaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/^0+(?=\d)/, "");
        setTargetGpa(raw);
    };

    const handleRemainingCreditsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/^0+(?=\d)/, "");
        setRemainingCredits(raw);
    };

    // Main Calculations
    const calculations = useMemo(() => {
        const activeScaleMap = scale === "4.3" ? GRADE_SCALE_4_3 : GRADE_SCALE_4_0;

        let currentTermCredits = 0;
        let unweightedGradePoints = 0;
        let weightedGradePoints = 0;

        courses.forEach(c => {
            const creditsNum = parseFloat(c.credits) || 0;
            if (creditsNum <= 0) return;

            const basePoints = activeScaleMap[c.grade] ?? 0;
            let extraWeight = 0;
            if (c.courseType === "honors") extraWeight = 0.5;
            if (c.courseType === "ap") extraWeight = 1.0;

            currentTermCredits += creditsNum;
            unweightedGradePoints += basePoints * creditsNum;
            weightedGradePoints += (basePoints + extraWeight) * creditsNum;
        });

        const termUnweightedGpa = currentTermCredits > 0 ? unweightedGradePoints / currentTermCredits : 0;
        const termWeightedGpa = currentTermCredits > 0 ? weightedGradePoints / currentTermCredits : 0;

        // Cumulative Calculations
        const pGpa = parseFloat(priorGpa) || 0;
        const pCredits = parseFloat(priorCredits) || 0;

        const totalCreditsWithPrior = currentTermCredits + (includePrior ? pCredits : 0);
        const priorTotalPoints = pGpa * pCredits;
        
        const cumulativeUnweightedPoints = unweightedGradePoints + (includePrior ? priorTotalPoints : 0);
        const cumulativeWeightedPoints = weightedGradePoints + (includePrior ? priorTotalPoints : 0);

        const cumulativeUnweightedGpa = totalCreditsWithPrior > 0 ? cumulativeUnweightedPoints / totalCreditsWithPrior : 0;
        const cumulativeWeightedGpa = totalCreditsWithPrior > 0 ? cumulativeWeightedPoints / totalCreditsWithPrior : 0;

        // Honors / Honors Classifications
        let honorsClass = "Standard Academic Standing";
        if (cumulativeUnweightedGpa >= 3.90) honorsClass = "Summa Cum Laude (Highest Honors)";
        else if (cumulativeUnweightedGpa >= 3.70) honorsClass = "Magna Cum Laude (High Honors)";
        else if (cumulativeUnweightedGpa >= 3.50) honorsClass = "Cum Laude (Honors)";
        else if (cumulativeUnweightedGpa >= 3.00) honorsClass = "Dean's List Eligible";

        // Target Planner Calculations
        const tgtGpaNum = parseFloat(targetGpa);
        const remCredNum = parseFloat(remainingCredits);
        let requiredFutureGpa: number | null = null;
        let targetAchievable = true;

        if (!isNaN(tgtGpaNum) && !isNaN(remCredNum) && remCredNum > 0 && totalCreditsWithPrior > 0) {
            const currentTotalPoints = includePrior ? cumulativeUnweightedPoints : unweightedGradePoints;
            const targetTotalPointsNeeded = tgtGpaNum * (totalCreditsWithPrior + remCredNum);
            const additionalPointsNeeded = targetTotalPointsNeeded - currentTotalPoints;
            const reqGpa = additionalPointsNeeded / remCredNum;

            requiredFutureGpa = reqGpa;
            const maxPossibleGpaOnScale = scale === "4.3" ? 4.3 : 4.0;
            if (reqGpa > maxPossibleGpaOnScale || reqGpa < 0) {
                targetAchievable = false;
            }
        }

        return {
            currentTermCredits,
            termUnweightedGpa,
            termWeightedGpa,
            totalCreditsWithPrior,
            cumulativeUnweightedGpa,
            cumulativeWeightedGpa,
            honorsClass,
            requiredFutureGpa,
            targetAchievable
        };
    }, [scale, courses, includePrior, priorGpa, priorCredits, targetGpa, remainingCredits]);

    const applyPreset = (preset: Preset) => {
        setScale(preset.scale);
        setCourses(preset.courses);
        if (preset.priorGpa && preset.priorCredits) {
            setIncludePrior(true);
            setPriorGpa(preset.priorGpa);
            setPriorCredits(preset.priorCredits);
        } else {
            setIncludePrior(false);
            setPriorGpa("");
            setPriorCredits("");
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setScale("4.0");
        setCourses([
            { id: "1", name: "Course 1", grade: "A", credits: "3", isHonorsOrAP: false, courseType: "regular" },
            { id: "2", name: "Course 2", grade: "B+", credits: "3", isHonorsOrAP: false, courseType: "regular" },
            { id: "3", name: "Course 3", grade: "A-", credits: "4", isHonorsOrAP: false, courseType: "regular" },
            { id: "4", name: "Course 4", grade: "B", credits: "3", isHonorsOrAP: false, courseType: "regular" }
        ]);
        setIncludePrior(false);
        setPriorGpa("");
        setPriorCredits("");
        setTargetGpa("");
        setRemainingCredits("");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        let text = `GPA Calculation Summary (TwisterTools)\n----------------------------------------\n`;
        text += `Scale: ${scale} Scale\n`;
        text += `Term Credits: ${calculations.currentTermCredits}\n`;
        text += `Term Unweighted GPA: ${calculations.termUnweightedGpa.toFixed(2)}\n`;
        if (scale === "5.0") {
            text += `Term Weighted GPA: ${calculations.termWeightedGpa.toFixed(2)}\n`;
        }
        if (includePrior) {
            text += `Cumulative Total Credits: ${calculations.totalCreditsWithPrior}\n`;
            text += `Cumulative GPA: ${calculations.cumulativeUnweightedGpa.toFixed(2)}\n`;
        }
        text += `Academic Distinction: ${calculations.honorsClass}\n`;
        text += `----------------------------------------\nCalculated at twistertools.com/tools/calculators/gpa-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const rows: string[] = [];
        rows.push(`"Course Name","Grade","Credits","Course Type"`);
        courses.forEach(c => {
            rows.push(`"${c.name}","${c.grade}","${c.credits}","${c.courseType}"`);
        });
        rows.push(``);
        rows.push(`"Metric","Value"`);
        rows.push(`"Scale","${scale}"`);
        rows.push(`"Term Credits","${calculations.currentTermCredits}"`);
        rows.push(`"Term Unweighted GPA","${calculations.termUnweightedGpa.toFixed(2)}"`);
        if (scale === "5.0") {
            rows.push(`"Term Weighted GPA","${calculations.termWeightedGpa.toFixed(2)}"`);
        }
        if (includePrior) {
            rows.push(`"Prior GPA","${priorGpa}"`);
            rows.push(`"Prior Credits","${priorCredits}"`);
            rows.push(`"Cumulative GPA","${calculations.cumulativeUnweightedGpa.toFixed(2)}"`);
        }
        rows.push(`"Academic Honors Status","${calculations.honorsClass}"`);

        const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `gpa_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "GPA & Grade Point Average Calculator",
        "url": "https://twistertools.com/tools/calculators/gpa-calculator",
        "description": "Calculate semester and cumulative Grade Point Average (GPA) for college and high school. Supports 4.0, 4.3, and 5.0 weighted AP/Honors grading scales.",
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
                "name": "How is Grade Point Average (GPA) calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "GPA is calculated by multiplying the numerical point value of the letter grade earned in each course by its credit value to determine total grade points earned, then dividing total grade points by the sum of total credit hours attempted."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Weighted and Unweighted GPA?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Unweighted GPA measures academic achievement on a standard 4.0 scale regardless of course difficulty. Weighted GPA assigns extra numerical weight (typically +0.5 for Honors and +1.0 for AP/IB courses) to reflect rigor, scaling up to 5.0."
                }
            },
            {
                "@type": "Question",
                "name": "How do prior credits impact cumulative GPA?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Cumulative GPA combines all past earned grade points with your current term points divided by total accumulated credit hours. The more prior credits you have, the less a single semester's grades will shift your overall GPA."
                }
            },
            {
                "@type": "Question",
                "name": "What GPA is required for Latin Honors at graduation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While exact thresholds vary by university, typical standards are: Cum Laude (3.50–3.69), Magna Cum Laude (3.70–3.89), and Summa Cum Laude (3.90–4.00)."
                }
            },
            {
                "@type": "Question",
                "name": "Can I calculate my required future GPA to reach a target goal?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. By entering your current cumulative GPA, total credits earned, desired target GPA, and remaining credit hours, the target scenario planner determines the exact average grade needed in upcoming terms."
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
                
                {/* Left Workspace Panel: Input Controls & Course Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Term & Course Configuration
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Scale Selection & Prior History Toggle */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Grading Scale System
                                </label>
                                <select
                                    value={scale}
                                    onChange={(e) => {
                                        setScale(e.target.value as "4.0" | "4.3" | "5.0");
                                        setActivePresetId(null);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="4.0">Standard 4.0 Scale (A = 4.0, B = 3.0)</option>
                                    <option value="4.3">4.3 Scale (A+ = 4.3, A = 4.0)</option>
                                    <option value="5.0">5.0 Weighted Scale (AP/Honors Bonus)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Include Cumulative Prior GPA?
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIncludePrior(!includePrior)}
                                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${includePrior
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                        : "bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100"
                                        }`}
                                >
                                    <span>{includePrior ? "Prior History Active" : "Term Only (No Prior GPA)"}</span>
                                    <span className={`w-3 h-3 rounded-full ${includePrior ? "bg-indigo-600" : "bg-slate-300"}`} />
                                </button>
                            </div>
                        </div>

                        {/* Cumulative History Inputs */}
                        {includePrior && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Prior Cumulative GPA
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 3.45"
                                        value={priorGpa}
                                        onChange={handlePriorGpaInput}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Prior Earned Credits
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        placeholder="e.g. 45"
                                        value={priorCredits}
                                        onChange={handlePriorCreditsInput}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Course Entry List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-indigo-600" /> Current Term Courses
                                </span>
                                <span className="text-[11px] font-medium text-slate-500">
                                    {courses.length} {courses.length === 1 ? "Course" : "Courses"} Added
                                </span>
                            </div>

                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {courses.map((course, idx) => (
                                    <div
                                        key={course.id}
                                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center"
                                    >
                                        <div className="col-span-12 sm:col-span-4">
                                            <input
                                                type="text"
                                                placeholder={`Course ${idx + 1}`}
                                                value={course.name}
                                                onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div className="col-span-5 sm:col-span-3">
                                            <select
                                                value={course.grade}
                                                onChange={(e) => updateCourse(course.id, "grade", e.target.value)}
                                                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                {Object.keys(scale === "4.3" ? GRADE_SCALE_4_3 : GRADE_SCALE_4_0).map(g => (
                                                    <option key={g} value={g}>{g} Grade</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-4 sm:col-span-2">
                                            <input
                                                type="number"
                                                min="0.5"
                                                step="0.5"
                                                placeholder="Credits"
                                                value={course.credits}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(/^0+(?=\d)/, "");
                                                    updateCourse(course.id, "credits", raw);
                                                }}
                                                className="w-full text-center px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div className="col-span-3 sm:col-span-3 flex items-center justify-end gap-1">
                                            {scale === "5.0" && (
                                                <select
                                                    value={course.courseType}
                                                    onChange={(e) => updateCourse(course.id, "courseType", e.target.value)}
                                                    className="px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="regular">Reg</option>
                                                    <option value="honors">Hon (+0.5)</option>
                                                    <option value="ap">AP (+1.0)</option>
                                                </select>
                                            )}
                                            <button
                                                onClick={() => removeCourse(course.id)}
                                                disabled={courses.length <= 1}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition rounded-lg hover:bg-rose-50 cursor-pointer"
                                                title="Remove course"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addCourse}
                                className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> Add Another Course Row
                            </button>
                        </div>

                        {/* Presets Bar */}
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Academic Term Templates
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((p) => {
                                    const isActive = activePresetId === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => applyPreset(p)}
                                            className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                                }`}
                                        >
                                            <span>{p.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                                                {p.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Copy and Export Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Detailed GPA Analytics & Target Planner */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Calculated Academic Standing
                            </h2>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                {scale} Scale
                            </span>
                        </div>

                        {/* Primary GPA Display Card */}
                        <div className="p-6 rounded-2xl border bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <GraduationCap className="w-4 h-4 text-indigo-400" /> Grade Point Average
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                    Verified Output
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-b border-indigo-800/80 pb-4">
                                <div>
                                    <div className="text-xs text-indigo-300 font-medium">Term Unweighted GPA</div>
                                    <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                                        {calculations.termUnweightedGpa.toFixed(2)}
                                    </div>
                                    <div className="text-[11px] text-indigo-200/80 mt-1">
                                        {calculations.currentTermCredits} Credits Attempted
                                    </div>
                                </div>

                                {includePrior ? (
                                    <div>
                                        <div className="text-xs text-indigo-300 font-medium">Cumulative GPA</div>
                                        <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
                                            {calculations.cumulativeUnweightedGpa.toFixed(2)}
                                        </div>
                                        <div className="text-[11px] text-indigo-200/80 mt-1">
                                            {calculations.totalCreditsWithPrior} Total Lifetime Credits
                                        </div>
                                    </div>
                                ) : (
                                    scale === "5.0" && (
                                        <div>
                                            <div className="text-xs text-indigo-300 font-medium">Term Weighted GPA</div>
                                            <div className="text-3xl sm:text-4xl font-black text-amber-400 mt-1">
                                                {calculations.termWeightedGpa.toFixed(2)}
                                            </div>
                                            <div className="text-[11px] text-indigo-200/80 mt-1">
                                                AP / Honors Adjusted
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs text-indigo-200 font-semibold flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-amber-400" /> Latin Honors / Status:
                                </span>
                                <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                                    {calculations.honorsClass}
                                </span>
                            </div>
                        </div>

                        {/* Target GPA Goal Scenario Planner */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-indigo-600" /> Target GPA Planner
                                </h3>
                                <span className="text-[11px] font-semibold text-indigo-600">Goal Calculator</span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Desired Target GPA
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 3.75"
                                        value={targetGpa}
                                        onChange={handleTargetGpaInput}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Remaining Credits Left
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        placeholder="e.g. 30"
                                        value={remainingCredits}
                                        onChange={handleRemainingCreditsInput}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {calculations.requiredFutureGpa !== null && (
                                <div className={`p-3 rounded-lg text-xs font-medium border ${calculations.targetAchievable
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                    : "bg-rose-50 border-rose-200 text-rose-900"
                                    }`}>
                                    {calculations.targetAchievable ? (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>
                                                To reach a <strong>{targetGpa}</strong> cumulative GPA, you need an average GPA of <strong>{calculations.requiredFutureGpa.toFixed(2)}</strong> across your remaining {remainingCredits} credits.
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                            <span>
                                                A target of <strong>{targetGpa}</strong> requires an unachievable average GPA of <strong>{calculations.requiredFutureGpa.toFixed(2)}</strong> across your remaining credits (exceeds the maximum scale limit).
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Native Calculation
                        </span>
                        <span>TwisterTools Academic Engine</span>
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
                            Understanding Grade Point Average (GPA) & Academic Grading Systems
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A <strong>Grade Point Average (GPA)</strong> is the standard numerical metric used by academic institutions globally to measure a student’s overall scholastic performance. Expressed on a numerical scale—most commonly ranging from 0.0 to 4.0—GPA summarizes course marks across academic quarters, semesters, or entire degree programs into a single representative index.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <GraduationCap className="w-4 h-4 text-indigo-600" /> Credit Hours
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The quantitative weight assigned to a class, typically determined by weekly classroom instruction hours. Courses with higher credit values exert a greater mathematical influence on overall GPA.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-emerald-600" /> Quality Points
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Calculated by multiplying the numerical point value of an earned letter grade by the credit hours of the course. Summing all quality points yields total grade points earned.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Layers className="w-4 h-4 text-amber-600" /> Cumulative Weighting
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The running aggregate score combining all prior terms. As total completed credits accumulate over time, individual course grades have a diminishing percentage impact on cumulative GPA.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3">
                        <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Core Rules of Academic GPA Computation
                        </h3>
                        <ul className="text-xs text-indigo-900 space-y-1.5 list-disc list-inside">
                            <li><strong>Unweighted GPA Ceiling:</strong> Standard unweighted scales cap maximum achievement at 4.0 (or 4.3 with A+ distinctions), regardless of course rigor.</li>
                            <li><strong>Weighted Academic Boost:</strong> Advanced Placement (AP), International Baccalaureate (IB), and Honors courses grant extra quality points (typically +0.5 or +1.0).</li>
                            <li><strong>Non-Credit Exclusions:</strong> Pass/Fail (P/F), Audited, and Incomplete (I) courses generally do not factor into numerical GPA calculations.</li>
                            <li><strong>Repeat Course Policies:</strong> Many universities allow course forgiveness, replacing prior lower grades with new marks upon successful retake.</li>
                        </ul>
                    </div>
                </section>

                {/* Card 2: Technical Property Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Letter Grade to Numerical Scale Conversion Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below details standard conversion values across letter grades, percentage equivalents, 4.0 standard scales, 4.3 plus-minus scales, and weighted 5.0 AP scales:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Letter Grade</th>
                                    <th className="p-3">Percentage Range</th>
                                    <th className="p-3">Standard 4.0 Scale</th>
                                    <th className="p-3">4.3 Plus Scale</th>
                                    <th className="p-3">Honors (+0.5)</th>
                                    <th className="p-3">AP / IB (+1.0)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">A+</td>
                                    <td className="p-3">97% – 100%</td>
                                    <td className="p-3 font-semibold">4.0</td>
                                    <td className="p-3 font-semibold">4.3</td>
                                    <td className="p-3 font-semibold text-emerald-600">4.5</td>
                                    <td className="p-3 font-semibold text-emerald-600">5.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">A</td>
                                    <td className="p-3">93% – 96%</td>
                                    <td className="p-3 font-semibold">4.0</td>
                                    <td className="p-3 font-semibold">4.0</td>
                                    <td className="p-3 font-semibold text-emerald-600">4.5</td>
                                    <td className="p-3 font-semibold text-emerald-600">5.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">A-</td>
                                    <td className="p-3">90% – 92%</td>
                                    <td className="p-3 font-semibold">3.7</td>
                                    <td className="p-3 font-semibold">3.7</td>
                                    <td className="p-3 font-semibold text-emerald-600">4.2</td>
                                    <td className="p-3 font-semibold text-emerald-600">4.7</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">B+</td>
                                    <td className="p-3">87% – 89%</td>
                                    <td className="p-3 font-semibold">3.3</td>
                                    <td className="p-3 font-semibold">3.3</td>
                                    <td className="p-3 font-semibold text-emerald-600">3.8</td>
                                    <td className="p-3 font-semibold text-emerald-600">4.3</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">B</td>
                                    <td className="p-3">83% – 86%</td>
                                    <td className="p-3 font-semibold">3.0</td>
                                    <td className="p-3 font-semibold">3.0</td>
                                    <td className="p-3 font-semibold text-emerald-600">3.5</td>
                                    <td className="p-3 font-semibold text-emerald-600">4.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">C+ / C</td>
                                    <td className="p-3">73% – 79%</td>
                                    <td className="p-3 font-semibold">2.0 – 2.3</td>
                                    <td className="p-3 font-semibold">2.0 – 2.3</td>
                                    <td className="p-3 font-semibold text-emerald-600">2.5 – 2.8</td>
                                    <td className="p-3 font-semibold text-emerald-600">3.0 – 3.3</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-rose-600">F</td>
                                    <td className="p-3">Below 60%</td>
                                    <td className="p-3 font-semibold">0.0</td>
                                    <td className="p-3 font-semibold">0.0</td>
                                    <td className="p-3 font-semibold">0.0</td>
                                    <td className="p-3 font-semibold">0.0</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Mathematical Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Formulas for GPA Derivations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        GPA calculation relies on weighted average arithmetic. Here are the exact formulas used to compute semester and cumulative metrics:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                Term Unweighted GPA Formula
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Sum of (Grade Value × Course Credits) divided by Total Term Credits:
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 font-bold">
                                Term GPA = Σ (Grade Points × Credits) / Σ Credits
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                Cumulative GPA Formula with Prior History
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Combines prior earned total points with current term points over total accumulated credits:
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 font-bold">
                                Cumulative GPA = (Prior Points + Term Points) / (Prior Credits + Term Credits)
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Worked Solution */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Calculation Example
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow this step-by-step example to understand how credit weights and grade points combine to form a cumulative GPA:
                    </p>

                    <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="font-bold text-slate-900 text-sm">Example Scenario: 14-Credit College Term</span>
                            <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">Worked Proof</span>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 font-mono text-xs space-y-2 text-slate-800">
                            <div>1. Course 1 (4 Credits, Grade A = 4.0): 4 × 4.0 = 16.0 Grade Points</div>
                            <div>2. Course 2 (4 Credits, Grade B+ = 3.3): 4 × 3.3 = 13.2 Grade Points</div>
                            <div>3. Course 3 (3 Credits, Grade A- = 3.7): 3 × 3.7 = 11.1 Grade Points</div>
                            <div>4. Course 4 (3 Credits, Grade B = 3.0): 3 × 3.0 = 9.0 Grade Points</div>
                            <div className="pt-2 border-t border-slate-200 font-bold text-slate-900">
                                Total Term Points = 16.0 + 13.2 + 11.1 + 9.0 = 49.3 Grade Points
                            </div>
                            <div className="font-bold text-indigo-600">
                                Term GPA = 49.3 / 14 Credits = 3.52 (Magna Cum Laude Level)
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: How-To Usage Steps */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Use the GPA Calculator
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <h3 className="font-bold text-slate-900 text-xs">Select Grading Scale</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Choose standard 4.0, 4.3, or 5.0 weighted AP scale.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <h3 className="font-bold text-slate-900 text-xs">Enter Course Details</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Input course names, letter grades, and credit hours.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                            <h3 className="font-bold text-slate-900 text-xs">Toggle Cumulative History</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Optionally add prior GPA and credits earned.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                            <h3 className="font-bold text-slate-900 text-xs">Plan Future Goals</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Use the target planner to compute required future marks.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Academic Latin Honors Reference */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Latin Honors & Academic Distinction Benchmarks
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-500" /> Summa Cum Laude
                            </h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Meaning "With Highest Honor". Typically awarded to the top 1% to 5% of a graduating class (GPA 3.90–4.00).
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <Award className="w-4 h-4 text-slate-400" /> Magna Cum Laude
                            </h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Meaning "With Great Honor". Typically awarded to the top 5% to 15% of a graduating class (GPA 3.70–3.89).
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-700" /> Cum Laude
                            </h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Meaning "With Honor". Typically awarded to the top 15% to 30% of a graduating class (GPA 3.50–3.69).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 7: Frequently Asked Questions (FAQ) */}
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
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is Grade Point Average (GPA) calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                GPA is calculated by multiplying the numerical point value of the letter grade earned in each course by its credit value to determine total grade points earned, then dividing total grade points by the sum of total credit hours attempted.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Weighted and Unweighted GPA?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Unweighted GPA measures academic achievement on a standard 4.0 scale regardless of course difficulty. Weighted GPA assigns extra numerical weight (typically +0.5 for Honors and +1.0 for AP/IB courses) to reflect rigor, scaling up to 5.0.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do prior credits impact cumulative GPA?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Cumulative GPA combines all past earned grade points with your current term points divided by total accumulated credit hours. The more prior credits you have, the less a single semester's grades will shift your overall GPA.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What GPA is required for Latin Honors at graduation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While exact thresholds vary by university, typical standards are: Cum Laude (3.50–3.69), Magna Cum Laude (3.70–3.89), and Summa Cum Laude (3.90–4.00).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I calculate my required future GPA to reach a target goal?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. By entering your current cumulative GPA, total credits earned, desired target GPA, and remaining credit hours, the target scenario planner determines the exact average grade needed in upcoming terms.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}