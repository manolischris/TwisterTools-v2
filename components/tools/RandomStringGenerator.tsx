"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    Key,
    Copy,
    Check,
    RefreshCw,
    Sliders,
    Shield,
    Zap,
    HelpCircle,
    Database,
    Terminal,
    Settings,
    Lock,
    Layers,
    Code,
    Hash,
    Download,
    Cpu,
    Server,
    FileCode,
    CheckCircle2,
} from "lucide-react";

// ── Types & Constants ──

type OutputFormat = "hex" | "base64" | "base64url" | "binary";

interface CharacterSetOptions {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    ambiguous: boolean; // Exclude O, 0, I, 1, l, etc.
}

interface HashAlgorithms {
    md5: boolean;
    sha1: boolean;
    sha256: boolean;
    sha512: boolean;
}

const CHAR_SETS = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    ambiguousChars: "O0I1lI",
};

// ── Crypto Helper Functions ──

function getCryptoRandomBuffer(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    if (typeof window !== "undefined" && window.crypto) {
        window.crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    return bytes;
}

function generateRandomString(
    length: number,
    options: CharacterSetOptions
): string {
    let charPool = "";

    if (options.uppercase) charPool += CHAR_SETS.uppercase;
    if (options.lowercase) charPool += CHAR_SETS.lowercase;
    if (options.numbers) charPool += CHAR_SETS.numbers;
    if (options.symbols) charPool += CHAR_SETS.symbols;

    if (options.ambiguous && charPool.length > 0) {
        const ambSet = new Set(CHAR_SETS.ambiguousChars.split(""));
        charPool = charPool
            .split("")
            .filter((char) => !ambSet.has(char))
            .join("");
    }

    if (!charPool) return "";

    const bytes = getCryptoRandomBuffer(length);
    let result = "";
    const poolLen = charPool.length;

    for (let i = 0; i < length; i++) {
        result += charPool[bytes[i] % poolLen];
    }

    return result;
}

// Client-side Cryptographic Hash Generators (Web Crypto API)
async function computeHash(
    algorithm: "SHA-1" | "SHA-256" | "SHA-512",
    text: string
): Promise<string> {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
        return "Web Crypto API not available";
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Pure JS MD5 Implementation for browser execution
function computeMD5(string: string): string {
    function rotateLeft(lValue: number, iShiftBits: number) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX: number, lY: number) {
        const lX4 = lX & 0x40000000;
        const lY4 = lY & 0x40000000;
        const lX8 = lX & 0x80000000;
        const lY8 = lY & 0x80000000;
        const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
        if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
            return lResult ^ 0x40000000 ^ lX8 ^ lY8;
        }
        return lResult ^ lX8 ^ lY8;
    }
    function F(x: number, y: number, z: number) {
        return (x & y) | (~x & z);
    }
    function G(x: number, y: number, z: number) {
        return (x & z) | (y & ~z);
    }
    function H(x: number, y: number, z: number) {
        return x ^ y ^ z;
    }
    function I(x: number, y: number, z: number) {
        return y ^ (x | ~z);
    }
    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function convertToWordArray(str: string) {
        let lMessageLength = str.length;
        let lNumberOfWords_temp1 = lMessageLength + 8;
        let lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        let lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        let lWordArray = Array(lNumberOfWords - 1);
        let lBytePosition = 0;
        let lWordPosition = 0;
        while (lBytePosition < lMessageLength) {
            lWordPosition = (lBytePosition - (lBytePosition % 4)) / 4;
            lBytePosition = lBytePosition * 8;
            lWordArray[lWordPosition] = (lWordArray[lWordPosition] | (str.charCodeAt(lBytePosition / 8) << (lBytePosition % 32)));
            lBytePosition = lBytePosition / 8 + 1;
        }
        lWordPosition = (lBytePosition - (lBytePosition % 4)) / 4;
        lBytePosition = lBytePosition * 8;
        lWordArray[lWordPosition] = lWordArray[lWordPosition] | (0x80 << (lBytePosition % 32));
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }

    function wordToHex(lValue: number) {
        let WordToHexValue = "",
            WordToHexValue_temp = "",
            lByte,
            lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
        return WordToHexValue;
    }

    let x = convertToWordArray(string);
    let k, AA, BB, CC, DD, a, b, c, d;
    let S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    let S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    let S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    let S41 = 6, S42 = 10, S43 = 15, S44 = 21;

    a = 0x67452301; b = 0xefcdab89; c = 0x98badcfe; d = 0x10325476;

    for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
        d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
        c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
        b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
        a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
        d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
        c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
        b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
        a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
        d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
        c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
        b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
        a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
        d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
        c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
        b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
        a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
        d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
        c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
        b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
        a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
        d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
        b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
        a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
        d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
        c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
        b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
        a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
        d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
        c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
        b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
        a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
        d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
        c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
        b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
        a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
        d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
        c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
        b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
        a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
        d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
        c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
        b = HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
        a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
        d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
        c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
        b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
        a = II(a, b, c, d, x[k + 0], S41, 0xf4292244);
        d = II(d, a, b, c, x[k + 3], S42, 0x432aff97);
        c = II(c, d, a, b, x[k + 10], S43, 0xab9423a7);
        b = II(b, c, d, a, x[k + 1], S44, 0xfc93a039);
        a = II(a, b, c, d, x[k + 6], S41, 0x655b59c3);
        d = II(d, a, b, c, x[k + 9], S42, 0x8f0ccc92);
        c = II(c, d, a, b, x[k + 14], S43, 0xffeff47d);
        b = II(b, c, d, a, x[k + 5], S44, 0x85845dd1);
        a = II(a, b, c, d, x[k + 12], S41, 0x6fa87e4f);
        d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
        c = II(c, d, a, b, x[k + 2], S43, 0xa3014314);
        b = II(b, c, d, a, x[k + 7], S44, 0x4e0811a1);
        a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
        d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
        c = II(c, d, a, b, x[k + 14], S43, 0x2ad7d2bb);
        b = II(b, c, d, a, x[k + 1], S44, 0xeb86d391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

// Calculate Entropy in Bits: Length * log2(Pool Size)
function calculateEntropy(length: number, options: CharacterSetOptions): number {
    let poolSize = 0;
    if (options.uppercase) poolSize += 26;
    if (options.lowercase) poolSize += 26;
    if (options.numbers) poolSize += 10;
    if (options.symbols) poolSize += 32;

    if (options.ambiguous && poolSize > 0) {
        poolSize = Math.max(1, poolSize - 6);
    }

    if (poolSize === 0 || length === 0) return 0;
    return Math.round(length * Math.log2(poolSize));
}

export default function RandomStringGenerator() {
    // ── Core Config State ──
    const [stringLength, setStringLength] = useState<number>(32);
    const [quantity, setQuantity] = useState<number>(5);
    const [prefix, setPrefix] = useState<string>("");
    const [suffix, setSuffix] = useState<string>("");

    const [charSets, setCharSets] = useState<CharacterSetOptions>({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
        ambiguous: true,
    });

    const [hashesToCompute, setHashesToCompute] = useState<HashAlgorithms>({
        md5: false,
        sha1: false,
        sha256: true,
        sha512: false,
    });

    // ── Outputs ──
    const [generatedItems, setGeneratedItems] = useState<
        { id: string; raw: string; hashes: Record<string, string> }[]
    >([]);

    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);

    // Sanitized Number Input Setter
    const handleNumberInputChange = (
        setter: (val: number) => void,
        rawVal: string,
        min: number,
        max: number
    ) => {
        const sanitized = rawVal.replace(/^0+/, "");
        if (sanitized === "") {
            setter(min);
            return;
        }
        const parsed = parseInt(sanitized, 10);
        if (isNaN(parsed)) {
            setter(min);
        } else {
            setter(Math.min(Math.max(parsed, min), max));
        }
    };

    // ── Generation Logic ──
    const generateKeys = useCallback(async () => {
        const items = [];
        for (let i = 0; i < quantity; i++) {
            const core = generateRandomString(stringLength, charSets);
            const fullString = `${prefix}${core}${suffix}`;

            const hashes: Record<string, string> = {};
            if (hashesToCompute.md5) {
                hashes["MD5"] = computeMD5(fullString);
            }
            if (hashesToCompute.sha1) {
                hashes["SHA-1"] = await computeHash("SHA-1", fullString);
            }
            if (hashesToCompute.sha256) {
                hashes["SHA-256"] = await computeHash("SHA-256", fullString);
            }
            if (hashesToCompute.sha512) {
                hashes["SHA-512"] = await computeHash("SHA-512", fullString);
            }

            items.push({
                id: `${i}-${Date.now()}`,
                raw: fullString,
                hashes,
            });
        }
        setGeneratedItems(items);
    }, [quantity, stringLength, charSets, prefix, suffix, hashesToCompute]);

    useEffect(() => {
        generateKeys();
    }, [generateKeys]);

    // ── Copy Handlers ──
    const copySingle = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1500);
        } catch {
            /* silent */
        }
    };

    const copyAllToClipboard = async () => {
        if (generatedItems.length === 0) return;
        const allText = generatedItems
            .map((item) => {
                let block = item.raw;
                const hashKeys = Object.keys(item.hashes);
                if (hashKeys.length > 0) {
                    hashKeys.forEach((hk) => {
                        block += `\n  ${hk}: ${item.hashes[hk]}`;
                    });
                }
                return block;
            })
            .join("\n\n");

        try {
            await navigator.clipboard.writeText(allText);
            setCopiedAll(true);
            setTimeout(() => setCopiedAll(false), 2000);
        } catch {
            /* silent */
        }
    };

    const downloadAsFile = () => {
        if (generatedItems.length === 0) return;
        const content = generatedItems.map((item) => item.raw).join("\n");
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `keys-${Date.now()}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Entropy evaluation
    const entropyBits = calculateEntropy(stringLength, charSets);
    let entropyLabel = "Weak";
    let entropyColor = "text-rose-500 bg-rose-50 border-rose-200";
    if (entropyBits >= 128) {
        entropyLabel = "Cryptographic Grade (Ultra-High)";
        entropyColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (entropyBits >= 64) {
        entropyLabel = "Strong Security";
        entropyColor = "text-indigo-700 bg-indigo-50 border-indigo-200";
    } else if (entropyBits >= 32) {
        entropyLabel = "Moderate / Standard";
        entropyColor = "text-amber-700 bg-amber-50 border-amber-200";
    }

    return (
        <div className="w-full space-y-8">
            {/* ── Dashboard Grid ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: CONFIGURATION ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        {/* Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Key className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">
                                        Key & String Generator Controls
                                    </h2>
                                    <p className="text-xs text-indigo-200">
                                        Entropy: {entropyBits} Bits ({entropyLabel})
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Length & Batch Quantity */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        String Length ({stringLength} chars)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min={4}
                                            max={256}
                                            value={stringLength}
                                            onChange={(e) => setStringLength(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <input
                                            type="number"
                                            min={4}
                                            max={256}
                                            value={stringLength}
                                            onChange={(e) =>
                                                handleNumberInputChange(
                                                    setStringLength,
                                                    e.target.value,
                                                    4,
                                                    256
                                                )
                                            }
                                            className="w-16 px-2 py-1 text-sm font-mono border border-slate-200 rounded-lg text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[36px]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Batch Quantity ({quantity} items)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={quantity}
                                        onChange={(e) =>
                                            handleNumberInputChange(
                                                setQuantity,
                                                e.target.value,
                                                1,
                                                100
                                            )
                                        }
                                        className="w-full px-3 py-1.5 text-sm font-mono border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[36px]"
                                    />
                                </div>
                            </div>

                            {/* Character Sets Toggles */}
                            <div className="space-y-2.5">
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Character Selection Rules
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {[
                                        { key: "uppercase", label: "Uppercase (A-Z)" },
                                        { key: "lowercase", label: "Lowercase (a-z)" },
                                        { key: "numbers", label: "Numbers (0-9)" },
                                        { key: "symbols", label: "Symbols (!@#$)" },
                                    ].map(({ key, label }) => {
                                        const k = key as keyof CharacterSetOptions;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() =>
                                                    setCharSets((prev) => ({
                                                        ...prev,
                                                        [k]: !prev[k],
                                                    }))
                                                }
                                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${charSets[k]
                                                    ? "bg-indigo-50/70 border-indigo-200 text-indigo-700 font-semibold"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <span>{label}</span>
                                                <div
                                                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${charSets[k]
                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                        : "border-slate-300 bg-white"
                                                        }`}
                                                >
                                                    {charSets[k] && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() =>
                                        setCharSets((prev) => ({
                                            ...prev,
                                            ambiguous: !prev.ambiguous,
                                        }))
                                    }
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all mt-2 ${charSets.ambiguous
                                        ? "bg-amber-50/70 border-amber-200 text-amber-800 font-semibold"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        Exclude Ambiguous Characters (O, 0, I, 1, l)
                                    </span>
                                    <div
                                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${charSets.ambiguous
                                            ? "bg-amber-600 border-amber-600 text-white"
                                            : "border-slate-300 bg-white"
                                            }`}
                                    >
                                        {charSets.ambiguous && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </button>
                            </div>

                            {/* Prefix & Suffix Customization */}
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Custom Prefix
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. sk_live_"
                                        value={prefix}
                                        onChange={(e) => setPrefix(e.target.value)}
                                        className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Custom Suffix
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. _v2"
                                        value={suffix}
                                        onChange={(e) => setSuffix(e.target.value)}
                                        className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                                    />
                                </div>
                            </div>

                            {/* Cryptographic Hash Calculations */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Real-Time Hash Digest Mapping
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { key: "sha256", label: "SHA-256" },
                                        { key: "sha512", label: "SHA-512" },
                                        { key: "md5", label: "MD5" },
                                        { key: "sha1", label: "SHA-1" },
                                    ].map(({ key, label }) => {
                                        const hk = key as keyof HashAlgorithms;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() =>
                                                    setHashesToCompute((prev) => ({
                                                        ...prev,
                                                        [hk]: !prev[hk],
                                                    }))
                                                }
                                                className={`px-3 py-2 rounded-xl border text-xs font-mono font-medium transition-all ${hashesToCompute[hk]
                                                    ? "bg-slate-900 border-slate-900 text-white font-bold shadow-sm"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Regeneration Action Button */}
                            <button
                                onClick={generateKeys}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg min-h-[44px]"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Regenerate New Keys
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: OUTPUT & HASHES ══════════════════ */}
                <div>
                    <div className="sticky top-4 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                            {/* Output Gradient Header */}
                            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-3.5 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-indigo-200" />
                                    <span className="text-sm font-semibold">
                                        Generated Output Stream ({generatedItems.length})
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={copyAllToClipboard}
                                        disabled={generatedItems.length === 0}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors disabled:opacity-50"
                                    >
                                        {copiedAll ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                        {copiedAll ? "Copied All!" : "Copy Batch"}
                                    </button>
                                    <button
                                        onClick={downloadAsFile}
                                        disabled={generatedItems.length === 0}
                                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition-colors disabled:opacity-50"
                                        title="Export as .txt"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Generated Keys Display List */}
                                <div className="h-[450px] overflow-y-auto pr-1 space-y-3 font-mono text-xs">
                                    {generatedItems.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-400">
                                            No strings generated. Check parameters.
                                        </div>
                                    ) : (
                                        generatedItems.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 group hover:border-indigo-300 transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-slate-800 font-bold break-all select-all">
                                                        {item.raw}
                                                    </span>
                                                    <button
                                                        onClick={() => copySingle(item.raw, idx)}
                                                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 transition-colors flex-shrink-0"
                                                        title="Copy string"
                                                    >
                                                        {copiedIndex === idx ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Hash Mapping Block */}
                                                {Object.keys(item.hashes).length > 0 && (
                                                    <div className="border-t border-slate-200/80 pt-2 mt-2 space-y-1 text-[11px] text-slate-600">
                                                        {Object.entries(item.hashes).map(([algo, hashVal]) => (
                                                            <div
                                                                key={algo}
                                                                className="flex items-center justify-between gap-2 bg-white/80 px-2 py-1 rounded border border-slate-100"
                                                            >
                                                                <span className="font-semibold text-indigo-600 flex-shrink-0">
                                                                    {algo}:
                                                                </span>
                                                                <span className="truncate font-mono text-slate-700">
                                                                    {hashVal}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Metrics Summary Card */}
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                                            Total Keys
                                        </span>
                                        <span className="text-xs font-mono font-bold text-slate-800">
                                            {generatedItems.length}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                                            Chars/Key
                                        </span>
                                        <span className="text-xs font-mono font-bold text-slate-800">
                                            {stringLength + prefix.length + suffix.length}
                                        </span>
                                    </div>
                                    <div className={`rounded-lg p-2 border ${entropyColor}`}>
                                        <span className="block text-[10px] uppercase font-bold opacity-80">
                                            Entropy
                                        </span>
                                        <span className="text-xs font-mono font-bold">
                                            {entropyBits} bits
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO CONTENT CARDS (HIGH-DENSITY INFORMATIONAL CONTENT)
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8">
                {/* Card 1: Enterprise Randomness Architecture & Cryptographic Foundations */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Cryptographic Randomness & Entropy Foundations</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Generating secure random keys and hash values requires high entropy and non-deterministic pseudo-random number generators (PRNGs). Standard programming language math primitives (such as JavaScript&apos;s <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">Math.random()</code>) utilize PRNG algorithms like Xorshift128+, which are deterministic, predictable, and entirely unsuitable for security-sensitive applications like session tokens, API secret keys, database IDs, or password salts.
                        </p>
                        <p>
                            TwisterTools&apos; Random String & Hash Key Generator relies strictly on the Web Crypto API&apos;s <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">crypto.getRandomValues()</code> method. This native browser interface directly queries the underlying operating system kernel&apos;s entropy pool (such as <code className="font-mono text-xs">/dev/urandom</code> on Unix-like systems or <code className="font-mono text-xs">CryptGenRandom</code> on Windows). This guarantees CSPRNG (Cryptographically Secure Pseudo-Random Number Generation) randomness that meets strict industry standards, including NIST SP 800-90A and RFC 4086.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 pt-2">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
                                    <Lock className="w-4 h-4" />
                                    <span>100% Client-Side Processing</span>
                                </div>
                                <p className="text-xs text-slate-600">
                                    Zero network payload transmission. All strings, secret keys, and cryptographic hashes are calculated entirely in local browser memory.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
                                    <Cpu className="w-4 h-4" />
                                    <span>CSPRNG Native Engine</span>
                                </div>
                                <p className="text-xs text-slate-600">
                                    Leverages hardware-level OS entropy pools via Web Crypto API to ensure statistical uniformity and eliminate key predictability.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
                                    <Zap className="w-4 h-4" />
                                    <span>Real-Time Hash Digesting</span>
                                </div>
                                <p className="text-xs text-slate-600">
                                    Simultaneously computes corresponding SHA-256, SHA-512, MD5, and SHA-1 checksums directly alongside generated text strings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Technical Specifications & Hash Algorithms */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Hash className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Cryptographic Hashing Algorithms & Use Cases</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Cryptographic hash functions take an arbitrary input string and produce a fixed-size byte string (digest). These functions are one-way (irreversible) and deterministic, ensuring that any variation in the input string completely alters the output hash (known as the avalanche effect).
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                algo: "SHA-256 (Secure Hash Algorithm 256-bit)",
                                desc: "Part of the SHA-2 family specified by NIST. Produces a 256-bit (64-character hexadecimal) output. It is the modern industry standard for API key authentication signatures, HMAC validation, JWT signing, and Bitcoin block verification.",
                                badge: "Standard",
                            },
                            {
                                algo: "SHA-512 (Secure Hash Algorithm 512-bit)",
                                desc: "Generates a 512-bit (128-character hexadecimal) digest. Provides ultra-high collision resistance and optimal performance on 64-bit hardware architectures, ideal for high-security enterprise secrets and database integrity verification.",
                                badge: "High-Security",
                            },
                            {
                                algo: "SHA-1 (Legacy 160-bit Hash)",
                                desc: "Produces a 160-bit (40-character hexadecimal) hash. While collision vulnerabilities make it deprecated for cryptographic security, it remains widely used for non-cryptographic identifiers like Git commit references and legacy system checksums.",
                                badge: "Legacy",
                            },
                            {
                                algo: "MD5 (Message Digest Algorithm 5)",
                                desc: "A widely implemented 128-bit (32-character hexadecimal) hash function. Useful for fast content checksums, caching keys, file integrity verification, and database partitioning indexes where cryptographic collision protection is not required.",
                                badge: "Checksums",
                            },
                        ].map(({ algo, desc, badge }) => (
                            <div
                                key={algo}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 text-sm font-mono text-indigo-600">
                                        {algo}
                                    </h3>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                                        {badge}
                                    </span>
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 3: Cryptographic Entropy Comparison Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Cryptographic Entropy & Key Strength Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Information-theoretic entropy measures the randomness and unpredictability of a key, calculated in bits ($E = L \times \log_2(N)$, where $L$ is length and $N$ is character pool size). Higher bit entropy increases resistance against exhaustive brute-force attacks.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Key Length</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Character Set Configuration</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Calculated Entropy</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Recommended Deployment Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["8 Chars", "Alphanumeric (62 pool size)", "~47.6 Bits", "Low Security / Non-Sensitive Tokens"],
                                    ["16 Chars", "Alphanumeric (62 pool size)", "~95.2 Bits", "Standard API Access Keys"],
                                    ["32 Chars", "Alphanumeric (62 pool size)", "~190.5 Bits", "Enterprise API Secrets & OAuth Keys"],
                                    ["32 Chars", "Alphanumeric + Symbols (94 pool size)", "~210.0 Bits", "Master Symmetric Cipher Keys"],
                                    ["64 Chars", "Full Extended Set (94 pool size)", "~420.0 Bits", "Quantum-Resistant Key Material"],
                                ].map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                                            } hover:bg-slate-100 transition-colors`}
                                    >
                                        {row.map((cell, cellIdx) => (
                                            <td
                                                key={cellIdx}
                                                className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono"
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

                {/* Card 4: Production Integration Workflows & Code Examples */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Developer Integration Guidelines & System Architecture</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Integrating random key generation and hash calculation into modern cloud stacks requires following established security patterns. Below are recommended standard implementations across backend environments:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2">
                                <div className="text-indigo-400 font-bold flex items-center gap-2">
                                    <Terminal className="w-3.5 h-3.5" /> Node.js Crypto CSPRNG
                                </div>
                                <pre className="overflow-x-auto text-slate-300">
                                    {`const crypto = require('crypto');

// Generate 32-byte (256-bit) secret key
const apiKey = crypto.randomBytes(32).toString('hex');

// Calculate SHA-256 signature
const hash = crypto.createHash('sha256')
  .update(apiKey)
  .digest('hex');`}
                                </pre>
                            </div>

                            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2">
                                <div className="text-indigo-400 font-bold flex items-center gap-2">
                                    <Terminal className="w-3.5 h-3.5" /> Python Secrets Module
                                </div>
                                <pre className="overflow-x-auto text-slate-300">
                                    {`import secrets
import hashlib

# Generate URL-safe 32-byte secret token
token = secrets.token_urlsafe(32)

# Compute SHA-256 hash digest
token_hash = hashlib.sha256(
    token.encode('utf-8')
).hexdigest()`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 5: Frequently Asked Questions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-5">
                        {[
                            {
                                q: "Are the generated keys or hashes stored or transmitted to any server?",
                                a: "No. All generation, entropy byte sampling, and cryptographic hashing logic runs entirely inside your web browser via the native Web Crypto API. No string data ever leaves your device or touches an external server.",
                            },
                            {
                                q: "Why is excluding ambiguous characters recommended for key generation?",
                                a: "Ambiguous characters like 'O', '0', 'I', '1', and 'l' look identical in many standard system fonts. Excluding these characters prevents user confusion, typos, and transcription errors when keys must be read, copied, or manually entered.",
                            },
                            {
                                q: "What is the difference between Math.random() and crypto.getRandomValues()?",
                                a: "Math.random() uses a non-cryptographic pseudo-random number generator (PRNG) that is predictable once enough sequence values are observed. crypto.getRandomValues() relies on hardware-level entropy sources supplied by the OS kernel, ensuring true non-deterministic cryptographically secure output (CSPRNG).",
                            },
                            {
                                q: "What entropy length should I select for production API secret keys?",
                                a: "NIST standards recommend a minimum of 128 bits of entropy for modern secret keys. This threshold is achieved by generating at least a 22-character alphanumeric key or a 32-character standard hexadecimal key.",
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
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">
                                    {a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* JSON-LD Structured Metadata */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        {
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            name: "Random String & Hash Key Generator",
                            applicationCategory: "DeveloperApplication",
                            operatingSystem: "All",
                            description:
                                "Generate CSPRNG random strings, secret keys, password salts, and calculated cryptographic hash digests (SHA-256, SHA-512, MD5) completely in your browser.",
                            offers: {
                                "@type": "Offer",
                                price: "0",
                                priceCurrency: "USD",
                            },
                        },
                        {
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: [
                                {
                                    "@type": "Question",
                                    name: "Are the generated keys or hashes stored or transmitted to any server?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "No. All generation, entropy byte sampling, and cryptographic hashing logic runs entirely inside your web browser via the native Web Crypto API. No string data ever leaves your device or touches an external server.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "Why is excluding ambiguous characters recommended for key generation?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "Ambiguous characters like 'O', '0', 'I', '1', and 'l' look identical in many standard system fonts. Excluding these characters prevents user confusion, typos, and transcription errors when keys must be read, copied, or manually entered.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "What is the difference between Math.random() and crypto.getRandomValues()?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "Math.random() uses a non-cryptographic pseudo-random number generator (PRNG) that is predictable once enough sequence values are observed. crypto.getRandomValues() relies on hardware-level entropy sources supplied by the OS kernel, ensuring true non-deterministic cryptographically secure output (CSPRNG).",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "What entropy length should I select for production API secret keys?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "NIST standards recommend a minimum of 128 bits of entropy for modern secret keys. This threshold is achieved by generating at least a 22-character alphanumeric key or a 32-character standard hexadecimal key.",
                                    },
                                },
                            ],
                        },
                    ]),
                }}
            />
        </div>
    );
}