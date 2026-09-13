"use client";

import React, { useState, useMemo, useId } from "react";
import {
    CheckSquare,
    Square,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Code2,
    BarChart3,
    Terminal,
    Layers,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    Sliders,
    Zap,
    Download,
    Eye,
    Percent,
    ListTodo,
    ShieldAlert,
    Trash2,
    RefreshCw
} from "lucide-react";

type BarStyle = "blocks" | "smooth" | "dots" | "hashes" | "ascii" | "gradient";

interface PresetSample {
    name: string;
    description: string;
    markdown: string;
}

const SAMPLE_MARKDOWNS: Record<string, PresetSample> = {
    releaseSprint: {
        name: "Sprint Roadmap",
        description: "Standard agile release milestone tracker",
        markdown: `## Release v2.4.0 Milestone

- [x] Configure OAuth2 authentication provider endpoints
- [x] Implement Redis rate-limiting middleware for API gateways
- [x] Refactor PostgreSQL indexed queries for workspace metrics
- [x] Migrate client cache layer to TanStack Query v5
- [ ] Add end-to-end integration test suite with Playwright
- [ ] Conduct security penetration audits for API webhooks
- [ ] Optimize Docker multi-stage container build image sizes
- [ ] Deploy production release artifacts to Kubernetes cluster
- [ ] Configure Datadog synthetic latency monitoring monitors
- [ ] Publish developer documentation and API release notes`
    },
    dailyStandup: {
        name: "Feature Checklist",
        description: "Frontend components and unit tests checklist",
        markdown: `### Core Feature Implementation

* [x] Design responsive workspace layout in Tailwind CSS
* [x] Add dynamic ASCII and Unicode progress bar generators
* [x] Build live interactive checklist preview with toggles
* [x] Support GitHub, GitLab, and Linear Markdown syntax
* [ ] Generate SVG dynamic badge embedding URLs
* [ ] Validate accessibility compliance and ARIA attributes`
    },
    nestedProject: {
        name: "Nested Hierarchy",
        description: "Multi-level parent and sub-task checklists",
        markdown: `# Infrastructure Overhaul

- [x] Database Migration Phase
  - [x] Snapshot existing RDS databases
  - [x] Run schema change scripts
  - [ ] Verify foreign key constraints
- [ ] Frontend Modernization
  - [x] Upgrade Next.js to 15.x
  - [ ] Implement Server Actions
  - [ ] Verify WCAG AA color contrast`
    }
};

const BAR_STYLES: Record<BarStyle, { name: string; filled: string; empty: string; sampleLength: number }> = {
    blocks: { name: "Filled Blocks", filled: "█", empty: "░", sampleLength: 10 },
    smooth: { name: "Smooth Solid", filled: "■", empty: "□", sampleLength: 10 },
    hashes: { name: "Hash Brackets", filled: "#", empty: "-", sampleLength: 10 },
    dots: { name: "Circle Beads", filled: "●", empty: "○", sampleLength: 10 },
    ascii: { name: "ASCII Equal", filled: "=", empty: " ", sampleLength: 10 },
    gradient: { name: "Braille Shade", filled: "⣿", empty: "⣀", sampleLength: 10 }
};

export default function MarkdownProgressCalculator() {
    const [rawMarkdown, setRawMarkdown] = useState<string>(SAMPLE_MARKDOWNS.releaseSprint.markdown);
    const [barLength, setBarLength] = useState<number>(20);
    const [barStyle, setBarStyle] = useState<BarStyle>("blocks");
    const [showPercentage, setShowPercentage] = useState<boolean>(true);
    const [showRatio, setShowRatio] = useState<boolean>(true);
    const [bracketStyle, setBracketStyle] = useState<"square" | "round" | "pipes" | "none">("square");
    const [prependTitle, setPrependTitle] = useState<boolean>(true);
    const [titleText, setTitleText] = useState<string>("Progress");
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

    const rawInputId = useId();
    const barLengthId = useId();
    const customTitleId = useId();

    // Parse checklist items
    const parsedData = useMemo(() => {
        if (!rawMarkdown) {
            return { total: 0, completed: 0, pending: 0, percentage: 0, items: [] };
        }

        const lines = rawMarkdown.split(/\r?\n/);
        // Supports "- [ ]", "- [x]", "- [X]", "* [ ]", "* [x]", "+ [ ]", "+ [x]", and nested indentation
        const taskRegex = /^(\s*[-*+]\s*\[)([ xX])(\]\s+)(.*)$/;

        let completed = 0;
        let pending = 0;
        const items: { lineIndex: number; text: string; isChecked: boolean; indentLevel: number }[] = [];

        lines.forEach((line, index) => {
            const match = line.match(taskRegex);
            if (match) {
                const isChecked = match[2].toLowerCase() === "x";
                if (isChecked) completed++;
                else pending++;

                const leadingSpaces = match[1].search(/\S/);
                const indentLevel = leadingSpaces > 0 ? Math.floor(leadingSpaces / 2) : 0;

                items.push({
                    lineIndex: index,
                    text: match[4].trim(),
                    isChecked,
                    indentLevel
                });
            }
        });

        const total = completed + pending;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, pending, percentage, items };
    }, [rawMarkdown]);

    // Handle number input cleanly without stuck leading zeros
    const handleBarLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setBarLength(5);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        if (isNaN(num)) {
            setBarLength(5);
        } else {
            // Keep length clamped between 5 and 50 for layout sanity
            const clamped = Math.min(Math.max(num, 5), 50);
            setBarLength(clamped);
        }
    };

    // Toggle checklist checkbox directly inside markdown
    const handleToggleItem = (targetLineIndex: number) => {
        const lines = rawMarkdown.split(/\r?\n/);
        const taskRegex = /^(\s*[-*+]\s*\[)([ xX])(\]\s+.*)$/;

        if (lines[targetLineIndex] && taskRegex.test(lines[targetLineIndex])) {
            lines[targetLineIndex] = lines[targetLineIndex].replace(taskRegex, (full, pre, check, post) => {
                const nextCheck = check.toLowerCase() === "x" ? " " : "x";
                return `${pre}${nextCheck}${post}`;
            });
            setRawMarkdown(lines.join("\n"));
        }
    };

    // Interactive bulk mark actions
    const handleBulkCheck = (checkAll: boolean) => {
        const lines = rawMarkdown.split(/\r?\n/);
        const taskRegex = /^(\s*[-*+]\s*\[)([ xX])(\]\s+.*)$/;
        const updated = lines.map((line) => {
            if (taskRegex.test(line)) {
                return line.replace(taskRegex, `$1${checkAll ? "x" : " "}$3`);
            }
            return line;
        });
        setRawMarkdown(updated.join("\n"));
    };

    // Generate plain Unicode progress bar string
    const generatedProgressBar = useMemo(() => {
        const totalSteps = barLength;
        const ratio = parsedData.total > 0 ? parsedData.completed / parsedData.total : 0;
        const filledSteps = Math.round(ratio * totalSteps);
        const emptySteps = Math.max(0, totalSteps - filledSteps);

        const activeStyle = BAR_STYLES[barStyle];
        const barCore = activeStyle.filled.repeat(filledSteps) + activeStyle.empty.repeat(emptySteps);

        let leftBracket = "";
        let rightBracket = "";
        if (bracketStyle === "square") {
            leftBracket = "[";
            rightBracket = "]";
        } else if (bracketStyle === "round") {
            leftBracket = "(";
            rightBracket = ")";
        } else if (bracketStyle === "pipes") {
            leftBracket = "|";
            rightBracket = "|";
        }

        const titlePrefix = prependTitle && titleText.trim() ? `${titleText.trim()}: ` : "";
        const percentSuffix = showPercentage ? ` ${parsedData.percentage}%` : "";
        const ratioSuffix = showRatio ? ` (${parsedData.completed}/${parsedData.total})` : "";

        return `${titlePrefix}${leftBracket}${barCore}${rightBracket}${percentSuffix}${ratioSuffix}`.trim();
    }, [parsedData, barLength, barStyle, bracketStyle, prependTitle, titleText, showPercentage, showRatio]);

    // Generate output variants
    const markdownFormattedOutput = useMemo(() => {
        return `\`${generatedProgressBar}\``;
    }, [generatedProgressBar]);

    const shieldsBadgeUrl = useMemo(() => {
        const titleSafe = encodeURIComponent(titleText.trim() || "Progress");
        const valSafe = encodeURIComponent(`${parsedData.percentage}%`);
        let color = "red";
        if (parsedData.percentage >= 100) color = "brightgreen";
        else if (parsedData.percentage >= 75) color = "green";
        else if (parsedData.percentage >= 50) color = "yellow";
        else if (parsedData.percentage >= 25) color = "orange";

        return `https://img.shields.io/badge/${titleSafe}-${valSafe}-${color}?style=flat-square`;
    }, [parsedData.percentage, titleText]);

    const htmlProgressSnippet = useMemo(() => {
        return `<progress value="${parsedData.completed}" max="${parsedData.total || 100}"></progress> <span>${parsedData.percentage}%</span>`;
    }, [parsedData]);

    const handleCopy = (text: string, formatId: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedFormat(formatId);
        setTimeout(() => setCopiedFormat(null), 2000);
    };

    const handleClear = () => {
        setRawMarkdown("");
    };

    const loadSample = (key: string) => {
        if (SAMPLE_MARKDOWNS[key]) {
            setRawMarkdown(SAMPLE_MARKDOWNS[key].markdown);
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Markdown Checklist to Linear Progress Bar Calculator",
        "url": "https://twistertools.com/tools/developer-tools/markdown-progress-calculator",
        "description": "Convert GitHub and GitLab Markdown task lists into ASCII/Unicode linear progress bars, shields badges, and real-time completion metrics instantly.",
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
                "name": "How does the Markdown Checklist Parser calculate task completion?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The calculator parses standard CommonMark task list syntax including hyphens, asterisks, and plus signs followed by brackets: '- [ ]' for pending tasks and '- [x]' or '- [X]' for finished items. It computes the mathematical ratio of checked items against total items, normalizing the progress percentage into custom Unicode linear bars."
                }
            },
            {
                "@type": "Question",
                "name": "Can I paste nested checklists with sub-tasks?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Indented sub-checklists are automatically recognized and parsed. The interactive tree displays sub-items with clear visual hierarchy, allowing engineers to check off nested tasks or toggle top-level items."
                }
            },
            {
                "@type": "Question",
                "name": "Will the generated Unicode progress bars render cleanly inside GitHub README.md files?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. By wrapping the output inside inline code backticks or code blocks, the monospaced Unicode characters (such as solid blocks █ and light shade blocks ░) render with uniform character width on GitHub, GitLab, Bitbucket, Linear, Notion, and Discord."
                }
            },
            {
                "@type": "Question",
                "name": "Is my proprietary checklist or codebase data sent to any backend servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools executes all Markdown parsing, regular expression matching, and Unicode rendering entirely client-side inside your browser engine. Zero text is transmitted across the network, ensuring private roadmaps and sprint tasks remain strictly confidential."
                }
            },
            {
                "@type": "Question",
                "name": "Can I embed the Shields.io dynamic SVG badge in my documentation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The tool automatically synthesizes clean Markdown and HTML image badge tags pointing to Shields.io, dynamically color-coded from bright red (0%) through yellow (50%) to bright green (100%)."
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

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Input & Interactive Checklist (Column Span 6) */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ListTodo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Markdown Checklist
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => loadSample("releaseSprint")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Sprint
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("dailyStandup")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Feature
                            </button>
                            <button
                                type="button"
                                onClick={() => loadSample("nestedProject")}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Nested
                            </button>
                        </div>
                    </div>

                    {/* Markdown Textarea */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor={rawInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Paste CommonMark Checklist (- [ ] or - [x]):
                            </label>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                {parsedData.total} Tasks Detected
                            </span>
                        </div>
                        <textarea
                            id={rawInputId}
                            rows={9}
                            aria-label="Markdown checklist raw input"
                            value={rawMarkdown}
                            onChange={(e) => setRawMarkdown(e.target.value)}
                            placeholder="- [x] Finished item&#10;- [ ] Pending item..."
                            className="w-full p-3.5 sm:p-4 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed transition resize-y min-h-[190px]"
                        />

                        {/* Fast Input Actions */}
                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => handleBulkCheck(true)}
                                className="py-2 px-2.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer flex items-center justify-center gap-1"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Check All
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkCheck(false)}
                                className="py-2 px-2.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition cursor-pointer flex items-center justify-center gap-1"
                            >
                                <Square className="w-3.5 h-3.5" /> Uncheck All
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="py-2 px-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer flex items-center justify-center gap-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear
                            </button>
                        </div>
                    </div>

                    {/* Real-time Interactive Checklist Item Toggles */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Interactive Task Preview
                            </span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-300">
                                Click any item to sync Markdown
                            </span>
                        </div>

                        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-950/70 space-y-1.5">
                            {parsedData.items.length === 0 ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic p-3 text-center">
                                    No task checklist recognized. Type lines like <code>- [ ] Task name</code> above.
                                </p>
                            ) : (
                                parsedData.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleToggleItem(item.lineIndex)}
                                        style={{ marginLeft: `${item.indentLevel * 14}px` }}
                                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer select-none transition ${item.isChecked
                                                ? "bg-emerald-500/10 border-emerald-500/25 text-slate-800 dark:text-slate-200 line-through opacity-80"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-indigo-300"
                                            }`}
                                    >
                                        {item.isChecked ? (
                                            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        ) : (
                                            <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                                        )}
                                        <span className="font-mono truncate">{item.text}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Output, Customization & Badges (Column Span 6) */}
                <div className="lg:col-span-6 space-y-6 min-w-0">
                    {/* Live Progress Display Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Linear Progress Visualizer
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                Live Output
                            </span>
                        </div>

                        {/* Metric Summary Counters */}
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Completed
                                </span>
                                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    {parsedData.completed}{" "}
                                    <span className="text-xs text-slate-600 dark:text-slate-300 font-normal">
                                        / {parsedData.total}
                                    </span>
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Pending
                                </span>
                                <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                                    {parsedData.pending}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Total Progress
                                </span>
                                <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {parsedData.percentage}%
                                </p>
                            </div>
                        </div>

                        {/* Browser Visual HTML Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <span>Native Progress</span>
                                <span className="font-mono">{parsedData.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                                <div
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${parsedData.percentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Generated Unicode Monospace Output Box */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Terminal className="w-4 h-4 text-indigo-600" />
                                    Rendered Markdown String:
                                </label>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(generatedProgressBar, "plain")}
                                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    {copiedFormat === "plain" ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" /> Copy String
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs sm:text-sm break-all border border-slate-800 shadow-inner">
                                {generatedProgressBar || "Progress bar preview..."}
                            </div>
                        </div>

                        {/* Formatting Controls Grid */}
                        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        htmlFor={barLengthId}
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Bar Length (Characters):
                                    </label>
                                    <input
                                        id={barLengthId}
                                        type="number"
                                        min={5}
                                        max={50}
                                        value={barLength}
                                        onChange={handleBarLengthChange}
                                        aria-label="Progress bar character length"
                                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor={customTitleId}
                                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                                    >
                                        Label Prefix:
                                    </label>
                                    <input
                                        id={customTitleId}
                                        type="text"
                                        value={titleText}
                                        onChange={(e) => setTitleText(e.target.value)}
                                        aria-label="Progress bar title prefix"
                                        placeholder="Progress"
                                        className="w-full px-3 py-1.5 text-xs font-sans rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            {/* Style Selector Buttons */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                    Glyph Character Set:
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.keys(BAR_STYLES) as BarStyle[]).map((styleKey) => {
                                        const style = BAR_STYLES[styleKey];
                                        const isActive = barStyle === styleKey;
                                        return (
                                            <button
                                                key={styleKey}
                                                type="button"
                                                onClick={() => setBarStyle(styleKey)}
                                                className={`p-2 rounded-xl border text-xs transition cursor-pointer text-left ${isActive
                                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    }`}
                                            >
                                                <div className="font-bold text-[11px] truncate">{style.name}</div>
                                                <div className="font-mono text-xs mt-0.5 text-indigo-600 dark:text-indigo-400">
                                                    {style.filled.repeat(4)}
                                                    {style.empty.repeat(2)}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={showPercentage}
                                        onChange={(e) => setShowPercentage(e.target.checked)}
                                        aria-label="Toggle percentage suffix"
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Show Percentage (%)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={showRatio}
                                        onChange={(e) => setShowRatio(e.target.checked)}
                                        aria-label="Toggle completed ratio suffix"
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Show Ratio (x/y)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={prependTitle}
                                        onChange={(e) => setPrependTitle(e.target.checked)}
                                        aria-label="Toggle title prefix"
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Prepend Title Tag</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="bracket-select" className="text-slate-600 dark:text-slate-300">
                                        Brackets:
                                    </label>
                                    <select
                                        id="bracket-select"
                                        value={bracketStyle}
                                        onChange={(e) =>
                                            setBracketStyle(e.target.value as "square" | "round" | "pipes" | "none")
                                        }
                                        aria-label="Select bracket enclosing style"
                                        className="text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                                    >
                                        <option value="square">[ ] Square</option>
                                        <option value="round">( ) Round</option>
                                        <option value="pipes">| | Pipes</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Multi-Format Clipboard Export Section */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                Quick Export Formats:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleCopy(markdownFormattedOutput, "md")}
                                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition cursor-pointer"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Code2 className="w-3.5 h-3.5 text-indigo-600" /> Inline Code (`...`)
                                    </span>
                                    {copiedFormat === "md" ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCopy(`![Progress](${shieldsBadgeUrl})`, "badge")
                                    }
                                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition cursor-pointer"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Shields.io Badge
                                    </span>
                                    {copiedFormat === "badge" ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Architecture & Task Parsing Mechanics */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Engineering CommonMark Task Parsing: From Syntax to Unicode Bars
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Markdown has become the ubiquitous documentation standard across software engineering ecosystems, powered by GitHub Flavored Markdown (GFM) and CommonMark specifications. However, while task checklists natively render as interactive checkboxes in GitHub issue descriptions and pull requests, README markdown files and external documentation platforms often fail to summarize sprint completion at a glance.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Regex Lexical Analysis
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The engine analyzes line-by-line syntax using boundary-tested regular expressions, identifying unordered list markers (<code>-</code>, <code>*</code>, <code>+</code>) coupled with enclosed whitespace or execution characters (<code>[ ]</code>, <code>[x]</code>, <code>[X]</code>).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Percent className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Normalized Metric Math
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Total recognized checklist entities are aggregated against marked boolean completions to yield an exact floating-point ratio, preventing division-by-zero anomalies when empty documents are supplied.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Monospace Unicode Mapping
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The integer percentage maps deterministically to a user-configured character width, concatenating full-block characters (<code>U+2588</code>) with shaded background glyphs (<code>U+2591</code>) for distortion-free monospaced alignment.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Real-World Markdown Task Pipeline
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Engineers can directly copy-paste this generated progress bar into project README.md headers or issue templates:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`# Project Roadmap v1.0
Progress: [██████████████░░░░░░] 70% (7/10)

### Current Deliverables
- [x] Set up CI/CD pipeline
- [x] Configure automated database migrations
- [ ] Implement multi-tenant authentication`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Progress Bar Glyphs & Cross-Platform Compatibility */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Character Sets: Choosing the Right Format
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Different development environments and text viewers treat unicode characters differently. Review this compatibility matrix to select the optimal glyph style for your destination platform:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Glyph Style</th>
                                    <th className="p-3">Character Structure</th>
                                    <th className="p-3">Markdown Code Wrapper</th>
                                    <th className="p-3">Platform Suitability</th>
                                    <th className="p-3">Recommended Usage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Solid Blocks (█/░)</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[████░░]</td>
                                    <td className="p-3 font-mono text-xs">Required (`...`)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">GitHub, GitLab, Obsidian</td>
                                    <td className="p-3 text-emerald-600 font-bold">Standard READMEs</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Hash Brackets (#/-)</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">[####----]</td>
                                    <td className="p-3 font-mono text-xs">Optional</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">CLI, Git Bash, Slack</td>
                                    <td className="p-3">Pure ASCII Terminals</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Shields.io SVG Badge</td>
                                    <td className="p-3 font-mono text-xs">Dynamic Vector SVG</td>
                                    <td className="p-3 font-mono text-xs">Markdown Image (![...])</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Universal Web Browsers</td>
                                    <td className="p-3 text-emerald-600 font-bold">Open Source Repositories</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Circle Beads (●/○)</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">(●●●○○)</td>
                                    <td className="p-3 font-mono text-xs">Not required</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Notion, Apple Notes, Discord</td>
                                    <td className="p-3">Minimalist Team Wikis</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for Project Roadmaps */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Engineering Best Practices for Markdown Documentation
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Maintaining clean and communicative task roadmaps speeds up open-source onboarding and provides immediate clarity for engineering stakeholders:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Guidelines
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Enclose Bars in Backticks:</strong> Always place your Unicode bar inside inline backticks (<code>`[████░░]`</code>) to force monospace font rendering across all browser themes and operating systems.
                                </li>
                                <li>
                                    • <strong>Include Explicit Ratios:</strong> Suffixing the bar with completed counts (e.g., <code>14/20</code>) provides concrete context alongside the generalized percentage.
                                </li>
                                <li>
                                    • <strong>Separate Milestones into Subheadings:</strong> Break major quarterly epics into independent H3 checklist blocks, calculating individual progress markers for each release phase.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-amber-600" /> Common Anti-Patterns
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Excessive Character Lengths:</strong> Setting progress bars over 30 characters can cause horizontal scrollbars on mobile GitHub viewports. 15 to 20 characters offers optimal responsiveness.
                                </li>
                                <li>
                                    • <strong>Mismatched Brackets in Custom Parsers:</strong> Ensure your checklist utilizes strict CommonMark task syntax without missing spaces between the brackets (<code>[ ]</code> not <code>[]</code>).
                                </li>
                                <li>
                                    • <strong>Relying on Dynamic Scripts in Private Repos:</strong> External hosted SVG badges may fail to render behind strict corporate proxy firewalls. Unicode text bars remain permanently visible without network requests.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Static FAQ Section */}
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
                                How does the Markdown Checklist Parser calculate task completion?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The calculator parses standard CommonMark task list syntax including hyphens, asterisks, and plus signs followed by brackets: &lsquo;- [ ]&rsquo; for pending tasks and &lsquo;- [x]&rsquo; or &lsquo;- [X]&rsquo; for finished items. It computes the mathematical ratio of checked items against total items, normalizing the progress percentage into custom Unicode linear bars.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I paste nested checklists with sub-tasks?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Indented sub-checklists are automatically recognized and parsed. The interactive tree displays sub-items with clear visual hierarchy, allowing engineers to check off nested tasks or toggle top-level items with instant bi-directional Markdown sync.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Will the generated Unicode progress bars render cleanly inside GitHub README.md files?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. By wrapping the output inside inline code backticks or code blocks, the monospaced Unicode characters (such as solid blocks █ and light shade blocks ░) render with uniform character width on GitHub, GitLab, Bitbucket, Linear, Notion, and Discord.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Is my proprietary checklist or codebase data sent to any backend servers?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. TwisterTools executes all Markdown parsing, regular expression matching, and Unicode rendering entirely client-side inside your browser engine. Zero text is transmitted across the network, ensuring private roadmaps and sprint tasks remain strictly confidential.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can I embed the Shields.io dynamic SVG badge in my documentation?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. The tool automatically synthesizes clean Markdown and HTML image badge tags pointing to Shields.io, dynamically color-coded from bright red (0%) through yellow (50%) to bright green (100%).
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}