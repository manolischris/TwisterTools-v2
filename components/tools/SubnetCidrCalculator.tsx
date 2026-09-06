"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Network,
    Copy,
    Check,
    RotateCcw,
    Sliders,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Cpu,
    Boxes,
    Settings2,
    Binary,
    HelpCircle,
    Globe,
    Server,
    ShieldCheck,
    Terminal,
    ListFilter,
    ArrowRightLeft
} from "lucide-react";

interface SubnetResult {
    ip: string;
    cidr: number;
    subnetMask: string;
    wildcardMask: string;
    networkAddress: string;
    broadcastAddress: string;
    firstUsableIp: string;
    lastUsableIp: string;
    totalHosts: number;
    usableHosts: number;
    ipClass: string;
    ipType: "Private" | "Public" | "Loopback" | "Link-Local" | "Multicast" | "Reserved";
    binarySubnetMask: string;
    binaryIp: string;
    binaryNetwork: string;
    binaryBroadcast: string;
    integerIp: number;
    hexIp: string;
    ptrRecord: string;
}

interface SubnetRow {
    subnetIndex: number;
    networkAddress: string;
    usableRange: string;
    broadcastAddress: string;
    usableHosts: number;
    cidr: number;
}

const CIDR_PRESETS: { label: string; cidr: number; hosts: string }[] = [
    { label: "/24 (Class C)", cidr: 24, hosts: "254 hosts" },
    { label: "/26 (Medium Subnet)", cidr: 26, hosts: "62 hosts" },
    { label: "/28 (Micro Subnet)", cidr: 28, hosts: "14 hosts" },
    { label: "/30 (P2P Link)", cidr: 30, hosts: "2 hosts" },
    { label: "/16 (Class B)", cidr: 16, hosts: "65,534 hosts" },
];

const SAMPLE_ADDRESSES = [
    { ip: "192.168.1.100", cidr: 24, label: "Home LAN /24" },
    { ip: "10.0.45.12", cidr: 22, label: "Enterprise VPC /22" },
    { ip: "172.16.50.1", cidr: 26, label: "Branch Office /26" },
    { ip: "10.254.1.1", cidr: 30, label: "Point-to-Point /30" },
    { ip: "8.8.8.8", cidr: 24, label: "Public DNS /24" },
];

function ipToInt(ip: string): number {
    return (
        ip
            .split(".")
            .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0) >>> 0
    );
}

function intToIp(int: number): string {
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255,
    ].join(".");
}

function intToBinaryStr(int: number): string {
    const raw = (int >>> 0).toString(2).padStart(32, "0");
    return `${raw.slice(0, 8)}.${raw.slice(8, 16)}.${raw.slice(16, 24)}.${raw.slice(24, 32)}`;
}

function cidrToMaskInt(cidr: number): number {
    if (cidr === 0) return 0;
    return (0xffffffff << (32 - cidr)) >>> 0;
}

function maskIntToCidr(maskInt: number): number {
    let count = 0;
    let n = maskInt >>> 0;
    while (n > 0) {
        count += n & 1;
        n = n >>> 1;
    }
    return count;
}

function isValidIpv4(ip: string): boolean {
    const parts = ip.trim().split(".");
    if (parts.length !== 4) return false;
    for (const part of parts) {
        if (!/^\d+$/.test(part)) return false;
        const n = parseInt(part, 10);
        if (n < 0 || n > 255) return false;
        if (part.length > 1 && part.startsWith("0")) return false;
    }
    return true;
}

function isValidSubnetMask(mask: string): boolean {
    if (!isValidIpv4(mask)) return false;
    const maskInt = ipToInt(mask);
    const inverted = (~maskInt) >>> 0;
    return ((inverted + 1) & inverted) === 0;
}

function getIpClass(firstOctet: number): string {
    if (firstOctet >= 1 && firstOctet <= 126) return "Class A";
    if (firstOctet === 127) return "Class A (Loopback)";
    if (firstOctet >= 128 && firstOctet <= 191) return "Class B";
    if (firstOctet >= 192 && firstOctet <= 223) return "Class C";
    if (firstOctet >= 224 && firstOctet <= 239) return "Class D (Multicast)";
    if (firstOctet >= 240 && firstOctet <= 255) return "Class E (Experimental)";
    return "Unknown";
}

function getIpScope(ipInt: number): SubnetResult["ipType"] {
    const octet1 = (ipInt >>> 24) & 255;
    const octet2 = (ipInt >>> 16) & 255;

    if (octet1 === 10) return "Private";
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return "Private";
    if (octet1 === 192 && octet2 === 168) return "Private";
    if (octet1 === 127) return "Loopback";
    if (octet1 === 169 && octet2 === 254) return "Link-Local";
    if (octet1 >= 224 && octet1 <= 239) return "Multicast";
    if (octet1 >= 240) return "Reserved";
    return "Public";
}

export default function SubnetCidrCalculator() {
    const [ipInput, setIpInput] = useState<string>("192.168.1.150");
    const [cidrInput, setCidrInput] = useState<number>(24);
    const [maskInput, setMaskInput] = useState<string>("255.255.255.0");
    const [subdividePrefix, setSubdividePrefix] = useState<number>(26);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const ipFieldId = useId();
    const cidrSelectId = useId();
    const maskSelectId = useId();
    const subdivideId = useId();

    const validationError = useMemo(() => {
        if (!ipInput.trim()) return "Please enter an IPv4 address.";
        if (!isValidIpv4(ipInput.trim())) {
            return "Invalid IPv4 format. Provide 4 octets between 0 and 255 (e.g., 192.168.1.1).";
        }
        return null;
    }, [ipInput]);

    const subnetData = useMemo<SubnetResult | null>(() => {
        if (validationError) return null;

        const cleanIp = ipInput.trim();
        const ipInt = ipToInt(cleanIp);
        const maskInt = cidrToMaskInt(cidrInput);
        const wildcardInt = (~maskInt) >>> 0;
        const networkInt = (ipInt & maskInt) >>> 0;
        const broadcastInt = (networkInt | wildcardInt) >>> 0;

        const totalHosts = Math.pow(2, 32 - cidrInput);
        const usableHosts = cidrInput >= 31 ? (cidrInput === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

        let firstUsableInt = networkInt + 1;
        let lastUsableInt = broadcastInt - 1;

        if (cidrInput === 31) {
            firstUsableInt = networkInt;
            lastUsableInt = broadcastInt;
        } else if (cidrInput === 32) {
            firstUsableInt = networkInt;
            lastUsableInt = networkInt;
        }

        const octets = cleanIp.split(".");
        const ptrRecord = `${octets[3]}.${octets[2]}.${octets[1]}.${octets[0]}.in-addr.arpa`;

        return {
            ip: cleanIp,
            cidr: cidrInput,
            subnetMask: intToIp(maskInt),
            wildcardMask: intToIp(wildcardInt),
            networkAddress: intToIp(networkInt),
            broadcastAddress: intToIp(broadcastInt),
            firstUsableIp: intToIp(firstUsableInt),
            lastUsableIp: intToIp(lastUsableInt),
            totalHosts,
            usableHosts,
            ipClass: getIpClass(parseInt(octets[0], 10)),
            ipType: getIpScope(ipInt),
            binarySubnetMask: intToBinaryStr(maskInt),
            binaryIp: intToBinaryStr(ipInt),
            binaryNetwork: intToBinaryStr(networkInt),
            binaryBroadcast: intToBinaryStr(broadcastInt),
            integerIp: ipInt,
            hexIp: `0x${ipInt.toString(16).toUpperCase().padStart(8, "0")}`,
            ptrRecord,
        };
    }, [ipInput, cidrInput, validationError]);

    const subnetDivisionList = useMemo<SubnetRow[]>(() => {
        if (!subnetData || subdividePrefix <= subnetData.cidr) return [];
        const diff = subdividePrefix - subnetData.cidr;
        if (diff > 8) return [];

        const totalBlocks = Math.pow(2, diff);
        const parentNetworkInt = ipToInt(subnetData.networkAddress);
        const blockSize = Math.pow(2, 32 - subdividePrefix);
        const subMaskInt = cidrToMaskInt(subdividePrefix);
        const subWildcardInt = (~subMaskInt) >>> 0;

        const rows: SubnetRow[] = [];
        for (let i = 0; i < totalBlocks; i++) {
            const netInt = (parentNetworkInt + i * blockSize) >>> 0;
            const bcastInt = (netInt | subWildcardInt) >>> 0;

            let firstInt = netInt + 1;
            let lastInt = bcastInt - 1;
            let usable = Math.max(0, blockSize - 2);

            if (subdividePrefix === 31) {
                firstInt = netInt;
                lastInt = bcastInt;
                usable = 2;
            } else if (subdividePrefix === 32) {
                firstInt = netInt;
                lastInt = netInt;
                usable = 1;
            }

            rows.push({
                subnetIndex: i + 1,
                networkAddress: intToIp(netInt),
                usableRange: `${intToIp(firstInt)} - ${intToIp(lastInt)}`,
                broadcastAddress: intToIp(bcastInt),
                usableHosts: usable,
                cidr: subdividePrefix,
            });
        }
        return rows;
    }, [subnetData, subdividePrefix]);

    const handleIpChange = (val: string) => {
        if (val.includes("/")) {
            const [rawIp, rawPrefix] = val.split("/");
            setIpInput(rawIp.trim());
            const parsedPrefix = parseInt(rawPrefix, 10);
            if (!isNaN(parsedPrefix) && parsedPrefix >= 0 && parsedPrefix <= 32) {
                setCidrInput(parsedPrefix);
                setMaskInput(intToIp(cidrToMaskInt(parsedPrefix)));
                if (subdividePrefix <= parsedPrefix) {
                    setSubdividePrefix(Math.min(32, parsedPrefix + 2));
                }
            }
            return;
        }
        setIpInput(val);
    };

    const handleCidrSelect = (newCidr: number) => {
        setCidrInput(newCidr);
        setMaskInput(intToIp(cidrToMaskInt(newCidr)));
        if (subdividePrefix <= newCidr) {
            setSubdividePrefix(Math.min(32, newCidr + 2));
        }
    };

    const handleMaskChange = (newMask: string) => {
        setMaskInput(newMask);
        if (isValidSubnetMask(newMask)) {
            const calculatedCidr = maskIntToCidr(ipToInt(newMask));
            setCidrInput(calculatedCidr);
            if (subdividePrefix <= calculatedCidr) {
                setSubdividePrefix(Math.min(32, calculatedCidr + 2));
            }
        }
    };

    const handleLoadSample = (sample: { ip: string; cidr: number }) => {
        setIpInput(sample.ip);
        setCidrInput(sample.cidr);
        setMaskInput(intToIp(cidrToMaskInt(sample.cidr)));
        setSubdividePrefix(Math.min(32, sample.cidr + 2));
    };

    const handleReset = () => {
        setIpInput("192.168.1.150");
        setCidrInput(24);
        setMaskInput("255.255.255.0");
        setSubdividePrefix(26);
    };

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Subnet Mask and IPv4 CIDR Range Calculator",
        "url": "https://twistertools.com/tools/web-tools/subnet-cidr-calculator",
        "description": "Enterprise-grade IPv4 CIDR and Subnet Mask Calculator. Calculate network boundaries, broadcast addresses, usable IP host ranges, wildcard masks, binary representation, and VLSM subnet partitioning client-side.",
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
                "name": "What is CIDR and how does it relate to subnet masks?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CIDR (Classless Inter-Domain Routing) replaces historical Class A, B, and C addressing with flexible bitmask prefix notation (such as /24). The CIDR prefix indicates exactly how many contiguous bits from left to right represent the immutable network prefix, leaving the remaining bits for assigning unique host interfaces."
                }
            },
            {
                "@type": "Question",
                "name": "Why are two IP addresses subtracted when calculating usable hosts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In standard IPv4 subnets (/30 and larger), two addresses are reserved by RFC specifications: the very first address (all host bits set to 0) represents the Network Address, while the final address (all host bits set to 1) is reserved for the Directed Broadcast Address. Hence, Usable Hosts = (2^(32 - CIDR)) - 2."
                }
            },
            {
                "@type": "Question",
                "name": "How does RFC 3021 handle /31 subnets for point-to-point links?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "RFC 3021 standardizes the use of 31-bit prefixes on point-to-point links. In a /31 subnet, host addresses are limited to 2 total bits (0 and 1). Neither address is dedicated as a broadcast or standard network address, allowing both IPs to be assigned directly to the two connected router interfaces without address waste."
                }
            },
            {
                "@type": "Question",
                "name": "What is a wildcard mask and where is it used?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A wildcard mask is the exact bitwise inverse of a subnet mask (255.255.255.255 minus the subnet mask). Wildcard masks are widely deployed in Cisco IOS, Juniper Junos, and network access control lists (ACLs) as well as OSPF routing configurations to filter packets across IP ranges."
                }
            },
            {
                "@type": "Question",
                "name": "What are RFC 1918 Private IPv4 address allocations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "RFC 1918 reserves three specific address spaces for private local area networks that are non-routable on the public global Internet: 10.0.0.0/8 (10.0.0.0 - 10.255.255.255), 172.16.0.0/12 (172.16.0.0 - 172.31.255.255), and 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)."
                }
            },
            {
                "@type": "Question",
                "name": "Is my network calculation data logged or transmitted to external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All bitwise operations, integer masks, IP conversions, and VLSM partitions run completely client-side in your local browser sandbox. No IP addresses, corporate subnets, or topology data ever leave your machine."
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
                            Subnet Presets & Topology Templates
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 font-medium">Quick Scenarios:</span>
                        {SAMPLE_ADDRESSES.map((sample) => (
                            <button
                                key={sample.label}
                                type="button"
                                onClick={() => handleLoadSample(sample)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer border border-slate-200/60"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                    {/* IP / CIDR Combined Input */}
                    <div className="space-y-1.5 sm:col-span-2">
                        <label htmlFor={ipFieldId} className="text-xs font-bold text-slate-700 block">
                            IPv4 Address or CIDR Notation
                        </label>
                        <div className="relative">
                            <input
                                id={ipFieldId}
                                type="text"
                                value={ipInput}
                                onChange={(e) => handleIpChange(e.target.value)}
                                placeholder="e.g. 192.168.1.1 or 10.0.0.0/24"
                                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 outline-none transition"
                            />
                            <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                                IPv4
                            </span>
                        </div>
                    </div>

                    {/* CIDR Mask Select */}
                    <div className="space-y-1.5">
                        <label htmlFor={cidrSelectId} className="text-xs font-bold text-slate-700 block">
                            CIDR Prefix Length
                        </label>
                        <select
                            id={cidrSelectId}
                            value={cidrInput}
                            onChange={(e) => handleCidrSelect(parseInt(e.target.value, 10))}
                            className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium outline-none"
                        >
                            {Array.from({ length: 33 }, (_, i) => i).map((prefix) => (
                                <option key={prefix} value={prefix}>
                                    /{prefix} ({Math.pow(2, 32 - prefix).toLocaleString()} addresses)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subnet Mask Dotted Quad Select */}
                    <div className="space-y-1.5">
                        <label htmlFor={maskSelectId} className="text-xs font-bold text-slate-700 block">
                            Subnet Mask (Dotted Quad)
                        </label>
                        <select
                            id={maskSelectId}
                            value={maskInput}
                            onChange={(e) => handleMaskChange(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 text-slate-800 outline-none"
                        >
                            {Array.from({ length: 33 }, (_, i) => i).map((prefix) => {
                                const mask = intToIp(cidrToMaskInt(prefix));
                                return (
                                    <option key={mask} value={mask}>
                                        {mask} (/{prefix})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                {/* Common CIDR Chips */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Quick CIDR:</span>
                    {CIDR_PRESETS.map((preset) => (
                        <button
                            key={preset.cidr}
                            type="button"
                            onClick={() => handleCidrSelect(preset.cidr)}
                            className={`px-2.5 py-1 text-xs font-mono rounded-md border transition cursor-pointer ${cidrInput === preset.cidr
                                    ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Primary Network Architecture Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Network className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Subnet Architecture & Bounds
                            </h2>
                        </div>
                        {subnetData && (
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                /{subnetData.cidr} Prefix
                            </span>
                        )}
                    </div>

                    {validationError ? (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <span className="font-bold text-sm">Validation Error</span>
                                <p>{validationError}</p>
                            </div>
                        </div>
                    ) : subnetData ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                    <span className="text-[11px] font-medium text-slate-500 block">
                                        Network Address
                                    </span>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="font-mono text-sm font-bold text-slate-900">
                                            {subnetData.networkAddress}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(subnetData.networkAddress, "net")}
                                            className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                            title="Copy Network IP"
                                        >
                                            {copiedKey === "net" ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                    <span className="text-[11px] font-medium text-slate-500 block">
                                        Broadcast Address
                                    </span>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="font-mono text-sm font-bold text-slate-900">
                                            {subnetData.broadcastAddress}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(subnetData.broadcastAddress, "bcast")}
                                            className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                            title="Copy Broadcast IP"
                                        >
                                            {copiedKey === "bcast" ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1">
                                <span className="text-[11px] font-semibold text-indigo-700 block uppercase tracking-wider">
                                    Usable Host Allocation Range
                                </span>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-mono text-sm font-bold text-indigo-950">
                                        {subnetData.firstUsableIp} &rarr; {subnetData.lastUsableIp}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            copyToClipboard(
                                                `${subnetData.firstUsableIp} - ${subnetData.lastUsableIp}`,
                                                "range"
                                            )
                                        }
                                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-200 transition shadow-2xs"
                                    >
                                        {copiedKey === "range" ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                        {copiedKey === "range" ? "Copied" : "Copy Range"}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-[11px] text-slate-500 block">Usable Hosts</span>
                                    <span className="font-mono text-sm font-bold text-emerald-600">
                                        {subnetData.usableHosts.toLocaleString()}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-[11px] text-slate-500 block">Total Addresses</span>
                                    <span className="font-mono text-sm font-bold text-slate-900">
                                        {subnetData.totalHosts.toLocaleString()}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-[11px] text-slate-500 block">Address Class</span>
                                    <span className="font-mono text-xs font-bold text-indigo-600 truncate block">
                                        {subnetData.ipClass}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-[11px] text-slate-500 block">Scope</span>
                                    <span
                                        className={`font-mono text-xs font-bold block ${subnetData.ipType === "Private"
                                                ? "text-emerald-600"
                                                : subnetData.ipType === "Public"
                                                    ? "text-blue-600"
                                                    : "text-amber-600"
                                            }`}
                                    >
                                        {subnetData.ipType}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Subnet Mask:</span>
                                    <span className="font-mono font-bold text-slate-800">
                                        {subnetData.subnetMask}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Wildcard Mask:</span>
                                    <span className="font-mono font-bold text-slate-800">
                                        {subnetData.wildcardMask}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">CIDR Canonical:</span>
                                    <span className="font-mono font-bold text-indigo-600">
                                        {subnetData.networkAddress}/{subnetData.cidr}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Hexadecimal IPv4:</span>
                                    <span className="font-mono font-bold text-slate-800">{subnetData.hexIp}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-1">
                                    <span className="text-slate-500 font-medium">Reverse DNS (PTR):</span>
                                    <span className="font-mono font-bold text-slate-700 truncate max-w-[200px] sm:max-w-[280px]">
                                        {subnetData.ptrRecord}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <Boxes className="w-4 h-4 text-slate-400" />
                            Deterministic Bitwise Arithmetic
                        </span>
                        <span className="font-mono text-slate-600">RFC 791 / RFC 4632</span>
                    </div>
                </div>

                {/* Right Panel: Bitwise Binary Matrix & VLSM Partitioning */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Binary className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Binary Octet Representation
                            </h2>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">32-Bit Map</span>
                    </div>

                    {subnetData && (
                        <div className="space-y-4">
                            {/* Binary Breakdown View */}
                            <div className="p-3 bg-slate-950 rounded-xl space-y-2.5 font-mono text-xs text-slate-200 overflow-x-auto">
                                <div className="space-y-1">
                                    <span className="text-[11px] text-slate-400 block font-sans">
                                        Target IP Address
                                    </span>
                                    <div className="text-emerald-400 font-bold tracking-wider">
                                        {subnetData.binaryIp}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] text-slate-400 block font-sans">
                                        Subnet Bitmask (/{subnetData.cidr})
                                    </span>
                                    <div className="text-indigo-400 font-bold tracking-wider">
                                        {subnetData.binarySubnetMask}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] text-slate-400 block font-sans">
                                        Bitwise AND (Network Address)
                                    </span>
                                    <div className="text-amber-400 font-bold tracking-wider">
                                        {subnetData.binaryNetwork}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[11px] text-slate-400 block font-sans">
                                        Bitwise OR (Broadcast Address)
                                    </span>
                                    <div className="text-rose-400 font-bold tracking-wider">
                                        {subnetData.binaryBroadcast}
                                    </div>
                                </div>
                            </div>

                            {/* Subnet Division (VLSM) Tool */}
                            <div className="pt-2 border-t border-slate-100 space-y-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <label
                                        htmlFor={subdivideId}
                                        className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                                    >
                                        <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                                        Partition into Subnets of Prefix:
                                    </label>
                                    <select
                                        id={subdivideId}
                                        value={subdividePrefix}
                                        onChange={(e) => setSubdividePrefix(parseInt(e.target.value, 10))}
                                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold text-indigo-700 outline-none"
                                    >
                                        {Array.from(
                                            { length: Math.min(8, 32 - subnetData.cidr) },
                                            (_, i) => subnetData.cidr + i + 1
                                        ).map((p) => (
                                            <option key={p} value={p}>
                                                /{p} ({Math.pow(2, p - subnetData.cidr)} subnets)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {subnetDivisionList.length > 0 ? (
                                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[220px] overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                                                <tr>
                                                    <th className="p-2">#</th>
                                                    <th className="p-2">Network</th>
                                                    <th className="p-2">Usable IP Range</th>
                                                    <th className="p-2 text-right">Hosts</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 font-mono text-[11px] text-slate-700">
                                                {subnetDivisionList.map((row) => (
                                                    <tr key={row.subnetIndex} className="hover:bg-slate-50">
                                                        <td className="p-2 text-slate-400">{row.subnetIndex}</td>
                                                        <td className="p-2 font-bold text-indigo-600">
                                                            {row.networkAddress}/{row.cidr}
                                                        </td>
                                                        <td className="p-2">{row.usableRange}</td>
                                                        <td className="p-2 text-right font-bold text-slate-800">
                                                            {row.usableHosts.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl text-center">
                                        Increase prefix length to divide this network into smaller subnets.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Client-Side Sandbox Computation
                        </span>
                        <span className="text-slate-400">Zero Network Telemetry</span>
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
                            IPv4 Subnetting & CIDR Architecture: Core Engineering Foundations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Classless Inter-Domain Routing (CIDR) is the foundational addressing architecture of the global Internet, codified in RFC 4632 to eliminate the rigid inefficiencies of historical Class A, B, and C networks. By utilizing variable-length subnet masks (VLSM), systems architects, cloud engineers, and network administrators can partition address spaces with precision down to the exact bit, conserving scarce IPv4 allocations and structuring secure, isolated virtual private clouds (VPCs).
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Network className="w-4 h-4 text-indigo-600" /> Deterministic Masking
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Subnet masks designate the boundary line between the network identifier and the host identifier. A bitwise AND between an IPv4 address and its mask yields the immutable base network address.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Cloud VPC Segmentation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Designing AWS VPCs, Azure VNets, or Kubernetes pod CIDRs requires meticulous subnetting to segregate public dmz subnets, application containers, and private isolated databases.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Route Summarization
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                CIDR supernetting collapses thousands of regional routing table entries into consolidated upstream prefixes, protecting BGP core routers from global routing table exhaustion.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: CIDR Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Complete IPv4 CIDR Reference Matrix & Host Capacities
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refer to the authoritative table below to quickly correlate prefix lengths, dotted quad masks, wildcard inverses, and usable host allowances across standard subnets:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">CIDR Prefix</th>
                                    <th className="p-3">Subnet Mask</th>
                                    <th className="p-3">Wildcard Mask</th>
                                    <th className="p-3">Total IPs</th>
                                    <th className="p-3">Usable Hosts</th>
                                    <th className="p-3">Typical Enterprise Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/32</td>
                                    <td className="p-3 font-mono">255.255.255.255</td>
                                    <td className="p-3 font-mono">0.0.0.0</td>
                                    <td className="p-3 font-mono">1</td>
                                    <td className="p-3 font-mono font-bold">1</td>
                                    <td className="p-3">Host route, loopback interface, firewall rule</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/31</td>
                                    <td className="p-3 font-mono">255.255.255.254</td>
                                    <td className="p-3 font-mono">0.0.0.1</td>
                                    <td className="p-3 font-mono">2</td>
                                    <td className="p-3 font-mono font-bold">2</td>
                                    <td className="p-3">Point-to-point links (RFC 3021, no broadcast waste)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/30</td>
                                    <td className="p-3 font-mono">255.255.255.252</td>
                                    <td className="p-3 font-mono">0.0.0.3</td>
                                    <td className="p-3 font-mono">4</td>
                                    <td className="p-3 font-mono font-bold">2</td>
                                    <td className="p-3">Legacy point-to-point router links</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/29</td>
                                    <td className="p-3 font-mono">255.255.255.248</td>
                                    <td className="p-3 font-mono">0.0.0.7</td>
                                    <td className="p-3 font-mono">8</td>
                                    <td className="p-3 font-mono font-bold">6</td>
                                    <td className="p-3">ISP static IP block for small firewalls / HA pairs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/28</td>
                                    <td className="p-3 font-mono">255.255.255.240</td>
                                    <td className="p-3 font-mono">0.0.0.15</td>
                                    <td className="p-3 font-mono">16</td>
                                    <td className="p-3 font-mono font-bold">14</td>
                                    <td className="p-3">Demilitarized Zones (DMZs), small server clusters</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/27</td>
                                    <td className="p-3 font-mono">255.255.255.224</td>
                                    <td className="p-3 font-mono">0.0.0.31</td>
                                    <td className="p-3 font-mono">32</td>
                                    <td className="p-3 font-mono font-bold">30</td>
                                    <td className="p-3">Departmental subnets, branch office staging</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/26</td>
                                    <td className="p-3 font-mono">255.255.255.192</td>
                                    <td className="p-3 font-mono">0.0.0.63</td>
                                    <td className="p-3 font-mono">64</td>
                                    <td className="p-3 font-mono font-bold">62</td>
                                    <td className="p-3">Cloud microservice clusters, database replica tiers</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/24</td>
                                    <td className="p-3 font-mono">255.255.255.0</td>
                                    <td className="p-3 font-mono">0.0.0.255</td>
                                    <td className="p-3 font-mono">256</td>
                                    <td className="p-3 font-mono font-bold">254</td>
                                    <td className="p-3">Standard corporate LANs, Class C equivalent</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/22</td>
                                    <td className="p-3 font-mono">255.255.252.0</td>
                                    <td className="p-3 font-mono">0.0.3.255</td>
                                    <td className="p-3 font-mono">1,024</td>
                                    <td className="p-3 font-mono font-bold">1,022</td>
                                    <td className="p-3">Standard Cloud VPC tier (AWS / GCP / Azure)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">/16</td>
                                    <td className="p-3 font-mono">255.255.0.0</td>
                                    <td className="p-3 font-mono">0.0.255.255</td>
                                    <td className="p-3 font-mono">65,536</td>
                                    <td className="p-3 font-mono font-bold">65,534</td>
                                    <td className="p-3">Large enterprise VPC root supernet, Class B equivalent</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Private vs Public Addressing & Security Guardrails */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Private RFC 1918 Address Blocks & Security Routing Rules
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The Internet Assigned Numbers Authority (IANA) reserved three blocks of IPv4 space exclusively for internal enterprise operations under RFC 1918. Routers on the public Internet are explicitly configured to drop traffic originating from or addressed to these ranges without NAT translation.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="font-mono text-xs font-bold text-indigo-600 uppercase block">
                                10.0.0.0/8 Block
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm">Large Enterprise & Cloud</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Encompasses 10.0.0.0 through 10.255.255.255 (16,777,216 addresses). Ideal for multi-region VPC topologies, Kubernetes pod overlays, and massive interconnected branch networks.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="font-mono text-xs font-bold text-indigo-600 uppercase block">
                                172.16.0.0/12 Block
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm">Medium Enterprise & Docker</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Spans 172.16.0.0 through 172.31.255.255 (1,048,576 addresses). The standard default CIDR block utilized by Docker bridge network drivers and regional data centers.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="font-mono text-xs font-bold text-indigo-600 uppercase block">
                                192.168.0.0/16 Block
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm">Small Office & Home (SOHO)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Covers 192.168.0.0 through 192.168.255.255 (65,536 addresses). Divided almost ubiquitously into /24 subnets (like 192.168.1.0/24) for residential routers and small branch switches.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Network Engineering Automation Code */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Terminal className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Automated Subnet Verification (Python 3 & Terraform)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Integrate programmatic CIDR subnet calculations into CI/CD pipelines and infrastructure-as-code deployments to prevent IP collision errors before provisioning cloud infrastructure:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-indigo-400 font-mono uppercase">
                                Python 3 (ipaddress Standard Library)
                            </h3>
                            <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed">
                                {`import ipaddress

# Initialize IPv4 network object
net = ipaddress.ip_network('192.168.1.0/24', strict=False)

print("Network Address:", net.network_address)
print("Broadcast Address:", net.broadcast_address)
print("Subnet Mask:", net.netmask)
print("Wildcard Mask:", net.hostmask)
print("Usable Host Range:", f"{net[1]} - {net[-2]}")
print("Total Usable Hosts:", net.num_addresses - 2)

# Subdivide into smaller /26 micro-subnets
subnets = list(net.subnets(new_prefix=26))
for idx, sub in enumerate(subnets, 1):
    print(f"Subnet {idx}: {sub.with_prefixlen}")`}
                            </pre>
                        </div>

                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 min-w-0">
                            <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase">
                                Terraform (cidrsubnet Function)
                            </h3>
                            <pre className="text-[11px] font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                                {`variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

# Automatically carve /24 subnets from /16 VPC root
resource "aws_subnet" "public_subnets" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  # cidrsubnet(prefix, newbits, netnum)
  # adds 8 bits to /16 -> yields /24
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "Public-Subnet-\${count.index + 1}"
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
                                What is CIDR and how does it relate to subnet masks?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                CIDR (Classless Inter-Domain Routing) replaces historical Class A, B, and C addressing with flexible bitmask prefix notation (such as /24). The CIDR prefix indicates exactly how many contiguous bits from left to right represent the immutable network prefix, leaving the remaining bits for assigning unique host interfaces.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why are two IP addresses subtracted when calculating usable hosts?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In standard IPv4 subnets (/30 and larger), two addresses are reserved by RFC specifications: the very first address (all host bits set to 0) represents the Network Address, while the final address (all host bits set to 1) is reserved for the Directed Broadcast Address. Hence, Usable Hosts = (2^(32 - CIDR)) - 2.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does RFC 3021 handle /31 subnets for point-to-point links?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                RFC 3021 standardizes the use of 31-bit prefixes on point-to-point links. In a /31 subnet, host addresses are limited to 2 total bits (0 and 1). Neither address is dedicated as a broadcast or standard network address, allowing both IPs to be assigned directly to the two connected router interfaces without address waste.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a wildcard mask and where is it used?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A wildcard mask is the exact bitwise inverse of a subnet mask (255.255.255.255 minus the subnet mask). Wildcard masks are widely deployed in Cisco IOS, Juniper Junos, and network access control lists (ACLs) as well as OSPF routing configurations to filter packets across IP ranges.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are RFC 1918 Private IPv4 address allocations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                RFC 1918 reserves three specific address spaces for private local area networks that are non-routable on the public global Internet: 10.0.0.0/8 (10.0.0.0 - 10.255.255.255), 172.16.0.0/12 (172.16.0.0 - 172.31.255.255), and 192.168.0.0/16 (192.168.0.0 - 192.168.255.255).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my network calculation data logged or transmitted to external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All bitwise operations, integer masks, IP conversions, and VLSM partitions run completely client-side in your local browser sandbox. No IP addresses, corporate subnets, or topology data ever leave your machine.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}