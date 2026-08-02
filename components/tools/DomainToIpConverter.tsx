"use client";

import React, { useState, useCallback } from "react";
import {
  Globe,
  Search,
  Check,
  Copy,
  AlertTriangle,
  Trash2,
  RefreshCw,
  HelpCircle,
  Server,
  Network,
  Shield,
  Activity,
  Zap,
  Terminal,
  Database,
  Layers,
  Share2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
}

interface IpInspectionResult {
  domain: string;
  ipAddress: string;
  ipVersion: "IPv4" | "IPv6";
  hostname: string;
  isp: string;
  organization: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  asn: string;
  records: DnsRecord[];
}

const PRESET_DOMAINS = [
  "google.com",
  "cloudflare.com",
  "github.com",
  "wikipedia.org",
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function DomainToIpConverter() {
  const [domainInput, setDomainInput] = useState("");
  const [result, setResult] = useState<IpInspectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLookup = useCallback(async (targetDomain?: string) => {
    const rawTarget = targetDomain !== undefined ? targetDomain : domainInput;
    setError(null);

    // Basic domain clean-up
    let cleanDomain = rawTarget.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    if (!cleanDomain) {
      setError("Please enter a valid domain name to inspect.");
      return;
    }

    setLoading(true);

    try {
      // Single request to our internal API route that handles both DNS and Geo lookup server-side
      const response = await fetch(`/api/dns?domain=${encodeURIComponent(cleanDomain)}`);

      if (!response.ok) {
        let errorMsg = "DNS lookup failed. Please check the domain and try again.";
        try {
          const errBody = await response.json();
          if (errBody.error) {
            errorMsg = errBody.error;
          }
        } catch {
          // Use default error message if response body cannot be parsed
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      setResult({
        domain: data.domain,
        ipAddress: data.ipAddress,
        ipVersion: data.ipVersion,
        hostname: data.hostname,
        isp: data.isp,
        organization: data.organization,
        country: data.country,
        countryCode: data.countryCode,
        region: data.region,
        city: data.city,
        asn: data.asn,
        records: data.records,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during DNS lookup."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [domainInput]);

  const handleClear = () => {
    setDomainInput("");
    setResult(null);
    setError(null);
  };

  const copyReport = async () => {
    if (!result) return;
    const text = `Domain: ${result.domain}\nIP Address: ${result.ipAddress} (${result.ipVersion})\nLocation: ${result.city}, ${result.region}, ${result.country}\nISP / Org: ${result.isp} / ${result.organization}\nASN: ${result.asn}`;
    try {
      await navigator.clipboard.writeText(text);
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
        {/* ══════════════════ LEFT PANEL: Control & Input ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <Globe className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Domain to IP Resolver</span>
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              {/* Domain Input */}
              <div className="space-y-2">
                <label htmlFor="domain-ip-input" className="block text-sm font-semibold text-slate-800">
                  Target Domain Name
                </label>
                <div className="relative">
                  <input
                    id="domain-ip-input"
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    placeholder="e.g. example.com or api.github.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-sm"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn-convert-domain"
                  onClick={() => handleLookup()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all min-h-[44px] disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {loading ? "Resolving..." : "Convert to IP"}
                </button>
                <button
                  id="btn-clear-domain-ip"
                  onClick={handleClear}
                  disabled={!domainInput && !result}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>

              {/* Presets */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Preset Domains
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      onClick={() => {
                        setDomainInput(domain);
                        handleLookup(domain);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 transition-all"
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: IP & DNS Inspection ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <Server className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-snug">Resolved IP & Inspection</h2>
                  <p className="text-xs text-indigo-100">DNS A-Record and Geolocation Output</p>
                </div>
              </div>
              {result && (
                <button
                  onClick={copyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Metrics"}</span>
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-6">
              {result ? (
                <div className="space-y-6">
                  {/* Hero Metric Box */}
                  <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-100 rounded-2xl p-5 text-center relative overflow-hidden">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                      Primary Target IP Address
                    </span>
                    <p className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                      {result.ipAddress}
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="bg-indigo-600/10 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-bold text-indigo-700">
                        {result.ipVersion}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {result.city}, {result.country}
                      </span>
                    </div>
                  </div>

                  {/* Geolocation & Network Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <span className="text-slate-500 text-xs font-semibold block">ISP Operator</span>
                      <p className="text-xs font-bold text-slate-800 truncate">{result.isp}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <span className="text-slate-500 text-xs font-semibold block">Autonomous System (ASN)</span>
                      <p className="text-xs font-mono font-bold text-slate-800 truncate">{result.asn}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <span className="text-slate-500 text-xs font-semibold block">Organization</span>
                      <p className="text-xs font-bold text-slate-800 truncate">{result.organization}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <span className="text-slate-500 text-xs font-semibold block">Reverse Hostname</span>
                      <p className="text-xs font-mono font-bold text-slate-800 truncate">{result.hostname}</p>
                    </div>
                  </div>

                  {/* DNS Record Details Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-100 px-3 py-2 font-semibold text-slate-700 flex justify-between">
                      <span>DNS Answer Records ({result.records.length})</span>
                      <span className="font-mono text-slate-500">TTL</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto bg-slate-50">
                      {result.records.map((rec, i) => (
                        <div key={i} className="px-3 py-2 flex items-center justify-between font-mono">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                              {rec.type}
                            </span>
                            <span className="text-slate-800">{rec.value}</span>
                          </div>
                          <span className="text-slate-500">{rec.ttl}s</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Network className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700">No Domain Resolved Yet</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Enter a domain name on the left panel or click a preset to fetch live IP address mappings and network metadata.
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
        {/* Card 1: What is Domain to IP Resolution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Understanding Domain to IP Conversion & DNS Architecture</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The <strong>Domain to IP Converter & DNS Inspector</strong> performs the fundamental networking function of resolving human-readable domain names (such as <code>example.com</code>) into machine-routable IP addresses (such as <code>93.184.216.34</code>). This process forms the backbone of internet communications through the Domain Name System (DNS).
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            When web browsers or automated scripts request resources from a domain, recursive DNS resolvers query authoritative name servers to discover the corresponding IPv4 or IPv6 destination. Inspecting these IP addresses yields crucial insight into server hostings, CDN deployment, geolocation data, and network routing configurations.
          </p>
        </div>

        {/* Card 2: Strategic Network Use Cases */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Key Infrastructure & Cybersecurity Use Cases</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "CDN & WAF Verification",
                body: "Determine whether a web application is routed behind Cloudflare, Fastly, or AWS CloudFront proxy layers by analyzing resolved IP ranges and ASN data.",
              },
              {
                title: "Server Migration Audit",
                body: "Verify that global DNS propagation has successfully switched traffic over to new server IP addresses following host or cloud migrations.",
              },
              {
                title: "Firewall Whitelisting",
                body: "Identify accurate IPv4 addresses required to configure API endpoint access rules, router port forwarding, or security group rules.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: DNS Record Comparison Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Essential DNS Record Types & Functionality</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Record Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Full Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Primary Network Function</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Typical Example Output</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["A", "Address Record", "Maps hostnames directly to 32-bit IPv4 addresses", "192.0.2.1"],
                  ["AAAA", "IPv6 Address Record", "Maps hostnames directly to 128-bit IPv6 addresses", "2001:db8::1"],
                  ["CNAME", "Canonical Name", "Aliases one domain name to another domain name", "ghs.googlehosted.com"],
                  ["MX", "Mail Exchange", "Directs email routing to designated mail servers", "mail.example.com"],
                  ["TXT", "Text Record", "Holds verification strings for SPF, DKIM, and SSL", "v=spf1 include:_spf.google.com"],
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

        {/* Card 4: How to Convert */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Perform Instant Domain to IP Resolution</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Using TwisterTools, enter any domain name into the input box and click <strong>Convert to IP</strong>. The engine executes a real-time DNS lookup over HTTPS, instantly returning the primary IPv4 address, host ISP details, location data, and active DNS records.
          </p>
        </div>

        {/* Card 5: FAQ Section */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Why can a single domain resolve to multiple IP addresses?",
                a: "High-traffic web applications use load balancing, round-robin DNS, and CDN networks to distribute traffic across redundant servers globally. A single domain lookup may return several IP addresses depending on your geographical location.",
              },
              {
                q: "What is the difference between IPv4 and IPv6 addresses?",
                a: "IPv4 uses 32-bit numeric addresses (e.g., 192.168.1.1), supporting roughly 4.3 billion devices. IPv6 uses 128-bit hexadecimal addresses to support an essentially unlimited pool of connected global devices.",
              },
              {
                q: "Why does the resolved IP show a proxy or CDN ISP like Cloudflare?",
                a: "Domains protected by reverse proxies or Web Application Firewalls (WAF) hide their origin server IP addresses behind CDN proxy IPs to defend against DDoS attacks and speed up edge content delivery.",
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

      {/* Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Domain to IP Converter & DNS Inspector",
            applicationCategory: "NetworkingApplication",
            operatingSystem: "All",
            description: "Free online Domain to IP converter tool to instantly resolve web domain names into IPv4/IPv6 addresses, inspect DNS records, and audit ISP geolocation.",
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
                name: "Why can a single domain resolve to multiple IP addresses?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "High-traffic web applications use load balancing and CDN networks to distribute traffic across redundant servers globally.",
                },
              },
              {
                "@type": "Question",
                name: "What is the difference between IPv4 and IPv6 addresses?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "IPv4 uses 32-bit addresses while IPv6 uses 128-bit hexadecimal addresses to support more connected devices.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}