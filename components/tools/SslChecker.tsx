"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Search,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Globe,
  Calendar,
  Clock,
  Server,
  Key,
  Shield,
  Trash2,
  HelpCircle,
  CheckCircle2,
  Zap,
  Info,
  ExternalLink,
  Layers,
  CheckCircle,
  XCircle,
  Database,
  Cpu,
  Terminal,
  FileText,
  AlertCircle,
  Crosshair,
  Award,
  BookOpen,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface CertSubject {
  commonName: string;
  organization?: string;
  organizationalUnit?: string;
  country?: string;
  san: string[];
}

interface CertIssuer {
  commonName: string;
  organization?: string;
  country?: string;
}

interface CertChainItem {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  signatureAlgorithm: string;
  keySize: number;
}

interface SslCertData {
  host: string;
  port: number;
  ip: string;
  valid: boolean;
  daysRemaining: number;
  validFrom: string;
  validTo: string;
  subject: CertSubject;
  issuer: CertIssuer;
  serialNumber: string;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  keySize: number;
  tlsVersion: string;
  cipherSuite: string;
  ocspStapled: boolean;
  hstsEnabled: boolean;
  certChain: CertChainItem[];
  vulnerabilities: {
    heartbleed: boolean;
    poodle: boolean;
    freak: boolean;
    logjam: boolean;
    expired: boolean;
    selfSigned: boolean;
    weakSignature: boolean;
  };
}

const PRESET_DOMAINS = [
  { label: "Google", domain: "google.com" },
  { label: "Cloudflare", domain: "cloudflare.com" },
  { label: "GitHub", domain: "github.com" },
  { label: "Amazon", domain: "amazon.com" },
  { label: "Expired Cert Demo", domain: "expired.badssl.com" },
  { label: "Wrong Host Demo", domain: "wrong.host.badssl.com" },
];

// ─────────────────────────────────────────────────────────────
// Component Implementation
// ─────────────────────────────────────────────────────────────

export default function SslChecker() {
  const [domainInput, setDomainInput] = useState("");
  const [portInput, setPortInput] = useState("443");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SslCertData | null>(null);
  const [copied, setCopied] = useState(false);

  // Normalize and clean domain string — handles https://, http://, www., paths, ports
  const cleanDomain = (input: string): string => {
    let raw = input.trim().toLowerCase();
    raw = raw.replace(/^(https?:\/\/)?(www\.)?/, "");
    raw = raw.split("/")[0];
    raw = raw.split(":")[0];
    return raw;
  };

  // Ref to track the latest requested host for stale request prevention
  const latestRequestRef = useRef<string>("");

  const fetchSslCertificate = useCallback(async (targetHost?: string, targetPort?: string) => {
    const queryHost = cleanDomain(targetHost !== undefined ? targetHost : domainInput);
    const queryPort = targetPort !== undefined ? targetPort : portInput;

    if (!queryHost) {
      setError("Please enter a valid domain name or hostname.");
      return;
    }

    // Track this request as the latest
    latestRequestRef.current = queryHost;

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const params = new URLSearchParams({
        host: queryHost,
        port: queryPort || "443",
      });

      const response = await fetch(`/api/ssl-check?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `SSL inspection failed (Status: ${response.status})`);
      }

      const certData = (await response.json()) as SslCertData;
      // Only update if this request is still the latest
      if (latestRequestRef.current === queryHost) {
        setData(certData);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (latestRequestRef.current === queryHost) {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while communicating with the SSL validation engine."
        );
        setData(null);
      }
    } finally {
      clearTimeout(timeoutId);
      if (latestRequestRef.current === queryHost) {
        setLoading(false);
      }
    }
  }, [domainInput, portInput]);

  // Debounced auto-fetch: waits 800ms after user stops typing, only fires if domain is non-empty
  useEffect(() => {
    const cleaned = cleanDomain(domainInput);
    if (!cleaned) return; // don't auto-fetch empty input

    const timer = setTimeout(() => {
      fetchSslCertificate(cleaned, portInput);
    }, 800);

    return () => clearTimeout(timer);
  }, [domainInput, portInput, fetchSslCertificate]);

  const handleClear = () => {
    setDomainInput("");
    setPortInput("443");
    setData(null);
    setError(null);
  };

  const copyResults = async () => {
    if (!data) return;
    const summary = `SSL Certificate Audit Report:
Host: ${data.host}:${data.port}
Status: ${data.valid ? "VALID" : "INVALID / EXPIRED"}
Days Remaining: ${data.daysRemaining} days
Valid From: ${data.validFrom}
Valid To: ${data.validTo}
Issuer: ${data.issuer.organization || data.issuer.commonName}
Subject: ${data.subject.commonName}
TLS Protocol: ${data.tlsVersion}
Cipher Suite: ${data.cipherSuite}
OCSP Stapling: ${data.ocspStapled ? "Enabled" : "Disabled"}
HSTS Header: ${data.hstsEnabled ? "Enforced" : "Missing"}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fallback */
    }
  };

  const getStatusBadge = () => {
    if (!data) return null;
    if (data.daysRemaining <= 0 || !data.valid) {
      return {
        bg: "bg-rose-50 border-rose-200 text-rose-800",
        icon: ShieldX,
        iconColor: "text-rose-600",
        title: "SSL Certificate Expired or Invalid",
        sub: "Immediate renewal or trust chain remediation required.",
      };
    }
    if (data.daysRemaining <= 30) {
      return {
        bg: "bg-amber-50 border-amber-200 text-amber-800",
        icon: ShieldAlert,
        iconColor: "text-amber-600",
        title: "SSL Certificate Expiring Soon",
        sub: `Expires in ${data.daysRemaining} days. Schedule renewal immediately.`,
      };
    }
    return {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      icon: ShieldCheck,
      iconColor: "text-emerald-600",
      title: "SSL Certificate Healthy & Trusted",
      sub: `Valid and active with ${data.daysRemaining} days remaining.`,
    };
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="w-full space-y-8">

      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        {/* ══════════════════ LEFT PANEL: Query Input & Controls ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <Globe className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Target Host Terminal</span>
              </div>
            </div>

            <div className="space-y-5 flex-1 flex flex-col justify-between p-4 sm:p-6">
              <div className="space-y-4">
                {/* Domain & Port Input */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label htmlFor="ssl-domain-input" className="block text-xs font-semibold text-slate-700">
                      Hostname / Domain
                    </label>
                    <div className="relative">
                      <input
                        id="ssl-domain-input"
                        type="text"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchSslCertificate()}
                        placeholder="e.g., example.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-sm"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ssl-port-input" className="block text-xs font-semibold text-slate-700">
                      Port
                    </label>
                    <input
                      id="ssl-port-input"
                      type="text"
                      value={portInput}
                      onChange={(e) => setPortInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchSslCertificate()}
                      placeholder="443"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-sm font-mono text-center"
                    />
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  id="btn-verify-ssl"
                  onClick={() => fetchSslCertificate()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all min-h-[44px] disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? "Inspecting Certificate..." : "Run SSL Inspection"}
                </button>

                {/* Preset Domain Quick Links */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Validation Test Presets
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_DOMAINS.map((preset) => (
                      <button
                        key={preset.domain}
                        onClick={() => {
                          setDomainInput(preset.domain);
                          fetchSslCertificate(preset.domain, "443");
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
                    disabled={!domainInput && !data}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-xs rounded-lg transition-all border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Workspace
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

        {/* ══════════════════ RIGHT PANEL: SSL Telemetry & Health Audit ══════════════════ */}
        <div className="flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-snug">SSL / TLS Telemetry Audit</h2>
                  <p className="text-xs text-indigo-100">Live certificate verification report</p>
                </div>
              </div>
              {data && (
                <button
                  onClick={copyResults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Audit"}</span>
                </button>
              )}
            </div>

            {/* Results Body */}
            <div className="flex-1 flex flex-col justify-between space-y-5 p-4 sm:p-6">
              {data && statusInfo ? (
                <>
                  {/* Health Banner */}
                  <div className={`p-4 border rounded-2xl flex items-start gap-3.5 ${statusInfo.bg}`}>
                    <statusInfo.icon className={`w-6 h-6 ${statusInfo.iconColor} flex-shrink-0 mt-0.5`} />
                    <div>
                      <h3 className="font-bold text-sm">{statusInfo.title}</h3>
                      <p className="text-xs mt-0.5 opacity-90">{statusInfo.sub}</p>
                    </div>
                  </div>

                  {/* Primary Certificate Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Days Remaining
                      </div>
                      <p className="text-lg font-extrabold font-mono text-slate-800">
                        {data.daysRemaining} Days
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Server className="w-3.5 h-3.5 text-indigo-600" />
                        Resolved IP
                      </div>
                      <p className="text-xs font-bold font-mono text-slate-800 truncate">
                        {data.ip || "N/A"}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        Valid From
                      </div>
                      <p className="text-xs font-bold font-mono text-slate-800 truncate">
                        {data.validFrom}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        Expiration Date
                      </div>
                      <p className="text-xs font-bold font-mono text-slate-800 truncate">
                        {data.validTo}
                      </p>
                    </div>
                  </div>

                  {/* Issuer & Subject Details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        Issuer Authority
                      </span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {data.issuer.organization || data.issuer.commonName}
                      </p>
                    </div>
                    <div className="border-t border-slate-200 pt-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        Subject Common Name
                      </span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">
                        {data.subject.commonName}
                      </p>
                    </div>
                    {data.subject.san.length > 0 && (
                      <div className="border-t border-slate-200 pt-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Subject Alternative Names (SANs) ({data.subject.san.length})
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                          {data.subject.san.slice(0, 8).map((san, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-600"
                            >
                              {san}
                            </span>
                          ))}
                          {data.subject.san.length > 8 && (
                            <span className="text-[11px] text-slate-400 px-1">
                              +{data.subject.san.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cryptographic & Protocol Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Protocol:</span>
                      <span className="font-bold text-slate-800 font-mono">{data.tlsVersion}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Key Size:</span>
                      <span className="font-bold text-slate-800 font-mono">{data.keySize} bits</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                      <span className="text-slate-500 font-medium">OCSP Stapling:</span>
                      <span className={`font-bold ${data.ocspStapled ? "text-emerald-600" : "text-slate-500"}`}>
                        {data.ocspStapled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                      <span className="text-slate-500 font-medium">HSTS Header:</span>
                      <span className={`font-bold ${data.hstsEnabled ? "text-emerald-600" : "text-amber-600"}`}>
                        {data.hstsEnabled ? "Enforced" : "Missing"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700">No SSL Certificate Executed</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Enter a domain name above to run a comprehensive SSL/TLS expiration check, inspect trust chains, and verify cipher security.
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
      <section className="space-y-8">
        {/* Card 1: Technical Architecture of SSL/TLS & PKI */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of SSL/TLS & Public Key Infrastructure</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              An <strong>SSL (Secure Sockets Layer) / TLS (Transport Layer Security)</strong> certificate is an essential digital passport that authenticates the identity of an internet domain and creates an encrypted link between a web server and a user&apos;s browser. While the acronym &quot;SSL&quot; remains ubiquitous in digital marketing and developer parlance, modern web security exclusively relies on the <strong>TLS protocol</strong> (specifically TLS 1.2 and TLS 1.3), as legacy SSL protocols (SSL v2, SSL v3) have been formally deprecated due to critical cryptographic vulnerabilities.
            </p>
            <p>
              Underlying every secure HTTPS interaction is a complex <strong>Public Key Infrastructure (PKI)</strong> ecosystem. PKI relies on asymmetric key pair cryptography—a public key distributed inside the certificate and a private key stored securely on the web server. When a client initiates a connection over port 443, the web server presents an X.509 standard digital certificate signed by a globally trusted <strong>Certificate Authority (CA)</strong> such as Let&apos;s Encrypt, DigiCert, Sectigo, or GlobalSign.
            </p>
            <p>
              The client browser verifies the cryptographic authenticity of this certificate by establishing a chain of trust back to a pre-installed, immutable <strong>Root CA Certificate</strong> located within the operating system or browser trust store. If any link in this chain—such as an intermediate CA certificate—is missing, altered, or expired, the browser halts connection setup and displays an explicit security error warning.
            </p>
          </div>
        </div>

        {/* Card 2: The TLS 1.3 Handshake & Verification Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The TLS Handshake & Certificate Verification Pipeline</span>
          </h2>
          <div className="space-y-5">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              When our inspection tool audits an SSL certificate, it executes a real-time, low-overhead TLS handshake against the target server. The cryptographic validation process follows a strict four-stage verification sequence:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  step: "1",
                  title: "Client Hello & SNI Broadcast",
                  body: "The client sends a 'Client Hello' packet detailing supported TLS protocol versions, available AEAD cipher suites, and the Server Name Indication (SNI) extension specifying the target domain name.",
                },
                {
                  step: "2",
                  title: "Server Hello & X.509 Leaf Delivery",
                  body: "The target web server responds with a 'Server Hello', selecting the strongest mutually supported cipher suite and transmitting its leaf X.509 certificate along with required intermediate bundle certificates.",
                },
                {
                  step: "3",
                  title: "Cryptographic Chain & Validity Check",
                  body: "The verifier parses the certificate's ASN.1 DER data to validate the start date ('Not Before') and expiration date ('Not After'), matches SAN rules against the queried host, and verifies the CA digital signature.",
                },
                {
                  step: "4",
                  title: "OCSP Revocation & Policy Inspection",
                  body: "The system checks revocation status via Real-Time OCSP (Online Certificate Status Protocol) stapling, inspects HSTS (HTTP Strict Transport Security) header policies, and measures key bit-lengths.",
                },
              ].map(({ step, title, body }) => (
                <div
                  key={step}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                      {step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                        {title}
                      </h3>
                      <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Cryptographic Protocols & Standards Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span>TLS Protocol Versions & Cryptographic Standards Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            Selecting robust cryptographic primitives is vital for preventing downgrade attacks and eavesdropping. The reference matrix below outlines current industry consensus for transport layer protocols, public key algorithms, key lengths, and signature standards:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Protocol / Primitive</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Industry Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Recommended Standards</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Security Assessment & Risk</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["TLS 1.3", "Recommended", "AES-256-GCM / ChaCha20-Poly1305", "Current gold standard. 1-RTT handshake; legacy ciphers eliminated."],
                  ["TLS 1.2", "Acceptable", "ECDHE-RSA/ECDSA with AEAD Ciphers", "Secure if modern ciphers used. Disable CBC-mode and static RSA."],
                  ["TLS 1.0 / 1.1", "Deprecated", "None (Disable Immediately)", "Critically vulnerable to BEAST, POODLE, and Lucky Thirteen attacks."],
                  ["RSA Public Keys", "Standard", "2048-bit (Min) / 4096-bit (Preferred)", "RSA-1024 is broken. 2048-bit minimum required by CA/Browser Forum."],
                  ["ECC Public Keys", "Modern Standard", "ECDSA (P-256 / P-384 / Ed25519)", "Higher security per bit than RSA; faster handshakes and less server overhead."],
                  ["Signature Hash", "Mandatory", "SHA-256 / SHA-384 / SHA-512", "SHA-1 signatures are completely banned by browsers and root stores."],
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={`px-4 py-3 text-sm border-b border-slate-100 ${cellIdx === 0 ? "font-mono font-semibold text-slate-800" : "text-slate-700"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Business Risks & Downtime Impact */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Business Risks & Operational Impact of Expired Certificates</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Catastrophic Customer Trust Collapse",
                body: "When a certificate expires, web browsers display intimidating interstitial warnings such as 'NET::ERR_CERT_DATE_INVALID'. Studies show that up to 92% of users immediately leave non-compliant websites, severely damaging brand reputation.",
              },
              {
                title: "SEO Ranking Penalties & Crawl Blockers",
                body: "Search engines like Google prioritize secure user experiences. Googlebot halts indexing when encountering certificate errors, leading to organic ranking drops and immediate exclusion from search result previews.",
              },
              {
                title: "Silent B2B API & Webhook Breakages",
                body: "Automated machine-to-machine traffic strictly enforces TLS validation. An expired SSL cert breaks payment gateways (Stripe, PayPal), webhook receivers, microservices, and mobile application backends without human-visible warnings.",
              },
              {
                title: "Compliance & Regulatory Fines",
                body: "Frameworks including PCI-DSS (Payment Card Industry Data Security Standard), HIPAA, and GDPR explicitly mandate uninterrupted encryption for sensitive user data in transit. Expired certs can lead to audit failures and fines.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <h3 className="font-semibold text-slate-800 mb-2 text-sm">
                  {title}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Certificate Validation Types (DV vs OV vs EV) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Understanding Certificate Validation Levels (DV, OV, EV)</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Certificate Authorities offer three distinct levels of identity vetting. Selecting the right validation level depends on your organization&apos;s risk profile and customer trust requirements:
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                type: "Domain Validated (DV)",
                badge: "Basic Security",
                desc: "Requires proof of domain control via DNS record or HTTP challenge file. Issued automatically within minutes. Ideal for blogs, portfolio sites, and internal development environments.",
              },
              {
                type: "Organization Validated (OV)",
                badge: "Business Standard",
                desc: "The CA verifies domain control AND the legal registration details of the business via official corporate registries. Recommended for commercial e-commerce platforms and SaaS products.",
              },
              {
                type: "Extended Validation (EV)",
                badge: "Maximum Trust",
                desc: "Involves rigorous background checks and legal verification. Displays verified corporate details inside the certificate viewer. Preferred by major financial institutions and global enterprises.",
              },
            ].map(({ type, badge, desc }) => (
              <div key={type} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{type}</h3>
                  <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                </div>
                <p className="text-slate-700 text-xs md:text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Comprehensive SSL Troubleshooting Guide */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Troubleshoot & Fix Common SSL Errors</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                code: "SSL_ERROR_UNKNOWN_ISSUER / Incomplete Chain",
                fix: "Your web server is failing to bundle intermediate CA certificates. To fix, ensure your Nginx or Apache configuration includes the full chain bundle (e.g., 'fullchain.pem' for Let's Encrypt or 'ca-bundle.crt' for commercial CAs).",
              },
              {
                code: "ERR_CERT_COMMON_NAME_INVALID / Hostname Mismatch",
                fix: "The requested domain name is missing from the Subject Alternative Name (SAN) extension of the SSL certificate. Re-issue the certificate and explicitly add both the naked root domain ('example.com') and wildcard subdomains ('*.example.com').",
              },
              {
                code: "Mixed Content Warnings (HTTP / HTTPS)",
                fix: "Your page is loaded over HTTPS, but includes sub-resources (images, scripts, CSS stylesheets) requested over unencrypted HTTP. Update internal HTML resource tags to use relative protocols or enforce 'Content-Security-Policy: upgrade-insecure-requests'.",
              },
            ].map(({ code, fix }) => (
              <div key={code} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-1">
                <p className="font-mono font-bold text-rose-700 text-xs md:text-sm">{code}</p>
                <p className="text-slate-700 text-xs md:text-sm leading-relaxed">{fix}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 7: Advanced FAQs */}
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
                q: "Why do automated certificate renewals (like Certbot / ACME) fail?",
                a: "Automated renewals usually fail due to three root causes: (1) Firewalls blocking incoming port 80 traffic required for HTTP-01 ACME challenges, (2) Expired DNS API tokens needed for DNS-01 challenges, or (3) Misconfigured web server file permissions on the .well-known/acme-challenge directory.",
              },
              {
                q: "What is an intermediate certificate chain issue?",
                a: "An incomplete chain occurs when a web server serves its primary leaf SSL certificate without bundling intermediate CA certificates. While desktop browsers may auto-download missing intermediates via AIA (Authority Information Access), mobile devices and API client SDKs strictly fail connection attempts.",
              },
              {
                q: "How far in advance should I renew my SSL/TLS certificate?",
                a: "Security best practices recommend initiating renewal at least 30 days prior to expiration. For automated Let's Encrypt certificates (90-day validity), renewals should be scheduled every 60 days to allow a 30-day safety buffer for troubleshooting.",
              },
              {
                q: "What is OCSP Stapling and why is it important?",
                a: "Online Certificate Status Protocol (OCSP) Stapling allows web servers to query the Certificate Authority's revocation server periodically and 'staple' a time-stamped, CA-signed revocation proof directly to the TLS handshake. This eliminates privacy leaks and speeds up connection times by up to 30%.",
              },
              {
                q: "What is HTTP Strict Transport Security (HSTS)?",
                a: "HSTS is an HTTP response header ('Strict-Transport-Security') that forces web browsers to interact with the domain exclusively over encrypted HTTPS connections. It prevents SSL stripping attacks and cookie hijacking by blocking user overrides on connection warnings.",
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

        {/* Card 8: Platform Advantages */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Why Use TwisterTools SSL Verifier?</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Zap,
                title: "Real-Time Direct Handshakes",
                body: "Our verification engine connects directly to your target server port in real time, inspecting live certificates without relying on cached database entries or outdated third-party indices.",
              },
              {
                icon: Shield,
                title: "100% Non-Intrusive & Private",
                body: "All inspections are executed safely using standard TLS Client Hello handshakes. We do not perform destructive vulnerability scans, log private query records, or share host metrics.",
              },
              {
                icon: Layers,
                title: "Comprehensive Chain Auditing",
                body: "Inspect every aspect of your certificate setup—from SAN lists and expiration timelines to public key bit-lengths, cipher suites, OCSP stapling status, and HSTS enforcement.",
              },
              {
                icon: Terminal,
                title: "Zero Setup & Developer Friendly",
                body: "No CLI installation, OpenSSL commands, or browser extension required. Copy clean diagnostic reports in one click for instant team collaboration and tickets.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                      {title}
                    </h3>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "SSL Certificate Checker & Expiration Verifier",
            applicationCategory: "SecurityApplication",
            operatingSystem: "All",
            description: "Free online SSL certificate checker and TLS verifier to inspect X.509 certificate chains, expiration dates, CA issuer trust, cipher security, OCSP stapling, and HSTS headers.",
            url: "https://www.twistertools.com/tools/web-tools/ssl-checker",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            featureList: [
              "Real-time TLS handshake certificate validation",
              "Expiration date tracking & remaining days alert",
              "X.509 Root & Intermediate trust chain inspection",
              "Subject Alternative Name (SAN) domain list parser",
              "Cipher suite & protocol version auditing (TLS 1.2 / TLS 1.3)",
              "OCSP stapling and HSTS policy verification",
              "100% non-intrusive and zero data retention",
            ],
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
                name: "Why do automated certificate renewals fail?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Automated renewals usually fail due to firewalls blocking incoming port 80 traffic, expired DNS API tokens, or misconfigured web server file permissions.",
                },
              },
              {
                "@type": "Question",
                name: "What is an intermediate certificate chain issue?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "An incomplete chain occurs when a web server serves its leaf SSL certificate without bundling intermediate CA certs, causing trust errors on mobile browsers and APIs.",
                },
              },
              {
                "@type": "Question",
                name: "How far in advance should I renew my SSL/TLS certificate?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Security best practices recommend initiating renewal at least 30 days prior to expiration to allow adequate time for testing and emergency rollback.",
                },
              },
              {
                "@type": "Question",
                name: "What is OCSP Stapling?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "OCSP Stapling allows web servers to attach time-stamped CA revocation proofs directly to the TLS handshake, enhancing privacy and connection speed.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}