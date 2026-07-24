"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Wifi,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Server,
  MapPin,
  Clock,
  Radio,
  Lock,
  Activity,
  Layers,
  HelpCircle,
  Database,
  BarChart3,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  Search,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface NetworkDetails {
  ip: string;
  ipType: "IPv4" | "IPv6" | "Unknown";
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  asn?: string;
  isp?: string;
  isProxy?: boolean;
  isVpn?: boolean;
  isTor?: boolean;
  userAgent: string;
  screenResolution: string;
  connectionType?: string;
  language: string;
}

// ─────────────────────────────────────────────────────────────
// Main Component Implementation
// ─────────────────────────────────────────────────────────────

export default function WhatIsMyIp() {
  const [networkData, setNetworkData] = useState<NetworkDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  // Ping latency measure
  const measureLatency = async () => {
    const start = performance.now();
    try {
      await fetch("https://1.1.1.1/cdn-cgi/trace", { mode: "no-cors", cache: "no-store" });
      const duration = Math.round(performance.now() - start);
      setPingLatency(duration);
    } catch {
      setPingLatency(null);
    }
  };

  // Fetch IP and Network Information via local API proxy
  const fetchNetworkDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const res = await fetch("/api/what-is-my-ip");
      if (!res.ok) {
        throw new Error("Unable to retrieve IP network details.");
      }
      const data = await res.json();

      const duration = Math.round(performance.now() - startTime);
      setPingLatency(duration);

      const isIPv6 = data.ip ? data.ip.includes(":") : false;

      setNetworkData({
        ip: data.ip || "Unavailable",
        ipType: isIPv6 ? "IPv6" : "IPv4",
        city: data.city || "Unknown",
        region: data.region || "Unknown",
        country: data.country || "Unknown",
        countryCode: data.countryCode || "XX",
        loc: data.loc || "N/A",
        org: data.org || "Unknown ISP",
        postal: data.postal || "N/A",
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        asn: data.asn || "N/A",
        isp: data.isp || "Unknown Provider",
        isProxy: data.isProxy || false,
        isVpn: data.isVpn || false,
        isTor: data.isTor || false,
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "N/A",
        screenResolution: typeof window !== "undefined" ? `${window.screen.width} x ${window.screen.height}` : "N/A",
        language: typeof window !== "undefined" ? navigator.language : "en-US",
        connectionType: typeof navigator !== "undefined" && "connection" in navigator ? (navigator as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType || "High-Speed Broadband" : "Broadband",
      });
    } catch {
      setError("Failed to resolve public IP address and network attributes. Please verify your internet connection or ad-blocker settings.");
    } finally {
      setLoading(false);
      measureLatency();
    }
  }, []);

  useEffect(() => {
    fetchNetworkDetails();
  }, [fetchNetworkDetails]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="w-full space-y-8">
      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: Primary IP & Geolocation ══════════════════ */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <Wifi className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Public IP Card</span>
              </div>
              {networkData && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Radio className="w-3 h-3 text-indigo-600 animate-pulse" />
                  {networkData.ipType}
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-600">Inspecting Public Network Connection...</p>
                </div>
              ) : error ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : networkData ? (
                <div className="space-y-5">
                  {/* Big IP Hero Container */}
                  <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-100 rounded-2xl p-6 text-center relative">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                      Your Active Public IP Address
                    </span>
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight break-all">
                        {networkData.ip}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(networkData.ip, "ip")}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all"
                    >
                      {copiedField === "ip" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === "ip" ? "IP Address Copied!" : "Copy IP Address"}</span>
                    </button>
                  </div>

                  {/* Geolocation Data Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        Location
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {networkData.city}, {networkData.region}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Globe className="w-3.5 h-3.5 text-indigo-600" />
                        Country
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {networkData.country} ({networkData.countryCode})
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Timezone
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">{networkData.timezone}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                        Network Latency
                      </div>
                      <p className="text-sm font-bold font-mono text-slate-800">
                        {pingLatency !== null ? `${pingLatency} ms` : "Calculating..."}
                      </p>
                    </div>
                  </div>

                  {/* Refresh Button Centered */}
                  <div className="flex justify-center">
                    <button
                      onClick={fetchNetworkDetails}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      <span>Refresh Audit</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: ISP, Security & Browser Metrics ══════════════════ */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">ISP & Network Security Inspector</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-600">Gathering ISP & Security Telemetry...</p>
                </div>
              ) : networkData ? (
                <div className="space-y-4">
                  {/* Network Service Provider Details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-semibold text-slate-500">Internet Service Provider (ISP)</span>
                      <span className="text-xs font-bold text-slate-900 font-mono truncate max-w-[200px]">{networkData.isp}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-semibold text-slate-500">Autonomous System Number (ASN)</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">{networkData.asn}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Coordinates (Lat, Long)</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">{networkData.loc}</span>
                    </div>
                  </div>

                  {/* Privacy & Anonymity Audit */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Connection Privacy Status
                    </h3>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 block">VPN Connection</span>
                        <span className={`text-xs font-bold ${networkData.isVpn ? "text-amber-600" : "text-emerald-600"}`}>
                          {networkData.isVpn ? "Detected" : "Not Active"}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 block">Proxy Gateway</span>
                        <span className={`text-xs font-bold ${networkData.isProxy ? "text-amber-600" : "text-emerald-600"}`}>
                          {networkData.isProxy ? "Detected" : "None"}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 block">TOR Node</span>
                        <span className={`text-xs font-bold ${networkData.isTor ? "text-amber-600" : "text-emerald-600"}`}>
                          {networkData.isTor ? "Detected" : "None"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Browser Environment Headers */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-semibold text-slate-500">Screen Resolution:</span>
                      <span className="font-mono text-slate-900 font-semibold">{networkData.screenResolution}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-semibold text-slate-500">Language Header:</span>
                      <span className="font-mono text-slate-900 font-semibold">{networkData.language}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-slate-700 pt-1 border-t border-slate-200">
                      <span className="font-semibold text-slate-500">User Agent String:</span>
                      <span className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-200 break-all">
                        {networkData.userAgent}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        {/* Card 1: What is an IP Address */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Understanding IP Addresses and Public Network Identifiers</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            An <strong>IP Address (Internet Protocol Address)</strong> is a unique numerical identifier assigned to every device connected to a computer network that uses the Internet Protocol for communication. Acting as a digital return address, your public IP address allows web servers, cloud services, and online applications to route data packets back to your router or modem accurately across global networking infrastructures.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Public IP addresses are assigned by your <strong>Internet Service Provider (ISP)</strong> under the oversight of regional internet registries such as ARIN, RIPE NCC, and APNIC. While local private IP addresses (such as 192.168.1.1) exist behind your home router, your public IP is the visible internet gateway exposed to every web service you interact with.
          </p>
        </div>

        {/* Card 2: IPv4 vs IPv6 Architectural Comparison */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Architectural Differences: IPv4 vs IPv6</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                IPv4 (Internet Protocol Version 4)
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                Utilizes a 32-bit address structure expressed as four decimal numbers separated by periods (e.g., 192.0.2.1). Supports a total address space of ~4.3 billion unique IPs, leading to network depletion and widespread reliance on NAT (Network Address Translation).
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                IPv6 (Internet Protocol Version 6)
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                Employs a 128-bit hexadecimal address structure separated by colons (e.g., 2001:db8::8a2e:370:7334). Offers virtually unlimited unique IP addresses ($3.4 \times 10^{38}$), eliminating NAT requirements and providing built-in IPsec security headers.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Geolocation and Security Audit Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>IP Telemetry & Network Attributes Matrix</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Network Attribute</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Description</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Security Impact</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Primary Use Case</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Public IP Address", "Global routing endpoint for your connection", "Exposes approximate physical region", "Data packet routing"],
                  ["ISP & Autonomous System", "Carrier network operator (ASN identifier)", "Identifies network trust tier", "Routing table configuration"],
                  ["GeoIP Location", "City/Region/Country calculated via IP databases", "Used for localized content delivery", "Geo-blocking & local CDN routing"],
                  ["Proxy / VPN Flag", "Indicates encrypted tunneling or relay nodes", "Reveals potential anonymity masking", "Fraud prevention & access control"],
                  ["Browser User-Agent", "HTTP header broadcasting OS and browser engine", "Used in device fingerprinting", "Responsive web asset optimization"],
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                  >
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: How to Protect Your IP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Mask and Secure Your Public IP Address</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Because your public IP address can reveal your approximate geographic location and network carrier, protecting it is essential for online privacy. Using a <strong>Virtual Private Network (VPN)</strong> encrypts your internet traffic and routes it through a secure remote server, replacing your actual public IP with an IP owned by the VPN service. Additionally, utilizing proxy servers or privacy-focused DNS gateways helps safeguard your online digital footprint from unauthorized tracking.
          </p>
        </div>

        {/* Card 5: FAQ Section */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "How accurate is the IP geolocation data shown in this tool?",
                a: "IP geolocation is highly accurate at the country and state/region level (95%+ accuracy). However, city-level accuracy typically ranges from 70% to 80% because public IP ranges are dynamically assigned to central ISP routing nodes rather than specific physical street addresses.",
              },
              {
                q: "Why does my IP address change periodically?",
                a: "Most residential Internet Service Providers assign dynamic IP addresses using DHCP (Dynamic Host Configuration Protocol). Your ISP may change your IP address whenever your router reboots, after network maintenance, or automatically when your DHCP lease expires.",
              },
              {
                q: "Can anyone find my exact physical home address from my public IP?",
                a: "No. A public IP address only reveals your Internet Service Provider and regional routing hub. Only your ISP maintains internal logs connecting a specific IP address to a physical customer address, and that information is protected by privacy laws.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "What Is My IP Address & Network Inspector",
            applicationCategory: "UtilityApplication",
            operatingSystem: "All",
            description: "Instant real-time public IP address detection, ISP verification, geolocation lookup, and connection security audit tool.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How accurate is the IP geolocation data shown in this tool?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "IP geolocation is highly accurate at the country and state level (95%+), with city accuracy ranging between 70% and 80%.",
                },
              },
              {
                "@type": "Question",
                name: "Why does my IP address change periodically?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Most residential ISPs assign dynamic IP addresses via DHCP, which change when routers restart or leases expire.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}