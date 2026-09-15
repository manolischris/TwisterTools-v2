"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import {
    Activity,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Layers,
    RotateCcw,
    Sparkles,
    FileCheck,
    Info,
    Shield,
    Terminal,
    Cpu,
    Monitor,
    Smartphone,
    Network,
    Code,
    Sliders,
    Globe,
    Lock,
    ExternalLink
} from "lucide-react";

interface ClientHintsData {
    architecture?: string;
    bitness?: string;
    brands?: Array<{ brand: string; version: string }>;
    fullVersionList?: Array<{ brand: string; version: string }>;
    mobile?: boolean;
    model?: string;
    platform?: string;
    platformVersion?: string;
    uaFullVersion?: string;
    wow64?: boolean;
    formFactor?: string[];
}

interface SimulatedPreset {
    name: string;
    description: string;
    mobile: boolean;
    platform: string;
    platformVersion: string;
    architecture: string;
    bitness: string;
    model: string;
    brands: Array<{ brand: string; version: string }>;
    fullVersionList: Array<{ brand: string; version: string }>;
    formFactor: string[];
    wow64: boolean;
    viewportWidth: number;
    dpr: number;
    saveData: boolean;
}

const PRESETS: Record<string, SimulatedPreset> = {
    chromeDesktop: {
        name: "Google Chrome (Desktop Mac M3)",
        description: "Modern Chromium instance running on ARM64 Apple Silicon",
        mobile: false,
        platform: "macOS",
        platformVersion: "14.5.0",
        architecture: "arm",
        bitness: "64",
        model: "",
        brands: [
            { brand: "Chromium", version: "128" },
            { brand: "Google Chrome", version: "128" },
            { brand: "Not;A=Brand", version: "24" }
        ],
        fullVersionList: [
            { brand: "Chromium", version: "128.0.6613.114" },
            { brand: "Google Chrome", version: "128.0.6613.114" },
            { brand: "Not;A=Brand", version: "24.0.0.0" }
        ],
        formFactor: ["Desktop"],
        wow64: false,
        viewportWidth: 1920,
        dpr: 2,
        saveData: false
    },
    pixelAndroid: {
        name: "Google Pixel 8 Pro (Android 14)",
        description: "Mobile high-entropy client hint footprint on Google Tensor G3",
        mobile: true,
        platform: "Android",
        platformVersion: "14.0.0",
        architecture: "arm64",
        bitness: "64",
        model: "Pixel 8 Pro",
        brands: [
            { brand: "Chromium", version: "128" },
            { brand: "Google Chrome", version: "128" },
            { brand: "Not;A=Brand", version: "24" }
        ],
        fullVersionList: [
            { brand: "Chromium", version: "128.0.6613.88" },
            { brand: "Google Chrome", version: "128.0.6613.88" },
            { brand: "Not;A=Brand", version: "24.0.0.0" }
        ],
        formFactor: ["Mobile", "Handset"],
        wow64: false,
        viewportWidth: 412,
        dpr: 3.5,
        saveData: false
    },
    edgeWindows: {
        name: "Microsoft Edge (Windows 11 x64)",
        description: "Corporate enterprise Chromium browser on x86-64 Architecture",
        mobile: false,
        platform: "Windows",
        platformVersion: "15.0.0",
        architecture: "x86",
        bitness: "64",
        model: "",
        brands: [
            { brand: "Chromium", version: "128" },
            { brand: "Microsoft Edge", version: "128" },
            { brand: "Not;A=Brand", version: "24" }
        ],
        fullVersionList: [
            { brand: "Chromium", version: "128.0.2739.67" },
            { brand: "Microsoft Edge", version: "128.0.2739.67" },
            { brand: "Not;A=Brand", version: "24.0.0.0" }
        ],
        formFactor: ["Desktop"],
        wow64: false,
        viewportWidth: 1440,
        dpr: 1.25,
        saveData: false
    }
};

export default function ClientHintsInspector() {
    // Inspection Mode: live browser probe or manual simulator
    const [mode, setMode] = useState<"live" | "simulator">("live");

    // Live Inspection State
    const [isSupported, setIsSupported] = useState<boolean>(false);
    const [liveLowEntropy, setLiveLowEntropy] = useState<{
        brands: Array<{ brand: string; version: string }>;
        mobile: boolean;
        platform: string;
    }>({
        brands: [],
        mobile: false,
        platform: ""
    });
    const [liveHighEntropy, setLiveHighEntropy] = useState<ClientHintsData | null>(null);
    const [highEntropyRequested, setHighEntropyRequested] = useState<boolean>(false);
    const [isLoadingHigh, setIsLoadingHigh] = useState<boolean>(false);
    const [rawLegacyUA, setRawLegacyUA] = useState<string>("");
    const [liveWindowMetrics, setLiveWindowMetrics] = useState<{ viewportWidth: number; dpr: number }>({
        viewportWidth: 1280,
        dpr: 1
    });

    // Simulator Configuration State
    const [simPreset, setSimPreset] = useState<string>("chromeDesktop");
    const [simMobile, setSimMobile] = useState<boolean>(false);
    const [simPlatform, setSimPlatform] = useState<string>("macOS");
    const [simPlatformVersion, setSimPlatformVersion] = useState<string>("14.5.0");
    const [simArchitecture, setSimArchitecture] = useState<string>("arm");
    const [simBitness, setSimBitness] = useState<string>("64");
    const [simModel, setSimModel] = useState<string>("");
    const [simBrand, setSimBrand] = useState<string>("Google Chrome");
    const [simMajorVersion, setSimMajorVersion] = useState<string>("128");
    const [simFullVersion, setSimFullVersion] = useState<string>("128.0.6613.114");
    const [simViewportWidth, setSimViewportWidth] = useState<number>(1920);
    const [simDpr, setSimDpr] = useState<number>(2.0);
    const [simSaveData, setSimSaveData] = useState<boolean>(false);
    const [simFormFactor, setSimFormFactor] = useState<string>("Desktop");

    // Output State
    const [copiedHeader, setCopiedHeader] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<"http" | "meta" | "json" | "nginx">("http");

    // Accessibility IDs
    const presetSelectId = useId();
    const platformInputId = useId();
    const platformVerInputId = useId();
    const modelInputId = useId();
    const archSelectId = useId();
    const bitnessSelectId = useId();
    const brandInputId = useId();
    const majorVerInputId = useId();
    const fullVerInputId = useId();
    const widthInputId = useId();
    const dprInputId = useId();
    const formFactorInputId = useId();

    // Initial Live User-Agent Client Hints Detection
    useEffect(() => {
        if (typeof window !== "undefined") {
            setLiveWindowMetrics({
                viewportWidth: window.innerWidth,
                dpr: window.devicePixelRatio || 1
            });

            const handleResize = () => {
                setLiveWindowMetrics({
                    viewportWidth: window.innerWidth,
                    dpr: window.devicePixelRatio || 1
                });
            };
            window.addEventListener("resize", handleResize);

            setRawLegacyUA(window.navigator.userAgent);
            const nav = window.navigator as unknown as {
                userAgentData?: {
                    brands: Array<{ brand: string; version: string }>;
                    mobile: boolean;
                    platform: string;
                    getHighEntropyValues: (hints: string[]) => Promise<ClientHintsData>;
                };
            };

            if (nav.userAgentData) {
                setIsSupported(true);
                setLiveLowEntropy({
                    brands: nav.userAgentData.brands || [],
                    mobile: Boolean(nav.userAgentData.mobile),
                    platform: nav.userAgentData.platform || "Unknown"
                });
            } else {
                setIsSupported(false);
            }

            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);

    // Query High-Entropy Hints on Demand via client API
    const handleRequestHighEntropy = async () => {
        if (typeof window === "undefined") return;
        const nav = window.navigator as unknown as {
            userAgentData?: {
                getHighEntropyValues: (hints: string[]) => Promise<ClientHintsData>;
            };
        };

        if (nav.userAgentData?.getHighEntropyValues) {
            setIsLoadingHigh(true);
            try {
                const high = await nav.userAgentData.getHighEntropyValues([
                    "architecture",
                    "bitness",
                    "brands",
                    "fullVersionList",
                    "mobile",
                    "model",
                    "platform",
                    "platformVersion",
                    "uaFullVersion",
                    "wow64",
                    "formFactor"
                ]);
                setLiveHighEntropy(high);
                setHighEntropyRequested(true);
            } catch {
                setHighEntropyRequested(false);
            } finally {
                setIsLoadingHigh(false);
            }
        }
    };

    // Load Simulator Presets
    const applyPreset = (presetKey: string) => {
        const p = PRESETS[presetKey];
        if (!p) return;
        setSimPreset(presetKey);
        setSimMobile(p.mobile);
        setSimPlatform(p.platform);
        setSimPlatformVersion(p.platformVersion);
        setSimArchitecture(p.architecture);
        setSimBitness(p.bitness);
        setSimModel(p.model);
        if (p.brands.length > 0) {
            setSimBrand(p.brands[0].brand);
            setSimMajorVersion(p.brands[0].version);
        }
        if (p.fullVersionList.length > 0) {
            setSimFullVersion(p.fullVersionList[0].version);
        }
        setSimViewportWidth(p.viewportWidth);
        setSimDpr(p.dpr);
        setSimSaveData(p.saveData);
        setSimFormFactor(p.formFactor[0] || "Desktop");
    };

    // Handle number sanitize without leading zeroes
    const handleViewportWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setSimViewportWidth(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        setSimViewportWidth(isNaN(num) ? 0 : num);
    };

    const handleDprChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setSimDpr(0);
            return;
        }
        const num = parseFloat(raw);
        setSimDpr(isNaN(num) ? 1 : num);
    };

    // Synthesize Active Hints based on Live or Simulator state
    const activeHints = useMemo(() => {
        if (mode === "live") {
            const hasHigh = highEntropyRequested && liveHighEntropy;
            return {
                isLive: true,
                mobile: hasHigh ? Boolean(liveHighEntropy?.mobile) : liveLowEntropy.mobile,
                platform: (hasHigh && liveHighEntropy?.platform) ? liveHighEntropy.platform : (liveLowEntropy.platform || "Unknown"),
                platformVersion: liveHighEntropy?.platformVersion || "Not Requested (Requires Accept-CH)",
                architecture: liveHighEntropy?.architecture || "Not Requested (Requires Accept-CH)",
                bitness: liveHighEntropy?.bitness || "Not Requested (Requires Accept-CH)",
                model: liveHighEntropy?.model ? `"${liveHighEntropy.model}"` : (hasHigh ? `""` : "Not Requested"),
                brands: liveLowEntropy.brands.length > 0 ? liveLowEntropy.brands : [{ brand: "Not Detected", version: "0" }],
                fullVersions: liveHighEntropy?.fullVersionList || [],
                viewportWidth: liveWindowMetrics.viewportWidth,
                dpr: liveWindowMetrics.dpr,
                saveData: false,
                formFactor: liveHighEntropy?.formFactor ? liveHighEntropy.formFactor.join(", ") : "Not Provided"
            };
        }

        return {
            isLive: false,
            mobile: simMobile,
            platform: simPlatform,
            platformVersion: simPlatformVersion,
            architecture: simArchitecture,
            bitness: simBitness,
            model: simModel ? `"${simModel}"` : `""`,
            brands: [
                { brand: simBrand, version: simMajorVersion },
                { brand: "Chromium", version: simMajorVersion },
                { brand: "Not?A_Brand", version: "24" }
            ],
            fullVersions: [
                { brand: simBrand, version: simFullVersion },
                { brand: "Chromium", version: simFullVersion },
                { brand: "Not?A_Brand", version: "24.0.0.0" }
            ],
            viewportWidth: simViewportWidth,
            dpr: simDpr,
            saveData: simSaveData,
            formFactor: simFormFactor
        };
    }, [
        mode,
        liveLowEntropy,
        liveHighEntropy,
        highEntropyRequested,
        liveWindowMetrics,
        simMobile,
        simPlatform,
        simPlatformVersion,
        simArchitecture,
        simBitness,
        simModel,
        simBrand,
        simMajorVersion,
        simFullVersion,
        simViewportWidth,
        simDpr,
        simSaveData,
        simFormFactor
    ]);

    // Computed Output Strings
    const formattedBrandString = useMemo(() => {
        return activeHints.brands.map(b => `"${b.brand}";v="${b.version}"`).join(", ");
    }, [activeHints.brands]);

    const formattedFullVersionString = useMemo(() => {
        if (activeHints.fullVersions.length > 0) {
            return activeHints.fullVersions.map(b => `"${b.brand}";v="${b.version}"`).join(", ");
        }
        return `"${simBrand}";v="${simFullVersion}"`;
    }, [activeHints.fullVersions, simBrand, simFullVersion]);

    const headersText = useMemo(() => {
        const lines: string[] = [
            `# Low-Entropy Client Hints (Transmitted by Default)`,
            `Sec-CH-UA: ${formattedBrandString}`,
            `Sec-CH-UA-Mobile: ${activeHints.mobile ? "?1" : "?0"}`,
            `Sec-CH-UA-Platform: "${activeHints.platform}"`,
            ``,
            `# High-Entropy Client Hints (Server must opt in via Accept-CH)`,
            `Sec-CH-UA-Platform-Version: "${activeHints.platformVersion}"`,
            `Sec-CH-UA-Arch: "${activeHints.architecture}"`,
            `Sec-CH-UA-Bitness: "${activeHints.bitness}"`,
            `Sec-CH-UA-Model: ${activeHints.model.startsWith('"') ? activeHints.model : `"${activeHints.model}"`}`,
            `Sec-CH-UA-Full-Version-List: ${formattedFullVersionString}`,
            `Sec-CH-Viewport-Width: ${activeHints.viewportWidth}`,
            `Sec-CH-DPR: ${activeHints.dpr}`,
            `Sec-CH-Prefers-Reduced-Data: ${activeHints.saveData ? "?1" : "?0"}`
        ];
        return lines.join("\n");
    }, [formattedBrandString, activeHints, formattedFullVersionString]);

    const serverAcceptCH = useMemo(() => {
        return `Accept-CH: Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Model, Sec-CH-UA-Full-Version-List, Sec-CH-Viewport-Width, Sec-CH-DPR, Sec-CH-Prefers-Reduced-Data\nCritical-CH: Sec-CH-UA-Platform-Version, Sec-CH-UA-Model\nPermissions-Policy: ch-ua-platform-version=(self), ch-ua-model=(self), ch-ua-arch=(self)`;
    }, []);

    const metaTagCode = useMemo(() => {
        return `<meta http-equiv="Accept-CH" content="Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Model, Sec-CH-UA-Full-Version-List, Sec-CH-Viewport-Width, Sec-CH-DPR" />`;
    }, []);

    const nginxConfig = useMemo(() => {
        return `# Nginx Reverse Proxy / Web Server Configuration for Client Hints\nadd_header Accept-CH "Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Model, Sec-CH-UA-Full-Version-List, Sec-CH-Viewport-Width, Sec-CH-DPR" always;\nadd_header Permissions-Policy "ch-ua-platform-version=(self), ch-ua-model=(self), ch-ua-arch=(self)" always;\n\n# Optional: Ensure upstream CDN caching partitions correctly on high-entropy hints\nproxy_set_header Sec-CH-UA $http_sec_ch_ua;\nproxy_set_header Sec-CH-UA-Mobile $http_sec_ch_ua_mobile;\nproxy_set_header Sec-CH-UA-Platform $http_sec_ch_ua_platform;`;
    }, []);

    const jsonExport = useMemo(() => {
        return JSON.stringify({
            client_hints: {
                low_entropy: {
                    "Sec-CH-UA": activeHints.brands,
                    "Sec-CH-UA-Mobile": activeHints.mobile,
                    "Sec-CH-UA-Platform": activeHints.platform
                },
                high_entropy: {
                    "Sec-CH-UA-Platform-Version": activeHints.platformVersion,
                    "Sec-CH-UA-Arch": activeHints.architecture,
                    "Sec-CH-UA-Bitness": activeHints.bitness,
                    "Sec-CH-UA-Model": activeHints.model.replace(/"/g, ""),
                    "Sec-CH-UA-Full-Version-List": activeHints.fullVersions,
                    "Sec-CH-Viewport-Width": activeHints.viewportWidth,
                    "Sec-CH-DPR": activeHints.dpr,
                    "Sec-CH-Prefers-Reduced-Data": activeHints.saveData
                }
            },
            meta: {
                generated_by: "TwisterTools UA-CH Inspector",
                rfc_standards: ["RFC 8942", "RFC 8941", "W3C UA-CH Specification"]
            }
        }, null, 2);
    }, [activeHints]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedHeader(label);
        setTimeout(() => setCopiedHeader(null), 2000);
    };

    const handleResetSimulator = () => {
        applyPreset("chromeDesktop");
    };

    // Schema.org Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Browser User-Agent Client Hints (UA-CH) Header Inspector & Server Configurator",
        "url": "https://twistertools.com/tools/web-tools/client-hints-inspector",
        "description": "Inspect, parse, and simulate HTTP User-Agent Client Hints (UA-CH). Generate Accept-CH and Critical-CH HTTP headers, Nginx rules, and test low vs high entropy privacy flags.",
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
                "name": "What are User-Agent Client Hints (UA-CH) and why are they replacing the legacy User-Agent string?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "User-Agent Client Hints (defined in RFC 8942 and the W3C draft) replace monolithic, privacy-invasive User-Agent header strings with granular, structured HTTP headers. By default, browsers only send low-entropy information (browser brand and major version, platform, and mobile status). Servers must explicitly request high-entropy values like device model, exact CPU architecture, and complete OS build version using the Accept-CH response header."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Low-Entropy and High-Entropy Client Hints?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Low-entropy hints (Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform) are sent with every outgoing HTTP request without requiring server opt-in because they do not permit unique passive user fingerprinting. High-entropy hints (Sec-CH-UA-Platform-Version, Sec-CH-UA-Model, Sec-CH-UA-Arch, Sec-CH-UA-Bitness) leak distinct hardware and OS build details, requiring servers to explicitly request them through Accept-CH and HTTPS connection negotiation."
                }
            },
            {
                "@type": "Question",
                "name": "How do Accept-CH and Critical-CH response headers function together?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Accept-CH tells the client which high-entropy headers the server desires for subsequent requests across that origin. Critical-CH designates a subset of hints as non-negotiable for initial page rendering; if the browser did not provide them on the first request, it immediately re-initiates the connection with the requested hints before content is painted."
                }
            },
            {
                "@type": "Question",
                "name": "Why do Sec-CH-UA headers feature bogus brand names like 'Not;A=Brand'?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This practice is called GREASE (Generate Random Extensions And Sustain Extensibility). Chromium browsers intentionally inject arbitrary brand tags to prevent downstream web servers and edge proxies from writing rigid, fragile regex parsers that break whenever a new browser engine emerges."
                }
            },
            {
                "@type": "Question",
                "name": "Can client-side JavaScript access User-Agent Client Hints directly?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Browsers supporting the specification expose navigator.userAgentData. Synchronous access yields low-entropy attributes (brands, mobile, platform). High-entropy data requires calling navigator.userAgentData.getHighEntropyValues(['architecture', 'model', 'platformVersion', ...]), which returns an asynchronous Promise."
                }
            },
            {
                "@type": "Question",
                "name": "Are User-Agent Client Hints supported on Safari and Firefox?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Client Hints are fully standardized and operational across Chromium-based browsers (Google Chrome, Microsoft Edge, Brave, Opera, and Samsung Internet). Apple WebKit (Safari) and Mozilla Gecko (Firefox) currently treat high-entropy UA-CH with caution due to privacy and cross-site fingerprinting concerns, choosing alternative frozen User-Agent string heuristics."
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

            {/* Mode Switcher Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 dark:text-white text-base">
                            Inspection & Emulation Engine
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                            RFC 8942 / RFC 8941 Structured Headers Audit
                        </div>
                    </div>
                </div>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setMode("live")}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${mode === "live"
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                    >
                        <Activity className="w-3.5 h-3.5" /> Live Device Probe
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("simulator")}
                        className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${mode === "simulator"
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                    >
                        <Sliders className="w-3.5 h-3.5" /> Hardware Simulator
                    </button>
                </div>
            </div>

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Inspection or Configuration (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    {mode === "live" ? (
                        <>
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Active Client Environment
                                </h2>
                                <span
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${isSupported
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                        }`}
                                >
                                    {isSupported ? "UA-CH API Active" : "Legacy User-Agent Only"}
                                </span>
                            </div>

                            {/* Legacy User Agent Readout */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Navigator User-Agent (Legacy String):
                                </label>
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-300 break-all select-all leading-relaxed max-h-28 overflow-y-auto">
                                    {rawLegacyUA || "Detecting user agent..."}
                                </div>
                            </div>

                            {/* Low Entropy Active Summary */}
                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                                    <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    Default Low-Entropy Signals (Immediate)
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-bold uppercase">Platform</span>
                                        <span className="font-semibold text-slate-900 dark:text-white font-mono">
                                            {liveLowEntropy.platform || "Not Reported"}
                                        </span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-bold uppercase">Mobile Form</span>
                                        <span className="font-semibold text-slate-900 dark:text-white font-mono">
                                            {liveLowEntropy.mobile ? "Yes (?1)" : "No (?0)"}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-bold uppercase mb-1">Brands (Sec-CH-UA)</span>
                                    <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 space-y-0.5">
                                        {liveLowEntropy.brands.length > 0 ? (
                                            liveLowEntropy.brands.map((b, idx) => (
                                                <div key={idx}>
                                                    &quot;{b.brand}&quot;; v=&quot;{b.version}&quot;
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-slate-600 dark:text-slate-400 font-sans italic">No Chromium brands detected (e.g. Firefox or Safari)</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* High Entropy Action Area */}
                            <div className="space-y-3 pt-2">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                        High-Entropy Hints Probe
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Simulate how a remote server obtains deep hardware flags by executing client-side <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">navigator.userAgentData.getHighEntropyValues()</code>.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRequestHighEntropy}
                                    disabled={!isSupported || isLoadingHigh}
                                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${!isSupported
                                        ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                                        : highEntropyRequested
                                            ? "bg-emerald-600 text-white"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        }`}
                                >
                                    {isLoadingHigh ? (
                                        <>
                                            <Activity className="w-4 h-4 animate-spin" />
                                            <span>Querying Browser Sandbox...</span>
                                        </>
                                    ) : highEntropyRequested ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>High-Entropy Values Loaded</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>Execute getHighEntropyValues()</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* SIMULATOR CONFIGURATION */}
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Hardware Profile Simulator
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleResetSimulator}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" /> Reset
                                </button>
                            </div>

                            {/* Preset Switcher */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor={presetSelectId}
                                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                >
                                    Device Architecture Preset:
                                </label>
                                <select
                                    id={presetSelectId}
                                    value={simPreset}
                                    onChange={(e) => applyPreset(e.target.value)}
                                    aria-label="Preset simulated hardware configuration"
                                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                >
                                    <option value="chromeDesktop">Google Chrome (Apple Silicon M3 / macOS)</option>
                                    <option value="pixelAndroid">Google Pixel 8 Pro (Google Tensor / Android 14)</option>
                                    <option value="edgeWindows">Microsoft Edge (x86_64 / Windows 11 Enterprise)</option>
                                </select>
                            </div>

                            {/* Platform & OS Version */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label
                                        htmlFor={platformInputId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Platform:
                                    </label>
                                    <input
                                        id={platformInputId}
                                        type="text"
                                        value={simPlatform}
                                        onChange={(e) => setSimPlatform(e.target.value)}
                                        aria-label="Simulated OS Platform"
                                        className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor={platformVerInputId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Platform Version:
                                    </label>
                                    <input
                                        id={platformVerInputId}
                                        type="text"
                                        value={simPlatformVersion}
                                        onChange={(e) => setSimPlatformVersion(e.target.value)}
                                        aria-label="Simulated OS Version"
                                        className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* CPU Architecture & Bitness */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label
                                        htmlFor={archSelectId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Architecture:
                                    </label>
                                    <select
                                        id={archSelectId}
                                        value={simArchitecture}
                                        onChange={(e) => setSimArchitecture(e.target.value)}
                                        aria-label="Simulated CPU architecture"
                                        className="w-full px-2.5 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="arm">arm</option>
                                        <option value="arm64">arm64</option>
                                        <option value="x86">x86</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor={bitnessSelectId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Bitness:
                                    </label>
                                    <select
                                        id={bitnessSelectId}
                                        value={simBitness}
                                        onChange={(e) => setSimBitness(e.target.value)}
                                        aria-label="Simulated CPU bitness"
                                        className="w-full px-2.5 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="64">64-bit</option>
                                        <option value="32">32-bit</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor={modelInputId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Hardware Model:
                                    </label>
                                    <input
                                        id={modelInputId}
                                        type="text"
                                        value={simModel}
                                        placeholder="(Empty on Desktop)"
                                        onChange={(e) => setSimModel(e.target.value)}
                                        aria-label="Simulated Device Model"
                                        className="w-full px-2.5 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Browser Branding & Versioning */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label
                                        htmlFor={brandInputId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Primary Brand:
                                    </label>
                                    <input
                                        id={brandInputId}
                                        type="text"
                                        value={simBrand}
                                        onChange={(e) => setSimBrand(e.target.value)}
                                        aria-label="Simulated Brand name"
                                        className="w-full px-2.5 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor={majorVerInputId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Major Version:
                                    </label>
                                    <input
                                        id={majorVerInputId}
                                        type="text"
                                        value={simMajorVersion}
                                        onChange={(e) => setSimMajorVersion(e.target.value)}
                                        aria-label="Simulated major version"
                                        className="w-full px-2.5 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor={fullVerInputId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Full Build:
                                    </label>
                                    <input
                                        id={fullVerInputId}
                                        type="text"
                                        value={simFullVersion}
                                        onChange={(e) => setSimFullVersion(e.target.value)}
                                        aria-label="Simulated full build version"
                                        className="w-full px-2.5 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Client Hint Viewport & Device Toggles */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label
                                        htmlFor={widthInputId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Viewport Width:
                                    </label>
                                    <input
                                        id={widthInputId}
                                        type="number"
                                        value={simViewportWidth}
                                        onChange={handleViewportWidthChange}
                                        aria-label="Simulated Viewport Width"
                                        className="w-full px-2.5 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor={dprInputId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Device DPR:
                                    </label>
                                    <input
                                        id={dprInputId}
                                        type="number"
                                        step="0.25"
                                        value={simDpr}
                                        onChange={handleDprChange}
                                        aria-label="Simulated Device Pixel Ratio"
                                        className="w-full px-2.5 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor={formFactorInputId}
                                        className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                                    >
                                        Form-Factor:
                                    </label>
                                    <input
                                        id={formFactorInputId}
                                        type="text"
                                        value={simFormFactor}
                                        onChange={(e) => setSimFormFactor(e.target.value)}
                                        aria-label="Simulated Form Factor"
                                        className="w-full px-2.5 py-2 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Boolean Toggles */}
                            <div className="flex flex-wrap items-center gap-4 pt-1">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={simMobile}
                                        onChange={(e) => setSimMobile(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Mobile Client (?1)</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={simSaveData}
                                        onChange={(e) => setSimSaveData(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Prefers Reduced Data (Save-Data)</span>
                                </label>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Panel: Granular Headers & Server Handshake Inspector (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
                        {/* Header Tabs */}
                        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                    Structured Client Hints Output
                                </h2>
                            </div>

                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTab("http")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${selectedTab === "http"
                                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    HTTP Headers
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTab("nginx")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${selectedTab === "nginx"
                                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    Nginx Config
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTab("meta")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${selectedTab === "meta"
                                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    HTML &lt;meta&gt;
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTab("json")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${selectedTab === "json"
                                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    JSON
                                </button>
                            </div>
                        </div>

                        {/* Metric Indicators Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Entropy Tier
                                </span>
                                <p className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                    {highEntropyRequested || mode === "simulator" ? "High Entropy" : "Low Entropy"}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Device Target
                                </span>
                                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                    {activeHints.mobile ? "Mobile (?1)" : "Desktop (?0)"}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Architecture
                                </span>
                                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                    {activeHints.architecture || "N/A"}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-0.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                                    Screen DPR
                                </span>
                                <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                    {activeHints.dpr}x
                                </p>
                            </div>
                        </div>

                        {/* Display Area depending on active tab */}
                        <div className="p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                                    {selectedTab === "http" && "Client Request Headers (Outgoing HTTP / RFC 8942)"}
                                    {selectedTab === "nginx" && "Web Server Directives (Accept-CH & Permissions-Policy)"}
                                    {selectedTab === "meta" && "HTML5 Document Header Delegate"}
                                    {selectedTab === "json" && "Parsed JSON Structure"}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const text =
                                            selectedTab === "http"
                                                ? headersText
                                                : selectedTab === "nginx"
                                                    ? nginxConfig
                                                    : selectedTab === "meta"
                                                        ? metaTagCode
                                                        : jsonExport;
                                        handleCopy(text, selectedTab);
                                    }}
                                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition"
                                >
                                    {copiedHeader === selectedTab ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy Output</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <pre className="font-mono text-xs text-indigo-300 break-all select-all leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
                                {selectedTab === "http" && headersText}
                                {selectedTab === "nginx" && nginxConfig}
                                {selectedTab === "meta" && metaTagCode}
                                {selectedTab === "json" && jsonExport}
                            </pre>
                        </div>

                        {/* Accept-CH Server Response Header Generator */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                                    <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    Server-Side Opt-In Headers (Accept-CH &amp; Critical-CH)
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(serverAcceptCH, "server-accept")}
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    {copiedHeader === "server-accept" ? "Copied" : "Copy Header"}
                                </button>
                            </div>
                            <div className="font-mono text-xs text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap select-all">
                                {serverAcceptCH}
                            </div>
                        </div>

                        {/* Copy All Button */}
                        <button
                            type="button"
                            onClick={() => handleCopy(headersText, "full")}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${copiedHeader === "full"
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                        >
                            {copiedHeader === "full" ? (
                                <>
                                    <Check className="w-5 h-5 text-white" />
                                    <span>Client Hints Copied to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-white" />
                                    <span>Copy Formatted Client Hints Headers</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Operational Tip Card */}
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong>Production Implementation Rule:</strong> High-entropy hints (<code className="font-mono font-bold">Sec-CH-UA-Model</code>, <code className="font-mono font-bold">Sec-CH-UA-Platform-Version</code>) are only transmitted over secure <code className="font-mono font-bold">HTTPS</code> connections and will never be sent to unverified origins or cross-site subresources without an explicit <code className="font-mono font-bold">Permissions-Policy</code> header.
                        </p>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Architecture & RFC Specifications */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Architecture of RFC 8942: Transitioning from Monolithic UA to Client Hints
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        For nearly three decades, the traditional HTTP <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">User-Agent</code> header was transmitted unconditionally with every web request. This string became an unmanageable catalog of legacy identifiers (&ldquo;Mozilla/5.0&rdquo;, &ldquo;AppleWebKit/537.36&rdquo;, &ldquo;KHTML, like Gecko&rdquo;) that simultaneously leaked invasive hardware telemetry to third parties. User-Agent Client Hints (UA-CH), standardized under RFC 8942 and RFC 8941 Structured Headers, replace this monolithic pattern with deliberate, privacy-preserving negotiation.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Privacy Budget & Anti-Fingerprinting
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Passive cross-site browser fingerprinting is curtailed by restricting unprompted request headers to low-entropy attributes, eliminating passive profiling surfaces.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> RFC 8941 Structured Headers
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Hints utilize machine-parseable structured items: strings in double quotes (<code className="font-mono">&quot;macOS&quot;</code>) and booleans formatted with leading question marks (<code className="font-mono">?0</code> or <code className="font-mono">?1</code>).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Network className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Explicit Server Opt-In
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                High-entropy hardware data is strictly withheld by the client browser until an authorized server requests it using the <code className="font-mono text-indigo-600 dark:text-indigo-400">Accept-CH</code> response header.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Client Hints Header Dictionary & Entropy Classifications
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono text-slate-300">
                                <thead>
                                    <tr className="border-b border-slate-800 text-indigo-300">
                                        <th className="py-2 pr-4 font-bold">Header Name</th>
                                        <th className="py-2 pr-4 font-bold">Entropy Class</th>
                                        <th className="py-2 pr-4 font-bold">Syntax Example</th>
                                        <th className="py-2 font-bold">Functional Purpose</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">Sec-CH-UA</td>
                                        <td className="py-2 pr-4 text-emerald-400">Low Entropy</td>
                                        <td className="py-2 pr-4">&quot;Google Chrome&quot;; v=&quot;128&quot;</td>
                                        <td className="py-2 font-sans text-slate-300">Brand identity and major version numbers with GREASE padding.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">Sec-CH-UA-Mobile</td>
                                        <td className="py-2 pr-4 text-emerald-400">Low Entropy</td>
                                        <td className="py-2 pr-4">?0 or ?1</td>
                                        <td className="py-2 font-sans text-slate-300">Boolean indicator whether the browser runs in mobile mode.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">Sec-CH-UA-Platform</td>
                                        <td className="py-2 pr-4 text-emerald-400">Low Entropy</td>
                                        <td className="py-2 pr-4">&quot;Windows&quot;, &quot;Android&quot;</td>
                                        <td className="py-2 font-sans text-slate-300">Host operating system name without granular build version.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">Sec-CH-UA-Platform-Version</td>
                                        <td className="py-2 pr-4 text-rose-400">High Entropy</td>
                                        <td className="py-2 pr-4">&quot;14.5.0&quot;</td>
                                        <td className="py-2 font-sans text-slate-300">Specific operating system kernel or marketing build version.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">Sec-CH-UA-Arch</td>
                                        <td className="py-2 pr-4 text-rose-400">High Entropy</td>
                                        <td className="py-2 pr-4">&quot;arm&quot;, &quot;x86&quot;</td>
                                        <td className="py-2 font-sans text-slate-300">Underlying processor instruction architecture.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">Sec-CH-UA-Model</td>
                                        <td className="py-2 pr-4 text-rose-400">High Entropy</td>
                                        <td className="py-2 pr-4">&quot;Pixel 8 Pro&quot;</td>
                                        <td className="py-2 font-sans text-slate-300">Mobile hardware model identifier (empty string on desktop).</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">Sec-CH-UA-Full-Version-List</td>
                                        <td className="py-2 pr-4 text-rose-400">High Entropy</td>
                                        <td className="py-2 pr-4">&quot;Chromium&quot;; v=&quot;128.0.6613.114&quot;</td>
                                        <td className="py-2 font-sans text-slate-300">Complete, un-truncated browser build version numbers.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 text-indigo-400">Sec-CH-Viewport-Width</td>
                                        <td className="py-2 pr-4 text-amber-400">Responsive CH</td>
                                        <td className="py-2 pr-4">1920</td>
                                        <td className="py-2 font-sans text-slate-300">Client viewport layout width in CSS pixels for CDN image sizing.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Architecture Matrix */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Protocol Matrix: Legacy User-Agent vs. User-Agent Client Hints
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Examine the core differences in performance, caching mechanics, and privacy between legacy HTTP identification and modern Client Hints:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Feature Dimension</th>
                                    <th className="p-3">Legacy User-Agent (RFC 7231)</th>
                                    <th className="p-3">UA Client Hints (RFC 8942)</th>
                                    <th className="p-3">Operational Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Data Format</td>
                                    <td className="p-3 font-mono text-xs">Unstructured Free Text</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">RFC 8941 Structured Headers</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Eliminates complex, fragile regular expressions in backends</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Default Request Payload</td>
                                    <td className="p-3 font-mono text-xs">~150–250 bytes per request</td>
                                    <td className="p-3 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">~40–70 bytes (Low Entropy)</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Reduces header bloat across high-frequency HTTP/2 &amp; HTTP/3 requests</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Edge CDN Caching</td>
                                    <td className="p-3 font-mono text-xs">Vary: User-Agent destroys cache hit ratios</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">Vary: Sec-CH-UA-Mobile</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Enables high-efficiency edge caching split cleanly between mobile and desktop</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Anti-Fingerprinting Audit</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Passive / Untrackable Leak</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Server logs must audit Accept-CH</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">Browser vendors can log and audit servers requesting sensitive hardware flags</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Server Implementation & Critical-CH Flow */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Production Deployment Guide: Implementing Accept-CH and Critical-CH
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        To receive high-entropy client hints, your origin server or reverse proxy must negotiate with the browser during the initial HTTP handshake. Follow these four production rules:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practice Configuration Steps
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Declare Accept-CH at Root:</strong> Publish <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Accept-CH: Sec-CH-UA-Platform-Version, Sec-CH-UA-Model</code> on all HTML responses to establish origin preference for subsequent requests.
                                </li>
                                <li>
                                    • <strong>Use Critical-CH for First-Paint Requirements:</strong> If server-side responsive rendering requires the device model immediately, declare <code className="font-mono text-indigo-600 dark:text-indigo-400">Critical-CH: Sec-CH-UA-Model</code> to trigger an automated initial HTTP retry with hints attached.
                                </li>
                                <li>
                                    • <strong>Delegate via Permissions-Policy:</strong> To permit trusted third-party CDNs (e.g., Cloudflare, Fastly, or image resizers) to view hints, declare <code className="font-mono">Permissions-Policy: ch-ua-model=(self &quot;https://cdn.example.com&quot;)</code>.
                                </li>
                                <li>
                                    • <strong>Tune CDN Cache Keys (Vary):</strong> Never set <code className="font-mono">Vary: *</code>. Only append the specific client hints your backend consumes, such as <code className="font-mono">Vary: Sec-CH-UA-Mobile, Sec-CH-Width</code>.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Engineering Pitfalls
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Overusing Critical-CH:</strong> Marking too many hints as critical can force an extra network round-trip on first-time visitors, degrading Core Web Vitals (LCP/FCP).
                                </li>
                                <li>
                                    • <strong>Insecure HTTP Transmission:</strong> Modern browsers strip all high-entropy Client Hints if the page is served over plain HTTP. TLS 1.3 encryption is mandatory.
                                </li>
                                <li>
                                    • <strong>Ignoring GREASE Values:</strong> Failing to handle random brands like <code className="font-mono">&quot;Not;A=Brand&quot;</code> in backend parsers causes uncaught exceptions when parsing the <code className="font-mono">Sec-CH-UA</code> list.
                                </li>
                                <li>
                                    • <strong>Assuming Universal Support:</strong> Safari and Firefox intentionally do not support high-entropy hints. Always include robust fallback paths based on modern CSS feature queries.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
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
                                What are User-Agent Client Hints (UA-CH) and why are they replacing the legacy User-Agent string?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                User-Agent Client Hints (defined in RFC 8942 and the W3C draft) replace monolithic, privacy-invasive User-Agent header strings with granular, structured HTTP headers. By default, browsers only send low-entropy information (browser brand and major version, platform, and mobile status). Servers must explicitly request high-entropy values like device model, exact CPU architecture, and complete OS build version using the Accept-CH response header.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between Low-Entropy and High-Entropy Client Hints?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Low-entropy hints (Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform) are sent with every outgoing HTTP request without requiring server opt-in because they do not permit unique passive user fingerprinting. High-entropy hints (Sec-CH-UA-Platform-Version, Sec-CH-UA-Model, Sec-CH-UA-Arch, Sec-CH-UA-Bitness) leak distinct hardware and OS build details, requiring servers to explicitly request them through Accept-CH and HTTPS connection negotiation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do Accept-CH and Critical-CH response headers function together?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Accept-CH tells the client which high-entropy headers the server desires for subsequent requests across that origin. Critical-CH designates a subset of hints as non-negotiable for initial page rendering; if the browser did not provide them on the first request, it immediately re-initiates the connection with the requested hints before content is painted.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why do Sec-CH-UA headers feature bogus brand names like &quot;Not;A=Brand&quot;?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                This practice is called GREASE (Generate Random Extensions And Sustain Extensibility). Chromium browsers intentionally inject arbitrary brand tags to prevent downstream web servers and edge proxies from writing rigid, fragile regex parsers that break whenever a new browser engine emerges.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Can client-side JavaScript access User-Agent Client Hints directly?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Browsers supporting the specification expose <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">navigator.userAgentData</code>. Synchronous access yields low-entropy attributes (brands, mobile, platform). High-entropy data requires calling <code className="font-mono text-indigo-600 dark:text-indigo-400">navigator.userAgentData.getHighEntropyValues([&apos;architecture&apos;, &apos;model&apos;, &apos;platformVersion&apos;, ...])</code>, which returns an asynchronous Promise.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Are User-Agent Client Hints supported on Safari and Firefox?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Client Hints are fully standardized and operational across Chromium-based browsers (Google Chrome, Microsoft Edge, Brave, Opera, and Samsung Internet). Apple WebKit (Safari) and Mozilla Gecko (Firefox) currently treat high-entropy UA-CH with caution due to privacy and cross-site fingerprinting concerns, choosing alternative frozen User-Agent string heuristics.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}