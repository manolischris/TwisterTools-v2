"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  Lock,
  Key,
  Shield,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Sliders,
  ShieldCheck,
  Hash,
  ShieldAlert,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Curated Dictionary of Exactly 50 Words
//  Professional, easily readable, and clean.
// ─────────────────────────────────────────────────────────────
const DICTIONARY = [
  "swift", "galaxy", "anchor", "shadow", "beacon", "crest", "glimmer", "orbit", "peak", "summit",
  "harbor", "breeze", "canyon", "desert", "forest", "meadow", "oasis", "river", "valley", "glacier",
  "pinnacle", "zenith", "quantum", "matrix", "vector", "binary", "kernel", "cipher", "nexus", "cosmos",
  "nebula", "pulsar", "quasar", "stellar", "solace", "mirage", "haven", "refuge", "vortex", "aurora",
  "eclipse", "horizon", "apex", "tundra", "safari", "canopy", "sierra", "dune", "monolith", "dynamic"
];

// ─────────────────────────────────────────────────────────────
//  Secure Random Number Generator using Web Crypto API
// ─────────────────────────────────────────────────────────────
function secureRandomInt(max: number): number {
  if (typeof window === "undefined" || !window.crypto) {
    return Math.floor(Math.random() * max);
  }
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
}

type GeneratorMode = "random" | "passphrase";

export default function PasswordGenerator() {
  // Modes and Accordions
  const [mode, setMode] = useState<GeneratorMode>("random");
  const [card1Open, setCard1Open] = useState(true);
  const [card2Open, setCard2Open] = useState(true);
  const [card3Open, setCard3Open] = useState(true);

  // Random Password Mode State
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeChars, setExcludeChars] = useState("");

  // Memorable Passphrase Mode State
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [capitalizeWords, setCapitalizeWords] = useState(true);
  const [includeNumber, setIncludeNumber] = useState(true);

  // Output State
  const [generatedValue, setGeneratedValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [entropy, setEntropy] = useState(0);

  // ─────────────────────────────────────────────────────────────
  //  Core Hashing and Cryptographic Key Generation
  // ─────────────────────────────────────────────────────────────
  const generatePassword = useCallback(() => {
    if (mode === "random") {
      let uppercasePool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let lowercasePool = "abcdefghijklmnopqrstuvwxyz";
      let numbersPool = "0123456789";
      let symbolsPool = "!@#$%^&*";

      // Apply character exclusion if any
      if (excludeChars) {
        const excludeSet = new Set(excludeChars.split(""));
        const filterPool = (pool: string) =>
          pool.split("").filter((c) => !excludeSet.has(c)).join("");
        uppercasePool = filterPool(uppercasePool);
        lowercasePool = filterPool(lowercasePool);
        numbersPool = filterPool(numbersPool);
        symbolsPool = filterPool(symbolsPool);
      }

      let charset = "";
      let activePoolsCount = 0;
      let initialChars: string[] = [];

      // Guaranteed inclusion of at least one char from each checked set
      if (useUppercase && uppercasePool.length > 0) {
        charset += uppercasePool;
        initialChars.push(uppercasePool[secureRandomInt(uppercasePool.length)]);
        activePoolsCount++;
      }
      if (useLowercase && lowercasePool.length > 0) {
        charset += lowercasePool;
        initialChars.push(lowercasePool[secureRandomInt(lowercasePool.length)]);
        activePoolsCount++;
      }
      if (useNumbers && numbersPool.length > 0) {
        charset += numbersPool;
        initialChars.push(numbersPool[secureRandomInt(numbersPool.length)]);
        activePoolsCount++;
      }
      if (useSymbols && symbolsPool.length > 0) {
        charset += symbolsPool;
        initialChars.push(symbolsPool[secureRandomInt(symbolsPool.length)]);
        activePoolsCount++;
      }

      if (charset.length === 0) {
        setGeneratedValue("");
        setEntropy(0);
        return;
      }

      const remainingLength = Math.max(0, length - initialChars.length);
      let passwordArr = [...initialChars];

      for (let i = 0; i < remainingLength; i++) {
        passwordArr.push(charset[secureRandomInt(charset.length)]);
      }

      // Shuffle generated array using Fisher-Yates and secureRandomInt
      for (let i = passwordArr.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [passwordArr[i], passwordArr[j]] = [passwordArr[j], passwordArr[i]];
      }

      const passStr = passwordArr.join("");
      setGeneratedValue(passStr);

      // Shannon Entropy Calculation: H = L * log2(R)
      const poolSize = charset.length;
      const entropyVal = passStr.length * Math.log2(poolSize);
      setEntropy(isNaN(entropyVal) ? 0 : entropyVal);
    } else {
      // Memorable Passphrase Mode
      if (wordCount < 1) return;

      const words: string[] = [];
      for (let i = 0; i < wordCount; i++) {
        const wordIndex = secureRandomInt(DICTIONARY.length);
        let word = DICTIONARY[wordIndex];
        if (capitalizeWords) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        words.push(word);
      }

      let phrase = words.join(separator);
      if (includeNumber) {
        const num = secureRandomInt(10);
        phrase += separator + num;
      }

      setGeneratedValue(phrase);

      // Passphrase Shannon Entropy:
      // W * log2(50) + (if capitalized: W * log2(2) for mixed-case options) + (if number: log2(10))
      let entropyVal = wordCount * Math.log2(50);
      if (capitalizeWords) {
        entropyVal += wordCount; // Adding casing degree of freedom
      }
      if (includeNumber) {
        entropyVal += Math.log2(10); // Adding number degree of freedom
      }
      setEntropy(isNaN(entropyVal) ? 0 : entropyVal);
    }
  }, [
    mode,
    length,
    useUppercase,
    useLowercase,
    useNumbers,
    useSymbols,
    excludeChars,
    wordCount,
    separator,
    capitalizeWords,
    includeNumber,
  ]);

  // Generate on initialization and option change
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  // ─────────────────────────────────────────────────────────────
  //  Action Handlers
  // ─────────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!generatedValue) return;
    navigator.clipboard
      .writeText(generatedValue)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Clipboard copy failed", err);
      });
  }, [generatedValue]);

  const triggerRegenerate = () => {
    setIsRotating(true);
    generatePassword();
    setTimeout(() => setIsRotating(false), 600);
  };

  // ─────────────────────────────────────────────────────────────
  //  Strength Metrics Evaluation
  // ─────────────────────────────────────────────────────────────
  const getStrengthMetrics = (entropyBits: number) => {
    if (entropyBits < 40) {
      return {
        label: "Weak - Easy to Crack",
        colorClass: "bg-red-500",
        textColor: "text-red-500",
        bgLight: "bg-red-50/10",
        borderAccent: "border-red-500/30",
        progress: Math.min(100, (entropyBits / 40) * 33.3),
      };
    } else if (entropyBits < 70) {
      return {
        label: "Medium - Acceptable",
        colorClass: "bg-yellow-500",
        textColor: "text-yellow-500",
        bgLight: "bg-yellow-50/10",
        borderAccent: "border-yellow-500/30",
        progress: 33.3 + ((entropyBits - 40) / 30) * 33.3,
      };
    } else {
      return {
        label: "Strong - Highly Secure",
        colorClass: "bg-indigo-600",
        textColor: "text-indigo-400",
        bgLight: "bg-indigo-950/20",
        borderAccent: "border-indigo-500/30",
        progress: 66.6 + Math.min(33.4, ((entropyBits - 70) / 58) * 33.4),
      };
    }
  };

  const strength = getStrengthMetrics(entropy);

  return (
    <div className="w-full space-y-8">
      {/* ─────────────────────────────────────────────────────────────
          1. TWO-COLUMN DASHBOARD LAYOUT
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: INPUT CONTROLS (SPAN 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Choose Generation Mode */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setCard1Open(!card1Open)}
              className="w-full px-6 py-4 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all border-b border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Choose Generation Mode</h3>
              </div>
              {card1Open ? (
                <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              )}
            </button>
            {card1Open && (
              <div className="p-6 space-y-4">
                <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl w-full">
                  <button
                    onClick={() => setMode("random")}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                      mode === "random"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Random Password
                  </button>
                  <button
                    onClick={() => setMode("passphrase")}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                      mode === "passphrase"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Memorable Passphrase
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {mode === "random"
                    ? "Creates a highly complex, randomized sequence of letters, digits, and special characters. Best for logins saved in password managers."
                    : "Creates a readable, easy-to-remember phrase using combinations of real dictionary words. Best for master passwords or high-security logins typed manually."}
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Random Password Mode Options */}
          {mode === "random" && (
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setCard2Open(!card2Open)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all border-b border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Random Password Options</h3>
                </div>
                {card2Open ? (
                  <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                )}
              </button>
              {card2Open && (
                <div className="p-6 space-y-6">
                  {/* Length Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-500" />
                        <span>Character Length</span>
                      </label>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-lg">
                        {length}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={128}
                      value={length}
                      onChange={(e) => setLength(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Character Sets Grid */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-500" />
                      <span>Include Character Sets</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4">
                      <label className="flex items-center gap-3 cursor-pointer group py-2.5">
                        <input
                          type="checkbox"
                          checked={useUppercase}
                          onChange={(e) => setUseUppercase(e.target.checked)}
                          className="w-5 h-5 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-600 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          Uppercase (A-Z)
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group py-2.5">
                        <input
                          type="checkbox"
                          checked={useLowercase}
                          onChange={(e) => setUseLowercase(e.target.checked)}
                          className="w-5 h-5 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-600 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          Lowercase (a-z)
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group py-2.5">
                        <input
                          type="checkbox"
                          checked={useNumbers}
                          onChange={(e) => setUseNumbers(e.target.checked)}
                          className="w-5 h-5 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-600 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          Numbers (0-9)
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group py-2.5">
                        <input
                          type="checkbox"
                          checked={useSymbols}
                          onChange={(e) => setUseSymbols(e.target.checked)}
                          className="w-5 h-5 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-600 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          Symbols (!@#$%^&*)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Character Exclude Input */}
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-500" />
                      <span>Exclude Characters</span>
                    </label>
                    <input
                      type="text"
                      value={excludeChars}
                      onChange={(e) => setExcludeChars(e.target.value)}
                      placeholder="e.g. i, l, 1, o, 0, O"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-sm font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card 3: Memorable Passphrase Mode Options */}
          {mode === "passphrase" && (
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setCard3Open(!card3Open)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all border-b border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Memorable Passphrase Options</h3>
                </div>
                {card3Open ? (
                  <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                )}
              </button>
              {card3Open && (
                <div className="p-6 space-y-6">
                  {/* Word Count Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-500" />
                        <span>Word Count</span>
                      </label>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-lg">
                        {wordCount}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={10}
                      value={wordCount}
                      onChange={(e) => setWordCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Custom Separator input */}
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-500" />
                      <span>Custom Separator</span>
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                      placeholder="default: -"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-sm font-mono"
                    />
                  </div>

                  {/* Checklist options */}
                  <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer group py-2.5">
                      <input
                        type="checkbox"
                        checked={capitalizeWords}
                        onChange={(e) => setCapitalizeWords(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-600 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Capitalize First Letter of Each Word
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group mt-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={includeNumber}
                        onChange={(e) => setIncludeNumber(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-600 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Include Random Digit at End
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: STICKY PREVIEW & STRENGTH CARD (SPAN 4) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          <div className="bg-[#1e293b] text-white border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Shield className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm tracking-wide uppercase text-slate-300">Preview &amp; Security</h3>
            </div>

            {/* Output display block */}
            <div className="space-y-2">
              <div className="font-mono break-all bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-center text-lg select-all text-slate-900 font-bold min-h-[64px] flex items-center justify-center">
                {generatedValue || <span className="text-slate-400 italic font-normal">Select character sets</span>}
              </div>
            </div>

            {/* Strength meter and Shannon entropy indicator */}
            {generatedValue && (
              <div className={`p-4 rounded-xl border ${strength.borderAccent} ${strength.bgLight} space-y-3`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Entropy</span>
                  <span className={`text-xs font-bold ${strength.textColor} uppercase tracking-wider`}>
                    {entropy.toFixed(1)} bits
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.colorClass} transition-all duration-500`}
                    style={{ width: `${strength.progress}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>{strength.label}</span>
                </div>
              </div>
            )}

            {/* Copy & Regenerate Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                disabled={!generatedValue}
                className="flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy Securely</span>
                  </>
                )}
              </button>
              <button
                onClick={triggerRegenerate}
                title="Regenerate Password"
                className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white transition-all active:scale-[0.98] flex items-center justify-center shrink-0"
              >
                <RefreshCw className={`w-5 h-5 text-indigo-400 ${isRotating ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="text-[10px] text-slate-300 text-center leading-relaxed pt-2">
              Processing runs 100% locally. Passwords and settings never leave your browser.
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. BELOW-THE-FOLD SEO CONTENT (MD5 STRUCTURAL BLOCK MATCH)
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        {/* Card 1: What is a Secure Password? */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <span>What is a Secure Password?</span>
          </h2>
          <div className="space-y-4 text-slate-600">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              A truly secure password acts as your primary digital barrier against unauthorized access, credential stuffing, and high-speed automated brute-force attacks. In modern security landscapes, the strength of a password is not merely determined by its length, but by its overall mathematical entropy. Entropy measures the total randomness and unpredictability of a string of characters. While a short, complex password with mixed character types might seem secure, a longer, memorable passphrase composed of multiple random words often carries significantly higher entropy and proves exponentially harder for high-performance computing arrays to crack. Utilizing local, cryptographically secure pseudo-random generators ensures your passwords cannot be predicted or mathematically mapped by adversaries.
            </p>
          </div>
        </div>

        {/* Card 2: How to Generate Secure Passwords */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Hash className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Generate Secure Passwords</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: "01", title: "Choose Your Mode", body: "Toggle between a fully randomized character password or a memorable diceware passphrase." },
              { num: "02", title: "Set the Length", body: "Use the precision slider to scale from 8 up to 128 characters depending on your specific account requirements." },
              { num: "03", title: "Toggle Characters", body: "Enable or disable uppercase letters, lowercase letters, numbers, and high-vulnerability special symbols." },
              { num: "04", title: "Exclude Ambiguity", body: "Input characters you wish to omit, such as similar-looking letters and numbers (e.g., i, l, 1, o, 0, O) to prevent login errors." },
              { num: "05", title: "Check Security Metrics", body: "Observe the real-time Shannon Entropy bar as it changes from red (weak) to green (highly secure)." },
              { num: "06", title: "Copy Securely", body: "Click the copy button to transfer your new string directly to your clipboard using secure browser memory APIs." }
            ].map(({ num, title, body }) => (
              <div key={num} className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    {num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Password Security Best Practices */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Password Security Best Practices</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Use a Dedicated Password Manager", body: "Never write passwords down or save them in unencrypted text files. Utilize trusted managers to encrypt and store your database." },
              { title: "Enable Multi-Factor Authentication (MFA)", body: "A secure password is your first line of defense, but enabling 2FA or MFA provides a vital secondary security layer." },
              { title: "Eliminate Password Reuse", body: "If one service suffers a security breach, reused credentials allow hackers to instantly compromise your other accounts." },
              { title: "Prioritize Length Over Complexity", body: "Modern cracking rigs can quickly guess short complex strings. Passphrases of 4+ random words are vastly more secure." },
              { title: "Change Compromised Credentials", body: "Routinely check leak databases and update credentials immediately if your email is associated with a public breach." },
              { title: "Avoid Personal Information", body: "Never include names, birthdates, addresses, or pet names in your passwords, as these are easily targetable via social engineering." }
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                </div>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Frequently Asked Questions (FAQ) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Is it safe to generate passwords on this website?",
                a: "Yes. Our Password Generator runs 100% client-side inside your web browser using the native Web Crypto API (window.crypto.getRandomValues). No data is ever sent to our servers, and no password information ever traverses the network.",
              },
              {
                q: "What is password entropy and why does it matter?",
                a: "Password entropy measures the mathematical difficulty an attacker faces when attempting to guess your password through brute force. Higher entropy means a vastly larger search space, requiring billions of years to crack with modern supercomputers.",
              },
              {
                q: "Why are passphrases considered better than complex passwords?",
                a: "Passphrases use multiple random words to achieve extreme length, which exponentially increases entropy. They are incredibly difficult for computers to guess but remain highly readable and easy for humans to remember.",
              },
              {
                q: "How often should I change my master passwords?",
                a: "Modern cybersecurity guidelines suggest changing passwords only when there is evidence of a compromise or breach. Constantly changing passwords often leads to users choosing weaker, predictable variations.",
              },
              {
                q: "Can your tool generate completely offline passphrases?",
                a: "Yes. Because our tool relies entirely on local browser-based execution and a hardcoded dictionary array, the generator remains fully operational even if you disconnect your computer from the internet.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Why Use Our Password Generator? */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg text-white">
          <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <span>Why Use Our Password Generator?</span>
          </h2>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
            Our Advanced Password Generator is built specifically for users who demand absolute privacy and uncompromising security. Unlike standard generators that transmit configurations to external servers, our tool processes all parameters locally in your browser's RAM. We combine cryptographic-grade randomness with a beautiful visual interface, real-time entropy calculation, and custom passphrase options to deliver the most flexible and secure generator on the web.
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
              name: "Password Generator & Passphrase Creator",
              description: "Our Advanced Password Generator processes all parameters locally in your browser's RAM using standard secure character arrays and a built-in cryptographic pseudo-random generator (window.crypto.getRandomValues). Zero server-side transmission.",
              url: "https://www.twistertools.com/tools/password-tools/password-generator",
              applicationCategory: "SecurityApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript. Runs entirely offline in browser.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD"
              },
              featureList: [
                "Cryptographically secure randomness via window.crypto.getRandomValues",
                "Two modes: Random Password and Memorable Passphrase",
                "Configurable length from 8 to 128 characters",
                "Custom character set checkboxes and character exclusions",
                "Memorable passphrase generator with exactly 50 curated words",
                "Real-time Shannon entropy calculation and strength visualization",
                "Zero server-side transmission for absolute privacy"
              ]
            })
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
                  name: "Is it safe to generate passwords on this website?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Our Password Generator runs 100% client-side inside your web browser using the native Web Crypto API (window.crypto.getRandomValues). No data is ever sent to our servers, and no password information ever traverses the network."
                  }
                },
                {
                  "@type": "Question",
                  name: "What is password entropy and why does it matter?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Password entropy measures the mathematical difficulty an attacker faces when attempting to guess your password through brute force. Higher entropy means a vastly larger search space, requiring billions of years to crack with modern supercomputers."
                  }
                },
                {
                  "@type": "Question",
                  name: "Why are passphrases considered better than complex passwords?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Passphrases use multiple random words to achieve extreme length, which exponentially increases entropy. They are incredibly difficult for computers to guess but remain highly readable and easy for humans to remember."
                  }
                },
                {
                  "@type": "Question",
                  name: "How often should I change my master passwords?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Modern cybersecurity guidelines suggest changing passwords only when there is evidence of a compromise or breach. Constantly changing passwords often leads to users choosing weaker, predictable variations."
                  }
                },
                {
                  "@type": "Question",
                  name: "Can your tool generate completely offline passphrases?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Because our tool relies entirely on local browser-based execution and a hardcoded dictionary array, the generator remains fully operational even if you disconnect your computer from the internet."
                  }
                }
              ]
            })
          }}
        />
      </div>
    </div>
  );
}
