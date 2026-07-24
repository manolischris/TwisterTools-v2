"use client";

import { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Clock,
  HelpCircle,
  Zap,
  Shield,
  Laptop,
  Cpu,
  Server,
  Lock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Weak Patterns & Dictionary Databases
// ─────────────────────────────────────────────────────────────
const COMMON_PASSWORDS = [
  "password", "123456", "123456789", "12345678", "1234567", "12345",
  "qwerty", "admin", "welcome", "letmein", "monkey", "security",
  "password123", "password1", "123123", "default", "root", "oracle",
  "iloveyou", "princess", "keyboard", "secret"
];

function hasRepeatedChars(val: string): boolean {
  // Flag 4 or more identical consecutive characters
  return /(.)\1{3,}/.test(val);
}

function hasSequentialPattern(val: string): boolean {
  if (val.length < 4) return false;
  const s = val.toLowerCase();
  for (let i = 0; i <= s.length - 4; i++) {
    const char1 = s.charCodeAt(i);
    const char2 = s.charCodeAt(i + 1);
    const char3 = s.charCodeAt(i + 2);
    const char4 = s.charCodeAt(i + 3);
    
    // Check ascending numeric/alphabetic sequence
    if (char2 === char1 + 1 && char3 === char2 + 1 && char4 === char3 + 1) {
      return true;
    }
    // Check descending numeric/alphabetic sequence
    if (char2 === char1 - 1 && char3 === char2 - 1 && char4 === char3 - 1) {
      return true;
    }
  }
  return false;
}

function isCommonPassword(val: string): boolean {
  const s = val.toLowerCase();
  return COMMON_PASSWORDS.some(
    (p) => s === p || (s.length >= 6 && s.includes(p))
  );
}

// ─────────────────────────────────────────────────────────────
//  Cracking Time Math Engine (Log Space)
// ─────────────────────────────────────────────────────────────
function getCrackingTime(logKeyspace: number, logGuessesPerSecond: number): string {
  if (logKeyspace === 0) return "Instant";
  const logSeconds = logKeyspace - logGuessesPerSecond;
  if (logSeconds < 0) return "Instant";
  
  // Under ~1 year (31,536,000 seconds)
  if (logSeconds < 7.5) {
    const secs = Math.pow(10, logSeconds);
    if (secs < 1) return "Instant";
    if (secs < 60) {
      const s = Math.round(secs);
      return `${s} second${s !== 1 ? "s" : ""}`;
    }
    if (secs < 3600) {
      const m = Math.round(secs / 60);
      return `${m} minute${m !== 1 ? "s" : ""}`;
    }
    if (secs < 86400) {
      const h = Math.round(secs / 3600);
      return `${h} hour${h !== 1 ? "s" : ""}`;
    }
    const d = Math.round(secs / 86400);
    return `${d} day${d !== 1 ? "s" : ""}`;
  }
  
  // Exponents beyond ~1 year
  const logYears = logSeconds - Math.log10(31536000);
  if (logYears < 0) {
    return "1 year";
  }
  if (logYears < 3) { // 1 to 1,000 years
    const y = Math.round(Math.pow(10, logYears));
    return `${y} year${y !== 1 ? "s" : ""}`;
  }
  if (logYears < 6) { // 1,000 to 1,000,000 years
    const thousandYears = Math.pow(10, logYears - 3);
    return `${thousandYears.toFixed(1)} Thousand Years`;
  }
  if (logYears < 9) { // 1,000,000 to 1,000,000,000 years
    const millionYears = Math.pow(10, logYears - 6);
    return `${millionYears.toFixed(1)} Million Years`;
  }
  if (logYears < 12) { // Billions
    const billionYears = Math.pow(10, logYears - 9);
    return `${billionYears.toFixed(1)} Billion Years`;
  }
  if (logYears < 15) { // Trillions
    const trillionYears = Math.pow(10, logYears - 12);
    return `${trillionYears.toFixed(1)} Trillion Years`;
  }
  if (logYears < 18) { // Quadrillions
    const quadrillionYears = Math.pow(10, logYears - 15);
    return `${quadrillionYears.toFixed(1)} Quadrillion Years`;
  }
  if (logYears < 21) { // Quintillions
    const quintillionYears = Math.pow(10, logYears - 18);
    return `${quintillionYears.toFixed(1)} Quintillion Years`;
  }
  return "Beyond Heat Death of Universe";
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────
export default function PasswordStrengthChecker() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Compute character pools and entropy in real time
  const analysis = useMemo(() => {
    if (!password) {
      return {
        entropy: 0,
        poolSize: 0,
        hasLowercase: false,
        hasUppercase: false,
        hasNumbers: false,
        hasSymbols: false,
        isCommon: false,
        hasRepeated: false,
        hasSequential: false,
        score: 0,
      };
    }

    let hasLowercase = false;
    let hasUppercase = false;
    let hasNumbers = false;
    let hasSymbols = false;

    for (let i = 0; i < password.length; i++) {
      const char = password[i];
      if (/[a-z]/.test(char)) {
        hasLowercase = true;
      } else if (/[A-Z]/.test(char)) {
        hasUppercase = true;
      } else if (/[0-9]/.test(char)) {
        hasNumbers = true;
      } else {
        // Any other character counts as special symbol/space/punctuation
        hasSymbols = true;
      }
    }

    let poolSize = 0;
    if (hasLowercase) poolSize += 26;
    if (hasUppercase) poolSize += 26;
    if (hasNumbers) poolSize += 10;
    if (hasSymbols) poolSize += 33; // 33 special symbols

    // Shannon Entropy: E = L * log2(R)
    const entropy = password.length * (poolSize > 0 ? Math.log2(poolSize) : 0);

    const isCommon = isCommonPassword(password);
    const hasRepeated = hasRepeatedChars(password);
    const hasSequential = hasSequentialPattern(password);

    // Calculate score (0 to 100)
    // 30% length (capped at 16 chars), 40% entropy (capped at 100 bits), 30% character pool diversity
    const lengthContrib = Math.min(password.length / 16, 1) * 30;
    const entropyContrib = Math.min(entropy / 100, 1) * 40;
    
    let activePools = 0;
    if (hasLowercase) activePools++;
    if (hasUppercase) activePools++;
    if (hasNumbers) activePools++;
    if (hasSymbols) activePools++;
    const diversityContrib = (activePools / 4) * 30;

    let rawScore = lengthContrib + entropyContrib + diversityContrib;

    // Apply severity deductions for vulnerabilities
    if (isCommon) {
      rawScore = Math.max(10, rawScore - 45);
    } else {
      if (hasSequential) rawScore = Math.max(15, rawScore - 20);
      if (hasRepeated) rawScore = Math.max(15, rawScore - 15);
    }

    const score = Math.round(Math.min(Math.max(rawScore, 0), 100));

    return {
      entropy,
      poolSize,
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols,
      isCommon,
      hasRepeated,
      hasSequential,
      score,
    };
  }, [password]);

  const { score, entropy, poolSize, hasLowercase, hasUppercase, hasNumbers, hasSymbols, isCommon, hasRepeated, hasSequential } = analysis;

  // Visual tiers mapping
  const tier = useMemo(() => {
    if (!password) return { name: "No Password", color: "text-slate-400 dark:text-slate-500", bg: "bg-slate-200 dark:bg-slate-800", hex: "#94a3b8" };
    if (score <= 20) return { name: "Very Weak", color: "text-red-600 dark:text-red-400", bg: "bg-red-500", hex: "#ef4444" };
    if (score <= 40) return { name: "Weak", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500", hex: "#f97316" };
    if (score <= 60) return { name: "Moderate", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", hex: "#f59e0b" };
    if (score <= 80) return { name: "Strong", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500", hex: "#0d9488" };
    return { name: "Exceptionally Secure", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-600", hex: "#4f46e5" };
  }, [score, password]);

  // Is strong indicator for Shield check
  const isStrong = password.length > 0 && score >= 61;

  // Real-time criteria checklist
  const criteria = [
    {
      id: "length",
      label: "Minimum 12 characters (Recommended)",
      met: password.length >= 12,
      isWarning: false,
    },
    {
      id: "uppercase",
      label: "Contains uppercase letters (A-Z)",
      met: hasUppercase,
      isWarning: false,
    },
    {
      id: "lowercase",
      label: "Contains lowercase letters (a-z)",
      met: hasLowercase,
      isWarning: false,
    },
    {
      id: "numbers",
      label: "Contains numeric digits (0-9)",
      met: hasNumbers,
      isWarning: false,
    },
    {
      id: "symbols",
      label: "Contains special symbols (e.g. !@#$)",
      met: hasSymbols,
      isWarning: false,
    },
    {
      id: "repeated",
      label: "No repeated character blocks (e.g. 'aaaa')",
      met: !hasRepeated,
      isWarning: true,
    },
    {
      id: "common",
      label: "No common dictionary patterns or words",
      met: !isCommon && !hasSequential,
      isWarning: true,
    },
  ];

  // Crack Time Estimations (Log scale)
  const logR = poolSize > 0 ? Math.log10(poolSize) : 0;
  const logKeyspace = password.length * logR;

  const laptopTime = getCrackingTime(logKeyspace, 10);      // 10 Billion hashes/sec
  const gpuTime = getCrackingTime(logKeyspace, 14);         // 100 Trillion hashes/sec
  const supercomputerTime = getCrackingTime(logKeyspace, 16); // 10 Quadrillion hashes/sec

  // SVG Dial Dash calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <div className="w-full space-y-8">
      {/* ── 2. Asymmetrical Two-Column Dashboard Grid (8/4 split) ── */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* ══════════════════ LEFT PANEL — 8 columns ══════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            {/* Input Text Area Container */}
            <div className="space-y-2">
              <label
                htmlFor="password-input"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Password Input
              </label>
              <div className="relative">
                <textarea
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter or paste a password to check its strength..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-955 px-4 py-3 pr-12 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all font-mono"
                  style={{ WebkitTextSecurity: showPassword ? "none" : "disc" } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Visual Strength Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Calculated Strength</span>
                <span className="font-mono text-sm">{password ? `${score}%` : "0%"}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${tier.bg}`}
                  style={{ width: `${password ? score : 0}%` }}
                />
              </div>
            </div>

            {/* Metrics Info Bar */}
            {password && (
              <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-xl p-3.5 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Length</p>
                  <p className="font-mono text-sm text-slate-800 dark:text-slate-200">{password.length} chars</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Keyspace</p>
                  <p className="font-mono text-sm text-slate-800 dark:text-slate-200">{poolSize} pool</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Entropy</p>
                  <p className="font-mono text-sm text-slate-800 dark:text-slate-200">{entropy.toFixed(1)} bits</p>
                </div>
              </div>
            )}
          </div>

          {/* Criteria Checklist Grid (2-column) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Instant Security Criteria
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {criteria.map((item) => {
                const Icon = item.met
                  ? CheckCircle2
                  : item.isWarning
                  ? AlertTriangle
                  : XCircle;
                const iconColor = item.met
                  ? "text-emerald-500"
                  : item.isWarning
                  ? "text-amber-500"
                  : "text-slate-400 dark:text-slate-600";
                const labelColor = item.met
                  ? "text-slate-700 dark:text-slate-300"
                  : "text-slate-500 dark:text-slate-500";

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/50 rounded-xl p-3.5"
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                    <span className={`text-xs font-medium leading-tight ${labelColor}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL — 4 columns ══════════════════ */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-4 space-y-5">
            
            {/* Sticky Floating Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-indigo-950 px-5 py-4 text-white">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-300" />
                  <span className="text-sm font-semibold">Security Level Summary</span>
                </div>
              </div>

              <div className="p-6 space-y-6 flex flex-col items-center">
                {/* Circular Dynamic Security Score Dial */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      className="transition-all duration-500"
                      stroke={password ? tier.hex : "#cbd5e1"}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={password ? strokeDashoffset : circumference}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                      {password ? score : 0}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mt-1">
                      Score
                    </span>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="text-center w-full">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Rating Tier
                  </p>
                  <p className={`text-base font-bold transition-colors ${tier.color}`}>
                    {tier.name}
                  </p>
                </div>

                {/* Warning / Feedback Box */}
                <div className="w-full border-t border-slate-100 dark:border-slate-850 pt-4">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-3.5 text-xs text-slate-600 dark:text-slate-400">
                    {!password ? (
                      <p className="text-center italic">Enter a password to run real-time metrics.</p>
                    ) : isCommon ? (
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p>
                          <strong className="text-red-600 dark:text-red-400">Critical Threat:</strong> This password is listed on public dictionaries of compromised keys.
                        </p>
                      </div>
                    ) : hasSequential ? (
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p>
                          <strong className="text-amber-600 dark:text-amber-400">Warning:</strong> Sequential numbers/letters patterns make brute-force attacks significantly faster.
                        </p>
                      </div>
                    ) : hasRepeated ? (
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p>
                          <strong className="text-amber-600 dark:text-amber-400">Warning:</strong> Repeated sequences (like &apos;aaaa&apos;) reduce cryptographic entropy significantly.
                        </p>
                      </div>
                    ) : score <= 40 ? (
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p>
                          <strong className="text-orange-600 dark:text-orange-400">Weak Rating:</strong> Easy target for custom offline GPU cracking clusters. Use a phrase or add numbers/symbols.
                        </p>
                      </div>
                    ) : score <= 60 ? (
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p>
                          <strong className="text-amber-600 dark:text-amber-400">Moderate Rating:</strong> Fairly secure. Standard length rules met, but vulnerable to customized server arrays.
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p>
                          <strong className="text-emerald-600 dark:text-emerald-400">Secure:</strong> High resistance to modern cracking rings. Excellent password composition.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cracking Time Matrix Grid */}
                <div className="w-full border-t border-slate-100 dark:border-slate-850 pt-4 space-y-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold text-center">
                    Estimated Time to Crack (Brute Force)
                  </p>
                  
                  {/* Laptop Row */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Consumer Laptop</span>
                    </div>
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      {password ? laptopTime : "Instant"}
                    </span>
                  </div>

                  {/* GPU Rig Row */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Custom GPU Rig</span>
                    </div>
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      {password ? gpuTime : "Instant"}
                    </span>
                  </div>

                  {/* Supercomputer Row */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Supercomputer</span>
                    </div>
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      {password ? supercomputerTime : "Instant"}
                    </span>
                  </div>
                </div>

                {/* Pro Security Badge Callout */}
                <div className="w-full border-t border-slate-100 dark:border-slate-850 pt-4 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    <strong className="text-slate-800 dark:text-slate-200">Zero-Data Exposure:</strong> Your password never leaves your browser. All checks execute offline in pure client-side TypeScript.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 3. Below-The-Fold Long-Form Content (MD5 Style Card Layout) ── */}
      <section className="space-y-8 pt-4">

        {/* Card 1: What is Password Strength and Entropy? */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900 dark:to-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="flex-1">What is Password Strength and Entropy?</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              Shannon Entropy
            </span>
          </h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed text-base">
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              Password strength is a measure of how difficult it is for an unauthorized system or attacker to guess or crack a password. This is fundamentally calculated through cryptographic entropy—measured in bits. Shannon Entropy evaluates the total possibilities of your password based on its length and character variety.
            </p>
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              Mathematically, a password with 40 bits of entropy has a keyspace of 2<sup>40</sup> potential combinations, whereas a secure password with 80+ bits of entropy scales exponentially to over 2<sup>80</sup> combinations. Real security requires a balance of character depth and absolute randomness, preventing automated dictionary attacks from instantly reconstructing your credentials.
            </p>
          </div>
        </div>

        {/* Card 2: How to Interpret Your Cracking Time Results */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900 dark:to-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="flex-1">How to Interpret Your Cracking Time Results</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              Brute Force Math
            </span>
          </h2>
          <div className="space-y-6">
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              Our analysis model simulates offline brute-force attack vectors across three processing benchmarks:
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  step: "01",
                  title: "Standard Desktop Hardware",
                  body: "Simulates a basic consumer-grade cracking program utilizing high-end laptop processors."
                },
                {
                  step: "02",
                  title: "Dedicated GPU Crack Array",
                  body: "Models a modern specialized hardware rig optimized with high-performance hashcat clusters."
                },
                {
                  step: "03",
                  title: "Enterprise Supercomputer",
                  body: "Represents state-sponsored distributed processing capable of scanning quadrillions of combinations per second."
                }
              ].map(({ step, title, body }) => (
                <div
                  key={step}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                      {step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-850 dark:text-slate-205 mb-1.5 text-sm">{title}</h3>
                      <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pt-2">
              If your password can be bypassed in less than 100 years by a standard GPU rig, it should be rotated immediately.
            </p>
          </div>
        </div>

        {/* Card 3: Five Crucial Rules for Bulletproof Password Security */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900 dark:to-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="flex-1">Five Crucial Rules for Bulletproof Password Security</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              Best Practices
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Length Over Complexity",
                body: "A simple but long sentence or passphrase (e.g., 'twister-tools-secure-workspace-2026') is exponentially harder to crack than a short, complex password like 'p@$$w0rd!'."
              },
              {
                title: "Unique Credentials",
                body: "Never reuse passwords across accounts. A compromise of one service instantly exposes all linked accounts."
              },
              {
                title: "Avoid Common Sequences",
                body: "Steer clear of sequential numbers (12345), standard keyboard patterns (qwerty), or dictionary words with direct character substitutions (like replacing 'S' with '$')."
              },
              {
                title: "Implement Multi-Factor Authentication (MFA)",
                body: "Even a mathematically perfect password can be compromised through physical phishing. MFA acts as your ultimate second line of defense."
              },
              {
                title: "Leverage Password Managers",
                body: "Human memory is not designed to retain dozens of 16-character randomized credentials. Utilize encrypted digital vaults to generate and store your keys."
              }
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  <h3 className="font-semibold text-slate-850 dark:text-slate-205 text-sm">{title}</h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Frequently Asked Questions (FAQ) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-900 dark:to-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="flex-1">Frequently Asked Questions</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              Offline FAQ
            </span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Is my password sent to any server during this check?",
                a: "Absolutely not. TwisterTools operates under a strict privacy model. The security analyzer evaluates your password 100% on your local machine via client-side JavaScript. No network requests are dispatched, meaning your raw credentials never touch the internet.",
              },
              {
                q: "What is a dictionary attack, and why does complexity fail?",
                a: "A dictionary attack uses massive pre-compiled lists of words, common substitutions, and leaked passwords rather than guessing characters one-by-one. If your password is a modified dictionary word (e.g., 'P@ssword123'), specialized cracking engines will match it in seconds, rendering raw character complexity useless.",
              },
              {
                q: "What constitutes a strong entropy rating?",
                a: "Any score below 50 bits of entropy is considered weak. A rating of 50 to 79 bits offers moderate, standard protection. For high-security environments, target 80 bits of entropy or more, which provides trillions of years of protection against modern hardware arrays.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-slate-900/50 dark:to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-850 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Why Use the TwisterTools Strength Analyzer? */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg text-white">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span>Why Use the TwisterTools Strength Analyzer?</span>
          </h2>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
            Our tool provides real-world offline simulations instead of generic complexity checklists. By combining entropy calculations with multi-tiered parallel processing estimations, we give you concrete mathematical proof of your credentials&apos; strength. Built for developers, system administrators, and privacy-conscious users, the tool offers complete local processing, zero ads, zero logs, and high-performance execution.
          </p>
        </div>

      </section>

      {/* JSON-LD WebApplication Schema */}
      <div className="hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Password Strength Checker and Cracking Time Analyzer",
              description:
                "Free online tool to evaluate password entropy and complexity, calculating brute-force cracking estimates for laptops, custom GPU rigs, and supercomputers. Safe, offline, client-side computations.",
              url: "https://www.twistertools.com/tools/password-tools/password-strength-checker",
              applicationCategory: "SecurityApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "TwisterTools",
                url: "https://www.twistertools.com",
              },
            }),
          }}
        />
      </div>
    </div>
  );
}
