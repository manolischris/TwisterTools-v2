"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Search,
  Check,
  Copy,
  AlertTriangle,
  Trash2,
  RefreshCw,
  HelpCircle,
  Shield,
  Server,
  Database,
  MapPin,
  Compass,
  Cpu,
  Wifi,
  Radio,
  Share2,
  Crosshair,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface GeoIpData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  postal: string;
  timezone: string;
  asn: string;
  org: string;
  network?: string;
  currency?: string;
  calling_code?: string;
}

const PRESET_IPS = [
  { label: "Cloudflare (1.1.1.1)", ip: "1.1.1.1" },
  { label: "Google DNS (8.8.8.8)", ip: "8.8.8.8" },
  { label: "Quad9 (9.9.9.9)", ip: "9.9.9.9" },
  { label: "OpenDNS (208.67.222.222)", ip: "208.67.222.222" },
];

// ─────────────────────────────────────────────────────────────
// Component Implementation
// ─────────────────────────────────────────────────────────────

export default function IpLocation() {
  const [targetIp, setTargetIp] = useState("");
  const [data, setData] = useState<GeoIpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [userOwnIp, setUserOwnIp] = useState<string | null>(null);

  // Normalize GeoIpData from a provider response
  const normalizeGeoData = (raw: Record<string, unknown>, source: "ipapi" | "ip-api"): GeoIpData | null => {
    if (source === "ip-api") {
      if (raw.status === "fail") return null;
      return {
        ip: (raw.query as string) || "Unknown",
        city: (raw.city as string) || "N/A",
        region: (raw.regionName as string) || (raw.region as string) || "N/A",
        country_name: (raw.country as string) || "N/A",
        country_code: (raw.countryCode as string) || "N/A",
        latitude: (raw.lat as number) || 0,
        longitude: (raw.lon as number) || 0,
        postal: (raw.zip as string) || "N/A",
        timezone: (raw.timezone as string) || "UTC",
        asn: (raw.as as string) || "N/A",
        org: (raw.org as string) || (raw.isp as string) || "N/A",
        network: (raw.as as string) || "N/A",
        currency: "N/A",
        calling_code: "N/A",
      };
    }

    // ipapi.co format
    if (raw.error) return null;
    return {
      ip: (raw.ip as string) || "Unknown",
      city: (raw.city as string) || "N/A",
      region: (raw.region as string) || "N/A",
      country_name: (raw.country_name as string) || "N/A",
      country_code: (raw.country_code as string) || "N/A",
      latitude: (raw.latitude as number) || 0,
      longitude: (raw.longitude as number) || 0,
      postal: (raw.postal as string) || "N/A",
      timezone: (raw.timezone as string) || "UTC",
      asn: (raw.asn as string) || "N/A",
      org: (raw.org as string) || "N/A",
      network: (raw.network as string) || "N/A",
      currency: (raw.currency as string) || "N/A",
      calling_code: (raw.country_calling_code as string) || "N/A",
    };
  };

  // Fetch target IP location via server-side API proxy
  // Using Next.js API route to bypass CORS and browser extension fetch interceptors
  const fetchIpDetails = useCallback(async (ipToQuery?: string) => {
    setLoading(true);
    setError(null);
    const query = ipToQuery !== undefined ? ipToQuery.trim() : targetIp.trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const params = new URLSearchParams();
      if (query) params.set("ip", query);

      const response = await fetch(`/api/geoip?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          (errBody as { error?: string }).error ||
          `GeoIP lookup failed (Status: ${response.status})`
        );
      }

      const result = await response.json() as {
        provider: "ip-api" | "ipapi";
        data: Record<string, unknown>;
      };

      const formatted = normalizeGeoData(result.data, result.provider);
      if (formatted) {
        setData(formatted);
        if (!ipToQuery && !userOwnIp) setUserOwnIp(formatted.ip);
      } else {
        throw new Error("Invalid response from GeoIP provider.");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected network error occurred while querying the GeoIP database."
      );
      setData(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [targetIp, userOwnIp]);

  // Initial load: Fetch client's own IP geolocation
  useEffect(() => {
    fetchIpDetails("");
  }, [fetchIpDetails]);

  const handleClear = () => {
    setTargetIp("");
    setData(null);
    setError(null);
  };

  const copyResults = async () => {
    if (!data) return;
    const summary = `IP Location Report:
IP Address: ${data.ip}
Location: ${data.city}, ${data.region}, ${data.country_name} (${data.country_code})
Coordinates: ${data.latitude}, ${data.longitude}
Postal Code: ${data.postal}
Timezone: ${data.timezone}
ISP / Org: ${data.org}
ASN: ${data.asn}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fallback */
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        {/* ══════════════════ LEFT PANEL: Input & Actions ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <Globe className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">GeoIP Query Terminal</span>
              </div>
            </div>

            <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Search Input */}
                <div className="space-y-2">
                  <label htmlFor="ip-input" className="block text-sm font-semibold text-slate-800">
                    Enter IPv4 or IPv6 Address
                  </label>
                  <div className="relative">
                    <input
                      id="ip-input"
                      type="text"
                      value={targetIp}
                      onChange={(e) => setTargetIp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchIpDetails()}
                      placeholder="e.g., 8.8.8.8 or leave blank for your IP"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-sm"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Primary Control Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="btn-lookup-ip"
                    onClick={() => fetchIpDetails()}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all min-h-[44px] disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crosshair className="w-4 h-4" />
                    )}
                    {loading ? "Locating..." : "Lookup Location"}
                  </button>
                  <button
                    id="btn-my-ip"
                    onClick={() => {
                      setTargetIp("");
                      fetchIpDetails("");
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all min-h-[44px]"
                  >
                    <Wifi className="w-4 h-4 text-indigo-600" />
                    Check My IP
                  </button>
                </div>

                {/* Quick IP Presets */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Public Anycast Presets
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_IPS.map((preset) => (
                      <button
                        key={preset.ip}
                        onClick={() => {
                          setTargetIp(preset.ip);
                          fetchIpDetails(preset.ip);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Action */}
                <div className="pt-2">
                  <button
                    onClick={handleClear}
                    disabled={!targetIp && !data}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-xs rounded-lg transition-all border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Workspace
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm mt-4">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: GeoIP Results & Map ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-snug">Geolocation & Network Telemetry</h2>
                  <p className="text-xs text-indigo-100">Authoritative GeoIP intelligence report</p>
                </div>
              </div>
              {data && (
                <button
                  onClick={copyResults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Telemetry"}</span>
                </button>
              )}
            </div>

            {/* Results Body */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
              {data ? (
                <>
                  {/* Hero Metric Banner */}
                  <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-100 rounded-2xl p-5 text-center relative overflow-hidden">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                      Queried IP Address
                    </span>
                    <p className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono tracking-tight break-all">
                      {data.ip}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 font-medium flex items-center justify-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      {data.city}, {data.region}, {data.country_name} ({data.country_code})
                    </p>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        Coordinates
                      </div>
                      <p className="text-xs font-bold font-mono text-slate-800">
                        {data.latitude}, {data.longitude}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Globe className="w-3.5 h-3.5 text-indigo-600" />
                        Timezone
                      </div>
                      <p className="text-xs font-bold font-mono text-slate-800 truncate">
                        {data.timezone}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Server className="w-3.5 h-3.5 text-indigo-600" />
                        ISP / Provider
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate" title={data.org}>
                        {data.org}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Radio className="w-3.5 h-3.5 text-indigo-600" />
                        Autonomous System (ASN)
                      </div>
                      <p className="text-xs font-bold font-mono text-slate-800 truncate">
                        {data.asn}
                      </p>
                    </div>
                  </div>

                  {/* OpenStreetMap Visualizer Embed */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden h-48 bg-slate-100 relative">
                    <iframe
                      title="IP Location Visualizer Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.05}%2C${data.latitude - 0.05}%2C${data.longitude + 0.05}%2C${data.latitude + 0.05}&layer=mapnik&marker=${data.latitude}%2C${data.longitude}`}
                      className="w-full h-full"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700">No Location Query Executed</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Enter an IP address or click "Check My IP" to view high-precision location coordinates, network ASN telemetry, and map visualizer.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        {/* Card 1: What is GeoIP Tracking */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Understanding IP Geolocation & GeoIP Database Mapping</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            <strong>IP Geolocation</strong> is the technique used to determine the physical geographical location of a computer or network device connected to the internet using its public IP address. Every device communicating across the global internet relies on an IP address assigned by an Internet Service Provider (ISP) or Regional Internet Registry (RIR) such as ARIN, RIPE NCC, APNIC, LACNIC, or AFRINIC.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            GeoIP lookup tools cross-reference public IP addresses against massive, continuously updated databases that map IP address blocks to real-world geographical coordinates, postal codes, cities, countries, Autonomous System Numbers (ASNs), and internet routing infrastructure.
          </p>
        </div>

        {/* Card 2: Strategic Applications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Enterprise Applications of IP Telemetry</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Cybersecurity & Anti-Fraud",
                body: "Detect anomalous logins, verify user location during high-risk financial transactions, and block malicious traffic originating from untrusted regions or known proxy networks.",
              },
              {
                title: "Localized Content Delivery",
                body: "Automatically route web traffic to the nearest regional CDN edge server, display local currencies, adapt language defaults, and deliver targeted geo-aware marketing campaigns.",
              },
              {
                title: "Digital Rights Management",
                body: "Enforce regional copyright licensing and geofencing compliance rules across media streaming platforms, gaming portals, and digital distribution storefronts.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: GeoIP Accuracy Reference Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>GeoIP Accuracy & Granularity Breakdown</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Location Level</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Typical Accuracy Rate</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Primary Data Source</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Common Bottlenecks</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Country Level", "99% - 99.8%", "RIR Registry Allocations", "Global Anycast IP BGP Routing"],
                  ["Region / State Level", "80% - 90%", "ISP POP Infrastructure Data", "Dynamic IP Address Pool Reassignment"],
                  ["City Level", "50% - 75%", "Cellular Towers & ISP Hubs", "VPNs, Proxies, and Tor Nodes"],
                  ["Postal Code", "20% - 40%", "Local Broadband Node Hubs", "Aggregated Enterprise NAT Gateways"],
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

        {/* Card 4: How to Perform Lookup */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Perform an Instant GeoIP Inspection</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            TwisterTools provides zero-latency IP address inspection. Enter any target public IPv4 or IPv6 address into the terminal field or click "Check My IP" to view immediate geographical coordinates, ASN details, ISP organization metadata, and interactive map visualizations.
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
                q: "Can IP geolocation pinpoint my exact home address or street number?",
                a: "No. IP geolocation maps to ISP point-of-presence (POP) routing hubs, cities, or postal regions. It cannot identify specific physical house addresses or street locations, protecting individual subscriber privacy.",
              },
              {
                q: "Why does my IP address location show a different city than where I live?",
                a: "ISPs dynamically assign IP addresses from centralized regional pools. If your ISP routes traffic through a major data center in a neighboring city, GeoIP databases will report the data center hub location rather than your exact residential neighborhood.",
              },
              {
                q: "How do VPNs and proxies affect IP location lookups?",
                a: "Virtual Private Networks (VPNs) and proxy servers route your internet connection through an encrypted tunnel to a remote server. Consequently, GeoIP lookups will display the physical location of the VPN exit server rather than your actual device.",
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
            name: "IP Location Lookup & GeoIP Visualizer",
            applicationCategory: "UtilityApplication",
            operatingSystem: "All",
            description: "Free online IP location lookup tool to inspect IPv4/IPv6 geographical coordinates, ASN telemetry, ISP networks, and map visualizers.",
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
                name: "Can IP geolocation pinpoint my exact home address?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. IP geolocation maps to ISP routing hubs and city regions, not specific physical house addresses.",
                },
              },
              {
                "@type": "Question",
                name: "How do VPNs affect IP location lookups?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "VPNs tunnel your connection through a remote server, making lookups display the VPN exit node location.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}