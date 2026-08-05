"use client";

import React, { useState, useMemo } from "react";
import {
    Phone,
    Copy,
    Check,
    Trash2,
    FileSpreadsheet,
    Globe,
    Filter,
    RefreshCw,
    Database,
    Cpu,
    Table,
    HardDrive,
    HelpCircle,
    Zap,
    Shield,
    FileText,
    Layers,
    BookOpen,
    CheckCircle2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Phone Extractor & Formatter Core Engine
// Client-Side Only — Zero External Dependencies
// ─────────────────────────────────────────────────────────────

type CountryFormat = "E164" | "US_NATIONAL" | "INTL_SPACE" | "HYPHENATED" | "RAW_DIGITS";

interface PhoneMatch {
    id: string;
    original: string;
    digitsOnly: string;
    countryCode: string;
    formatted: string;
    isValidLength: boolean;
    type: string;
}

// Extensive Global Country Dialing Directory
const GLOBAL_COUNTRY_CODES = [
    { code: "+1", country: "United States / Canada", flag: "🇺🇸/🇨🇦" },
    { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+39", country: "Italy", flag: "🇮🇹" },
    { code: "+34", country: "Spain", flag: "🇪🇸" },
    { code: "+31", country: "Netherlands", flag: "🇳🇱" },
    { code: "+32", country: "Belgium", flag: "🇧🇪" },
    { code: "+41", country: "Switzerland", flag: "🇨🇭" },
    { code: "+43", country: "Austria", flag: "🇦🇹" },
    { code: "+46", country: "Sweden", flag: "🇸🇪" },
    { code: "+47", country: "Norway", flag: "🇳🇴" },
    { code: "+45", country: "Denmark", flag: "🇩🇰" },
    { code: "+358", country: "Finland", flag: "🇫🇮" },
    { code: "+353", country: "Ireland", flag: "🇮🇪" },
    { code: "+351", country: "Portugal", flag: "🇵🇹" },
    { code: "+30", country: "Greece", flag: "🇬🇷" },
    { code: "+48", country: "Poland", flag: "🇵🇱" },
    { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
    { code: "+36", country: "Hungary", flag: "🇭🇺" },
    { code: "+40", country: "Romania", flag: "🇷🇴" },
    { code: "+380", country: "Ukraine", flag: "🇺🇦" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+82", country: "South Korea", flag: "🇰🇷" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+64", country: "New Zealand", flag: "🇳🇿" },
    { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
    { code: "+92", country: "Pakistan", flag: "🇵🇰" },
    { code: "+63", country: "Philippines", flag: "🇵🇭" },
    { code: "+62", country: "Indonesia", flag: "🇮🇩" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾" },
    { code: "+66", country: "Thailand", flag: "🇹🇭" },
    { code: "+84", country: "Vietnam", flag: "🇻🇳" },
    { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+972", country: "Israel", flag: "🇮🇱" },
    { code: "+90", country: "Turkey", flag: "🇹🇷" },
    { code: "+20", country: "Egypt", flag: "🇪🇬" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+52", country: "Mexico", flag: "🇲🇽" },
    { code: "+55", country: "Brazil", flag: "🇧🇷" },
    { code: "+54", country: "Argentina", flag: "🇦🇷" },
    { code: "+56", country: "Chile", flag: "🇨🇱" },
    { code: "+57", country: "Colombia", flag: "🇨🇴" },
    { code: "+51", country: "Peru", flag: "🇵🇪" },
];

function formatPhoneNumber(digits: string, formatStyle: CountryFormat, defaultCountry: string): string {
    let clean = digits.replace(/\D/g, "");
    if (!clean) return "";

    const defaultDigits = defaultCountry.replace(/\D/g, "");

    // Prepend default country code if missing on local 10-digit formats
    if (!clean.startsWith(defaultDigits) && clean.length === 10) {
        clean = defaultDigits + clean;
    }

    switch (formatStyle) {
        case "E164":
            return clean.startsWith("+") ? clean : `+${clean}`;
        case "US_NATIONAL":
            if (clean.length === 10) {
                return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
            } else if (clean.length === 11 && clean.startsWith("1")) {
                return `+1 (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7)}`;
            }
            return `+${clean}`;
        case "INTL_SPACE":
            if (clean.length === 11 && clean.startsWith("1")) {
                return `+1 ${clean.slice(1, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
            } else if (clean.length === 10) {
                return `+1 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
            }
            return `+${clean.replace(/(\d{3})(?=\d)/g, "$1 ")}`;
        case "HYPHENATED":
            if (clean.length === 10) {
                return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
            } else if (clean.length === 11 && clean.startsWith("1")) {
                return `1-${clean.slice(1, 4)}-${clean.slice(4, 7)}-${clean.slice(7)}`;
            }
            return clean.replace(/(\d{3})(?=\d)/g, "$1-");
        case "RAW_DIGITS":
        default:
            return clean;
    }
}

const SAMPLE_TEXT = `Reach out to our customer support team!
Sales Inquiries: +1 (800) 555-0199 or call 1-888-555-0142.
Direct Line: (415) 555-2671 | Mobile: 415.555.8901
UK Office: +44 20 7946 0912
German Branch: +49 30 123456
Greek Office: +30 210 1234567
UAE Regional HQ: +971 4 123 4567
Japan Support: +81 3 1234 5678
International Desk: 001-212-555-0188
Support Fax: 800.555.0199 (Duplicate entry test)`;

export default function PhoneNumberExtractor() {
    const [inputText, setInputText] = useState("");
    const [formatStyle, setFormatStyle] = useState<CountryFormat>("E164");
    const [defaultCountry, setDefaultCountry] = useState("+1");
    const [removeDuplicates, setRemoveDuplicates] = useState(true);
    const [minDigits, setMinDigits] = useState(7);
    const [maxDigits, setMaxDigits] = useState(15);
    const [copied, setCopied] = useState(false);

    // Parse Phone Numbers
    const extractedNumbers = useMemo(() => {
        if (!inputText.trim()) return [];

        const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
        const matches = inputText.match(phoneRegex) || [];

        const results: PhoneMatch[] = [];
        const seen = new Set<string>();

        matches.forEach((match, index) => {
            const cleanDigits = match.replace(/\D/g, "");

            if (cleanDigits.length < minDigits || cleanDigits.length > maxDigits) {
                return;
            }

            if (removeDuplicates && seen.has(cleanDigits)) {
                return;
            }
            seen.add(cleanDigits);

            let cc = "Unknown Context";
            if (cleanDigits.startsWith("1") && cleanDigits.length === 11) cc = "+1 (US/CA)";
            else if (cleanDigits.startsWith("44")) cc = "+44 (UK)";
            else if (cleanDigits.startsWith("49")) cc = "+49 (DE)";
            else if (cleanDigits.startsWith("33")) cc = "+33 (FR)";
            else if (cleanDigits.startsWith("30")) cc = "+30 (GR)";
            else if (cleanDigits.startsWith("971")) cc = "+971 (UAE)";
            else if (cleanDigits.startsWith("81")) cc = "+81 (JP)";
            else if (cleanDigits.length === 10) cc = defaultCountry + " (Inferred)";

            const formatted = formatPhoneNumber(cleanDigits, formatStyle, defaultCountry);

            results.push({
                id: `${cleanDigits}-${index}`,
                original: match.trim(),
                digitsOnly: cleanDigits,
                countryCode: cc,
                formatted: formatted,
                isValidLength: cleanDigits.length >= 7 && cleanDigits.length <= 15,
                type: cleanDigits.length === 10 || (cleanDigits.length === 11 && cleanDigits.startsWith("1")) ? "Standard Landline/Mobile" : "International/Special",
            });
        });

        return results;
    }, [inputText, formatStyle, defaultCountry, removeDuplicates, minDigits, maxDigits]);

    const outputFormattedText = useMemo(() => {
        return extractedNumbers.map((num) => num.formatted).join("\n");
    }, [extractedNumbers]);

    const copyToClipboard = async () => {
        if (!outputFormattedText) return;
        try {
            await navigator.clipboard.writeText(outputFormattedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent catch */
        }
    };

    const downloadCSV = () => {
        if (extractedNumbers.length === 0) return;
        const headers = "Original Match,Digits Only,Formatted Number,Country Context,Number Type\n";
        const rows = extractedNumbers
            .map(
                (n) =>
                    `"${n.original.replace(/"/g, '""')}","${n.digitsOnly}","${n.formatted}","${n.countryCode}","${n.type}"`
            )
            .join("\n");

        const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `extracted_phone_numbers_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const loadSample = () => {
        setInputText(SAMPLE_TEXT);
    };

    const clearWorkspace = () => {
        setInputText("");
    };

    return (
        <div className="w-full space-y-8">
            {/* ── Two-Column Workspace Grid ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & CONFIG ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-semibold">Raw Text Input Workspace</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="phone-default-country" className="block text-xs font-medium text-slate-600 mb-1">
                                        Default Country Code
                                    </label>
                                    <select
                                        id="phone-default-country"
                                        value={defaultCountry}
                                        onChange={(e) => setDefaultCountry(e.target.value)}
                                        className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
                                    >
                                        {GLOBAL_COUNTRY_CODES.map((item) => (
                                            <option key={`${item.code}-${item.country}`} value={item.code}>
                                                {item.code} {item.country}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="phone-format-style" className="block text-xs font-medium text-slate-600 mb-1">
                                        Target Output Standard
                                    </label>
                                    <select
                                        id="phone-format-style"
                                        value={formatStyle}
                                        onChange={(e) => setFormatStyle(e.target.value as CountryFormat)}
                                        className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
                                    >
                                        <option value="E164">E.164 (+14155552671)</option>
                                        <option value="US_NATIONAL">US National ((415) 555-2671)</option>
                                        <option value="INTL_SPACE">Spaced (+1 415 555 2671)</option>
                                        <option value="HYPHENATED">Hyphenated (1-415-555-2671)</option>
                                        <option value="RAW_DIGITS">Digits Only (14155552671)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Filtering Controls */}
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="phone-dedupe"
                                        checked={removeDuplicates}
                                        onChange={(e) => setRemoveDuplicates(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                    <label htmlFor="phone-dedupe" className="text-xs font-medium text-slate-700 cursor-pointer">
                                        Remove Duplicates
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Digit Filter:</span>
                                    <input
                                        type="number"
                                        value={minDigits}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value.replace(/^0+/, ""), 10);
                                            setMinDigits(isNaN(val) ? 7 : Math.max(1, val));
                                        }}
                                        className="w-12 text-xs border border-slate-200 rounded px-1.5 py-1 text-center"
                                        min="1"
                                        max="15"
                                    />
                                    <span className="text-xs text-slate-400">to</span>
                                    <input
                                        type="number"
                                        value={maxDigits}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value.replace(/^0+/, ""), 10);
                                            setMaxDigits(isNaN(val) ? 15 : Math.min(20, val));
                                        }}
                                        className="w-12 text-xs border border-slate-200 rounded px-1.5 py-1 text-center"
                                        min="1"
                                        max="20"
                                    />
                                </div>
                            </div>

                            {/* Textarea */}
                            <textarea
                                id="phone-input-textarea"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste raw unstructured text, email lists, HTML documents, or contact logs here..."
                                className="font-mono text-sm h-[380px] focus:ring-2 focus:ring-indigo-600 outline-none p-4 w-full bg-white text-slate-800 border border-slate-200 rounded-xl resize-none"
                            />

                            {/* Operational Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    id="phone-load-sample"
                                    onClick={loadSample}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 min-h-[44px]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Load Sample
                                </button>
                                <button
                                    id="phone-clear"
                                    onClick={clearWorkspace}
                                    disabled={!inputText}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear Input
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: EXTRACTED RESULTS ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden sticky top-4">
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Filter className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-semibold">
                                    Extracted Results ({extractedNumbers.length})
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Processed Output Display */}
                            <div className="relative">
                                <textarea
                                    id="phone-output-textarea"
                                    value={outputFormattedText}
                                    readOnly
                                    placeholder="Extracted and standardized phone numbers will appear here..."
                                    className="font-mono text-sm h-[380px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none"
                                />
                            </div>

                            {/* Summary Metrics */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                        Found Matches
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">
                                        {extractedNumbers.length}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                        Target Format
                                    </p>
                                    <p className="text-xs font-mono font-bold text-indigo-600 truncate">
                                        {formatStyle}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                        Deduplication
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">
                                        {removeDuplicates ? "Active" : "Off"}
                                    </p>
                                </div>
                            </div>

                            {/* Operational Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    id="phone-copy-button"
                                    onClick={copyToClipboard}
                                    disabled={extractedNumbers.length === 0}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${extractedNumbers.length > 0
                                        ? copied
                                            ? "bg-green-500 text-white shadow-md shadow-green-200"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied List!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy List
                                        </>
                                    )}
                                </button>

                                <button
                                    id="phone-download-csv"
                                    onClick={downloadCSV}
                                    disabled={extractedNumbers.length === 0}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 bg-slate-900 hover:bg-slate-800 text-white shadow-md disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed min-h-[44px]"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Export CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK (COMPREHENSIVE, ADSENSE & AI READY)
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8">
                {/* Card 1: Technical Foundations of Phone Number Extraction */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Technical Foundations of Phone Number Extraction & Parsing</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Extracting phone numbers from unorganized text streams—such as email threads, PDF documents, database dumps, web scrapes, or customer support logs—presents unique lexical parsing challenges. Phone numbers lack a single global syntactic standard in raw human communication. They are frequently recorded with regional area codes, extensions, varying delimeters (dots, spaces, hyphens, slashes), or enclosed in parentheses.
                        </p>
                        <p>
                            <strong>Phone Number Extraction</strong> is the process of scanning arbitrary text strings, isolating numerical sequence blocks that adhere to telecom patterns, stripping decorative noise, and normalizing those sequences into standardized formats such as <strong>ITU-T E.164</strong>.
                        </p>
                        <p>
                            Without automated extraction and normalization, enterprise software systems suffer from data fragmentation. Duplicate records appear across CRM platforms (e.g., Salesforce, HubSpot), SMS gateways fail due to invalid formatting, and compliance protocols (such as TCPA or GDPR opt-out handling) break down due to mismatched numerical strings.
                        </p>
                    </div>
                </div>

                {/* Card 2: The Parsing & Normalization Pipeline */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>The 4-Stage Extraction & Normalization Pipeline</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "1",
                                title: "Regex Tokenization",
                                desc: "The engine scans the raw text block using regular expression boundaries to identify continuous numeric sequences surrounded by standard phone delimiters (+, (), -, ., spaces).",
                            },
                            {
                                step: "2",
                                title: "Digit Sanitization",
                                desc: "Non-numeric characters are removed to isolate pure digit arrays. Non-standard symbols and accidental trailing punctuation (commas, periods at sentence ends) are purged.",
                            },
                            {
                                step: "3",
                                title: "Country Prefix & Length Filtering",
                                desc: "Candidates are evaluated against character length parameters (e.g., 7 to 15 digits per ITU E.164 guidelines). Missing country prefixes on 10-digit national numbers are automatically appended based on user configuration.",
                            },
                            {
                                step: "4",
                                title: "Standardized Formatting & Export",
                                desc: "Cleaned numbers are converted to chosen output formats (E.164, US National, Spaced, Hyphenated, or Digits-Only), deduplicated using hash sets, and structured into copyable text or downloadable CSV files.",
                            },
                        ].map((item) => (
                            <div key={item.step} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                                        {item.step}
                                    </div>
                                    <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                                </div>
                                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 3: Standards Comparison Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Telecommunication Number Formatting Standards Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                                    <th className="p-3 font-semibold">Format Standard</th>
                                    <th className="p-3 font-semibold">Example Output</th>
                                    <th className="p-3 font-semibold">Primary Ecosystem / Use Case</th>
                                    <th className="p-3 font-semibold">Validation Characteristics</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-900">E.164 International</td>
                                    <td className="p-3 font-mono text-indigo-600">+14155552671</td>
                                    <td className="p-3 text-slate-600">Twilio, SMS Gateways, VoIP APIs, Databases</td>
                                    <td className="p-3 text-slate-600">Max 15 digits, leads with '+', no symbols</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-900">US National Format</td>
                                    <td className="p-3 font-mono text-indigo-600">(415) 555-2671</td>
                                    <td className="p-3 text-slate-600">Salesforce, HubSpot, Print & Billing Docs</td>
                                    <td className="p-3 text-slate-600">Parentheses around area code, space + hyphen</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-900">International Spaced</td>
                                    <td className="p-3 font-mono text-indigo-600">+1 415 555 2671</td>
                                    <td className="p-3 text-slate-600">Global Contact Directories, Email Signatures</td>
                                    <td className="p-3 text-slate-600">Human-readable international layout</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-900">Hyphenated Standard</td>
                                    <td className="p-3 font-mono text-indigo-600">1-415-555-2671</td>
                                    <td className="p-3 text-slate-600">Legacy Telecom, CSV Spreadsheets</td>
                                    <td className="p-3 text-slate-600">Uniform hyphen spacing across digit groups</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-900">Raw Digits Only</td>
                                    <td className="p-3 font-mono text-indigo-600">14155552671</td>
                                    <td className="p-3 text-slate-600">SQL Primary Keys, BigData Indexing, Telephony Systems</td>
                                    <td className="p-3 text-slate-600">Pure numerical string, zero non-numeric characters</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 4: Global Country Dialing Code Quick Reference */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Global Country Dialing Code Reference Guide</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When parsing local 10-digit or 9-digit phone numbers from raw text without country codes, assigning the correct international calling prefix is critical. Below is a reference of major country codes built directly into TwisterTools:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                        {GLOBAL_COUNTRY_CODES.slice(0, 24).map((c) => (
                            <div key={c.code + c.country} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                <span className="font-medium text-slate-800">{c.country}</span>
                                <span className="font-mono font-bold text-indigo-600">{c.code}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 italic">
                        * Supports over 50+ global country prefixes directly in the default country configuration dropdown menu above.
                    </p>
                </div>

                {/* Card 5: Common Enterprise Use Cases */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HardDrive className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Enterprise Workflows & Business Applications</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            {
                                title: "CRM Lead Data Hygiene",
                                desc: "Bulk clean sales prospect lists exported from LinkedIn, web forms, or trade show leads before uploading into Salesforce, HubSpot, or Zoho CRM.",
                            },
                            {
                                title: "SMS Gateway Normalization",
                                desc: "Format phone numbers into strict E.164 (+1XXXXXXXXXX) standards required by SMS delivery APIs like Twilio, MessageBird, and AWS SNS to prevent message delivery failures.",
                            },
                            {
                                title: "Regulatory Compliance (TCPA & GDPR)",
                                desc: "Deduplicate and standardize call lists to cross-reference accurately against Do Not Call (DNC) registries and opt-out suppression databases.",
                            },
                            {
                                title: "Customer Support Log Parsing",
                                desc: "Extract contact details from incoming email support threads, web chat transcripts, or Zendesk ticket dumps into structured CSV datasets.",
                            },
                        ].map((useCase) => (
                            <div key={useCase.title} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{useCase.title}</span>
                                </div>
                                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{useCase.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 6: Frequently Asked Questions (Static Cards) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-semibold text-slate-900 text-base mb-1">
                                Is my sensitive contact list data transmitted to any cloud servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. TwisterTools operates with 100% client-side architecture. All text processing, regular expression matching, phone number normalization, and CSV generation occur locally within your web browser memory. No data is sent over the internet or stored on external servers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-semibold text-slate-900 text-base mb-1">
                                How does the tool process 10-digit local numbers missing international country codes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can set your desired Default Country Code (e.g., +1 for North America, +44 for UK, +49 for Germany) using the configuration control above. When a 10-digit local number without an explicit prefix is extracted, the tool automatically appends your designated country code.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-semibold text-slate-900 text-base mb-1">
                                What is E.164 format and why is it recommended for SMS and CRM applications?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                E.164 is an international telecommunication standard that defines a global format for telephone numbers. An E.164 number includes the plus sign (+), country code, subscriber area code, and local number (e.g., +14155552671), with no spaces, hyphens, or parentheses. It is the mandatory format used by cloud communication APIs like Twilio, MessageBird, and Plivo.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-semibold text-slate-900 text-base mb-1">
                                Can I export the extracted results directly into Microsoft Excel, Google Sheets, or CRMs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Clicking the "Export CSV" button generates a structured `.csv` file containing original raw strings, isolated digit sequences, standardized formatted numbers, inferred country context, and classification types ready for immediate upload into Excel, Google Sheets, or CRM platforms.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* JSON-LD Structured Data for WebApplication & FAQPage */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        {
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            name: "Phone Number Extractor & Formatter",
                            applicationCategory: "UtilityApplication",
                            operatingSystem: "All",
                            browserRequirements: "Requires JavaScript",
                            description:
                                "Extract, deduplicate, and standardize phone numbers from raw unstructured text into E.164, US National, or CSV format directly in your browser.",
                            featureList: [
                                "Client-side privacy processing",
                                "E.164 international formatting",
                                "Automatic duplicate removal",
                                "50+ Global Country Prefix Support",
                                "CSV Data Export",
                            ],
                            offers: {
                                "@type": "Offer",
                                price: "0",
                                priceCurrency: "USD",
                            },
                        },
                        {
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: [
                                {
                                    "@type": "Question",
                                    name: "Is my sensitive contact list data transmitted to any cloud servers?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "No. All processing happens 100% client-side in your browser memory. No data is transmitted to external servers.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "What is E.164 format and why is it recommended?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "E.164 is the international telecommunication standard (+1XXXXXXXXXX) required by SMS gateways and CRM systems worldwide.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "Can I export the extracted results directly into Microsoft Excel?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "Yes, you can instantly download a structured CSV file containing original matches, clean digits, formatted numbers, and country context.",
                                    },
                                },
                            ],
                        },
                    ]),
                }}
            />
        </div>
    );
}