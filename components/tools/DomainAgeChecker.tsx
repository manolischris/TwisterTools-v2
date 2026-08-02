"use client";

import React, { useState, useCallback } from "react";
import {
  Clock,
  Globe,
  Search,
  Check,
  Copy,
  AlertTriangle,
  Trash2,
  RefreshCw,
  HelpCircle,
  Shield,
  ShieldCheck,
  Zap,
  Server,
  Calendar,
  Lock,
  ExternalLink,
  Award,
  Database,
  BarChart3,
  Layers,
  FileText,
  UserCheck,
  Activity,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface DomainAgeResult {
  domain: string;
  registrar: string;
  creationDate: string;
  updatedDate: string;
  expirationDate: string;
  ageYears: number;
  ageDays: number;
  totalDays: number;
  nameServers: string[];
  dnssec: string;
  trustScore: number;
}

interface WhoisApiError {
  error: string;
  domain?: string;
}

const SAMPLE_DOMAINS = [
  "google.com",
  "wikipedia.org",
  "github.com",
  "cloudflare.com",
];

// ─────────────────────────────────────────────────────────────
// Component Implementation
// ─────────────────────────────────────────────────────────────

export default function DomainAgeChecker() {
  const [inputDomain, setInputDomain] = useState("");
  const [result, setResult] = useState<DomainAgeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLookup = useCallback(async (domainToLookup?: string) => {
    const target = domainToLookup || inputDomain;
    setError(null);

    if (!target.trim()) {
      setError("Please enter a domain name to check.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/whois?domain=${encodeURIComponent(target)}`
      );

      if (!response.ok) {
        const errorData: WhoisApiError = await response.json();
        throw new Error(errorData.error || `WHOIS lookup failed (${response.status})`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { trustScore: _, ...rawData } = await response.json() as DomainAgeResult & { trustScore?: number };

      // Calculate trust score based on real domain age
      const trustScore = Math.min(98, 40 + rawData.ageYears * 2 + (rawData.totalDays % 10));

      setResult({ ...rawData, trustScore });
    } catch (err) {
      setError(
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Network error: Unable to reach the WHOIS lookup server. Please check your connection."
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred during the WHOIS lookup."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [inputDomain]);

  const handleClear = () => {
    setInputDomain("");
    setResult(null);
    setError(null);
  };

  const copyResults = async () => {
    if (!result) return;
    const summary = `Domain: ${result.domain}\nAge: ${result.ageYears} Years, ${result.ageDays} Days (${result.totalDays.toLocaleString()} Days Total)\nCreated: ${result.creationDate}\nExpires: ${result.expirationDate}\nRegistrar: ${result.registrar}\nTrust Score: ${result.trustScore}/100`;
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
        {/* ══════════════════ LEFT PANEL: Input & Control ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <Globe className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Domain Age Verification</span>
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              {/* Form Input */}
              <div className="space-y-2">
                <label htmlFor="domain-input" className="block text-sm font-semibold text-slate-800">
                  Enter Domain Name
                </label>
                <div className="relative">
                  <input
                    id="domain-input"
                    type="text"
                    value={inputDomain}
                    onChange={(e) => setInputDomain(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    placeholder="e.g. example.com or https://mywebsite.org"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-sm"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn-check-domain"
                  onClick={() => handleLookup()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all min-h-[44px] disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {loading ? "Checking..." : "Check Domain Age"}
                </button>
                <button
                  id="btn-clear-domain"
                  onClick={handleClear}
                  disabled={!inputDomain && !result}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Workspace
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Quick Domain Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      onClick={() => {
                        setInputDomain(domain);
                        handleLookup(domain);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 transition-all"
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: Results Output ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-snug">Age Analysis & WHOIS Report</h2>
                  <p className="text-xs text-indigo-100">Live domain creation and registration metrics</p>
                </div>
              </div>
              {result && (
                <button
                  onClick={copyResults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Report"}</span>
                </button>
              )}
            </div>

            {/* Results Body */}
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-6">
              {result ? (
                <div className="space-y-6">
                  {/* Primary Hero Metric */}
                  <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-100 rounded-2xl p-5 text-center relative overflow-hidden">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                      Calculated Domain Age
                    </span>
                    <p className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                      {result.ageYears} <span className="text-lg font-semibold text-slate-600">Years</span> {result.ageDays} <span className="text-lg font-semibold text-slate-600">Days</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      Total Active Lifetime: {result.totalDays.toLocaleString()} Days
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-1.5 bg-indigo-600/10 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-700 mx-auto w-fit">
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      Trust Score: {result.trustScore}/100
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        Created Date
                      </div>
                      <p className="text-sm font-bold font-mono text-slate-800">{result.creationDate || "N/A"}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Expiration Date
                      </div>
                      <p className="text-sm font-bold font-mono text-slate-800">{result.expirationDate || "N/A"}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Server className="w-3.5 h-3.5 text-indigo-600" />
                        Registrar
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate">{result.registrar}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                        Last Updated
                      </div>
                      <p className="text-sm font-bold font-mono text-slate-800">{result.updatedDate || "N/A"}</p>
                    </div>
                  </div>

                  {/* Security & Registry Details */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                    {result.nameServers.length > 0 && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold text-slate-600">Name Servers:</span>
                        <span className="font-mono text-slate-800 whitespace-pre-wrap text-right">
                          {result.nameServers.join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-semibold text-slate-600">DNSSEC Security:</span>
                      <span className="font-mono text-indigo-600 font-semibold">{result.dnssec}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700">No Domain Analyzed Yet</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Enter a domain name on the left panel or click one of the quick presets to view detailed age, WHOIS, and trust metrics.
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
        {/* Card 1: What is Domain Age */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Understanding Domain Age & WHOIS Registration History</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            <strong>Domain Age</strong> refers to the exact duration of time that has elapsed since a domain name was originally registered with an accredited domain registrar. Far beyond being a simple vanity metric, domain age serves as a primary signal of digital authority, brand stability, and online trust across modern search engines and cybersecurity protocols.
          </p>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            When search engines like Google index web properties, domain history plays a subtle yet meaningful role in establishing a baseline trust score. Older domains with clean continuous registration histories are significantly less likely to be classified as temporary spam or doorway sites compared to newly minted domains registered only days prior.
          </p>
        </div>

        {/* Card 2: Why Domain Age Matters for SEO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Why Domain Age and WHOIS Integrity Matter for SEO</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Search Engine Authority",
                body: "Older domains benefit from established crawling history, existing backlink profiles, and an accrued trust layer that helps new pages index and rank faster.",
              },
              {
                title: "Protection Against Sandbox Effect",
                body: "Newly registered domains often undergo a temporary evaluation period known as the Google Sandbox. Established domain age bypasses this constraint entirely.",
              },
              {
                title: "Brand & M&A Valuation",
                body: "Domain age is a core metric during digital asset acquisitions. Older, clean domains command higher market values in secondary domain marketplaces.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Domain Age Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Domain Age Classification & SEO Impact Matrix</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Age Bracket</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">SEO Trust Profile</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Typical Crawl Priority</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Marketplace Valuation</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["0 - 6 Months", "Sandbox Stage (Strict Scrutiny)", "Standard / Low Frequency", "Base Registration Cost"],
                  ["6 Months - 2 Years", "Emerging Authority", "Moderate Frequency", "Low to Medium Premium"],
                  ["2 - 5 Years", "Established Entity", "High Frequency", "Moderate Market Value"],
                  ["5 - 10 Years", "High Trust & Brand Equity", "Priority Indexing", "High Premium Value"],
                  ["10+ Years", "Veteran / Legacy Authority", "Immediate Priority Crawl", "Tier-1 Domain Asset"],
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

        {/* Card 4: How to Use */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Perform a Domain Age Audit</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Auditing domain age with TwisterTools is instantaneous and requires no technical setup. Simply enter target web URLs into the input box to instantly reveal registration creation dates, total active days, registrar ownership details, and trust ratings.
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
                q: "Does domain age reset when a domain is dropped and re-registered?",
                a: "Yes. If a domain name expires and enters the drop cycle without renewal, its active registration history resets. When a new owner registers the dropped domain, the official creation date reflects the new registration date, although historical backlink equity may sometimes persist.",
              },
              {
                q: "Can I fake or alter a domain's official creation date?",
                a: "No. Creation dates are authoritatively maintained by global registry operators (such as Verisign for .com) and distributed via cryptographically secured WHOIS/RDAP protocols. They cannot be modified by domain holders or registrars.",
              },
              {
                q: "Does prepaying domain renewal for 10 years improve SEO?",
                a: "While Google representatives have stated that long-term renewal alone isn't a direct ranking factor, long-term registration indicates financial commitment and legitimate operational intent, which positively influences secondary security trust scores.",
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
            name: "Domain Age Checker",
            applicationCategory: "UtilityApplication",
            operatingSystem: "All",
            description: "Instant online domain age checker tool to verify WHOIS creation date, registration longevity, expiration metrics, and domain trust score.",
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
                name: "Does domain age reset when a domain is dropped and re-registered?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. If a domain name expires and enters the drop cycle, its registration history resets to the new registration date.",
                },
              },
              {
                "@type": "Question",
                name: "Can I fake or alter a domain's official creation date?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. Creation dates are authoritatively maintained by top-level registry operators and WHOIS protocols.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}