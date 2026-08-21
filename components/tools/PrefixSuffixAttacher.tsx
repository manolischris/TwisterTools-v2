"use client";

import React, { useState, useMemo } from "react";
import {
    Type,
    Copy,
    Check,
    Trash2,
    Download,
    Info,
    HelpCircle,
    BookOpen,
    Sparkles,
    RefreshCw,
    FileText,
    Sliders,
    Layers,
    Code,
    ShieldCheck,
    CheckCircle2,
    ArrowRightLeft,
    Lightbulb,
    Zap,
    Cpu,
    ListOrdered,
    Database,
    Terminal,
    Globe
} from "lucide-react";

interface Preset {
    id: string;
    label: string;
    prefix: string;
    suffix: string;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "html-li", label: "HTML List Items", prefix: "<li>", suffix: "</li>", tag: "HTML" },
    { id: "sql-in", label: "SQL Quotes & Comma", prefix: "'", suffix: "',", tag: "SQL" },
    { id: "json-array", label: "JSON String Array", prefix: '  "', suffix: '",', tag: "JSON" },
    { id: "markdown-list", label: "Markdown Bullets", prefix: "- ", suffix: "", tag: "Markdown" },
    { id: "css-class", label: "CSS Selector Prefix", prefix: ".app-container ", suffix: " { display: block; }", tag: "CSS" },
];

export default function PrefixSuffixAttacher() {
    // Input & Tool States
    const [inputText, setInputText] = useState<string>(
        "alpha\nbeta\ngamma\ndelta\nepsilon"
    );
    const [prefix, setPrefix] = useState<string>("https://");
    const [suffix, setSuffix] = useState<string>(".com");

    // Options State
    const [ignoreEmptyLines, setIgnoreEmptyLines] = useState<boolean>(true);
    const [trimLines, setTrimLines] = useState<boolean>(true);
    const [addLineNumbers, setAddLineNumbers] = useState<boolean>(false);
    const [lineNumberStart, setLineNumberStart] = useState<number>(1);
    const [lineNumberSeparator, setLineNumberSeparator] = useState<string>(". ");

    // UI States
    const [copied, setCopied] = useState<boolean>(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    // Sanitize number inputs to prevent frozen '0' state
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
        setter(isNaN(num) ? 1 : num);
    };

    // Transformation Logic
    const transformedOutput = useMemo(() => {
        if (!inputText) return "";

        const lines = inputText.split("\n");
        let lineCounter = lineNumberStart;

        const processed = lines.map((line) => {
            let current = line;

            if (trimLines) {
                current = current.trim();
            }

            if (ignoreEmptyLines && current.length === 0) {
                return "";
            }

            let linePrefix = prefix;
            if (addLineNumbers) {
                linePrefix = `${lineCounter}${lineNumberSeparator}${prefix}`;
                lineCounter++;
            }

            return `${linePrefix}${current}${suffix}`;
        });

        if (ignoreEmptyLines) {
            return processed.filter((l, idx) => {
                // Keep non-empty or reflect original if not ignoring empty
                const orig = trimLines ? lines[idx].trim() : lines[idx];
                return orig.length > 0;
            }).join("\n");
        }

        return processed.join("\n");
    }, [
        inputText,
        prefix,
        suffix,
        ignoreEmptyLines,
        trimLines,
        addLineNumbers,
        lineNumberStart,
        lineNumberSeparator,
    ]);

    // Statistics
    const stats = useMemo(() => {
        const rawLines = inputText ? inputText.split("\n").length : 0;
        const outputLines = transformedOutput ? transformedOutput.split("\n").length : 0;
        const inputChars = inputText.length;
        const outputChars = transformedOutput.length;

        return {
            rawLines,
            outputLines,
            inputChars,
            outputChars,
            charsAdded: outputChars - inputChars,
        };
    }, [inputText, transformedOutput]);

    const handleCopy = () => {
        if (!transformedOutput) return;
        navigator.clipboard.writeText(transformedOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!transformedOutput) return;
        const blob = new Blob([transformedOutput], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "prefixed_suffixed_text.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setInputText("");
        setPrefix("");
        setSuffix("");
        setIgnoreEmptyLines(true);
        setTrimLines(true);
        setAddLineNumbers(false);
        setLineNumberStart(1);
        setLineNumberSeparator(". ");
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setPrefix(preset.prefix);
        setSuffix(preset.suffix);
        setActivePresetId(preset.id);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Prefix and Suffix Text Attacher",
        "url": "https://twistertools.com/tools/text-tools/prefix-suffix-attacher",
        "description": "Prepend and append custom text, tags, code syntax, or line numbers to each line of text instantly in your browser.",
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
                "name": "How does the Prefix and Suffix Text Attacher work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool parses input string data line-by-line using web browser memory. It evaluates configured boundary logic, appends the declared prefix string to line starts, appends the suffix string to line ends, and streams the modified string into the interactive editor instantly."
                }
            },
            {
                "@type": "Question",
                "name": "Is my text data safe and confidential?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. All computations, text parsing, and output renderings happen exclusively client-side inside your browser engine. Zero text inputs, source files, or transformed outputs are sent to external web servers or recorded in telemetry databases."
                }
            },
            {
                "@type": "Question",
                "name": "Can I automatically skip blank or whitespace-only lines?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, checking the 'Ignore Empty Lines' option filters out blank lines and whitespace rows, preventing empty lines from receiving prefixes and suffixes."
                }
            },
            {
                "@type": "Question",
                "name": "How do I format raw text for SQL IN () clauses using this tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Set the Prefix field to a single quote (') and the Suffix field to a single quote followed by a comma (',). Enable the Trim Line Whitespace toggle. Paste your raw IDs or list, then copy the result straight into your SQL query editor."
                }
            },
            {
                "@type": "Question",
                "name": "Can I add sequential line numbers with custom prefixes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Enabling 'Sequential Line Numbers' inserts incrementing numbers before your chosen prefix string, with customizable starting indices and delimiter symbols."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto flex flex-col gap-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Control Configuration Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" /> Configuration Options
                    </h2>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-rose-600 text-xs font-semibold transition border border-slate-200"
                        title="Reset all fields to defaults"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reset All
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Prefix (Attach to Start of Line)
                        </label>
                        <input
                            type="text"
                            value={prefix}
                            onChange={(e) => {
                                setPrefix(e.target.value);
                                setActivePresetId(null);
                            }}
                            placeholder="e.g. https:// or <li> or ' "
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Suffix (Attach to End of Line)
                        </label>
                        <input
                            type="text"
                            value={suffix}
                            onChange={(e) => {
                                setSuffix(e.target.value);
                                setActivePresetId(null);
                            }}
                            placeholder="e.g. .com or </li> or ', "
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                        />
                    </div>
                </div>

                {/* Preset Chips */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Syntax Presets
                        </span>
                        {activePresetId && (
                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                Preset Applied
                            </span>
                        )}
                    </div>
                    <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {PRESETS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => applyPreset(p)}
                                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${activePresetId === p.id
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                            >
                                <span>{p.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activePresetId === p.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                                    }`}>
                                    {p.tag}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Options Row */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={ignoreEmptyLines}
                            onChange={(e) => setIgnoreEmptyLines(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>Ignore Empty Lines</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={trimLines}
                            onChange={(e) => setTrimLines(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>Trim Line Whitespace</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={addLineNumbers}
                            onChange={(e) => setAddLineNumbers(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>Sequential Line Numbers</span>
                    </label>

                    {addLineNumbers && (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                value={lineNumberStart}
                                onChange={(e) => handleNumberInput(e, setLineNumberStart)}
                                className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                title="Start Number"
                            />
                            <input
                                type="text"
                                value={lineNumberSeparator}
                                onChange={(e) => setLineNumberSeparator(e.target.value)}
                                className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                title="Number Separator"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between h-[520px] min-w-0 p-4 sm:p-6">
                    <div className="flex flex-col h-full space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" /> Input Lines
                            </h2>
                            <button
                                onClick={() => setInputText("")}
                                className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear
                            </button>
                        </div>

                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste your lines of text here..."
                            className="w-full flex-1 p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50/50"
                        />

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span>Lines: <strong>{stats.rawLines}</strong></span>
                            <span>Characters: <strong>{stats.inputChars.toLocaleString()}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between h-[520px] min-w-0 p-4 sm:p-6">
                    <div className="flex flex-col h-full space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600" /> Transformed Output
                            </h2>
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                +{stats.charsAdded.toLocaleString()} Chars
                            </span>
                        </div>

                        <textarea
                            readOnly
                            value={transformedOutput}
                            placeholder="Transformed text will appear here instantly..."
                            className="w-full flex-1 p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-100/60"
                        />

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span>Output Lines: <strong>{stats.outputLines}</strong></span>
                            <span>Output Chars: <strong>{stats.outputChars.toLocaleString()}</strong></span>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy Output"}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export TXT
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT */}
            <div className="flex flex-col gap-6">

                {/* Card 1: Technical Overview & Definitions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Guide to Batch Line Prefixing & Suffixing
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <strong>Prefix and Suffix Text Attacher</strong> is a browser-native text transformation engine engineered to process unstructured line-separated records, code fragments, URL lists, and database rows. In computer science and textual data manipulation, a <strong>prefix</strong> represents a character sequence appended directly to the beginning of a string, whereas a <strong>suffix</strong> is attached to the tail end.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Batch string modification eliminates tedious manual cursor placement across thousands of lines. Whether you are generating structured JSON arrays, crafting SQL <code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-indigo-600 font-mono">IN (...)</code> queries, wrapping bulleted list items in semantic HTML tags (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-indigo-600 font-mono">&lt;li&gt;</code>), or appending protocol prefixes to raw domain lists, this utility executes full dataset mutations in real time without passing data through external servers.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600" /> Sub-Millisecond Execution
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Process multi-thousand line strings instantaneously leveraging native Web V8 string buffer allocations and regular expression boundary checks.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Client-Side Memory Isolation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                All inputs, intermediate buffers, and transformed lines exist purely inside your browser memory context for total enterprise privacy.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ListOrdered className="w-4 h-4 text-indigo-600" /> Granular Control Switches
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Fine-tune transformations using custom line-number offsets, whitespace trimming, and empty line skip logic.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Specifications & Feature Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Configuration Matrix & Operator Comparison
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To understand how each modifier switch alters raw input data, refer to the operational matrix below. Every setting can be combined with custom prefixes and suffixes for complex data formatting workflows:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Option Name</th>
                                    <th className="p-3">Default State</th>
                                    <th className="p-3">Operational Logic</th>
                                    <th className="p-3">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Ignore Empty Lines</td>
                                    <td className="p-3"><span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Enabled</span></td>
                                    <td className="p-3">Filters out zero-length strings and lines containing only whitespace characters prior to attaching strings.</td>
                                    <td className="p-3">Prevents orphan prefixes/suffixes on blank lines in copied lists.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Trim Line Whitespace</td>
                                    <td className="p-3"><span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Enabled</span></td>
                                    <td className="p-3">Executes <code className="bg-slate-200/60 px-1 rounded font-mono">String.prototype.trim()</code> on each line before prefix prepending and suffix appending.</td>
                                    <td className="p-3">Cleans messy text pasted from PDFs, spreadsheets, or log feeds.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Sequential Line Numbers</td>
                                    <td className="p-3"><span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Disabled</span></td>
                                    <td className="p-3">Appends an auto-incrementing integer index and customizable separator directly before the prefix value.</td>
                                    <td className="p-3">Generates ordered lists, code step references, or numbered logs.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Quick Syntax Presets</td>
                                    <td className="p-3"><span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Manual</span></td>
                                    <td className="p-3">One-click auto-population of preset prefixes and suffixes tailored for HTML, SQL, JSON, Markdown, or CSS.</td>
                                    <td className="p-3">Eliminates repetitive syntax typing for popular programming languages.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Detailed Practical Workflows & Code Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Industry Transformation Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how input data structures are modified across four standard software engineering and content workflows:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example 1: SQL IN Builder */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Database className="w-4 h-4 text-indigo-600" /> 1. SQL Query IN () Clause
                                </span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded">SQL</span>
                            </div>
                            <div className="text-xs space-y-2">
                                <p className="text-slate-600 font-medium">Input Raw Values:</p>
                                <pre className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-800">
                                    usr_019a{"\n"}usr_028b{"\n"}usr_037c
                                </pre>
                                <p className="text-slate-600 font-medium">Prefix: <code className="text-indigo-600 font-bold">'</code> | Suffix: <code className="text-indigo-600 font-bold">',</code></p>
                                <p className="text-slate-600 font-medium">Transformed Output:</p>
                                <pre className="bg-slate-900 p-2 rounded text-indigo-300 font-mono">
                                    'usr_019a',{"\n"}'usr_028b',{"\n"}'usr_037c',
                                </pre>
                            </div>
                        </div>

                        {/* Example 2: HTML List Wrapping */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-indigo-600" /> 2. HTML Semantic Markup
                                </span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded">HTML</span>
                            </div>
                            <div className="text-xs space-y-2">
                                <p className="text-slate-600 font-medium">Input Plain Text:</p>
                                <pre className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-800">
                                    Dashboard{"\n"}User Settings{"\n"}Billing Portal
                                </pre>
                                <p className="text-slate-600 font-medium">Prefix: <code className="text-indigo-600 font-bold">&lt;li&gt;</code> | Suffix: <code className="text-indigo-600 font-bold">&lt;/li&gt;</code></p>
                                <p className="text-slate-600 font-medium">Transformed Output:</p>
                                <pre className="bg-slate-900 p-2 rounded text-indigo-300 font-mono">
                                    &lt;li&gt;Dashboard&lt;/li&gt;{"\n"}&lt;li&gt;User Settings&lt;/li&gt;{"\n"}&lt;li&gt;Billing Portal&lt;/li&gt;
                                </pre>
                            </div>
                        </div>

                        {/* Example 3: URL Constructor */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-indigo-600" /> 3. Domain URL Normalization
                                </span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded">Web / SEO</span>
                            </div>
                            <div className="text-xs space-y-2">
                                <p className="text-slate-600 font-medium">Input Domain Names:</p>
                                <pre className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-800">
                                    twistertools{"\n"}google{"\n"}github
                                </pre>
                                <p className="text-slate-600 font-medium">Prefix: <code className="text-indigo-600 font-bold">https://</code> | Suffix: <code className="text-indigo-600 font-bold">.com</code></p>
                                <p className="text-slate-600 font-medium">Transformed Output:</p>
                                <pre className="bg-slate-900 p-2 rounded text-indigo-300 font-mono">
                                    https://twistertools.com{"\n"}https://google.com{"\n"}https://github.com
                                </pre>
                            </div>
                        </div>

                        {/* Example 4: JSON Array Construction */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-600" /> 4. JSON String Array Items
                                </span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded">JSON</span>
                            </div>
                            <div className="text-xs space-y-2">
                                <p className="text-slate-600 font-medium">Input Key List:</p>
                                <pre className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-800">
                                    auth_token{"\n"}session_id{"\n"}user_role
                                </pre>
                                <p className="text-slate-600 font-medium">Prefix: <code className="text-indigo-600 font-bold">  "</code> | Suffix: <code className="text-indigo-600 font-bold">",</code></p>
                                <p className="text-slate-600 font-medium">Transformed Output:</p>
                                <pre className="bg-slate-900 p-2 rounded text-indigo-300 font-mono">
                                    "auth_token",{"\n"}  "session_id",{"\n"}  "user_role",
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Usage Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Use the Prefix and Suffix Text Attacher
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">1</div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Paste Input Data</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Copy raw text, database rows, or list items directly into the left "Input Lines" textarea editor.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">2</div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Configure Modifiers</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Enter your target prefix and suffix strings or select one of the quick syntax preset chips.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">3</div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Toggle Formatting</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Select empty line filtering, whitespace trimming, or sequential line numbering options as needed.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">4</div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Copy or Export</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Click "Copy Output" to send transformed text to your clipboard or "Export TXT" to download a local file.
                            </p>
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
                                How does the Prefix and Suffix Text Attacher work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool parses input string data line-by-line using web browser memory. It evaluates configured boundary logic, appends the declared prefix string to line starts, appends the suffix string to line ends, and streams the modified string into the interactive editor instantly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my text data safe and confidential?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. All computations, text parsing, and output renderings happen exclusively client-side inside your browser engine. Zero text inputs, source files, or transformed outputs are sent to external web servers or recorded in telemetry databases.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I automatically skip blank or whitespace-only lines?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, checking the "Ignore Empty Lines" option filters out blank lines and whitespace rows, preventing empty lines from receiving prefixes and suffixes.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I format raw text for SQL IN () clauses using this tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Set the Prefix field to a single quote (<code className="font-mono bg-slate-200/60 px-1 rounded">'</code>) and the Suffix field to a single quote followed by a comma (<code className="font-mono bg-slate-200/60 px-1 rounded">',</code>). Enable the Trim Line Whitespace toggle. Paste your raw IDs or list, then copy the result straight into your SQL query editor.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I add sequential line numbers with custom prefixes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Enabling "Sequential Line Numbers" inserts incrementing numbers before your chosen prefix string, with customizable starting indices and delimiter symbols.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}