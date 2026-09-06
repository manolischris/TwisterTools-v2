"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Binary,
    Copy,
    Check,
    RotateCcw,
    Globe,
    Sliders,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Terminal,
    Settings2,
    Boxes,
    HelpCircle,
    ArrowRightLeft,
    Hash,
    Maximize2,
    Minimize2,
    Cpu
} from "lucide-react";

interface Ipv6Breakdown {
    originalInput: string;
    canonicalCompressed: string;
    fullExpanded: string;
    zeroPadded: string;
    cleanHexRaw: string;
    colonHex: string;
    binaryString: string;
    isIpv4Mapped: boolean;
    isIpv4Compatible: boolean;
    is6to4: boolean;
    extractedIpv4: string | null;
    embeddedIpv4Hex: string | null;
    reverseDnsPtr: string;
    scopeType: string;
    scopeDescription: string;
    hextets: string[];
    expandedHextets: string[];
}

const SAMPLE_PRESETS: { label: string; address: string; description: string }[] = [
    { label: "Loopback", address: "::1", description: "RFC 4291 Localhost interface" },
    { label: "IPv4-Mapped", address: "::ffff:192.168.1.1", description: "IPv4 encapsulated dual-stack socket" },
    { label: "IPv4-Hex Mapped", address: "::ffff:c0a8:0101", description: "Dotted quad represented in raw hex" },
    { label: "6to4 Relay", address: "2002:c0a8:0101::1", description: "RFC 3056 automatic tunneling prefix" },
    { label: "Global Unicast", address: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", description: "Standard RFC 3849 Documentation" },
    { label: "Link-Local", address: "fe80::1ff:fe00:3a60", description: "Subnet-local autoconfiguration interface" },
    { label: "Unique Local", address: "fd00:abcd:1234:1::10", description: "RFC 4193 Private Enterprise LAN" }
];

function isHex(str: string): boolean {
    return /^[0-9a-fA-F]+$/.test(str);
}

function isValidIpv4Octets(octets: string[]): boolean {
    if (octets.length !== 4) return false;
    for (const oct of octets) {
        if (!/^\d+$/.test(oct)) return false;
        const num = parseInt(oct, 10);
        if (num < 0 || num > 255) return false;
        if (oct.length > 1 && oct.startsWith("0")) return false;
    }
    return true;
}

function ipv4ToHextets(ipv4: string): [string, string] {
    const parts = ipv4.split(".").map((x) => parseInt(x, 10));
    const h1 = ((parts[0] << 8) | parts[1]).toString(16).padStart(4, "0");
    const h2 = ((parts[2] << 8) | parts[3]).toString(16).padStart(4, "0");
    return [h1, h2];
}

function hextetsToIpv4(h1: string, h2: string): string {
    const n1 = parseInt(h1, 16);
    const n2 = parseInt(h2, 16);
    return [
        (n1 >> 8) & 0xff,
        n1 & 0xff,
        (n2 >> 8) & 0xff,
        n2 & 0xff
    ].join(".");
}

function parseIpv6(input: string): string[] | null {
    let raw = input.trim().toLowerCase();
    if (!raw) return null;

    let ipv4Tail: [string, string] | null = null;
    const lastColonIdx = raw.lastIndexOf(":");
    if (lastColonIdx !== -1) {
        const potentialIpv4 = raw.substring(lastColonIdx + 1);
        const octets = potentialIpv4.split(".");
        if (octets.length === 4 && isValidIpv4Octets(octets)) {
            ipv4Tail = ipv4ToHextets(potentialIpv4);
            raw = raw.substring(0, lastColonIdx);
            if (raw.endsWith(":")) {
                raw += ":";
            }
        }
    }

    if (raw.split("::").length > 2) return null;

    let parts: string[];
    if (raw.includes("::")) {
        const [left, right] = raw.split("::");
        const leftParts = left ? left.split(":") : [];
        const rightParts = right ? right.split(":") : [];

        const needed = 8 - (leftParts.length + rightParts.length + (ipv4Tail ? 2 : 0));
        if (needed < 0) return null;

        const fill = Array(needed).fill("0000");
        parts = [...leftParts, ...fill, ...rightParts];
    } else {
        parts = raw.split(":");
    }

    if (ipv4Tail) {
        parts.push(ipv4Tail[0], ipv4Tail[1]);
    }

    if (parts.length !== 8) return null;

    for (let i = 0; i < 8; i++) {
        const part = parts[i];
        if (!part || part.length > 4 || !isHex(part)) return null;
        parts[i] = part.padStart(4, "0");
    }

    return parts;
}

function compressIpv6(hextets: string[]): string {
    const normalized = hextets.map((h) => h.replace(/^0+/, "") || "0");

    let bestStart = -1;
    let bestLen = 0;
    let currStart = -1;
    let currLen = 0;

    for (let i = 0; i < 8; i++) {
        if (normalized[i] === "0") {
            if (currStart === -1) {
                currStart = i;
                currLen = 1;
            } else {
                currLen++;
            }
        } else {
            if (currLen > bestLen) {
                bestStart = currStart;
                bestLen = currLen;
            }
            currStart = -1;
            currLen = 0;
        }
    }
    if (currLen > bestLen) {
        bestStart = currStart;
        bestLen = currLen;
    }

    if (bestLen > 1) {
        const left = normalized.slice(0, bestStart).join(":");
        const right = normalized.slice(bestStart + bestLen).join(":");
        return `${left}::${right}`;
    }

    return normalized.join(":");
}

function getIpv6Scope(expanded: string[]): { scope: string; description: string } {
    const hex = expanded.join("").toLowerCase();
    const h0 = expanded[0].toLowerCase();
    const h0Val = parseInt(h0, 16);

    if (hex === "00000000000000000000000000000000") {
        return { scope: "Unspecified Address (::)", description: "RFC 4291 Target host listening wildcard state" };
    }
    if (hex === "00000000000000000000000000000001") {
        return { scope: "Loopback Interface (::1)", description: "RFC 4291 Node-local loopback host address" };
    }
    if (hex.startsWith("00000000000000000000ffff")) {
        return { scope: "IPv4-Mapped IPv6 Address", description: "RFC 4038 Dual-stack OS network communication bridge" };
    }
    if (hex.startsWith("000000000000000000000000") && hex.substring(24) !== "00000001") {
        return { scope: "IPv4-Compatible IPv6 (Deprecated)", description: "RFC 4291 Historical IPv6 over IPv4 transition link" };
    }
    if (h0 === "2002") {
        return { scope: "6to4 Autotunneling Prefix", description: "RFC 3056 IPv6 packets encapsulated natively across IPv4 routing" };
    }
    if (h0 === "2001" && expanded[1].toLowerCase() === "0db8") {
        return { scope: "Documentation Prefix", description: "RFC 3849 Reserved globally for technical documentation and books" };
    }
    if (h0Val >= 0xfe80 && h0Val <= 0xfebf) {
        return { scope: "Link-Local Unicast (fe80::/10)", description: "RFC 4291 Automatic non-routable link communication" };
    }
    if (h0Val >= 0xfc00 && h0Val <= 0xfdff) {
        return { scope: "Unique Local Address (fc00::/7)", description: "RFC 4193 Private routed intranet topology (IPv6 counterpart to RFC 1918)" };
    }
    if (h0Val >= 0xff00 && h0Val <= 0xffff) {
        return { scope: "Multicast Address (ff00::/8)", description: "RFC 4291 One-to-many packet transmission broadcast replacement" };
    }
    if (h0Val >= 0x2000 && h0Val <= 0x3fff) {
        return { scope: "Global Unicast Address (2000::/3)", description: "RFC 4291 Public internet-routable unicast infrastructure" };
    }
    return { scope: "Reserved / Experimental", description: "IANA unassigned or specialized protocol reservation range" };
}

export default function Ipv6AddressConverter() {
    const [inputAddress, setInputAddress] = useState<string>("2001:0db8:85a3::8a2e:0370:7334");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const inputId = useId();

    const parsedData = useMemo<Ipv6Breakdown | null>(() => {
        const clean = inputAddress.trim();
        if (!clean) return null;

        const fullHextets = parseIpv6(clean);
        if (!fullHextets) return null;

        const expandedStr = fullHextets.join(":");
        const canonical = compressIpv6(fullHextets);
        const cleanHex = fullHextets.join("");
        const colonSeparatedHex = fullHextets.join(":");

        const binaryStr = fullHextets
            .map((h) => parseInt(h, 16).toString(2).padStart(16, "0"))
            .map((b) => `${b.slice(0, 4)} ${b.slice(4, 8)} ${b.slice(8, 12)} ${b.slice(12, 16)}`)
            .join(" : ");

        const hexFlat = fullHextets.join("").toLowerCase();
        const isMapped = hexFlat.startsWith("00000000000000000000ffff");
        const isCompat = hexFlat.startsWith("000000000000000000000000") && hexFlat !== "00000000000000000000000000000001" && hexFlat !== "00000000000000000000000000000000";
        const is6to4 = fullHextets[0].toLowerCase() === "2002";

        let extractedIpv4: string | null = null;
        let embeddedIpv4Hex: string | null = null;

        if (isMapped || isCompat) {
            extractedIpv4 = hextetsToIpv4(fullHextets[6], fullHextets[7]);
            embeddedIpv4Hex = `0x${fullHextets[6]}${fullHextets[7]}`;
        } else if (is6to4) {
            extractedIpv4 = hextetsToIpv4(fullHextets[1], fullHextets[2]);
            embeddedIpv4Hex = `0x${fullHextets[1]}${fullHextets[2]}`;
        }

        const nibbles = hexFlat.split("").reverse();
        const reverseDnsPtr = `${nibbles.join(".")}.ip6.arpa`;

        const scopeInfo = getIpv6Scope(fullHextets);

        return {
            originalInput: clean,
            canonicalCompressed: canonical,
            fullExpanded: expandedStr,
            zeroPadded: fullHextets.map((h) => h.padStart(4, "0")).join(":"),
            cleanHexRaw: cleanHex,
            colonHex: colonSeparatedHex,
            binaryString: binaryStr,
            isIpv4Mapped: isMapped,
            isIpv4Compatible: isCompat,
            is6to4,
            extractedIpv4,
            embeddedIpv4Hex,
            reverseDnsPtr,
            scopeType: scopeInfo.scope,
            scopeDescription: scopeInfo.description,
            hextets: canonical.split(":"),
            expandedHextets: fullHextets
        };
    }, [inputAddress]);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleReset = () => {
        setInputAddress("2001:0db8:85a3::8a2e:0370:7334");
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "IPv6 Address Expander & IPv4 Hexadecimal Converter",
        "url": "https://twistertools.com/tools/web-tools/ipv6-address-converter",
        "description": "High-precision RFC 4291 IPv6 Address Expander, Canonical RFC 5952 Compressor, IPv4-Mapped extractor, reverse DNS (ip6.arpa) generator, and hexadecimal binary decoder.",
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
                "name": "What is the difference between expanded and compressed IPv6 addresses?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An expanded IPv6 address explicitly writes out all 8 16-bit hextets using four hexadecimal characters each (32 total hex digits separated by 7 colons). A compressed IPv6 address follows RFC 5952 recommendations: leading zeros within each hextet are stripped, and the longest contiguous sequence of two or more zero-value hextets is replaced once by a double colon (::)."
                }
            },
            {
                "@type": "Question",
                "name": "How does IPv4 address embedding work within IPv6?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Under RFC 4291 and RFC 4038, standard 32-bit IPv4 addresses can be embedded inside 128-bit IPv6 headers. In IPv4-mapped addresses (::ffff:x.x.x.x), the first 80 bits are zero, bits 81-96 are set to one (ffff), and the final 32 bits contain the dotted quad IPv4 address, allowing dual-stack networking software to handle both protocols seamlessly."
                }
            },
            {
                "@type": "Question",
                "name": "What is an ip6.arpa reverse DNS PTR record?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An ip6.arpa PTR record enables reverse DNS lookups for IPv6 addresses. To construct it, the 128-bit address is completely expanded into 32 single hexadecimal nibbles, reversed in sequence, separated by dots, and appended with the domain '.ip6.arpa'."
                }
            },
            {
                "@type": "Question",
                "name": "What are RFC 4193 Unique Local Addresses (ULA)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Unique Local Addresses (ULA) are the IPv6 counterpart to RFC 1918 private IPv4 spaces. Defined under prefix fc00::/7 (most commonly fd00::/8), ULAs are routable throughout private networks and enterprise VPNs but are strictly non-routable on the public global Internet."
                }
            },
            {
                "@type": "Question",
                "name": "Are my IP addresses logged or transmitted to your servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All IPv6 parsing, bitwise conversions, nibble reversals, and hexadecimal calculations execute strictly in your client-side browser memory. No telemetry, address data, or server requests are transmitted."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Quick Presets & Control Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            RFC Addressing Scenarios & Presets
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 font-medium">Quick Load:</span>
                        {SAMPLE_PRESETS.map((sample) => (
                            <button
                                key={sample.label}
                                type="button"
                                onClick={() => setInputAddress(sample.address)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer border border-slate-200/60"
                                title={sample.description}
                            >
                                {sample.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer border border-rose-200/60 ml-1"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                </div>

                <div className="space-y-1.5 pt-1">
                    <label htmlFor={inputId} className="text-xs font-bold text-slate-700 block">
                        IPv6 Address (Supports Standard, Compressed ::, Dotted IPv4-Mapped, and 6to4)
                    </label>
                    <div className="relative">
                        <input
                            id={inputId}
                            type="text"
                            value={inputAddress}
                            onChange={(e) => setInputAddress(e.target.value)}
                            placeholder="e.g. 2001:db8::1, ::ffff:192.168.1.1, or 2002:c0a8:0101::"
                            className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 outline-none transition"
                        />
                        <span className="absolute right-3.5 top-3 text-xs font-mono font-semibold text-slate-400 pointer-events-none">
                            128-Bit IPv6
                        </span>
                    </div>
                </div>
            </div>

            {/* Workspace: Dual Breakdown Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Primary Structural Expansion & Compression */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Address Forms & Expansions
                            </h2>
                        </div>
                        {parsedData && (
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Valid RFC 4291
                            </span>
                        )}
                    </div>

                    {!parsedData ? (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <span className="font-bold text-sm">Invalid IPv6 Format</span>
                                <p>
                                    Please enter a valid IPv6 address. Ensure hexadecimal hextets are within 0-ffff, only a single double-colon (::) abbreviation is used, and octets adhere to 128-bit boundaries.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Canonical Compressed */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                                        Canonical Compressed (RFC 5952)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(parsedData.canonicalCompressed, "canonical")}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedKey === "canonical" ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                        {copiedKey === "canonical" ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="font-mono text-sm font-bold text-indigo-900 break-all">
                                    {parsedData.canonicalCompressed}
                                </div>
                            </div>

                            {/* Fully Expanded Zero-Padded */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                                        Fully Expanded (Full 32 Hex Digits)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(parsedData.fullExpanded, "expanded")}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedKey === "expanded" ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                        {copiedKey === "expanded" ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 break-all">
                                    {parsedData.fullExpanded}
                                </div>
                            </div>

                            {/* Raw Hexadecimal Representation */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5 text-indigo-600" />
                                        Raw Hexadecimal (Unseparated 128-Bit)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(`0x${parsedData.cleanHexRaw}`, "hexraw")}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedKey === "hexraw" ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                        {copiedKey === "hexraw" ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="font-mono text-xs font-semibold text-slate-700 break-all">
                                    0x{parsedData.cleanHexRaw}
                                </div>
                            </div>

                            {/* Classification and Scope Details */}
                            <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                                    Scope Classification & Type
                                </span>
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="font-mono text-sm font-bold text-indigo-950">
                                        {parsedData.scopeType}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {parsedData.scopeDescription}
                                </p>
                            </div>

                            {/* Reverse DNS Pointer (PTR) */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                        Reverse DNS Lookup Zone (ip6.arpa PTR)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(parsedData.reverseDnsPtr, "ptr")}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedKey === "ptr" ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                        {copiedKey === "ptr" ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="font-mono text-[11px] sm:text-xs text-slate-700 break-all bg-white p-2.5 rounded border border-slate-200">
                                    {parsedData.reverseDnsPtr}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <Boxes className="w-4 h-4 text-slate-400" />
                            Client-Side Native RFC Parsing
                        </span>
                        <span className="font-mono text-slate-600">RFC 4291 / RFC 5952</span>
                    </div>
                </div>

                {/* Right Panel: Dual-Stack IPv4 Extraction & Binary Octet Stream */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Binary className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                IPv4 Extraction & 128-Bit Binary
                            </h2>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">Dual-Stack Decoder</span>
                    </div>

                    {parsedData && (
                        <div className="space-y-4">
                            {/* IPv4 Compatibility / Mapped Status */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Cpu className="w-4 h-4 text-indigo-600" />
                                        Dual-Stack IPv4 Extraction
                                    </span>
                                    {parsedData.extractedIpv4 ? (
                                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                                            IPv4 Present
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-200 text-slate-700">
                                            Pure IPv6 Unicast
                                        </span>
                                    )}
                                </div>

                                {parsedData.extractedIpv4 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <span className="text-[11px] text-slate-500 block font-medium">
                                                Extracted Dotted IPv4
                                            </span>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="font-mono text-sm font-bold text-indigo-600">
                                                    {parsedData.extractedIpv4}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(parsedData.extractedIpv4!, "ipv4")}
                                                    className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                                >
                                                    {copiedKey === "ipv4" ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <span className="text-[11px] text-slate-500 block font-medium">
                                                Embedded Hex Value
                                            </span>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="font-mono text-sm font-bold text-slate-800">
                                                    {parsedData.embeddedIpv4Hex}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(parsedData.embeddedIpv4Hex!, "ipv4hex")}
                                                    className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                                >
                                                    {copiedKey === "ipv4hex" ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                                        This address does not contain an embedded IPv4 tail (::ffff:x.x.x.x) or 6to4 prefix (2002::/16). It is formatted purely as a native 128-bit IPv6 address.
                                    </p>
                                )}
                            </div>

                            {/* 8 Hextet Breakdown Table */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-800 block">
                                    16-Bit Hextet Decomposition (128 Bits Total)
                                </span>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center">
                                    {parsedData.expandedHextets.map((hextet, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1"
                                        >
                                            <span className="text-[10px] text-slate-400 block font-mono">
                                                H{idx + 1}
                                            </span>
                                            <span className="font-mono text-xs font-bold text-indigo-600 block">
                                                {hextet}
                                            </span>
                                            <span className="text-[10px] text-slate-500 block font-mono">
                                                {parseInt(hextet, 16)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 128-Bit Binary Visualization */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">
                                        Full 128-Bit Binary Bitstream
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(parsedData.binaryString.replace(/\s+/g, ""), "bin")}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedKey === "bin" ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                        {copiedKey === "bin" ? "Copied" : "Copy Raw"}
                                    </button>
                                </div>
                                <div className="p-3.5 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-400 leading-relaxed overflow-x-auto border border-slate-800">
                                    {parsedData.binaryString}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Client-Side Sandbox Computation
                        </span>
                        <span className="text-slate-400">Zero Server Telemetry</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            IPv6 Addressing Architecture & Compression Engineering
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Internet Protocol version 6 (IPv6) was engineered by the Internet Engineering Task Force (IETF) in RFC 8200 and RFC 4291 to supersede IPv4 and solve global address space exhaustion. By expanding address boundaries from 32 bits to 128 bits, IPv6 yields approximately 3.4 x 10^38 distinct addresses—enough to assign billions of unique routable interfaces to every square meter of the earth.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sliders className="w-4 h-4 text-indigo-600" /> RFC 5952 Formatting
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Mandates consistent text representation: lowercase hexadecimal characters, suppression of unnecessary leading zeros in hextets, and single substitution of the longest contiguous null block using double colons (::).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Dual-Stack Transition
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Dual-stack systems utilize IPv4-mapped addresses (::ffff:a.b.c.d) to represent legacy 32-bit IPv4 network sockets directly inside 128-bit IPv6 modern software network APIs.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600" /> DNS ip6.arpa Pointers
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Reverse DNS lookups for IPv6 construct PTR record domains by exploding all 32 hexadecimal nibbles, reversing their natural sequence, and appending the authoritative ip6.arpa tree.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: IPv6 Scope Comparison Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Globe className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            IPv6 Address Scope, Prefix Allocation & RFC Specifications
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        IPv6 structures addressing into definitive scopes that eliminate the broadcast storms typical of legacy IPv4 networks while strictly segmenting local from global routable topologies:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Scope / Type</th>
                                    <th className="p-3">Binary Prefix</th>
                                    <th className="p-3">Standard Notation</th>
                                    <th className="p-3">RFC Standard</th>
                                    <th className="p-3">Description & Operational Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Loopback</td>
                                    <td className="p-3 font-mono">000...001 (128 bits)</td>
                                    <td className="p-3 font-mono">::1/128</td>
                                    <td className="p-3">RFC 4291</td>
                                    <td className="p-3">Localhost virtual interface; equivalent to 127.0.0.1 in IPv4.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Unspecified</td>
                                    <td className="p-3 font-mono">000...000 (128 bits)</td>
                                    <td className="p-3 font-mono">::/128</td>
                                    <td className="p-3">RFC 4291</td>
                                    <td className="p-3">Designates absence of address; used in socket bind all interfaces (0.0.0.0).</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Link-Local Unicast</td>
                                    <td className="p-3 font-mono">1111 1110 10</td>
                                    <td className="p-3 font-mono">fe80::/10</td>
                                    <td className="p-3">RFC 4291</td>
                                    <td className="p-3">Autoconfigured per network link; non-routable beyond the local physical switch or VLAN.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Unique Local (ULA)</td>
                                    <td className="p-3 font-mono">1111 110</td>
                                    <td className="p-3 font-mono">fc00::/7 (fd00::/8)</td>
                                    <td className="p-3">RFC 4193</td>
                                    <td className="p-3">Private enterprise routable addressing; direct replacement for RFC 1918 private IPv4.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Global Unicast</td>
                                    <td className="p-3 font-mono">001</td>
                                    <td className="p-3 font-mono">2000::/3</td>
                                    <td className="p-3">RFC 4291</td>
                                    <td className="p-3">Publicly routable on the global Internet backbone across tier-1 ISPs.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">IPv4-Mapped</td>
                                    <td className="p-3 font-mono">0...0 1111 1111</td>
                                    <td className="p-3 font-mono">::ffff:0:0/96</td>
                                    <td className="p-3">RFC 4038</td>
                                    <td className="p-3">Dual-stack socket encapsulation for handling legacy IPv4 connections inside IPv6 applications.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Multicast</td>
                                    <td className="p-3 font-mono">1111 1111</td>
                                    <td className="p-3 font-mono">ff00::/8</td>
                                    <td className="p-3">RFC 4291</td>
                                    <td className="p-3">Targeted group communication; replaces all broadcast addressing used in IPv4.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Reverse DNS & ip6.arpa Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Demystifying the Reverse DNS (ip6.arpa) Nibble Structure
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unlike IPv4 reverse DNS which splits 32-bit addresses by full 8-bit octets (e.g., 1.1.168.192.in-addr.arpa), IPv6 reverse DNS delegates PTR records along 4-bit boundaries known as <strong>nibbles</strong>. Every individual hexadecimal digit represents a delegation node in the DNS hierarchy under the ip6.arpa domain tree.
                    </p>

                    <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block font-mono">
                            Example Reverse DNS Transformation
                        </span>
                        <div className="space-y-2 text-xs font-mono">
                            <div>
                                <span className="text-slate-400">Compressed IPv6: </span>
                                <span className="text-white font-bold">2001:db8::1</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Expanded 32 Nibbles: </span>
                                <span className="text-emerald-400 font-bold">
                                    2001:0db8:0000:0000:0000:0000:0000:0001
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400">Reversed Dot-Separated String: </span>
                                <span className="text-indigo-300 font-bold break-all">
                                    1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Programmatic Automation Scripts */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Terminal className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Automated IPv6 Address Expansion (Python 3 & Node.js)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Integrate programmatic address expansion, canonical compression, and PTR generation into infrastructure validation pipelines:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-indigo-400 font-mono uppercase">
                                Python 3 (ipaddress Module)
                            </h3>
                            <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed">
                                {`import ipaddress

addr = ipaddress.IPv6Address('2001:db8::1')

print("Expanded:", addr.exploded)
print("Compressed:", addr.compressed)
print("Reverse DNS PTR:", addr.reverse_pointer)
print("Is IPv4-Mapped:", addr.ipv4_mapped)
print("Is Link-Local:", addr.is_link_local)
print("Raw 128-Bit Integer:", int(addr))
print("Hexadecimal:", hex(int(addr)))`}
                            </pre>
                        </div>

                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase">
                                Node.js (ipaddr.js Library)
                            </h3>
                            <pre className="text-[11px] font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                                {`import ipaddr from 'ipaddr.js';

const addr = ipaddr.parse('::ffff:192.168.1.1');

if (addr.kind() === 'ipv6') {
  console.log("Canonical:", addr.toNormalizedString());
  console.log("RFC 5952:", addr.toString());
  
  if (addr.isIPv4MappedAddress()) {
    const ipv4 = addr.toIPv4Address();
    console.log("Extracted IPv4:", ipv4.toString());
    console.log("Hex Value:", ipv4.toByteArray());
  }
}`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended FAQ */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
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
                                What is the difference between expanded and compressed IPv6 addresses?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An expanded IPv6 address explicitly writes out all 8 16-bit hextets using four hexadecimal characters each (32 total hex digits separated by 7 colons). A compressed IPv6 address follows RFC 5952 recommendations: leading zeros within each hextet are stripped, and the longest contiguous sequence of two or more zero-value hextets is replaced once by a double colon (::).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does IPv4 address embedding work within IPv6?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Under RFC 4291 and RFC 4038, standard 32-bit IPv4 addresses can be embedded inside 128-bit IPv6 headers. In IPv4-mapped addresses (::ffff:x.x.x.x), the first 80 bits are zero, bits 81-96 are set to one (ffff), and the final 32 bits contain the dotted quad IPv4 address, allowing dual-stack networking software to handle both protocols seamlessly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is an ip6.arpa reverse DNS PTR record?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An ip6.arpa PTR record enables reverse DNS lookups for IPv6 addresses. To construct it, the 128-bit address is completely expanded into 32 single hexadecimal nibbles, reversed in sequence, separated by dots, and appended with the domain &quot;.ip6.arpa&quot;.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are RFC 4193 Unique Local Addresses (ULA)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Unique Local Addresses (ULA) are the IPv6 counterpart to RFC 1918 private IPv4 spaces. Defined under prefix fc00::/7 (most commonly fd00::/8), ULAs are routable throughout private networks and enterprise VPNs but are strictly non-routable on the public global Internet.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my IP addresses logged or transmitted to your servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All IPv6 parsing, bitwise conversions, nibble reversals, and hexadecimal calculations execute strictly in your client-side browser memory. No telemetry, address data, or server requests are transmitted.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}