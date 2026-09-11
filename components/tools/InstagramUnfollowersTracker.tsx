"use client";

import React, { useState, useEffect, useMemo, useRef, useId, useCallback } from "react";
import JSZip from "jszip";
import {
    Users,
    UserX,
    UserCheck,
    UserPlus,
    Upload,
    Copy,
    Check,
    Download,
    Trash2,
    Search,
    ShieldCheck,
    FileArchive,
    AlertTriangle,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    FileText,
    History,
    RotateCcw,
    Sparkles,
    Layers,
    ArrowRight,
    ShieldAlert,
    Info,
    Sliders,
    ExternalLink,
} from "lucide-react";

type ActiveTab = "notFollowingBack" | "fans" | "mutuals" | "recentDelta";

interface ExtractedDataSet {
    following: string[];
    followers: string[];
    notFollowingBack: string[];
    fans: string[];
    mutuals: string[];
}

function extractInstagramUsernames(text: string): string[] {
    if (!text || !text.trim()) return [];

    const usernames = new Set<string>();
    const isIgnored = (h: string) =>
        [
            "_u",
            "explore",
            "direct",
            "reels",
            "stories",
            "p",
            "tv",
            "developer",
            "about",
            "help",
            "legal",
            "privacy",
            "terms",
            "locations",
            "instagram",
        ].includes(h.toLowerCase());

    // Strategy 1: JSON Export parsing
    try {
        const json = JSON.parse(text);
        const extractFromObj = (obj: unknown) => {
            if (!obj) return;
            if (typeof obj === "string") {
                if (obj.startsWith("http") && obj.includes("instagram.com/")) {
                    const match = obj.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/);
                    if (match && match[1] && !isIgnored(match[1])) {
                        usernames.add(match[1].toLowerCase());
                    }
                }
            } else if (Array.isArray(obj)) {
                obj.forEach(extractFromObj);
            } else if (typeof obj === "object") {
                const record = obj as Record<string, unknown>;
                if (typeof record.value === "string" && record.value.trim()) {
                    const val = record.value.trim().replace(/^@/, "").toLowerCase();
                    if (/^[a-z0-9_.-]{1,30}$/.test(val) && !isIgnored(val)) {
                        usernames.add(val);
                    }
                }
                if (typeof record.string_list_data === "object" && Array.isArray(record.string_list_data)) {
                    record.string_list_data.forEach((item) => {
                        if (item && typeof item.value === "string" && item.value.trim()) {
                            const val = item.value.trim().replace(/^@/, "").toLowerCase();
                            if (/^[a-z0-9_.-]{1,30}$/.test(val) && !isIgnored(val)) {
                                usernames.add(val);
                            }
                        }
                        if (item && typeof item.href === "string") {
                            const match = item.href.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/);
                            if (match && match[1] && !isIgnored(match[1])) {
                                usernames.add(match[1].toLowerCase());
                            }
                        }
                    });
                }
                Object.values(record).forEach(extractFromObj);
            }
        };
        extractFromObj(json);
        if (usernames.size > 0) return Array.from(usernames);
    } catch {
        // Non-JSON input: proceed to DOM parsing
    }

    // Strategy 2: Client-side HTML parsing
    if (
        typeof window !== "undefined" &&
        (text.includes("<html") || text.includes("<div") || text.includes("<table") || text.includes("<a"))
    ) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");

            const h2Elements = doc.querySelectorAll("h2");
            h2Elements.forEach((h2) => {
                const txt = h2.textContent?.trim().replace(/^@/, "").toLowerCase() || "";
                if (/^[a-z0-9_.-]{1,30}$/.test(txt) && !isIgnored(txt)) {
                    usernames.add(txt);
                }
            });

            const anchors = doc.querySelectorAll("a[href*='instagram.com']");
            anchors.forEach((a) => {
                const href = a.getAttribute("href") || "";
                const match = href.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/);
                if (match && match[1] && !isIgnored(match[1])) {
                    usernames.add(match[1].toLowerCase());
                } else {
                    const anchorText = a.textContent?.trim().replace(/^@/, "").toLowerCase() || "";
                    if (/^[a-z0-9_.-]{1,30}$/.test(anchorText) && !isIgnored(anchorText)) {
                        usernames.add(anchorText);
                    }
                }
            });

            const rows = doc.querySelectorAll("tr, div._a6-g, div.pam");
            rows.forEach((row) => {
                const cells = Array.from(row.querySelectorAll("td, div, span"));
                for (let i = 0; i < cells.length; i++) {
                    const cellText = cells[i].textContent?.trim().toLowerCase() || "";
                    if (cellText.includes("username") || cellText.includes("όνομα χρήστη")) {
                        const valueCell = cells[i + 1] || cells[i];
                        const candidate = valueCell?.textContent?.trim().replace(/^@/, "").toLowerCase() || "";
                        if (/^[a-z0-9_.-]{1,30}$/.test(candidate) && !isIgnored(candidate)) {
                            usernames.add(candidate);
                        }
                    }
                }
            });

            if (usernames.size > 0) return Array.from(usernames);
        } catch {
            // DOM parser error fallback
        }
    }

    // Strategy 3: Plain text list fallback
    const lines = text.split(/\r?\n/);
    lines.forEach((line) => {
        const trimmed = line.trim().replace(/^@/, "").toLowerCase();
        if (/^[a-z0-9_.-]{1,30}$/.test(trimmed) && !isIgnored(trimmed)) {
            usernames.add(trimmed);
        }
    });

    return Array.from(usernames);
}

const parseZipToNonFollowers = async (file: File): Promise<string[]> => {
    const zip = new JSZip();
    const unzipped = await zip.loadAsync(file);

    let rawFollowersContent = "";
    let rawFollowingContent = "";

    const filePaths = Object.keys(unzipped.files);

    for (const p of filePaths) {
        const filename = p.split("/").pop()?.toLowerCase() || "";

        if (
            filename === "followers_1.html" ||
            filename === "followers_1.json" ||
            filename === "followers.html" ||
            filename === "followers.json"
        ) {
            rawFollowersContent += "\n" + (await unzipped.files[p].async("text"));
        }

        if (
            filename === "following.html" ||
            filename === "following.json" ||
            filename === "following_1.html" ||
            filename === "following_1.json"
        ) {
            rawFollowingContent += "\n" + (await unzipped.files[p].async("text"));
        }
    }

    if (!rawFollowersContent && !rawFollowingContent) {
        throw new Error("Could not find followers or following files in the baseline archive.");
    }

    const parsedFollowers = extractInstagramUsernames(rawFollowersContent);
    const parsedFollowing = extractInstagramUsernames(rawFollowingContent);

    const followersSet = new Set(parsedFollowers);
    return parsedFollowing.filter((u) => !followersSet.has(u)).sort();
};

export default function InstagramUnfollowersTracker() {
    const [data, setData] = useState<ExtractedDataSet>({
        following: [],
        followers: [],
        notFollowingBack: [],
        fans: [],
        mutuals: [],
    });

    const [activeTab, setActiveTab] = useState<ActiveTab>("notFollowingBack");
    const [searchQuery, setSearchQuery] = useState("");
    const [isProcessingZip, setIsProcessingZip] = useState(false);
    const [isDraggingZip, setIsDraggingZip] = useState(false);
    const [zipMessage, setZipMessage] = useState<string | null>(null);
    const [zipError, setZipError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Baseline Comparison Feature (Delta Snapshot Tracking)
    const [baselineInputText, setBaselineInputText] = useState("");
    const [savedBaselineDate, setSavedBaselineDate] = useState<string | null>(null);
    const [baselineLoading, setBaselineLoading] = useState(false);
    const [isDraggingBaseline, setIsDraggingBaseline] = useState(false);

    const zipInputRef = useRef<HTMLInputElement>(null);
    const baselineInputRef = useRef<HTMLInputElement>(null);
    const searchInputId = useId();
    const baselineTextareaId = useId();

    // Restore Baseline Snapshot from localStorage on client mount (if explicitly saved previously)
    useEffect(() => {
        try {
            const savedText = localStorage.getItem("twistertools_ig_baseline_text");
            const savedDate = localStorage.getItem("twistertools_ig_baseline_date");
            if (savedText) {
                setBaselineInputText(savedText);
            }
            if (savedDate) {
                setSavedBaselineDate(savedDate);
            }
        } catch {
            // Safe fallback for SSR / disabled localStorage
        }
    }, []);


    const processZipFile = async (file: File) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".zip")) {
            setZipError("Please select or drop a valid .zip file.");
            return;
        }

        setIsProcessingZip(true);
        setZipError(null);
        setZipMessage("Parsing Instagram ZIP file in browser sandbox...");

        try {
            const zip = new JSZip();
            const unzipped = await zip.loadAsync(file);

            let rawFollowersContent = "";
            let rawFollowingContent = "";

            const filePaths = Object.keys(unzipped.files);

            for (const p of filePaths) {
                const filename = p.split("/").pop()?.toLowerCase() || "";

                if (
                    filename === "followers_1.html" ||
                    filename === "followers_1.json" ||
                    filename === "followers.html" ||
                    filename === "followers.json"
                ) {
                    rawFollowersContent += "\n" + (await unzipped.files[p].async("text"));
                }

                if (
                    filename === "following.html" ||
                    filename === "following.json" ||
                    filename === "following_1.html" ||
                    filename === "following_1.json"
                ) {
                    rawFollowingContent += "\n" + (await unzipped.files[p].async("text"));
                }
            }

            if (!rawFollowersContent && !rawFollowingContent) {
                throw new Error(
                    "Could not locate followers or following records in the uploaded archive. Please confirm you uploaded an official Meta Instagram export ZIP."
                );
            }

            const parsedFollowers = extractInstagramUsernames(rawFollowersContent);
            const parsedFollowing = extractInstagramUsernames(rawFollowingContent);

            if (parsedFollowers.length === 0 && parsedFollowing.length === 0) {
                throw new Error(
                    "Could not parse valid handles from the extracted files. Ensure the export is valid JSON or HTML."
                );
            }

            const followingSet = new Set(parsedFollowing);
            const followersSet = new Set(parsedFollowers);

            const notFollowingBack = parsedFollowing.filter((u) => !followersSet.has(u)).sort();
            const fans = parsedFollowers.filter((u) => !followingSet.has(u)).sort();
            const mutuals = parsedFollowing.filter((u) => followersSet.has(u)).sort();

            setData({
                following: parsedFollowing.sort(),
                followers: parsedFollowers.sort(),
                notFollowingBack,
                fans,
                mutuals,
            });

            const deltaCount = notFollowingBack.filter((u) => !baselineSet.has(u)).length;

            if (baselineSet.size > 0) {
                setActiveTab("recentDelta");
                setZipMessage(
                    `Successfully extracted ${parsedFollowing.length} following & ${parsedFollowers.length} followers. Discovered ${deltaCount} NEW unfollows compared to your active baseline (${baselineSet.size} handles)!`
                );
            } else {
                setActiveTab("notFollowingBack");
                setZipMessage(
                    `Successfully extracted ${parsedFollowing.length} following and ${parsedFollowers.length} followers. Found ${notFollowingBack.length} non-reciprocal accounts.`
                );
            }
        } catch (err) {
            setZipError(
                err instanceof Error ? err.message : "Failed to extract ZIP archive. Please confirm the file is valid."
            );
            setZipMessage(null);
        } finally {
            setIsProcessingZip(false);
        }
    };

    const handleZipDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingZip(true);
    };

    const handleZipDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingZip(false);
    };

    const handleZipDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingZip(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processZipFile(file);
        }
    };

    const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processZipFile(file);
            e.target.value = "";
        }
    };

    // Delta calculation: Users present in current notFollowingBack who were NOT in previous baseline
    const baselineSet = useMemo(() => {
        if (!baselineInputText.trim()) return new Set<string>();
        const lines = baselineInputText
            .split(/\r?\n/)
            .map((l) => l.trim().replace(/^@/, "").toLowerCase())
            .filter(Boolean);
        return new Set(lines);
    }, [baselineInputText]);

    const recentUnfollowersDelta = useMemo(() => {
        if (baselineSet.size === 0 || data.notFollowingBack.length === 0) return [];
        return data.notFollowingBack.filter((u) => !baselineSet.has(u));
    }, [data.notFollowingBack, baselineSet]);

    const displayedList = useMemo(() => {
        let source: string[] = [];
        switch (activeTab) {
            case "notFollowingBack":
                source = data.notFollowingBack;
                break;
            case "fans":
                source = data.fans;
                break;
            case "mutuals":
                source = data.mutuals;
                break;
            case "recentDelta":
                source = recentUnfollowersDelta;
                break;
        }

        if (!searchQuery.trim()) return source;
        const q = searchQuery.toLowerCase().trim();
        return source.filter((u) => u.includes(q));
    }, [activeTab, data, recentUnfollowersDelta, searchQuery]);

    const handleSaveCurrentAsBaseline = () => {
        let textToSave = "";
        let dateLabel = "";

        if (data.notFollowingBack.length > 0) {
            textToSave = data.notFollowingBack.join("\n");
            dateLabel = `Saved: ${new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })} (${data.notFollowingBack.length} accounts)`;
        } else if (baselineInputText.trim().length > 0) {
            textToSave = baselineInputText.trim();
            const count = textToSave.split(/\r?\n/).filter(Boolean).length;
            dateLabel = `Saved: ${new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })} (${count} accounts)`;
        } else {
            return;
        }

        setBaselineInputText(textToSave);
        setSavedBaselineDate(dateLabel);

        try {
            localStorage.setItem("twistertools_ig_baseline_text", textToSave);
            localStorage.setItem("twistertools_ig_baseline_date", dateLabel);
        } catch {
            // Fallback for private modes
        }
    };

    const handleClearBaseline = () => {
        setBaselineInputText("");
        setSavedBaselineDate(null);
        try {
            localStorage.removeItem("twistertools_ig_baseline_text");
            localStorage.removeItem("twistertools_ig_baseline_date");
        } catch {
            // Fallback
        }
    };

    const processBaselineFile = async (file: File) => {
        if (!file) return;

        const lowerName = file.name.toLowerCase();
        setBaselineLoading(true);

        try {
            if (lowerName.endsWith(".zip")) {
                const oldNonFollowers = await parseZipToNonFollowers(file);
                if (oldNonFollowers.length === 0) {
                    throw new Error("No non-followers found in baseline ZIP.");
                }
                const text = oldNonFollowers.join("\n");
                const dateLabel = `Archive: ${file.name} (${oldNonFollowers.length} accounts) - Unsaved`;
                setBaselineInputText(text);
                setSavedBaselineDate(dateLabel);
            } else {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = (event.target?.result as string) || "";
                    const handles = extractInstagramUsernames(content);
                    const text = handles.length > 0 ? handles.join("\n") : content;
                    const dateLabel = `File: ${file.name} - Unsaved`;
                    setBaselineInputText(text);
                    setSavedBaselineDate(dateLabel);
                };
                reader.readAsText(file);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to parse baseline file.");
        } finally {
            setBaselineLoading(false);
        }
    };

    const handleBaselineFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processBaselineFile(file);
            e.target.value = "";
        }
    };

    const handleBaselineDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingBaseline(true);
    };

    const handleBaselineDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingBaseline(false);
    };

    const handleBaselineDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingBaseline(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processBaselineFile(file);
        }
    };

    const copyCurrentList = async () => {
        if (displayedList.length === 0) return;
        try {
            await navigator.clipboard.writeText(displayedList.join("\n"));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard write fallback
        }
    };

    const downloadCurrentList = (format: "txt" | "csv") => {
        if (displayedList.length === 0) return;
        let content = "";
        let mimeType = "";
        let ext = "";

        if (format === "csv") {
            content = "Username,Profile URL\n" + displayedList.map((u) => `"${u}","https://www.instagram.com/${u}"`).join("\n");
            mimeType = "text/csv;charset=utf-8;";
            ext = "csv";
        } else {
            content = displayedList.join("\n");
            mimeType = "text/plain;charset=utf-8;";
            ext = "txt";
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `instagram-${activeTab}-${new Date().toISOString().split("T")[0]}.${ext}`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleClearAll = () => {
        setData({
            following: [],
            followers: [],
            notFollowingBack: [],
            fans: [],
            mutuals: [],
        });
        setZipMessage(null);
        setZipError(null);
        setSearchQuery("");
    };

    const loadSampleData = () => {
        const sampleFollowing = [
            "techinsider",
            "verge",
            "wired",
            "github",
            "googledevs",
            "reactjs",
            "nextjs_fan",
            "alex_designer",
            "sarah_dev",
            "crypto_king",
            "inactive_photographer_99",
            "mark_fitness",
        ];
        const sampleFollowers = [
            "techinsider",
            "wired",
            "github",
            "reactjs",
            "alex_designer",
            "dan_abramov",
            "cool_coder_2026",
            "creative_agency",
        ];

        const followingSet = new Set(sampleFollowing);
        const followersSet = new Set(sampleFollowers);

        setData({
            following: sampleFollowing.sort(),
            followers: sampleFollowers.sort(),
            notFollowingBack: sampleFollowing.filter((u) => !followersSet.has(u)).sort(),
            fans: sampleFollowers.filter((u) => !followingSet.has(u)).sort(),
            mutuals: sampleFollowing.filter((u) => followersSet.has(u)).sort(),
        });

        setZipMessage("Sample data loaded: 12 Following, 8 Followers. Click 'Save Current as Baseline' to test delta tracking.");
        setZipError(null);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Instagram Unfollowers & Account Delta Tracker",
        url: "https://www.twistertools.com/tools/social-tools/instagram-unfollower-checker",
        description:
            "Find who unfollowed you on Instagram using your official data export ZIP. 100% private, client-side analysis with zero password entry, OAuth requests, or server uploads.",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "All",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "Is this Instagram unfollower tool safe to use with my account?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, it is completely safe. Unlike third-party apps that require your Instagram username, password, or session cookies, TwisterTools runs 100% locally in your web browser. Your ZIP data is unpacked and analyzed exclusively within your browser's private memory and is never transmitted to any external server.",
                },
            },
            {
                "@type": "Question",
                name: "How do I request my official Instagram data download ZIP?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Inside the Instagram app or desktop website, open Settings & Privacy > Accounts Center > Your Information and Permissions > Download Your Information. Choose 'Export Specific Information', pick 'Followers and following', select JSON or HTML format with Date Range set to 'All time', and click Create Files. Meta will email you a secure download link containing your ZIP archive.",
                },
            },
            {
                "@type": "Question",
                name: "Why does the standard 'Don't Follow You Back' list include so many accounts?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Instagram exports only contain current snapshot relationships. Your list of non-followers naturally includes celebrities, brands, news outlets, and creators you voluntarily follow without expecting a follow back, as well as deactivated accounts. Our Recent Unfollowers Delta feature solves this by comparing your newest export against a previous snapshot to highlight only genuine new unfollows.",
                },
            },
            {
                "@type": "Question",
                name: "How does the 'Recent Unfollowers Delta' snapshot comparison work?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Save your current list of non-followers or drag and drop a previous export archive (ZIP, TXT, or CSV) into the baseline section. When you upload a newer Instagram export later, the engine compares both datasets and isolates only the accounts that unfollowed you between export dates.",
                },
            },
            {
                "@type": "Question",
                name: "Does using this data analysis tool violate Instagram terms of service?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. This tool does not scrape Instagram, execute bot scripts, or connect to private Instagram APIs. It operates strictly as a local mathematical file reader for data you are legally permitted to export from Meta under GDPR and CCPA consumer privacy regulations.",
                },
            },
        ],
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Column: Archive Dropzone & Baseline Management (5 Columns) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Upload Data Archive
                        </h2>
                        <div className="flex items-center gap-2">
                            {(data.following.length > 0 || data.followers.length > 0) && (
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="text-xs font-semibold px-2.5 py-1 rounded-md text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center gap-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Clear
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={loadSampleData}
                                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                            >
                                Load Sample
                            </button>
                        </div>
                    </div>

                    {/* Primary ZIP Dropzone */}
                    <div
                        onClick={() => zipInputRef.current?.click()}
                        onDragOver={handleZipDragOver}
                        onDragEnter={handleZipDragOver}
                        onDragLeave={handleZipDragLeave}
                        onDrop={handleZipDrop}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 group ${isDraggingZip
                                ? "border-indigo-600 bg-indigo-100/50 dark:bg-indigo-950/40"
                                : "border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10"
                            }`}
                    >
                        <input
                            ref={zipInputRef}
                            type="file"
                            accept=".zip"
                            aria-label="Upload Instagram export ZIP file"
                            className="hidden"
                            onChange={handleZipUpload}
                        />
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <FileArchive className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {isProcessingZip ? "Reading archive in browser..." : "Drop Instagram Export ZIP Here"}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                Supports official Meta JSON &amp; HTML exports. 100% processed in local device memory.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                            <Upload className="w-3.5 h-3.5" /> Browse Computer / Files
                        </span>
                    </div>

                    {zipMessage && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl p-3 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{zipMessage}</span>
                        </div>
                    )}
                    {zipError && (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>{zipError}</span>
                        </div>
                    )}

                    {/* Quick Metrics Cards */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                Following
                            </span>
                            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                                {data.following.length}
                            </span>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                Followers
                            </span>
                            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                                {data.followers.length}
                            </span>
                        </div>
                    </div>

                    {/* Advanced Delta Baseline Configuration */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Baseline Snapshot Comparison
                                </h3>
                            </div>
                            {baselineSet.size > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearBaseline}
                                    className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                                >
                                    Reset Snapshot
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Compare your current list of non-followers against a previous snapshot (or previous Meta export ZIP) to isolate genuine new unfollows
                            instead of accounts you intentionally follow.
                        </p>

                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2.5">
                            <div className="space-y-0.5 text-xs">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                    Baseline Records: <strong className="font-mono text-indigo-600">{baselineSet.size}</strong> handles
                                </div>
                                {savedBaselineDate && (
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">{savedBaselineDate}</div>
                                )}
                            </div>

                            {/* Small Drag & Drop Box for Baseline Import */}
                            <div
                                onClick={() => baselineInputRef.current?.click()}
                                onDragOver={handleBaselineDragOver}
                                onDragEnter={handleBaselineDragOver}
                                onDragLeave={handleBaselineDragLeave}
                                onDrop={handleBaselineDrop}
                                className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-0.5 ${isDraggingBaseline
                                        ? "border-indigo-600 bg-indigo-100/50 dark:bg-indigo-950/40"
                                        : "border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-900"
                                    }`}
                            >
                                <input
                                    ref={baselineInputRef}
                                    type="file"
                                    accept=".zip,.txt,.csv"
                                    aria-label="Upload previous unfollower text, CSV, or ZIP snapshot"
                                    className="hidden"
                                    onChange={handleBaselineFileUpload}
                                />
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    {baselineLoading ? "Parsing baseline file..." : "Drop Previous ZIP / TXT / CSV Here"}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    or click to browse files
                                </p>
                            </div>

                            {/* Manual Raw Paste for Baseline */}
                            <div className="pt-1">
                                <label htmlFor={baselineTextareaId} className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                                    Or paste previous non-followers list:
                                </label>
                                <textarea
                                    id={baselineTextareaId}
                                    rows={6}
                                    value={baselineInputText}
                                    onChange={(e) => setBaselineInputText(e.target.value)}
                                    aria-label="Paste previous baseline non-followers list"
                                    placeholder="Paste line-separated handles here..."
                                    className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[130px]"
                                />
                            </div>

                            {/* Save Current as Baseline Button Centered Below Textarea */}
                            <div className="flex justify-center pt-1">
                                <button
                                    type="button"
                                    onClick={handleSaveCurrentAsBaseline}
                                    disabled={data.notFollowingBack.length === 0 && !baselineInputText.trim()}
                                    className="py-1.5 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> Save Current as Baseline
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Zero Uploads · 100% In-Memory Sandbox
                        </span>
                    </div>
                </div>

                {/* Right Column: Audience Classification Results & Search (7 Columns) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                    {/* Header Action Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Audience Analysis
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={copyCurrentList}
                                disabled={displayedList.length === 0}
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? "Copied" : "Copy"}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadCurrentList("txt")}
                                disabled={displayedList.length === 0}
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                                <Download className="w-3.5 h-3.5" /> TXT
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadCurrentList("csv")}
                                disabled={displayedList.length === 0}
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                                <Download className="w-3.5 h-3.5" /> CSV
                            </button>
                        </div>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("notFollowingBack")}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${activeTab === "notFollowingBack"
                                ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                }`}
                        >
                            <span className="text-[11px] font-bold block">Don't Follow Back</span>
                            <span className="text-lg font-black font-mono mt-0.5 text-rose-600 dark:text-rose-400">
                                {data.notFollowingBack.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("recentDelta")}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${activeTab === "recentDelta"
                                ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                }`}
                        >
                            <span className="text-[11px] font-bold block flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" /> New Unfollows
                            </span>
                            <span className="text-lg font-black font-mono mt-0.5 text-amber-600 dark:text-amber-400">
                                {recentUnfollowersDelta.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("fans")}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${activeTab === "fans"
                                ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                }`}
                        >
                            <span className="text-[11px] font-bold block">Fans (Not Followed)</span>
                            <span className="text-lg font-black font-mono mt-0.5 text-slate-900 dark:text-white">
                                {data.fans.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("mutuals")}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${activeTab === "mutuals"
                                ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                }`}
                        >
                            <span className="text-[11px] font-bold block">Mutual Friends</span>
                            <span className="text-lg font-black font-mono mt-0.5 text-emerald-600 dark:text-emerald-400">
                                {data.mutuals.length}
                            </span>
                        </button>
                    </div>

                    {/* Context Explainer Banner for Current Tab */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>
                            {activeTab === "notFollowingBack" && (
                                <>Accounts you follow who do not follow you back (total non-reciprocal accounts).</>
                            )}
                            {activeTab === "recentDelta" && (
                                <>
                                    Accounts that unfollowed you <strong>since your previous baseline snapshot</strong>. (
                                    {baselineSet.size === 0
                                        ? "Save or import a baseline to activate new unfollow detection."
                                        : `${recentUnfollowersDelta.length} new unfollows discovered.`}
                                    )
                                </>
                            )}
                            {activeTab === "fans" && (
                                <>Accounts following you that you have not followed back (fans/subscribers).</>
                            )}
                            {activeTab === "mutuals" && (
                                <>Accounts where you both follow each other (mutual friendships).</>
                            )}
                        </span>
                    </div>

                    {/* Search Filter Box */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            id={searchInputId}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search across ${displayedList.length} accounts in this view...`}
                            aria-label="Filter accounts in current list view"
                            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Interactive Usernames List */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {displayedList.length === 0 ? (
                                <div className="p-8 text-center space-y-2">
                                    <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        No accounts found in this category
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                        Upload your Instagram export ZIP or load sample data to explore audience relationships.
                                    </p>
                                </div>
                            ) : (
                                displayedList.map((username, index) => (
                                    <div
                                        key={username}
                                        className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-white dark:hover:bg-slate-900 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-7 shrink-0 text-right">
                                                #{index + 1}
                                            </span>
                                            <a
                                                href={`https://www.instagram.com/${username}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate flex items-center gap-1 group"
                                            >
                                                <span>@{username}</span>
                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                                            </a>
                                        </div>

                                        <a
                                            href={`https://www.instagram.com/${username}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition shrink-0 cursor-pointer"
                                        >
                                            View Profile
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mandatory Independent Platform Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated,
                    associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google,
                    X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and
                    brands are property of their respective owners.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Safe Account Auditing Architecture */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Zero-Risk Account Auditing: Why Third-Party Login Apps Get Accounts Banned
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        For years, Instagram users seeking to check who unfollowed them installed smartphone apps from app stores
                        that required entering account credentials. Meta actively flags and bans accounts utilizing these services.
                        Understanding why conventional apps compromise security highlights the value of native data exports:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-500" /> Automated Session Scraping
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                App-store tools store your authentication cookies on external proxy servers to scrape user endpoints.
                                Instagram security heuristics detect foreign IP logins and issue permanent account bans.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Consumer Privacy Rights
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Under European GDPR and California CCPA regulations, Meta must provide complete data exports on demand.
                                Auditing these files using local JavaScript is completely safe and permitted by platform rules.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> In-Memory Client Execution
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                TwisterTools reads the data within browser memory using JSZip. Your archive is never saved,
                                transmitted, or recorded on remote servers.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Step-by-Step Meta Export Guide */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Step-by-Step Guide: How to Download Your Official Instagram Data File
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Follow this 5-step walkthrough on desktop or mobile to generate the export archive:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 1</span>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Access Meta Accounts Center</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Open Instagram &gt; <strong>Settings &amp; Privacy</strong> &gt; <strong>Accounts Center</strong> &gt;{" "}
                                <strong>Your Information and Permissions</strong>.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 2</span>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Choose Specific Information</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Tap <strong>Download Your Information</strong> &gt; <strong>Download or transfer information</strong>{" "}
                                &gt; select <strong>Some of your information</strong>.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 3</span>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pick Followers and Following</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Scroll to Connections and check strictly <strong>Followers and following</strong>. This produces a small
                                archive (under 5 MB) generated in minutes.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 4</span>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Set Date Range to All Time</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Select <strong>Download to device</strong>, format as <strong>JSON</strong> (or HTML), and set Date Range
                                to <strong>All time</strong>. Click <strong>Create Files</strong>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Delta Baseline Snapshot Theory */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <History className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Baseline Delta Method: How to Catch Genuine New Unfollowers
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Raw file comparisons often return long lists including celebrity accounts, news channels, and deactivated
                        profiles you intentionally follow. The mathematical delta method isolates only genuine new unfollows:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> The Delta Formula
                            </h3>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                Let $N_1$ be your initial non-followers set and $N_2$ be a subsequent snapshot exported weeks later. The
                                genuine new unfollowers list is defined by the relative complement:
                            </p>
                            <div className="p-2.5 bg-slate-900 text-indigo-300 font-mono text-xs rounded-lg">
                                Recent Unfollowers = N₂ \ N₁ = &#123; x ∈ N₂ | x ∉ N₁ &#125;
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Accounts that were already non-followers in $N_1$ are filtered out, narrowing hundreds of entries down to
                                the exact 2 to 5 accounts that unfollowed you during that period.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Routine Workflow
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Set Baseline:</strong> Click <strong>Save Current as Baseline</strong> or drag &amp; drop an older ZIP, TXT, or CSV file into the baseline box.
                                </li>
                                <li>
                                    • <strong>Compare Export:</strong> Upload your newer Meta export ZIP into the main dropzone.
                                </li>
                                <li>
                                    • <strong>Review &amp; Export:</strong> Switch to the <strong>New Unfollows</strong> tab to inspect genuine new unfollows and download as TXT or CSV.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Is this Instagram unfollower tool safe to use with my account?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes, it is completely safe. Unlike third-party apps that require your Instagram username, password, or
                                session cookies, TwisterTools runs 100% locally in your web browser. Your ZIP data is unpacked and
                                analyzed exclusively within your browser&apos;s private memory and is never transmitted to any external
                                server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do I request my official Instagram data download ZIP?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Inside the Instagram app or desktop website, open Settings &amp; Privacy &gt; Accounts Center &gt; Your
                                Information and Permissions &gt; Download Your Information. Choose &apos;Export Specific
                                Information&apos;, pick &apos;Followers and following&apos;, select JSON or HTML format with Date Range
                                set to &apos;All time&apos;, and click Create Files. Meta will email you a secure download link containing
                                your ZIP archive.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why does the standard &apos;Don&apos;t Follow You Back&apos; list include so many accounts?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Instagram exports only contain current snapshot relationships. Your list of non-followers naturally
                                includes celebrities, brands, news outlets, and creators you voluntarily follow without expecting a follow
                                back, as well as deactivated accounts. Our Recent Unfollowers Delta feature solves this by comparing your
                                newest export against a previous snapshot to highlight only genuine new unfollows.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does the &apos;Recent Unfollowers Delta&apos; snapshot comparison work?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Save your current list of non-followers or drag and drop a previous export archive (ZIP, TXT, or CSV) into
                                the baseline section. When you upload a newer Instagram export later, the engine compares both datasets and
                                isolates only the accounts that unfollowed you between export dates.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does using this data analysis tool violate Instagram terms of service?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. This tool does not scrape Instagram, execute bot scripts, or connect to private Instagram APIs. It
                                operates strictly as a local mathematical file reader for data you are legally permitted to export from
                                Meta under GDPR and CCPA consumer privacy regulations.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}