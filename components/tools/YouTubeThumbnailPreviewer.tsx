"use client";

import React, { useState, useMemo, useId, useRef, useEffect } from "react";
import {
    Tv,
    Upload,
    RotateCcw,
    Sparkles,
    Sliders,
    Eye,
    EyeOff,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Trash2,
    Layers,
    Monitor,
    Smartphone,
    Grid,
    ZoomIn,
    ZoomOut,
    Clock,
    Flame,
    Share2,
    Info,
    Check,
    Download
} from "lucide-react";

type MockupPlatform = "desktop" | "mobile" | "search" | "sidebar";
type TimestampType = "standard" | "long" | "live" | "none";

interface OverlaySettings {
    showTimestamp: boolean;
    timestampType: TimestampType;
    customDuration: string;
    showChannelAvatar: boolean;
    showVerifiedBadge: boolean;
    showWatchLaterBtn: boolean;
    showRuleOfThirds: boolean;
    showSafeZoneMask: boolean;
    overlayOpacity: number;
    blurSimulation: number;
}

const SAMPLE_THUMBNAILS = {
    tech: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1280&q=80",
    gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1280&q=80",
    podcast: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1280&q=80"
};

export default function YouTubeThumbnailPreviewer() {
    const [imageSrc, setImageSrc] = useState<string>(SAMPLE_THUMBNAILS.tech);
    const [videoTitle, setVideoTitle] = useState<string>("Building an Enterprise Next.js App from Scratch (Full Guide)");
    const [channelName, setChannelName] = useState<string>("Twister Dev Studio");
    const [viewsCount, setViewsCount] = useState<string>("148K views");
    const [timeAgo, setTimeAgo] = useState<string>("3 days ago");
    const [activeTab, setActiveTab] = useState<MockupPlatform>("desktop");
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [copiedTitle, setCopiedTitle] = useState<boolean>(false);

    // Overlay controls
    const [settings, setSettings] = useState<OverlaySettings>({
        showTimestamp: true,
        timestampType: "standard",
        customDuration: "14:28",
        showChannelAvatar: true,
        showVerifiedBadge: true,
        showWatchLaterBtn: true,
        showRuleOfThirds: false,
        showSafeZoneMask: true,
        overlayOpacity: 85,
        blurSimulation: 0
    });

    const fileInputId = useId();
    const videoTitleId = useId();
    const channelNameId = useId();
    const durationInputId = useId();
    const opacitySliderId = useId();
    const blurSliderId = useId();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (typeof event.target?.result === "string") {
                    setImageSrc(event.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (typeof event.target?.result === "string") {
                    setImageSrc(event.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleNumberOpacity = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setSettings((prev) => ({ ...prev, overlayOpacity: 0 }));
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        setSettings((prev) => ({ ...prev, overlayOpacity: isNaN(num) ? 0 : Math.min(100, Math.max(0, num)) }));
    };

    const handleBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setSettings((prev) => ({ ...prev, blurSimulation: 0 }));
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        setSettings((prev) => ({ ...prev, blurSimulation: isNaN(num) ? 0 : Math.min(10, Math.max(0, num)) }));
    };

    const copyTitle = () => {
        navigator.clipboard.writeText(videoTitle);
        setCopiedTitle(true);
        setTimeout(() => setCopiedTitle(false), 2000);
    };

    const loadSample = (key: "tech" | "gaming" | "podcast") => {
        setImageSrc(SAMPLE_THUMBNAILS[key]);
        if (key === "tech") {
            setVideoTitle("Building an Enterprise Next.js App from Scratch (Full Guide)");
            setChannelName("Twister Dev Studio");
            setSettings((prev) => ({ ...prev, customDuration: "18:42", timestampType: "standard" }));
        } else if (key === "gaming") {
            setVideoTitle("UNBELIEVABLE Comeback in Grand Finals! (Rank #1 Gameplay)");
            setChannelName("Apex Tactics");
            setSettings((prev) => ({ ...prev, customDuration: "32:10", timestampType: "standard" }));
        } else {
            setVideoTitle("Ep 104: How Silicon Valley Foundries Shape AI Hardware");
            setChannelName("Silicon Deep Dive Podcast");
            setSettings((prev) => ({ ...prev, customDuration: "1:14:05", timestampType: "long" }));
        }
    };

    const timestampLabel = useMemo(() => {
        if (settings.timestampType === "live") return "LIVE";
        if (settings.timestampType === "none") return "";
        return settings.customDuration || "12:34";
    }, [settings.timestampType, settings.customDuration]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "YouTube Video Thumbnail Safe Zone & Overlay Inspector",
        "url": "https://twistertools.com/tools/social-tools/youtube-thumbnail-previewer",
        "description": "Inspect YouTube thumbnail safe zones, bottom-right timestamp badge collisions, Watch Later buttons, and mobile UI crop behavior in high-definition 16:9 mockup environments.",
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
                "name": "What are the exact pixel dimensions and aspect ratio for YouTube thumbnails?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "YouTube mandates an aspect ratio of 16:9. The optimal upload resolution is 1280 x 720 pixels, with a minimum width of 640 pixels. Supported file formats include JPG, PNG, GIF, and WEBP under a 2MB file size ceiling for standard videos (10MB for podcasts)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the YouTube thumbnail 'Danger Zone'?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The danger zone occupies the bottom-right corner of your thumbnail, roughly 18% to 25% of the width and 12% to 18% of the height. YouTube automatically renders video duration timestamps or 'LIVE' tags directly in this space across all devices. Placing critical focal points, typography, or facial features here results in total obstruction."
                }
            },
            {
                "@type": "Question",
                "name": "Why is a squint or blur test crucial for thumbnail click-through rates (CTR)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Over 70% of YouTube views originate on mobile screens where thumbnails appear as small as 140 pixels wide. The squint test, simulated here with Gaussian blur, verifies if your visual hierarchy, high-contrast focal points, and typography remain instantly identifiable at glance scale in a crowded feed."
                }
            },
            {
                "@type": "Question",
                "name": "Does the YouTube Watch Later overlay block the top-right corner?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. On desktop web browsers, hovering over any video card reveals a dark gradient scrim alongside 'Watch Later' (clock) and 'Add to Queue' buttons in the upper-right corner. Important logos or details placed along the top edge can be obscured when desktop users browse."
                }
            },
            {
                "@type": "Question",
                "name": "How does YouTube mobile feed scaling affect thumbnail visibility?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "On the YouTube mobile app for iOS and Android, timestamps render slightly larger relative to screen real estate, and channel avatars sit below the frame along with bold multi-line video titles. Thin strokes, low-contrast text, and busy micro-details lose visual prominence on handheld screens."
                }
            },
            {
                "@type": "Question",
                "name": "Are uploaded thumbnails stored or sent to any external server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools executes 100% client-side in your web browser. Uploaded images are converted directly into local object memory via FileReader and never touch our servers or any cloud infrastructure, ensuring absolute privacy."
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

            {/* 12-Column Responsive Workspace Grid (Asymmetrical 5/7) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration Controls (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Inspector Settings
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                setImageSrc(SAMPLE_THUMBNAILS.tech);
                                setVideoTitle("Building an Enterprise Next.js App from Scratch (Full Guide)");
                                setChannelName("Twister Dev Studio");
                                setSettings({
                                    showTimestamp: true,
                                    timestampType: "standard",
                                    customDuration: "14:28",
                                    showChannelAvatar: true,
                                    showVerifiedBadge: true,
                                    showWatchLaterBtn: true,
                                    showRuleOfThirds: false,
                                    showSafeZoneMask: true,
                                    overlayOpacity: 85,
                                    blurSimulation: 0
                                });
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            aria-label="Reset all settings to default"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Image Upload Area */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Thumbnail Graphic (16:9 Recommended)
                        </label>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${isDragging
                                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40"
                                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                id={fileInputId}
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleFileChange}
                                className="hidden"
                                aria-label="Upload thumbnail image file"
                            />
                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    Click to browse or drop an image
                                </p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                    PNG, JPG, or WEBP up to 10MB (1280x720 ideal)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sample Thumbnail Presets */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => loadSample("tech")}
                            className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Tech Sample</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => loadSample("gaming")}
                            className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                            <Flame className="w-3.5 h-3.5 text-amber-500" />
                            <span>Gaming Sample</span>
                        </button>
                    </div>

                    {/* Video Metadata Configuration */}
                    <div className="space-y-3 pt-1">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Mockup Metadata
                        </label>
                        <div className="space-y-2">
                            <div>
                                <label htmlFor={videoTitleId} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Video Title:
                                </label>
                                <input
                                    id={videoTitleId}
                                    type="text"
                                    value={videoTitle}
                                    onChange={(e) => setVideoTitle(e.target.value)}
                                    aria-label="YouTube video title"
                                    className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor={channelNameId} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Channel Name:
                                    </label>
                                    <input
                                        id={channelNameId}
                                        type="text"
                                        value={channelName}
                                        onChange={(e) => setChannelName(e.target.value)}
                                        aria-label="Channel name"
                                        className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={durationInputId} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Duration Badge:
                                    </label>
                                    <input
                                        id={durationInputId}
                                        type="text"
                                        value={settings.customDuration}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, customDuration: e.target.value }))}
                                        aria-label="Video timestamp duration"
                                        placeholder="14:28"
                                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timestamp Type Selector */}
                    <div className="space-y-2 pt-1">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Badge Collision Type
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {(["standard", "long", "live", "none"] as TimestampType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        setSettings((prev) => ({
                                            ...prev,
                                            timestampType: type,
                                            customDuration:
                                                type === "standard"
                                                    ? "14:28"
                                                    : type === "long"
                                                        ? "1:45:12"
                                                        : prev.customDuration
                                        }));
                                    }}
                                    className={`py-2 px-2 text-xs font-semibold rounded-xl border capitalize transition cursor-pointer text-center ${settings.timestampType === type
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Overlays & Safe Zone Checkboxes */}
                    <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Diagnostic Overlays
                        </label>
                        <div className="space-y-2.5">
                            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={settings.showSafeZoneMask}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, showSafeZoneMask: e.target.checked }))}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Highlight Dangerous Bottom-Right Block Zone</span>
                            </label>
                            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={settings.showRuleOfThirds}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, showRuleOfThirds: e.target.checked }))}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Display 3x3 Rule of Thirds Composition Grid</span>
                            </label>
                            <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={settings.showWatchLaterBtn}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, showWatchLaterBtn: e.target.checked }))}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                />
                                <span>Desktop Hover Watch Later / Queue Scrim</span>
                            </label>
                        </div>
                    </div>

                    {/* Squint / Blur Test Slider */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <label htmlFor={blurSliderId} className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                Mobile Squint Test (Simulated Blur)
                            </label>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                {settings.blurSimulation}px
                            </span>
                        </div>
                        <input
                            id={blurSliderId}
                            type="range"
                            min={0}
                            max={8}
                            step={1}
                            value={settings.blurSimulation}
                            onChange={handleBlurChange}
                            aria-label="Thumbnail blur simulation slider"
                            className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                            Simulates how the eye perceives focal points at a glance on low-contrast mobile screens.
                        </p>
                    </div>

                    {/* Overlay Opacity Slider */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                            <label htmlFor={opacitySliderId} className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Mask Warning Opacity
                            </label>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                {settings.overlayOpacity}%
                            </span>
                        </div>
                        <input
                            id={opacitySliderId}
                            type="range"
                            min={10}
                            max={100}
                            step={5}
                            value={settings.overlayOpacity}
                            onChange={handleNumberOpacity}
                            aria-label="Diagnostic mask opacity slider"
                            className="w-full accent-indigo-600 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Right Panel: Interactive Canvas & Feed Previews (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0">
                    {/* View Switcher Bar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm flex items-center justify-between gap-1 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab("desktop")}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "desktop"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                        >
                            <Monitor className="w-3.5 h-3.5" /> Desktop Feed
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("mobile")}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "mobile"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                        >
                            <Smartphone className="w-3.5 h-3.5" /> Mobile App
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("sidebar")}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "sidebar"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                        >
                            <Layers className="w-3.5 h-3.5" /> Up Next Sidebar
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("search")}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === "search"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Search Result
                        </button>
                    </div>

                    {/* Master Simulation Sandbox */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Simulated Environment: {activeTab}
                                </span>
                            </div>
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                16:9 Aspect Ratio
                            </span>
                        </div>

                        {/* DESKTOP FEED MOCKUP */}
                        {activeTab === "desktop" && (
                            <div className="max-w-md mx-auto space-y-3">
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 shadow-md group">
                                    <img
                                        src={imageSrc}
                                        alt="Uploaded YouTube Thumbnail Preview"
                                        className="w-full h-full object-cover transition duration-150"
                                        style={{ filter: `blur(${settings.blurSimulation}px)` }}
                                    />

                                    {/* Rule of Thirds Grid */}
                                    {settings.showRuleOfThirds && (
                                        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20">
                                            <div className="border-r border-b border-white/40 border-dashed" />
                                            <div className="border-r border-b border-white/40 border-dashed" />
                                            <div className="border-b border-white/40 border-dashed" />
                                            <div className="border-r border-b border-white/40 border-dashed" />
                                            <div className="border-r border-b border-white/40 border-dashed" />
                                            <div className="border-b border-white/40 border-dashed" />
                                            <div className="border-r border-white/40 border-dashed" />
                                            <div className="border-r border-white/40 border-dashed" />
                                            <div />
                                        </div>
                                    )}

                                    {/* Safe Zone Danger Mask */}
                                    {settings.showSafeZoneMask && (
                                        <div
                                            className="absolute bottom-0 right-0 w-[28%] h-[24%] rounded-tl-xl border-t-2 border-l-2 border-rose-500/80 pointer-events-none z-20 flex flex-col items-center justify-center p-1"
                                            style={{
                                                backgroundColor: `rgba(225, 29, 72, ${settings.overlayOpacity / 100 * 0.4})`
                                            }}
                                        >
                                            <span className="text-[9px] font-black text-white bg-rose-600/90 px-1 py-0.2 rounded uppercase tracking-wider text-center">
                                                Danger Zone
                                            </span>
                                        </div>
                                    )}

                                    {/* Watch Later Hover Scrim */}
                                    {settings.showWatchLaterBtn && (
                                        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20 opacity-90 group-hover:opacity-100 transition">
                                            <div className="w-7 h-7 rounded-md bg-black/80 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
                                                <Clock className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="w-7 h-7 rounded-md bg-black/80 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
                                                <Layers className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom-Right YouTube Timestamp Badge */}
                                    {settings.showTimestamp && settings.timestampType !== "none" && (
                                        <div
                                            className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-tight z-30 shadow-md ${settings.timestampType === "live"
                                                    ? "bg-rose-600 text-white flex items-center gap-1"
                                                    : "bg-black/85 text-white backdrop-blur-xs"
                                                }`}
                                        >
                                            {settings.timestampType === "live" && <Flame className="w-3 h-3 fill-current" />}
                                            {timestampLabel}
                                        </div>
                                    )}
                                </div>

                                {/* Desktop Meta Card */}
                                <div className="flex items-start gap-3 pt-1">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                        TT
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                                            {videoTitle || "Your YouTube Video Title Goes Here"}
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                            <span>{channelName}</span>
                                            {settings.showVerifiedBadge && (
                                                <CheckCircle2 className="w-3 h-3 text-slate-500 fill-slate-300 dark:fill-slate-700" />
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300">
                                            {viewsCount} • {timeAgo}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MOBILE FEED MOCKUP */}
                        {activeTab === "mobile" && (
                            <div className="max-w-[340px] mx-auto border border-slate-200 dark:border-slate-800 rounded-3xl p-3 bg-slate-50 dark:bg-slate-950 shadow-inner space-y-3">
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                                    <img
                                        src={imageSrc}
                                        alt="Uploaded YouTube Thumbnail Preview Mobile"
                                        className="w-full h-full object-cover"
                                        style={{ filter: `blur(${settings.blurSimulation}px)` }}
                                    />
                                    {settings.showSafeZoneMask && (
                                        <div
                                            className="absolute bottom-0 right-0 w-[30%] h-[26%] rounded-tl-lg border-t-2 border-l-2 border-rose-500 pointer-events-none z-20 flex items-center justify-center"
                                            style={{
                                                backgroundColor: `rgba(225, 29, 72, ${settings.overlayOpacity / 100 * 0.4})`
                                            }}
                                        >
                                            <span className="text-[8px] font-black text-white bg-rose-600 px-1 rounded uppercase">
                                                Overlay
                                            </span>
                                        </div>
                                    )}
                                    {settings.showTimestamp && settings.timestampType !== "none" && (
                                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/90 text-white z-30">
                                            {timestampLabel}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-start gap-2.5 px-1">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                        TT
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                                            {videoTitle}
                                        </p>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                            {channelName} • {viewsCount} • {timeAgo}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* UP NEXT SIDEBAR MOCKUP */}
                        {activeTab === "sidebar" && (
                            <div className="max-w-md mx-auto space-y-3 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                                    Suggested Watch Next Column:
                                </span>
                                <div className="flex items-start gap-2.5">
                                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-black">
                                        <img
                                            src={imageSrc}
                                            alt="Thumbnail Sidebar Simulation"
                                            className="w-full h-full object-cover"
                                            style={{ filter: `blur(${settings.blurSimulation}px)` }}
                                        />
                                        {settings.showSafeZoneMask && (
                                            <div
                                                className="absolute bottom-0 right-0 w-[35%] h-[32%] rounded-tl-md border-t border-l border-rose-500 z-10"
                                                style={{
                                                    backgroundColor: `rgba(225, 29, 72, ${settings.overlayOpacity / 100 * 0.4})`
                                                }}
                                            />
                                        )}
                                        {settings.showTimestamp && (
                                            <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-black/90 text-white z-20">
                                                {timestampLabel}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                                            {videoTitle}
                                        </p>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate">{channelName}</p>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-300">
                                            {viewsCount} • {timeAgo}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SEARCH RESULT MOCKUP */}
                        {activeTab === "search" && (
                            <div className="max-w-xl mx-auto space-y-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="flex flex-col sm:flex-row items-start gap-3">
                                    <div className="relative w-full sm:w-56 aspect-video rounded-xl overflow-hidden shrink-0 bg-black">
                                        <img
                                            src={imageSrc}
                                            alt="Thumbnail Search Simulation"
                                            className="w-full h-full object-cover"
                                            style={{ filter: `blur(${settings.blurSimulation}px)` }}
                                        />
                                        {settings.showSafeZoneMask && (
                                            <div
                                                className="absolute bottom-0 right-0 w-[28%] h-[26%] rounded-tl-lg border-t border-l border-rose-500 z-10"
                                                style={{
                                                    backgroundColor: `rgba(225, 29, 72, ${settings.overlayOpacity / 100 * 0.4})`
                                                }}
                                            />
                                        )}
                                        {settings.showTimestamp && (
                                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/90 text-white z-20">
                                                {timestampLabel}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1 min-w-0 py-0.5">
                                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                                            {videoTitle}
                                        </h4>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                            {viewsCount} • {timeAgo}
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                                                TT
                                            </div>
                                            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                                                {channelName}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Real-Time Safety Audit Checklist */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                                Safe Zone Compliance Audit
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-semibold text-slate-900 dark:text-white">Bottom-Right Safe Zone</p>
                                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                            Keep faces & key text outside the bottom 25% quadrant.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-semibold text-slate-900 dark:text-white">Glance Legibility</p>
                                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                            Focal point remains clear under 3px to 4px blur simulation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Copy Title Action */}
                        <button
                            type="button"
                            onClick={copyTitle}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copiedTitle
                                    ? "bg-emerald-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                        >
                            {copiedTitle ? (
                                <>
                                    <Check className="w-4 h-4 text-white" />
                                    <span>Copied Title to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4 text-white" />
                                    <span>Copy Formatted Video Title</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mandatory Platform Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Anatomy of YouTube Thumbnail Safe Zones */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Anatomy of YouTube Thumbnail Safe Zones: Avoid Costly Timestamp Collisions
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        YouTube video thumbnails are the single most influential determinant of impression click-through rate (CTR). Yet thousands of creators unknowingly place crucial narrative elements, expressive facial details, or bold headlines directly inside interface &ldquo;kill zones&rdquo; where YouTube automatically stamps dynamic UI overlays.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Bottom-Right Timestamp
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                YouTube renders a high-contrast black duration pill or red LIVE badge in the lower-right corner. It consumes roughly 25% of the thumbnail&apos;s bottom width and 15% of its height across phone and tablet screens.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Desktop Hover Actions
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                On desktop web browsing feeds, mouse movement over any video card displays dark gradient scrims and stacked &ldquo;Watch Later&rdquo; and &ldquo;Add to Queue&rdquo; icons in the upper-right corner.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> The Squint Test Matrix
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Browsing feeds present thumbnails alongside dozens of competitor cards. Testing your visual contrast with simulated Gaussian blur guarantees that the core value proposition communicates in under 500 milliseconds.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Specification Specs Comparison Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            YouTube Thumbnail Specifications & Display Surfaces Reference
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Different YouTube client applications present thumbnails at dramatically varied pixel dimensions. Understanding target resolutions prevents blurry scaling artifacts:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Display Surface</th>
                                    <th className="p-3">Rendered Dimensions</th>
                                    <th className="p-3">Primary Safe Zone Rule</th>
                                    <th className="p-3">Risk Factor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Desktop Homepage / Subscriptions</td>
                                    <td className="p-3 font-mono">360 x 202 px (approx)</td>
                                    <td className="p-3">Keep right 20% clear of fine typography</td>
                                    <td className="p-3 text-amber-600 font-bold">Medium (Hover Scrim)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Mobile Home Feed (iOS / Android)</td>
                                    <td className="p-3 font-mono">390 x 219 px (full-bleed)</td>
                                    <td className="p-3">Emphasize large high-contrast primary focal points</td>
                                    <td className="p-3 text-rose-600 font-bold">Critical (Large Pill)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Watch Next / Sidebar Suggestions</td>
                                    <td className="p-3 font-mono">168 x 94 px</td>
                                    <td className="p-3">Limit text to 3 short words maximum</td>
                                    <td className="p-3 text-rose-600 font-bold">Severe (Micro scale)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">YouTube Search Results</td>
                                    <td className="p-3 font-mono">360 x 202 px (list view)</td>
                                    <td className="p-3">Align with search intent and video headline</td>
                                    <td className="p-3 text-emerald-600 font-bold">Low</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5 Golden Rules for 10%+ Thumbnail CTR */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            5 Proven Design Rules for High-Converting YouTube Thumbnails
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Top YouTube creators analyze every square inch of their thumbnails before publishing. Adopt these five packaging heuristics to safeguard your organic distribution:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for Visual Impact
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Isolate the Focal Subject to Left or Center:</strong> Position expressive facial reactions, key products, or primary charts on the left two-thirds of the canvas.
                                </li>
                                <li>
                                    • <strong>Restrict Overlay Copy to Under 4 Words:</strong> Do not repeat the exact video title in your thumbnail graphic. Offer complementary curiosity instead.
                                </li>
                                <li>
                                    • <strong>Maximize Figure-Ground Contrast:</strong> Ensure at least a 3:1 luminance contrast ratio between foreground cutouts and background environments.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Fatal Flaws to Eliminate
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Placing Small Subtitles in the Lower-Right:</strong> Any text positioned along the bottom-right corner will be covered entirely by the duration badge.
                                </li>
                                <li>
                                    • <strong>Low-Contrast Pastel Elements:</strong> Subdued color palettes wash out under mobile sunlight and dark-mode system themes.
                                </li>
                                <li>
                                    • <strong>Cluttered Multi-Object Compositions:</strong> Thumbnails containing more than three distinct visual focal points confuse prospective viewers.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended FAQ */}
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
                                What are the exact pixel dimensions and aspect ratio for YouTube thumbnails?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                YouTube mandates an aspect ratio of 16:9. The optimal upload resolution is 1280 x 720 pixels, with a minimum width of 640 pixels. Supported file formats include JPG, PNG, GIF, and WEBP under a 2MB file size ceiling for standard videos (10MB for podcasts).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the YouTube thumbnail &ldquo;Danger Zone&rdquo;?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The danger zone occupies the bottom-right corner of your thumbnail, roughly 18% to 25% of the width and 12% to 18% of the height. YouTube automatically renders video duration timestamps or &ldquo;LIVE&rdquo; tags directly in this space across all devices. Placing critical focal points, typography, or facial features here results in total obstruction.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why is a squint or blur test crucial for thumbnail click-through rates (CTR)?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Over 70% of YouTube views originate on mobile screens where thumbnails appear as small as 140 pixels wide. The squint test, simulated here with Gaussian blur, verifies if your visual hierarchy, high-contrast focal points, and typography remain instantly identifiable at glance scale in a crowded feed.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does the YouTube Watch Later overlay block the top-right corner?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. On desktop web browsers, hovering over any video card reveals a dark gradient scrim alongside &ldquo;Watch Later&rdquo; (clock) and &ldquo;Add to Queue&rdquo; buttons in the upper-right corner. Important logos or details placed along the top edge can be obscured when desktop users browse.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does YouTube mobile feed scaling affect thumbnail visibility?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                On the YouTube mobile app for iOS and Android, timestamps render slightly larger relative to screen real estate, and channel avatars sit below the frame along with bold multi-line video titles. Thin strokes, low-contrast text, and busy micro-details lose visual prominence on handheld screens.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Are uploaded thumbnails stored or sent to any external server?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. TwisterTools executes 100% client-side in your web browser. Uploaded images are converted directly into local object memory via FileReader and never touch our servers or any cloud infrastructure, ensuring absolute privacy.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}