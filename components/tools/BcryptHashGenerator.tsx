"use client";

import { useState, useCallback, useTransition } from "react";
import bcrypt from "bcryptjs";
import {
    ShieldCheck,
    KeyRound,
    Hash,
    Copy,
    Check,
    RefreshCw,
    Sliders,
    ShieldAlert,
    HelpCircle,
    Info,
    Clock,
    CheckCircle2,
    XCircle,
    Cpu,
    Layers,
    Sparkles,
} from "lucide-react";

interface ParsedBcryptHash {
    valid: boolean;
    prefix?: string;
    cost?: number;
    salt?: string;
    hash?: string;
    raw?: string;
}

export default function BcryptHashGenerator() {
    // Mode selection: "generate" or "verify"
    const [activeTab, setActiveTab] = useState<"generate" | "verify">("generate");

    // Generator Workspace State
    const [plainPassword, setPlainPassword] = useState("CorrectHorseBatteryStaple!2026");
    const [rounds, setRounds] = useState(10);
    const [roundsInput, setRoundsInput] = useState("10");
    const [generatedHash, setGeneratedHash] = useState("");
    const [generationDuration, setGenerationDuration] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedHash, setCopiedHash] = useState(false);

    // Verifier Workspace State
    const [candidatePlaintext, setCandidatePlaintext] = useState("");
    const [candidateHash, setCandidateHash] = useState("");
    const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationDuration, setVerificationDuration] = useState<number | null>(null);

    const [, startTransition] = useTransition();

    // Helper to parse bcrypt anatomy
    const parseBcrypt = useCallback((hashStr: string): ParsedBcryptHash => {
        const trimmed = hashStr.trim();
        const regex = /^\$([0-9a-z]{2,3})\$([0-9]{2})\$([A-Za-z0-9./]{22})([A-Za-z0-9./]{31})$/;
        const match = trimmed.match(regex);
        if (!match) {
            return { valid: false, raw: trimmed };
        }
        return {
            valid: true,
            prefix: `$${match[1]}$`,
            cost: parseInt(match[2], 10),
            salt: match[3],
            hash: match[4],
            raw: trimmed,
        };
    }, []);

    // Compute parsed details for current preview
    const inspectedHash = parseBcrypt(
        activeTab === "generate" ? generatedHash : candidateHash
    );

    // Sanitized Rounds Input Handler
    const handleRoundsChange = (valStr: string) => {
        const sanitized = valStr.replace(/^0+(?=\d)/, "");
        setRoundsInput(sanitized);
        const num = parseInt(sanitized, 10);
        if (!isNaN(num)) {
            const bounded = Math.max(4, Math.min(14, num));
            setRounds(bounded);
        }
    };

    // Generate Hash
    const handleGenerate = useCallback(() => {
        if (!plainPassword) {
            setGeneratedHash("");
            return;
        }
        setIsGenerating(true);

        startTransition(() => {
            setTimeout(() => {
                const start = performance.now();
                try {
                    const salt = bcrypt.genSaltSync(rounds);
                    const hash = bcrypt.hashSync(plainPassword, salt);
                    const end = performance.now();
                    setGeneratedHash(hash);
                    setGenerationDuration(Math.round(end - start));
                } catch (err) {
                    console.error("Bcrypt generation error:", err);
                } finally {
                    setIsGenerating(false);
                }
            }, 10);
        });
    }, [plainPassword, rounds]);

    // Quick verify handler
    const handleVerify = useCallback(() => {
        if (!candidatePlaintext || !candidateHash) return;
        setIsVerifying(true);
        setVerificationResult(null);

        startTransition(() => {
            setTimeout(() => {
                const start = performance.now();
                try {
                    const isValid = bcrypt.compareSync(candidatePlaintext, candidateHash.trim());
                    const end = performance.now();
                    setVerificationResult(isValid);
                    setVerificationDuration(Math.round(end - start));
                } catch {
                    setVerificationResult(false);
                    setVerificationDuration(0);
                } finally {
                    setIsVerifying(false);
                }
            }, 10);
        });
    }, [candidatePlaintext, candidateHash]);

    // Copy to clipboard
    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedHash(true);
            setTimeout(() => setCopiedHash(false), 2000);
        });
    };

    // Fill sample into verifier
    const handleTransferToVerifier = () => {
        if (!generatedHash) return;
        setCandidatePlaintext(plainPassword);
        setCandidateHash(generatedHash);
        setActiveTab("verify");
        setVerificationResult(null);
    };

    return (
        <div className="w-full space-y-8">
            {/* Tab Selector */}
            <div className="flex bg-slate-100 p-1.5 mb-4 rounded-2xl max-w-md mx-auto border border-slate-200 shadow-inner">
                <button
                    onClick={() => setActiveTab("generate")}
                    className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === "generate"
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <KeyRound className="w-4 h-4" />
                    Generate Hash
                </button>
                <button
                    onClick={() => setActiveTab("verify")}
                    className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === "verify"
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    Verify Hash
                </button>
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* LEFT COLUMN: Controls & Input */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 min-w-0">
                    {activeTab === "generate" ? (
                        <>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    <span>Input String & Cost Factor</span>
                                </div>
                                <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                                    prefix: $2a$ / $2b$
                                </span>
                            </div>

                            {/* Plaintext Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex justify-between">
                                    <span>Plaintext Password</span>
                                    <span className="text-slate-400 font-normal lowercase font-mono">
                                        {plainPassword.length} chars (UTF-8)
                                    </span>
                                </label>
                                <textarea
                                    value={plainPassword}
                                    onChange={(e) => setPlainPassword(e.target.value)}
                                    placeholder="Enter plaintext to hash..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-mono resize-none transition-all"
                                />
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Bcrypt truncates strings after 72 bytes. All entropy beyond 72 bytes is discarded by the Blowfish key schedule.
                                </p>
                            </div>

                            {/* Salt Rounds Slider + Input */}
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Cpu className="w-4 h-4 text-indigo-600" />
                                        <span>Cost Factor (Log2 Rounds)</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 font-mono">2^{rounds} = {(2 ** rounds).toLocaleString()} iterations</span>
                                        <input
                                            type="number"
                                            min={4}
                                            max={14}
                                            value={roundsInput}
                                            onChange={(e) => handleRoundsChange(e.target.value)}
                                            className="w-14 text-center py-1 px-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-indigo-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={4}
                                    max={14}
                                    step={1}
                                    value={rounds}
                                    onChange={(e) => handleRoundsChange(e.target.value)}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                                />
                                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                                    <span>Fast (4-8)</span>
                                    <span className="text-indigo-600 font-bold">Standard (10-12)</span>
                                    <span>Extremely Slow (13-14)</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !plainPassword}
                                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                                <span>{isGenerating ? "Computing Salt & Hash..." : "Generate BCRYPT Hash"}</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                    <span>Verify String Against Hash</span>
                                </div>
                                <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                                    constant-time
                                </span>
                            </div>

                            {/* Candidate Plaintext */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    Candidate Plaintext String
                                </label>
                                <input
                                    type="text"
                                    value={candidatePlaintext}
                                    onChange={(e) => setCandidatePlaintext(e.target.value)}
                                    placeholder="Enter candidate password to check..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-mono transition-all"
                                />
                            </div>

                            {/* Target Bcrypt Hash */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    Stored Target BCRYPT Hash
                                </label>
                                <textarea
                                    value={candidateHash}
                                    onChange={(e) => setCandidateHash(e.target.value)}
                                    placeholder="$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-sm font-mono resize-none transition-all"
                                />
                            </div>

                            {/* Verify Action Button */}
                            <button
                                onClick={handleVerify}
                                disabled={isVerifying || !candidatePlaintext || !candidateHash}
                                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <ShieldCheck className={`w-4 h-4 ${isVerifying ? "animate-spin" : ""}`} />
                                <span>{isVerifying ? "Comparing Hashes..." : "Verify Match"}</span>
                            </button>
                        </>
                    )}
                </div>

                {/* RIGHT COLUMN: Results, Anatomy & Execution Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            <span>Inspection & Cryptographic Result</span>
                        </div>
                        {generationDuration !== null && activeTab === "generate" && (
                            <span className="flex items-center gap-1 text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                {generationDuration} ms
                            </span>
                        )}
                    </div>

                    {activeTab === "generate" ? (
                        <div className="space-y-6">
                            {/* Output Hash Card */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Calculated Hash Output (60 chars)
                                    </span>
                                    {generatedHash && (
                                        <button
                                            onClick={handleTransferToVerifier}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Test in Verifier
                                        </button>
                                    )}
                                </div>
                                <div className="relative font-mono break-all bg-slate-900 text-indigo-300 p-4 rounded-xl text-sm leading-relaxed min-h-[72px] flex items-center select-all border border-slate-800">
                                    {generatedHash ? (
                                        generatedHash
                                    ) : (
                                        <span className="text-slate-500 italic font-sans font-normal">
                                            Click &quot;Generate BCRYPT Hash&quot; to calculate your key-stretched digest.
                                        </span>
                                    )}
                                </div>
                                {generatedHash && (
                                    <button
                                        onClick={() => handleCopy(generatedHash)}
                                        className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        {copiedHash ? (
                                            <>
                                                <Check className="w-4 h-4 text-emerald-600" />
                                                <span className="text-emerald-700">Copied to Clipboard!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 text-slate-500" />
                                                <span>Copy Output Hash</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Hash Anatomy Breakdown */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-indigo-600" />
                                    <span>BCRYPT Modular Crypt Format (MCF) Anatomy</span>
                                </h4>
                                {inspectedHash.valid ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                        <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Prefix</span>
                                            <p className="font-mono text-sm font-bold text-indigo-600">{inspectedHash.prefix}</p>
                                            <p className="text-[11px] text-slate-500">Algorithm ID</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Cost</span>
                                            <p className="font-mono text-sm font-bold text-indigo-600">{inspectedHash.cost}</p>
                                            <p className="text-[11px] text-slate-500">2^{inspectedHash.cost} rounds</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-1 sm:col-span-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Salt Length</span>
                                            <p className="font-mono text-sm font-bold text-indigo-600">22 characters</p>
                                            <p className="text-[11px] text-slate-500">128-bit Base64</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">
                                        Generate a hash above to see its parsed salt, cost factor, and digest components.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Verification Outcome */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Verification Output
                                </span>
                                {verificationResult === null ? (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm italic">
                                        Enter candidate credentials and click &quot;Verify Match&quot; to execute constant-time comparison.
                                    </div>
                                ) : verificationResult ? (
                                    <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-xl p-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-emerald-900">Valid Password Match</h4>
                                            <p className="text-xs text-emerald-700 mt-0.5">
                                                The candidate password successfully derived the exact matching digest using the embedded salt in {verificationDuration} ms.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-rose-50 border-2 border-rose-500/40 rounded-xl p-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                            <XCircle className="w-7 h-7 text-rose-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-rose-900">Hash Mismatch or Invalid Format</h4>
                                            <p className="text-xs text-rose-700 mt-0.5">
                                                Candidate string failed verification. Either the password is wrong, or the provided string is not a valid 60-character bcrypt hash.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Anatomy of Verified Target */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-indigo-600" />
                                    <span>Target Hash Integrity Assessment</span>
                                </h4>
                                {candidateHash ? (
                                    inspectedHash.valid ? (
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between py-1 border-b border-slate-200/60 font-mono">
                                                <span className="text-slate-500">Detected Cost:</span>
                                                <span className="font-bold text-indigo-600">{inspectedHash.cost} ({(2 ** (inspectedHash.cost || 0)).toLocaleString()} rounds)</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-slate-200/60 font-mono">
                                                <span className="text-slate-500">Extracted Salt:</span>
                                                <span className="text-slate-700 truncate max-w-[200px]">{inspectedHash.salt}</span>
                                            </div>
                                            <div className="flex justify-between py-1 font-mono">
                                                <span className="text-slate-500">Hash Checksum:</span>
                                                <span className="text-slate-700 truncate max-w-[200px]">{inspectedHash.hash}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-rose-600 font-medium">
                                            Provided target does not match the standard 60-character Modular Crypt Format regex: <code>$2[aby]$[cost]$[salt+hash]</code>
                                        </p>
                                    )
                                ) : (
                                    <p className="text-xs text-slate-500 italic">
                                        Paste a bcrypt hash to inspect its embedded salt and cost factor.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
          BELOW-THE-FOLD DETAILED TECHNICAL & SEO PROSE CONTENT
         ───────────────────────────────────────────────────────────── */}
            <section className="space-y-6">
                {/* Technical Specification Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>What is BCRYPT and How Does the Blowfish Key Schedule Function?</span>
                    </h2>
                    <div className="space-y-4">
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Bcrypt is an adaptive cryptographic password-hashing function designed by Niels Provos and David Mazières in 1999, based on the Blowfish block cipher. Unlike fast general-purpose cryptographic checksum algorithms such as MD5, SHA-1, or SHA-256—which were engineered for streaming data throughput and file verification—bcrypt is purposefully slow and memory-hardened to withstand specialized brute-force hardware, ASICs, and GPU cracking clusters.
                        </p>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            At its core, bcrypt initializes the key schedule of Blowfish through a routine designated as <code>EksBlowfishSetup</code> (Expensive Key Schedule). It interleaves a 128-bit cryptographically secure pseudorandom salt with the user password across 2<sup>cost</sup> iterations. By repeatedly permuting the subkeys and S-boxes of the cipher, bcrypt creates significant computational latency for an attacker without placing prohibitive loads on modern web servers handling single authentication requests.
                        </p>
                    </div>
                </div>

                {/* Anatomy Table & Breakdown Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Hash className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Anatomy of a Standard 60-Character Modular Crypt Format (MCF) Hash</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Every standard bcrypt string outputs exactly 60 characters encoded in a custom, non-standard Base64 alphabet (<code>./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789</code>). Because the salt is stored in plain sight inside the final digest string, backend database schemas do not require a separate database column for the salt.
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border border-slate-200 rounded-xl overflow-hidden">
                            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Component</th>
                                    <th className="p-3">Character Count</th>
                                    <th className="p-3 font-mono">Example Value</th>
                                    <th className="p-3">Cryptographic Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                                <tr>
                                    <td className="p-3 font-semibold text-slate-800">Prefix Identifier</td>
                                    <td className="p-3">4 characters</td>
                                    <td className="p-3 font-mono text-indigo-600">$2a$ or $2b$</td>
                                    <td className="p-3">Identifies the algorithm specification and fix version.</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-800">Cost Factor</td>
                                    <td className="p-3">3 characters</td>
                                    <td className="p-3 font-mono text-indigo-600">10$</td>
                                    <td className="p-3">Specifies the exponent iterations (2<sup>10</sup> = 1,024 rounds).</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-800">Embedded Salt</td>
                                    <td className="p-3">22 characters</td>
                                    <td className="p-3 font-mono text-indigo-600">N9qo8uLOickgx2ZMRZoMye</td>
                                    <td className="p-3">Base64-encoded 128-bit random salt to defeat rainbow tables.</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-800">Cipher Digest</td>
                                    <td className="p-3">31 characters</td>
                                    <td className="p-3 font-mono text-indigo-600">IjZAgcfl7p92ldGxad68LJZdL17lhWy</td>
                                    <td className="p-3">Resulting ciphertext from 64-bit &quot;OrpheanBeholderScryDoubt&quot; encryption.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recommended Cost Guidelines Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Cost Factor Recommendations & Performance Calibration</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase font-mono tracking-wider">Rounds: 8 - 9</span>
                            <h3 className="font-bold text-slate-800 text-sm">Testing & High-Throughput CI</h3>
                            <p className="text-slate-700 text-sm leading-relaxed">
                                Executes in roughly 10-30 ms per derivation. Best reserved for mock database seeding, localized automated testing pipelines, or low-memory IoT embedded controllers.
                            </p>
                        </div>
                        <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5 space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase font-mono tracking-wider">Rounds: 10 - 12 (Recommended)</span>
                            <h3 className="font-bold text-slate-800 text-sm">Standard Production Applications</h3>
                            <p className="text-slate-700 text-sm leading-relaxed">
                                Executes in approximately 100-350 ms on server hardware. Strikes the optimal balance between brute-force resistance and server CPU consumption for web user logins.
                            </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase font-mono tracking-wider">Rounds: 13 - 14+</span>
                            <h3 className="font-bold text-slate-800 text-sm">High-Security Administrative Portals</h3>
                            <p className="text-slate-700 text-sm leading-relaxed">
                                Takes 800 ms to well over 2 seconds per hash. Recommended only for ultra-privileged master keys, root infrastructure accounts, and cold storage unlock mechanisms.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Security Best Practices Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Critical BCRYPT Vulnerability Caveats & Best Practices</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <h3 className="font-semibold text-slate-800 text-sm">The 72-Byte Truncation Limit</h3>
                            </div>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Blowfish only accepts keys up to 448 bits (56 bytes), which bcrypt stretches to 72 bytes. Any characters beyond index 71 are silently dropped. If long passphrases are anticipated, pre-hash strings using SHA-256 or SHA-512 before passing them to bcrypt.
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <h3 className="font-semibold text-slate-800 text-sm">Constant-Time Equality Verification</h3>
                            </div>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Never compare password hashes using naive string equality operators (<code>hashA === hashB</code>). Naive equality is susceptible to timing side-channel attacks. Always use constant-time verification functions like <code>bcrypt.compare()</code>.
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <h3 className="font-semibold text-slate-800 text-sm">Re-Hashing on Login (Cost Migration)</h3>
                            </div>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                As hardware performance doubles according to Moore’s law, older cost factors become insecure. Check the cost factor on valid logins using <code>bcrypt.getRounds(hash)</code> and upgrade the stored hash automatically if it falls below current guidelines.
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <h3 className="font-semibold text-slate-800 text-sm">Bcrypt vs. Argon2id and PBKDF2</h3>
                            </div>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While modern standards like Argon2id provide superior resistance to GPU/ASIC attacks due to configurable memory matrices, bcrypt remains universally supported, battle-tested across decades of cryptographic review, and FIPS compliant.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section (Static border-highlighted cards, no accordions) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-5">
                        {[
                            {
                                q: "Does this online generator transmit my password or hash to any backend server?",
                                a: "No. This tool compiles and executes bcryptjs 100% inside your local web browser environment via client-side JavaScript. No passwords, salts, or hashes ever leave your local device or transmit across the internet.",
                            },
                            {
                                q: "Why do identical passwords generate completely different bcrypt hashes each time?",
                                a: "Bcrypt automatically generates a unique 128-bit cryptographically secure pseudorandom salt every time you invoke the generator. Even with the identical plain password and cost factor, a unique salt guarantees a distinct hash, eliminating rainbow table attacks.",
                            },
                            {
                                q: "What is the difference between $2a$, $2b$, and $2y$ prefixes?",
                                a: "The prefixes indicate the implementation version of the bcrypt algorithm. The $2a$ prefix is the baseline specification. The $2y$ prefix was introduced by PHP to resolve an 8-bit character sign-extension bug, while $2b$ is the modern canonical OpenBSD fix version that addresses all known edge cases.",
                            },
                            {
                                q: "Can a bcrypt password hash be decrypted or reversed back to plaintext?",
                                a: "No. Bcrypt is a one-way mathematical function. It cannot be mathematically inverted or decrypted. The only way to discover the original password is via exhaustive brute-force or dictionary attacks, which are severely throttled by bcrypt's intentional slowness.",
                            },
                            {
                                q: "How does the salt verifier know what salt to use if I only supply the hash?",
                                a: "The Modular Crypt Format packs the salt directly into characters 7 through 29 of the 60-character output string. When verifying, the library extracts that embedded salt, runs the candidate password through the exact same cost schedule, and compares the resulting digest in constant time.",
                            },
                        ].map(({ q, a }) => (
                            <div
                                key={q}
                                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
                            >
                                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                    {q}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Why Use Tool Banner Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl md:p-10 shadow-lg text-white p-4 sm:p-6">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Info className="w-5 h-5 text-white" />
                        </div>
                        <span>Why Use TwisterTools BCRYPT Password Hash Generator & Verifier?</span>
                    </h2>
                    <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
                        Engineered for backend architects, DevOps engineers, and security auditors, TwisterTools provides an isolated, zero-latency cryptographic testing utility. Whether you are debugging authentication failures in Node.js, Spring Security, or Django, verifying password hashes from legacy database backups, or benchmarking salt rounds, our tool guarantees zero telemetry and zero server transmission.
                    </p>
                </div>
            </section>

            {/* Structured Data (JSON-LD) */}
            <div className="hidden">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            name: "BCRYPT Password Hash Generator & Salt Verifier",
                            description: "Free online client-side BCRYPT password hash generator and constant-time verifier. Inspect salt rounds, cost factor, and Modular Crypt Format anatomy entirely in your browser.",
                            url: "https://www.twistertools.com/tools/developer-tools/bcrypt-hash-generator",
                            applicationCategory: "DeveloperApplication",
                            operatingSystem: "Any",
                            browserRequirements: "Requires JavaScript. Runs 100% offline in browser.",
                            offers: {
                                "@type": "Offer",
                                price: "0",
                                priceCurrency: "USD",
                            },
                            featureList: [
                                "Client-side Blowfish key-stretching execution via bcryptjs",
                                "Configurable logarithmic cost factor from 4 to 14 rounds",
                                "Instant parsing of 60-character Modular Crypt Format (MCF) strings",
                                "Constant-time hash comparison verifier for credential validation",
                                "Execution duration benchmark in milliseconds",
                                "Zero server data transmission for absolute developer privacy",
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
                                    name: "Does this online generator transmit my password or hash to any backend server?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "No. This tool compiles and executes bcryptjs 100% inside your local web browser environment via client-side JavaScript. No passwords, salts, or hashes ever leave your local device or transmit across the internet.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "Why do identical passwords generate completely different bcrypt hashes each time?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "Bcrypt automatically generates a unique 128-bit cryptographically secure pseudorandom salt every time you invoke the generator. Even with the identical plain password and cost factor, a unique salt guarantees a distinct hash, eliminating rainbow table attacks.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "What is the difference between $2a$, $2b$, and $2y$ prefixes?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "The prefixes indicate the implementation version of the bcrypt algorithm. The $2a$ prefix is the baseline specification. The $2y$ prefix was introduced by PHP to resolve an 8-bit character sign-extension bug, while $2b$ is the modern canonical OpenBSD fix version that addresses all known edge cases.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "Can a bcrypt password hash be decrypted or reversed back to plaintext?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "No. Bcrypt is a one-way mathematical function. It cannot be mathematically inverted or decrypted. The only way to discover the original password is via exhaustive brute-force or dictionary attacks, which are severely throttled by bcrypt's intentional slowness.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "How does the salt verifier know what salt to use if I only supply the hash?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "The Modular Crypt Format packs the salt directly into characters 7 through 29 of the 60-character output string. When verifying, the library extracts that embedded salt, runs the candidate password through the exact same cost schedule, and compares the resulting digest in constant time.",
                                    },
                                },
                            ],
                        }),
                    }}
                />
            </div>
        </div>
    );
}