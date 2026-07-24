"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Shield,
  Trash2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Cpu,
  Terminal,
  Clock,
  Activity,
  AlertTriangle,
  Columns,
  ShieldCheck
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Pure JS/TS JWT Safe Decoding Helper (UTF-8 Compatible)
// ─────────────────────────────────────────────────────────────
function decodeTokenPart(part: string): string {
  try {
    let base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    try {
      let base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      return decodeURIComponent(escape(atob(base64)));
    } catch (err) {
      throw new Error("Invalid base64url encoding");
    }
  }
}

interface DecodedState {
  header: any | null;
  payload: any | null;
  signature: string | null;
  headerRaw: string;
  payloadRaw: string;
  signatureRaw: string;
  isValid: boolean;
  error: string | null;
  alg: string | null;
  typ: string | null;
  exp: number | null;
  iat: number | null;
  nbf: number | null;
  headerBytes: number;
  payloadBytes: number;
  signatureBytes: number;
}

const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyLCJpc3MiOiJ0d2lzdGVydG9vbHMifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export default function JwtDecoder() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<DecodedState>({
    header: null,
    payload: null,
    signature: null,
    headerRaw: "",
    payloadRaw: "",
    signatureRaw: "",
    isValid: false,
    error: null,
    alg: null,
    typ: null,
    exp: null,
    iat: null,
    nbf: null,
    headerBytes: 0,
    payloadBytes: 0,
    signatureBytes: 0,
  });

  // Copy success states
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedSignature, setCopiedSignature] = useState(false);

  // Character and byte counts
  const charCount = token.length;
  const byteCount = new TextEncoder().encode(token).length;

  // Real-time JWT parsing
  useEffect(() => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      setDecoded({
        header: null,
        payload: null,
        signature: null,
        headerRaw: "",
        payloadRaw: "",
        signatureRaw: "",
        isValid: false,
        error: null,
        alg: null,
        typ: null,
        exp: null,
        iat: null,
        nbf: null,
        headerBytes: 0,
        payloadBytes: 0,
        signatureBytes: 0,
      });
      return;
    }

    const parts = cleanToken.split(".");
    if (parts.length !== 3) {
      setDecoded((prev) => ({
        ...prev,
        isValid: false,
        error: "A JWT must contain exactly three parts separated by dots (.)",
        headerRaw: parts[0] || "",
        payloadRaw: parts[1] || "",
        signatureRaw: parts[2] || "",
      }));
      return;
    }

    const getByteLength = (s: string) => new TextEncoder().encode(s).length;

    let parsedHeader: any = null;
    let parsedPayload: any = null;
    let parseError: string | null = null;

    try {
      const decodedHeader = decodeTokenPart(parts[0]);
      parsedHeader = JSON.parse(decodedHeader);
    } catch (e) {
      parseError = "Failed to decode/parse JWT Header as JSON";
    }

    try {
      const decodedPayload = decodeTokenPart(parts[1]);
      parsedPayload = JSON.parse(decodedPayload);
    } catch (e) {
      if (!parseError) {
        parseError = "Failed to decode/parse JWT Payload as JSON";
      }
    }

    setDecoded({
      header: parsedHeader,
      payload: parsedPayload,
      signature: parts[2],
      headerRaw: parts[0],
      payloadRaw: parts[1],
      signatureRaw: parts[2],
      isValid: !parseError,
      error: parseError,
      alg: parsedHeader?.alg || null,
      typ: parsedHeader?.typ || null,
      exp: typeof parsedPayload?.exp === "number" ? parsedPayload.exp : null,
      iat: typeof parsedPayload?.iat === "number" ? parsedPayload.iat : null,
      nbf: typeof parsedPayload?.nbf === "number" ? parsedPayload.nbf : null,
      headerBytes: getByteLength(parts[0]),
      payloadBytes: getByteLength(parts[1]),
      signatureBytes: getByteLength(parts[2]),
    });
  }, [token]);

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const loadSampleToken = () => {
    setToken(SAMPLE_TOKEN);
  };

  const clearToken = () => {
    setToken("");
  };

  // Expiry check
  const isExpired = () => {
    if (decoded.exp === null) return null;
    return Date.now() / 1000 > decoded.exp;
  };

  const formatEpoch = (epoch: number) => {
    try {
      return new Date(epoch * 1000).toLocaleString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="space-y-10">
      {/* ─────────────────────────────────────────────────────────────
           WORKSPACE GRID (50/50 Layout)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT PANEL: Interactive Textarea Input */}
        <div className="flex flex-col space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="jwt-input-textarea"
                className="text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Paste Encoded JWT Token
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadSampleToken}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors min-h-[40px] flex items-center"
                >
                  Load Sample
                </button>
                <button
                  onClick={clearToken}
                  disabled={!token}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors min-h-[40px] flex items-center gap-1.5 ${
                    token
                      ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      : "text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="jwt-input-textarea"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full h-80 p-4 font-mono text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Character & Byte Counter Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span>
                Length: <strong className="text-slate-700 dark:text-slate-300">{charCount}</strong> characters
              </span>
              <span>
                Size: <strong className="text-slate-700 dark:text-slate-300">{byteCount}</strong> bytes
              </span>
            </div>
          </div>

          {/* Validation Warning Alert Banner inside Left Panel */}
          {token && decoded.error && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                  Validation Error
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                  {decoded.error}
                </p>
              </div>
            </div>
          )}

          {token && !decoded.error && !decoded.isValid && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                  Malformed Token Structure
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 leading-relaxed">
                  A JSON Web Token consists of three parts (Header, Payload, Signature) separated by dots.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Sticky Floating Output Panel */}
        <div className="lg:sticky lg:top-4 self-start space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
            
            {/* Color-Coded Token Segment Representation */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                Token Segment Color Map
              </h3>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-mono break-all leading-relaxed">
                {token ? (
                  <>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">{decoded.headerRaw || ""}</span>
                    {decoded.payloadRaw && <span className="text-slate-400 dark:text-slate-600">.</span>}
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">{decoded.payloadRaw || ""}</span>
                    {decoded.signatureRaw && <span className="text-slate-400 dark:text-slate-600">.</span>}
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{decoded.signatureRaw || ""}</span>
                  </>
                ) : (
                  <span className="text-slate-500 italic">No token loaded. Paste a JWT to begin.</span>
                )}
              </div>
            </div>

            {/* HEADER (JSON) Card */}
            <div className="border border-rose-100 dark:border-rose-950/30 bg-rose-50/10 dark:bg-rose-950/5 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-950/30">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Header: Algorithm &amp; Token Type
                </span>
                {decoded.header && (
                  <button
                    onClick={() => handleCopy(JSON.stringify(decoded.header, null, 2), setCopiedHeader)}
                    className="p-1 text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 rounded transition-colors min-h-[30px] flex items-center justify-center"
                    title="Copy Header JSON"
                  >
                    {copiedHeader ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <div className="p-4">
                {decoded.header ? (
                  <pre className="font-mono text-xs text-rose-600 dark:text-rose-400 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(decoded.header, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {token ? "Invalid Header Data" : "Waiting for token..."}
                  </p>
                )}
              </div>
            </div>

            {/* PAYLOAD (JSON) Card */}
            <div className="border border-purple-100 dark:border-purple-950/30 bg-purple-50/10 dark:bg-purple-950/5 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-950/30">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Payload: Decoded Claims
                </span>
                {decoded.payload && (
                  <button
                    onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2), setCopiedPayload)}
                    className="p-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-rose-350 rounded transition-colors min-h-[30px] flex items-center justify-center"
                    title="Copy Payload JSON"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <div className="p-4 space-y-4">
                {decoded.payload ? (
                  <>
                    <pre className="font-mono text-xs text-purple-600 dark:text-purple-400 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(decoded.payload, null, 2)}
                    </pre>

                    {/* Timestamp Badges Container */}
                    {(decoded.exp !== null || decoded.iat !== null || decoded.nbf !== null) && (
                      <div className="pt-3 border-t border-purple-100 dark:border-purple-950/20 space-y-2">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                          Decoded Epoch Timestamps
                        </h4>
                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {decoded.iat !== null && (
                            <div className="flex items-center gap-2 text-xs bg-purple-50 dark:bg-purple-950/30 border border-purple-100/50 dark:border-purple-900/30 px-3 py-1.5 rounded-lg text-purple-800 dark:text-purple-300">
                              <Clock className="w-3.5 h-3.5 text-purple-500" />
                              <span>
                                <strong>Issued At (iat):</strong> {formatEpoch(decoded.iat)}
                              </span>
                            </div>
                          )}
                          {decoded.nbf !== null && (
                            <div className="flex items-center gap-2 text-xs bg-purple-50 dark:bg-purple-950/30 border border-purple-100/50 dark:border-purple-900/30 px-3 py-1.5 rounded-lg text-purple-800 dark:text-purple-300">
                              <Clock className="w-3.5 h-3.5 text-purple-500" />
                              <span>
                                <strong>Not Before (nbf):</strong> {formatEpoch(decoded.nbf)}
                              </span>
                            </div>
                          )}
                          {decoded.exp !== null && (
                            <div className="flex items-center gap-2 text-xs bg-purple-50 dark:bg-purple-950/30 border border-purple-100/50 dark:border-purple-900/30 px-3 py-1.5 rounded-lg text-purple-800 dark:text-purple-300">
                              <Clock className="w-3.5 h-3.5 text-purple-500" />
                              <span>
                                <strong>Expiration (exp):</strong> {formatEpoch(decoded.exp)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {token ? "Invalid Payload Data" : "Waiting for token..."}
                  </p>
                )}
              </div>
            </div>

            {/* SIGNATURE verification layouts */}
            <div className="border border-cyan-100 dark:border-cyan-950/30 bg-cyan-50/10 dark:bg-cyan-950/5 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-cyan-50/50 dark:bg-cyan-950/20 border-b border-cyan-100 dark:border-cyan-950/30">
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                  Signature Verification Hash
                </span>
                {decoded.signature && (
                  <button
                    onClick={() => handleCopy(decoded.signature || "", setCopiedSignature)}
                    className="p-1 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 rounded transition-colors min-h-[30px] flex items-center justify-center"
                    title="Copy Signature Hash"
                  >
                    {copiedSignature ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                {decoded.signature ? (
                  <>
                    <p className="font-mono text-xs text-cyan-600 dark:text-cyan-400 break-all bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-cyan-100/50 dark:border-cyan-900/30">
                      {decoded.signature}
                    </p>
                    <div className="flex items-start gap-2 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/30 rounded-lg p-2.5">
                      <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-cyan-850 dark:text-cyan-300 leading-snug">
                        The signature is Base64Url-encoded. Verify this cryptographic digest against the verified secret key or certificate.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {token ? "No Signature Segment Detected" : "Waiting for token..."}
                  </p>
                )}
              </div>
            </div>

            {/* METADATA METRICS PANEL */}
            {decoded.isValid && (
              <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Token Metadata &amp; Performance Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-lg">
                    <span className="text-slate-500 block mb-0.5">Algorithm</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {decoded.alg || "None"}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-lg">
                    <span className="text-slate-500 block mb-0.5">Type (typ)</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {decoded.typ || "None"}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-lg col-span-2">
                    <span className="text-slate-500 block mb-0.5">Segment Size Breakdown</span>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded">
                        H: {decoded.headerBytes}B
                      </span>
                      <span>+</span>
                      <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 rounded">
                        P: {decoded.payloadBytes}B
                      </span>
                      <span>+</span>
                      <span className="px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 rounded">
                        S: {decoded.signatureBytes}B
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expiry status indicator */}
                {decoded.exp !== null && (
                  <div className="border-t border-slate-200/60 dark:border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Token Status:</span>
                      {isExpired() ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/35 text-rose-700 dark:text-rose-400 font-semibold rounded-full border border-rose-200/50 dark:border-rose-900/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-950/35 text-green-700 dark:text-green-400 font-semibold rounded-full border border-green-200/50 dark:border-green-900/30">
                          <Activity className="w-3.5 h-3.5" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        
        {/* What is a JWT Decoder & Inspector? */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>What is a JWT Decoder &amp; Inspector?</span>
          </h2>
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              JSON Web Tokens (JWT) are an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed.
            </p>
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              The TwisterTools JWT Decoder &amp; Inspector allows you to instantly decode any JSON Web Token right inside your browser. By parsing the three parts of a JWT—the header, the payload, and the signature—this tool displays the full interior structure of your token in an easily readable format, handles complex epoch timestamp translations automatically, and calculates cryptographic algorithmic properties in real time.
            </p>
          </div>
        </div>

        {/* How JSON Web Tokens Work Step-by-Step */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>How JSON Web Tokens Work Step-by-Step</span>
          </h2>
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              A JSON Web Token consists of three distinct parts separated by dots (`.`):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    1
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    The Header
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                  Typically consists of two parts: the type of the token, which is JWT, and the signing algorithm being used, such as HMAC SHA256 (HS256) or RSA (RS256).
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    2
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    The Payload
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                  Contains the claims. Claims are statements about an entity (typically, the user) and additional metadata properties. There are three types of claims: registered, public, and private claims.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    3
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    The Signature
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                  To create the signature part you must take the encoded header, the encoded payload, a secret, the algorithm specified in the header, and sign that combination securely.
                </p>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pt-2">
              Our tool takes these Base64Url-encoded strings, breaks them down into their individual segments, performs automated bitwise structure decoding, and renders the JSON object with visual segment coloration mapping for instantaneous code audits.
            </p>
          </div>
        </div>

        {/* JWT Anatomy vs. Standard Base64 Encoding */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
              <Columns className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>JWT Anatomy vs. Standard Base64 Encoding</span>
          </h2>
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              Standard Base64 encoding includes characters such as <code>+</code>, <code>/</code>, and <code>=</code> which can cause parsing issues when transmitted via URLs. JWT addresses this by using Base64URL encoding, substituting problematic characters to ensure clean, web-safe transmission.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Dynamic Token Segment</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Typical Purpose</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Internal Fields</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Color Coding Accent</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { segment: "Header", purpose: "Defines cryptographic metadata", fields: "alg, typ, kid", color: "Magenta / Pink" },
                    { segment: "Payload", purpose: "Transmits specific user claims", fields: "sub, exp, iss, roles", color: "Purple / Indigo" },
                    { segment: "Signature", purpose: "Validates structural integrity", fields: "Binary Hash Output", color: "Teal / Cyan" }
                  ].map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                        {row.segment}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-indigo-700 font-medium">
                        {row.purpose}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600 font-mono">
                        {row.fields}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600">
                        {row.color}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Common JWT Claims Reference Specification Matrix */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
              <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Common JWT Claims Reference Specification Matrix</span>
          </h2>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Claim Key</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Claim Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs tracking-wide">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "iss", name: "Issuer", desc: "Identifies the principal that issued the JSON Web Token." },
                    { key: "sub", name: "Subject", desc: "Identifies the principal that is the subject of the JWT." },
                    { key: "aud", name: "Audience", desc: "Identifies the recipients that the JWT is intended for." },
                    { key: "exp", name: "Expiration Time", desc: "Identifies the expiration time on or after which the JWT must not be accepted for processing." },
                    { key: "nbf", name: "Not Before", desc: "Identifies the time before which the JWT must not be accepted for processing." },
                    { key: "iat", name: "Issued At", desc: "Identifies the time at which the JWT was issued." },
                    { key: "jti", name: "JWT ID", desc: "Provides a unique identifier for the JWT, which can be used to prevent token replay attacks." }
                  ].map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700 font-mono">
                        {row.key}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-indigo-700 font-medium">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100 text-sm text-slate-600 leading-relaxed">
                        {row.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Security Vulnerabilities & Cryptographic Threat Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Security Vulnerabilities &amp; Cryptographic Threat Matrix</span>
          </h2>
          <div className="space-y-6">
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              When integrating JWT workflows within web applications, developers must defend against common implementation exploits:
            </p>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                The &quot;None&quot; Algorithm Exploit
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                Early JWT libraries processed tokens where the <code>alg</code> header parameter was set to <code>none</code>. In these configurations, validation checks passed without verifying signatures, enabling attackers to tamper with payload parameters freely. Modern implementations must explicitly block the <code>none</code> algorithm during production decoding phases.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Token Expiry Invalidation Defenses
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                Because JSON Web Tokens are stateless, invalidating them before their natural <code>exp</code> milestone requires secondary architectural systems. Best practices dictate deploying short live-spans for access tokens paired with a database-backed refresh token pattern to safely revoke access when threat states change.
              </p>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-6">
            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/30 to-transparent dark:from-indigo-950/10 p-5 rounded-r-xl shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm md:text-base">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                Is my JWT data transmitted over the internet or sent to a server?
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                Absolutely not. The TwisterTools JWT Decoder operates 100% client-side inside your local browser sandbox. The string processing, Base64Url parsing algorithms, and calendar formatting computations take place inside your browser. No data is logged, tracked, cached, or transmitted across a network call.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/30 to-transparent dark:from-indigo-950/10 p-5 rounded-r-xl shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm md:text-base">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                Can this tool verify the signature of my JWT securely?
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                This utility decodes the header and payload claims configurations visually and extracts structural cryptographic signatures. It does not verify signature keys against live private/public key arrays on remote servers, protecting the confidentiality of your backend security secrets.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/30 to-transparent dark:from-indigo-950/10 p-5 rounded-r-xl shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm md:text-base">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                How are expiration dates and times computed?
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                JWT properties like `exp` (Expiration Time) and `iat` (Issued At) are stored as numerical Unix epoch timestamps (seconds elapsed since January 1, 1970). The TwisterTools parsing engine intercepts these parameters, maps them against local system calendars, and displays precise timezone dates automatically.
              </p>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
