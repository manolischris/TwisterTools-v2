"use client";

import React, { useState, useMemo, useId } from "react";
import {
    GitCommit,
    GitCompare,
    ArrowUpRight,
    RotateCcw,
    Copy,
    Check,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    HelpCircle,
    BookOpen,
    Layers,
    Terminal,
    Cpu,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Split,
    FileCode,
    Tag
} from "lucide-react";

interface SemVerParts {
    raw: string;
    major: number;
    minor: number;
    patch: number;
    prerelease: string;
    build: string;
    isValid: boolean;
    error?: string;
}

type ReleaseType =
    | "major"
    | "minor"
    | "patch"
    | "premajor"
    | "preminor"
    | "prepatch"
    | "prerelease";

const SEMVER_REGEX =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function parseSemVer(versionStr: string): SemVerParts {
    const trimmed = versionStr.trim();
    if (!trimmed) {
        return {
            raw: versionStr,
            major: 0,
            minor: 0,
            patch: 0,
            prerelease: "",
            build: "",
            isValid: false,
            error: "Version string is empty."
        };
    }

    // Strip leading 'v' or 'V' if present
    const cleanStr = trimmed.replace(/^v/i, "");
    const match = cleanStr.match(SEMVER_REGEX);

    if (!match) {
        return {
            raw: versionStr,
            major: 0,
            minor: 0,
            patch: 0,
            prerelease: "",
            build: "",
            isValid: false,
            error: "Invalid SemVer format. Expected pattern: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]"
        };
    }

    return {
        raw: trimmed,
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
        prerelease: match[4] || "",
        build: match[5] || "",
        isValid: true
    };
}

function compareIdentifiers(a: string, b: string): number {
    const aIsNum = /^\d+$/.test(a);
    const bIsNum = /^\d+$/.test(b);

    if (aIsNum && bIsNum) {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        return numA === numB ? 0 : numA > numB ? 1 : -1;
    }
    if (aIsNum && !bIsNum) return -1;
    if (!aIsNum && bIsNum) return 1;
    return a.localeCompare(b);
}

function comparePrerelease(preA: string, preB: string): number {
    if (!preA && !preB) return 0;
    if (!preA && preB) return 1; // Normal release has higher precedence than prerelease
    if (preA && !preB) return -1;

    const partsA = preA.split(".");
    const partsB = preB.split(".");
    const minLen = Math.min(partsA.length, partsB.length);

    for (let i = 0; i < minLen; i++) {
        const cmp = compareIdentifiers(partsA[i], partsB[i]);
        if (cmp !== 0) return cmp;
    }

    return partsA.length === partsB.length
        ? 0
        : partsA.length > partsB.length
            ? 1
            : -1;
}

function compareSemVer(v1: SemVerParts, v2: SemVerParts): number {
    if (v1.major !== v2.major) return v1.major > v2.major ? 1 : -1;
    if (v1.minor !== v2.minor) return v1.minor > v2.minor ? 1 : -1;
    if (v1.patch !== v2.patch) return v1.patch > v2.patch ? 1 : -1;
    return comparePrerelease(v1.prerelease, v2.prerelease);
}

function bumpVersion(
    parsed: SemVerParts,
    type: ReleaseType,
    identifier: string = "alpha"
): string {
    if (!parsed.isValid) return "";

    let { major, minor, patch, prerelease } = parsed;
    const tag = identifier.trim() || "alpha";

    switch (type) {
        case "major":
            return `${major + 1}.0.0`;
        case "minor":
            return `${major}.${minor + 1}.0`;
        case "patch":
            return `${major}.${minor}.${patch + 1}`;
        case "premajor":
            return `${major + 1}.0.0-${tag}.0`;
        case "preminor":
            return `${major}.${minor + 1}.0-${tag}.0`;
        case "prepatch":
            return `${major}.${minor}.${patch + 1}-${tag}.0`;
        case "prerelease": {
            if (!prerelease) {
                return `${major}.${minor}.${patch + 1}-${tag}.0`;
            }
            const parts = prerelease.split(".");
            const lastIndex = parts.length - 1;
            const lastPart = parts[lastIndex];

            if (/^\d+$/.test(lastPart)) {
                parts[lastIndex] = (parseInt(lastPart, 10) + 1).toString();
                return `${major}.${minor}.${patch}-${parts.join(".")}`;
            } else {
                return `${major}.${minor}.${patch}-${prerelease}.0`;
            }
        }
        default:
            return `${major}.${minor}.${patch}`;
    }
}

export default function SemverVersionCalculator() {
    const [versionA, setVersionA] = useState<string>("2.4.1-rc.1+20240915");
    const [versionB, setVersionB] = useState<string>("2.5.0-alpha.0");
    const [activeTab, setActiveTab] = useState<"comparator" | "bumper">("comparator");

    // Bumper workspace state
    const [bumpBaseVersion, setBumpBaseVersion] = useState<string>("1.8.2");
    const [prereleaseId, setPrereleaseId] = useState<string>("beta");
    const [customMajor, setCustomMajor] = useState<number>(1);
    const [customMinor, setCustomMinor] = useState<number>(8);
    const [customPatch, setCustomPatch] = useState<number>(2);
    const [customPre, setCustomPre] = useState<string>("");
    const [customBuild, setCustomBuild] = useState<string>("");

    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const verAId = useId();
    const verBId = useId();
    const bumpInputId = useId();
    const preId = useId();
    const majorInputId = useId();
    const minorInputId = useId();
    const patchInputId = useId();
    const customPreId = useId();
    const customBuildId = useId();

    // Parsing memoizations
    const parsedA = useMemo(() => parseSemVer(versionA), [versionA]);
    const parsedB = useMemo(() => parseSemVer(versionB), [versionB]);
    const parsedBump = useMemo(() => parseSemVer(bumpBaseVersion), [bumpBaseVersion]);

    // Comparison logic
    const comparisonResult = useMemo(() => {
        if (!parsedA.isValid || !parsedB.isValid) {
            return { diff: 0, text: "Invalid Version(s)", status: "invalid" as const };
        }
        const cmp = compareSemVer(parsedA, parsedB);
        if (cmp === 0) {
            return {
                diff: 0,
                text: "Versions are SemVer Equivalent",
                description: "Both versions share identical precedence ranking under the SemVer 2.0.0 specification (build metadata ignored).",
                status: "equal" as const
            };
        } else if (cmp > 0) {
            return {
                diff: 1,
                text: "Version A is Greater (Newer)",
                description: `Version ${parsedA.raw} has higher release precedence than Version ${parsedB.raw}.`,
                status: "greater" as const
            };
        } else {
            return {
                diff: -1,
                text: "Version B is Greater (Newer)",
                description: `Version ${parsedB.raw} has higher release precedence than Version ${parsedA.raw}.`,
                status: "lesser" as const
            };
        }
    }, [parsedA, parsedB]);

    // Diff categorization
    const diffCategory = useMemo(() => {
        if (!parsedA.isValid || !parsedB.isValid) return null;
        if (parsedA.major !== parsedB.major) {
            return {
                level: "MAJOR",
                color: "rose",
                impact: "Breaking Changes Likely",
                summary: `Major step from ${parsedA.major} to ${parsedB.major}. Public API breaking alterations.`
            };
        }
        if (parsedA.minor !== parsedB.minor) {
            return {
                level: "MINOR",
                color: "indigo",
                impact: "Backwards-Compatible Features",
                summary: `Minor increment from ${parsedA.minor} to ${parsedB.minor}. Backward-compatible functionality added.`
            };
        }
        if (parsedA.patch !== parsedB.patch) {
            return {
                level: "PATCH",
                color: "emerald",
                impact: "Backwards-Compatible Bug Fixes",
                summary: `Patch revision from ${parsedA.patch} to ${parsedB.patch}. Backward-compatible bug fixes.`
            };
        }
        if (parsedA.prerelease !== parsedB.prerelease) {
            return {
                level: "PRERELEASE",
                color: "amber",
                impact: "Pre-Release Channel Drift",
                summary: `Prerelease tags differ (${parsedA.prerelease || "None"} vs ${parsedB.prerelease || "None"}). Unstable milestone channel.`
            };
        }
        if (parsedA.build !== parsedB.build) {
            return {
                level: "BUILD METADATA",
                color: "slate",
                impact: "Precedence Neutral",
                summary: `Build metadata differs (${parsedA.build || "None"} vs ${parsedB.build || "None"}). Ignored when determining version precedence.`
            };
        }
        return {
            level: "EQUAL",
            color: "emerald",
            impact: "Identical Precedence",
            summary: "Exact matching semantic version components."
        };
    }, [parsedA, parsedB]);

    // Bump calculation list
    const calculatedBumps = useMemo(() => {
        if (!parsedBump.isValid) return [];

        const list: Array<{ type: ReleaseType; title: string; desc: string; val: string }> = [
            {
                type: "patch",
                title: "Patch Bump",
                desc: "Bug fixes, hotfixes, backwards-compatible repairs",
                val: bumpVersion(parsedBump, "patch", prereleaseId)
            },
            {
                type: "minor",
                title: "Minor Bump",
                desc: "New backwards-compatible features, non-breaking changes",
                val: bumpVersion(parsedBump, "minor", prereleaseId)
            },
            {
                type: "major",
                title: "Major Bump",
                desc: "Breaking API changes, architectural rewrites",
                val: bumpVersion(parsedBump, "major", prereleaseId)
            },
            {
                type: "prerelease",
                title: "Prerelease Bump",
                desc: "Increment prerelease identifier index or attach default channel",
                val: bumpVersion(parsedBump, "prerelease", prereleaseId)
            },
            {
                type: "prepatch",
                title: "Pre-Patch Bump",
                desc: "Prepare next patch release candidate",
                val: bumpVersion(parsedBump, "prepatch", prereleaseId)
            },
            {
                type: "preminor",
                title: "Pre-Minor Bump",
                desc: "Prepare next feature candidate with prerelease flag",
                val: bumpVersion(parsedBump, "preminor", prereleaseId)
            },
            {
                type: "premajor",
                title: "Pre-Major Bump",
                desc: "Prepare breaking architectural changes with alpha/beta identifier",
                val: bumpVersion(parsedBump, "premajor", prereleaseId)
            }
        ];

        return list;
    }, [parsedBump, prereleaseId]);

    // Constructed custom version string
    const customConstructedString = useMemo(() => {
        let base = `${customMajor}.${customMinor}.${customPatch}`;
        if (customPre.trim()) {
            base += `-${customPre.trim().replace(/^[^a-zA-Z0-9.-]+/, "")}`;
        }
        if (customBuild.trim()) {
            base += `+${customBuild.trim().replace(/^[^a-zA-Z0-9.-]+/, "")}`;
        }
        return base;
    }, [customMajor, customMinor, customPatch, customPre, customBuild]);

    const handleCopy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleNumberInput = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<number>>
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        setter(isNaN(num) ? 0 : Math.max(0, num));
    };

    const applyPreset = (preset: "standard" | "prerelease" | "breaking") => {
        if (preset === "standard") {
            setVersionA("1.4.0");
            setVersionB("1.4.1");
        } else if (preset === "prerelease") {
            setVersionA("2.0.0-alpha.1");
            setVersionB("2.0.0-beta.2");
        } else {
            setVersionA("1.11.4");
            setVersionB("2.0.0");
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "SemVer Semantic Version Comparison & Bump Calculator",
        "url": "https://twistertools.com/tools/developer-tools/semver-version-calculator",
        "description": "Evaluate SemVer 2.0.0 release precedence, compute major, minor, patch, and prerelease version bumps, validate build metadata, and inspect diff boundaries client-side.",
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
                "name": "What is Semantic Versioning (SemVer 2.0.0)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Semantic Versioning is a formal specification that dictates how software version numbers are assigned and incremented. It uses a three-part format: MAJOR.MINOR.PATCH, where MAJOR signals breaking API changes, MINOR signifies backward-compatible feature additions, and PATCH designates backward-compatible bug fixes."
                }
            },
            {
                "@type": "Question",
                "name": "Why is build metadata ignored in SemVer precedence comparisons?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "According to SemVer 2.0.0 clause 10, build metadata (indicated by a plus '+' sign and following characters) denotes build configurations, commit hashes, or compiler timestamps. Two versions that differ solely by build metadata have identical precedence ranking and do not trigger version upgrades."
                }
            },
            {
                "@type": "Question",
                "name": "How does SemVer compare prerelease tags like alpha, beta, and rc?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A prerelease version always possesses lower precedence than its associated normal release. When comparing two prereleases, identifiers separated by dots are compared from left to right: numeric identifiers are compared numerically, and lexical identifiers are compared in ASCII sort order."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between caret (^) and tilde (~) in package.json?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Tilde (~1.2.3) permits patch updates (>=1.2.3 <1.3.0), whereas Caret (^1.2.3) permits both minor and patch updates without breaking major changes (>=1.2.3 <2.0.0), provided the major version is non-zero."
                }
            },
            {
                "@type": "Question",
                "name": "Does this SemVer calculator transmit package or repository data to any server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All parsing, validation, comparison, and version bump calculations occur entirely client-side in your web browser. No version strings, package configurations, or telemetry data are dispatched across the network."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Mode Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("comparator")}
                        className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${activeTab === "comparator"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                    >
                        <GitCompare className="w-4 h-4" />
                        Compare Two Versions
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("bumper")}
                        className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${activeTab === "bumper"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Bump &amp; Release Calculator
                    </button>
                </div>

                {activeTab === "comparator" && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mr-1 hidden sm:inline">
                            Presets:
                        </span>
                        <button
                            type="button"
                            onClick={() => applyPreset("standard")}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                        >
                            Patch Diff
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("prerelease")}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                        >
                            Pre-Release
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("breaking")}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                        >
                            Major Step
                        </button>
                    </div>
                )}
            </div>

            {/* 12-Column Responsive Workspace Grid */}
            {activeTab === "comparator" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                    {/* Left Column: Dual Version Inputs & AST Anatomy (Col Span 6) */}
                    <div className="lg:col-span-6 space-y-6 min-w-0">
                        {/* Version A Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                        A
                                    </div>
                                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                        Base / Reference Version
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setVersionA("")}
                                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                >
                                    Clear
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor={verAId}
                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                                >
                                    Enter SemVer String A:
                                </label>
                                <div className="relative">
                                    <input
                                        id={verAId}
                                        type="text"
                                        aria-label="SemVer string A input"
                                        value={versionA}
                                        onChange={(e) => setVersionA(e.target.value)}
                                        placeholder="e.g. 1.0.0-rc.1+build.12"
                                        className={`w-full px-4 py-3 text-sm font-mono rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none transition ${parsedA.isValid
                                                ? "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                                                : "border-rose-300 dark:border-rose-800 focus:ring-2 focus:ring-rose-500"
                                            }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {parsedA.isValid ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                        )}
                                    </div>
                                </div>
                                {!parsedA.isValid && versionA.trim() && (
                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                        {parsedA.error}
                                    </p>
                                )}
                            </div>

                            {/* Version A Decomposition Badges */}
                            {parsedA.isValid && (
                                <div className="grid grid-cols-5 gap-2 pt-2 text-center font-mono">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Major
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {parsedA.major}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Minor
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {parsedA.minor}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Patch
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {parsedA.patch}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-1 truncate">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Pre
                                        </span>
                                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate block">
                                            {parsedA.prerelease || "None"}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-1 truncate">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Build
                                        </span>
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate block">
                                            {parsedA.build || "None"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Version B Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                        B
                                    </div>
                                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                        Target / Comparison Version
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setVersionB("")}
                                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                >
                                    Clear
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor={verBId}
                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                                >
                                    Enter SemVer String B:
                                </label>
                                <div className="relative">
                                    <input
                                        id={verBId}
                                        type="text"
                                        aria-label="SemVer string B input"
                                        value={versionB}
                                        onChange={(e) => setVersionB(e.target.value)}
                                        placeholder="e.g. 1.0.1"
                                        className={`w-full px-4 py-3 text-sm font-mono rounded-xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none transition ${parsedB.isValid
                                                ? "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                                                : "border-rose-300 dark:border-rose-800 focus:ring-2 focus:ring-rose-500"
                                            }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {parsedB.isValid ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                        )}
                                    </div>
                                </div>
                                {!parsedB.isValid && versionB.trim() && (
                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                        {parsedB.error}
                                    </p>
                                )}
                            </div>

                            {/* Version B Decomposition Badges */}
                            {parsedB.isValid && (
                                <div className="grid grid-cols-5 gap-2 pt-2 text-center font-mono">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Major
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {parsedB.major}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Minor
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {parsedB.minor}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Patch
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {parsedB.patch}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-1 truncate">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Pre
                                        </span>
                                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate block">
                                            {parsedB.prerelease || "None"}
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-1 truncate">
                                        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                            Build
                                        </span>
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate block">
                                            {parsedB.build || "None"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Comparative Evaluation Engine (Col Span 6) */}
                    <div className="lg:col-span-6 space-y-6 min-w-0">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Precedence Verdict &amp; Diff
                                </h2>
                                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    SemVer 2.0.0 Spec
                                </span>
                            </div>

                            {/* Status Banner */}
                            <div
                                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${comparisonResult.status === "invalid"
                                        ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
                                        : comparisonResult.status === "equal"
                                            ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                                            : "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800"
                                    }`}
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        {comparisonResult.status === "invalid" ? (
                                            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                        ) : (
                                            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        )}
                                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                                            {comparisonResult.text}
                                        </p>
                                    </div>
                                    {comparisonResult.description && (
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                            {comparisonResult.description}
                                        </p>
                                    )}
                                </div>

                                {/* Mathematical Diff Indicator */}
                                {comparisonResult.status !== "invalid" && (
                                    <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold shrink-0 self-end sm:self-center">
                                        Operator:{" "}
                                        <span className="text-indigo-600 dark:text-indigo-400">
                                            {comparisonResult.diff === 0
                                                ? "A == B"
                                                : comparisonResult.diff > 0
                                                    ? "A > B"
                                                    : "A < B"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Release Boundary Difference Breakdown */}
                            {diffCategory && (
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                            Dominant Boundary Difference:
                                        </span>
                                        <span
                                            className={`text-xs font-black px-2.5 py-0.5 rounded-md ${diffCategory.level === "MAJOR"
                                                    ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                                    : diffCategory.level === "MINOR"
                                                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                                                        : diffCategory.level === "PATCH"
                                                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                }`}
                                        >
                                            {diffCategory.level}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                                        {diffCategory.summary}
                                    </p>

                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                                        <span>SemVer Conformance Impact:</span>
                                        <strong className="text-slate-900 dark:text-white">
                                            {diffCategory.impact}
                                        </strong>
                                    </div>
                                </div>
                            )}

                            {/* Range Satisfiability Simulator */}
                            {parsedA.isValid && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                                        NPM Range Matching Rules for Version A ({parsedA.raw}):
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                                            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                                                <span>Caret Range (^)</span>
                                                <span>^{parsedA.major}.{parsedA.minor}.{parsedA.patch}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans">
                                                Allows patches and minor releases: &gt;={parsedA.major}.{parsedA.minor}.{parsedA.patch} &lt;{parsedA.major + 1}.0.0
                                            </p>
                                        </div>

                                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                                            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                                                <span>Tilde Range (~)</span>
                                                <span>~{parsedA.major}.{parsedA.minor}.{parsedA.patch}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans">
                                                Allows patch releases only: &gt;={parsedA.major}.{parsedA.minor}.{parsedA.patch} &lt;{parsedA.major}.{parsedA.minor + 1}.0
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const temp = versionA;
                                        setVersionA(versionB);
                                        setVersionB(temp);
                                    }}
                                    className="flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Swap A &amp; B
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVersionA("1.0.0");
                                        setVersionB("1.0.0");
                                    }}
                                    className="py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Bumper / Calculator Workspace (Col Span 6 / 6) */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                    {/* Left Column: Version Configurator & Constructor (Col Span 6) */}
                    <div className="lg:col-span-6 space-y-6 min-w-0">
                        {/* Quick Bump Source Input */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Base Release Version
                                </h2>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    Current Target
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label
                                        htmlFor={bumpInputId}
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Current Production Release:
                                    </label>
                                    <input
                                        id={bumpInputId}
                                        type="text"
                                        aria-label="Current base semver input"
                                        value={bumpBaseVersion}
                                        onChange={(e) => setBumpBaseVersion(e.target.value)}
                                        placeholder="e.g. 1.2.3"
                                        className="w-full px-4 py-2.5 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                    />
                                    {!parsedBump.isValid && bumpBaseVersion.trim() && (
                                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                                            {parsedBump.error}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor={preId}
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Prerelease Identifier Tag:
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {["alpha", "beta", "rc", "next"].map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setPrereleaseId(tag)}
                                                className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition cursor-pointer ${prereleaseId === tag
                                                        ? "bg-indigo-600 text-white border-indigo-600"
                                                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        id={preId}
                                        type="text"
                                        aria-label="Custom prerelease identifier"
                                        value={prereleaseId}
                                        onChange={(e) => setPrereleaseId(e.target.value)}
                                        placeholder="Custom prerelease tag (e.g. preview)"
                                        className="mt-2 w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Custom Interactive Component Assembler */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Split className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Manual SemVer Assembler
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomMajor(1);
                                        setCustomMinor(0);
                                        setCustomPatch(0);
                                        setCustomPre("");
                                        setCustomBuild("");
                                    }}
                                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer"
                                >
                                    Reset To 1.0.0
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label
                                        htmlFor={majorInputId}
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Major (X.0.0)
                                    </label>
                                    <input
                                        id={majorInputId}
                                        type="number"
                                        min={0}
                                        aria-label="Custom major version input"
                                        value={customMajor}
                                        onChange={(e) => handleNumberInput(e, setCustomMajor)}
                                        className="w-full px-3 py-2 text-sm font-mono text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor={minorInputId}
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Minor (0.Y.0)
                                    </label>
                                    <input
                                        id={minorInputId}
                                        type="number"
                                        min={0}
                                        aria-label="Custom minor version input"
                                        value={customMinor}
                                        onChange={(e) => handleNumberInput(e, setCustomMinor)}
                                        className="w-full px-3 py-2 text-sm font-mono text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor={patchInputId}
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Patch (0.0.Z)
                                    </label>
                                    <input
                                        id={patchInputId}
                                        type="number"
                                        min={0}
                                        aria-label="Custom patch version input"
                                        value={customPatch}
                                        onChange={(e) => handleNumberInput(e, setCustomPatch)}
                                        className="w-full px-3 py-2 text-sm font-mono text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label
                                        htmlFor={customPreId}
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Prerelease (Optional)
                                    </label>
                                    <input
                                        id={customPreId}
                                        type="text"
                                        aria-label="Custom prerelease string"
                                        value={customPre}
                                        onChange={(e) => setCustomPre(e.target.value)}
                                        placeholder="e.g. rc.3"
                                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor={customBuildId}
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Build Metadata (Optional)
                                    </label>
                                    <input
                                        id={customBuildId}
                                        type="text"
                                        aria-label="Custom build metadata"
                                        value={customBuild}
                                        onChange={(e) => setCustomBuild(e.target.value)}
                                        placeholder="e.g. sha.8f9b2c"
                                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block">
                                        Synthesized Version String:
                                    </span>
                                    <code className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                        {customConstructedString}
                                    </code>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(customConstructedString, "constructed")}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer flex items-center gap-1.5"
                                >
                                    {copiedKey === "constructed" ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Calculated Next Releases (Col Span 6) */}
                    <div className="lg:col-span-6 space-y-6 min-w-0">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Computed Next Releases
                                </h2>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    Ready to deploy
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {calculatedBumps.map((b) => (
                                    <div
                                        key={b.type}
                                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
                                    >
                                        <div className="min-w-0 space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {b.title}
                                                </span>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                                    {b.type}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                                {b.desc}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <code className="text-xs sm:text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                                {b.val}
                                            </code>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(b.val, b.type)}
                                                aria-label={`Copy bumped version ${b.val}`}
                                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                                            >
                                                {copiedKey === b.type ? (
                                                    <Check className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* NPM Command Snippet Generator */}
                            <div className="pt-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                                    Execute Direct NPM Release Command:
                                </label>
                                <div className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-indigo-300 border border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
                                    <span>npm version patch -m &quot;Upgrade release to %s&quot;</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleCopy(
                                                'npm version patch -m "Upgrade release to %s"',
                                                "npm-cmd"
                                            )
                                        }
                                        className="p-1 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                                        aria-label="Copy npm command"
                                    >
                                        {copiedKey === "npm-cmd" ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Deep Specification & Precedence Rules */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Architecture of SemVer 2.0.0: Precedence, Prereleases, and Build Metadata
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Semantic Versioning (SemVer) establishes a deterministic contract between software authors and consumers. Governed by the official SemVer 2.0.0 standard created by Tom Preston-Werner, version strings follow an exact grammar composed of major, minor, patch, optional prerelease, and optional build metadata identifiers. Understanding this internal mechanics ensures reliable continuous delivery pipelines and dependency resolution.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <GitCommit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Major Bumps (X.0.0)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Incremented when incompatible API modifications or breaking changes are introduced. When Major is 0 (e.g., 0.1.0), the software is considered initial development; anything may change at any time without notice.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Minor Bumps (0.Y.0)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Incremented when functionality is added in a backwards-compatible manner or when substantial internal modules are marked for deprecation without removing public interfaces.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Patch Bumps (0.0.Z)
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Incremented when backwards-compatible bug fixes, security patches, or maintenance corrections are made without altering existing functional contracts.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Clause 10 &amp; 11: The Build Metadata vs Prerelease Paradox
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Engineers frequently encounter unexpected behavior when comparing releases containing git commit hashes or timestamps. SemVer spec clause 10 dictates that build metadata (<code className="font-mono text-indigo-300">+20240915</code>) must be completely omitted when calculating version precedence:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`// Build metadata does NOT impact precedence:
1.0.0+build.1 == 1.0.0+build.9999 (Equivalent precedence)

// Prerelease tags DO impact precedence:
1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-rc.1 < 1.0.0 (Normal release wins)`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Dependency Range Resolvers: Caret (^), Tilde (~), and Wildcard Operators
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        In modern package managers such as npm, Yarn, PNPM, and Cargo, package definitions utilize prefix operators to establish acceptable release ranges during automated resolution. Here is how ranges evaluate against SemVer releases:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Operator</th>
                                    <th className="p-3">Manifest Example</th>
                                    <th className="p-3">Resolved Boundary Range</th>
                                    <th className="p-3">Breaking Risk</th>
                                    <th className="p-3">Recommended Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Caret (^)</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">^1.4.2</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">&gt;= 1.4.2 &lt; 2.0.0</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Very Low</td>
                                    <td className="p-3 text-xs">Standard libraries, framework packages, web utilities</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Tilde (~)</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">~1.4.2</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">&gt;= 1.4.2 &lt; 1.5.0</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Minimal</td>
                                    <td className="p-3 text-xs">Production runtime services requiring conservative updates</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Wildcard (*)</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">1.x or *</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">Any valid release match</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">Extremely High</td>
                                    <td className="p-3 text-xs">Not recommended for enterprise production dependencies</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Exact Version</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">1.4.2</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">=== 1.4.2</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Zero</td>
                                    <td className="p-3 text-xs">Mission-critical banking, aerospace, and medical software</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for Release Engineering */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Automated Release Engineering: Conventional Commits &amp; CI/CD Workflows
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Eliminating human error in version bumps requires coupling Semantic Versioning with structured git commit conventions. By standardizing commit messages, tools like Semantic Release and Changesets compute release bumps automatically:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Commit Type Mapping Rules
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>fix(...)</strong>: Triggers automated <strong>PATCH</strong> bump. Fixes an existing regression or defect.
                                </li>
                                <li>
                                    • <strong>feat(...)</strong>: Triggers automated <strong>MINOR</strong> bump. Introduces backward-compatible new capabilities.
                                </li>
                                <li>
                                    • <strong>BREAKING CHANGE</strong> or <strong>feat!:</strong> Triggers automated <strong>MAJOR</strong> bump regardless of scope.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Anti-Patterns to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Sneaking Breaking Changes into Minors:</strong> Removing deprecated functions before a major bump breaks downstream lockfiles.
                                </li>
                                <li>
                                    • <strong>Relying on Leading Zero in Production:</strong> Staying on 0.x.x indefinitely confuses consumer dependency updaters like Dependabot.
                                </li>
                                <li>
                                    • <strong>Overwriting Published Tags:</strong> Never force-push or re-release an existing git tag or npm version; always roll forward.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Static FAQ Section */}
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
                                What is Semantic Versioning (SemVer 2.0.0)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Semantic Versioning is a formal specification that dictates how software version numbers are assigned and incremented. It uses a three-part format: MAJOR.MINOR.PATCH, where MAJOR signals breaking API changes, MINOR signifies backward-compatible feature additions, and PATCH designates backward-compatible bug fixes.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why is build metadata ignored in SemVer precedence comparisons?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                According to SemVer 2.0.0 clause 10, build metadata (indicated by a plus &apos;+&apos; sign and following characters) denotes build configurations, commit hashes, or compiler timestamps. Two versions that differ solely by build metadata have identical precedence ranking and do not trigger version upgrades.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does SemVer compare prerelease tags like alpha, beta, and rc?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A prerelease version always possesses lower precedence than its associated normal release. When comparing two prereleases, identifiers separated by dots are compared from left to right: numeric identifiers are compared numerically, and lexical identifiers are compared in ASCII sort order.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between caret (^) and tilde (~) in package.json?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Tilde (~1.2.3) permits patch updates (&gt;=1.2.3 &lt;1.3.0), whereas Caret (^1.2.3) permits both minor and patch updates without breaking major changes (&gt;=1.2.3 &lt;2.0.0), provided the major version is non-zero.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this SemVer calculator transmit package or repository data to any server?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. All parsing, validation, comparison, and version bump calculations occur entirely client-side in your web browser. No version strings, package configurations, or telemetry data are dispatched across the network.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}