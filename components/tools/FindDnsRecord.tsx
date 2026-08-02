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
  Shield,
  Server,
  Database,
  Terminal,
  Activity,
  Layers,
  Zap,
  Lock,
  Mail,
  Cpu,
  Share2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type RecordType = "A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME" | "SOA" | "ANY";

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{ name: string; type: number }>;
  Answer?: DnsAnswer[];
  Authority?: DnsAnswer[];
  Comment?: string;
}

const RECORD_TYPES: RecordType[] = ["ANY", "A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"];

const RECORD_TYPE_MAP: Record<RecordType, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  ANY: 255,
};

const RECORD_NUMBER_MAP: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  15: "MX",
  16: "TXT",
  28: "AAAA",
};

const PRESET_DOMAINS = [
  { label: "google.com", domain: "google.com" },
  { label: "cloudflare.com", domain: "cloudflare.com" },
  { label: "github.com", domain: "github.com" },
  { label: "microsoft.com", domain: "microsoft.com" },
];

// ─────────────────────────────────────────────────────────────
// Domain Extraction Utility
// ─────────────────────────────────────────────────────────────

/**
 * Extracts the registered domain (eTLD+1) from any input:
 * - Full URLs: "https://www.twistertools.com/domain-age-checker" → "twistertools.com"
 * - Subdomain URLs: "www.twistertools.com" → "twistertools.com"
 * - Bare domains: "twistertools.com" → "twistertools.com"
 */
function extractDomain(input: string): string {
  // 1. Strip protocol (http://, https://, ftp://, etc.)
  let cleaned = input.replace(/^[a-zA-Z]+:\/\//, "");
  // 2. Strip path (everything after the first /)
  const slashIdx = cleaned.indexOf("/");
  if (slashIdx !== -1) {
    cleaned = cleaned.substring(0, slashIdx);
  }
  // 3. Strip query string and hash (just in case)
  const qIdx = cleaned.indexOf("?");
  if (qIdx !== -1) {
    cleaned = cleaned.substring(0, qIdx);
  }
  const hIdx = cleaned.indexOf("#");
  if (hIdx !== -1) {
    cleaned = cleaned.substring(0, hIdx);
  }
  // 4. Strip authentication (user:pass@) if present
  const atIdx = cleaned.indexOf("@");
  if (atIdx !== -1) {
    cleaned = cleaned.substring(atIdx + 1);
  }
  // 5. Strip port number
  const portIdx = cleaned.lastIndexOf(":");
  if (portIdx !== -1) {
    // Only strip if it looks like a port (digits after) and the TLD is before
    const afterColon = cleaned.substring(portIdx + 1);
    if (/^\d+$/.test(afterColon)) {
      cleaned = cleaned.substring(0, portIdx);
    }
  }
  // 6. Extract the registered domain (eTLD+1): take the last 2 or 3 dot-separated parts
  const parts = cleaned.split(".");
  if (parts.length >= 3) {
    // Check for known 2-part TLDs (co.uk, com.au, etc.) and take 3 parts if applicable
    const knownTwoPartTlds = new Set([
      "co.uk", "org.uk", "ac.uk", "gov.uk", "net.uk", "nhs.uk", "police.uk", "mod.uk",
      "com.au", "net.au", "org.au", "edu.au", "gov.au",
      "co.nz", "net.nz", "org.nz",
      "co.jp", "ne.jp", "or.jp", "ac.jp", "go.jp",
      "co.kr", "or.kr", "ne.kr",
      "com.br", "org.br", "net.br", "gov.br",
      "com.cn", "net.cn", "org.cn", "gov.cn",
      "co.in", "net.in", "org.in", "gov.in", "ac.in",
      "co.za", "org.za", "net.za", "gov.za", "ac.za",
      "com.mx", "org.mx", "net.mx", "gob.mx",
      "co.il", "org.il", "net.il", "ac.il", "gov.il",
      "com.pl", "org.pl", "net.pl", "gov.pl",
      "com.pt", "org.pt", "net.pt", "gov.pt",
      "com.sg", "org.sg", "net.sg", "gov.sg", "edu.sg",
      "co.th", "or.th", "net.th", "go.th", "ac.th",
      "com.tr", "org.tr", "net.tr", "gov.tr", "edu.tr",
      "com.ua", "org.ua", "net.ua", "gov.ua",
      "com.ve", "org.ve", "net.ve", "gob.ve",
      "com.ar", "org.ar", "net.ar", "gov.ar",
      "com.eg", "org.eg", "net.eg", "gov.eg", "edu.eg",
      "com.hk", "org.hk", "net.hk", "gov.hk", "edu.hk",
      "com.my", "org.my", "net.my", "gov.my", "edu.my",
      "com.pe", "org.pe", "net.pe", "gob.pe",
      "com.ph", "org.ph", "net.ph", "gov.ph",
      "com.pk", "org.pk", "net.pk", "gov.pk", "edu.pk",
      "com.ru", "org.ru", "net.ru", "gov.ru",
      "com.sa", "org.sa", "net.sa", "gov.sa", "edu.sa",
      "com.tw", "org.tw", "net.tw", "gov.tw", "edu.tw",
      "com.vn", "org.vn", "net.vn", "gov.vn",
    ]);
    const lastTwo = parts.slice(-2).join(".");
    const lastThree = parts.slice(-3).join(".");
    if (knownTwoPartTlds.has(lastTwo) && parts.length >= 3) {
      return parts.slice(-3).join(".");
    }
    // Default: take the last 2 parts (e.g., "example.com" from "sub.example.com")
    return parts.slice(-2).join(".");
  }
  // Already a bare domain
  return cleaned;
}

// ─────────────────────────────────────────────────────────────
// Component Implementation
// ─────────────────────────────────────────────────────────────

export default function FindDnsRecord() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [records, setRecords] = useState<DnsAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rawResponse, setRawResponse] = useState<DnsResponse | null>(null);

  /**
   * Perform a single DNS query for a given type.
   * Returns the response data or throws on error.
   */
  const querySingle = async (name: string, type: RecordType, signal: AbortSignal): Promise<DnsResponse> => {
    const typeNum = RECORD_TYPE_MAP[type];
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${typeNum}`,
      {
        headers: { accept: "application/dns-json" },
        signal,
      }
    );
    if (!response.ok) {
      throw new Error(`DNS resolution failed with status ${response.status}`);
    }
    return response.json() as Promise<DnsResponse>;
  };

  const fetchDnsRecords = useCallback(
    async (targetDomain?: string, typeOverride?: RecordType) => {
      const rawInput = (targetDomain !== undefined ? targetDomain : domain).trim();
      const extractedDomain = extractDomain(rawInput);
      const queryDomain = extractedDomain.toLowerCase();
      const queryType = typeOverride || recordType;

      if (!queryDomain) {
        setError("Please enter a valid domain name.");
        return;
      }

      // Domain validation
      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
      if (!domainRegex.test(queryDomain)) {
        setError("Invalid domain. Enter a domain like example.com, or a URL like https://www.example.com/page");
        return;
      }

      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        if (queryType === "ANY") {
          // Cloudflare DoH does not support type=255 (ANY).
          // Query all individual types and merge results.
          const typesToQuery: RecordType[] = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"];
          const results = await Promise.allSettled(
            typesToQuery.map((t) => querySingle(queryDomain, t, controller.signal))
          );

          clearTimeout(timeoutId);

          let allAnswers: DnsAnswer[] = [];
          let lastRawResponse: DnsResponse | null = null;

          for (const result of results) {
            if (result.status === "fulfilled") {
              const data = result.value;
              lastRawResponse = data;
              if (data.Status === 0) {
                const answers = data.Answer || data.Authority || [];
                allAnswers = [...allAnswers, ...answers];
              }
            }
          }

          setRawResponse(lastRawResponse);
          setRecords(allAnswers);

          if (allAnswers.length === 0) {
            setError(`No DNS records found for "${queryDomain}".`);
          }
        } else {
          const data = await querySingle(queryDomain, queryType, controller.signal);
          clearTimeout(timeoutId);

          setRawResponse(data);

          if (data.Status !== 0) {
            if (data.Status === 3) {
              throw new Error(`Domain "${queryDomain}" does not exist (NXDOMAIN).`);
            }
            throw new Error(`DNS lookup error (Response Code: ${data.Status}).`);
          }

          const answers = data.Answer || data.Authority || [];
          setRecords(answers);

          if (answers.length === 0) {
            setError(`No ${queryType} records found for "${queryDomain}".`);
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        setRecords([]);
        if (err instanceof Error) {
          setError(err.name === "AbortError" ? "DNS query timed out. Please try again." : err.message);
        } else {
          setError("An unexpected network error occurred while querying DNS servers.");
        }
      } finally {
        setLoading(false);
      }
    },
    [domain, recordType]
  );

  const handleClear = () => {
    setDomain("");
    setRecords([]);
    setError(null);
    setRawResponse(null);
  };

  const copyResults = async () => {
    if (records.length === 0) return;
    const summary = records
      .map(
        (r) =>
          `${r.name}\t${r.TTL}\tIN\t${RECORD_NUMBER_MAP[r.type] || r.type}\t${r.data}`
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fallback */
    }
  };

  const formatRecordType = (typeNum: number) => {
    return RECORD_NUMBER_MAP[typeNum] || `TYPE${typeNum}`;
  };

  return (
    <div className="w-full space-y-8">
      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        {/* ══════════════════ LEFT PANEL: Input & Settings ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <Globe className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">DNS Terminal Input</span>
              </div>
            </div>

            <div className="space-y-5 flex-1 flex flex-col justify-between p-4 sm:p-6">
              <div className="space-y-4">
                {/* Domain Input Field */}
                <div className="space-y-2">
                  <label htmlFor="domain-input" className="block text-sm font-semibold text-slate-800">
                    Target Domain Name
                  </label>
                  <div className="relative">
                    <input
                      id="domain-input"
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchDnsRecords()}
                      placeholder="e.g. example.com, www.example.com, or https://www.example.com/page"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-sm"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Record Type Selector */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-800">
                    Select Record Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {RECORD_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setRecordType(type);
                          if (domain) fetchDnsRecords(domain, type);
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${recordType === type
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  id="btn-dns-lookup"
                  onClick={() => fetchDnsRecords()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all min-h-[44px] disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {loading ? "Querying Nameservers..." : "Inspect DNS Records"}
                </button>

                {/* Domain Quick Presets */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Quick Inspection Presets
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_DOMAINS.map((preset) => (
                      <button
                        key={preset.domain}
                        onClick={() => {
                          setDomain(preset.domain);
                          fetchDnsRecords(preset.domain);
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
                    disabled={!domain && records.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-xs rounded-lg transition-all border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Workspace
                  </button>
                </div>
              </div>

              {/* Error Notification */}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm mt-4">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: Output & Telemetry ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <Server className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-snug">DNS Telemetry & Records</h2>
                  <p className="text-xs text-indigo-100">Live resolver answer records</p>
                </div>
              </div>
              {records.length > 0 && (
                <button
                  onClick={copyResults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Table"}</span>
                </button>
              )}
            </div>

            {/* Results Display Area */}
            <div className="flex-1 flex flex-col justify-between space-y-6 p-4 sm:p-6">
              {records.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      Found {records.length} record(s) for <strong className="text-slate-900">{domain}</strong>
                    </span>
                    <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                      Type: {recordType}
                    </span>
                  </div>

                  {/* Records Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200 sticky top-0">
                          <th className="p-3">Type</th>
                          <th className="p-3">Host Name</th>
                          <th className="p-3">TTL</th>
                          <th className="p-3">Data / Destination</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-xs text-slate-800">
                        {records.map((rec, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="p-3 font-bold text-indigo-600">
                              {formatRecordType(rec.type)}
                            </td>
                            <td className="p-3 truncate max-w-[140px]" title={rec.name}>
                              {rec.name}
                            </td>
                            <td className="p-3 text-slate-500">{rec.TTL}s</td>
                            <td className="p-3 font-semibold break-all text-slate-900">
                              {rec.data}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Raw Telemetry JSON Preview */}
                  {rawResponse && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Resolver Header Telemetry
                      </span>
                      <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono grid grid-cols-2 gap-2">
                        <div>Status: {rawResponse.Status} (NOERROR)</div>
                        <div>Recursion Available: {rawResponse.RA ? "Yes" : "No"}</div>
                        <div>Truncated: {rawResponse.TC ? "Yes" : "No"}</div>
                        <div>Authentic Data: {rawResponse.AD ? "Yes" : "No"}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700">No Active DNS Queries</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Enter a domain name above to inspect live A, AAAA, MX, TXT, CNAME, NS, and SOA DNS records across global resolvers.
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
        {/* Card 1: Understanding DNS Architecture */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Understanding Domain Name System (DNS) Architecture</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            The <strong>Domain Name System (DNS)</strong> serves as the internet's central directory service, translating human-readable hostnames like <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">example.com</code> into machine-readable IP addresses required for network routing. Without DNS, web browsers, email clients, and cloud infrastructures could not establish connections across global networks.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            When a DNS record lookup is initiated, recursive DNS resolvers query hierarchical root nameservers, Top-Level Domain (TLD) servers, and authoritative nameservers to resolve specific resource record sets. Evaluating these records allows developers and systems engineers to diagnose domain propagation, email deliverability configurations, SSL certificate validation hooks, and routing performance.
          </p>
        </div>

        {/* Card 2: Key DNS Record Types */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Primary DNS Resource Record Types Explained</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "A Record (Address)",
                body: "Maps a hostname directly to an IPv4 address (e.g., 192.0.2.1). Essential for basic website hosting and web server targeting.",
              },
              {
                title: "AAAA Record (IPv6)",
                body: "Maps a hostname to a 128-bit IPv6 address (e.g., 2001:db8::1). Crucial for modern dual-stack and IPv6-native infrastructure.",
              },
              {
                title: "MX Record (Mail Exchange)",
                body: "Directs incoming email to designated mail servers with priority ordering. Vital for corporate email flow and deliverability.",
              },
              {
                title: "TXT Record (Text)",
                body: "Holds human or machine-readable text data. Used extensively for SPF, DKIM, DMARC security protocols and site ownership verification.",
              },
              {
                title: "NS Record (Name Server)",
                body: "Specifies the authoritative DNS servers responsible for hosting a domain's DNS zones and responding to queries.",
              },
              {
                title: "CNAME Record (Canonical Name)",
                body: "Aliases one domain name to another canonical hostname, enabling subdomains to point directly to CDN edge endpoints.",
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
            <span>DNS Record Specification & TTL Matrix</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Record Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Primary Function</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Typical Recommended TTL</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Target Output Format</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["A", "IPv4 Web Mapping", "300 - 3600 seconds", "Dotted IPv4 Address"],
                  ["AAAA", "IPv6 Web Mapping", "300 - 3600 seconds", "Hexadecimal IPv6 Address"],
                  ["MX", "Mail Routing", "3600 - 86400 seconds", "Priority + Mail Host FQDN"],
                  ["TXT", "SPF/DKIM Security & Verification", "300 - 3600 seconds", "Arbitrary Quoted Text String"],
                  ["NS", "Zone Authority Delegation", "86400 seconds", "Authoritative Nameserver FQDN"],
                  ["SOA", "Zone Master Administration", "86400 seconds", "Primary NS, Admin Email, Serial"],
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

        {/* Card 4: How to Inspect DNS Records */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Perform Live DNS Record Lookups</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            TwisterTools DNS Finder provides direct access to high-performance, low-latency DNS-over-HTTPS (DoH) resolvers. Simply type any target hostname (such as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">domain.com</code>), select the desired record filter (or choose ANY), and press "Inspect DNS Records". The live DNS response will display active hostnames, TTL durations, and destination values instantly.
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
                q: "What is Time-to-Live (TTL) in DNS records?",
                a: "TTL specifies the duration (in seconds) that intermediate DNS resolvers and client devices are permitted to cache a DNS answer before requesting a fresh lookup from authoritative nameservers.",
              },
              {
                q: "Why do DNS record updates take time to propagate globally?",
                a: "DNS changes must wait for cached records on local ISP resolvers and public DNS servers to expire based on their configured TTL values. Global propagation usually completes within minutes to 24 hours.",
              },
              {
                q: "What is the difference between an A record and a CNAME record?",
                a: "An A record directly points a hostname to an IP address, whereas a CNAME record points a hostname to another domain name (alias). CNAME records cannot exist at the root apex domain (e.g., example.com) per DNS RFC specifications.",
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
            name: "DNS Record Finder & Name Server Inspector",
            applicationCategory: "UtilityApplication",
            operatingSystem: "All",
            description: "Free online DNS lookup tool to inspect A, AAAA, MX, TXT, CNAME, NS, and SOA records using DNS-over-HTTPS resolvers.",
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
                name: "What is Time-to-Live (TTL) in DNS records?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "TTL specifies the time in seconds that DNS records are cached by resolvers before fetching a fresh copy.",
                },
              },
              {
                "@type": "Question",
                name: "What is the difference between an A record and a CNAME record?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "An A record maps a domain directly to an IP address, while a CNAME aliases one domain to another.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}