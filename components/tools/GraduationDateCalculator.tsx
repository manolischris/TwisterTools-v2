"use client";

import React, { useState, useMemo } from "react";
import {
    GraduationCap,
    Calendar,
    BookOpen,
    Clock,
    Sparkles,
    CheckCircle2,
    CalendarCheck,
    Layers,
    AlertCircle,
    Copy,
    School,
    HelpCircle,
    BarChart3,
    Compass,
    Lightbulb,
    Target,
    ArrowRight,
    RotateCcw,
    SlidersHorizontal
} from "lucide-react";

type AcademicSystem = "semester" | "quarter" | "trimester";
type DegreeType = "bachelor" | "associate" | "master" | "doctorate" | "custom";

interface DegreePreset {
    name: string;
    description: string;
    system: AcademicSystem;
    totalCredits: number;
    creditsPerTerm: number;
    includeSummer: boolean;
    summerCredits: number;
}

const DEGREE_PRESETS: Record<DegreeType, DegreePreset> = {
    bachelor: {
        name: "Bachelor's Degree (4-Year Standard)",
        description: "120 semester credit hours or 180 quarter units for undergraduate programs",
        system: "semester",
        totalCredits: 120,
        creditsPerTerm: 15,
        includeSummer: false,
        summerCredits: 0
    },
    associate: {
        name: "Associate Degree (2-Year Standard)",
        description: "60 semester credit hours for community college and technical degrees",
        system: "semester",
        totalCredits: 60,
        creditsPerTerm: 15,
        includeSummer: false,
        summerCredits: 0
    },
    master: {
        name: "Master's Degree (Graduate)",
        description: "36 semester credit hours for graduate programs and MBA tracks",
        system: "semester",
        totalCredits: 36,
        creditsPerTerm: 9,
        includeSummer: false,
        summerCredits: 0
    },
    doctorate: {
        name: "Doctoral / PhD Track",
        description: "72 semester credit hours including advanced coursework & dissertation",
        system: "semester",
        totalCredits: 72,
        creditsPerTerm: 9,
        includeSummer: true,
        summerCredits: 3
    },
    custom: {
        name: "Custom Academic Curriculum",
        description: "Configure custom credit limits, term paces, and non-standard schedules",
        system: "semester",
        totalCredits: 120,
        creditsPerTerm: 15,
        includeSummer: false,
        summerCredits: 0
    }
};

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min = 0,
    max = 999
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

interface TermBreakdown {
    termIndex: number;
    season: string;
    year: number;
    termType: "regular" | "summer";
    creditsEarned: number;
    cumulativeCredits: number;
    remainingCredits: number;
    monthRange: string;
}

export default function GraduationDateCalculator() {
    const [selectedDegree, setSelectedDegree] = useState<DegreeType>("bachelor");
    const [academicSystem, setAcademicSystem] = useState<AcademicSystem>("semester");
    const [totalCreditsRequired, setTotalCreditsRequired] = useState<number>(120);
    const [completedCredits, setCompletedCredits] = useState<number>(30);
    const [creditsPerRegularTerm, setCreditsPerRegularTerm] = useState<number>(15);
    const [includeSummerTerms, setIncludeSummerTerms] = useState<boolean>(false);
    const [summerCredits, setSummerCredits] = useState<number>(6);

    const [startTermSeason, setStartTermSeason] = useState<string>("Fall");
    const [startTermYear, setStartTermYear] = useState<number>(2026);

    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

    const resetDefaults = () => {
        setSelectedDegree("bachelor");
        setAcademicSystem("semester");
        setTotalCreditsRequired(120);
        setCompletedCredits(30);
        setCreditsPerRegularTerm(15);
        setIncludeSummerTerms(false);
        setSummerCredits(6);
        setStartTermSeason("Fall");
        setStartTermYear(2026);
    };

    const handleDegreeChange = (degree: DegreeType) => {
        setSelectedDegree(degree);
        const preset = DEGREE_PRESETS[degree];
        setAcademicSystem(preset.system);
        setTotalCreditsRequired(preset.totalCredits);
        setCreditsPerRegularTerm(preset.creditsPerTerm);
        setIncludeSummerTerms(preset.includeSummer);
        setSummerCredits(preset.summerCredits);
    };

    const remainingCredits = Math.max(0, totalCreditsRequired - completedCredits);

    const { schedule, graduationTerm, totalTermsRequired, estimatedGraduationDate, academicYearsRemaining } = useMemo(() => {
        const termsList: TermBreakdown[] = [];
        let curCompleted = completedCredits;
        let curYear = startTermYear;

        const regularTermsSemester = ["Fall", "Spring"];
        const regularTermsQuarter = ["Fall", "Winter", "Spring"];
        const regularTermsTrimester = ["Fall", "Winter", "Spring"];

        const activeRegularTerms =
            academicSystem === "semester"
                ? regularTermsSemester
                : academicSystem === "quarter"
                    ? regularTermsQuarter
                    : regularTermsTrimester;

        let seasonIdx = activeRegularTerms.indexOf(startTermSeason);
        if (seasonIdx === -1) seasonIdx = 0;

        let termCounter = 0;
        const maxIter = 100;

        while (curCompleted < totalCreditsRequired && termCounter < maxIter) {
            termCounter++;
            const currentSeason = activeRegularTerms[seasonIdx];
            const needed = totalCreditsRequired - curCompleted;
            const termCredits = Math.min(needed, creditsPerRegularTerm);

            curCompleted += termCredits;

            let monthRange = "";
            if (academicSystem === "semester") {
                monthRange = currentSeason === "Fall" ? "Late August – Mid December" : "Mid January – Early May";
            } else if (academicSystem === "quarter") {
                if (currentSeason === "Fall") monthRange = "Late September – Mid December";
                else if (currentSeason === "Winter") monthRange = "Early January – Late March";
                else monthRange = "Early April – Mid June";
            } else {
                if (currentSeason === "Fall") monthRange = "September – December";
                else if (currentSeason === "Winter") monthRange = "January – April";
                else monthRange = "May – August";
            }

            termsList.push({
                termIndex: termCounter,
                season: currentSeason,
                year: curYear,
                termType: "regular",
                creditsEarned: termCredits,
                cumulativeCredits: curCompleted,
                remainingCredits: Math.max(0, totalCreditsRequired - curCompleted),
                monthRange
            });

            if (curCompleted >= totalCreditsRequired) break;

            if (includeSummerTerms && currentSeason === "Spring" && summerCredits > 0) {
                termCounter++;
                const summerNeeded = totalCreditsRequired - curCompleted;
                const earnedSummer = Math.min(summerNeeded, summerCredits);
                curCompleted += earnedSummer;

                termsList.push({
                    termIndex: termCounter,
                    season: "Summer",
                    year: curYear,
                    termType: "summer",
                    creditsEarned: earnedSummer,
                    cumulativeCredits: curCompleted,
                    remainingCredits: Math.max(0, totalCreditsRequired - curCompleted),
                    monthRange: "Early June – Early August"
                });

                if (curCompleted >= totalCreditsRequired) break;
            }

            if (seasonIdx === activeRegularTerms.length - 1) {
                seasonIdx = 0;
                curYear++;
            } else {
                seasonIdx++;
            }
        }

        const gradTerm = termsList[termsList.length - 1] || null;

        let estimatedDateStr = "Already Completed";
        if (gradTerm) {
            if (gradTerm.season === "Fall") {
                estimatedDateStr = `December ${gradTerm.year}`;
            } else if (gradTerm.season === "Spring") {
                estimatedDateStr = academicSystem === "quarter" ? `June ${gradTerm.year}` : `May ${gradTerm.year}`;
            } else if (gradTerm.season === "Winter") {
                estimatedDateStr = `March ${gradTerm.year}`;
            } else if (gradTerm.season === "Summer") {
                estimatedDateStr = `August ${gradTerm.year}`;
            }
        }

        const termsPerYear = academicSystem === "quarter" ? 3 : 2;
        const yearsRemaining = termsList.length > 0 ? (termsList.filter((t) => t.termType === "regular").length / termsPerYear).toFixed(1) : "0.0";

        return {
            schedule: termsList,
            graduationTerm: gradTerm,
            totalTermsRequired: termsList.length,
            estimatedGraduationDate: estimatedDateStr,
            academicYearsRemaining: yearsRemaining
        };
    }, [
        totalCreditsRequired,
        completedCredits,
        creditsPerRegularTerm,
        includeSummerTerms,
        summerCredits,
        startTermSeason,
        startTermYear,
        academicSystem
    ]);

    const progressPercentage = useMemo(() => {
        if (totalCreditsRequired <= 0) return 100;
        return Math.min(100, Math.round((completedCredits / totalCreditsRequired) * 100));
    }, [completedCredits, totalCreditsRequired]);

    const copyScheduleToClipboard = () => {
        const text = `TwisterTools Graduation Timeline & Semester Plan:
--------------------------------------------------
Degree Profile: ${DEGREE_PRESETS[selectedDegree].name}
Academic System: ${academicSystem.toUpperCase()}
Total Credits Required: ${totalCreditsRequired}
Completed Credits: ${completedCredits} (${progressPercentage}%)
Remaining Credits: ${remainingCredits}
Pace: ${creditsPerRegularTerm} credits/term (Summer: ${includeSummerTerms ? `${summerCredits} credits` : "Off"})

Estimated Graduation: ${estimatedGraduationDate} (${graduationTerm ? `${graduationTerm.season} ${graduationTerm.year}` : "N/A"})
Total Terms to Finish: ${totalTermsRequired} (~${academicYearsRemaining} academic years)

Term-by-Term Roadmap:
${schedule
                .map(
                    (t) =>
                        ` • ${t.season} ${t.year} (${t.monthRange}): +${t.creditsEarned} credits → Cumulative: ${t.cumulativeCredits}/${totalCreditsRequired}`
                )
                .join("\n")}
--------------------------------------------------
Generated via TwisterTools Graduation Date Estimator`;

        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "School Semester & College Graduation Date Estimator",
        "url": "https://twistertools.com/tools/date-tools/graduation-date-calculator",
        "description": "Calculate your college or high school graduation date, semester roadmap, remaining credits, and degree completion timeline across semester, quarter, and trimester academic systems.",
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
                "name": "How does this graduation date calculator determine my expected completion date?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The calculator computes your remaining required credit hours by subtracting completed credits from your degree target. It then simulates your sequence of academic terms based on your enrolled credit load per term, summer school participation, and institutional calendar system (Semester, Quarter, or Trimester)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Semester, Quarter, and Trimester systems?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Semester system consists of two primary 15-to-16 week terms (Fall and Spring), requiring 120 credits for a bachelor's degree. A Quarter system divides the year into three 10-week academic sessions (Fall, Winter, Spring, plus optional Summer), requiring roughly 180 quarter units. A Trimester system divides the year into three 12-to-13 week periods."
                }
            },
            {
                "@type": "Question",
                "name": "How many credits per semester are required to graduate in four years?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For a standard 120-credit bachelor's degree on a semester system, a student must complete an average of 15 credits per semester across 8 consecutive terms (30 credits per academic year) to graduate in four years without summer courses."
                }
            },
            {
                "@type": "Question",
                "name": "How do summer terms shorten my time to college graduation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Enrolling in 6 to 9 credits during summer sessions allows you to complete prerequisite courses ahead of time, recover failed units, or shave 1 to 2 full semesters off your four-year timeline, potentially saving substantial tuition and living expenses."
                }
            },
            {
                "@type": "Question",
                "name": "Can this tool calculate graduation dates for Master's and Associate degrees?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Built-in presets are included for 60-credit Associate degrees, 120-credit Bachelor's degrees, 36-credit Master's programs, and 72-credit PhD tracks, as well as a customizable degree mode for transfer students and dual-degree programs."
                }
            },
            {
                "@type": "Question",
                "name": "What is considered full-time vs part-time student status?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For federal financial aid in the United States, undergraduate full-time status requires a minimum of 12 credits per semester (though 15 is recommended for 4-year completion). Taking 6 to 11 credits constitutes half-time or part-time status, which extends the degree timeline accordingly."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Academic Configuration & Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Title Bar inside card */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Curriculum & Credit Configuration
                            </span>
                            <button
                                type="button"
                                onClick={resetDefaults}
                                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Defaults
                            </button>
                        </div>

                        {/* Degree Type Presets */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <School className="w-3.5 h-3.5 text-indigo-600" />
                                Select Degree Program Level
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(Object.keys(DEGREE_PRESETS) as DegreeType[]).map((key) => {
                                    const preset = DEGREE_PRESETS[key];
                                    const isSelected = selectedDegree === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handleDegreeChange(key)}
                                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${isSelected
                                                    ? "bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-400"
                                                    : "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            <span className={`text-xs font-bold capitalize ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
                                                {key}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium mt-1">
                                                {preset.totalCredits} {preset.system === "quarter" ? "Units" : "Credits"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Calendar System & Start Term Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Academic Calendar System</label>
                                <select
                                    value={academicSystem}
                                    onChange={(e) => setAcademicSystem(e.target.value as AcademicSystem)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="semester">Semester (2 Terms / Year)</option>
                                    <option value="quarter">Quarter (3 Terms / Year)</option>
                                    <option value="trimester">Trimester (3 Terms / Year)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Next Term</label>
                                    <select
                                        value={startTermSeason}
                                        onChange={(e) => setStartTermSeason(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="Fall">Fall</option>
                                        <option value="Spring">Spring</option>
                                        {academicSystem !== "semester" && <option value="Winter">Winter</option>}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Start Year</label>
                                    <input
                                        type="number"
                                        min={2024}
                                        max={2040}
                                        value={startTermYear}
                                        onChange={(e) => handleNumberInput(e, setStartTermYear, 2024, 2040)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Credit Accounting Section */}
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-4">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-200 pb-2">
                                Credit Hour Accounting
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Total Degree Credits</span>
                                        <span className="text-indigo-600 font-mono">{totalCreditsRequired}</span>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={totalCreditsRequired}
                                        onChange={(e) => handleNumberInput(e, setTotalCreditsRequired, 1, 300)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Credits Completed</span>
                                        <span className="text-emerald-600 font-mono">{completedCredits} ({progressPercentage}%)</span>
                                    </div>
                                    <input
                                        type="number"
                                        min={0}
                                        max={totalCreditsRequired}
                                        value={completedCredits}
                                        onChange={(e) => handleNumberInput(e, setCompletedCredits, 0, totalCreditsRequired)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold text-slate-600">
                                    <span>Degree Completion Progress</span>
                                    <span>{completedCredits} / {totalCreditsRequired} credits completed</span>
                                </div>
                                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pace & Summer Enrollment Controls */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                    <span>Regular Term Course Load</span>
                                    <span className="text-indigo-600 font-mono font-black">{creditsPerRegularTerm} credits/term</span>
                                </div>
                                <input
                                    type="range"
                                    min={3}
                                    max={24}
                                    step={1}
                                    value={creditsPerRegularTerm}
                                    onChange={(e) => setCreditsPerRegularTerm(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                    <span>Part-Time (6-9)</span>
                                    <span>Full-Time (12-15)</span>
                                    <span>Accelerated (18+)</span>
                                </div>
                            </div>

                            {/* Summer School Toggle & Slider */}
                            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-bold text-slate-800">Enroll in Summer Semesters</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={includeSummerTerms}
                                        onChange={(e) => setIncludeSummerTerms(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                    />
                                </label>

                                {includeSummerTerms && (
                                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                        <div className="flex justify-between text-xs font-bold text-slate-700">
                                            <span>Summer Credit Load</span>
                                            <span className="text-amber-600 font-mono">{summerCredits} credits</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={1}
                                            max={12}
                                            step={1}
                                            value={summerCredits}
                                            onChange={(e) => setSummerCredits(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Quick Insight Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Target className="w-3.5 h-3.5 text-indigo-600" />
                            Remaining: {remainingCredits} credits to graduate
                        </span>
                        <span className="font-semibold text-emerald-600">Calculated Real-Time</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Graduation Forecast & Term-by-Term Roadmap */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Top Forecast Highlight Box */}
                        <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-md space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                                    <CalendarCheck className="w-4 h-4 text-emerald-400" />
                                    Estimated Graduation
                                </span>
                                <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
                                    {academicSystem.toUpperCase()}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                                    {estimatedGraduationDate}
                                </div>
                                <p className="text-xs text-slate-300">
                                    Target Term: {graduationTerm ? `${graduationTerm.season} ${graduationTerm.year} (${graduationTerm.monthRange})` : "Curriculum Completed"}
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                                <div className="p-2 bg-slate-800/60 rounded-xl">
                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Terms Left</span>
                                    <span className="text-lg font-bold font-mono text-emerald-400">{totalTermsRequired}</span>
                                </div>
                                <div className="p-2 bg-slate-800/60 rounded-xl">
                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Years Left</span>
                                    <span className="text-lg font-bold font-mono text-indigo-300">~{academicYearsRemaining}</span>
                                </div>
                                <div className="p-2 bg-slate-800/60 rounded-xl">
                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Credits Left</span>
                                    <span className="text-lg font-bold font-mono text-amber-400">{remainingCredits}</span>
                                </div>
                            </div>
                        </div>

                        {/* Term-by-Term Roadmap Breakdown */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Term-by-Term Course Schedule Plan
                                </h2>
                                <span className="text-xs font-semibold text-slate-500">
                                    {schedule.length} Academic Periods
                                </span>
                            </div>

                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {schedule.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 space-y-2">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                                        <p className="text-xs font-semibold">Degree requirements completed! You are ready to graduate.</p>
                                    </div>
                                ) : (
                                    schedule.map((term) => {
                                        const isFinalTerm = term.termIndex === totalTermsRequired;
                                        return (
                                            <div
                                                key={`${term.season}-${term.year}-${term.termIndex}`}
                                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${isFinalTerm
                                                        ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400"
                                                        : term.termType === "summer"
                                                            ? "bg-amber-50/50 border-amber-200"
                                                            : "bg-slate-50 border-slate-200"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${isFinalTerm
                                                                ? "bg-indigo-600 text-white"
                                                                : term.termType === "summer"
                                                                    ? "bg-amber-500 text-white"
                                                                    : "bg-slate-200 text-slate-700"
                                                            }`}
                                                    >
                                                        {term.termIndex}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-slate-900 truncate">
                                                                {term.season} {term.year}
                                                            </span>
                                                            {isFinalTerm && (
                                                                <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded">
                                                                    Graduation Term
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 block truncate">
                                                            {term.monthRange}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <span className="text-xs font-mono font-bold text-indigo-600 block">
                                                        +{term.creditsEarned} credits
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {term.cumulativeCredits} / {totalCreditsRequired} total
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Copy Summary Button */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={copyScheduleToClipboard}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedSummary ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedSummary ? "Academic Plan Copied to Clipboard!" : "Copy Full Graduation Roadmap"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Academic System Mechanics & Credit Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            College Credit Systems: Semesters, Quarters, and Degree Completion Timelines
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Planning an accurate college graduation date requires understanding how academic calendars and credit accumulation models operate. Higher education institutions across North America and worldwide structure their degree curricula around distinct calendar systems, primarily <strong>Semesters</strong>, <strong>Quarters</strong>, and <strong>Trimesters</strong>.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Under a standard semester calendar, the academic year consists of two 15-to-16-week terms (Fall and Spring), requiring an undergraduate student to complete approximately 120 semester credits for a Bachelor of Science (B.S.) or Bachelor of Arts (B.A.). In contrast, quarter systems divide the year into three 10-week terms (Fall, Winter, and Spring), necessitating 180 quarter units for an equivalent degree.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">System 01</span>
                            <h3 className="font-bold text-slate-900 text-sm">Semester Calendar</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                2 primary terms per year. 120 credit threshold for 4-year completion. Standard 15 credits per term load maintains full-time graduation velocity.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">System 02</span>
                            <h3 className="font-bold text-slate-900 text-sm">Quarter Calendar</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                3 core academic sessions plus summer. 180 quarter units required. Fast-paced 10-week cycles provide higher course variety per year.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">System 03</span>
                            <h3 className="font-bold text-slate-900 text-sm">Trimester Calendar</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                3 equal 12-to-13-week terms year-round. Enables accelerated year-round degree tracks, completing a bachelor’s degree in under 3 calendar years.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Degree Level Benchmarks & Credit Requirements Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Degree Level Benchmarks & Time-to-Graduation Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below details typical credit thresholds, term distributions, and graduation timelines across standard academic degree classifications:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Degree Classification</th>
                                    <th className="p-3">Semester Credits</th>
                                    <th className="p-3">Quarter Units</th>
                                    <th className="p-3">Standard Term Load</th>
                                    <th className="p-3">Average Completion</th>
                                    <th className="p-3">Accelerated Path</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Associate Degree (A.A. / A.S.)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">60 credits</td>
                                    <td className="p-3 font-mono text-slate-600">90 units</td>
                                    <td className="p-3 text-xs">15 credits / term</td>
                                    <td className="p-3 text-xs">2 Years (4 Semesters)</td>
                                    <td className="p-3 text-xs text-emerald-600 font-bold">1.5 Years with Summer</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Bachelor&apos;s Degree (B.A. / B.S.)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">120 credits</td>
                                    <td className="p-3 font-mono text-slate-600">180 units</td>
                                    <td className="p-3 text-xs">15 credits / term</td>
                                    <td className="p-3 text-xs">4 Years (8 Semesters)</td>
                                    <td className="p-3 text-xs text-emerald-600 font-bold">3 Years (18 cr + Summer)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Master&apos;s Degree (M.S. / M.A. / MBA)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">30–36 credits</td>
                                    <td className="p-3 font-mono text-slate-600">45–54 units</td>
                                    <td className="p-3 text-xs">9 credits / term (Grad)</td>
                                    <td className="p-3 text-xs">2 Years (4 Semesters)</td>
                                    <td className="p-3 text-xs text-emerald-600 font-bold">1 Year (Executive format)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Doctoral Degree (Ph.D. / Ed.D.)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">60–90 credits</td>
                                    <td className="p-3 font-mono text-slate-600">90–135 units</td>
                                    <td className="p-3 text-xs">6–9 credits + Research</td>
                                    <td className="p-3 text-xs">4–6 Years</td>
                                    <td className="p-3 text-xs text-emerald-600 font-bold">3.5 Years (Continuous)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Four-Year Graduation Math & 15-to-Finish Initiative */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The &quot;15 to Finish&quot; Rule and Full-Time Course Pacing Strategy
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A widespread misconception among undergraduate college students is that enrolling in 12 credit hours per semester guarantees graduation in four years. While 12 credits constitutes the federal minimum threshold for &quot;full-time&quot; status for financial aid purposes, taking 12 credits per semester yields only 24 credits per year—resulting in a five-year graduation timeline ($120 \div 24 = 5$ years).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600" /> The 12-Credit Trap (5-Year Drift)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Enrolling in 12 credits per term leaves a student 6 credits short of annual benchmark progress each academic year. Over four years, this creates a 24-credit deficit, requiring an extra full academic year of tuition, housing costs, and delayed professional career earnings.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> The 15-Credit Pacing Advantage
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Completing 15 credits in Fall and 15 credits in Spring yields exactly 30 credits annually. Over 4 years, this hits the precise 120-credit graduation requirement ($30 \times 4 = 120$), ensuring on-time commencement without mandatory summer coursework.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Actionable Strategies to Accelerate Graduation */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Proven Strategies to Accelerate Your College Graduation Date
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Students looking to graduate early and reduce higher education debt can employ several high-leverage credit acceleration strategies:
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Strategic Summer & Winter Intersession Courses</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Enrolling in 6 credits every summer and 3 credits during accelerated winter intersessions adds up to 27 additional credits over three years—virtually equal to an entire academic year of coursework.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Credit-by-Examination (AP, IB, CLEP, and DSST)</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    College-Level Examination Program (CLEP) exams allow students to test out of introductory general education requirements (such as College Composition, Psychology, or Calculus) for a fraction of tuition costs, earning immediate transfer credits.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Dual Enrollment and Community College Articulation</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    High school dual-enrollment courses and summer transient enrollment at accredited local community colleges transfer directly into university degree audits, reducing upper-division tuition loads.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Prerequisite Mapping & Degree Audit Audits</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Meet with your academic advisor before every registration cycle to verify prerequisite chains. Avoid taking electives that do not count toward your major or minor degree requirements.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                How does this graduation date calculator determine my expected completion date?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The calculator computes your remaining required credit hours by subtracting completed credits from your degree target. It then simulates your sequence of academic terms based on your enrolled credit load per term, summer school participation, and institutional calendar system (Semester, Quarter, or Trimester).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Semester, Quarter, and Trimester systems?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A Semester system consists of two primary 15-to-16 week terms (Fall and Spring), requiring 120 credits for a bachelor&apos;s degree. A Quarter system divides the year into three 10-week academic sessions (Fall, Winter, Spring, plus optional Summer), requiring roughly 180 quarter units. A Trimester system divides the year into three 12-to-13 week periods.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many credits per semester are required to graduate in four years?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For a standard 120-credit bachelor&apos;s degree on a semester system, a student must complete an average of 15 credits per semester across 8 consecutive terms (30 credits per academic year) to graduate in four years without summer courses.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do summer terms shorten my time to college graduation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Enrolling in 6 to 9 credits during summer sessions allows you to complete prerequisite courses ahead of time, recover failed units, or shave 1 to 2 full semesters off your four-year timeline, potentially saving substantial tuition and living expenses.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can this tool calculate graduation dates for Master&apos;s and Associate degrees?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Built-in presets are included for 60-credit Associate degrees, 120-credit Bachelor&apos;s degrees, 36-credit Master&apos;s programs, and 72-credit PhD tracks, as well as a customizable degree mode for transfer students and dual-degree programs.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is considered full-time vs part-time student status?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For federal financial aid in the United States, undergraduate full-time status requires a minimum of 12 credits per semester (though 15 is recommended for 4-year completion). Taking 6 to 11 credits constitutes half-time or part-time status, which extends the degree timeline accordingly.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}